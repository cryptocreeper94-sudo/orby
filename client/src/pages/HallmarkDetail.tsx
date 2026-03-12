import { useState, useEffect } from 'react';
import { useRoute, useLocation } from 'wouter';
import { Shield, CheckCircle, ExternalLink, Copy, ChevronLeft, Fingerprint, Link2, Clock, Hash, Globe } from 'lucide-react';
import { motion } from 'framer-motion';
import { PageHeader } from '@/components/ui/premium';

interface HallmarkData {
  id: number;
  thId: string;
  userId: number | null;
  appId: string;
  appName: string;
  productName: string;
  releaseType: string;
  metadata: Record<string, unknown>;
  dataHash: string;
  txHash: string;
  blockHeight: string;
  verificationUrl: string;
  hallmarkId: number;
  createdAt: string;
}

export default function HallmarkDetail() {
  const [, params] = useRoute('/hallmark/:id');
  const [, navigate] = useLocation();
  const [hallmark, setHallmark] = useState<HallmarkData | null>(null);
  const [verified, setVerified] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState('');

  const hallmarkId = params?.id || 'OC-00000001';

  useEffect(() => {
    fetch(`/api/hallmark/${hallmarkId}/verify`)
      .then(r => r.json())
      .then(data => {
        if (data.verified) {
          setHallmark(data.hallmark);
          setVerified(true);
        } else {
          setVerified(false);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [hallmarkId]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(''), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050508] flex items-center justify-center">
        <div className="animate-pulse text-white/40">Loading hallmark...</div>
      </div>
    );
  }

  if (!hallmark || !verified) {
    return (
      <div className="min-h-screen bg-[#050508] flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Hallmark Not Found</h2>
          <p className="text-white/50">ID: {hallmarkId}</p>
        </div>
      </div>
    );
  }

  const meta = hallmark.metadata || {};

  return (
    <div className="min-h-screen bg-[#050508]" data-testid="hallmark-detail-page">
      <PageHeader title="Hallmark Detail" />

      <div className="max-w-lg mx-auto px-4 pb-8 space-y-4">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-white/50 hover:text-white text-sm" data-testid="button-back">
          <ChevronLeft className="w-4 h-4" /> Back
        </button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[rgba(12,18,36,0.65)] backdrop-blur-2xl border border-white/[0.08] rounded-2xl p-6 text-center"
        >
          <div className="relative inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-cyan-400/20 to-purple-500/20 border border-cyan-400/30 mb-4">
            <Shield className="w-10 h-10 text-cyan-400" />
            <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
              <CheckCircle className="w-4 h-4 text-white" />
            </div>
          </div>

          <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400" data-testid="text-hallmark-id">
            {hallmark.thId}
          </h1>
          <p className="text-white/70 mt-1">{hallmark.productName}</p>
          <span className="inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold bg-cyan-400/10 text-cyan-400 border border-cyan-400/20">
            {hallmark.releaseType?.toUpperCase()}
          </span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-[rgba(12,18,36,0.65)] backdrop-blur-2xl border border-white/[0.08] rounded-2xl p-5"
        >
          <h3 className="text-sm font-semibold text-white/40 uppercase tracking-wider mb-3">Application Info</h3>
          <div className="space-y-3">
            <InfoRow icon={<Globe className="w-4 h-4" />} label="App Name" value={hallmark.appName} />
            <InfoRow icon={<Hash className="w-4 h-4" />} label="App ID" value={hallmark.appId} />
            <InfoRow icon={<Clock className="w-4 h-4" />} label="Created" value={new Date(hallmark.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })} />
            {meta.version && <InfoRow icon={<Hash className="w-4 h-4" />} label="Version" value={String(meta.version)} />}
            {meta.domain && <InfoRow icon={<Globe className="w-4 h-4" />} label="Domain" value={String(meta.domain)} />}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-[rgba(12,18,36,0.65)] backdrop-blur-2xl border border-white/[0.08] rounded-2xl p-5"
        >
          <h3 className="text-sm font-semibold text-white/40 uppercase tracking-wider mb-3">Blockchain Record</h3>
          <div className="space-y-3">
            <CopyRow label="Data Hash" value={hallmark.dataHash} onCopy={() => copyToClipboard(hallmark.dataHash, 'hash')} copied={copied === 'hash'} />
            <CopyRow label="Tx Hash" value={hallmark.txHash} onCopy={() => copyToClipboard(hallmark.txHash, 'tx')} copied={copied === 'tx'} />
            <InfoRow icon={<Hash className="w-4 h-4" />} label="Block Height" value={hallmark.blockHeight} />
          </div>
        </motion.div>

        {meta.ecosystem && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-[rgba(12,18,36,0.65)] backdrop-blur-2xl border border-white/[0.08] rounded-2xl p-5"
          >
            <h3 className="text-sm font-semibold text-white/40 uppercase tracking-wider mb-3">Ecosystem Details</h3>
            <div className="space-y-3">
              {meta.ecosystem && <InfoRow icon={<Globe className="w-4 h-4" />} label="Ecosystem" value={String(meta.ecosystem)} />}
              {meta.chain && <InfoRow icon={<Link2 className="w-4 h-4" />} label="Chain" value={String(meta.chain)} />}
              {meta.consensus && <InfoRow icon={<Fingerprint className="w-4 h-4" />} label="Consensus" value={String(meta.consensus)} />}
              {meta.nativeAsset && <InfoRow icon={<Hash className="w-4 h-4" />} label="Native Asset" value={String(meta.nativeAsset)} />}
              {meta.utilityToken && <InfoRow icon={<Hash className="w-4 h-4" />} label="Utility Token" value={String(meta.utilityToken)} />}
              {meta.operator && <InfoRow icon={<Globe className="w-4 h-4" />} label="Operator" value={String(meta.operator)} />}
              {meta.launchDate && <InfoRow icon={<Clock className="w-4 h-4" />} label="Launch Date" value={new Date(String(meta.launchDate)).toLocaleDateString()} />}
            </div>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-[rgba(12,18,36,0.65)] backdrop-blur-2xl border border-white/[0.08] rounded-2xl p-5"
        >
          <h3 className="text-sm font-semibold text-white/40 uppercase tracking-wider mb-3">Verification</h3>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-white font-semibold">Verified</p>
              <p className="text-white/40 text-xs">This hallmark is authentic and unmodified</p>
            </div>
          </div>

          {meta.parentGenesis && (
            <button
              onClick={() => navigate('/hallmark/TH-00000001')}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.08] transition-colors"
              data-testid="button-parent-genesis"
            >
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-purple-400" />
                <span className="text-sm text-white/70">Parent Genesis</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-sm text-cyan-400 font-mono">{String(meta.parentGenesis)}</span>
                <ExternalLink className="w-3 h-3 text-white/30" />
              </div>
            </button>
          )}
        </motion.div>
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-white/40">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <span className="text-sm text-white font-mono truncate max-w-[200px]">{value}</span>
    </div>
  );
}

function CopyRow({ label, value, onCopy, copied }: { label: string; value: string; onCopy: () => void; copied: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-white/40">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-xs text-white font-mono truncate max-w-[160px]">{value}</span>
        <button onClick={onCopy} className="text-white/30 hover:text-cyan-400 transition-colors" data-testid={`button-copy-${label.toLowerCase().replace(' ', '-')}`}>
          {copied ? <CheckCircle className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
      </div>
    </div>
  );
}
