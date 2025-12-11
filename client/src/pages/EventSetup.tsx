import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  Clock,
  Users,
  MapPin,
  Save,
  ArrowRight,
  Settings,
  FileText,
  Phone,
  AlertCircle,
  CheckCircle2,
  Circle,
  Scan,
  Grid3X3,
  Navigation,
  Shield,
  ChefHat,
  Wrench,
  Monitor,
  Warehouse,
  MessageSquare,
  Target,
  ToggleLeft,
  ToggleRight,
  Building2,
  Expand,
  CloudSun,
  Wine,
  Info,
  ClipboardCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useStore } from '@/lib/mockData';
import {
  AnimatedBackground,
  GlassCard,
  PageHeader,
  SectionHeader,
  GlowButton,
  StatCard
} from '@/components/ui/premium';
import { LayoutShell, BentoCard, CarouselRail, AccordionStack } from '@/components/ui/bento';
import type { ActiveEvent } from '@shared/schema';

interface DepartmentNote {
  department: 'IT' | 'Kitchen' | 'Warehouse' | 'Operations' | 'All';
  note: string;
}

interface EventFormData {
  eventName: string;
  eventDate: string;
  eventType: string;
  doorsOpenTime: string;
  eventStartTime: string;
  eventEndTime: string;
  expectedAttendance: number;
  alcoholCutoffTime: string;
  notes: string;
  departmentNotes: DepartmentNote[];
  geofenceMode: 'stadium' | 'custom';
  customGeofenceRadius: number;
  staffingGridEnabled: boolean;
}

const DEPARTMENT_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  IT: { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/30' },
  Kitchen: { bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500/30' },
  Warehouse: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  Operations: { bg: 'bg-cyan-500/20', text: 'text-cyan-400', border: 'border-cyan-500/30' },
  All: { bg: 'bg-slate-500/20', text: 'text-slate-400', border: 'border-slate-500/30' }
};

const IMPORTANT_CONTACTS = [
  { name: 'Warehouse', number: '4543', icon: Warehouse },
  { name: 'AJ (Warehouse)', number: '863.670.5231', icon: Phone },
  { name: 'Jay (Concession)', number: '817-296-6805', icon: Phone },
  { name: 'David (Ops/IT)', number: '615-612-9370', icon: Monitor },
  { name: 'Darby (Beverage)', number: '727-254-9290', icon: Wine },
  { name: 'Brooke (HR)', number: '931-797-4378', icon: Users },
];

export default function EventSetup() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const currentUser = useStore((state) => state.currentUser);
  
  const [formData, setFormData] = useState<EventFormData>({
    eventName: '',
    eventDate: new Date().toISOString().split('T')[0],
    eventType: 'standard',
    doorsOpenTime: '10:00',
    eventStartTime: '12:00',
    eventEndTime: '17:00',
    expectedAttendance: 60000,
    alcoholCutoffTime: '',
    notes: '',
    departmentNotes: [],
    geofenceMode: 'stadium',
    customGeofenceRadius: 500,
    staffingGridEnabled: false,
  });
  
  const [newDeptNote, setNewDeptNote] = useState({ department: 'All' as DepartmentNote['department'], note: '' });
  const [isSaved, setIsSaved] = useState(false);
  const [activeEventId, setActiveEventId] = useState<string | null>(null);
  const [showTemplateMenu, setShowTemplateMenu] = useState(false);
  const [staffingGrid, setStaffingGrid] = useState({
    supervisors: 12,
    leads: 48,
    it: 6,
    kitchen: 24,
    templateName: 'Titans Game Day'
  });

  // Staffing templates for common event types
  const STAFFING_TEMPLATES = [
    { id: 'titans-game', name: 'Titans Game Day', supervisors: 12, leads: 48, it: 6, kitchen: 24 },
    { id: 'concert-large', name: 'Large Concert', supervisors: 15, leads: 60, it: 8, kitchen: 30 },
    { id: 'concert-small', name: 'Small Concert', supervisors: 8, leads: 32, it: 4, kitchen: 16 },
    { id: 'private-event', name: 'Private Event', supervisors: 4, leads: 16, it: 2, kitchen: 8 },
  ];

  const handleUseTemplate = (template: typeof STAFFING_TEMPLATES[0]) => {
    setStaffingGrid({
      supervisors: template.supervisors,
      leads: template.leads,
      it: template.it,
      kitchen: template.kitchen,
      templateName: template.name
    });
    toast({
      title: `Template Applied: ${template.name}`,
      description: `Staffing grid updated with ${template.supervisors} supervisors, ${template.leads} leads, ${template.it} IT, ${template.kitchen} kitchen staff.`,
    });
    setShowTemplateMenu(false);
  };

  // Fetch active event if one exists
  const { data: activeEvent } = useQuery<ActiveEvent | null>({
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
    }
  });

  // Pre-populate form if there's an active event
  useEffect(() => {
    if (activeEvent) {
      setFormData(prev => ({
        ...prev,
        eventName: activeEvent.eventName || '',
        eventDate: activeEvent.eventDate || prev.eventDate,
        eventType: activeEvent.eventType || 'standard',
        doorsOpenTime: activeEvent.doorsOpenTime || '10:00',
        eventStartTime: activeEvent.eventStartTime || '12:00',
        eventEndTime: activeEvent.eventEndTime || '17:00',
        expectedAttendance: activeEvent.expectedAttendance || 60000,
        notes: activeEvent.notes || '',
        geofenceMode: (activeEvent.geofenceMode as 'stadium' | 'custom') || 'stadium',
        customGeofenceRadius: activeEvent.geofenceRadiusFeet || 500,
        staffingGridEnabled: activeEvent.staffingGridEnabled || false,
        departmentNotes: (activeEvent.departmentNotes as DepartmentNote[]) || [],
      }));
      setActiveEventId(activeEvent.id);
      if (activeEvent.status === 'active') {
        setIsSaved(true);
      }
    }
  }, [activeEvent]);

  // Calculate alcohol cutoff (end of 3rd quarter - approximately 2.5 hours before end)
  useEffect(() => {
    if (formData.eventStartTime) {
      const [hours, mins] = formData.eventStartTime.split(':').map(Number);
      const cutoffHours = hours + 2;
      const cutoffMins = mins + 30;
      const finalHours = cutoffHours + Math.floor(cutoffMins / 60);
      const finalMins = cutoffMins % 60;
      setFormData(prev => ({
        ...prev,
        alcoholCutoffTime: `End of 3rd Qtr (~${finalHours}:${finalMins.toString().padStart(2, '0')})`
      }));
    }
  }, [formData.eventStartTime]);

  // Calculate legal drinking age date
  const getLegalDrinkingDate = () => {
    const today = new Date(formData.eventDate || new Date());
    today.setFullYear(today.getFullYear() - 21);
    return today.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
  };

  const saveEventMutation = useMutation({
    mutationFn: async (data: EventFormData) => {
      const payload = {
        eventName: data.eventName,
        eventDate: data.eventDate,
        eventType: data.eventType,
        doorsOpenTime: data.doorsOpenTime,
        eventStartTime: data.eventStartTime,
        eventEndTime: data.eventEndTime,
        expectedAttendance: data.expectedAttendance,
        notes: data.notes,
        geofenceMode: data.geofenceMode,
        geofenceRadiusFeet: data.customGeofenceRadius,
        staffingGridEnabled: data.staffingGridEnabled,
        departmentNotes: data.departmentNotes,
        status: 'active',
        activatedById: currentUser?.id,
        activatedByName: currentUser?.name,
      };
      
      if (activeEventId) {
        return apiRequest('PUT', `/api/active-events/${activeEventId}`, payload);
      }
      return apiRequest('POST', '/api/active-events', payload);
    },
    onSuccess: async (response) => {
      const event = await response.json();
      setActiveEventId(event.id);
      setIsSaved(true);
      queryClient.invalidateQueries({ queryKey: ['/api/active-events'] });
      toast({
        title: 'Event Activated',
        description: `${formData.eventName} is now live. All dashboards updated.`,
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to save event. Please try again.',
        variant: 'destructive',
      });
    }
  });

  const handleSave = () => {
    if (!requiredFieldsComplete) {
      toast({
        title: 'Missing Required Fields',
        description: 'Please complete all required fields before activating.',
        variant: 'destructive',
      });
      return;
    }

    if (!optionalFieldsComplete) {
      const missingOptional = checklistItems
        .filter((item) => !item.isRequired && !item.isComplete)
        .map((item) => item.label);
      toast({
        title: 'Optional Fields Missing',
        description: `Consider adding: ${missingOptional.join(', ')}`,
        variant: 'default',
      });
    }

    saveEventMutation.mutate(formData);
  };

  const addDepartmentNote = () => {
    if (!newDeptNote.note.trim()) return;
    setFormData(prev => ({
      ...prev,
      departmentNotes: [...prev.departmentNotes, { ...newDeptNote }]
    }));
    setNewDeptNote({ department: 'All', note: '' });
  };

  const removeDepartmentNote = (index: number) => {
    setFormData(prev => ({
      ...prev,
      departmentNotes: prev.departmentNotes.filter((_, i) => i !== index)
    }));
  };

  const checklistItems = [
    {
      id: 'event-name',
      label: 'Event name configured',
      isComplete: !!formData.eventName.trim(),
      isRequired: true,
    },
    {
      id: 'event-date',
      label: 'Event date set',
      isComplete: !!formData.eventDate,
      isRequired: true,
    },
    {
      id: 'event-time',
      label: 'Doors/start time set',
      isComplete: !!formData.doorsOpenTime || !!formData.eventStartTime,
      isRequired: true,
    },
    {
      id: 'attendance',
      label: 'Expected attendance',
      isComplete: formData.expectedAttendance > 0,
      isRequired: false,
    },
    {
      id: 'dept-notes',
      label: 'Department notes added',
      isComplete: formData.departmentNotes.length > 0,
      isRequired: false,
    },
  ];

  const requiredFieldsComplete = checklistItems
    .filter((item) => item.isRequired)
    .every((item) => item.isComplete);

  const optionalFieldsComplete = checklistItems
    .filter((item) => !item.isRequired)
    .every((item) => item.isComplete);

  // Access control
  const allowedRoles = ['Developer', 'Admin', 'OperationsManager', 'GeneralManager', 'RegionalVP'];
  if (!currentUser || !allowedRoles.includes(currentUser.role)) {
    return (
      <AnimatedBackground>
        <div className="min-h-screen flex items-center justify-center p-4" data-testid="access-restricted">
          <GlassCard className="max-w-md w-full text-center p-6">
            <Shield className="h-12 w-12 mx-auto mb-4 text-amber-400" />
            <h2 className="text-xl font-bold text-white mb-2">Access Restricted</h2>
            <p className="text-slate-400 mb-4">Event Setup is only available to Operations Managers and above.</p>
            <Button onClick={() => setLocation('/')} variant="outline">Return to Login</Button>
          </GlassCard>
        </div>
      </AnimatedBackground>
    );
  }

  // Metrics for the carousel
  const eventMetrics = [
    <div key="attendance" className="p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/30 w-[130px] flex-shrink-0" data-testid="metric-attendance">
      <div className="text-xs text-cyan-400 mb-1">Expected</div>
      <div className="text-lg font-bold text-cyan-400">{formData.expectedAttendance.toLocaleString()}</div>
      <div className="text-xs text-slate-500">Attendees</div>
    </div>,
    <div key="doors" className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 w-[130px] flex-shrink-0" data-testid="metric-doors">
      <div className="text-xs text-emerald-400 mb-1">Gates</div>
      <div className="text-lg font-bold text-emerald-400">{formData.doorsOpenTime}</div>
      <div className="text-xs text-slate-500">Open Time</div>
    </div>,
    <div key="start" className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 w-[130px] flex-shrink-0" data-testid="metric-start">
      <div className="text-xs text-amber-400 mb-1">Kick Off</div>
      <div className="text-lg font-bold text-amber-400">{formData.eventStartTime}</div>
      <div className="text-xs text-slate-500">Event Start</div>
    </div>,
    <div key="alcohol" className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 w-[130px] flex-shrink-0" data-testid="metric-alcohol">
      <div className="text-xs text-rose-400 mb-1">Alcohol Cut Off</div>
      <div className="text-sm font-bold text-rose-400 truncate">{formData.alcoholCutoffTime || 'End of 3rd Qtr'}</div>
      <div className="text-xs text-slate-500">Last Call</div>
    </div>,
    <div key="geofence" className="p-3 rounded-lg bg-violet-500/10 border border-violet-500/30 w-[130px] flex-shrink-0" data-testid="metric-geofence">
      <div className="text-xs text-violet-400 mb-1">Geofence</div>
      <div className="text-lg font-bold text-violet-400 capitalize">{formData.geofenceMode}</div>
      <div className="text-xs text-slate-500">{formData.geofenceMode === 'custom' ? `${formData.customGeofenceRadius}ft` : 'Default'}</div>
    </div>,
  ];

  // Contact cards for carousel
  const contactCards = IMPORTANT_CONTACTS.map((contact, idx) => (
    <div key={idx} className="p-3 rounded-lg bg-slate-800/80 border border-slate-700/50 min-w-[160px]" data-testid={`contact-${contact.name.toLowerCase().replace(/\s+/g, '-')}`}>
      <div className="flex items-center gap-2 mb-1">
        <contact.icon className="h-4 w-4 text-cyan-400" />
        <span className="text-sm font-medium text-slate-200">{contact.name}</span>
      </div>
      <div className="text-xs text-cyan-400 font-mono">{contact.number}</div>
    </div>
  ));

  return (
    <AnimatedBackground>
      <div className="min-h-screen pb-20" data-testid="event-setup-page">
        <PageHeader
          title="Event Setup"
          subtitle={isSaved ? `${formData.eventName} - Active` : "Configure event details before going live"}
          backAction={() => setLocation('/command-center')}
        />

        <LayoutShell>
          {/* Hero Row - Event Metrics (span-12) */}
          <BentoCard span={12} className="overflow-hidden" data-testid="bento-event-metrics">
            <div className="flex items-center justify-between mb-3">
              <SectionHeader
                title="Event Overview"
                subtitle="Quick metrics"
                icon={<Target className="w-4 h-4" />}
              />
              {isSaved && (
                <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                  <CheckCircle2 className="w-3 h-3 mr-1" /> Active
                </Badge>
              )}
            </div>
            <CarouselRail items={eventMetrics} data-testid="carousel-event-metrics" />
          </BentoCard>

          {/* Event Details Row - Event Info (span-8), Age Verification (span-4) */}
          <BentoCard span={8} className="col-span-12 lg:col-span-8" data-testid="bento-event-info">
            <SectionHeader
              title="Event Information"
              icon={<FileText className="w-4 h-4" />}
            />
            <div className="grid grid-cols-2 gap-4 mt-3">
              <div className="col-span-2">
                <Label className="text-slate-400 text-xs">Event Name / Identifier</Label>
                <Input
                  value={formData.eventName}
                  onChange={(e) => setFormData(prev => ({ ...prev, eventName: e.target.value }))}
                  placeholder="Titans vs Chiefs"
                  className="bg-slate-900/50 border-slate-700 text-white mt-1"
                  data-testid="input-event-name"
                />
              </div>
              <div>
                <Label className="text-slate-400 text-xs">Event Date</Label>
                <Input
                  type="date"
                  value={formData.eventDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, eventDate: e.target.value }))}
                  className="bg-slate-900/50 border-slate-700 text-white mt-1"
                  data-testid="input-event-date"
                />
              </div>
              <div>
                <Label className="text-slate-400 text-xs">Event Type</Label>
                <Select value={formData.eventType} onValueChange={(v) => setFormData(prev => ({ ...prev, eventType: v }))}>
                  <SelectTrigger className="bg-slate-900/50 border-slate-700 text-white mt-1" data-testid="select-event-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">Standard Game</SelectItem>
                    <SelectItem value="concert">Concert</SelectItem>
                    <SelectItem value="special">Special Event</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-slate-400 text-xs">Gates Open</Label>
                <Input
                  type="time"
                  value={formData.doorsOpenTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, doorsOpenTime: e.target.value }))}
                  className="bg-slate-900/50 border-slate-700 text-white mt-1"
                  data-testid="input-doors-open"
                />
              </div>
              <div>
                <Label className="text-slate-400 text-xs">Kick Off / Start Time</Label>
                <Input
                  type="time"
                  value={formData.eventStartTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, eventStartTime: e.target.value }))}
                  className="bg-slate-900/50 border-slate-700 text-white mt-1"
                  data-testid="input-event-start"
                />
              </div>
              <div>
                <Label className="text-slate-400 text-xs">Expected Attendance</Label>
                <Input
                  type="number"
                  value={formData.expectedAttendance}
                  onChange={(e) => setFormData(prev => ({ ...prev, expectedAttendance: parseInt(e.target.value) || 0 }))}
                  className="bg-slate-900/50 border-slate-700 text-white mt-1"
                  data-testid="input-attendance"
                />
              </div>
              <div>
                <Label className="text-slate-400 text-xs">Weather</Label>
                <div className="flex items-center gap-2 mt-1 p-2 rounded bg-slate-900/50 border border-slate-700">
                  <CloudSun className="h-4 w-4 text-amber-400" />
                  <span className="text-sm text-slate-300">High 45°, Showers</span>
                </div>
              </div>
            </div>
          </BentoCard>

          <BentoCard span={4} className="col-span-12 lg:col-span-4" data-testid="bento-age-verification">
            <SectionHeader
              title="Age Verification"
              icon={<Wine className="w-4 h-4" />}
            />
            <div className="mt-3 p-4 rounded-lg bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 text-center">
              <div className="text-xs text-emerald-400 mb-2">Must be born on or before</div>
              <div className="text-2xl font-bold text-white">{getLegalDrinkingDate()}</div>
              <div className="text-xs text-emerald-400 mt-2">to purchase alcohol</div>
            </div>
            <div className="mt-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30">
              <div className="flex items-center gap-2 text-rose-400">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm font-medium">Alcohol cut off at {formData.alcoholCutoffTime || 'End of 3rd Qtr'}</span>
              </div>
            </div>
          </BentoCard>

          {/* Geofence Row - Geofence Config (span-6), Important Contacts (span-6) */}
          <BentoCard span={6} className="col-span-12 md:col-span-6" data-testid="bento-geofence">
            <div className="flex items-center justify-between mb-3">
              <SectionHeader
                title="Geofence Configuration"
                icon={<Navigation className="w-4 h-4" />}
              />
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50 border border-slate-700">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${formData.geofenceMode === 'stadium' ? 'bg-cyan-500/20' : 'bg-violet-500/20'}`}>
                    {formData.geofenceMode === 'stadium' ? (
                      <Building2 className="h-5 w-5 text-cyan-400" />
                    ) : (
                      <Expand className="h-5 w-5 text-violet-400" />
                    )}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white">
                      {formData.geofenceMode === 'stadium' ? 'Stadium Mode' : 'Custom Mode'}
                    </div>
                    <div className="text-xs text-slate-400">
                      {formData.geofenceMode === 'stadium' 
                        ? 'Default Nissan Stadium boundaries' 
                        : `Extended radius: ${formData.customGeofenceRadius}ft`}
                    </div>
                  </div>
                </div>
                <Switch
                  checked={formData.geofenceMode === 'custom'}
                  onCheckedChange={(checked) => setFormData(prev => ({
                    ...prev,
                    geofenceMode: checked ? 'custom' : 'stadium'
                  }))}
                  data-testid="toggle-geofence"
                />
              </div>

              <AnimatePresence>
                {formData.geofenceMode === 'custom' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-3"
                  >
                    <Label className="text-slate-400 text-xs">Custom Radius (feet)</Label>
                    <Slider
                      value={[formData.customGeofenceRadius]}
                      onValueChange={([v]) => setFormData(prev => ({ ...prev, customGeofenceRadius: v }))}
                      min={100}
                      max={2000}
                      step={50}
                      className="mt-2"
                      data-testid="slider-geofence-radius"
                    />
                    <div className="flex justify-between text-xs text-slate-500">
                      <span>100ft</span>
                      <span className="text-cyan-400 font-medium">{formData.customGeofenceRadius}ft</span>
                      <span>2000ft</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </BentoCard>

          <BentoCard span={6} className="col-span-12 md:col-span-6" data-testid="bento-contacts">
            <SectionHeader
              title="Important Numbers"
              icon={<Phone className="w-4 h-4" />}
            />
            <div className="mt-3">
              <CarouselRail items={contactCards} data-testid="carousel-contacts" />
            </div>
          </BentoCard>

          {/* Notes Row - General Notes (span-6), Department Notes (span-6) */}
          <BentoCard span={6} className="col-span-12 md:col-span-6" data-testid="bento-notes">
            <SectionHeader
              title="Event Notes"
              subtitle="Universal announcements"
              icon={<MessageSquare className="w-4 h-4" />}
            />
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="General event notes visible to all staff..."
              className="bg-slate-900/50 border-slate-700 text-white mt-3 min-h-[120px]"
              data-testid="textarea-notes"
            />
          </BentoCard>

          <BentoCard span={6} className="col-span-12 md:col-span-6" data-testid="bento-dept-notes">
            <SectionHeader
              title="Department Notes"
              subtitle="Targeted messages"
              icon={<Target className="w-4 h-4" />}
            />
            <div className="mt-3 space-y-3">
              <div className="flex gap-2">
                <Select value={newDeptNote.department} onValueChange={(v: DepartmentNote['department']) => setNewDeptNote(prev => ({ ...prev, department: v }))}>
                  <SelectTrigger className="w-[120px] bg-slate-900/50 border-slate-700 text-white" data-testid="select-dept">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All</SelectItem>
                    <SelectItem value="IT">IT</SelectItem>
                    <SelectItem value="Kitchen">Kitchen</SelectItem>
                    <SelectItem value="Warehouse">Warehouse</SelectItem>
                    <SelectItem value="Operations">Operations</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  value={newDeptNote.note}
                  onChange={(e) => setNewDeptNote(prev => ({ ...prev, note: e.target.value }))}
                  placeholder="Note for department..."
                  className="flex-1 bg-slate-900/50 border-slate-700 text-white"
                  data-testid="input-dept-note"
                />
                <Button onClick={addDepartmentNote} size="sm" className="bg-cyan-500 hover:bg-cyan-600" data-testid="btn-add-dept-note">
                  Add
                </Button>
              </div>
              <div className="space-y-2 max-h-[100px] overflow-y-auto">
                {formData.departmentNotes.map((note, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center justify-between p-2 rounded-lg ${DEPARTMENT_COLORS[note.department].bg} ${DEPARTMENT_COLORS[note.department].border} border`}
                    data-testid={`dept-note-${idx}`}
                  >
                    <div className="flex items-center gap-2">
                      <Badge className={`${DEPARTMENT_COLORS[note.department].text} text-xs`}>{note.department}</Badge>
                      <span className="text-sm text-white truncate">{note.note}</span>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => removeDepartmentNote(idx)} className="text-slate-400 hover:text-white h-6 w-6 p-0">×</Button>
                  </div>
                ))}
              </div>
            </div>
          </BentoCard>

          {/* Pre-Event Checklist */}
          <BentoCard span={4} className="col-span-12 md:col-span-4" data-testid="bento-checklist">
            <div data-testid="pre-event-checklist">
              <SectionHeader
                title="Pre-Event Checklist"
                icon={<ClipboardCheck className="w-4 h-4" />}
              />
              <div className="mt-3 space-y-2">
                {checklistItems.map((item) => (
                  <div
                    key={item.id}
                    className={`flex items-center gap-2 p-2 rounded-lg ${
                      item.isComplete
                        ? 'bg-emerald-500/10 border border-emerald-500/30'
                        : item.isRequired
                        ? 'bg-rose-500/10 border border-rose-500/30'
                        : 'bg-slate-800/50 border border-slate-700/50'
                    }`}
                    data-testid={`checklist-item-${item.id}`}
                  >
                    {item.isComplete ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                    ) : (
                      <Circle className="h-4 w-4 text-slate-500 flex-shrink-0" />
                    )}
                    <span
                      className={`text-sm ${
                        item.isComplete
                          ? 'text-emerald-400'
                          : item.isRequired
                          ? 'text-rose-400'
                          : 'text-slate-400'
                      }`}
                    >
                      {item.label}
                      {item.isRequired && !item.isComplete && (
                        <span className="text-xs ml-1 text-rose-500">*</span>
                      )}
                      {!item.isRequired && (
                        <span className="text-xs ml-1 text-slate-500">(optional)</span>
                      )}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-3 text-xs text-slate-500">
                {requiredFieldsComplete
                  ? '✓ All required fields complete'
                  : '* Required fields must be completed'}
              </div>
            </div>
          </BentoCard>

          {/* Staffing Row - Staffing Grid (span-8), Quick Actions (span-4) */}
          <BentoCard span={8} className="col-span-12 lg:col-span-8" data-testid="bento-staffing">
            <div className="flex items-center justify-between mb-3">
              <SectionHeader
                title="Staffing & IT Grid"
                icon={<Grid3X3 className="w-4 h-4" />}
              />
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10" data-testid="btn-scan-grid">
                  <Scan className="h-3 w-3 mr-1" /> Scan Document
                </Button>
                <div className="relative">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10" 
                    data-testid="btn-use-template"
                    onClick={() => setShowTemplateMenu(!showTemplateMenu)}
                  >
                    <FileText className="h-3 w-3 mr-1" /> Use Template
                  </Button>
                  <AnimatePresence>
                    {showTemplateMenu && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute right-0 top-full mt-1 z-50 w-48 rounded-lg bg-slate-800 border border-slate-700 shadow-xl overflow-hidden"
                      >
                        {STAFFING_TEMPLATES.map((template) => (
                          <button
                            key={template.id}
                            onClick={() => handleUseTemplate(template)}
                            className="w-full px-3 py-2 text-left text-sm text-slate-300 hover:bg-slate-700/50 hover:text-white transition-colors"
                            data-testid={`template-${template.id}`}
                          >
                            {template.name}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
              <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-700 text-center" data-testid="grid-supervisors">
                <Users className="h-5 w-5 mx-auto mb-1 text-cyan-400" />
                <div className="text-lg font-bold text-white">{staffingGrid.supervisors}</div>
                <div className="text-xs text-slate-400">Supervisors</div>
              </div>
              <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-700 text-center" data-testid="grid-leads">
                <Users className="h-5 w-5 mx-auto mb-1 text-emerald-400" />
                <div className="text-lg font-bold text-white">{staffingGrid.leads}</div>
                <div className="text-xs text-slate-400">Stand Leads</div>
              </div>
              <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-700 text-center" data-testid="grid-it">
                <Monitor className="h-5 w-5 mx-auto mb-1 text-blue-400" />
                <div className="text-lg font-bold text-white">{staffingGrid.it}</div>
                <div className="text-xs text-slate-400">IT Support</div>
              </div>
              <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-700 text-center" data-testid="grid-kitchen">
                <ChefHat className="h-5 w-5 mx-auto mb-1 text-orange-400" />
                <div className="text-lg font-bold text-white">{staffingGrid.kitchen}</div>
                <div className="text-xs text-slate-400">Kitchen Staff</div>
              </div>
            </div>
            <div className="mt-2 text-xs text-slate-500 text-center">
              Template: {staffingGrid.templateName}
            </div>
            <div className="mt-3 p-3 rounded-lg bg-slate-900/30 border border-dashed border-slate-600 text-center">
              <Info className="h-5 w-5 mx-auto mb-1 text-slate-500" />
              <p className="text-xs text-slate-500">Scan or upload staffing grid to populate assignments</p>
            </div>
          </BentoCard>

          <BentoCard span={4} className="col-span-12 lg:col-span-4" data-testid="bento-actions">
            <SectionHeader
              title="Actions"
              icon={<Settings className="w-4 h-4" />}
            />
            <div className="space-y-3 mt-3">
              <GlowButton
                onClick={handleSave}
                className="w-full"
                variant="cyan"
                disabled={saveEventMutation.isPending || !requiredFieldsComplete}
                data-testid="btn-save-activate"
              >
                <Save className="h-4 w-4 mr-2" />
                {saveEventMutation.isPending ? 'Saving...' : isSaved ? 'Update Event' : 'Save & Activate'}
              </GlowButton>

              <AnimatePresence>
                {isSaved && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <GlowButton
                      onClick={() => setLocation('/command-center')}
                      className="w-full"
                      variant="green"
                      data-testid="btn-go-command-center"
                    >
                      Go to Command Center
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </GlowButton>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="text-xs text-slate-500 text-center">
                {isSaved 
                  ? 'Event is live. All dashboards are receiving updates.'
                  : 'Activating will push event info to all worker dashboards.'}
              </div>
            </div>
          </BentoCard>

          {/* Reminders Row - Accordion (span-12) */}
          <BentoCard span={12} data-testid="bento-reminders">
            <SectionHeader
              title="Event Reminders"
              icon={<AlertCircle className="w-4 h-4" />}
            />
            <AccordionStack
              items={[
                {
                  title: 'Alcohol Service Reminders',
                  content: (
                    <div className="space-y-2 text-sm text-slate-300">
                      <p>• Take extra time at each meeting to discuss our alcohol policy</p>
                      <p>• ID's must be thoroughly checked each time, no exceptions</p>
                      <p>• You are responsible for all points of service, concession stands, self-service kiosks and vendors</p>
                      <p className="text-rose-400">• Alcohol cut off at {formData.alcoholCutoffTime}, will communicate if longer</p>
                    </div>
                  )
                },
                {
                  title: 'Closing Reminders',
                  content: (
                    <div className="space-y-2 text-sm text-slate-300">
                      <p>• Ice cannot/will not be dumped on the concourse or concourse drains at any point</p>
                      <p>• Walk off all stands and bars within your zone before allowing anyone to leave</p>
                      <p>• Please report any concerns to management</p>
                      <p>• Recount ending counts for all large variances</p>
                    </div>
                  )
                },
                {
                  title: 'General Guidelines',
                  content: (
                    <div className="space-y-2 text-sm text-slate-300">
                      <p>• Please be sure that all equipment is turned off at the end of the event</p>
                      <p>• Please do not use guest elevators until 1 hour post event (use freight elevators/ramp)</p>
                      <p>• Do not empty ice bins/push carts until 1 hour after event when guests are cleared</p>
                      <p>• Make sure we are filling out our TILT logs!!!!!</p>
                    </div>
                  )
                }
              ]}
              defaultOpen={[0]}
              data-testid="accordion-reminders"
            />
          </BentoCard>
        </LayoutShell>
      </div>
    </AnimatedBackground>
  );
}
