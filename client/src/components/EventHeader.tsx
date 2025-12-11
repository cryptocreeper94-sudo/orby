import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Calendar, Clock, Users, MapPin, Radio, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { ActiveEvent } from '@shared/schema';

interface EventHeaderProps {
  compact?: boolean;
  showDepartmentNotes?: string;
}

export function EventHeader({ compact = false, showDepartmentNotes }: EventHeaderProps) {
  const { data: activeEvent, isLoading } = useQuery<ActiveEvent | null>({
    queryKey: ['/api/active-events/current'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/active-events/current');
        if (response.ok) {
          return response.json();
        }
        return null;
      } catch {
        return null;
      }
    },
    refetchInterval: 30000,
  });

  if (isLoading) {
    return (
      <div className="h-12 bg-slate-800/50 rounded-lg animate-pulse" data-testid="event-header-loading" />
    );
  }

  if (!activeEvent) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 mb-4"
        data-testid="event-header-sandbox"
      >
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-400" />
          <span className="text-sm text-amber-300 font-medium">Sandbox Mode</span>
          <span className="text-xs text-slate-400 ml-2">No active event - data will not be saved</span>
        </div>
      </motion.div>
    );
  }

  const departmentNotes = activeEvent.departmentNotes as Array<{ department: string; note: string }> | null;
  const relevantNotes = departmentNotes?.filter(
    n => n.department === 'All' || n.department === showDepartmentNotes
  ) || [];

  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-cyan-500/30 rounded-lg p-2 mb-3"
        data-testid="event-header-compact"
      >
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
            <span className="text-sm font-semibold text-white">{activeEvent.eventName}</span>
            <Badge className="bg-emerald-500/20 text-emerald-400 border-0 text-[10px]">LIVE</Badge>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {new Date(activeEvent.eventDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </span>
            {activeEvent.expectedAttendance && (
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                {activeEvent.expectedAttendance.toLocaleString()}
              </span>
            )}
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-cyan-500/10 via-slate-800/50 to-purple-500/10 border border-cyan-500/30 rounded-xl p-4 mb-4 backdrop-blur-sm"
      data-testid="event-header"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-cyan-500/20">
            <Radio className="w-5 h-5 text-cyan-400 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-white">{activeEvent.eventName}</h3>
              <Badge className="bg-emerald-500/20 text-emerald-400 border-0">LIVE</Badge>
            </div>
            <p className="text-xs text-slate-400">
              {new Date(activeEvent.eventDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-sm">
          {activeEvent.doorsOpenTime && (
            <div className="flex items-center gap-1.5 text-slate-300">
              <Clock className="w-4 h-4 text-cyan-400" />
              <span>Doors: {activeEvent.doorsOpenTime}</span>
            </div>
          )}
          {activeEvent.eventStartTime && (
            <div className="flex items-center gap-1.5 text-slate-300">
              <Clock className="w-4 h-4 text-emerald-400" />
              <span>Start: {activeEvent.eventStartTime}</span>
            </div>
          )}
          {activeEvent.expectedAttendance && (
            <div className="flex items-center gap-1.5 text-slate-300">
              <Users className="w-4 h-4 text-purple-400" />
              <span>{activeEvent.expectedAttendance.toLocaleString()} expected</span>
            </div>
          )}
          {activeEvent.geofenceMode && (
            <div className="flex items-center gap-1.5 text-slate-300">
              <MapPin className="w-4 h-4 text-amber-400" />
              <span className="capitalize">{activeEvent.geofenceMode}</span>
            </div>
          )}
        </div>
      </div>

      {relevantNotes.length > 0 && (
        <div className="mt-3 pt-3 border-t border-white/10">
          <div className="flex flex-wrap gap-2">
            {relevantNotes.map((note, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2 px-3 py-2 rounded-lg bg-slate-800/50 border border-white/5"
              >
                <AlertCircle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="text-xs text-slate-500 uppercase">{note.department}</span>
                  <p className="text-sm text-slate-300">{note.note}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
