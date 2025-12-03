import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { 
  Shield, Search, Hash, Clock, Link2, CheckCircle2, 
  XCircle, ExternalLink, ChevronDown, ChevronUp, Filter,
  BarChart3, FileText, Users, Layers, AlertCircle, Fingerprint
} from 'lucide-react';

interface AssetStamp {
  id: string;
  assetNumber: string;
  displayName: string;
  category: string;
  description: string | null;
  sourceType: string | null;
  sourceId: string | null;
  userId: string | null;
  sha256Hash: string | null;
  metadata: Record<string, unknown> | null;
  isBlockchainAnchored: boolean;
  solanaNetwork: string | null;
  solanaTxSignature: string | null;
  solanaConfirmedAt: string | null;
  version: string | null;
  changes: string[] | null;
  createdAt: string;
  updatedAt: string;
}

interface AssetStampStats {
  total: number;
  byCategory: Record<string, number>;
  blockchain: number;
}

const categoryIcons: Record<string, typeof Shield> = {
  platform: Shield,
  user: Users,
  version: Layers,
  document: FileText,
  report: BarChart3,
  incident: AlertCircle,
  violation: AlertCircle,
  compliance: Shield,
  other: Hash
};

const categoryColors: Record<string, string> = {
  platform: 'text-cyan-400',
  user: 'text-blue-400',
  version: 'text-purple-400',
  document: 'text-green-400',
  report: 'text-yellow-400',
  incident: 'text-red-400',
  violation: 'text-orange-400',
  compliance: 'text-cyan-400',
  other: 'text-gray-400'
};

export function AssetTracker({ isCompact = false }: { isCompact?: boolean }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [expandedAsset, setExpandedAsset] = useState<string | null>(null);

  const { data: stats } = useQuery<AssetStampStats>({
    queryKey: ['/api/asset-stamps/stats'],
    refetchInterval: 30000
  });

  const { data: assets, isLoading } = useQuery<AssetStamp[]>({
    queryKey: ['/api/asset-stamps'],
    refetchInterval: 30000
  });

  const filteredAssets = assets?.filter(asset => {
    const matchesSearch = !searchQuery || 
      asset.assetNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (asset.description?.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = !selectedCategory || asset.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  }) || [];

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getSolscanUrl = (txSignature: string, network: string | null) => {
    if (txSignature.startsWith('HASH_')) return null;
    const cluster = network === 'devnet' ? '?cluster=devnet' : '';
    return `https://solscan.io/tx/${txSignature}${cluster}`;
  };

  if (isCompact) {
    return (
      <div className="bg-gray-900/50 backdrop-blur-xl rounded-2xl border border-cyan-500/20 p-4" data-testid="asset-tracker-compact">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Fingerprint className="w-5 h-5 text-cyan-400" />
            <h3 className="text-white font-semibold">Asset Tracker</h3>
          </div>
          <span className="text-xs text-cyan-400 bg-cyan-500/20 px-2 py-1 rounded-full">
            {stats?.total || 0} stamped
          </span>
        </div>
        
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="bg-gray-800/50 rounded-lg p-2">
            <div className="text-gray-400 text-xs">Blockchain Verified</div>
            <div className="text-white font-bold">{stats?.blockchain || 0}</div>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-2">
            <div className="text-gray-400 text-xs">Categories</div>
            <div className="text-white font-bold">{Object.keys(stats?.byCategory || {}).length}</div>
          </div>
        </div>
        
        {assets && assets.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-700/50">
            <div className="text-xs text-gray-400 mb-2">Recent Assets</div>
            {assets.slice(0, 3).map(asset => (
              <div key={asset.id} className="flex items-center gap-2 py-1">
                <span className="text-cyan-400 font-mono text-xs">{asset.assetNumber.slice(0, 16)}...</span>
                <span className="text-gray-400 text-xs truncate flex-1">{asset.displayName}</span>
                {asset.isBlockchainAnchored && (
                  <Link2 className="w-3 h-3 text-green-400" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-gray-900/50 backdrop-blur-xl rounded-2xl border border-cyan-500/20 p-6" data-testid="asset-tracker-full">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center">
            <Fingerprint className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Genesis Hallmark Tracker</h2>
            <p className="text-gray-400 text-sm">Blockchain-certified asset registry</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="bg-gray-800/50 rounded-lg px-4 py-2 flex items-center gap-2">
            <Hash className="w-4 h-4 text-cyan-400" />
            <span className="text-white font-bold">{stats?.total || 0}</span>
            <span className="text-gray-400 text-sm">stamped</span>
          </div>
          <div className="bg-gray-800/50 rounded-lg px-4 py-2 flex items-center gap-2">
            <Link2 className="w-4 h-4 text-green-400" />
            <span className="text-white font-bold">{stats?.blockchain || 0}</span>
            <span className="text-gray-400 text-sm">on-chain</span>
          </div>
        </div>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by asset number, name, or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-800/50 border border-gray-700/50 rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50"
            data-testid="input-asset-search"
          />
        </div>
        
        <div className="relative">
          <button
            className="flex items-center gap-2 bg-gray-800/50 border border-gray-700/50 rounded-lg px-4 py-3 text-white hover:border-cyan-500/50 transition-colors"
            data-testid="button-filter-category"
          >
            <Filter className="w-5 h-5 text-gray-400" />
            <span>{selectedCategory || 'All Categories'}</span>
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      </div>

      {stats && Object.keys(stats.byCategory).length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-3 py-1.5 rounded-full text-sm transition-all ${
              !selectedCategory
                ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-500/50'
                : 'bg-gray-800/50 text-gray-400 border border-gray-700/50 hover:border-gray-600'
            }`}
            data-testid="button-category-all"
          >
            All ({stats.total})
          </button>
          {Object.entries(stats.byCategory).map(([cat, count]) => {
            const Icon = categoryIcons[cat] || Hash;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-sm transition-all flex items-center gap-1.5 ${
                  selectedCategory === cat
                    ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-500/50'
                    : 'bg-gray-800/50 text-gray-400 border border-gray-700/50 hover:border-gray-600'
                }`}
                data-testid={`button-category-${cat}`}
              >
                <Icon className="w-4 h-4" />
                {cat} ({count})
              </button>
            );
          })}
        </div>
      )}

      <div className="space-y-3 max-h-[500px] overflow-y-auto">
        {isLoading ? (
          <div className="text-center py-8 text-gray-400">Loading assets...</div>
        ) : filteredAssets.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            {searchQuery ? 'No assets match your search' : 'No assets stamped yet'}
          </div>
        ) : (
          filteredAssets.map((asset) => {
            const Icon = categoryIcons[asset.category] || Hash;
            const colorClass = categoryColors[asset.category] || 'text-gray-400';
            const isExpanded = expandedAsset === asset.id;
            const solscanUrl = asset.solanaTxSignature ? getSolscanUrl(asset.solanaTxSignature, asset.solanaNetwork) : null;
            
            return (
              <motion.div
                key={asset.id}
                layout
                className="bg-gray-800/30 rounded-xl border border-gray-700/50 overflow-hidden hover:border-cyan-500/30 transition-colors"
                data-testid={`card-asset-${asset.assetNumber}`}
              >
                <div 
                  className="p-4 cursor-pointer"
                  onClick={() => setExpandedAsset(isExpanded ? null : asset.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg bg-gray-800/50 flex items-center justify-center ${colorClass}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-cyan-400 text-sm">{asset.assetNumber}</span>
                          {asset.isBlockchainAnchored ? (
                            <span className="flex items-center gap-1 text-xs text-green-400 bg-green-500/20 px-2 py-0.5 rounded-full">
                              <CheckCircle2 className="w-3 h-3" />
                              On-Chain
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-xs text-gray-400 bg-gray-700/50 px-2 py-0.5 rounded-full">
                              <XCircle className="w-3 h-3" />
                              Internal
                            </span>
                          )}
                        </div>
                        <div className="text-white font-medium mt-0.5">{asset.displayName}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-gray-400 text-xs flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDate(asset.createdAt)}
                        </div>
                        {asset.version && (
                          <div className="text-purple-400 text-xs mt-0.5">{asset.version}</div>
                        )}
                      </div>
                      <motion.div
                        animate={{ rotate: isExpanded ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      </motion.div>
                    </div>
                  </div>
                </div>
                
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="border-t border-gray-700/50"
                    >
                      <div className="p-4 bg-gray-900/30">
                        {asset.description && (
                          <p className="text-gray-300 text-sm mb-4">{asset.description}</p>
                        )}
                        
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <div className="text-gray-500 mb-1">Category</div>
                            <div className={`${colorClass} capitalize`}>{asset.category}</div>
                          </div>
                          <div>
                            <div className="text-gray-500 mb-1">Source</div>
                            <div className="text-white">{asset.sourceType || 'N/A'}</div>
                          </div>
                          <div className="col-span-2">
                            <div className="text-gray-500 mb-1">SHA-256 Hash</div>
                            <div className="font-mono text-xs text-cyan-400 break-all bg-gray-800/50 p-2 rounded">
                              {asset.sha256Hash || 'N/A'}
                            </div>
                          </div>
                          {asset.isBlockchainAnchored && asset.solanaTxSignature && (
                            <div className="col-span-2">
                              <div className="text-gray-500 mb-1">Solana Transaction</div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-xs text-green-400 break-all">
                                  {asset.solanaTxSignature}
                                </span>
                                {solscanUrl && (
                                  <a
                                    href={solscanUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-cyan-400 hover:text-cyan-300"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <ExternalLink className="w-4 h-4" />
                                  </a>
                                )}
                              </div>
                            </div>
                          )}
                          {asset.changes && asset.changes.length > 0 && (
                            <div className="col-span-2">
                              <div className="text-gray-500 mb-1">Changelog</div>
                              <ul className="list-disc list-inside text-gray-300 text-xs space-y-1">
                                {asset.changes.map((change, i) => (
                                  <li key={i}>{change}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
