import { createHash, randomBytes } from 'crypto';
import { db } from './db';
import { 
  hallmarks, trustStamps, hallmarkCounter,
  TRUST_LAYER_APP_PREFIX, TRUST_LAYER_APP_NAME, TRUST_LAYER_DOMAIN, TRUST_LAYER_PARENT_GENESIS,
  type Hallmark, type TrustStamp
} from '@shared/schema';
import { eq, desc, sql } from 'drizzle-orm';

const PREFIX = TRUST_LAYER_APP_PREFIX;
const COUNTER_ID = `${PREFIX.toLowerCase()}-master`;

function generateSimulatedTxHash(): string {
  return '0x' + randomBytes(32).toString('hex');
}

function generateSimulatedBlockHeight(): string {
  return String(Math.floor(1000000 + Math.random() * 9000000));
}

function hashPayload(payload: Record<string, unknown>): string {
  const str = JSON.stringify(payload);
  return createHash('sha256').update(str).digest('hex');
}

function formatHallmarkId(sequence: number): string {
  return `${PREFIX}-${String(sequence).padStart(8, '0')}`;
}

async function getNextSequence(): Promise<number> {
  const result = await db
    .insert(hallmarkCounter)
    .values({ id: COUNTER_ID, currentSequence: '1' })
    .onConflictDoUpdate({
      target: hallmarkCounter.id,
      set: {
        currentSequence: sql`(CAST(${hallmarkCounter.currentSequence} AS INTEGER) + 1)::TEXT`
      }
    })
    .returning();
  
  return parseInt(result[0].currentSequence, 10);
}

export async function generateHallmark(opts: {
  userId?: number;
  appId: string;
  productName: string;
  releaseType: string;
  metadata?: Record<string, unknown>;
}): Promise<Hallmark> {
  const seq = await getNextSequence();
  const thId = formatHallmarkId(seq);

  const payload: Record<string, unknown> = {
    thId,
    userId: opts.userId ?? null,
    appId: opts.appId,
    appName: TRUST_LAYER_APP_NAME,
    productName: opts.productName,
    releaseType: opts.releaseType,
    timestamp: new Date().toISOString(),
  };

  const dataHash = hashPayload(payload);
  const txHash = generateSimulatedTxHash();
  const blockHeight = generateSimulatedBlockHeight();
  const verificationUrl = `https://${TRUST_LAYER_DOMAIN}/api/hallmark/${thId}/verify`;

  const [hallmark] = await db.insert(hallmarks).values({
    thId,
    userId: opts.userId ?? null,
    appId: opts.appId,
    appName: TRUST_LAYER_APP_NAME,
    productName: opts.productName,
    releaseType: opts.releaseType,
    metadata: opts.metadata ?? null,
    dataHash,
    txHash,
    blockHeight,
    verificationUrl,
    hallmarkId: seq,
  }).returning();

  return hallmark;
}

export async function createTrustStamp(opts: {
  userId?: number;
  category: string;
  data: Record<string, unknown>;
}): Promise<TrustStamp> {
  const stampData = {
    ...opts.data,
    appContext: 'orby-commander',
    timestamp: new Date().toISOString(),
  };

  const dataHash = hashPayload(stampData);
  const txHash = generateSimulatedTxHash();
  const blockHeight = generateSimulatedBlockHeight();

  const [stamp] = await db.insert(trustStamps).values({
    userId: opts.userId ?? null,
    category: opts.category,
    data: stampData,
    dataHash,
    txHash,
    blockHeight,
  }).returning();

  return stamp;
}

export async function seedGenesisHallmark(): Promise<void> {
  const genesisId = formatHallmarkId(1);
  
  const existing = await db.select().from(hallmarks).where(eq(hallmarks.thId, genesisId)).limit(1);
  if (existing.length > 0) {
    console.log(`Genesis hallmark ${genesisId} already exists.`);
    return;
  }

  await db.insert(hallmarkCounter)
    .values({ id: COUNTER_ID, currentSequence: '0' })
    .onConflictDoUpdate({
      target: hallmarkCounter.id,
      set: { currentSequence: '0' }
    });

  await generateHallmark({
    appId: 'orby-commander-genesis',
    productName: 'Genesis Block',
    releaseType: 'genesis',
    metadata: {
      ecosystem: 'Trust Layer',
      version: '1.0.0',
      domain: TRUST_LAYER_DOMAIN,
      operator: 'DarkWave Studios LLC',
      chain: 'Trust Layer Blockchain',
      consensus: 'Proof of Trust',
      launchDate: '2026-08-23T00:00:00.000Z',
      nativeAsset: 'SIG',
      utilityToken: 'Shells',
      parentApp: 'Trust Layer Hub',
      parentGenesis: TRUST_LAYER_PARENT_GENESIS,
    },
  });

  console.log(`Genesis hallmark ${genesisId} created successfully.`);
}

export async function getHallmarkByThId(thId: string): Promise<Hallmark | undefined> {
  const [result] = await db.select().from(hallmarks).where(eq(hallmarks.thId, thId)).limit(1);
  return result;
}

export async function getGenesisHallmark(): Promise<Hallmark | undefined> {
  return getHallmarkByThId(formatHallmarkId(1));
}

export async function getAllHallmarks(limit = 50): Promise<Hallmark[]> {
  return db.select().from(hallmarks).orderBy(desc(hallmarks.createdAt)).limit(limit);
}

export async function getHallmarksByUser(userId: number): Promise<Hallmark[]> {
  return db.select().from(hallmarks).where(eq(hallmarks.userId, userId)).orderBy(desc(hallmarks.createdAt));
}

export async function getTrustStampsByUser(userId: number, limit = 50): Promise<TrustStamp[]> {
  return db.select().from(trustStamps).where(eq(trustStamps.userId, userId)).orderBy(desc(trustStamps.createdAt)).limit(limit);
}

export async function getTrustStampsByCategory(category: string, limit = 50): Promise<TrustStamp[]> {
  return db.select().from(trustStamps).where(eq(trustStamps.category, category)).orderBy(desc(trustStamps.createdAt)).limit(limit);
}

export async function getAllTrustStamps(limit = 100): Promise<TrustStamp[]> {
  return db.select().from(trustStamps).orderBy(desc(trustStamps.createdAt)).limit(limit);
}

export async function verifyHallmark(thId: string): Promise<{ verified: boolean; hallmark?: Hallmark; error?: string; hashValid?: boolean }> {
  const hallmark = await getHallmarkByThId(thId);
  if (!hallmark) {
    return { verified: false, error: 'Hallmark not found' };
  }

  const reconstructed: Record<string, unknown> = {
    thId: hallmark.thId,
    userId: hallmark.userId ?? null,
    appId: hallmark.appId,
    appName: hallmark.appName,
    productName: hallmark.productName,
    releaseType: hallmark.releaseType,
    timestamp: hallmark.createdAt instanceof Date ? hallmark.createdAt.toISOString() : hallmark.createdAt,
  };
  const reHash = hashPayload(reconstructed);
  const hashValid = reHash === hallmark.dataHash;

  return {
    verified: true,
    hashValid,
    hallmark,
  };
}
