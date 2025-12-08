import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, 
  Clock, 
  Users, 
  Play, 
  Square, 
  Plus,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Radio,
  Zap,
  RefreshCw,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import type { ActiveEvent } from '@shared/schema';

interface SystemStatus {
  isLive: boolean;
  mode: 'live' | 'sandbox';
  activeEvent: ActiveEvent | null;
  message: string;
}

interface EventControlPanelProps {
  userPin: string;
  userId: string;
  userName: string;
}

export function EventControlPanel({ userPin, userId, userName }: EventControlPanelProps) {
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [events, setEvents] = useState<ActiveEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isActivating, setIsActivating] = useState(false);
  const [newEvent, setNewEvent] = useState({
    eventName: '',
    eventDate: new Date().toISOString().split('T')[0],
    eventType: 'standard',
    doorsOpenTime: '',
    eventStartTime: '',
    eventEndTime: '',
    expectedAttendance: 0,
    notes: ''
  });

  const HIDDEN_FULL_ACCESS_PINS = ['0424', '444']; // Jason (dev) & Sid - hidden full access
  const EVENT_ADMIN_PINS = ['2424', ...HIDDEN_FULL_ACCESS_PINS]; // David + hidden
  const isAuthorized = EVENT_ADMIN_PINS.includes(userPin);

  useEffect(() => {
    if (isAuthorized) {
      loadSystemStatus();
      loadEvents();
    }
  }, [isAuthorized]);

  async function loadSystemStatus() {
    try {
      const res = await fetch('/api/system-status');
      if (res.ok) {
        const data = await res.json();
        setSystemStatus(data);
      }
    } catch (error) {
      console.error('Failed to load system status:', error);
    }
  }

  async function loadEvents() {
    try {
      setIsLoading(true);
      const res = await fetch('/api/events');
      if (res.ok) {
        const data = await res.json();
        setEvents(data);
      }
    } catch (error) {
      console.error('Failed to load events:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCreateEvent(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newEvent, userPin })
      });
      if (res.ok) {
        setShowCreateForm(false);
        setNewEvent({
          eventName: '',
          eventDate: new Date().toISOString().split('T')[0],
          eventType: 'standard',
          doorsOpenTime: '',
          eventStartTime: '',
          eventEndTime: '',
          expectedAttendance: 0,
          notes: ''
        });
        loadEvents();
      }
    } catch (error) {
      console.error('Failed to create event:', error);
    }
  }

  async function handleActivateEvent(eventId: string) {
    try {
      setIsActivating(true);
      const res = await fetch(`/api/events/${eventId}/activate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userPin, userId, userName })
      });
      if (res.ok) {
        await loadSystemStatus();
        await loadEvents();
      }
    } catch (error) {
      console.error('Failed to activate event:', error);
    } finally {
      setIsActivating(false);
    }
  }

  async function handleDeactivateEvent(eventId: string) {
    try {
      setIsActivating(true);
      const res = await fetch(`/api/events/${eventId}/deactivate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userPin, userId, userName })
      });
      if (res.ok) {
        await loadSystemStatus();
        await loadEvents();
      }
    } catch (error) {
      console.error('Failed to deactivate event:', error);
    } finally {
      setIsActivating(false);
    }
  }

  if (!isAuthorized) {
    return null;
  }

  const scheduledEvents = events.filter(e => e.status === 'scheduled');
  const activeEvent = events.find(e => e.status === 'active');

  return (
    <div className="space-y-4">
      <div 
        className={cn(
          "rounded-xl p-4 border transition-all duration-300",
          systemStatus?.isLive 
            ? "bg-gradient-to-br from-green-900/30 to-emerald-900/20 border-green-500/30" 
            : "bg-gradient-to-br from-orange-900/30 to-amber-900/20 border-orange-500/30"
        )}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center",
              systemStatus?.isLive 
                ? "bg-green-500/20 ring-2 ring-green-400 ring-offset-2 ring-offset-slate-900" 
                : "bg-orange-500/20 ring-2 ring-orange-400 ring-offset-2 ring-offset-slate-900"
            )}>
              {systemStatus?.isLive ? (
                <Radio className="h-6 w-6 text-green-400 animate-pulse" />
              ) : (
                <AlertTriangle className="h-6 w-6 text-orange-400" />
              )}
            </div>
            <div>
              <div className={cn(
                "text-sm font-bold uppercase tracking-wider",
                systemStatus?.isLive ? "text-green-400" : "text-orange-400"
              )}>
                {systemStatus?.isLive ? 'LIVE MODE' : 'SANDBOX MODE'}
              </div>
              <div className="text-xs text-slate-400">
                {systemStatus?.message || 'Loading...'}
              </div>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => { loadSystemStatus(); loadEvents(); }}
            className="text-slate-400 hover:text-white"
            data-testid="button-refresh-status"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        {activeEvent && (
          <div className="mt-3 p-3 rounded-lg bg-slate-900/50 border border-green-500/20">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-green-400">{activeEvent.eventName}</div>
                <div className="text-xs text-slate-400 flex items-center gap-2 mt-1">
                  <Calendar className="h-3 w-3" /> {activeEvent.eventDate}
                  {activeEvent.eventStartTime && (
                    <><Clock className="h-3 w-3 ml-2" /> {activeEvent.eventStartTime}</>
                  )}
                  {activeEvent.expectedAttendance && (
                    <><Users className="h-3 w-3 ml-2" /> {activeEvent.expectedAttendance.toLocaleString()}</>
                  )}
                </div>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleDeactivateEvent(activeEvent.id)}
                disabled={isActivating}
                className="bg-red-600 hover:bg-red-700"
                data-testid="button-end-event"
              >
                <Square className="h-4 w-4 mr-1" />
                End Event
              </Button>
            </div>
          </div>
        )}
      </div>

      <AnimatePresence mode="wait">
        {showCreateForm ? (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <form onSubmit={handleCreateEvent} className="space-y-4 p-4 rounded-xl bg-slate-800/50 border border-cyan-500/20">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-cyan-400">Create New Event</h3>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowCreateForm(false)}
                  className="text-slate-400"
                >
                  <XCircle className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <Label className="text-xs text-slate-400">Event Name</Label>
                  <Input
                    value={newEvent.eventName}
                    onChange={(e) => setNewEvent({ ...newEvent, eventName: e.target.value })}
                    placeholder="e.g., Titans vs. Bears"
                    className="bg-slate-900/50 border-slate-700 text-white"
                    required
                    data-testid="input-event-name"
                  />
                </div>

                <div>
                  <Label className="text-xs text-slate-400">Event Date</Label>
                  <Input
                    type="date"
                    value={newEvent.eventDate}
                    onChange={(e) => setNewEvent({ ...newEvent, eventDate: e.target.value })}
                    className="bg-slate-900/50 border-slate-700 text-white"
                    required
                    data-testid="input-event-date"
                  />
                </div>

                <div>
                  <Label className="text-xs text-slate-400">Event Type</Label>
                  <select
                    value={newEvent.eventType}
                    onChange={(e) => setNewEvent({ ...newEvent, eventType: e.target.value })}
                    className="w-full h-9 rounded-md border border-slate-700 bg-slate-900/50 px-3 text-sm text-white"
                    data-testid="select-event-type"
                  >
                    <option value="standard">Standard Game</option>
                    <option value="concert">Concert</option>
                    <option value="special">Special Event</option>
                  </select>
                </div>

                <div>
                  <Label className="text-xs text-slate-400">Doors Open</Label>
                  <Input
                    type="time"
                    value={newEvent.doorsOpenTime}
                    onChange={(e) => setNewEvent({ ...newEvent, doorsOpenTime: e.target.value })}
                    className="bg-slate-900/50 border-slate-700 text-white"
                    data-testid="input-doors-open"
                  />
                </div>

                <div>
                  <Label className="text-xs text-slate-400">Event Start</Label>
                  <Input
                    type="time"
                    value={newEvent.eventStartTime}
                    onChange={(e) => setNewEvent({ ...newEvent, eventStartTime: e.target.value })}
                    className="bg-slate-900/50 border-slate-700 text-white"
                    data-testid="input-event-start"
                  />
                </div>

                <div>
                  <Label className="text-xs text-slate-400">Event End</Label>
                  <Input
                    type="time"
                    value={newEvent.eventEndTime}
                    onChange={(e) => setNewEvent({ ...newEvent, eventEndTime: e.target.value })}
                    className="bg-slate-900/50 border-slate-700 text-white"
                    data-testid="input-event-end"
                  />
                </div>

                <div>
                  <Label className="text-xs text-slate-400">Expected Attendance</Label>
                  <Input
                    type="number"
                    value={newEvent.expectedAttendance || ''}
                    onChange={(e) => setNewEvent({ ...newEvent, expectedAttendance: parseInt(e.target.value) || 0 })}
                    placeholder="65,000"
                    className="bg-slate-900/50 border-slate-700 text-white"
                    data-testid="input-attendance"
                  />
                </div>

                <div className="col-span-2">
                  <Label className="text-xs text-slate-400">Notes</Label>
                  <Input
                    value={newEvent.notes}
                    onChange={(e) => setNewEvent({ ...newEvent, notes: e.target.value })}
                    placeholder="Optional notes..."
                    className="bg-slate-900/50 border-slate-700 text-white"
                    data-testid="input-notes"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500"
                  data-testid="button-create-event"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Create Event
                </Button>
              </div>
            </form>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <Button
              onClick={() => setShowCreateForm(true)}
              variant="outline"
              className="w-full border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/10"
              data-testid="button-show-create-form"
            >
              <Plus className="h-4 w-4 mr-2" />
              Schedule New Event
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {scheduledEvents.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Scheduled Events</h3>
          {scheduledEvents.map((event) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50 hover:border-cyan-500/30 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="text-sm font-medium text-white">{event.eventName}</div>
                  <div className="text-xs text-slate-400 flex items-center gap-3 mt-1">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> {event.eventDate}
                    </span>
                    {event.eventStartTime && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {event.eventStartTime}
                      </span>
                    )}
                    {event.expectedAttendance && event.expectedAttendance > 0 && (
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" /> {event.expectedAttendance.toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={() => handleActivateEvent(event.id)}
                  disabled={isActivating || !!activeEvent}
                  className={cn(
                    "transition-all",
                    activeEvent 
                      ? "bg-slate-700 text-slate-400 cursor-not-allowed"
                      : "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500"
                  )}
                  data-testid={`button-activate-${event.id}`}
                >
                  <Play className="h-4 w-4 mr-1" />
                  {activeEvent ? 'Event Active' : 'Go Live'}
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {!activeEvent && scheduledEvents.length === 0 && !isLoading && (
        <div className="text-center p-6 rounded-xl bg-slate-800/30 border border-dashed border-slate-700">
          <Calendar className="h-8 w-8 mx-auto text-slate-500 mb-2" />
          <p className="text-sm text-slate-400">No events scheduled</p>
          <p className="text-xs text-slate-500 mt-1">Create an event to activate live mode</p>
        </div>
      )}

      <div className="text-[10px] text-slate-500 space-y-1 mt-4 p-3 rounded-lg bg-slate-900/30">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500"></span>
          <span>LIVE MODE: All data is saved to production database</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-orange-500"></span>
          <span>SANDBOX MODE: Training mode - no data is permanently saved</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-500"></span>
          <span>Only Event Admin (David) can activate events</span>
        </div>
      </div>
    </div>
  );
}
