import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'wouter';
import { 
  Share2, Copy, CheckCircle, Users, TrendingUp, DollarSign, 
  Award, ChevronLeft, Star, ArrowRight, ExternalLink, Clock
} from 'lucide-react';
import { motion } from 'framer-motion';
import { PageHeader } from '@/components/ui/premium';
import { AFFILIATE_TIERS } from '@shared/schema';

interface AffiliateDashboardData {
  userHash: string;
  tier: string;
  commissionRate: number;
  totalReferrals: number;
  convertedReferrals: number;
  pendingReferrals: number;
  pendingEarnings: string;
  paidEarnings: string;
  totalEarnings: string;
  referralLink: string;
  crossPlatformLinks: Record<string, string>;
  recentReferrals: Array<{ id: number; status: string; createdAt: string; platform: string }>;
  recentCommissions: Array<{ id: number; amount: string; tier: string; status: string; createdAt: string }>;
  tiers: typeof AFFILIATE_TIERS;
}

const TIER_COLORS: Record<string, { bg: string; text: string; border: string; icon: string }> = {
  base: { bg: 'bg-white/5', text: 'text-white/70', border: 'border-white/10', icon: '⚪' },
  silver: { bg: 'bg-gray-400/10', text: 'text-gray-300', border: 'border-gray-400/20', icon: '🥈' },
  gold: { bg: 'bg-yellow-400/10', text: 'text-yellow-300', border: 'border-yellow-400/20', icon: '🥇' },
  platinum: { bg: 'bg-cyan-400/10', text: 'text-cyan-300', border: 'border-cyan-400/20', icon: '💎' },
  diamond: { bg: 'bg-purple-400/10', text: 'text-purple-300', border: 'border-purple-400/20', icon: '👑' },
};

export default function AffiliateDashboard() {
  const [, navigate] = useLocation();
  const [data, setData] = useState<AffiliateDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [payoutLoading, setPayoutLoading] = useState(false);

  const storedUser = localStorage.getItem('orby_user');
  const userId = storedUser ? JSON.parse(storedUser)?.id : null;

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    fetch(`/api/affiliate/dashboard?userId=${userId}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [userId]);

  const copyLink = useCallback(() => {
    if (!data) return;
    navigator.clipboard.writeText(data.referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [data]);

  const shareLink = useCallback(async () => {
    if (!data) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join me on Orby Commander — part of the Trust Layer ecosystem!',
          url: data.referralLink,
        });
      } catch (_) {}
    } else {
      copyLink();
    }
  }, [data, copyLink]);

  const requestPayout = useCallback(async () => {
    if (!userId || payoutLoading) return;
    setPayoutLoading(true);
    try {
      const res = await fetch('/api/affiliate/request-payout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      const result = await res.json();
      alert(result.message);
      if (result.success) {
        const d = await fetch(`/api/affiliate/dashboard?userId=${userId}`).then(r => r.json());
        setData(d);
      }
    } catch (_) {}
    setPayoutLoading(false);
  }, [userId, payoutLoading]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050508] flex items-center justify-center">
        <div className="animate-pulse text-white/40">Loading affiliate dashboard...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-[#050508] flex items-center justify-center">
        <div className="text-center text-white/50">Please log in to view your affiliate dashboard.</div>
      </div>
    );
  }

  const tierStyle = TIER_COLORS[data.tier] || TIER_COLORS.base;
  const nextTier = AFFILIATE_TIERS.find(t => t.minReferrals > data.convertedReferrals);
  const currentTierData = AFFILIATE_TIERS.find(t => t.tier === data.tier) ?? AFFILIATE_TIERS[0];
  const progressToNext = nextTier
    ? ((data.convertedReferrals - currentTierData.minReferrals) / (nextTier.minReferrals - currentTierData.minReferrals)) * 100
    : 100;

  return (
    <div className="min-h-screen bg-[#050508]" data-testid="affiliate-dashboard-page">
      <PageHeader title="Share & Earn" />

      <div className="max-w-lg mx-auto px-4 pb-8 space-y-4">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-white/50 hover:text-white text-sm" data-testid="button-back">
          <ChevronLeft className="w-4 h-4" /> Back
        </button>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-[rgba(12,18,36,0.65)] backdrop-blur-2xl border border-white/[0.08] rounded-2xl p-6 text-center"
        >
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${tierStyle.bg} border ${tierStyle.border} mb-4`}>
            <span className="text-lg">{tierStyle.icon}</span>
            <span className={`font-bold uppercase text-sm ${tierStyle.text}`}>{data.tier} Tier</span>
          </div>
          <p className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400" data-testid="text-commission-rate">
            {(data.commissionRate * 100).toFixed(1)}%
          </p>
          <p className="text-white/40 text-sm mt-1">Commission Rate</p>

          {nextTier && (
            <div className="mt-4">
              <div className="flex justify-between text-xs text-white/40 mb-1">
                <span>{data.convertedReferrals} converted</span>
                <span>{nextTier.minReferrals} for {nextTier.tier}</span>
              </div>
              <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-cyan-400 to-purple-400 rounded-full transition-all" style={{ width: `${Math.min(progressToNext, 100)}%` }} />
              </div>
            </div>
          )}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="bg-[rgba(12,18,36,0.65)] backdrop-blur-2xl border border-white/[0.08] rounded-2xl p-5"
        >
          <h3 className="text-sm font-semibold text-white/40 uppercase tracking-wider mb-3">Your Referral Link</h3>
          <div className="flex items-center gap-2">
            <div className="flex-1 px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] font-mono text-xs text-cyan-400 truncate" data-testid="text-referral-link">
              {data.referralLink}
            </div>
            <button onClick={copyLink} className="p-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.08] transition-colors" data-testid="button-copy-link">
              {copied ? <CheckCircle className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-white/50" />}
            </button>
            <button onClick={shareLink} className="p-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-500 hover:opacity-90 transition-opacity" data-testid="button-share-link">
              <Share2 className="w-4 h-4 text-white" />
            </button>
          </div>
          <p className="text-xs text-white/30 mt-2">Your link works across all 32 Trust Layer ecosystem apps</p>
        </motion.div>

        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Total Referrals', value: data.totalReferrals, icon: Users, color: 'text-cyan-400' },
            { label: 'Converted', value: data.convertedReferrals, icon: CheckCircle, color: 'text-green-400' },
            { label: 'Pending Earnings', value: `${data.pendingEarnings} SIG`, icon: Clock, color: 'text-yellow-400' },
            { label: 'Paid Earnings', value: `${data.paidEarnings} SIG`, icon: DollarSign, color: 'text-emerald-400' },
          ].map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.05 }}
              className="bg-[rgba(12,18,36,0.65)] backdrop-blur-2xl border border-white/[0.08] rounded-2xl p-4"
              data-testid={`stat-${stat.label.toLowerCase().replace(/\s/g, '-')}`}
            >
              <stat.icon className={`w-5 h-5 ${stat.color} mb-2`} />
              <p className="text-xl font-bold text-white">{stat.value}</p>
              <p className="text-xs text-white/40">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="bg-[rgba(12,18,36,0.65)] backdrop-blur-2xl border border-white/[0.08] rounded-2xl p-5"
        >
          <h3 className="text-sm font-semibold text-white/40 uppercase tracking-wider mb-3">Commission Tiers</h3>
          <div className="space-y-2">
            {AFFILIATE_TIERS.map(tier => {
              const style = TIER_COLORS[tier.tier] || TIER_COLORS.base;
              const isActive = tier.tier === data.tier;
              return (
                <div key={tier.tier}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl transition-colors ${isActive ? `${style.bg} border ${style.border}` : 'bg-white/[0.02]'}`}
                  data-testid={`tier-${tier.tier}`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{style.icon}</span>
                    <span className={`text-sm font-semibold capitalize ${isActive ? style.text : 'text-white/50'}`}>{tier.tier}</span>
                    {isActive && <span className="text-[10px] bg-cyan-400/20 text-cyan-400 px-1.5 py-0.5 rounded-full">Current</span>}
                  </div>
                  <div className="text-right">
                    <span className="text-sm text-white/70">{(tier.rate * 100).toFixed(1)}%</span>
                    <span className="text-xs text-white/30 ml-2">{tier.minReferrals}+ refs</span>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {data.recentReferrals.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
            className="bg-[rgba(12,18,36,0.65)] backdrop-blur-2xl border border-white/[0.08] rounded-2xl p-5"
          >
            <h3 className="text-sm font-semibold text-white/40 uppercase tracking-wider mb-3">Recent Referrals</h3>
            <div className="space-y-2">
              {data.recentReferrals.map(ref => (
                <div key={ref.id} className="flex items-center justify-between px-3 py-2 rounded-xl bg-white/[0.02]">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-white/30" />
                    <span className="text-sm text-white/70">{ref.platform}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${ref.status === 'converted' ? 'bg-green-400/10 text-green-400' : ref.status === 'pending' ? 'bg-yellow-400/10 text-yellow-400' : 'bg-red-400/10 text-red-400'}`}>
                      {ref.status}
                    </span>
                    <span className="text-xs text-white/30">{new Date(ref.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {data.recentCommissions.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            className="bg-[rgba(12,18,36,0.65)] backdrop-blur-2xl border border-white/[0.08] rounded-2xl p-5"
          >
            <h3 className="text-sm font-semibold text-white/40 uppercase tracking-wider mb-3">Recent Commissions</h3>
            <div className="space-y-2">
              {data.recentCommissions.map(comm => (
                <div key={comm.id} className="flex items-center justify-between px-3 py-2 rounded-xl bg-white/[0.02]">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-white/30" />
                    <span className="text-sm text-white font-mono">{comm.amount} SIG</span>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${comm.status === 'paid' ? 'bg-green-400/10 text-green-400' : comm.status === 'processing' ? 'bg-blue-400/10 text-blue-400' : 'bg-yellow-400/10 text-yellow-400'}`}>
                    {comm.status}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
          <button
            onClick={requestPayout}
            disabled={parseFloat(data.pendingEarnings) < 10 || payoutLoading}
            className="w-full py-3.5 rounded-2xl font-bold text-white bg-gradient-to-r from-cyan-500 to-purple-500 disabled:opacity-30 disabled:cursor-not-allowed hover:opacity-90 transition-opacity shadow-lg shadow-cyan-500/20"
            data-testid="button-request-payout"
          >
            {payoutLoading ? 'Processing...' : `Request Payout (min 10 SIG)`}
          </button>
          {parseFloat(data.pendingEarnings) < 10 && (
            <p className="text-xs text-white/30 text-center mt-2">
              You need at least 10 SIG in pending earnings to request a payout
            </p>
          )}
        </motion.div>
      </div>
    </div>
  );
}
