import { useState, useMemo } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  Clock,
  Users,
  ChevronDown,
  ChevronUp,
  BarChart3,
  TrendingUp,
  Activity,
  CheckCircle2,
  XCircle,
  PlayCircle,
  ClipboardList,
  Building2,
  MessageSquare
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  AnimatedBackground,
  PageHeader,
  SectionHeader
} from '@/components/ui/premium';
import { LayoutShell, BentoCard } from '@/components/ui/bento';
import type { ActiveEvent } from '@shared/schema';

interface DepartmentNote {
  department: string;
  note: string;
}

const STATUS_CONFIG: Record<string, { icon: React.ElementType; bg: string; text: string; border: string }> = {
  completed: { icon: CheckCircle2, bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  cancelled: { icon: XCircle, bg: 'bg-rose-500/20', text: 'text-rose-400', border: 'border-rose-500/30' },
  active: { icon: PlayCircle, bg: 'bg-cyan-500/20', text: 'text-cyan-400', border: 'border-cyan-500/30' },
  scheduled: { icon: Clock, bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/30' }
};

const DEPARTMENT_COLORS: Record<string, string> = {
  IT: 'text-blue-400',
  Kitchen: 'text-orange-400',
  Warehouse: 'text-emerald-400',
  Operations: 'text-cyan-400',
  All: 'text-slate-400',
  HR: 'text-pink-400',
  Bar: 'text-purple-400'
};

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return 'N/A';
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

function formatTime(timestamp: string | Date | null | undefined): string {
  if (!timestamp) return 'N/A';
  try {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  } catch {
    return 'N/A';
  }
}

function EventRow({ event, isExpanded, onToggle }: { 
  event: ActiveEvent; 
  isExpanded: boolean; 
  onToggle: () => void;
}) {
  const status = event.status || 'scheduled';
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.scheduled;
  const StatusIcon = config.icon;
  const departmentNotes = (event.departmentNotes as DepartmentNote[]) || [];
  const hasNotes = departmentNotes.length > 0;

  return (
    <div 
      className="bg-slate-800/40 border border-slate-700/50 rounded-lg overflow-hidden"
      data-testid={`event-row-${event.id}`}
    >
      <div 
        className={`p-4 flex items-center justify-between cursor-pointer hover:bg-slate-700/30 transition-colors ${hasNotes ? '' : 'cursor-default'}`}
        onClick={hasNotes ? onToggle : undefined}
        data-testid={`event-row-toggle-${event.id}`}
      >
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-center">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-cyan-400 flex-shrink-0" />
            <div>
              <div className="text-sm font-medium text-white" data-testid={`event-name-${event.id}`}>{event.eventName}</div>
              <div className="text-xs text-slate-400" data-testid={`event-date-${event.id}`}>{formatDate(event.eventDate)}</div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <div>
              <div className="text-sm text-slate-300" data-testid={`event-attendance-${event.id}`}>
                {event.expectedAttendance?.toLocaleString() || 'N/A'}
              </div>
              <div className="text-xs text-slate-500">Expected</div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-violet-400 flex-shrink-0" />
            <div>
              <div className="text-sm text-slate-300" data-testid={`event-activated-by-${event.id}`}>
                {event.activatedByName || 'System'}
              </div>
              <div className="text-xs text-slate-500">Activated By</div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <div>
              <div className="text-sm text-slate-300" data-testid={`event-activation-time-${event.id}`}>
                {formatTime(event.activatedAt)}
              </div>
              <div className="text-xs text-slate-500">Activation Time</div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge 
              className={`${config.bg} ${config.text} ${config.border} border capitalize flex items-center gap-1`}
              data-testid={`event-status-${event.id}`}
            >
              <StatusIcon className="w-3 h-3" />
              {status}
            </Badge>
          </div>
        </div>
        
        {hasNotes && (
          <div className="ml-3 text-slate-400">
            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </div>
        )}
      </div>
      
      <AnimatePresence>
        {isExpanded && hasNotes && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-slate-700/50"
            data-testid={`event-notes-${event.id}`}
          >
            <div className="p-4 bg-slate-900/50">
              <div className="flex items-center gap-2 mb-3">
                <MessageSquare className="w-4 h-4 text-cyan-400" />
                <span className="text-sm font-medium text-slate-300">Department Notes</span>
              </div>
              <div className="space-y-2">
                {departmentNotes.map((note, idx) => (
                  <div 
                    key={idx} 
                    className="flex items-start gap-3 p-2 rounded bg-slate-800/60"
                    data-testid={`department-note-${event.id}-${idx}`}
                  >
                    <Badge className={`${DEPARTMENT_COLORS[note.department] || 'text-slate-400'} bg-slate-700/50 border-none text-xs`}>
                      {note.department}
                    </Badge>
                    <span className="text-sm text-slate-300">{note.note}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function EventHistory() {
  const [, setLocation] = useLocation();
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);

  const { data: events = [], isLoading } = useQuery<ActiveEvent[]>({
    queryKey: ['/api/active-events'],
    queryFn: async () => {
      const response = await fetch('/api/active-events');
      if (!response.ok) throw new Error('Failed to fetch events');
      return response.json();
    }
  });

  const metrics = useMemo(() => {
    if (!events.length) return { total: 0, completed: 0, cancelled: 0, active: 0, avgAttendance: 0 };
    
    const completed = events.filter(e => e.status === 'completed').length;
    const cancelled = events.filter(e => e.status === 'cancelled').length;
    const active = events.filter(e => e.status === 'active').length;
    
    const attendanceValues = events
      .map(e => e.expectedAttendance)
      .filter((a): a is number => typeof a === 'number' && a > 0);
    
    const avgAttendance = attendanceValues.length > 0
      ? Math.round(attendanceValues.reduce((a, b) => a + b, 0) / attendanceValues.length)
      : 0;
    
    return { total: events.length, completed, cancelled, active, avgAttendance };
  }, [events]);

  const sortedEvents = useMemo(() => {
    return [...events].sort((a, b) => {
      const dateA = a.eventDate ? new Date(a.eventDate).getTime() : 0;
      const dateB = b.eventDate ? new Date(b.eventDate).getTime() : 0;
      return dateB - dateA;
    });
  }, [events]);

  const toggleExpand = (eventId: string) => {
    setExpandedEventId(prev => prev === eventId ? null : eventId);
  };

  return (
    <AnimatedBackground>
      <div className="min-h-screen pb-20" data-testid="event-history-page">
        <PageHeader
          title="Event History"
          subtitle="View past events and performance metrics"
          backAction={() => setLocation('/command-center')}
        />

        <LayoutShell className="px-4 max-w-7xl mx-auto">
          <BentoCard span={12} data-testid="bento-summary-metrics">
            <SectionHeader
              title="Summary Metrics"
              subtitle="Overall event statistics"
              icon={<BarChart3 className="w-4 h-4" />}
            />
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3 mt-4">
              <div className="p-3 rounded-lg bg-slate-700/40 border border-slate-600/30" data-testid="metric-total-events">
                <div className="flex items-center gap-2 mb-1">
                  <ClipboardList className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs text-slate-400">Total Events</span>
                </div>
                <div className="text-2xl font-bold text-white">{metrics.total}</div>
              </div>
              
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30" data-testid="metric-completed">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs text-emerald-400">Completed</span>
                </div>
                <div className="text-2xl font-bold text-emerald-400">{metrics.completed}</div>
              </div>
              
              <div className="p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/30" data-testid="metric-active">
                <div className="flex items-center gap-2 mb-1">
                  <Activity className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs text-cyan-400">Active</span>
                </div>
                <div className="text-2xl font-bold text-cyan-400">{metrics.active}</div>
              </div>
              
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30" data-testid="metric-cancelled">
                <div className="flex items-center gap-2 mb-1">
                  <XCircle className="w-4 h-4 text-rose-400" />
                  <span className="text-xs text-rose-400">Cancelled</span>
                </div>
                <div className="text-2xl font-bold text-rose-400">{metrics.cancelled}</div>
              </div>
              
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 col-span-2 sm:col-span-1" data-testid="metric-avg-attendance">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="w-4 h-4 text-amber-400" />
                  <span className="text-xs text-amber-400">Avg Attendance</span>
                </div>
                <div className="text-2xl font-bold text-amber-400">{metrics.avgAttendance.toLocaleString()}</div>
              </div>
            </div>
          </BentoCard>

          <BentoCard span={12} data-testid="bento-event-list">
            <SectionHeader
              title="All Events"
              subtitle={`${sortedEvents.length} events recorded`}
              icon={<Calendar className="w-4 h-4" />}
            />
            <div className="mt-4 space-y-2">
              {isLoading ? (
                <div className="text-center py-8 text-slate-400" data-testid="loading-indicator">
                  Loading events...
                </div>
              ) : sortedEvents.length === 0 ? (
                <div className="text-center py-8 text-slate-400" data-testid="no-events">
                  No events found
                </div>
              ) : (
                sortedEvents.map((event) => (
                  <EventRow
                    key={event.id}
                    event={event}
                    isExpanded={expandedEventId === event.id}
                    onToggle={() => toggleExpand(event.id)}
                  />
                ))
              )}
            </div>
          </BentoCard>
        </LayoutShell>
      </div>
    </AnimatedBackground>
  );
}
