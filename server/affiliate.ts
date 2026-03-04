import { randomBytes } from 'crypto';
import { db } from './db';
import { 
  affiliateReferrals, affiliateCommissions, users,
  AFFILIATE_TIERS,
  type AffiliateReferral, type AffiliateCommission
} from '@shared/schema';
import { eq, and, desc, sql, count } from 'drizzle-orm';
import { createTrustStamp } from './hallmark';

export function generateUniqueHash(): string {
  return randomBytes(12).toString('hex');
}

export function computeTier(convertedCount: number): typeof AFFILIATE_TIERS[number] {
  const sorted = [...AFFILIATE_TIERS].sort((a, b) => b.minReferrals - a.minReferrals);
  return sorted.find(t => convertedCount >= t.minReferrals) ?? AFFILIATE_TIERS[0];
}

export async function ensureUserHash(userId: string): Promise<string> {
  const [user] = await db.select({ uniqueHash: users.uniqueHash }).from(users).where(eq(users.id, userId)).limit(1);
  if (user?.uniqueHash) return user.uniqueHash;

  const hash = generateUniqueHash();
  await db.update(users).set({ uniqueHash: hash }).where(eq(users.id, userId));
  return hash;
}

export async function getAffiliateDashboard(userId: string) {
  const userHash = await ensureUserHash(userId);

  const referrals = await db.select().from(affiliateReferrals)
    .where(eq(affiliateReferrals.referralHash, userHash))
    .orderBy(desc(affiliateReferrals.createdAt));

  const convertedCount = referrals.filter(r => r.status === 'converted').length;
  const tier = computeTier(convertedCount);

  const [userRow] = await db.select({ id: users.id }).from(users).where(eq(users.uniqueHash, userHash)).limit(1);
  const numericUserId = userRow ? parseInt(userRow.id) : 0;

  const commissions = await db.select().from(affiliateCommissions)
    .where(eq(affiliateCommissions.referrerId, numericUserId))
    .orderBy(desc(affiliateCommissions.createdAt));

  const pendingEarnings = commissions
    .filter(c => c.status === 'pending')
    .reduce((sum, c) => sum + parseFloat(c.amount), 0);

  const paidEarnings = commissions
    .filter(c => c.status === 'paid')
    .reduce((sum, c) => sum + parseFloat(c.amount), 0);

  const totalEarnings = pendingEarnings + paidEarnings;

  return {
    userHash,
    tier: tier.tier,
    commissionRate: tier.rate,
    totalReferrals: referrals.length,
    convertedReferrals: convertedCount,
    pendingReferrals: referrals.filter(r => r.status === 'pending').length,
    pendingEarnings: pendingEarnings.toFixed(2),
    paidEarnings: paidEarnings.toFixed(2),
    totalEarnings: totalEarnings.toFixed(2),
    referralLink: `https://orby.tlid.io/ref/${userHash}`,
    crossPlatformLinks: {
      orbyCommander: `https://orby.tlid.io/ref/${userHash}`,
      trustHub: `https://trusthub.tlid.io/ref/${userHash}`,
      orbit: `https://orbit.tlid.io/ref/${userHash}`,
    },
    recentReferrals: referrals.slice(0, 10),
    recentCommissions: commissions.slice(0, 10),
    tiers: AFFILIATE_TIERS,
  };
}

export async function getAffiliateLink(userId: string) {
  const userHash = await ensureUserHash(userId);
  return {
    referralHash: userHash,
    referralLink: `https://orby.tlid.io/ref/${userHash}`,
    crossPlatformLinks: {
      orbyCommander: `https://orby.tlid.io/ref/${userHash}`,
      trustHub: `https://trusthub.tlid.io/ref/${userHash}`,
      orbit: `https://orbit.tlid.io/ref/${userHash}`,
    },
  };
}

export async function trackReferral(referralHash: string, platform: string = 'orby-commander'): Promise<AffiliateReferral | null> {
  const [referrer] = await db.select({ id: users.id }).from(users).where(eq(users.uniqueHash, referralHash)).limit(1);
  if (!referrer) return null;

  const [referral] = await db.insert(affiliateReferrals).values({
    referrerId: parseInt(referrer.id),
    referralHash,
    platform,
    status: 'pending',
  }).returning();

  return referral;
}

export async function convertReferral(referralId: number, referredUserId: number): Promise<void> {
  await db.update(affiliateReferrals).set({
    referredUserId: referredUserId,
    status: 'converted',
    convertedAt: new Date(),
  }).where(eq(affiliateReferrals.id, referralId));

  await createTrustStamp({
    userId: referredUserId,
    category: 'affiliate-referral-converted',
    data: {
      referralId,
      referredUserId,
      platform: 'orby-commander',
    },
  });
}

export async function requestPayout(userId: string): Promise<{ success: boolean; message: string; amount?: string }> {
  const userHash = await ensureUserHash(userId);

  const pendingCommissions = await db.select().from(affiliateCommissions)
    .where(and(
      eq(affiliateCommissions.referrerId, parseInt(userId)),
      eq(affiliateCommissions.status, 'pending'),
    ));

  const totalPending = pendingCommissions.reduce((sum, c) => sum + parseFloat(c.amount), 0);

  if (totalPending < 10) {
    return { success: false, message: `Minimum payout is 10 SIG. You have ${totalPending.toFixed(2)} SIG pending.` };
  }

  for (const commission of pendingCommissions) {
    await db.update(affiliateCommissions).set({ status: 'processing' }).where(eq(affiliateCommissions.id, commission.id));
  }

  await createTrustStamp({
    userId: parseInt(userId),
    category: 'affiliate-payout-request',
    data: {
      amount: totalPending.toFixed(2),
      currency: 'SIG',
      commissionsCount: pendingCommissions.length,
    },
  });

  return { success: true, message: `Payout of ${totalPending.toFixed(2)} SIG requested. Processing within 48 hours.`, amount: totalPending.toFixed(2) };
}
