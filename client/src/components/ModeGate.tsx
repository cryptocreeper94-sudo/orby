import { useMode } from '@/lib/ModeContext';
import { Shield, FlaskConical, Radio, Users, AlertTriangle, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ModeGateProps {
  onModeSelected: () => void;
}

export function ModeGate({ onModeSelected }: ModeGateProps) {
  const { enterSandbox, exitSandbox, mode } = useMode();

  const handleLiveMode = () => {
    exitSandbox();
    onModeSelected();
  };

  const handleSandboxMode = () => {
    enterSandbox('/');
    onModeSelected();
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-cyan-900 to-slate-800 p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <div className="w-24 h-24 mx-auto mb-4 relative">
            <div className="absolute inset-0 bg-cyan-400/25 rounded-full blur-2xl animate-pulse" />
            <img 
              src="/orby-mascot.png" 
              alt="Orby" 
              className="relative w-24 h-24 object-contain drop-shadow-[0_0_25px_rgba(6,182,212,0.8)]"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
          <h1 className="text-3xl font-black text-white mb-2">Welcome to Orby</h1>
          <p className="text-cyan-200/70 text-sm">Select your mode before continuing</p>
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
  );
}
