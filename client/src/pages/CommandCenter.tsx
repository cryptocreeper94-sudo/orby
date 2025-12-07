import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertTriangle, 
  Heart, 
  Shield, 
  Flame, 
  Wrench, 
  Cloud, 
  Users, 
  HelpCircle,
  Clock,
  MapPin,
  User,
  CheckCircle2,
  ArrowUp,
  Bell,
  Siren,
  Timer,
  Activity,
  Send,
  LogOut,
  ChevronRight,
  Radio,
  Zap,
  Crown,
  FileText,
  BookOpen
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useStore } from '@/lib/mockData';
import { 
  AnimatedBackground, 
  GlassCard, 
  GlassCardHeader, 
  GlassCardContent,
  StatCard,
  GlowButton,
  StatusBadge,
  SectionHeader,
  EmptyState,
  PageHeader
} from '@/components/ui/premium';
import { LayoutShell, BentoCard, CarouselRail, AccordionStack } from '@/components/ui/bento';
import type { EmergencyAlert, Stand, User as UserType } from '@shared/schema';
import { SectionHelp } from '@/components/OrbyHelp';
import { DashboardControls } from '@/components/DashboardControls';
import { InteractiveMap } from '@/components/InteractiveMap';
import { WalkingDirections } from '@/components/WalkingDirections';
import ComplianceAlertPanel from '@/components/ComplianceAlertPanel';
import { AssetTracker } from '@/components/AssetTracker';
import { POSDeviceTracker } from '@/components/POSDeviceTracker';
import { IntegrationHub } from '@/components/IntegrationHub';
import { StaffPinsPanel } from '@/components/StaffPinsPanel';
import { OpsManagerTour } from '@/components/OpsManagerTour';
import { PersonalizedWelcomeTour } from '@/components/PersonalizedWelcomeTour';
import { Map, Navigation, Wine, Fingerprint, Shield as ShieldIcon, Monitor, Link2, KeyRound } from 'lucide-react';

const EMERGENCY_TYPES = [
  { id: 'Medical', icon: Heart, color: 'from-rose-500 to-rose-600', bgColor: 'bg-rose-500', label: 'Medical Emergency', sla: 3 },
  { id: 'Security', icon: Shield, color: 'from-cyan-500 to-cyan-600', bgColor: 'bg-cyan-500', label: 'Security Threat', sla: 5 },
  { id: 'Fire', icon: Flame, color: 'from-orange-500 to-orange-600', bgColor: 'bg-orange-500', label: 'Fire/Smoke', sla: 2 },
  { id: 'Equipment', icon: Wrench, color: 'from-teal-500 to-teal-600', bgColor: 'bg-teal-500', label: 'Equipment Failure', sla: 10 },
  { id: 'Weather', icon: Cloud, color: 'from-sky-500 to-sky-600', bgColor: 'bg-sky-500', label: 'Weather Alert', sla: 5 },
  { id: 'Crowd', icon: Users, color: 'from-violet-500 to-violet-600', bgColor: 'bg-violet-500', label: 'Crowd Control', sla: 5 },
  { id: 'Other', icon: HelpCircle, color: 'from-slate-500 to-slate-600', bgColor: 'bg-slate-500', label: 'Other Emergency', sla: 10 }
];

const ESCALATION_LEVELS: Record<string, { label: string; color: string }> = {
  'Level1': { label: 'L1 - Supervisor', color: 'bg-slate-500' },
  'Level2': { label: 'L2 - Manager', color: 'bg-cyan-500' },
  'Level3': { label: 'L3 - Executive', color: 'bg-teal-500' },
  'Level4': { label: 'L4 - External', color: 'bg-rose-500' }
};

function SLATimer({ createdAt, slaMinutes }: { createdAt: string | null; slaMinutes: number }) {
  const [elapsed, setElapsed] = useState(0);
  
  useEffect(() => {
    if (!createdAt) return;
    
    const startTime = new Date(createdAt).getTime();
    const updateTimer = () => {
      const now = Date.now();
      setElapsed(Math.floor((now - startTime) / 1000));
    };
    
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [createdAt]);
  
  const slaSeconds = slaMinutes * 60;
  const isOverdue = elapsed > slaSeconds;
  const remaining = slaSeconds - elapsed;
  
  const formatTime = (seconds: number) => {
    const absSeconds = Math.abs(seconds);
    const mins = Math.floor(absSeconds / 60);
    const secs = absSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  return (
    <motion.div 
      className={`flex items-center gap-1.5 text-sm font-mono px-2 py-1 rounded-lg ${
        isOverdue 
          ? 'bg-red-500/20 text-red-400' 
          : 'bg-emerald-500/20 text-emerald-400'
      }`}
      animate={isOverdue ? { scale: [1, 1.02, 1] } : {}}
      transition={{ repeat: Infinity, duration: 1 }}
    >
      <Timer className="w-3.5 h-3.5" />
      {isOverdue ? (
        <span className="font-bold">-{formatTime(remaining)}</span>
      ) : (
        <span>{formatTime(remaining)}</span>
      )}
    </motion.div>
  );
}

function IncidentCard({ 
  alert, 
  stands, 
  users,
  onAcknowledge, 
  onResolve,
  onEscalate,
  onUpdateStatus,
  compact = false
}: { 
  alert: EmergencyAlert;
  stands: Stand[];
  users: UserType[];
  onAcknowledge: (id: string) => void;
  onResolve: (id: string, notes: string, resolutionType: string) => void;
  onEscalate: (id: string, toLevel: string, reason: string) => void;
  onUpdateStatus: (id: string, status: string) => void;
  compact?: boolean;
}) {
  const [showResolveDialog, setShowResolveDialog] = useState(false);
  const [showEscalateDialog, setShowEscalateDialog] = useState(false);
  const [resolveNotes, setResolveNotes] = useState('');
  const [resolutionType, setResolutionType] = useState('');
  const [escalateReason, setEscalateReason] = useState('');
  const [nextLevel, setNextLevel] = useState('Level2');
  
  const stand = stands.find(s => s.id === alert.standId);
  const reporter = users.find(u => u.id === alert.reporterId);
  const acknowledger = users.find(u => u.id === alert.acknowledgedBy);
  const typeConfig = EMERGENCY_TYPES.find(t => t.id === alert.alertType) || EMERGENCY_TYPES[6];
  const TypeIcon = typeConfig.icon;
  
  const handleResolve = () => {
    onResolve(alert.id, resolveNotes, resolutionType);
    setShowResolveDialog(false);
    setResolveNotes('');
    setResolutionType('');
  };
  
  const handleEscalate = () => {
    onEscalate(alert.id, nextLevel, escalateReason);
    setShowEscalateDialog(false);
    setEscalateReason('');
  };
  
  const isResolved = alert.status === 'Resolved';
  
  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, x: -20 }}
        whileHover={{ scale: 1.01 }}
        data-testid={`incident-card-${alert.id}`}
        className={`relative rounded-2xl border overflow-hidden transition-all duration-300 ${
          isResolved 
            ? 'border-slate-700/50 bg-slate-800/30' 
            : 'border-white/10 bg-gradient-to-br from-slate-800/80 to-slate-900/80 shadow-lg'
        } ${compact ? 'min-w-[280px] max-w-[320px]' : ''}`}
      >
        <div className={`absolute top-0 left-0 w-1 h-full bg-gradient-to-b ${typeConfig.color}`} />
        
        <div className={compact ? 'p-3' : 'p-4 md:p-5'}>
          <div className="flex items-start gap-3">
            <motion.div 
              className={`p-2.5 rounded-xl bg-gradient-to-br ${typeConfig.color} shadow-lg flex-shrink-0`}
              whileHover={{ rotate: [0, -10, 10, 0] }}
              transition={{ duration: 0.5 }}
            >
              <TypeIcon className={compact ? 'w-4 h-4 text-white' : 'w-5 h-5 md:w-6 md:h-6 text-white'} />
            </motion.div>
            
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <h4 className={`font-bold text-white truncate ${compact ? 'text-sm' : 'text-base md:text-lg'}`}>{alert.title}</h4>
                <StatusBadge status={alert.status || 'Reported'} pulse={!isResolved} />
              </div>
              
              <div className="flex flex-wrap items-center gap-2 text-sm text-slate-400 mb-2">
                {stand && (
                  <span className="flex items-center gap-1 bg-slate-800/50 px-2 py-0.5 rounded-lg text-xs">
                    <MapPin className="w-3 h-3 text-cyan-400" />
                    {stand.name}
                  </span>
                )}
                {!isResolved && (
                  <SLATimer 
                    createdAt={alert.createdAt?.toString() || null}
                    slaMinutes={alert.slaTargetMinutes || typeConfig.sla}
                  />
                )}
              </div>
              
              {!compact && alert.description && (
                <p className="text-sm text-slate-300 mb-3 line-clamp-2">{alert.description}</p>
              )}
              
              {!compact && (
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  {alert.escalationLevel && (
                    <Badge variant="outline" className={`text-xs border-slate-600 ${ESCALATION_LEVELS[alert.escalationLevel]?.color} text-white`}>
                      {ESCALATION_LEVELS[alert.escalationLevel]?.label}
                    </Badge>
                  )}
                  {acknowledger && (
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-cyan-400" />
                      Claimed by {acknowledger.name}
                    </span>
                  )}
                </div>
              )}
              
              {!isResolved && (
                <div className="flex flex-wrap items-center gap-2">
                  {!alert.acknowledgedBy && (
                    <GlowButton 
                      size="sm" 
                      variant="cyan"
                      onClick={() => onAcknowledge(alert.id)}
                      data-testid={`button-claim-${alert.id}`}
                    >
                      <Bell className="w-3.5 h-3.5" />
                      Claim
                    </GlowButton>
                  )}
                  
                  {alert.acknowledgedBy && (
                    <>
                      {alert.status === 'Dispatched' && (
                        <Button 
                          size="sm"
                          variant="outline"
                          className="border-teal-500/50 text-teal-400 hover:bg-teal-500/10"
                          onClick={() => onUpdateStatus(alert.id, 'OnScene')}
                          data-testid={`button-onscene-${alert.id}`}
                        >
                          <Radio className="w-3.5 h-3.5 mr-1" />
                          On Scene
                        </Button>
                      )}
                      {alert.status === 'OnScene' && (
                        <Button 
                          size="sm"
                          variant="outline"
                          className="border-blue-500/50 text-blue-400 hover:bg-blue-500/10"
                          onClick={() => onUpdateStatus(alert.id, 'Stabilized')}
                          data-testid={`button-stabilized-${alert.id}`}
                        >
                          <Zap className="w-3.5 h-3.5 mr-1" />
                          Stabilized
                        </Button>
                      )}
                      {!compact && (
                        <>
                          <GlowButton 
                            size="sm"
                            variant="green"
                            onClick={() => setShowResolveDialog(true)}
                            data-testid={`button-resolve-${alert.id}`}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Resolve
                          </GlowButton>
                          <Button 
                            size="sm"
                            variant="outline"
                            className="border-violet-500/50 text-violet-400 hover:bg-violet-500/10"
                            onClick={() => setShowEscalateDialog(true)}
                            data-testid={`button-escalate-${alert.id}`}
                          >
                            <ArrowUp className="w-3.5 h-3.5 mr-1" />
                            Escalate
                          </Button>
                        </>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      <Dialog open={showResolveDialog} onOpenChange={setShowResolveDialog}>
        <DialogContent className="bg-slate-900/95 backdrop-blur-xl border-white/10 max-w-md" data-testid={`dialog-resolve-${alert.id}`}>
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              Resolve Incident
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-slate-300">Resolution Type</Label>
              <Select value={resolutionType} onValueChange={setResolutionType}>
                <SelectTrigger className="bg-slate-800/50 border-white/10 text-white mt-1.5" data-testid={`select-resolution-type-${alert.id}`}>
                  <SelectValue placeholder="How was it resolved?" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="Handled Internally">Handled Internally</SelectItem>
                  <SelectItem value="External Services Called">External Services Called</SelectItem>
                  <SelectItem value="False Alarm">False Alarm</SelectItem>
                  <SelectItem value="Deferred">Deferred/Referred</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-slate-300">Resolution Notes</Label>
              <Textarea 
                className="bg-slate-800/50 border-white/10 text-white mt-1.5 focus:ring-cyan-500/30"
                placeholder="Describe how the incident was resolved..."
                value={resolveNotes}
                onChange={(e) => setResolveNotes(e.target.value)}
                data-testid={`input-resolution-notes-${alert.id}`}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setShowResolveDialog(false)} className="text-slate-400">Cancel</Button>
            <GlowButton 
              variant="green"
              onClick={handleResolve}
              disabled={!resolutionType}
            >
              Resolve Incident
            </GlowButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showEscalateDialog} onOpenChange={setShowEscalateDialog}>
        <DialogContent className="bg-slate-900/95 backdrop-blur-xl border-white/10 max-w-md" data-testid={`dialog-escalate-${alert.id}`}>
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <ArrowUp className="w-5 h-5 text-violet-400" />
              Escalate Incident
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-slate-300">Escalate To</Label>
              <Select value={nextLevel} onValueChange={setNextLevel}>
                <SelectTrigger className="bg-slate-800/50 border-white/10 text-white mt-1.5" data-testid={`select-escalation-level-${alert.id}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="Level2">Level 2 - Manager</SelectItem>
                  <SelectItem value="Level3">Level 3 - Executive</SelectItem>
                  <SelectItem value="Level4">Level 4 - External Services</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-slate-300">Reason for Escalation</Label>
              <Textarea 
                className="bg-slate-800/50 border-white/10 text-white mt-1.5 focus:ring-violet-500/30"
                placeholder="Why does this need escalation?"
                value={escalateReason}
                onChange={(e) => setEscalateReason(e.target.value)}
                data-testid={`input-escalation-reason-${alert.id}`}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setShowEscalateDialog(false)} className="text-slate-400">Cancel</Button>
            <GlowButton 
              variant="purple"
              onClick={handleEscalate}
              disabled={!escalateReason}
            >
              Escalate
            </GlowButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function QuickAlertButton({ type, onClick }: { type: typeof EMERGENCY_TYPES[0]; onClick: () => void }) {
  const Icon = type.icon;
  return (
    <motion.button
      whileHover={{ scale: 1.05, y: -2 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${type.color} p-4 md:p-5 shadow-lg group`}
      data-testid={`button-quick-${type.id.toLowerCase()}`}
    >
      <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="relative flex flex-col items-center gap-2">
        <Icon className="w-6 h-6 md:w-8 md:h-8 text-white" />
        <span className="text-xs md:text-sm font-semibold text-white">{type.id}</span>
      </div>
    </motion.button>
  );
}

function MetricTile({ icon, label, value, subValue, color }: { icon: React.ReactNode; label: string; value: number | string; subValue?: string; color: string }) {
  const colorClasses: Record<string, string> = {
    amber: 'from-amber-500/20 to-amber-600/20 border-amber-500/30 text-amber-400',
    green: 'from-emerald-500/20 to-emerald-600/20 border-emerald-500/30 text-emerald-400',
    cyan: 'from-cyan-500/20 to-cyan-600/20 border-cyan-500/30 text-cyan-400',
    purple: 'from-violet-500/20 to-violet-600/20 border-violet-500/30 text-violet-400',
    red: 'from-red-500/20 to-red-600/20 border-red-500/30 text-red-400',
  };
  
  return (
    <div className={`flex-shrink-0 min-w-[140px] p-3 rounded-xl bg-gradient-to-br ${colorClasses[color]} border`} data-testid={`metric-${label.toLowerCase().replace(/\s+/g, '-')}`}>
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <span className="text-xs text-slate-400">{label}</span>
      </div>
      <div className="text-2xl font-bold">{value}</div>
      {subValue && <div className="text-xs text-slate-500">{subValue}</div>}
    </div>
  );
}

export default function CommandCenter() {
  const [, navigate] = useLocation();
  const currentUser = useStore((state) => state.currentUser);
  const logout = useStore((state) => state.logout);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [showNewIncident, setShowNewIncident] = useState(false);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [newIncident, setNewIncident] = useState({
    title: '',
    description: '',
    standId: '',
    locationDetails: ''
  });
  
  const [activeTab, setActiveTab] = useState('active');
  const [showDashboardControls, setShowDashboardControls] = useState(false);
  const [showStadiumMap, setShowStadiumMap] = useState(false);
  const [showDirections, setShowDirections] = useState(false);
  const [showCompliance, setShowCompliance] = useState(false);
  const [showAssetTracker, setShowAssetTracker] = useState(false);
  const [showPOSTracker, setShowPOSTracker] = useState(false);
  const [showIntegrationHub, setShowIntegrationHub] = useState(false);
  const [showStaffPins, setShowStaffPins] = useState(false);
  
  const isDavid = currentUser?.pin === '2424';
  const userRole = currentUser?.role as string;
  const isSeniorLeadership = isDavid || 
    userRole === 'GeneralManager' || 
    userRole === 'RegionalVP' ||
    userRole === 'OperationsManager';
  const isIT = currentUser?.role === 'IT' || currentUser?.role === 'Developer' || isDavid;
  const isManager = currentUser?.role === 'Developer' || currentUser?.role === 'Admin' || currentUser?.role === 'ManagementCore' || currentUser?.role === 'ManagementAssistant' || currentUser?.role === 'IT';

  const { data: alerts = [], isLoading: alertsLoading } = useQuery({
    queryKey: ['/api/emergency-alerts'],
    refetchInterval: 5000
  });
  
  const { data: stands = [] } = useQuery({
    queryKey: ['/api/stands']
  });
  
  const { data: users = [] } = useQuery({
    queryKey: ['/api/users']
  });

  const activeAlerts = (alerts as EmergencyAlert[]).filter(a => a.isActive);
  const resolvedAlerts = (alerts as EmergencyAlert[]).filter(a => !a.isActive);
  const criticalAlerts = activeAlerts.filter(a => 
    a.alertType === 'Medical' || a.alertType === 'Fire' || a.alertType === 'Security'
  );
  const claimedAlerts = activeAlerts.filter(a => a.acknowledgedBy);
  const escalatedAlerts = activeAlerts.filter(a => a.escalationLevel && a.escalationLevel !== 'Level1');
  const resolvedToday = resolvedAlerts.filter(a => {
    const today = new Date().toDateString();
    return a.resolvedAt && new Date(a.resolvedAt).toDateString() === today;
  });

  const createAlertMutation = useMutation({
    mutationFn: (data: any) => apiRequest('POST', '/api/emergency-alerts', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/emergency-alerts'] });
      toast({ title: 'Emergency Alert Created', description: 'All relevant personnel have been notified.' });
      setShowNewIncident(false);
      setSelectedType(null);
      setNewIncident({ title: '', description: '', standId: '', locationDetails: '' });
    }
  });

  const acknowledgeMutation = useMutation({
    mutationFn: (id: string) => apiRequest('PATCH', `/api/emergency-alerts/${id}/acknowledge`, { userId: currentUser?.id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/emergency-alerts'] });
      toast({ title: 'Alert Claimed', description: 'You are now responsible for this incident.' });
    }
  });

  const resolveMutation = useMutation({
    mutationFn: ({ id, notes, resolutionType }: { id: string; notes: string; resolutionType: string }) => 
      apiRequest('PATCH', `/api/emergency-alerts/${id}/resolve`, { userId: currentUser?.id, notes, resolutionType }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/emergency-alerts'] });
      toast({ title: 'Incident Resolved', description: 'The incident has been marked as resolved.' });
    }
  });

  const escalateMutation = useMutation({
    mutationFn: ({ id, toLevel, reason }: { id: string; toLevel: string; reason: string }) => 
      apiRequest('PATCH', `/api/emergency-alerts/${id}/escalate`, { toLevel, reason, escalatedBy: currentUser?.id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/emergency-alerts'] });
      toast({ title: 'Incident Escalated', description: 'Higher-level personnel have been notified.' });
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => 
      apiRequest('PATCH', `/api/emergency-alerts/${id}/status`, { status, userId: currentUser?.id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/emergency-alerts'] });
    }
  });

  const handleCreateAlert = () => {
    if (!selectedType || !currentUser) return;
    
    const typeConfig = EMERGENCY_TYPES.find(t => t.id === selectedType);
    
    createAlertMutation.mutate({
      alertType: selectedType,
      title: newIncident.title || `${typeConfig?.label}`,
      description: newIncident.description,
      standId: newIncident.standId || null,
      locationDetails: newIncident.locationDetails,
      reporterId: currentUser.id,
      priority: ['Medical', 'Fire', 'Security'].includes(selectedType) ? 'Critical' : 'High',
      slaTargetMinutes: typeConfig?.sla || 5
    });
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const statusMetrics = [
    <MetricTile key="active" icon={<Activity className="w-4 h-4" />} label="Active" value={activeAlerts.length} color={activeAlerts.length > 0 ? 'amber' : 'green'} />,
    <MetricTile key="critical" icon={<Siren className="w-4 h-4" />} label="Critical" value={criticalAlerts.length} color={criticalAlerts.length > 0 ? 'red' : 'green'} />,
    <MetricTile key="claimed" icon={<Bell className="w-4 h-4" />} label="Claimed" value={claimedAlerts.length} subValue={`of ${activeAlerts.length}`} color="cyan" />,
    <MetricTile key="resolved" icon={<CheckCircle2 className="w-4 h-4" />} label="Resolved Today" value={resolvedToday.length} color="green" />,
    <MetricTile key="escalated" icon={<ArrowUp className="w-4 h-4" />} label="Escalated" value={escalatedAlerts.length} color={escalatedAlerts.length > 0 ? 'purple' : 'green'} />,
  ];

  const incidentCarouselItems = activeAlerts.length > 0 
    ? activeAlerts.map(alert => (
        <IncidentCard
          key={alert.id}
          alert={alert}
          stands={stands as Stand[]}
          users={users as UserType[]}
          onAcknowledge={(id) => acknowledgeMutation.mutate(id)}
          onResolve={(id, notes, resolutionType) => resolveMutation.mutate({ id, notes, resolutionType })}
          onEscalate={(id, toLevel, reason) => escalateMutation.mutate({ id, toLevel, reason })}
          onUpdateStatus={(id, status) => updateStatusMutation.mutate({ id, status })}
          compact
        />
      ))
    : [
        <div key="empty" className="min-w-[280px] p-6 rounded-xl bg-slate-800/30 border border-white/5 text-center">
          <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-400" />
          <p className="text-sm text-slate-400">All Clear - No active incidents</p>
        </div>
      ];

  const protocolItems = [
    {
      title: 'Medical Emergency Protocol',
      content: (
        <div className="space-y-2 text-sm">
          <p>1. Assess scene safety before approaching</p>
          <p>2. Call 911 if life-threatening</p>
          <p>3. Dispatch first-aid certified staff</p>
          <p>4. Document incident with photos if safe</p>
          <p className="text-cyan-400 font-medium">SLA: 3 minutes response time</p>
        </div>
      )
    },
    {
      title: 'Fire/Smoke Protocol',
      content: (
        <div className="space-y-2 text-sm">
          <p>1. Activate nearest fire alarm</p>
          <p>2. Evacuate immediate area</p>
          <p>3. Call 911 and security dispatch</p>
          <p>4. Do NOT attempt to fight large fires</p>
          <p className="text-orange-400 font-medium">SLA: 2 minutes response time</p>
        </div>
      )
    },
    {
      title: 'Security Threat Protocol',
      content: (
        <div className="space-y-2 text-sm">
          <p>1. Do not confront - observe and report</p>
          <p>2. Note suspect description and location</p>
          <p>3. Alert security via radio channel 1</p>
          <p>4. Guide guests away from threat area</p>
          <p className="text-cyan-400 font-medium">SLA: 5 minutes response time</p>
        </div>
      )
    },
    {
      title: 'Crowd Control Protocol',
      content: (
        <div className="space-y-2 text-sm">
          <p>1. Identify bottleneck or danger zone</p>
          <p>2. Request additional staff assistance</p>
          <p>3. Use designated overflow areas</p>
          <p>4. Maintain clear communication</p>
          <p className="text-violet-400 font-medium">SLA: 5 minutes response time</p>
        </div>
      )
    }
  ];

  const recentLogsContent = (
    <div className="space-y-2 text-sm max-h-40 overflow-y-auto">
      {resolvedAlerts.slice(0, 5).map(alert => (
        <div key={alert.id} className="flex items-center gap-2 py-1 border-b border-white/5 last:border-0">
          <CheckCircle2 className="w-3 h-3 text-emerald-400 flex-shrink-0" />
          <span className="truncate flex-1">{alert.title}</span>
          <span className="text-xs text-slate-500">
            {alert.resolvedAt ? new Date(alert.resolvedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
          </span>
        </div>
      ))}
      {resolvedAlerts.length === 0 && (
        <p className="text-slate-500 text-center py-2">No recent activity</p>
      )}
    </div>
  );

  const quickAlertButtons = (
    <div className="flex gap-2 overflow-x-auto pb-2">
      {EMERGENCY_TYPES.map((type) => {
        const Icon = type.icon;
        return (
          <motion.button
            key={type.id}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setSelectedType(type.id);
              setShowNewIncident(true);
            }}
            className={`flex-shrink-0 rounded-xl bg-gradient-to-br ${type.color} p-3 shadow-lg`}
            data-testid={`button-quick-${type.id.toLowerCase()}`}
          >
            <div className="flex flex-col items-center gap-1">
              <Icon className="w-5 h-5 text-white" />
              <span className="text-xs font-medium text-white whitespace-nowrap">{type.id}</span>
            </div>
          </motion.button>
        );
      })}
    </div>
  );

  const teamsContent = (
    <div className="space-y-2">
      <div className="flex items-center justify-between p-2 rounded-lg bg-slate-800/50">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400" />
          <span className="text-sm">Security Team Alpha</span>
        </div>
        <Badge className="bg-emerald-500/20 text-emerald-400 border-0 text-xs">Available</Badge>
      </div>
      <div className="flex items-center justify-between p-2 rounded-lg bg-slate-800/50">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-amber-400" />
          <span className="text-sm">Medical Response</span>
        </div>
        <Badge className="bg-amber-500/20 text-amber-400 border-0 text-xs">On Call</Badge>
      </div>
      <div className="flex items-center justify-between p-2 rounded-lg bg-slate-800/50">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-cyan-400" />
          <span className="text-sm">Maintenance Crew</span>
        </div>
        <Badge className="bg-cyan-500/20 text-cyan-400 border-0 text-xs">Ready</Badge>
      </div>
    </div>
  );

  const communicationsContent = (
    <div className="space-y-2">
      <div className="p-2 rounded-lg bg-slate-800/50 border-l-2 border-cyan-400">
        <p className="text-xs text-slate-500">Radio Ch. 1</p>
        <p className="text-sm">Security dispatch active</p>
      </div>
      <div className="p-2 rounded-lg bg-slate-800/50 border-l-2 border-emerald-400">
        <p className="text-xs text-slate-500">Radio Ch. 2</p>
        <p className="text-sm">Medical standby</p>
      </div>
      <div className="p-2 rounded-lg bg-slate-800/50 border-l-2 border-violet-400">
        <p className="text-xs text-slate-500">PA System</p>
        <p className="text-sm">Ready for announcements</p>
      </div>
    </div>
  );

  return (
    <AnimatedBackground>
      <PageHeader 
        title="Command Center"
        subtitle="Emergency Response Control"
        icon={<Siren className="w-5 h-5" />}
        backAction={() => navigate('/manager')}
        actions={
          <div className="flex items-center gap-2">
            {criticalAlerts.length > 0 && (
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
              >
                <Badge className="bg-red-500/20 text-red-400 border-red-500/30" data-testid="badge-critical-count">
                  {criticalAlerts.length} Critical
                </Badge>
              </motion.div>
            )}
            <Badge variant="outline" className="border-cyan-500/30 text-cyan-400" data-testid="badge-active-count">
              {activeAlerts.length} Active
            </Badge>
            {isSeniorLeadership && (
              <>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowStaffPins(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-400/40 text-amber-300 hover:border-amber-400/60 transition-colors"
                  data-testid="button-staff-pins"
                >
                  <KeyRound className="w-4 h-4" />
                  <span className="text-xs font-medium hidden sm:inline">PINs</span>
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowDashboardControls(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-400/40 text-cyan-300 hover:border-cyan-400/60 transition-colors"
                  data-testid="button-dashboard-controls"
                >
                  <Crown className="w-4 h-4" />
                  <span className="text-xs font-medium hidden sm:inline">Controls</span>
                </motion.button>
              </>
            )}
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleLogout}
              className="text-slate-400 hover:text-white"
              aria-label="Log out"
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        }
      />

      <main className="p-4 md:p-6 lg:p-8 pb-24 max-w-7xl mx-auto" data-testid="command-center-main">
        <LayoutShell className="gap-3">
          {/* Hero Row - Emergency Status Metrics (span-12) */}
          <BentoCard span={12} className="overflow-hidden" data-testid="bento-hero-metrics">
            <div className="flex items-center gap-2 mb-3">
              <SectionHeader 
                title="Emergency Status" 
                subtitle="Real-time metrics"
                icon={<Activity className="w-4 h-4" />}
              />
              <SectionHelp
                title="Response Metrics"
                description="Real-time dashboard showing how incidents are being handled."
                tips={["Green = good", "Watch escalations", "Claimed = someone owns it"]}
                keywords={['priority', 'audit-trail']}
              />
            </div>
            <CarouselRail items={statusMetrics} data-testid="carousel-status-metrics" />
          </BentoCard>

          {/* Incidents Row - Active Incidents Carousel (span-8), Priority Queue (span-4) */}
          <BentoCard span={8} className="overflow-hidden" data-testid="bento-active-incidents">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <SectionHeader 
                  title="Active Incidents" 
                  icon={<AlertTriangle className="w-4 h-4" />}
                />
                <Badge variant="outline" className="border-cyan-500/30 text-cyan-400 text-xs">
                  {activeAlerts.length}
                </Badge>
              </div>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-auto">
                <TabsList className="h-7 bg-slate-800/50 p-0.5">
                  <TabsTrigger value="active" className="text-xs px-2 h-6 data-[state=active]:bg-cyan-500/20" data-testid="tab-active">
                    Active
                  </TabsTrigger>
                  <TabsTrigger value="resolved" className="text-xs px-2 h-6 data-[state=active]:bg-emerald-500/20" data-testid="tab-resolved">
                    Resolved
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            {alertsLoading ? (
              <div className="text-center py-8">
                <Activity className="w-8 h-8 mx-auto mb-2 text-cyan-400 animate-pulse" />
                <p className="text-sm text-slate-400">Loading...</p>
              </div>
            ) : activeTab === 'active' ? (
              <CarouselRail items={incidentCarouselItems} data-testid="carousel-active-incidents" />
            ) : (
              <CarouselRail 
                items={resolvedAlerts.slice(0, 10).map(alert => (
                  <IncidentCard
                    key={alert.id}
                    alert={alert}
                    stands={stands as Stand[]}
                    users={users as UserType[]}
                    onAcknowledge={() => {}}
                    onResolve={() => {}}
                    onEscalate={() => {}}
                    onUpdateStatus={() => {}}
                    compact
                  />
                ))}
                data-testid="carousel-resolved-incidents"
              />
            )}
          </BentoCard>

          <BentoCard span={4} data-testid="bento-quick-dispatch">
            <div className="flex items-center gap-2 mb-3">
              <SectionHeader 
                title="Quick Dispatch" 
                icon={<Siren className="w-4 h-4" />}
              />
              <SectionHelp
                title="Quick Alert Panel"
                description="One-tap emergency dispatch"
                tips={["Medical: 3min SLA", "Fire: 2min SLA", "Security: 5min SLA"]}
                keywords={['priority', 'broadcast']}
              />
            </div>
            {quickAlertButtons}
          </BentoCard>

          {/* Response Row - Teams/Resources (span-6), Communications (span-6) */}
          <BentoCard span={6} data-testid="bento-teams">
            <div className="flex items-center gap-2 mb-3">
              <SectionHeader 
                title="Response Teams" 
                icon={<Users className="w-4 h-4" />}
              />
            </div>
            {teamsContent}
          </BentoCard>

          <BentoCard span={6} data-testid="bento-communications">
            <div className="flex items-center gap-2 mb-3">
              <SectionHeader 
                title="Communications" 
                icon={<Radio className="w-4 h-4" />}
              />
            </div>
            {communicationsContent}
          </BentoCard>

          {/* Support Row - Protocols Accordion, Activity Log Accordion */}
          <BentoCard span={8} data-testid="bento-protocols">
            <div className="flex items-center gap-2 mb-3">
              <SectionHeader 
                title="Emergency Protocols" 
                icon={<BookOpen className="w-4 h-4" />}
              />
              <SectionHelp
                title="Emergency Protocols"
                description="Reference guides for each emergency type with SLA targets"
                tips={["Follow steps in order", "Document all actions", "Escalate if SLA exceeded"]}
                keywords={['protocol', 'sla']}
              />
            </div>
            <AccordionStack items={protocolItems} defaultOpen={[0]} data-testid="accordion-protocols" />
          </BentoCard>

          <BentoCard span={4} data-testid="bento-activity-log">
            <div className="flex items-center gap-2 mb-3">
              <SectionHeader 
                title="Recent Activity" 
                icon={<FileText className="w-4 h-4" />}
              />
            </div>
            <AccordionStack 
              items={[
                { title: 'Resolved Incidents', content: recentLogsContent }
              ]} 
              defaultOpen={[0]} 
              data-testid="accordion-activity"
            />
          </BentoCard>
        </LayoutShell>
      </main>

      <Dialog open={showNewIncident} onOpenChange={setShowNewIncident}>
        <DialogContent className="bg-slate-900/95 backdrop-blur-xl border-white/10 max-w-md" data-testid="dialog-new-incident">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              {selectedType && (() => {
                const typeConfig = EMERGENCY_TYPES.find(t => t.id === selectedType);
                const Icon = typeConfig?.icon || AlertTriangle;
                return (
                  <>
                    <div className={`p-2 rounded-lg bg-gradient-to-br ${typeConfig?.color}`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    Report {typeConfig?.label}
                  </>
                );
              })()}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label className="text-slate-300">Title</Label>
              <Input 
                className="bg-slate-800/50 border-white/10 text-white mt-1.5 focus:ring-cyan-500/30"
                placeholder="Brief description of the emergency"
                value={newIncident.title}
                onChange={(e) => setNewIncident({...newIncident, title: e.target.value})}
                data-testid="input-incident-title"
              />
            </div>
            
            <div>
              <Label className="text-slate-300">Location (Stand)</Label>
              <Select 
                value={newIncident.standId} 
                onValueChange={(v) => setNewIncident({...newIncident, standId: v})}
              >
                <SelectTrigger className="bg-slate-800/50 border-white/10 text-white mt-1.5" data-testid="select-incident-location">
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700 max-h-60">
                  {(stands as Stand[]).map(stand => (
                    <SelectItem key={stand.id} value={stand.id} data-testid={`option-stand-${stand.id}`}>
                      {stand.name} - {stand.section}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label className="text-slate-300">Additional Location Details</Label>
              <Input 
                className="bg-slate-800/50 border-white/10 text-white mt-1.5"
                placeholder="e.g., Near Section 115 entrance"
                value={newIncident.locationDetails}
                onChange={(e) => setNewIncident({...newIncident, locationDetails: e.target.value})}
                data-testid="input-location-details"
              />
            </div>
            
            <div>
              <Label className="text-slate-300">Description</Label>
              <Textarea 
                className="bg-slate-800/50 border-white/10 text-white mt-1.5"
                placeholder="What is happening? Any additional details..."
                value={newIncident.description}
                onChange={(e) => setNewIncident({...newIncident, description: e.target.value})}
                rows={3}
                data-testid="input-incident-description"
              />
            </div>
          </div>
          
          <DialogFooter className="gap-2">
            <Button 
              variant="ghost" 
              onClick={() => {
                setShowNewIncident(false);
                setSelectedType(null);
              }}
              className="text-slate-400"
              data-testid="button-cancel-new-incident"
            >
              Cancel
            </Button>
            <GlowButton 
              variant="red"
              onClick={handleCreateAlert}
              disabled={createAlertMutation.isPending}
            >
              <Send className="w-4 h-4" />
              Send Alert
            </GlowButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quick Tools Floating Bar */}
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40"
        data-testid="floating-tools-bar"
      >
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900/90 backdrop-blur-xl border border-white/10 shadow-2xl">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowStadiumMap(true)}
            className="p-3 rounded-full bg-gradient-to-br from-blue-500/20 to-blue-600/20 text-blue-400 hover:text-blue-300 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
            data-testid="button-quick-map"
            aria-label="Stadium Map"
          >
            <Map className="w-5 h-5" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowDirections(true)}
            className="p-3 rounded-full bg-gradient-to-br from-green-500/20 to-green-600/20 text-green-400 hover:text-green-300 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
            data-testid="button-quick-directions"
            aria-label="Walking Directions"
          >
            <Navigation className="w-5 h-5" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowCompliance(true)}
            className="p-3 rounded-full bg-gradient-to-br from-purple-500/20 to-purple-600/20 text-purple-400 hover:text-purple-300 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
            data-testid="button-quick-compliance"
            aria-label="Compliance Alerts"
          >
            <Wine className="w-5 h-5" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowAssetTracker(true)}
            className="p-3 rounded-full bg-gradient-to-br from-cyan-500/20 to-cyan-600/20 text-cyan-400 hover:text-cyan-300 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
            data-testid="button-quick-assets"
            aria-label="Genesis Hallmark"
          >
            <Fingerprint className="w-5 h-5" />
          </motion.button>
          {isIT && (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowPOSTracker(true)}
              className="p-3 rounded-full bg-gradient-to-br from-violet-500/20 to-violet-600/20 text-violet-400 hover:text-violet-300 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
              data-testid="button-quick-pos"
              aria-label="POS Devices"
            >
              <Monitor className="w-5 h-5" />
            </motion.button>
          )}
          {(isDavid || isManager) && (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowIntegrationHub(true)}
              className="p-3 rounded-full bg-gradient-to-br from-emerald-500/20 to-teal-600/20 text-emerald-400 hover:text-emerald-300 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
              data-testid="button-quick-integrations"
              aria-label="Integration Hub"
            >
              <Link2 className="w-5 h-5" />
            </motion.button>
          )}
        </div>
      </motion.div>

      {/* Stadium Map Dialog */}
      <Dialog open={showStadiumMap} onOpenChange={setShowStadiumMap}>
        <DialogContent className="bg-slate-900/95 backdrop-blur-xl border-white/10 max-w-4xl h-[80vh] p-0 overflow-hidden">
          <InteractiveMap 
            onClose={() => setShowStadiumMap(false)}
            isManager={isManager}
          />
        </DialogContent>
      </Dialog>

      {/* Walking Directions Dialog */}
      <Dialog open={showDirections} onOpenChange={setShowDirections}>
        <DialogContent className="bg-slate-900/95 backdrop-blur-xl border-white/10 max-w-md max-h-[80vh] overflow-auto">
          <WalkingDirections onClose={() => setShowDirections(false)} />
        </DialogContent>
      </Dialog>

      {/* Compliance Alerts Dialog */}
      <Dialog open={showCompliance} onOpenChange={setShowCompliance}>
        <DialogContent className="bg-slate-900/95 backdrop-blur-xl border-white/10 max-w-2xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <ShieldIcon className="w-5 h-5 text-purple-400" />
              Tennessee Compliance Alerts
            </DialogTitle>
          </DialogHeader>
          <ComplianceAlertPanel 
            userId={currentUser?.id} 
            userName={currentUser?.name} 
            isManager={isManager}
          />
        </DialogContent>
      </Dialog>

      {/* Genesis Hallmark Asset Tracker Dialog */}
      <Dialog open={showAssetTracker} onOpenChange={setShowAssetTracker}>
        <DialogContent className="bg-slate-900/95 backdrop-blur-xl border-white/10 max-w-4xl max-h-[80vh] overflow-auto p-6">
          <AssetTracker />
        </DialogContent>
      </Dialog>

      {/* POS Device Tracker Dialog (IT/David only) */}
      <Dialog open={showPOSTracker} onOpenChange={setShowPOSTracker}>
        <DialogContent className="bg-slate-900/95 backdrop-blur-xl border-white/10 max-w-5xl max-h-[85vh] overflow-auto p-6">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Monitor className="w-5 h-5 text-violet-400" />
              POS Device Tracker
            </DialogTitle>
          </DialogHeader>
          <POSDeviceTracker />
        </DialogContent>
      </Dialog>

      {/* Integration Hub Dialog (David/Managers) */}
      <Dialog open={showIntegrationHub} onOpenChange={setShowIntegrationHub}>
        <DialogContent className="bg-slate-900/95 backdrop-blur-xl border-white/10 max-w-3xl max-h-[85vh] overflow-auto p-6">
          <IntegrationHub onClose={() => setShowIntegrationHub(false)} />
        </DialogContent>
      </Dialog>

      {/* Senior Leadership Dashboard Controls */}
      {isSeniorLeadership && (
        <DashboardControls
          isOpen={showDashboardControls}
          onClose={() => setShowDashboardControls(false)}
        />
      )}

      {/* Staff PINs Panel for Senior Leadership */}
      <Dialog open={showStaffPins} onOpenChange={setShowStaffPins}>
        <DialogContent className="bg-slate-900/95 backdrop-blur-xl border-white/10 max-w-2xl max-h-[85vh] overflow-auto p-6">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-amber-400" />
              Staff PIN Management
            </DialogTitle>
          </DialogHeader>
          <StaffPinsPanel />
        </DialogContent>
      </Dialog>

      {/* Ops Manager Tour for David on first login */}
      {isDavid && <OpsManagerTour />}
      <PersonalizedWelcomeTour />
    </AnimatedBackground>
  );
}
