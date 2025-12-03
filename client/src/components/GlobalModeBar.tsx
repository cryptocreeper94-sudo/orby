import { useMode } from '@/lib/ModeContext';
import { FlaskConical, Radio, X, ArrowLeftRight, Calendar, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface GlobalModeBarProps {
  className?: string;
}

export function GlobalModeBar({ className }: GlobalModeBarProps) {
  const { isSandbox, isLive, isEventActive, activeEvent, exitSandbox, enterSandbox } = useMode();

  if (isSandbox) {
    return (
      <div 
        className={cn(
          "w-full text-white px-4 py-2.5 shadow-lg",
          isEventActive 
            ? "bg-gradient-to-r from-cyan-600 via-teal-500 to-cyan-600 shadow-cyan-500/30" 
            : "bg-gradient-to-r from-orange-600 via-amber-500 to-orange-600 shadow-orange-500/30",
          className
        )} 
        data-testid="global-mode-bar-sandbox"
      >
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                {isEventActive ? (
                  <FlaskConical className="h-5 w-5 animate-pulse" />
                ) : (
                  <AlertTriangle className="h-5 w-5" />
                )}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-sm tracking-wide">SANDBOX MODE</span>
                <span className={cn(
                  "px-1.5 py-0.5 rounded text-[10px] font-bold uppercase",
                  isEventActive ? "bg-white/20" : "bg-red-500/30"
                )}>
                  {isEventActive ? 'Training' : 'No Event'}
                </span>
              </div>
              <span className={cn(
                "text-xs",
                isEventActive ? "text-cyan-100" : "text-orange-100"
              )}>
                {isEventActive 
                  ? 'Demo data only - changes won\'t affect live operations'
                  : 'No active event - Manager must activate event for live mode'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isEventActive && (
              <Button
                variant="ghost"
                size="sm"
                onClick={exitSandbox}
                className="text-white hover:bg-white/20 h-8 px-3 font-semibold"
                data-testid="button-switch-to-live"
              >
                <ArrowLeftRight className="h-4 w-4 mr-1.5" />
                <span className="hidden sm:inline">Go Live</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={cn(
        "w-full bg-gradient-to-r from-emerald-600 via-green-500 to-emerald-600 text-white px-4 py-2.5 shadow-lg shadow-emerald-500/30",
        className
      )} 
      data-testid="global-mode-bar-live"
    >
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
              <Radio className="h-5 w-5" />
            </div>
            <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-white rounded-full animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-sm tracking-wide">LIVE OPERATIONS</span>
              <span className="px-1.5 py-0.5 rounded bg-white/20 text-[10px] font-bold uppercase">Production</span>
            </div>
            <span className="text-emerald-100 text-xs flex items-center gap-1.5">
              {activeEvent ? (
                <>
                  <Calendar className="h-3 w-3" />
                  {activeEvent.eventName}
                </>
              ) : (
                'Connected to real venue operations'
              )}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => enterSandbox()}
            className="text-white hover:bg-white/20 h-8 px-3 font-semibold"
            data-testid="button-switch-to-sandbox"
          >
            <FlaskConical className="h-4 w-4 mr-1.5" />
            <span className="hidden sm:inline">Sandbox</span>
          </Button>
        </div>
      </div>
    </div>
  );
}

export function CompactModeIndicator({ className }: { className?: string }) {
  const { isSandbox, isLive } = useMode();

  if (isSandbox) {
    return (
      <div className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full",
        "bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 text-xs font-bold",
        className
      )} data-testid="compact-mode-sandbox">
        <FlaskConical className="h-3.5 w-3.5" />
        <span>SANDBOX</span>
      </div>
    );
  }

  return (
    <div className={cn(
      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full",
      "bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold",
      className
    )} data-testid="compact-mode-live">
      <Radio className="h-3.5 w-3.5" />
      <span>LIVE</span>
      <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
    </div>
  );
}
