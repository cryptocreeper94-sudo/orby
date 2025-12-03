import { useState, useEffect } from 'react';
import { useLocation, Link } from 'wouter';
import { useStore } from '@/lib/mockData';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { WeatherWidget, WeatherAlertBanner } from '@/components/WeatherWidget';
import { LiveSalesWidget } from '@/components/LiveSalesWidget';
import ComplianceAlertPanel from '@/components/ComplianceAlertPanel';
import { GlobalModeBar } from '@/components/GlobalModeBar';
import { SupervisorLiveWall } from '@/components/SupervisorLiveWall';
import {
  LogOut, Menu, Bell, MessageSquare, Package, Utensils, Beer, Monitor, Activity,
  AlertTriangle, CheckCircle2, Clock, MapPin, Users, Radio, TrendingUp, 
  ChevronRight, Truck, Zap, Crown, Calendar, Store, FileStack, ClipboardList, Siren
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';
import { motion, AnimatePresence } from 'framer-motion';
import { AnimatedBackground, GlassCard, GlassCardContent, GlassCardHeader, StatCard, PageHeader } from '@/components/ui/premium';
import { SectionHelp } from '@/components/OrbyHelp';
import { HeaderTutorialButton } from '@/components/HeaderTutorialButton';

interface DeliveryRequest {
  id: string;
  standId: string;
  standName: string;
  department: 'Warehouse' | 'Kitchen' | 'Bar' | 'IT' | 'Operations' | 'HR';
  priority: 'Normal' | 'Emergency';
  status: 'Requested' | 'Acknowledged' | 'InProgress' | 'OnTheWay' | 'Delivered';
  description: string;
  requesterName: string;
  eta?: number;
  createdAt: string;
}

interface ITAlert {
  id: string;
  standId: string;
  standName: string;
  issueType: string;
  priority: 'Normal' | 'Emergency';
  status: 'Requested' | 'Acknowledged' | 'InProgress' | 'Resolved';
  description: string;
  reporterName: string;
  createdAt: string;
}

interface StandStatus {
  id: string;
  name: string;
  section: string;
  status: 'Open' | 'Closed' | 'Needs Power' | 'Spare' | 'Hot Spot';
  supervisorName?: string;
  activeIssues: number;
  pendingDeliveries: number;
}

const MOCK_DELIVERY_REQUESTS: DeliveryRequest[] = [
  { id: '1', standId: '105', standName: 'Stand 105', department: 'Warehouse', priority: 'Normal', status: 'OnTheWay', description: 'Need 2 cases Bud Light, 1 case Michelob Ultra', requesterName: 'Sarah Johnson', eta: 8, createdAt: new Date(Date.now() - 15 * 60000).toISOString() },
  { id: '2', standId: '212', standName: 'Stand 212', department: 'Kitchen', priority: 'Emergency', status: 'InProgress', description: 'Out of hot dog buns - urgent', requesterName: 'Mike Smith', createdAt: new Date(Date.now() - 5 * 60000).toISOString() },
  { id: '3', standId: '118', standName: 'Stand 118', department: 'Warehouse', priority: 'Normal', status: 'Acknowledged', description: 'Low on ice - need 3 bags', requesterName: 'Chris Williams', createdAt: new Date(Date.now() - 25 * 60000).toISOString() },
  { id: '4', standId: '301', standName: 'Stand 301', department: 'Bar', priority: 'Normal', status: 'Requested', description: 'Need more cocktail mixers', requesterName: 'Amy Brown', createdAt: new Date(Date.now() - 2 * 60000).toISOString() },
];

const MOCK_IT_ALERTS: ITAlert[] = [
  { id: '1', standId: '212', standName: 'Stand 212', issueType: 'POS', priority: 'Emergency', status: 'InProgress', description: 'Register 2 frozen - cannot process transactions', reporterName: 'Mike Smith', createdAt: new Date(Date.now() - 10 * 60000).toISOString() },
  { id: '2', standId: '105', standName: 'Stand 105', issueType: 'Network', priority: 'Normal', status: 'Acknowledged', description: 'Slow credit card processing', reporterName: 'Sarah Johnson', createdAt: new Date(Date.now() - 30 * 60000).toISOString() },
];

const departmentIcons: Record<string, React.ReactNode> = {
  Warehouse: <Package className="h-4 w-4" />,
  Kitchen: <Utensils className="h-4 w-4" />,
  Bar: <Beer className="h-4 w-4" />,
  IT: <Monitor className="h-4 w-4" />,
  Operations: <Activity className="h-4 w-4" />,
  HR: <Users className="h-4 w-4" />,
};

const departmentColors: Record<string, string> = {
  Warehouse: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  Kitchen: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  Bar: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  IT: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  Operations: 'bg-green-500/20 text-green-400 border-green-500/30',
  HR: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
};

const statusColors: Record<string, string> = {
  Requested: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  Acknowledged: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  InProgress: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  OnTheWay: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  Delivered: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  Resolved: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
};

const standStatusColors: Record<string, string> = {
  Open: 'bg-emerald-500',
  Closed: 'bg-slate-500',
  'Needs Power': 'bg-red-500',
  Spare: 'bg-amber-500',
  'Hot Spot': 'bg-orange-500',
};

function formatTimeAgo(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

export default function ManagerDashboard() {
  const logout = useStore((state) => state.logout);
  const currentUser = useStore((state) => state.currentUser);
  const stands = useStore((state) => state.stands);
  const fetchAll = useStore((state) => state.fetchAll);
  const [, setLocation] = useLocation();

  const [deliveryRequests] = useState<DeliveryRequest[]>(MOCK_DELIVERY_REQUESTS);
  const [itAlerts] = useState<ITAlert[]>(MOCK_IT_ALERTS);

  useEffect(() => {
    if (stands.length === 0) {
      fetchAll();
    }
  }, [stands.length, fetchAll]);

  const handleLogout = () => {
    logout();
    setLocation('/');
  };

  const standStatuses: StandStatus[] = stands.map(s => ({
    id: s.id,
    name: s.name,
    section: s.section,
    status: s.status as 'Open' | 'Closed' | 'Needs Power' | 'Spare' | 'Hot Spot',
    supervisorName: undefined,
    activeIssues: 0,
    pendingDeliveries: 0,
  }));

  const activeDeliveries = deliveryRequests.filter(d => d.status !== 'Delivered');
  const emergencyDeliveries = deliveryRequests.filter(d => d.priority === 'Emergency' && d.status !== 'Delivered');
  const activeITAlerts = itAlerts.filter(a => a.status !== 'Resolved');
  const emergencyITAlerts = itAlerts.filter(a => a.priority === 'Emergency' && a.status !== 'Resolved');
  const openStands = standStatuses.filter(s => s.status === 'Open' || s.status === 'Hot Spot');
  const standsWithIssues = standStatuses.filter(s => s.activeIssues > 0);

  return (
    <AnimatedBackground>
      <GlobalModeBar />
      <div className="min-h-screen" data-testid="manager-dashboard">
        <PageHeader
          title="Orby Command"
          subtitle="Operations Dashboard"
          icon={
            <div className="relative w-8 h-8">
              <div className="absolute inset-0 bg-cyan-400/30 rounded-full blur-md animate-pulse" />
              <img 
                src="/orby-mascot.png" 
                alt="Orby"
                className="relative w-8 h-8 object-contain"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
            </div>
          }
          iconColor="cyan"
          actions={
            <div className="flex items-center gap-2">
              <Sheet>
                <SheetTrigger asChild>
                  <Button size="icon" variant="ghost" className="md:hidden text-slate-300 hover:bg-white/10">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="bg-slate-900 border-slate-700">
                  <nav className="grid gap-4 text-lg font-medium pt-8">
                    <Link href="/command-center" className="flex items-center gap-4 px-2.5 text-red-400 hover:text-red-300" data-testid="nav-command-center">
                      <Siren className="h-5 w-5" />
                      Emergency Command
                    </Link>
                    <Link href="/messages" className="flex items-center gap-4 px-2.5 text-white hover:text-cyan-400" data-testid="nav-messages">
                      <MessageSquare className="h-5 w-5" />
                      Messages
                    </Link>
                    <Link href="/supervisor" className="flex items-center gap-4 px-2.5 text-white hover:text-cyan-400" data-testid="nav-supervisor">
                      <Users className="h-5 w-5" />
                      Supervisor View
                    </Link>
                    <Link href="/warehouse" className="flex items-center gap-4 px-2.5 text-white hover:text-cyan-400" data-testid="nav-warehouse">
                      <Package className="h-5 w-5" />
                      Warehouse
                    </Link>
                  </nav>
                </SheetContent>
              </Sheet>

              <HeaderTutorialButton variant="icon" />
              <Button variant="ghost" size="icon" className="relative text-slate-300 hover:bg-white/10" data-testid="button-notifications">
                <Bell className="h-5 w-5" />
                {(emergencyDeliveries.length + emergencyITAlerts.length) > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-xs flex items-center justify-center animate-pulse">
                    {emergencyDeliveries.length + emergencyITAlerts.length}
                  </span>
                )}
              </Button>
              <Button variant="ghost" size="sm" onClick={handleLogout} className="text-slate-300 hover:bg-white/10" data-testid="button-logout">
                <LogOut className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          }
        />

        <main className="p-4 space-y-4 max-w-7xl mx-auto">
          <WeatherAlertBanner />
          
          <ComplianceAlertPanel 
            userId={currentUser?.id} 
            userName={currentUser?.name} 
            isManager={true}
          />

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard
              icon={<MapPin className="h-5 w-5" />}
              label="Stands Open"
              value={`${openStands.length}/${standStatuses.length}`}
              color="green"
            />
            <StatCard
              icon={<Truck className="h-5 w-5" />}
              label="Active Deliveries"
              value={activeDeliveries.length}
              subValue={emergencyDeliveries.length > 0 ? `${emergencyDeliveries.length} urgent` : undefined}
              color="blue"
            />
            <StatCard
              icon={<Zap className="h-5 w-5" />}
              label="IT Alerts"
              value={activeITAlerts.length}
              subValue={emergencyITAlerts.length > 0 ? `${emergencyITAlerts.length} urgent` : undefined}
              color="cyan"
            />
            <StatCard
              icon={<AlertTriangle className="h-5 w-5" />}
              label="Issues"
              value={standsWithIssues.length}
              color={standsWithIssues.length > 0 ? "amber" : "green"}
            />
          </div>

          <SupervisorLiveWall />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 space-y-4">
              <AnimatePresence>
                {emergencyDeliveries.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <GlassCard className="border-red-500/30" glow data-testid="emergency-deliveries">
                      <GlassCardHeader>
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-lg bg-red-500/20">
                            <AlertTriangle className="h-4 w-4 text-red-400" />
                          </div>
                          <span className="font-bold text-red-400">Emergency Requests</span>
                        </div>
                      </GlassCardHeader>
                      <GlassCardContent className="space-y-2 pt-0">
                        {emergencyDeliveries.map((req, idx) => (
                          <motion.div 
                            key={req.id} 
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className="flex items-center justify-between p-3 bg-red-500/10 rounded-xl border border-red-500/20"
                            data-testid={`emergency-delivery-${req.id}`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-lg border ${departmentColors[req.department]}`}>
                                {departmentIcons[req.department]}
                              </div>
                              <div>
                                <div className="font-medium text-slate-200">{req.standName}</div>
                                <div className="text-sm text-slate-400">{req.description}</div>
                              </div>
                            </div>
                            <div className="text-right">
                              <Badge className={`border ${statusColors[req.status]}`}>{req.status}</Badge>
                              <div className="text-xs text-slate-500 mt-1">{formatTimeAgo(req.createdAt)}</div>
                            </div>
                          </motion.div>
                        ))}
                      </GlassCardContent>
                    </GlassCard>
                  </motion.div>
                )}
              </AnimatePresence>

              <GlassCard data-testid="active-deliveries">
                <GlassCardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-blue-500/20">
                        <Truck className="h-4 w-4 text-blue-400" />
                      </div>
                      <span className="font-bold text-slate-200">Active Deliveries</span>
                      <SectionHelp
                        title="Active Deliveries"
                        description="Track all supply requests from stands to departments (Warehouse, Kitchen, Bar). Each delivery shows its current status and estimated arrival time."
                        tips={[
                          "Emergency requests appear at the top with red highlights",
                          "Click any delivery to see full details and history",
                          "ETA updates automatically as runners move"
                        ]}
                        keywords={['delivery', 'eta', 'priority', 'acknowledged', 'picking', 'on-the-way']}
                      />
                    </div>
                    <Button variant="ghost" size="sm" className="text-cyan-400 hover:bg-cyan-500/10" data-testid="button-view-all-deliveries">
                      View All <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </GlassCardHeader>
                <GlassCardContent className="pt-0">
                  <Tabs defaultValue="all" className="w-full" data-testid="delivery-tabs">
                    <TabsList className="grid grid-cols-5 bg-white/5 mb-4">
                      <TabsTrigger value="all" className="text-xs data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400" data-testid="tab-all">All</TabsTrigger>
                      <TabsTrigger value="Warehouse" className="text-xs data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400" data-testid="tab-warehouse">Warehouse</TabsTrigger>
                      <TabsTrigger value="Kitchen" className="text-xs data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400" data-testid="tab-kitchen">Kitchen</TabsTrigger>
                      <TabsTrigger value="Bar" className="text-xs data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400" data-testid="tab-bar">Bar</TabsTrigger>
                      <TabsTrigger value="IT" className="text-xs data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400" data-testid="tab-it">IT</TabsTrigger>
                    </TabsList>
                    
                    {['all', 'Warehouse', 'Kitchen', 'Bar', 'IT'].map(tab => (
                      <TabsContent key={tab} value={tab} className="space-y-2">
                        {activeDeliveries
                          .filter(d => tab === 'all' || d.department === tab)
                          .map((req, idx) => (
                            <motion.div 
                              key={req.id} 
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: idx * 0.05 }}
                              className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-colors cursor-pointer"
                              data-testid={`delivery-${req.id}`}
                            >
                              <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg border ${departmentColors[req.department]}`}>
                                  {departmentIcons[req.department]}
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-slate-200">{req.standName}</span>
                                    <Badge variant="outline" className="text-xs border-white/20 text-slate-400">
                                      {req.department}
                                    </Badge>
                                    {req.priority === 'Emergency' && (
                                      <Badge className="text-xs bg-red-500/20 text-red-400 border border-red-500/30">Urgent</Badge>
                                    )}
                                  </div>
                                  <div className="text-sm text-slate-400">{req.description}</div>
                                  <div className="text-xs text-slate-500 mt-1">
                                    Requested by {req.requesterName} • {formatTimeAgo(req.createdAt)}
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <Badge className={`border ${statusColors[req.status]}`}>
                                  {req.status === 'OnTheWay' ? 'On the Way' : req.status}
                                </Badge>
                                {req.eta && req.status === 'OnTheWay' && (
                                  <div className="text-sm text-emerald-400 mt-1 flex items-center gap-1 justify-end">
                                    <Clock className="h-3 w-3" />
                                    {req.eta} min
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          ))}
                        {activeDeliveries.filter(d => tab === 'all' || d.department === tab).length === 0 && (
                          <div className="text-center py-8 text-slate-500">
                            <CheckCircle2 className="h-8 w-8 mx-auto mb-2" />
                            <p>No active {tab === 'all' ? 'deliveries' : `${tab} requests`}</p>
                          </div>
                        )}
                      </TabsContent>
                    ))}
                  </Tabs>
                </GlassCardContent>
              </GlassCard>

              {activeITAlerts.length > 0 && (
                <GlassCard className="border-cyan-500/20" data-testid="it-alerts">
                  <GlassCardHeader>
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-cyan-500/20">
                        <Zap className="h-4 w-4 text-cyan-400" />
                      </div>
                      <span className="font-bold text-cyan-400">IT Alerts</span>
                    </div>
                  </GlassCardHeader>
                  <GlassCardContent className="space-y-2 pt-0">
                    {activeITAlerts.map((alert, idx) => (
                      <motion.div 
                        key={alert.id} 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className={`flex items-center justify-between p-3 rounded-xl border ${alert.priority === 'Emergency' ? 'bg-red-500/10 border-red-500/30' : 'bg-cyan-500/10 border-cyan-500/20'}`}
                        data-testid={`it-alert-${alert.id}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-cyan-500/20">
                            <Monitor className="h-4 w-4 text-cyan-400" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-slate-200">{alert.standName}</span>
                              <Badge variant="outline" className="text-xs border-white/20 text-slate-400">{alert.issueType}</Badge>
                              {alert.priority === 'Emergency' && (
                                <Badge className="text-xs bg-red-500/20 text-red-400 border border-red-500/30">Urgent</Badge>
                              )}
                            </div>
                            <div className="text-sm text-slate-400">{alert.description}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge className={`border ${statusColors[alert.status]}`}>{alert.status}</Badge>
                          <div className="text-xs text-slate-500 mt-1">{formatTimeAgo(alert.createdAt)}</div>
                        </div>
                      </motion.div>
                    ))}
                  </GlassCardContent>
                </GlassCard>
              )}
            </div>

            <div className="space-y-4">
              <LiveSalesWidget compact className="w-full" />
              
              <WeatherWidget compact className="w-full" />

              <GlassCard data-testid="stand-overview">
                <GlassCardHeader>
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-emerald-500/20">
                      <MapPin className="h-4 w-4 text-emerald-400" />
                    </div>
                    <span className="font-bold text-slate-200">Stand Overview</span>
                    <SectionHelp
                      title="Stand Overview"
                      description="Real-time status of all concession stands. Green means open and running smoothly. Orange indicates a Hot Spot needing attention. Red means the stand needs immediate help."
                      tips={[
                        "Hot Spots are high-volume or problem stands",
                        "Tap a stand to see active issues and deliveries",
                        "Filter by section to focus on your area"
                      ]}
                      keywords={['stand', 'section', 'hot-spot', 'supervisor']}
                    />
                  </div>
                </GlassCardHeader>
                <GlassCardContent className="pt-0">
                  <ScrollArea className="h-[300px]">
                    <div className="space-y-2">
                      {standStatuses.map((stand, idx) => (
                        <Link 
                          key={stand.id} 
                          href={`/count-session/${stand.id}/${encodeURIComponent(new Date().toLocaleDateString())}`}
                        >
                          <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: idx * 0.03 }}
                            className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                            data-testid={`stand-${stand.id}`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-2 h-2 rounded-full ${standStatusColors[stand.status]}`} />
                              <div>
                                <div className="font-medium text-sm text-slate-200">{stand.name}</div>
                                <div className="text-xs text-slate-500">{stand.section}</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {stand.activeIssues > 0 && (
                                <Badge className="text-xs bg-red-500/20 text-red-400 border border-red-500/30">
                                  {stand.activeIssues} issue{stand.activeIssues > 1 ? 's' : ''}
                                </Badge>
                              )}
                              {stand.pendingDeliveries > 0 && (
                                <Badge variant="outline" className="text-xs border-blue-500/30 text-blue-400">
                                  {stand.pendingDeliveries} pending
                                </Badge>
                              )}
                              <Badge variant="outline" className="text-xs border-white/20 text-slate-400">
                                {stand.status}
                              </Badge>
                              <ChevronRight className="h-4 w-4 text-slate-500" />
                            </div>
                          </motion.div>
                        </Link>
                      ))}
                    </div>
                  </ScrollArea>
                </GlassCardContent>
              </GlassCard>

              <GlassCard data-testid="quick-actions">
                <GlassCardHeader>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-200">Quick Actions</span>
                    <SectionHelp
                      title="Quick Actions"
                      description="One-tap access to common operations tasks. Broadcast messages to all staff, view reports, or manage system settings."
                      tips={[
                        "Use Broadcast for urgent venue-wide announcements",
                        "Reports show trends and help with decision-making"
                      ]}
                      keywords={['broadcast', 'routing', 'audit-trail']}
                    />
                  </div>
                </GlassCardHeader>
                <GlassCardContent className="grid grid-cols-2 gap-2 pt-0">
                  {[
                    { icon: Radio, label: 'Broadcast', color: 'cyan', testId: 'button-broadcast' },
                    { icon: MessageSquare, label: 'Messages', color: 'blue', href: '/messages', testId: 'button-view-messages' },
                    { icon: Package, label: 'Warehouse', color: 'orange', href: '/warehouse', testId: 'button-warehouse' },
                    { icon: Store, label: 'Stand Setup', color: 'purple', href: '/stand-setup', testId: 'button-stand-setup' },
                    ...(currentUser && ['Developer', 'Management'].includes(currentUser.role) 
                      ? [{ icon: FileStack, label: 'Doc Hub', color: 'green', href: '/document-hub', testId: 'button-document-hub' }] 
                      : []),
                    { icon: Crown, label: 'Team Leads', color: 'amber', href: '/team-management', testId: 'button-team-management' },
                    { icon: Beer, label: 'Bar Schedule', color: 'amber', href: '/bar-scheduler', testId: 'button-bar-scheduler' },
                    { icon: ClipboardList, label: 'Items', color: 'emerald', href: '/item-management', testId: 'button-item-management' },
                  ].map((action) => {
                    const content = (
                      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        <Button 
                          variant="outline" 
                          className={`h-auto py-3 flex flex-col items-center gap-1 bg-white/5 border-white/10 hover:bg-white/10 w-full`}
                          data-testid={action.testId}
                        >
                          <action.icon className={`h-5 w-5 text-${action.color}-400`} />
                          <span className="text-xs text-slate-300">{action.label}</span>
                        </Button>
                      </motion.div>
                    );
                    return action.href ? (
                      <Link key={action.label} href={action.href}>{content}</Link>
                    ) : (
                      <div key={action.label}>{content}</div>
                    );
                  })}
                </GlassCardContent>
              </GlassCard>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <LiveSalesWidget className="w-full" />
            <WeatherWidget className="w-full" />
          </div>
        </main>
      </div>
    </AnimatedBackground>
  );
}
