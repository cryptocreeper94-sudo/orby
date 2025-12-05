import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useStore } from '@/lib/mockData';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Menu, Settings, Shield, QrCode, LogOut, User, Building2, ChevronRight, CheckCircle2, Loader2 } from 'lucide-react';
import orbyCommanderImg from '@assets/generated_images/orby_commander_nobg.png';

interface AssetStamp {
  id: string;
  assetNumber: string;
  displayName: string;
  category: string;
  description: string | null;
  isBlockchainAnchored: boolean;
  solanaTxSignature: string | null;
  createdAt: string;
}

interface AppHeaderProps {
  showVerifiedBadge?: boolean;
}

export function AppHeader({ showVerifiedBadge = true }: AppHeaderProps) {
  const [, navigate] = useLocation();
  const [location] = useLocation();
  const currentUser = useStore((state) => state.currentUser);
  const logout = useStore((state) => state.logout);
  const [isOpen, setIsOpen] = useState(false);
  const [showHallmarkViewer, setShowHallmarkViewer] = useState(false);

  const isLoginPage = location === '/';
  const isSetPinPage = location === '/set-pin';
  const isRegisterPage = location === '/register';

  if (isLoginPage || isSetPinPage || isRegisterPage) {
    return null;
  }

  const handleLogout = () => {
    logout();
    setIsOpen(false);
    navigate('/');
  };

  const menuItems = [
    {
      id: 'hallmarks',
      label: 'Genesis Hallmarks',
      icon: <QrCode className="w-5 h-5" />,
      description: 'View blockchain-verified stamps',
      action: () => {
        setShowHallmarkViewer(true);
        setIsOpen(false);
      }
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: <Settings className="w-5 h-5" />,
      description: 'App preferences and configuration',
      action: () => {
        setIsOpen(false);
      }
    },
  ];

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-gray-900/95 backdrop-blur-sm border-b border-gray-700/50">
        <div className="px-3 py-2 max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sheet open={isOpen} onOpenChange={setIsOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-gray-400 hover:text-cyan-400 hover:bg-gray-800/50"
                    data-testid="button-hamburger-menu"
                  >
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-80 bg-gray-900 border-gray-700 p-0">
                  <SheetHeader className="p-4 border-b border-gray-700/50">
                    <div className="flex items-center gap-3">
                      <img 
                        src={orbyCommanderImg} 
                        alt="Orby Commander" 
                        className="w-12 h-12 object-contain drop-shadow-[0_0_8px_rgba(6,182,212,0.5)]"
                      />
                      <div>
                        <SheetTitle className="text-white text-left">Orby Commander</SheetTitle>
                        <p className="text-xs text-gray-400">Venue Operations Platform</p>
                      </div>
                    </div>
                  </SheetHeader>

                  {currentUser && (
                    <div className="p-4 border-b border-gray-700/50 bg-gray-800/30">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center">
                          <User className="w-5 h-5 text-cyan-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">{currentUser.name}</p>
                          <p className="text-xs text-gray-400">{currentUser.role}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="py-2">
                    {menuItems.map((item) => (
                      <button
                        key={item.id}
                        onClick={item.action}
                        className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-800/50 transition-colors group"
                        data-testid={`menu-item-${item.id}`}
                      >
                        <div className="text-gray-400 group-hover:text-cyan-400 transition-colors">
                          {item.icon}
                        </div>
                        <div className="flex-1 text-left">
                          <p className="text-sm font-medium text-white group-hover:text-cyan-400 transition-colors">
                            {item.label}
                          </p>
                          <p className="text-xs text-gray-500">{item.description}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-gray-400" />
                      </button>
                    ))}
                  </div>

                  <Separator className="bg-gray-700/50" />

                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Building2 className="w-4 h-4 text-gray-500" />
                      <span className="text-xs text-gray-500">Current Venue</span>
                    </div>
                    <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700/50">
                      <p className="text-sm font-medium text-white">Nissan Stadium</p>
                      <p className="text-xs text-gray-400">Nashville, Tennessee</p>
                      <Badge variant="outline" className="mt-2 text-xs border-cyan-500/50 text-cyan-400">
                        Beta Tenant
                      </Badge>
                    </div>
                  </div>

                  <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-700/50">
                    <Button
                      variant="ghost"
                      className="w-full justify-start gap-3 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      onClick={handleLogout}
                      data-testid="button-menu-logout"
                    >
                      <LogOut className="w-5 h-5" />
                      Sign Out
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>

              <div className="flex items-center gap-2">
                <img 
                  src={orbyCommanderImg} 
                  alt="Orby" 
                  className="w-7 h-7 object-contain"
                />
                <span className="text-sm font-semibold text-white hidden sm:inline">
                  Orby Commander
                </span>
              </div>
            </div>

            {showVerifiedBadge && (
              <button
                onClick={() => setShowHallmarkViewer(true)}
                className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-green-500/10 border border-green-500/30 hover:bg-green-500/20 transition-colors"
                data-testid="button-verified-badge"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                <span className="text-xs font-medium text-green-400 hidden sm:inline">Verified</span>
                <Shield className="w-3 h-3 text-green-400" />
              </button>
            )}
          </div>
        </div>
      </header>

      {showHallmarkViewer && (
        <HallmarkViewerModal 
          isOpen={showHallmarkViewer} 
          onClose={() => setShowHallmarkViewer(false)} 
        />
      )}
    </>
  );
}

interface HallmarkViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function HallmarkViewerModal({ isOpen, onClose }: HallmarkViewerModalProps) {
  const [selectedStamp, setSelectedStamp] = useState<string | null>(null);
  const [stamps, setStamps] = useState<AssetStamp[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchStamps();
    }
  }, [isOpen]);

  const fetchStamps = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/asset-stamps');
      if (!res.ok) {
        throw new Error(`Failed to fetch stamps: ${res.status}`);
      }
      const data = await res.json();
      setStamps(data);
    } catch (err) {
      console.error('Failed to fetch stamps:', err);
      setError('Unable to load hallmarks. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      platform: 'Platform Genesis',
      user: 'User Genesis',
      version: 'Version Release',
      document: 'Document',
      report: 'Report',
      other: 'Other'
    };
    return labels[category] || category;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-lg max-h-[90vh] overflow-hidden">
        <div className="p-4 border-b border-gray-700/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
              <Shield className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Genesis Hallmarks</h2>
              <p className="text-xs text-gray-400">Blockchain-verified asset stamps</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} data-testid="button-close-hallmarks">
            <span className="sr-only">Close</span>
            <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </Button>
        </div>

        <div className="p-4 max-h-[60vh] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
            </div>
          ) : error ? (
            <div className="text-center py-8 space-y-3">
              <p className="text-red-400 text-sm">{error}</p>
              <button
                onClick={fetchStamps}
                className="text-xs text-cyan-400 hover:text-cyan-300 underline"
                data-testid="button-retry-hallmarks"
              >
                Retry
              </button>
            </div>
          ) : stamps.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-400 text-sm">No hallmarks found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {stamps.map((stamp) => (
                <button
                  key={stamp.id}
                  onClick={() => setSelectedStamp(selectedStamp === stamp.assetNumber ? null : stamp.assetNumber)}
                  className={`w-full p-4 rounded-lg border transition-all text-left ${
                    selectedStamp === stamp.assetNumber
                      ? 'bg-cyan-500/10 border-cyan-500/50'
                      : 'bg-gray-800/50 border-gray-700/50 hover:border-gray-600'
                  }`}
                  data-testid={`hallmark-${stamp.assetNumber}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-sm text-cyan-400">{stamp.assetNumber}</span>
                        {stamp.isBlockchainAnchored && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                        )}
                      </div>
                      <p className="text-sm font-medium text-white">{stamp.displayName}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{getCategoryLabel(stamp.category)}</p>
                    </div>
                    <QrCode className="w-8 h-8 text-gray-600 flex-shrink-0" />
                  </div>

                  {selectedStamp === stamp.assetNumber && (
                    <div className="mt-4 pt-4 border-t border-gray-700/50">
                      <p className="text-xs text-gray-300 mb-3">{stamp.description || 'No description available'}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Created: {formatDate(stamp.createdAt)}</span>
                        {stamp.solanaTxSignature ? (
                          <a
                            href={`https://solscan.io/tx/${stamp.solanaTxSignature}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                            onClick={(e) => e.stopPropagation()}
                            data-testid={`link-solscan-${stamp.assetNumber}`}
                          >
                            View on Solscan
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </a>
                        ) : (
                          <span className="text-xs text-gray-500">Pending blockchain verification</span>
                        )}
                      </div>
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-700/50 bg-gray-800/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span className="text-xs text-gray-400">
                {stamps.length} Genesis Hallmarks
              </span>
            </div>
            <Badge variant="outline" className="text-xs border-gray-600 text-gray-400">
              Nissan Stadium Beta
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AppHeader;
