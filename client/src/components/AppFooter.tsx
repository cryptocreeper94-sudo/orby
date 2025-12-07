import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Shield, X, Clock, CheckCircle2, ExternalLink, Hash, Layers } from 'lucide-react';

interface AssetStamp {
  id: string;
  assetNumber: string;
  displayName: string;
  category: string;
  description: string | null;
  sha256Hash: string | null;
  isBlockchainAnchored: boolean;
  solanaNetwork: string | null;
  solanaTxSignature: string | null;
  version: string | null;
  changes: string[] | null;
  createdAt: string;
  metadata: Record<string, unknown> | null;
}

interface AppFooterProps {
  companyLogo?: string;
  companyName?: string;
}

export function AppFooter({ companyLogo, companyName = 'Legends' }: AppFooterProps) {
  const [isVersionModalOpen, setIsVersionModalOpen] = useState(false);

  const { data: packageVersion } = useQuery<{ version: string }>({
    queryKey: ['/api/version'],
    refetchInterval: false
  });

  const { data: versionAssets } = useQuery<AssetStamp[]>({
    queryKey: ['/api/asset-stamps/category/version'],
    refetchInterval: 60000
  });

  const { data: latestRelease } = useQuery<{
    id: string;
    version: string;
    title: string;
    solanaTransactionHash: string | null;
    isPublished: boolean;
  }>({
    queryKey: ['/api/releases/latest'],
    refetchInterval: 60000
  });

  const latestVersion = versionAssets?.[0];
  const hasReleaseVerification = latestRelease?.solanaTransactionHash && 
    !latestRelease.solanaTransactionHash.startsWith('HASH_');
  const currentVersion = latestRelease?.version 
    ? `v${latestRelease.version}` 
    : (packageVersion?.version ? `v${packageVersion.version}` : 'v1.0');

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric'
    });
  };

  const getSolscanUrl = (txSignature: string, network: string | null) => {
    if (txSignature.startsWith('HASH_')) return null;
    const cluster = network === 'devnet' ? '?cluster=devnet' : '';
    return `https://solscan.io/tx/${txSignature}${cluster}`;
  };

  return (
    <>
      <footer className="fixed bottom-0 left-0 right-0 z-20 bg-gray-900/95 backdrop-blur-sm border-t border-gray-700/50">
        <div className="px-3 py-2 max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {companyLogo ? (
                <img 
                  src={companyLogo} 
                  alt={companyName}
                  className="h-5 object-contain"
                />
              ) : (
                <span className="text-xs font-semibold text-white/80">{companyName}</span>
              )}
              <span className="hidden sm:inline text-[10px] text-gray-500">Beta</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsVersionModalOpen(true)}
                className="flex items-center gap-1 text-[10px] text-gray-400 hover:text-cyan-400 transition-colors"
                data-testid="footer-version-badge"
              >
                <Shield className="w-3 h-3" />
                <span className="font-mono">{currentVersion}</span>
                {(latestVersion?.isBlockchainAnchored || hasReleaseVerification) && (
                  <CheckCircle2 className="w-2.5 h-2.5 text-green-400" />
                )}
              </button>

              <span className="text-gray-600">|</span>

              <a 
                href="https://darkwavestudios.io" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-1 text-[10px]"
                data-testid="link-darkwave"
              >
                <span>&copy; 2025 DarkWave Studios LLC</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
          </div>
        </div>
      </footer>

      <AnimatePresence>
        {isVersionModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              onClick={() => setIsVersionModalOpen(false)}
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed bottom-16 left-1/2 -translate-x-1/2 w-96 max-w-[calc(100vw-2rem)] max-h-[60vh] overflow-hidden bg-gray-900/95 backdrop-blur-xl rounded-2xl border border-cyan-500/30 shadow-2xl shadow-cyan-500/10 z-50"
              data-testid="modal-version-details"
            >
              <div className="p-4 border-b border-gray-700/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center">
                      <Layers className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div>
                      <h3 className="text-white font-bold">Orby Version History</h3>
                      <p className="text-gray-400 text-xs">Blockchain Certified Releases</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsVersionModalOpen(false)}
                    className="text-gray-400 hover:text-white transition-colors"
                    data-testid="button-close-version-modal"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-4 overflow-y-auto max-h-[calc(60vh-80px)]">
                {versionAssets?.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    No version history available
                  </div>
                ) : (
                  <div className="space-y-4">
                    {versionAssets?.map((version, index) => {
                      const solscanUrl = version.solanaTxSignature 
                        ? getSolscanUrl(version.solanaTxSignature, version.solanaNetwork) 
                        : null;
                      
                      return (
                        <div 
                          key={version.id}
                          className={`relative pl-6 pb-4 ${
                            index !== (versionAssets?.length || 0) - 1 
                              ? 'border-l-2 border-gray-700' 
                              : ''
                          }`}
                        >
                          <div className={`absolute left-0 top-0 w-3 h-3 rounded-full transform -translate-x-[7px] ${
                            index === 0 
                              ? 'bg-cyan-400 shadow-lg shadow-cyan-400/50' 
                              : 'bg-gray-600'
                          }`} />
                          
                          <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className="text-white font-bold text-lg">{version.version}</span>
                                {version.isBlockchainAnchored ? (
                                  <span className="flex items-center gap-1 text-xs text-green-400 bg-green-500/20 px-2 py-0.5 rounded-full">
                                    <CheckCircle2 className="w-3 h-3" />
                                    Verified
                                  </span>
                                ) : (
                                  <span className="flex items-center gap-1 text-xs text-gray-400 bg-gray-700/50 px-2 py-0.5 rounded-full">
                                    <Hash className="w-3 h-3" />
                                    Pending
                                  </span>
                                )}
                              </div>
                              {index === 0 && (
                                <span className="text-xs text-cyan-400 bg-cyan-500/20 px-2 py-0.5 rounded-full">
                                  Current
                                </span>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-1 text-gray-400 text-xs mb-3">
                              <Clock className="w-3 h-3" />
                              {formatDate(version.createdAt)}
                            </div>
                            
                            <div className="text-gray-300 text-sm mb-3">{version.displayName}</div>
                            
                            {version.changes && version.changes.length > 0 && (
                              <div className="space-y-1">
                                <div className="text-gray-500 text-xs uppercase tracking-wider">Changes</div>
                                <ul className="list-disc list-inside text-gray-300 text-xs space-y-0.5">
                                  {version.changes.map((change, i) => (
                                    <li key={i}>{change}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            
                            {version.isBlockchainAnchored && version.solanaTxSignature && (
                              <div className="mt-3 pt-3 border-t border-gray-700/50">
                                <div className="text-gray-500 text-xs mb-1">Solana TX</div>
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-xs text-green-400 truncate flex-1">
                                    {version.solanaTxSignature.slice(0, 32)}...
                                  </span>
                                  {solscanUrl && (
                                    <a
                                      href={solscanUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-cyan-400 hover:text-cyan-300"
                                    >
                                      <ExternalLink className="w-4 h-4" />
                                    </a>
                                  )}
                                </div>
                              </div>
                            )}
                            
                            <div className="mt-3 pt-3 border-t border-gray-700/50">
                              <div className="text-gray-500 text-xs mb-1">Asset Number</div>
                              <span className="font-mono text-xs text-cyan-400">{version.assetNumber}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              
              <div className="p-4 border-t border-gray-700/50 bg-gray-900/50">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-gray-400">
                    <Shield className="w-4 h-4 text-cyan-400" />
                    <span>Powered by Genesis Hallmark System</span>
                  </div>
                  <span className="text-cyan-400">getorby.io</span>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
