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
  Crown
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
import type { EmergencyAlert, Stand, User as UserType } from '@shared/schema';
import { SectionHelp } from '@/components/OrbyHelp';
import { DashboardControls } from '@/components/DashboardControls';
import { InteractiveMap } from '@/components/InteractiveMap';
import { WalkingDirections } from '@/components/WalkingDirections';
import ComplianceAlertPanel from '@/components/ComplianceAlertPanel';
import { AssetTracker } from '@/components/AssetTracker';
import { Map, Navigation, Wine, Fingerprint, Shield as ShieldIcon } from 'lucide-react';

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
  onUpdateStatus
}: { 
  alert: EmergencyAlert;
  stands: Stand[];
  users: UserType[];
  onAcknowledge: (id: string) => void;
  onResolve: (id: string, notes: string, resolutionType: string) => void;
  onEscalate: (id: string, toLevel: string, reason: string) => void;
  onUpdateStatus: (id: string, status: string) => void;
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
        className={`relative rounded-2xl border overflow-hidden transition-all duration-300 ${
          isResolved 
            ? 'border-slate-700/50 bg-slate-800/30' 
            : 'border-white/10 bg-gradient-to-br from-slate-800/80 to-slate-900/80 shadow-lg'
        }`}
      >
        <div className={`absolute top-0 left-0 w-1 h-full bg-gradient-to-b ${typeConfig.color}`} />
        
        <div className="p-4 md:p-5">
          <div className="flex items-start gap-4">
            <motion.div 
              className={`p-3 rounded-xl bg-gradient-to-br ${typeConfig.color} shadow-lg`}
              whileHover={{ rotate: [0, -10, 10, 0] }}
              transition={{ duration: 0.5 }}
            >
              <TypeIcon className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </motion.div>
            
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <h4 className="font-bold text-white text-base md:text-lg truncate">{alert.title}</h4>
                <StatusBadge status={alert.status || 'Reported'} pulse={!isResolved} />
              </div>
              
              <div className="flex flex-wrap items-center gap-3 text-sm text-slate-400 mb-3">
                {stand && (
                  <span className="flex items-center gap-1.5 bg-slate-800/50 px-2 py-1 rounded-lg">
                    <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                    {stand.name}
                  </span>
                )}
                {reporter && (
                  <span className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" />
                    {reporter.name}
                  </span>
                )}
                {!isResolved && (
                  <SLATimer 
                    createdAt={alert.createdAt?.toString() || null}
                    slaMinutes={alert.slaTargetMinutes || typeConfig.sla}
                  />
                )}
              </div>
              
              {alert.description && (
                <p className="text-sm text-slate-300 mb-3 line-clamp-2">{alert.description}</p>
              )}
              
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
              
              {!isResolved && (
                <div className="flex flex-wrap items-center gap-2">
                  {!alert.acknowledgedBy && (
                    <GlowButton 
                      size="sm" 
                      variant="cyan"
                      onClick={() => onAcknowledge(alert.id)}
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
                      <GlowButton 
                        size="sm"
                        variant="green"
                        onClick={() => setShowResolveDialog(true)}
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
  
  // David (PIN 2424) gets Dashboard Controls superpower
  const isDavid = currentUser?.pin === '2424';
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
            {isDavid && (
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

      <main className="p-4 md:p-6 lg:p-8 space-y-6 pb-24 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <GlassCard gradient>
              <GlassCardHeader>
                <div className="flex items-center gap-2">
                  <SectionHeader 
                    title="Quick Alert" 
                    subtitle="One-tap emergency dispatch"
                    icon={<AlertTriangle className="w-5 h-5" />}
                  />
                  <SectionHelp
                    title="Quick Alert Panel"
                    description="Instantly dispatch emergency alerts with one tap. Each alert type routes to the right responders and tracks SLA (Service Level Agreement) times."
                    tips={[
                      "Medical emergencies have a 3-minute SLA",
                      "All alerts are logged for accountability",
                      "Critical alerts trigger escalation if not acknowledged"
                    ]}
                    keywords={['priority', 'broadcast', 'audit-trail']}
                  />
                </div>
              </GlassCardHeader>
              <GlassCardContent>
                <div className="grid grid-cols-4 gap-3 mb-3">
                  {EMERGENCY_TYPES.slice(0, 4).map((type) => (
                    <QuickAlertButton 
                      key={type.id} 
                      type={type} 
                      onClick={() => {
                        setSelectedType(type.id);
                        setShowNewIncident(true);
                      }}
                    />
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {EMERGENCY_TYPES.slice(4).map((type) => (
                    <motion.button
                      key={type.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setSelectedType(type.id);
                        setShowNewIncident(true);
                      }}
                      className="rounded-xl border border-white/10 bg-slate-800/50 p-3 flex flex-col items-center gap-2 hover:bg-slate-700/50 transition-colors"
                      data-testid={`button-quick-${type.id.toLowerCase()}`}
                    >
                      <type.icon className="w-5 h-5 text-slate-400" />
                      <span className="text-xs text-slate-400">{type.id}</span>
                    </motion.button>
                  ))}
                </div>
              </GlassCardContent>
            </GlassCard>

            <GlassCard gradient>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="w-full bg-slate-800/50 rounded-t-2xl rounded-b-none border-b border-white/5 p-1">
                  <TabsTrigger 
                    value="active" 
                    className="flex-1 data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400 rounded-xl"
                    data-testid="tab-active"
                  >
                    <Activity className="w-4 h-4 mr-2" />
                    Active ({activeAlerts.length})
                  </TabsTrigger>
                  <TabsTrigger 
                    value="resolved" 
                    className="flex-1 data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400 rounded-xl"
                    data-testid="tab-resolved"
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Resolved ({resolvedAlerts.length})
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="active" className="p-4 md:p-5 space-y-4 m-0">
                  <AnimatePresence mode="popLayout">
                    {alertsLoading ? (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-12"
                      >
                        <Activity className="w-10 h-10 mx-auto mb-3 text-cyan-400 animate-pulse" />
                        <p className="text-slate-400">Loading incidents...</p>
                      </motion.div>
                    ) : activeAlerts.length === 0 ? (
                      <EmptyState 
                        icon={<CheckCircle2 className="w-12 h-12" />}
                        title="All Clear"
                        description="No active incidents at this time"
                      />
                    ) : (
                      activeAlerts.map(alert => (
                        <IncidentCard
                          key={alert.id}
                          alert={alert}
                          stands={stands as Stand[]}
                          users={users as UserType[]}
                          onAcknowledge={(id) => acknowledgeMutation.mutate(id)}
                          onResolve={(id, notes, resolutionType) => resolveMutation.mutate({ id, notes, resolutionType })}
                          onEscalate={(id, toLevel, reason) => escalateMutation.mutate({ id, toLevel, reason })}
                          onUpdateStatus={(id, status) => updateStatusMutation.mutate({ id, status })}
                        />
                      ))
                    )}
                  </AnimatePresence>
                </TabsContent>
                
                <TabsContent value="resolved" className="p-4 md:p-5 space-y-4 m-0">
                  {resolvedAlerts.length === 0 ? (
                    <EmptyState 
                      icon={<Clock className="w-12 h-12" />}
                      title="No Resolved Incidents"
                      description="Resolved incidents will appear here"
                    />
                  ) : (
                    resolvedAlerts.slice(0, 20).map(alert => (
                      <IncidentCard
                        key={alert.id}
                        alert={alert}
                        stands={stands as Stand[]}
                        users={users as UserType[]}
                        onAcknowledge={() => {}}
                        onResolve={() => {}}
                        onEscalate={() => {}}
                        onUpdateStatus={() => {}}
                      />
                    ))
                  )}
                </TabsContent>
              </Tabs>
            </GlassCard>
          </div>

          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <SectionHeader 
                title="Response Metrics" 
                icon={<Clock className="w-5 h-5" />}
              />
              <SectionHelp
                title="Response Metrics"
                description="Real-time dashboard showing how incidents are being handled. Track active alerts, claimed incidents, resolution rates, and escalations."
                tips={[
                  "Green numbers are good - incidents being resolved",
                  "Watch for rising escalations - may need intervention",
                  "Claimed means someone has taken ownership"
                ]}
                keywords={['acknowledged', 'priority', 'audit-trail']}
              />
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              <StatCard 
                icon={<Activity className="w-5 h-5" />}
                label="Active Incidents"
                value={activeAlerts.length}
                color={activeAlerts.length > 0 ? "amber" : "green"}
                trend={activeAlerts.length > 3 ? "up" : "neutral"}
              />
              <StatCard 
                icon={<Bell className="w-5 h-5" />}
                label="Claimed"
                value={activeAlerts.filter(a => a.acknowledgedBy).length}
                subValue={`of ${activeAlerts.length} active`}
                color="cyan"
              />
              <StatCard 
                icon={<CheckCircle2 className="w-5 h-5" />}
                label="Resolved Today"
                value={resolvedAlerts.filter(a => {
                  const today = new Date().toDateString();
                  return a.resolvedAt && new Date(a.resolvedAt).toDateString() === today;
                }).length}
                color="green"
              />
              <StatCard 
                icon={<ArrowUp className="w-5 h-5" />}
                label="Escalated"
                value={activeAlerts.filter(a => a.escalationLevel && a.escalationLevel !== 'Level1').length}
                color={activeAlerts.filter(a => a.escalationLevel && a.escalationLevel !== 'Level1').length > 0 ? "purple" : "green"}
              />
            </div>

            <GlassCard gradient className="hidden lg:block">
              <GlassCardHeader>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-slate-300">Emergency Types Guide</h3>
                  <SectionHelp
                    title="Emergency Types"
                    description="Each emergency type has a specific SLA (response time target) and routes to the appropriate responders. Medical and Fire are the most urgent."
                    tips={[
                      "Medical: 3 min SLA - routes to first aid",
                      "Security: 5 min SLA - routes to security team",
                      "Equipment: 10 min SLA - routes to IT/maintenance"
                    ]}
                    keywords={['priority']}
                  />
                </div>
              </GlassCardHeader>
              <GlassCardContent className="space-y-3">
                {EMERGENCY_TYPES.slice(0, 4).map(type => (
                  <div key={type.id} className="flex items-center gap-3 text-sm">
                    <div className={`p-1.5 rounded-lg bg-gradient-to-br ${type.color}`}>
                      <type.icon className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-slate-300 font-medium">{type.label}</p>
                      <p className="text-xs text-slate-500">SLA: {type.sla} min</p>
                    </div>
                  </div>
                ))}
              </GlassCardContent>
            </GlassCard>
          </div>
        </div>
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

      {/* David's Dashboard Controls Superpower */}
      {isDavid && (
        <DashboardControls
          isOpen={showDashboardControls}
          onClose={() => setShowDashboardControls(false)}
        />
      )}
    </AnimatedBackground>
  );
}
