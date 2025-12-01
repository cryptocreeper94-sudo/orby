import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useStore } from '@/lib/mockData';
import { useWebSocket, useWebSocketStore, fetchOpsDashboard, fetchDeliveries, fetchEmergencyAlerts, updateDeliveryStatus, acknowledgeEmergencyAlert, resolveEmergencyAlert } from '@/lib/websocket';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  LogOut, RefreshCw, Package, Utensils, Beer, Monitor, Trash2, MapPin,
  AlertTriangle, CheckCircle2, Clock, Users, Truck, Zap, Radio, Shield,
  Activity, Bell, ChevronRight, Wifi, WifiOff, Flame, ThermometerSun
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
  Janitorial: <Trash2 className="h-4 w-4" />,
};

const departmentColors: Record<string, string> = {
  Warehouse: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  Kitchen: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  Bar: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  IT: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
  Janitorial: 'bg-green-500/20 text-green-300 border-green-500/30',
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

  useEffect(() => {
    loadDashboardData();
  }, []);

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950">
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

      <main className="p-4 pb-24 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Card className="bg-slate-800/50 border-cyan-500/20" data-testid="stat-active-deliveries">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-white">{summary.activeDeliveries}</p>
                  <p className="text-xs text-gray-400">Active Deliveries</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-cyan-500/20 flex items-center justify-center">
                  <Truck className="h-5 w-5 text-cyan-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-red-500/20" data-testid="stat-emergencies">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-white">{summary.activeEmergencies}</p>
                  <p className="text-xs text-gray-400">Active Alerts</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-red-500/20 flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-red-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-orange-500/20" data-testid="stat-emergency-deliveries">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-white">{summary.emergencyDeliveries}</p>
                  <p className="text-xs text-gray-400">Emergency Requests</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-orange-500/20 flex items-center justify-center">
                  <Zap className="h-5 w-5 text-orange-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-green-500/20" data-testid="stat-online-staff">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-white">{summary.onlineStaff}</p>
                  <p className="text-xs text-gray-400">Staff Online</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-green-500/20 flex items-center justify-center">
                  <Users className="h-5 w-5 text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {emergencies.length > 0 && (
          <Card className="bg-red-950/30 border-red-500/30 animate-pulse-slow" data-testid="section-emergencies">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg text-red-400 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Active Emergency Alerts
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {emergencies.map((alert) => (
                <div
                  key={alert.id}
                  className="p-3 rounded-lg bg-red-900/30 border border-red-500/30"
                  data-testid={`alert-${alert.id}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-2">
                      {alertTypeIcons[alert.alertType] || <AlertTriangle className="h-4 w-4 text-red-400 mt-0.5" />}
                      <div>
                        <p className="font-medium text-white">{alert.title}</p>
                        <p className="text-sm text-gray-400">{alert.description}</p>
                        {alert.standId && (
                          <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                            <MapPin className="h-3 w-3" />
                            Stand {alert.standId}
                          </p>
                        )}
                      </div>
                    </div>
                    <span className="text-xs text-gray-500">{formatTimeAgo(alert.createdAt)}</span>
                  </div>
                  <div className="flex gap-2 mt-2">
                    {!alert.acknowledgedBy ? (
                      <Button
                        size="sm"
                        onClick={() => handleAcknowledgeEmergency(alert.id)}
                        className="bg-red-600 hover:bg-red-700 text-white"
                        data-testid={`button-acknowledge-${alert.id}`}
                      >
                        Acknowledge
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => setSelectedEmergency(alert)}
                        className="bg-green-600 hover:bg-green-700 text-white"
                        data-testid={`button-resolve-${alert.id}`}
                      >
                        Resolve
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {emergencyDeliveries.length > 0 && (
          <Card className="bg-orange-950/30 border-orange-500/30" data-testid="section-emergency-deliveries">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg text-orange-400 flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Emergency Delivery Requests
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {emergencyDeliveries.map((delivery) => (
                <DeliveryCard 
                  key={delivery.id} 
                  delivery={delivery}
                  onSelect={() => setSelectedDelivery(delivery)}
                />
              ))}
            </CardContent>
          </Card>
        )}

        <Card className="bg-slate-800/50 border-cyan-500/20" data-testid="section-deliveries">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-cyan-400 flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Active Deliveries ({normalDeliveries.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {['Warehouse', 'Kitchen', 'Bar', 'IT', 'Janitorial'].map((dept) => {
                const deptDeliveries = normalDeliveries.filter(d => d.department === dept);
                if (deptDeliveries.length === 0) return null;
                
                return (
                  <AccordionItem key={dept} value={dept} className="border-slate-700/50">
                    <AccordionTrigger className="py-2 hover:no-underline" data-testid={`accordion-${dept}`}>
                      <div className="flex items-center gap-2">
                        <span className={`p-1.5 rounded ${departmentColors[dept]}`}>
                          {departmentIcons[dept]}
                        </span>
                        <span className="text-white">{dept}</span>
                        <Badge variant="secondary" className="ml-1 bg-slate-700">
                          {deptDeliveries.length}
                        </Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-2 pt-2">
                      {deptDeliveries.map((delivery) => (
                        <DeliveryCard 
                          key={delivery.id} 
                          delivery={delivery}
                          onSelect={() => setSelectedDelivery(delivery)}
                        />
                      ))}
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
            
            {normalDeliveries.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Truck className="h-10 w-10 mx-auto mb-2 opacity-50" />
                <p>No active deliveries</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-cyan-500/20" data-testid="section-activity">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-cyan-400 flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[200px]">
              <div className="space-y-2">
                {recentActivity.length > 0 ? (
                  recentActivity.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-center gap-2 p-2 rounded bg-slate-900/50"
                      data-testid={`activity-${log.id}`}
                    >
                      <div className="h-2 w-2 rounded-full bg-cyan-400" />
                      <span className="text-sm text-gray-300 flex-1">{log.action}</span>
                      <span className="text-xs text-gray-500">{formatTimeAgo(log.createdAt)}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Activity className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    <p>No recent activity</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
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

      <nav className="fixed bottom-0 left-0 right-0 bg-slate-900/90 backdrop-blur-md border-t border-cyan-500/20 px-4 py-3">
        <div className="flex justify-around items-center">
          <Button variant="ghost" className="flex-col gap-1 h-auto text-cyan-400">
            <Radio className="h-5 w-5" />
            <span className="text-xs">Command</span>
          </Button>
          <Button variant="ghost" className="flex-col gap-1 h-auto text-gray-400">
            <Truck className="h-5 w-5" />
            <span className="text-xs">Deliveries</span>
          </Button>
          <Button variant="ghost" className="flex-col gap-1 h-auto text-gray-400">
            <Bell className="h-5 w-5" />
            <span className="text-xs">Alerts</span>
          </Button>
          <Button variant="ghost" className="flex-col gap-1 h-auto text-gray-400">
            <Users className="h-5 w-5" />
            <span className="text-xs">Staff</span>
          </Button>
        </div>
      </nav>
    </div>
  );
}

function DeliveryCard({ delivery, onSelect }: { delivery: DeliveryRequest; onSelect: () => void }) {
  const statusCfg = statusConfig[delivery.status] || statusConfig.Requested;
  
  return (
    <button
      onClick={onSelect}
      className="w-full text-left p-3 rounded-lg bg-slate-900/50 border border-slate-700/50 hover:border-cyan-500/30 transition-colors"
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
