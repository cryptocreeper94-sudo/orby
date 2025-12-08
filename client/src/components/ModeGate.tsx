import { useState } from 'react';
import { useMode } from '@/lib/ModeContext';
import { Shield, FlaskConical, Radio, Users, AlertTriangle, Sparkles, BadgeCheck, ExternalLink, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import orbyCommanderImg from '@assets/generated_images/orby_commander_nobg.png';
import nashvilleSkylineImg from '@assets/generated_images/nashville_skyline_nissan_nobg.png';

const GENESIS_HALLMARK_URL = 'https://solscan.io/tx/44QArRaRncUfTEP3ZHVQmiMo7zWfRxxD82KxpKHihzJc6KXD7PjQ1XofygiZjtCU6oNK6hCgiT848YqjntsMFMnU';
const QR_CODE_URL = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(GENESIS_HALLMARK_URL)}&bgcolor=0f172a&color=10b981`;

interface ModeGateProps {
  onModeSelected: () => void;
}

export function ModeGate({ onModeSelected }: ModeGateProps) {
  const { enterSandbox, exitSandbox, mode } = useMode();
  const [showQRModal, setShowQRModal] = useState(false);

  const handleLiveMode = () => {
    exitSandbox();
    onModeSelected();
  };

  const handleSandboxMode = () => {
    enterSandbox('/');
    onModeSelected();
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-cyan-900 to-slate-800 z-50 overflow-y-auto">
      <div className="min-h-full flex flex-col">
        {/* Header with Verified Badge */}
        <div className="flex items-center justify-between px-4 py-3 flex-shrink-0">
          <div className="text-cyan-400/70 text-xs font-medium">getorby.io</div>
          <button
            onClick={() => setShowQRModal(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-emerald-600/30 to-cyan-600/30 border border-emerald-400/50 hover:border-emerald-400 transition-all duration-300 hover:shadow-[0_0_20px_rgba(16,185,129,0.4)] group"
            data-testid="button-genesis-badge"
          >
            <BadgeCheck className="h-4 w-4 text-emerald-400" />
            <span className="text-xs font-bold text-emerald-300">Verified</span>
          </button>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col items-center px-4 pb-6 pt-2">
          <div className="w-full max-w-2xl">
            <div className="text-center mb-6">
              {/* Cohesive Hero Scene - Skyline + Orby as one layered composition */}
              <div className="relative w-screen left-1/2 -translate-x-1/2 h-[200px] sm:h-[260px] md:h-[320px] mb-4">
                {/* Nashville Skyline - Full width background layer */}
                <img 
                  src={nashvilleSkylineImg} 
                  alt="Nashville Skyline with Nissan Stadium" 
                  className="absolute inset-x-0 bottom-0 w-full h-full object-cover object-bottom opacity-60"
                  data-testid="img-city-skyline"
                />
                {/* Gradient overlay for blending */}
                <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-slate-900 via-slate-900/70 to-transparent" />
                <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-slate-900/80 to-transparent" />
                
                {/* Orby Commander - Floating in front of skyline */}
                <div className="absolute bottom-[-20px] sm:bottom-[-30px] left-1/2 -translate-x-1/2 z-20">
                  {/* Glow effects behind Orby */}
                  <div className="absolute inset-0 w-36 h-36 sm:w-44 sm:h-44 bg-cyan-400/30 rounded-full blur-3xl animate-pulse -z-10" />
                  <div className="absolute inset-0 w-32 h-32 sm:w-40 sm:h-40 bg-cyan-500/20 rounded-full blur-2xl animate-pulse -z-10" style={{animationDelay: '0.5s'}} />
                  <img 
                    src={orbyCommanderImg} 
                    alt="Orby Commander" 
                    className="w-28 h-28 sm:w-36 sm:h-36 md:w-44 md:h-44 object-contain drop-shadow-[0_0_50px_rgba(6,182,212,0.9)] animate-float"
                    data-testid="img-orby-commander"
                  />
                </div>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-white mb-2 tracking-tight">Welcome to Orby</h1>
              <p className="text-cyan-200/70 text-sm sm:text-base">Select your mode before continuing</p>
            </div>

          <div className="grid md:grid-cols-2 gap-4">
            <button
              onClick={handleLiveMode}
              className={cn(
                "group relative overflow-hidden rounded-2xl p-6 text-left transition-all duration-300",
                "bg-gradient-to-br from-emerald-950/80 to-emerald-900/60",
                "border-2 border-emerald-500/30 hover:border-emerald-400",
                "hover:shadow-[0_0_40px_rgba(16,185,129,0.3)]",
                "focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-slate-900"
              )}
              data-testid="button-live-mode"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-emerald-500/20 transition-colors" />
              
              <div className="relative">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-14 h-14 rounded-xl bg-emerald-500/20 flex items-center justify-center border border-emerald-500/40 group-hover:bg-emerald-500/30 transition-colors">
                    <Radio className="h-7 w-7 text-emerald-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-bold text-white">Live Operations</span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-[10px] font-bold text-emerald-400 uppercase">
                        Production
                      </span>
                    </div>
                    <div className="text-sm text-emerald-300/70">Real venue operations</div>
                  </div>
                </div>

                <ul className="space-y-2 text-sm text-emerald-200/80 mb-6">
                  <li className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-emerald-400" />
                    <span>All actions affect real data</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-emerald-400" />
                    <span>Connected with live team</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-400" />
                    <span>Real alerts and incidents</span>
                  </li>
                </ul>

                <div className="flex items-center justify-between">
                  <span className="text-emerald-400 font-semibold group-hover:text-emerald-300 transition-colors">
                    Enter Live Mode →
                  </span>
                </div>
              </div>
            </button>

            <button
              onClick={handleSandboxMode}
              className={cn(
                "group relative overflow-hidden rounded-2xl p-6 text-left transition-all duration-300",
                "bg-gradient-to-br from-cyan-950/80 to-teal-900/60",
                "border-2 border-cyan-500/30 hover:border-cyan-400",
                "hover:shadow-[0_0_40px_rgba(6,182,212,0.3)]",
                "focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-slate-900"
              )}
              data-testid="button-sandbox-mode"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-cyan-500/20 transition-colors" />
              
              <div className="absolute top-3 right-3">
                <Sparkles className="h-5 w-5 text-yellow-400 animate-pulse" />
              </div>

              <div className="relative">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-14 h-14 rounded-xl bg-cyan-500/20 flex items-center justify-center border border-cyan-500/40 group-hover:bg-cyan-500/30 transition-colors">
                    <FlaskConical className="h-7 w-7 text-cyan-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-bold text-white">Sandbox Mode</span>
                      <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-[10px] font-bold text-cyan-400 uppercase">
                        Training
                      </span>
                    </div>
                    <div className="text-sm text-cyan-300/70">Practice & Demo</div>
                  </div>
                </div>

                <ul className="space-y-2 text-sm text-cyan-200/80 mb-6">
                  <li className="flex items-center gap-2">
                    <FlaskConical className="h-4 w-4 text-cyan-400" />
                    <span>Safe to experiment</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-cyan-400" />
                    <span>Demo data loaded</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-cyan-400" />
                    <span>Nothing affects live ops</span>
                  </li>
                </ul>

                <div className="flex items-center justify-between">
                  <span className="text-cyan-400 font-semibold group-hover:text-cyan-300 transition-colors">
                    Enter Sandbox →
                  </span>
                </div>
              </div>
            </button>
          </div>

          <p className="text-center text-cyan-200/50 text-xs mt-6">
            You can switch modes anytime from your dashboard
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-3 text-center">
        <a 
          href="https://darkwavestudios.io" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-purple-400 hover:text-purple-300 transition-colors inline-flex items-center gap-1 text-xs"
          data-testid="link-darkwave-modegate"
        >
          <span>&copy; 2025 DarkWave Studios LLC</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      {/* QR Code Modal */}
      {showQRModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => setShowQRModal(false)}
        >
          <div 
            className="relative w-full max-w-md bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl border border-emerald-500/30 shadow-[0_0_60px_rgba(16,185,129,0.3)] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            data-testid="modal-genesis-qr"
          >
            {/* Close Button */}
            <button
              onClick={() => setShowQRModal(false)}
              className="absolute top-3 right-3 z-10 p-2 rounded-full bg-slate-800/80 border border-white/10 hover:bg-slate-700 transition-colors"
              data-testid="button-close-qr-modal"
            >
              <X className="h-4 w-4 text-white/70" />
            </button>

            {/* Header */}
            <div className="px-6 pt-6 pb-4 text-center border-b border-white/10">
              <div className="flex items-center justify-center gap-2 mb-1">
                <BadgeCheck className="h-5 w-5 text-emerald-400" />
                <h2 className="text-lg font-bold text-white">Genesis Hallmark</h2>
              </div>
              <p className="text-emerald-300/70 text-sm">ORB-000000000001 • Solana Mainnet</p>
            </div>

            {/* Content - QR Code with Orby Commander */}
            <div className="p-6">
              <div className="flex items-center justify-center gap-4">
                {/* Orby Commander pointing */}
                <div className="relative flex-shrink-0">
                  <img 
                    src={orbyCommanderImg} 
                    alt="Orby Commander" 
                    className="w-24 h-24 object-contain drop-shadow-[0_0_20px_rgba(6,182,212,0.6)] transform -scale-x-100"
                    data-testid="img-orby-pointer"
                  />
                  {/* Pointing hand indicator */}
                  <div className="absolute top-1/2 -right-2 transform -translate-y-1/2">
                    <div className="text-2xl animate-bounce-horizontal">👉</div>
                  </div>
                </div>

                {/* QR Code */}
                <div className="relative p-3 bg-white rounded-xl shadow-[0_0_30px_rgba(16,185,129,0.4)]">
                  <img 
                    src={QR_CODE_URL}
                    alt="Scan to verify on Solana"
                    className="w-40 h-40"
                    data-testid="img-genesis-qr"
                  />
                  <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 px-2 py-0.5 bg-emerald-500 rounded text-[9px] font-bold text-white uppercase whitespace-nowrap">
                    Scan to Verify
                  </div>
                </div>
              </div>

              {/* Info */}
              <div className="mt-6 p-3 rounded-lg bg-slate-800/50 border border-white/10">
                <p className="text-xs text-slate-400 text-center">
                  This QR code links to the blockchain transaction permanently anchoring Orby Platform on Solana mainnet.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 pb-6">
              <a
                href={GENESIS_HALLMARK_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 text-white font-bold hover:from-emerald-500 hover:to-cyan-500 transition-all duration-300 shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                data-testid="link-open-solscan"
              >
                <ExternalLink className="h-4 w-4" />
                Open on Solscan
              </a>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes bounce-horizontal {
          0%, 100% { transform: translateX(0) translateY(-50%); }
          50% { transform: translateX(4px) translateY(-50%); }
        }
        .animate-bounce-horizontal {
          animation: bounce-horizontal 1s ease-in-out infinite;
        }
      `}</style>
      </div>
    </div>
  );
}
