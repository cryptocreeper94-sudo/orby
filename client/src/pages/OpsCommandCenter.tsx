import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useStore } from '@/lib/mockData';
import { useWebSocket, useWebSocketStore, fetchOpsDashboard, updateDeliveryStatus, acknowledgeEmergencyAlert, resolveEmergencyAlert } from '@/lib/websocket';
import { LayoutShell, BentoCard, CarouselRail, AccordionStack } from '@/components/ui/bento';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  LogOut, RefreshCw, Package, Utensils, Beer, Monitor, MapPin,
  AlertTriangle, CheckCircle2, Clock, Users, Truck, Zap, Radio, Shield,
  Activity, Bell, Wifi, WifiOff, Flame, ThermometerSun, ChefHat
} from 'lucide-react';

interface DashboardSummary {
  activeDeliveries: number;
  emergencyDeliveries: number;
  activeEmergencies: number;
  openIssues: number;
  onlineStaff: number;
}

interface DeliveryRequest {
  id: string;
  standId: string;
  requesterId: string;
  department: string;
  priority: string;
  status: string;
  description: string;
  eta?: number;
  createdAt: string;
  updatedAt: string;
}

interface EmergencyAlert {
  id: string;
  alertType: string;
  title: string;
  description: string;
  standId?: string;
  reporterId: string;
  isActive: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  createdAt: string;
}

interface AuditLog {
  id: string;
  userId?: string;
  action: string;
  targetType?: string;
  targetId?: string;
  details?: any;
  createdAt: string;
}

const departmentIcons: Record<string, React.ReactNode> = {
  Warehouse: <Package className="h-4 w-4" />,
  Kitchen: <Utensils className="h-4 w-4" />,
  Bar: <Beer className="h-4 w-4" />,
  IT: <Monitor className="h-4 w-4" />,
  Operations: <Activity className="h-4 w-4" />,
  HR: <Users className="h-4 w-4" />,
};

const departmentColors: Record<string, string> = {
  Warehouse: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  Kitchen: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  Bar: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  IT: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
  Operations: 'bg-green-500/20 text-green-300 border-green-500/30',
  HR: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
};

const statusConfig: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
  Requested: { color: 'bg-yellow-500', icon: <Clock className="h-3 w-3" />, label: 'Requested' },
  Acknowledged: { color: 'bg-blue-500', icon: <CheckCircle2 className="h-3 w-3" />, label: 'Acknowledged' },
  InProgress: { color: 'bg-purple-500', icon: <Package className="h-3 w-3" />, label: 'Picking' },
  OnTheWay: { color: 'bg-green-500', icon: <Truck className="h-3 w-3" />, label: 'On the Way' },
  Delivered: { color: 'bg-gray-500', icon: <CheckCircle2 className="h-3 w-3" />, label: 'Delivered' },
};

const alertTypeIcons: Record<string, React.ReactNode> = {
  medical: <Activity className="h-4 w-4" />,
  security: <Shield className="h-4 w-4" />,
  fire: <Flame className="h-4 w-4" />,
  equipment: <Monitor className="h-4 w-4" />,
  weather: <ThermometerSun className="h-4 w-4" />,
  other: <AlertTriangle className="h-4 w-4" />,
};

function formatTimeAgo(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

export default function OpsCommandCenter() {
  const [, navigate] = useLocation();
  const currentUser = useStore((state) => state.currentUser);
  const logout = useStore((state) => state.logout);
  const { isConnected } = useWebSocket(currentUser?.id ?? undefined, currentUser?.assignedStandId ?? undefined);
  const wsStore = useWebSocketStore();
  
  const [summary, setSummary] = useState<DashboardSummary>({
    activeDeliveries: 0,
    emergencyDeliveries: 0,
    activeEmergencies: 0,
    openIssues: 0,
    onlineStaff: 0,
  });
  const [deliveries, setDeliveries] = useState<DeliveryRequest[]>([]);
  const [emergencies, setEmergencies] = useState<EmergencyAlert[]>([]);
  const [recentActivity, setRecentActivity] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDelivery, setSelectedDelivery] = useState<DeliveryRequest | null>(null);
  const [selectedEmergency, setSelectedEmergency] = useState<EmergencyAlert | null>(null);
  const [resolveNotes, setResolveNotes] = useState('');
  const [etaMinutes, setEtaMinutes] = useState('');
  const [culinaryStats, setCulinaryStats] = useState<{
    total: number;
    checkedIn: number;
    pending: number;
    assignments: Array<{
      cookName: string;
      standName: string;
      checkInTime?: string;
    }>;
  }>({ total: 0, checkedIn: 0, pending: 0, assignments: [] });

  useEffect(() => {
    loadDashboardData();
    loadCulinaryData();
  }, []);

  async function loadCulinaryData() {
    try {
      const res = await fetch('/api/culinary/dashboard-summary');
      if (res.ok) {
        const data = await res.json();
        setCulinaryStats(data);
      }
    } catch (error) {
      console.error('Failed to load culinary data:', error);
    }
  }

  useEffect(() => {
    if (wsStore.deliveries.length > 0) {
      setDeliveries(prev => {
        const updated = [...prev];
        wsStore.deliveries.forEach(wsDelivery => {
          const idx = updated.findIndex(d => d.id === wsDelivery.id);
          if (idx >= 0) {
            updated[idx] = wsDelivery;
          } else {
            updated.unshift(wsDelivery);
          }
        });
        return updated;
      });
    }
  }, [wsStore.deliveries]);

  useEffect(() => {
    if (wsStore.emergencies.length > 0) {
      setEmergencies(wsStore.emergencies);
    }
  }, [wsStore.emergencies]);

  async function loadDashboardData() {
    try {
      setLoading(true);
      const data = await fetchOpsDashboard();
      setSummary(data.summary);
      setDeliveries(data.deliveries || []);
      setEmergencies(data.emergencies || []);
      setRecentActivity(data.recentActivity || []);
      wsStore.setDeliveries(data.deliveries || []);
      wsStore.setEmergencies(data.emergencies || []);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  async function handleStatusUpdate(deliveryId: string, newStatus: string) {
    if (!currentUser) return;
    try {
      const eta = newStatus === 'OnTheWay' ? parseInt(etaMinutes) || 10 : undefined;
      await updateDeliveryStatus(deliveryId, newStatus, currentUser.id, eta);
      await loadDashboardData();
      setSelectedDelivery(null);
      setEtaMinutes('');
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  }

  async function handleAcknowledgeEmergency(alertId: string) {
    if (!currentUser) return;
    try {
      await acknowledgeEmergencyAlert(alertId, currentUser.id);
      await loadDashboardData();
    } catch (error) {
      console.error('Failed to acknowledge:', error);
    }
  }

  async function handleResolveEmergency(alertId: string) {
    if (!currentUser) return;
    try {
      await resolveEmergencyAlert(alertId, currentUser.id, resolveNotes);
      await loadDashboardData();
      setSelectedEmergency(null);
      setResolveNotes('');
    } catch (error) {
      console.error('Failed to resolve:', error);
    }
  }

  const activeDeliveries = deliveries.filter(d => 
    ['Requested', 'Acknowledged', 'InProgress', 'OnTheWay'].includes(d.status)
  );
  
  const emergencyDeliveries = activeDeliveries.filter(d => d.priority === 'Emergency');
  const normalDeliveries = activeDeliveries.filter(d => d.priority !== 'Emergency');

  const heroCarouselItems = [
    <div key="stats" className="flex gap-3 w-[320px] h-[88px]" data-testid="hero-stats">
      <StatCard 
        value={summary.activeDeliveries} 
        label="Active Deliveries" 
        icon={<Truck className="h-5 w-5 text-cyan-400" />}
        bgColor="bg-cyan-500/20"
        testId="stat-active-deliveries"
      />
      <StatCard 
        value={summary.activeEmergencies} 
        label="Active Alerts" 
        icon={<AlertTriangle className="h-5 w-5 text-red-400" />}
        bgColor="bg-red-500/20"
        testId="stat-emergencies"
      />
    </div>,
    <div key="stats2" className="flex gap-3 w-[320px] h-[88px]" data-testid="hero-stats-2">
      <StatCard 
        value={summary.emergencyDeliveries} 
        label="Emergency Requests" 
        icon={<Zap className="h-5 w-5 text-orange-400" />}
        bgColor="bg-orange-500/20"
        testId="stat-emergency-deliveries"
      />
      <StatCard 
        value={summary.onlineStaff} 
        label="Staff Online" 
        icon={<Users className="h-5 w-5 text-green-400" />}
        bgColor="bg-green-500/20"
        testId="stat-online-staff"
      />
    </div>,
    ...emergencies.map((alert) => (
      <div 
        key={alert.id} 
        className="p-3 rounded-lg bg-red-900/40 border border-red-500/40 w-[320px] h-[88px]"
        data-testid={`alert-${alert.id}`}
      >
        <div className="flex items-start gap-2">
          {alertTypeIcons[alert.alertType] || <AlertTriangle className="h-4 w-4 text-red-400 mt-0.5" />}
          <div className="flex-1 min-w-0">
            <p className="font-medium text-white truncate">{alert.title}</p>
            <p className="text-xs text-gray-400 truncate">{alert.description}</p>
            {alert.standId && (
              <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                <MapPin className="h-3 w-3" /> Stand {alert.standId}
              </p>
            )}
          </div>
        </div>
        <div className="flex gap-2 mt-2">
          {!alert.acknowledgedBy ? (
            <Button
              size="sm"
              onClick={() => handleAcknowledgeEmergency(alert.id)}
              className="bg-red-600 hover:bg-red-700 text-white text-xs"
              data-testid={`button-acknowledge-${alert.id}`}
            >
              Acknowledge
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={() => setSelectedEmergency(alert)}
              className="bg-green-600 hover:bg-green-700 text-white text-xs"
              data-testid={`button-resolve-${alert.id}`}
            >
              Resolve
            </Button>
          )}
        </div>
      </div>
    ))
  ];

  const incidentCarouselItems = [
    ...emergencyDeliveries.map((delivery) => (
      <DeliveryCard 
        key={delivery.id} 
        delivery={delivery}
        onSelect={() => setSelectedDelivery(delivery)}
      />
    )),
    ...normalDeliveries.slice(0, 5).map((delivery) => (
      <DeliveryCard 
        key={delivery.id} 
        delivery={delivery}
        onSelect={() => setSelectedDelivery(delivery)}
      />
    ))
  ];

  const teamItems = culinaryStats.assignments.slice(0, 6).map((assignment, idx) => (
    <div
      key={idx}
      className="flex items-center justify-between p-2 rounded bg-slate-900/50 w-[180px] h-[48px]"
      data-testid={`culinary-assignment-${idx}`}
    >
      <div className="flex items-center gap-2">
        <ChefHat className="h-4 w-4 text-orange-400" />
        <span className="text-xs text-white truncate max-w-[80px]">{assignment.cookName}</span>
      </div>
      {assignment.checkInTime ? (
        <Badge className="bg-green-500/20 text-green-300 border-green-500/30 text-xs">
          <CheckCircle2 className="h-3 w-3 mr-1" /> In
        </Badge>
      ) : (
        <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30 text-xs">
          <Clock className="h-3 w-3 mr-1" /> Pending
        </Badge>
      )}
    </div>
  ));

  const protocolItems = [
    {
      title: 'Active Deliveries by Department',
      content: (
        <div className="space-y-2" data-testid="section-deliveries">
          {['Warehouse', 'Kitchen', 'Bar', 'IT', 'Operations', 'HR'].map((dept) => {
            const deptDeliveries = normalDeliveries.filter(d => d.department === dept);
            if (deptDeliveries.length === 0) return null;
            return (
              <div key={dept} className="space-y-1">
                <div className="flex items-center gap-2" data-testid={`accordion-${dept}`}>
                  <span className={`p-1 rounded ${departmentColors[dept]}`}>
                    {departmentIcons[dept]}
                  </span>
                  <span className="text-white text-sm">{dept}</span>
                  <Badge variant="secondary" className="ml-1 bg-slate-700 text-xs">
                    {deptDeliveries.length}
                  </Badge>
                </div>
                <div className="pl-6 space-y-1">
                  {deptDeliveries.slice(0, 3).map((delivery) => (
                    <button
                      key={delivery.id}
                      onClick={() => setSelectedDelivery(delivery)}
                      className="w-full text-left p-2 rounded bg-slate-900/60 hover:bg-slate-800/60 text-xs"
                      data-testid={`delivery-item-${delivery.id}`}
                    >
                      <span className="text-gray-300 truncate block">{delivery.description}</span>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
          {normalDeliveries.length === 0 && (
            <div className="text-center py-4 text-gray-500">
              <Truck className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No active deliveries</p>
            </div>
          )}
        </div>
      )
    },
    {
      title: 'Communication Log',
      content: (
        <ScrollArea className="h-[150px]" data-testid="section-activity">
          <div className="space-y-2">
            {recentActivity.length > 0 ? (
              recentActivity.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center gap-2 p-2 rounded bg-slate-900/50"
                  data-testid={`activity-${log.id}`}
                >
                  <div className="h-2 w-2 rounded-full bg-cyan-400" />
                  <span className="text-xs text-gray-300 flex-1">{log.action}</span>
                  <span className="text-xs text-gray-500">{formatTimeAgo(log.createdAt)}</span>
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-gray-500">
                <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No recent activity</p>
              </div>
            )}
          </div>
        </ScrollArea>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950" data-testid="ops-command-center">
      <header className="sticky top-0 z-50 backdrop-blur-md bg-slate-900/80 border-b border-cyan-500/20">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Radio className="h-6 w-6 text-cyan-400" />
              <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Ops Command</h1>
              <p className="text-xs text-gray-400">Real-time Operations View</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-slate-800">
              {isConnected ? (
                <>
                  <Wifi className="h-3.5 w-3.5 text-green-400" />
                  <span className="text-xs text-green-400">Live</span>
                </>
              ) : (
                <>
                  <WifiOff className="h-3.5 w-3.5 text-red-400" />
                  <span className="text-xs text-red-400">Offline</span>
                </>
              )}
            </div>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={loadDashboardData}
              className="text-gray-400"
              data-testid="button-refresh"
            >
              <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={handleLogout}
              className="text-gray-400"
              data-testid="button-logout"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="p-4 pb-24">
        <LayoutShell className="gap-3">
          <BentoCard span={12} className="bg-red-950/20 border-red-500/20" data-testid="hero-row">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-red-400" />
              <span className="text-sm font-medium text-red-400">Critical Alerts & Status</span>
            </div>
            <CarouselRail 
              items={heroCarouselItems} 
              autoplay={emergencies.length > 0}
              showDots={heroCarouselItems.length > 2}
            />
          </BentoCard>

          <BentoCard span={8} className="lg:col-span-8 md:col-span-6 col-span-4" data-testid="command-incidents">
            <div className="flex items-center gap-2 mb-2">
              <Truck className="h-4 w-4 text-cyan-400" />
              <span className="text-sm font-medium text-cyan-400">Active Incidents ({activeDeliveries.length})</span>
            </div>
            {incidentCarouselItems.length > 0 ? (
              <CarouselRail items={incidentCarouselItems} showDots />
            ) : (
              <div className="text-center py-6 text-gray-500">
                <Truck className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No active incidents</p>
              </div>
            )}
          </BentoCard>

          <BentoCard span={4} className="lg:col-span-4 md:col-span-6 col-span-4" data-testid="command-teams">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 text-orange-400" />
              <span className="text-sm font-medium text-orange-400">Response Teams</span>
            </div>
            <div className="grid grid-cols-3 gap-2 mb-3">
              <div className="p-2 rounded bg-slate-900/50 text-center">
                <p className="text-lg font-bold text-white">{culinaryStats.total}</p>
                <p className="text-xs text-gray-400">Assigned</p>
              </div>
              <div className="p-2 rounded bg-green-900/30 text-center">
                <p className="text-lg font-bold text-green-400">{culinaryStats.checkedIn}</p>
                <p className="text-xs text-gray-400">In</p>
              </div>
              <div className="p-2 rounded bg-yellow-900/30 text-center">
                <p className="text-lg font-bold text-yellow-400">{culinaryStats.pending}</p>
                <p className="text-xs text-gray-400">Pending</p>
              </div>
            </div>
            {teamItems.length > 0 ? (
              <CarouselRail items={teamItems} />
            ) : (
              <div className="text-center py-4 text-gray-500">
                <ChefHat className="h-6 w-6 mx-auto mb-1 opacity-50" />
                <p className="text-xs">No assignments</p>
              </div>
            )}
          </BentoCard>

          <BentoCard span={6} className="lg:col-span-6 md:col-span-6 col-span-4" data-testid="resources-staff">
            <div className="flex items-center gap-2 mb-2">
              <ChefHat className="h-4 w-4 text-orange-400" />
              <span className="text-sm font-medium text-orange-400">Staff Deployment</span>
            </div>
            <ScrollArea className="h-[120px]" data-testid="section-culinary">
              <div className="space-y-2">
                {culinaryStats.assignments.length > 0 ? (
                  culinaryStats.assignments.map((assignment, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 rounded bg-slate-900/50"
                      data-testid={`staff-assignment-${idx}`}
                    >
                      <div className="flex items-center gap-2">
                        <ChefHat className="h-4 w-4 text-orange-400" />
                        <span className="text-sm text-white">{assignment.cookName}</span>
                        <span className="text-xs text-gray-500">{assignment.standName}</span>
                      </div>
                      {assignment.checkInTime ? (
                        <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                          <CheckCircle2 className="h-3 w-3 mr-1" /> In
                        </Badge>
                      ) : (
                        <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30">
                          <Clock className="h-3 w-3 mr-1" /> Pending
                        </Badge>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    <ChefHat className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No culinary assignments</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </BentoCard>

          <BentoCard span={6} className="lg:col-span-6 md:col-span-6 col-span-4" data-testid="resources-equipment">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="h-4 w-4 text-cyan-400" />
              <span className="text-sm font-medium text-cyan-400">Equipment Status</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 rounded bg-slate-900/50 flex items-center gap-2" data-testid="equipment-pos">
                <div className="h-8 w-8 rounded-full bg-green-500/20 flex items-center justify-center">
                  <Monitor className="h-4 w-4 text-green-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">POS Systems</p>
                  <p className="text-xs text-green-400">All Online</p>
                </div>
              </div>
              <div className="p-3 rounded bg-slate-900/50 flex items-center gap-2" data-testid="equipment-comms">
                <div className="h-8 w-8 rounded-full bg-cyan-500/20 flex items-center justify-center">
                  <Radio className="h-4 w-4 text-cyan-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Radios</p>
                  <p className="text-xs text-cyan-400">Active</p>
                </div>
              </div>
              <div className="p-3 rounded bg-slate-900/50 flex items-center gap-2" data-testid="equipment-kitchen">
                <div className="h-8 w-8 rounded-full bg-orange-500/20 flex items-center justify-center">
                  <Utensils className="h-4 w-4 text-orange-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Kitchen</p>
                  <p className="text-xs text-orange-400">Operational</p>
                </div>
              </div>
              <div className="p-3 rounded bg-slate-900/50 flex items-center gap-2" data-testid="equipment-delivery">
                <div className="h-8 w-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                  <Truck className="h-4 w-4 text-purple-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Delivery</p>
                  <p className="text-xs text-purple-400">Ready</p>
                </div>
              </div>
            </div>
          </BentoCard>

          <BentoCard span={12} data-testid="support-row">
            <AccordionStack items={protocolItems} defaultOpen={[0]} />
          </BentoCard>
        </LayoutShell>
      </main>

      <Dialog open={!!selectedDelivery} onOpenChange={() => setSelectedDelivery(null)}>
        <DialogContent className="bg-slate-900 border-cyan-500/30">
          <DialogHeader>
            <DialogTitle className="text-white">Update Delivery Status</DialogTitle>
          </DialogHeader>
          {selectedDelivery && (
            <div className="space-y-4">
              <div className="p-3 rounded bg-slate-800">
                <p className="text-sm text-gray-400">{selectedDelivery.description}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge className={departmentColors[selectedDelivery.department]}>
                    {selectedDelivery.department}
                  </Badge>
                  <span className="text-xs text-gray-500">Stand {selectedDelivery.standId}</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm text-gray-400">Current Status: <span className="text-white">{selectedDelivery.status}</span></p>
                
                {selectedDelivery.status === 'OnTheWay' && (
                  <div className="space-y-2">
                    <label className="text-sm text-gray-400">ETA (minutes)</label>
                    <Input
                      type="number"
                      value={etaMinutes}
                      onChange={(e) => setEtaMinutes(e.target.value)}
                      placeholder="Enter minutes"
                      className="bg-slate-800 border-slate-700"
                      data-testid="input-eta"
                    />
                  </div>
                )}
              </div>

              <DialogFooter className="flex-col gap-2 sm:flex-row">
                {selectedDelivery.status === 'Requested' && (
                  <Button
                    onClick={() => handleStatusUpdate(selectedDelivery.id, 'Acknowledged')}
                    className="bg-blue-600 hover:bg-blue-700 w-full"
                    data-testid="button-acknowledge"
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Acknowledge
                  </Button>
                )}
                {selectedDelivery.status === 'Acknowledged' && (
                  <Button
                    onClick={() => handleStatusUpdate(selectedDelivery.id, 'InProgress')}
                    className="bg-purple-600 hover:bg-purple-700 w-full"
                    data-testid="button-start-picking"
                  >
                    <Package className="h-4 w-4 mr-2" />
                    Start Picking
                  </Button>
                )}
                {selectedDelivery.status === 'InProgress' && (
                  <Button
                    onClick={() => handleStatusUpdate(selectedDelivery.id, 'OnTheWay')}
                    className="bg-green-600 hover:bg-green-700 w-full"
                    data-testid="button-dispatch"
                  >
                    <Truck className="h-4 w-4 mr-2" />
                    Dispatch
                  </Button>
                )}
                {selectedDelivery.status === 'OnTheWay' && (
                  <Button
                    onClick={() => handleStatusUpdate(selectedDelivery.id, 'Delivered')}
                    className="bg-green-600 hover:bg-green-700 w-full"
                    data-testid="button-mark-delivered"
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Mark Delivered
                  </Button>
                )}
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedEmergency} onOpenChange={() => setSelectedEmergency(null)}>
        <DialogContent className="bg-slate-900 border-red-500/30">
          <DialogHeader>
            <DialogTitle className="text-white">Resolve Emergency Alert</DialogTitle>
          </DialogHeader>
          {selectedEmergency && (
            <div className="space-y-4">
              <div className="p-3 rounded bg-red-900/30">
                <p className="font-medium text-white">{selectedEmergency.title}</p>
                <p className="text-sm text-gray-400 mt-1">{selectedEmergency.description}</p>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm text-gray-400">Resolution Notes</label>
                <Textarea
                  value={resolveNotes}
                  onChange={(e) => setResolveNotes(e.target.value)}
                  placeholder="Describe how the issue was resolved..."
                  className="bg-slate-800 border-slate-700"
                  data-testid="input-resolution-notes"
                />
              </div>

              <DialogFooter>
                <Button
                  onClick={() => handleResolveEmergency(selectedEmergency.id)}
                  className="bg-green-600 hover:bg-green-700 w-full"
                  data-testid="button-submit-resolution"
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Mark Resolved
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <nav className="fixed bottom-0 left-0 right-0 bg-slate-900/90 backdrop-blur-md border-t border-cyan-500/20 px-4 py-3" data-testid="nav-bottom">
        <div className="flex justify-around items-center">
          <Button variant="ghost" className="flex-col gap-1 h-auto text-cyan-400" data-testid="nav-command">
            <Radio className="h-5 w-5" />
            <span className="text-xs">Command</span>
          </Button>
          <Button variant="ghost" className="flex-col gap-1 h-auto text-gray-400" data-testid="nav-deliveries">
            <Truck className="h-5 w-5" />
            <span className="text-xs">Deliveries</span>
          </Button>
          <Button variant="ghost" className="flex-col gap-1 h-auto text-gray-400" data-testid="nav-alerts">
            <Bell className="h-5 w-5" />
            <span className="text-xs">Alerts</span>
          </Button>
          <Button variant="ghost" className="flex-col gap-1 h-auto text-gray-400" data-testid="nav-staff">
            <Users className="h-5 w-5" />
            <span className="text-xs">Staff</span>
          </Button>
        </div>
      </nav>
    </div>
  );
}

function StatCard({ value, label, icon, bgColor, testId }: { 
  value: number; 
  label: string; 
  icon: React.ReactNode; 
  bgColor: string;
  testId: string;
}) {
  return (
    <div className="p-3 rounded-lg bg-slate-800/60 border border-white/10 w-[140px] h-[72px]" data-testid={testId}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xl font-bold text-white">{value}</p>
          <p className="text-xs text-gray-400">{label}</p>
        </div>
        <div className={`h-9 w-9 rounded-full ${bgColor} flex items-center justify-center`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function DeliveryCard({ delivery, onSelect }: { delivery: DeliveryRequest; onSelect: () => void }) {
  const statusCfg = statusConfig[delivery.status] || statusConfig.Requested;
  
  return (
    <button
      onClick={onSelect}
      className="text-left p-3 rounded-lg bg-slate-900/50 border border-slate-700/50 hover:border-cyan-500/30 transition-colors w-[220px] h-[120px]"
      data-testid={`delivery-card-${delivery.id}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm text-white truncate">{delivery.description}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-gray-500 flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              Stand {delivery.standId}
            </span>
            {delivery.eta && (
              <span className="text-xs text-green-400 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {delivery.eta}m ETA
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full ${statusCfg.color}/20`}>
            <span className={`${statusCfg.color} text-white`}>{statusCfg.icon}</span>
            <span className="text-xs text-white">{statusCfg.label}</span>
          </div>
          <span className="text-xs text-gray-500">{formatTimeAgo(delivery.createdAt)}</span>
        </div>
      </div>
      {delivery.priority === 'Emergency' && (
        <div className="mt-2">
          <Badge variant="destructive" className="bg-red-500/20 text-red-400 border-red-500/30">
            <Zap className="h-3 w-3 mr-1" />
            Emergency
          </Badge>
        </div>
      )}
    </button>
  );
}
