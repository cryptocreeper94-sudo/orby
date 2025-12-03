import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { 
  Users, Activity, MapPin, Radio, Eye, Package, AlertCircle, 
  CheckCircle2, ClipboardList, MessageSquare, Clock, Wifi, WifiOff,
  FlaskConical, ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';

interface SupervisorSession {
  id: string;
  supervisorId: string;
  supervisorName: string;
  currentStandId: string | null;
  currentStandName: string | null;
  currentSection: string | null;
  status: 'online' | 'away' | 'busy' | 'offline';
  currentTab: string | null;
  isSandbox: boolean;
  lastHeartbeat: string;
  sessionStartedAt: string;
}

interface SupervisorActivity {
  id: string;
  sessionId: string;
  supervisorId: string;
  supervisorName: string;
  kind: string;
  description: string | null;
  standId: string | null;
  standName: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

interface LiveViewData {
  sessions: SupervisorSession[];
  recentActivity: SupervisorActivity[];
}

const statusColors: Record<string, { bg: string; text: string; dot: string }> = {
  online: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', dot: 'bg-emerald-400' },
  away: { bg: 'bg-amber-500/20', text: 'text-amber-400', dot: 'bg-amber-400' },
  busy: { bg: 'bg-red-500/20', text: 'text-red-400', dot: 'bg-red-400' },
  offline: { bg: 'bg-slate-500/20', text: 'text-slate-400', dot: 'bg-slate-400' },
};

const activityIcons: Record<string, React.ReactNode> = {
  login: <Radio className="h-3.5 w-3.5 text-emerald-400" />,
  logout: <WifiOff className="h-3.5 w-3.5 text-slate-400" />,
  stand_selected: <MapPin className="h-3.5 w-3.5 text-blue-400" />,
  tab_changed: <Eye className="h-3.5 w-3.5 text-purple-400" />,
  delivery_requested: <Package className="h-3.5 w-3.5 text-amber-400" />,
  issue_opened: <AlertCircle className="h-3.5 w-3.5 text-red-400" />,
  issue_resolved: <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />,
  count_started: <ClipboardList className="h-3.5 w-3.5 text-cyan-400" />,
  count_completed: <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />,
  message_sent: <MessageSquare className="h-3.5 w-3.5 text-blue-400" />,
  compliance_submitted: <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />,
  facility_issue: <AlertCircle className="h-3.5 w-3.5 text-orange-400" />,
  emergency_alert: <AlertCircle className="h-3.5 w-3.5 text-red-400" />,
};

function formatTimeAgo(dateString: string): string {
  try {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true });
  } catch {
    return 'Just now';
  }
}

function SupervisorCard({ session }: { session: SupervisorSession }) {
  const colors = statusColors[session.status] || statusColors.offline;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={cn(
        "p-3 rounded-xl border transition-all",
        "bg-slate-800/60 border-slate-700/50 hover:border-slate-600/50",
        "hover:shadow-lg hover:shadow-cyan-500/5"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="relative">
            <div className={cn(
              "w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm",
              colors.bg, colors.text
            )}>
              {session.supervisorName.charAt(0).toUpperCase()}
            </div>
            <div className={cn(
              "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-slate-800",
              colors.dot
            )} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-medium text-white text-sm">{session.supervisorName}</span>
              {session.isSandbox && (
                <FlaskConical className="h-3 w-3 text-cyan-400" />
              )}
            </div>
            <div className="flex items-center gap-1 text-xs text-slate-400">
              <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0", colors.bg, colors.text)}>
                {session.status.toUpperCase()}
              </Badge>
            </div>
          </div>
        </div>
      </div>
      
      {session.currentStandName && (
        <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-300 bg-slate-700/30 rounded-lg px-2 py-1.5">
          <MapPin className="h-3 w-3 text-cyan-400" />
          <span className="font-medium">{session.currentStandName}</span>
          {session.currentSection && (
            <>
              <ChevronRight className="h-3 w-3 text-slate-500" />
              <span className="text-slate-400">{session.currentSection}</span>
            </>
          )}
        </div>
      )}
      
      {session.currentTab && (
        <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-slate-500">
          <Eye className="h-3 w-3" />
          <span>Viewing: {session.currentTab}</span>
        </div>
      )}
      
      <div className="mt-2 flex items-center gap-1 text-[10px] text-slate-500">
        <Clock className="h-3 w-3" />
        <span>Last active {formatTimeAgo(session.lastHeartbeat)}</span>
      </div>
    </motion.div>
  );
}

function ActivityItem({ activity }: { activity: SupervisorActivity }) {
  const icon = activityIcons[activity.kind] || <Activity className="h-3.5 w-3.5 text-slate-400" />;
  
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-start gap-2 py-2 border-b border-slate-700/30 last:border-0"
    >
      <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center flex-shrink-0 mt-0.5">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="font-medium text-white text-xs">{activity.supervisorName}</span>
          {activity.standName && (
            <Badge variant="outline" className="text-[9px] px-1 py-0 bg-slate-700/30 text-slate-300">
              {activity.standName}
            </Badge>
          )}
        </div>
        <p className="text-xs text-slate-400 truncate">{activity.description || activity.kind.replace(/_/g, ' ')}</p>
        <span className="text-[10px] text-slate-500">{formatTimeAgo(activity.createdAt)}</span>
      </div>
    </motion.div>
  );
}

export function SupervisorLiveWall({ className }: { className?: string }) {
  const { data, isLoading } = useQuery<LiveViewData>({
    queryKey: ['supervisor-live'],
    queryFn: async () => {
      const res = await fetch('/api/supervisor-live');
      if (!res.ok) throw new Error('Failed to fetch supervisor live view');
      return res.json();
    },
    refetchInterval: 10000,
  });

  const onlineSupervisors = data?.sessions?.filter(s => s.status !== 'offline') || [];
  const recentActivity = data?.recentActivity || [];

  return (
    <Card className={cn("bg-slate-900/50 border-slate-700/50", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center">
              <Users className="h-4 w-4 text-white" />
            </div>
            <div>
              <span className="text-base font-bold text-white">Supervisor Live View</span>
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <Wifi className="h-3 w-3 text-emerald-400" />
                <span>{onlineSupervisors.length} online</span>
                <span className="text-slate-600">•</span>
                <span>Updates every 10s</span>
              </div>
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                <Radio className="h-3.5 w-3.5 text-emerald-400" />
                Active Supervisors
              </h4>
              {onlineSupervisors.length === 0 ? (
                <div className="text-center py-6 text-slate-500 text-sm">
                  <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No supervisors online</p>
                </div>
              ) : (
                <ScrollArea className="h-[280px] pr-2">
                  <div className="space-y-2">
                    <AnimatePresence mode="popLayout">
                      {onlineSupervisors.map(session => (
                        <SupervisorCard key={session.id} session={session} />
                      ))}
                    </AnimatePresence>
                  </div>
                </ScrollArea>
              )}
            </div>
            
            <div>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                <Activity className="h-3.5 w-3.5 text-purple-400" />
                Recent Activity
              </h4>
              {recentActivity.length === 0 ? (
                <div className="text-center py-6 text-slate-500 text-sm">
                  <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No recent activity</p>
                </div>
              ) : (
                <ScrollArea className="h-[280px] pr-2">
                  <div>
                    <AnimatePresence mode="popLayout">
                      {recentActivity.slice(0, 15).map(activity => (
                        <ActivityItem key={activity.id} activity={activity} />
                      ))}
                    </AnimatePresence>
                  </div>
                </ScrollArea>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
