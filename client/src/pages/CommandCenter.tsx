import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { 
  AlertTriangle, 
  Heart, 
  Shield, 
  Flame, 
  Wrench, 
  Cloud, 
  Users, 
  HelpCircle,
  ChevronLeft,
  Clock,
  MapPin,
  User,
  Phone,
  CheckCircle2,
  XCircle,
  ArrowUp,
  Bell,
  Siren,
  Timer,
  Activity,
  Send
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useStore } from '@/lib/mockData';
import type { EmergencyAlert, Stand, User as UserType } from '@shared/schema';

const EMERGENCY_TYPES = [
  { id: 'Medical', icon: Heart, color: 'bg-red-600', label: 'Medical Emergency', sla: 3 },
  { id: 'Security', icon: Shield, color: 'bg-orange-600', label: 'Security Threat', sla: 5 },
  { id: 'Fire', icon: Flame, color: 'bg-red-700', label: 'Fire/Smoke', sla: 2 },
  { id: 'Equipment', icon: Wrench, color: 'bg-yellow-600', label: 'Equipment Failure', sla: 10 },
  { id: 'Weather', icon: Cloud, color: 'bg-blue-600', label: 'Weather Alert', sla: 5 },
  { id: 'Crowd', icon: Users, color: 'bg-purple-600', label: 'Crowd Control', sla: 5 },
  { id: 'Other', icon: HelpCircle, color: 'bg-slate-600', label: 'Other Emergency', sla: 10 }
];

const STATUS_COLORS: Record<string, string> = {
  'Reported': 'bg-red-600 text-white',
  'Dispatched': 'bg-orange-600 text-white',
  'OnScene': 'bg-yellow-600 text-black',
  'Stabilized': 'bg-blue-600 text-white',
  'Resolved': 'bg-green-600 text-white',
  'Escalated': 'bg-purple-600 text-white'
};

const ESCALATION_LEVELS: Record<string, { label: string; color: string }> = {
  'Level1': { label: 'L1 - Supervisor', color: 'bg-slate-600' },
  'Level2': { label: 'L2 - Manager', color: 'bg-yellow-600' },
  'Level3': { label: 'L3 - Executive', color: 'bg-orange-600' },
  'Level4': { label: 'L4 - External', color: 'bg-red-600' }
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
    <div className={`flex items-center gap-1 text-sm font-mono ${isOverdue ? 'text-red-400 animate-pulse' : 'text-emerald-400'}`}>
      <Timer className="w-3 h-3" />
      {isOverdue ? (
        <span>-{formatTime(remaining)}</span>
      ) : (
        <span>{formatTime(remaining)}</span>
      )}
    </div>
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
  
  return (
    <>
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="p-3">
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-lg ${typeConfig.color}`}>
              <TypeIcon className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-1">
                <h4 className="font-semibold text-white truncate">{alert.title}</h4>
                <Badge className={STATUS_COLORS[alert.status || 'Reported']}>
                  {alert.status}
                </Badge>
              </div>
              
              <div className="flex items-center gap-3 text-xs text-slate-400 mb-2">
                {stand && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {stand.name}
                  </span>
                )}
                {reporter && (
                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {reporter.name}
                  </span>
                )}
                <SLATimer 
                  createdAt={alert.createdAt?.toString() || null}
                  slaMinutes={alert.slaTargetMinutes || typeConfig.sla}
                />
              </div>
              
              {alert.description && (
                <p className="text-sm text-slate-300 mb-2 line-clamp-2">{alert.description}</p>
              )}
              
              <div className="flex items-center gap-2 flex-wrap">
                {alert.escalationLevel && (
                  <Badge variant="outline" className={`text-xs ${ESCALATION_LEVELS[alert.escalationLevel]?.color}`}>
                    {ESCALATION_LEVELS[alert.escalationLevel]?.label}
                  </Badge>
                )}
                {acknowledger && (
                  <span className="text-xs text-slate-400">
                    Claimed by {acknowledger.name}
                  </span>
                )}
              </div>
              
              <div className="flex items-center gap-2 mt-3">
                {!alert.acknowledgedBy && (
                  <Button 
                    size="sm" 
                    className="bg-cyan-600 hover:bg-cyan-700"
                    onClick={() => onAcknowledge(alert.id)}
                    data-testid={`button-acknowledge-${alert.id}`}
                  >
                    <Bell className="w-3 h-3 mr-1" />
                    Claim
                  </Button>
                )}
                
                {alert.acknowledgedBy && alert.status !== 'Resolved' && (
                  <>
                    {alert.status === 'Dispatched' && (
                      <Button 
                        size="sm"
                        variant="outline"
                        className="border-yellow-600 text-yellow-400"
                        onClick={() => onUpdateStatus(alert.id, 'OnScene')}
                        data-testid={`button-onscene-${alert.id}`}
                      >
                        On Scene
                      </Button>
                    )}
                    {alert.status === 'OnScene' && (
                      <Button 
                        size="sm"
                        variant="outline"
                        className="border-blue-600 text-blue-400"
                        onClick={() => onUpdateStatus(alert.id, 'Stabilized')}
                        data-testid={`button-stabilized-${alert.id}`}
                      >
                        Stabilized
                      </Button>
                    )}
                    <Button 
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => setShowResolveDialog(true)}
                      data-testid={`button-resolve-${alert.id}`}
                    >
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Resolve
                    </Button>
                    <Button 
                      size="sm"
                      variant="outline"
                      className="border-orange-600 text-orange-400"
                      onClick={() => setShowEscalateDialog(true)}
                      data-testid={`button-escalate-${alert.id}`}
                    >
                      <ArrowUp className="w-3 h-3 mr-1" />
                      Escalate
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showResolveDialog} onOpenChange={setShowResolveDialog}>
        <DialogContent className="bg-slate-900 border-slate-700" data-testid={`dialog-resolve-${alert.id}`}>
          <DialogHeader>
            <DialogTitle className="text-white">Resolve Incident</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-slate-300">Resolution Type</Label>
              <Select value={resolutionType} onValueChange={setResolutionType}>
                <SelectTrigger className="bg-slate-800 border-slate-600 text-white" data-testid={`select-resolution-type-${alert.id}`}>
                  <SelectValue placeholder="How was it resolved?" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-600">
                  <SelectItem value="Handled Internally" data-testid="option-handled-internally">Handled Internally</SelectItem>
                  <SelectItem value="External Services Called" data-testid="option-external-services">External Services Called</SelectItem>
                  <SelectItem value="False Alarm" data-testid="option-false-alarm">False Alarm</SelectItem>
                  <SelectItem value="Deferred" data-testid="option-deferred">Deferred/Referred</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-slate-300">Resolution Notes</Label>
              <Textarea 
                className="bg-slate-800 border-slate-600 text-white"
                placeholder="Describe how the incident was resolved..."
                value={resolveNotes}
                onChange={(e) => setResolveNotes(e.target.value)}
                data-testid={`input-resolution-notes-${alert.id}`}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowResolveDialog(false)} data-testid={`button-cancel-resolve-${alert.id}`}>Cancel</Button>
            <Button 
              className="bg-green-600 hover:bg-green-700"
              onClick={handleResolve}
              disabled={!resolutionType}
              data-testid={`button-confirm-resolve-${alert.id}`}
            >
              Resolve Incident
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showEscalateDialog} onOpenChange={setShowEscalateDialog}>
        <DialogContent className="bg-slate-900 border-slate-700" data-testid={`dialog-escalate-${alert.id}`}>
          <DialogHeader>
            <DialogTitle className="text-white">Escalate Incident</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-slate-300">Escalate To</Label>
              <Select value={nextLevel} onValueChange={setNextLevel}>
                <SelectTrigger className="bg-slate-800 border-slate-600 text-white" data-testid={`select-escalation-level-${alert.id}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-600">
                  <SelectItem value="Level2" data-testid="option-level2">Level 2 - Manager</SelectItem>
                  <SelectItem value="Level3" data-testid="option-level3">Level 3 - Executive</SelectItem>
                  <SelectItem value="Level4" data-testid="option-level4">Level 4 - External Services</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-slate-300">Reason for Escalation</Label>
              <Textarea 
                className="bg-slate-800 border-slate-600 text-white"
                placeholder="Why does this need escalation?"
                value={escalateReason}
                onChange={(e) => setEscalateReason(e.target.value)}
                data-testid={`input-escalation-reason-${alert.id}`}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowEscalateDialog(false)} data-testid={`button-cancel-escalate-${alert.id}`}>Cancel</Button>
            <Button 
              className="bg-orange-600 hover:bg-orange-700"
              onClick={handleEscalate}
              disabled={!escalateReason}
              data-testid={`button-confirm-escalate-${alert.id}`}
            >
              Escalate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function CommandCenter() {
  const [, navigate] = useLocation();
  const currentUser = useStore((state) => state.currentUser);
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      <header className="bg-slate-900/80 backdrop-blur border-b border-slate-800 sticky top-0 z-50">
        <div className="flex items-center justify-between p-3">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate('/dev')}
              className="text-slate-400"
              data-testid="button-back"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-lg font-bold text-white flex items-center gap-2">
                <Siren className="w-5 h-5 text-red-500" />
                Command Center
              </h1>
              <p className="text-xs text-slate-400">Emergency Response Control</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {criticalAlerts.length > 0 && (
              <Badge variant="destructive" className="animate-pulse" data-testid="badge-critical-count">
                {criticalAlerts.length} Critical
              </Badge>
            )}
            <Badge variant="outline" className="border-slate-600 text-slate-300" data-testid="badge-active-count">
              {activeAlerts.length} Active
            </Badge>
          </div>
        </div>
      </header>

      <main className="p-3 space-y-4 pb-24">
        <Card className="bg-red-900/20 border-red-900/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-red-400 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Quick Alert - One Tap Emergency
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-2">
              {EMERGENCY_TYPES.slice(0, 4).map((type) => {
                const Icon = type.icon;
                return (
                  <Button
                    key={type.id}
                    className={`${type.color} hover:opacity-90 h-16 flex-col gap-1`}
                    onClick={() => {
                      setSelectedType(type.id);
                      setShowNewIncident(true);
                    }}
                    data-testid={`button-quick-${type.id.toLowerCase()}`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-[10px]">{type.id}</span>
                  </Button>
                );
              })}
            </div>
            <div className="grid grid-cols-3 gap-2 mt-2">
              {EMERGENCY_TYPES.slice(4).map((type) => {
                const Icon = type.icon;
                return (
                  <Button
                    key={type.id}
                    variant="outline"
                    className="border-slate-600 h-12 flex-col gap-1"
                    onClick={() => {
                      setSelectedType(type.id);
                      setShowNewIncident(true);
                    }}
                    data-testid={`button-quick-${type.id.toLowerCase()}`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-[10px]">{type.id}</span>
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/30 border-slate-700">
          <CardContent className="p-0">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="w-full bg-slate-800/50 rounded-none border-b border-slate-700">
                <TabsTrigger 
                  value="active" 
                  className="flex-1 data-[state=active]:bg-slate-700"
                  data-testid="tab-active"
                >
                  <Activity className="w-4 h-4 mr-1" />
                  Active ({activeAlerts.length})
                </TabsTrigger>
                <TabsTrigger 
                  value="resolved" 
                  className="flex-1 data-[state=active]:bg-slate-700"
                  data-testid="tab-resolved"
                >
                  <CheckCircle2 className="w-4 h-4 mr-1" />
                  Resolved ({resolvedAlerts.length})
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="active" className="p-3 space-y-3 m-0">
                {alertsLoading ? (
                  <div className="text-center py-8 text-slate-400">
                    <Activity className="w-8 h-8 mx-auto mb-2 animate-pulse" />
                    Loading incidents...
                  </div>
                ) : activeAlerts.length === 0 ? (
                  <div className="text-center py-8 text-slate-400">
                    <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-green-500" />
                    <p className="font-medium">All Clear</p>
                    <p className="text-xs">No active incidents</p>
                  </div>
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
              </TabsContent>
              
              <TabsContent value="resolved" className="p-3 space-y-3 m-0">
                {resolvedAlerts.length === 0 ? (
                  <div className="text-center py-8 text-slate-400">
                    <p>No resolved incidents today</p>
                  </div>
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
          </CardContent>
        </Card>

        <Card className="bg-slate-800/30 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-300 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Response Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-3 bg-slate-800/50 rounded-lg">
                <div className="text-2xl font-bold text-white">{activeAlerts.length}</div>
                <div className="text-xs text-slate-400">Active</div>
              </div>
              <div className="text-center p-3 bg-slate-800/50 rounded-lg">
                <div className="text-2xl font-bold text-cyan-400">
                  {activeAlerts.filter(a => a.acknowledgedBy).length}
                </div>
                <div className="text-xs text-slate-400">Claimed</div>
              </div>
              <div className="text-center p-3 bg-slate-800/50 rounded-lg">
                <div className="text-2xl font-bold text-green-400">
                  {resolvedAlerts.filter(a => {
                    const today = new Date().toDateString();
                    return a.resolvedAt && new Date(a.resolvedAt).toDateString() === today;
                  }).length}
                </div>
                <div className="text-xs text-slate-400">Resolved Today</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      <Dialog open={showNewIncident} onOpenChange={setShowNewIncident}>
        <DialogContent className="bg-slate-900 border-slate-700 max-w-md" data-testid="dialog-new-incident">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              {selectedType && (() => {
                const typeConfig = EMERGENCY_TYPES.find(t => t.id === selectedType);
                const Icon = typeConfig?.icon || AlertTriangle;
                return (
                  <>
                    <Icon className="w-5 h-5 text-red-500" />
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
                className="bg-slate-800 border-slate-600 text-white"
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
                <SelectTrigger className="bg-slate-800 border-slate-600 text-white" data-testid="select-incident-location">
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-600 max-h-60">
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
                className="bg-slate-800 border-slate-600 text-white"
                placeholder="e.g., Near Section 115 entrance"
                value={newIncident.locationDetails}
                onChange={(e) => setNewIncident({...newIncident, locationDetails: e.target.value})}
                data-testid="input-location-details"
              />
            </div>
            
            <div>
              <Label className="text-slate-300">Description</Label>
              <Textarea 
                className="bg-slate-800 border-slate-600 text-white"
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
              data-testid="button-cancel-new-incident"
            >
              Cancel
            </Button>
            <Button 
              className="bg-red-600 hover:bg-red-700"
              onClick={handleCreateAlert}
              disabled={createAlertMutation.isPending}
              data-testid="button-submit-alert"
            >
              <Send className="w-4 h-4 mr-1" />
              Send Alert
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
