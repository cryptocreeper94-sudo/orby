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
import { LayoutShell, BentoCard, CarouselRail, AccordionStack } from '@/components/ui/bento';
import type { AccordionStackItem } from '@/components/ui/bento';
import {
  LogOut, Menu, Bell, MessageSquare, Package, Utensils, Beer, Monitor, Activity,
  AlertTriangle, CheckCircle2, Clock, MapPin, Users, Radio, TrendingUp, 
  ChevronRight, Truck, Zap, Crown, Calendar, Store, FileStack, ClipboardList, Siren,
  Shield, FileText, Settings
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

  const metricCards = [
    <StatCard
      key="stands"
      icon={<MapPin className="h-5 w-5" />}
      label="Stands Open"
      value={`${openStands.length}/${standStatuses.length}`}
      color="green"
    />,
    <StatCard
      key="deliveries"
      icon={<Truck className="h-5 w-5" />}
      label="Active Deliveries"
      value={activeDeliveries.length}
      subValue={emergencyDeliveries.length > 0 ? `${emergencyDeliveries.length} urgent` : undefined}
      color="blue"
    />,
    <StatCard
      key="it"
      icon={<Zap className="h-5 w-5" />}
      label="IT Alerts"
      value={activeITAlerts.length}
      subValue={emergencyITAlerts.length > 0 ? `${emergencyITAlerts.length} urgent` : undefined}
      color="cyan"
    />,
    <StatCard
      key="issues"
      icon={<AlertTriangle className="h-5 w-5" />}
      label="Issues"
      value={standsWithIssues.length}
      color={standsWithIssues.length > 0 ? "amber" : "green"}
    />,
    <div key="weather" className="w-[200px] h-[100px]">
      <WeatherWidget compact className="h-full" />
    </div>,
    <div key="sales" className="w-[200px] h-[100px]">
      <LiveSalesWidget compact className="h-full" />
    </div>,
  ];

  const quickActions = [
    { icon: Radio, label: 'Broadcast', color: 'cyan', testId: 'action-broadcast' },
    { icon: MessageSquare, label: 'Messages', color: 'blue', href: '/messages', testId: 'action-messages' },
    { icon: Package, label: 'Warehouse', color: 'orange', href: '/warehouse', testId: 'action-warehouse' },
    { icon: Store, label: 'Stand Setup', color: 'purple', href: '/stand-setup', testId: 'action-stand-setup' },
    ...(currentUser && ['Developer', 'Management'].includes(currentUser.role) 
      ? [{ icon: FileStack, label: 'Doc Hub', color: 'green', href: '/document-hub', testId: 'action-document-hub' }] 
      : []),
    { icon: Crown, label: 'Team Leads', color: 'amber', href: '/team-management', testId: 'action-team-leads' },
    { icon: Beer, label: 'Bar Schedule', color: 'amber', href: '/bar-scheduler', testId: 'action-bar-schedule' },
    { icon: ClipboardList, label: 'Items', color: 'emerald', href: '/item-management', testId: 'action-items' },
  ];

  const quickActionItems = quickActions.map((action) => {
    const content = (
      <motion.div 
        whileHover={{ scale: 1.02 }} 
        whileTap={{ scale: 0.98 }}
        className="w-[80px] h-[72px]"
      >
        <Button 
          variant="outline" 
          className="h-auto py-2 px-3 flex flex-col items-center gap-1 bg-slate-800/60 border-white/10 hover:bg-white/10 hover:border-cyan-400/50"
          data-testid={action.testId}
        >
          <action.icon className={`h-5 w-5 text-${action.color}-400`} />
          <span className="text-xs text-slate-300 whitespace-nowrap">{action.label}</span>
        </Button>
      </motion.div>
    );
    return action.href ? (
      <Link key={action.label} href={action.href}>{content}</Link>
    ) : (
      <div key={action.label}>{content}</div>
    );
  });

  const staffRosterItems = standStatuses.slice(0, 8).map((stand) => (
    <Link 
      key={stand.id} 
      href={`/count-session/${stand.id}/${encodeURIComponent(new Date().toLocaleDateString())}`}
    >
      <motion.div 
        whileHover={{ scale: 1.02 }}
        className="w-[140px] h-[88px] p-2 rounded-lg bg-slate-800/60 border border-white/10 hover:border-cyan-400/50 cursor-pointer"
        data-testid={`staff-stand-${stand.id}`}
      >
        <div className="flex items-center gap-2 mb-1">
          <div className={`w-2 h-2 rounded-full ${standStatusColors[stand.status]}`} />
          <span className="text-sm font-medium text-slate-200 truncate">{stand.name}</span>
        </div>
        <div className="text-xs text-slate-500">{stand.section}</div>
        <Badge variant="outline" className="text-xs border-white/20 text-slate-400 mt-1">
          {stand.status}
        </Badge>
      </motion.div>
    </Link>
  ));

  const inventoryItems = activeDeliveries.map((req) => (
    <motion.div 
      key={req.id}
      whileHover={{ scale: 1.02 }}
      className="w-[200px] h-[100px] p-2 rounded-lg bg-slate-800/60 border border-white/10 hover:border-cyan-400/50"
      data-testid={`inventory-delivery-${req.id}`}
    >
      <div className="flex items-center gap-2 mb-1">
        <div className={`p-1.5 rounded border ${departmentColors[req.department]}`}>
          {departmentIcons[req.department]}
        </div>
        <span className="text-sm font-medium text-slate-200">{req.standName}</span>
        {req.priority === 'Emergency' && (
          <Badge className="text-xs bg-red-500/20 text-red-400 border border-red-500/30">!</Badge>
        )}
      </div>
      <div className="text-xs text-slate-400 truncate">{req.description}</div>
      <div className="flex items-center justify-between mt-1">
        <Badge className={`text-xs border ${statusColors[req.status]}`}>
          {req.status === 'OnTheWay' ? 'On Way' : req.status}
        </Badge>
        {req.eta && req.status === 'OnTheWay' && (
          <span className="text-xs text-emerald-400 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {req.eta}m
          </span>
        )}
      </div>
    </motion.div>
  ));

  const supportSections: AccordionStackItem[] = [
    {
      title: 'Compliance & Safety',
      content: (
        <div className="space-y-2" data-testid="accordion-compliance-content">
          <ComplianceAlertPanel 
            userId={currentUser?.id} 
            userName={currentUser?.name} 
            isManager={true}
          />
          <div className="flex items-center gap-2 p-2 rounded bg-slate-800/40">
            <Shield className="h-4 w-4 text-emerald-400" />
            <span className="text-sm text-slate-300">All safety protocols active</span>
          </div>
        </div>
      ),
    },
    {
      title: 'Standard Operating Procedures',
      content: (
        <div className="space-y-2" data-testid="accordion-sop-content">
          <Link href="/document-hub">
            <div className="flex items-center gap-2 p-2 rounded bg-slate-800/40 hover:bg-slate-700/40 cursor-pointer">
              <FileText className="h-4 w-4 text-cyan-400" />
              <span className="text-sm text-slate-300">View Document Hub</span>
              <ChevronRight className="h-4 w-4 text-slate-500 ml-auto" />
            </div>
          </Link>
          <div className="text-xs text-slate-500 pl-6">
            Opening procedures, closing checklists, emergency protocols
          </div>
        </div>
      ),
    },
    {
      title: 'Settings & Configuration',
      content: (
        <div className="space-y-2" data-testid="accordion-settings-content">
          <div className="flex items-center gap-2 p-2 rounded bg-slate-800/40">
            <Settings className="h-4 w-4 text-slate-400" />
            <span className="text-sm text-slate-300">Dashboard Preferences</span>
          </div>
          <div className="text-xs text-slate-500 pl-6">
            Notification settings, display options, role permissions
          </div>
        </div>
      ),
    },
  ];

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
                  <Button size="icon" variant="ghost" className="md:hidden text-slate-300 hover:bg-white/10" data-testid="button-mobile-menu">
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

        <main className="p-2 md:p-3 max-w-7xl mx-auto">
          <WeatherAlertBanner />
          
          <LayoutShell className="mt-2">
            {/* Hero Row: Event Overview with Metrics Carousel */}
            <BentoCard span={12} className="col-span-4 md:col-span-6 lg:col-span-12" data-testid="hero-metrics">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-lg bg-cyan-500/20">
                  <TrendingUp className="h-4 w-4 text-cyan-400" />
                </div>
                <span className="font-medium text-slate-200">Event Overview</span>
                <SectionHelp
                  title="Event Metrics"
                  description="Live dashboard metrics showing current event status at a glance."
                  tips={["Scroll horizontally to see all metrics", "Click any card for details"]}
                  keywords={['metrics', 'overview', 'stats']}
                />
              </div>
              <CarouselRail items={metricCards} showDots data-testid="metrics-carousel" />
            </BentoCard>

            {/* Operations Row: Quick Actions (span-6), Staff Status (span-6) */}
            <BentoCard span={6} className="col-span-4 md:col-span-3 lg:col-span-6" data-testid="quick-actions-card">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-medium text-slate-200">Quick Actions</span>
                <SectionHelp
                  title="Quick Actions"
                  description="One-tap access to common operations tasks."
                  tips={["Use Broadcast for venue-wide announcements"]}
                  keywords={['broadcast', 'routing']}
                />
              </div>
              <CarouselRail items={quickActionItems} data-testid="actions-carousel" />
            </BentoCard>

            <BentoCard span={6} className="col-span-4 md:col-span-3 lg:col-span-6" data-testid="staff-status-card">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-lg bg-emerald-500/20">
                  <Users className="h-4 w-4 text-emerald-400" />
                </div>
                <span className="font-medium text-slate-200">Staff Roster</span>
                <SectionHelp
                  title="Staff Status"
                  description="Live view of stand assignments and staff positions."
                  tips={["Click a stand to view details"]}
                  keywords={['staff', 'roster', 'stands']}
                />
              </div>
              <CarouselRail items={staffRosterItems} data-testid="staff-carousel" />
            </BentoCard>

            {/* Inventory Row: Deliveries Carousel (span-8), Alerts (span-4) */}
            <BentoCard span={8} className="col-span-4 md:col-span-4 lg:col-span-8" data-testid="inventory-card">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-blue-500/20">
                    <Truck className="h-4 w-4 text-blue-400" />
                  </div>
                  <span className="font-medium text-slate-200">Active Deliveries</span>
                  <SectionHelp
                    title="Active Deliveries"
                    description="Track supply requests from stands to departments."
                    tips={["Emergency requests appear with red badges", "ETA updates automatically"]}
                    keywords={['delivery', 'eta', 'priority']}
                  />
                </div>
                <Button variant="ghost" size="sm" className="text-cyan-400 hover:bg-cyan-500/10 text-xs" data-testid="button-view-all-deliveries">
                  View All <ChevronRight className="h-3 w-3 ml-1" />
                </Button>
              </div>
              {inventoryItems.length > 0 ? (
                <CarouselRail items={inventoryItems} data-testid="inventory-carousel" />
              ) : (
                <div className="text-center py-4 text-slate-500">
                  <CheckCircle2 className="h-6 w-6 mx-auto mb-1" />
                  <p className="text-sm">No active deliveries</p>
                </div>
              )}
            </BentoCard>

            <BentoCard span={4} className="col-span-4 md:col-span-2 lg:col-span-4" data-testid="alerts-card">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-lg bg-red-500/20">
                  <AlertTriangle className="h-4 w-4 text-red-400" />
                </div>
                <span className="font-medium text-slate-200">Alerts</span>
              </div>
              <ScrollArea className="h-[140px]">
                <div className="space-y-2">
                  <AnimatePresence>
                    {emergencyDeliveries.map((req) => (
                      <motion.div 
                        key={req.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0 }}
                        className="p-2 bg-red-500/10 rounded-lg border border-red-500/20"
                        data-testid={`alert-emergency-${req.id}`}
                      >
                        <div className="flex items-center gap-2">
                          <div className={`p-1 rounded border ${departmentColors[req.department]}`}>
                            {departmentIcons[req.department]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-slate-200 truncate">{req.standName}</div>
                            <div className="text-xs text-slate-400 truncate">{req.description}</div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  {activeITAlerts.map((alert) => (
                    <motion.div 
                      key={alert.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className={`p-2 rounded-lg border ${alert.priority === 'Emergency' ? 'bg-red-500/10 border-red-500/20' : 'bg-cyan-500/10 border-cyan-500/20'}`}
                      data-testid={`alert-it-${alert.id}`}
                    >
                      <div className="flex items-center gap-2">
                        <Monitor className="h-4 w-4 text-cyan-400" />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-slate-200 truncate">{alert.standName}</div>
                          <div className="text-xs text-slate-400 truncate">{alert.description}</div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  {emergencyDeliveries.length === 0 && activeITAlerts.length === 0 && (
                    <div className="text-center py-4 text-slate-500">
                      <CheckCircle2 className="h-6 w-6 mx-auto mb-1" />
                      <p className="text-sm">No alerts</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </BentoCard>

            {/* Supervisor Live Wall */}
            <BentoCard span={12} className="col-span-4 md:col-span-6 lg:col-span-12" data-testid="supervisor-wall-card">
              <SupervisorLiveWall />
            </BentoCard>

            {/* Active Deliveries Detail (with Tabs) */}
            <BentoCard span={8} className="col-span-4 md:col-span-4 lg:col-span-8" data-testid="deliveries-detail-card">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-blue-500/20">
                    <Truck className="h-4 w-4 text-blue-400" />
                  </div>
                  <span className="font-medium text-slate-200">Delivery Details</span>
                </div>
              </div>
              <Tabs defaultValue="all" className="w-full" data-testid="delivery-tabs">
                <TabsList className="grid grid-cols-5 bg-white/5 mb-2 h-8">
                  <TabsTrigger value="all" className="text-xs data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400" data-testid="tab-all">All</TabsTrigger>
                  <TabsTrigger value="Warehouse" className="text-xs data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400" data-testid="tab-warehouse">Warehouse</TabsTrigger>
                  <TabsTrigger value="Kitchen" className="text-xs data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400" data-testid="tab-kitchen">Kitchen</TabsTrigger>
                  <TabsTrigger value="Bar" className="text-xs data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400" data-testid="tab-bar">Bar</TabsTrigger>
                  <TabsTrigger value="IT" className="text-xs data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400" data-testid="tab-it">IT</TabsTrigger>
                </TabsList>
                
                {['all', 'Warehouse', 'Kitchen', 'Bar', 'IT'].map(tab => (
                  <TabsContent key={tab} value={tab}>
                    <ScrollArea className="h-[180px]">
                      <div className="space-y-1">
                        {activeDeliveries
                          .filter(d => tab === 'all' || d.department === tab)
                          .map((req) => (
                            <motion.div 
                              key={req.id} 
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="flex items-center justify-between p-2 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors cursor-pointer"
                              data-testid={`delivery-detail-${req.id}`}
                            >
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                <div className={`p-1.5 rounded border ${departmentColors[req.department]}`}>
                                  {departmentIcons[req.department]}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-slate-200">{req.standName}</span>
                                    {req.priority === 'Emergency' && (
                                      <Badge className="text-xs bg-red-500/20 text-red-400 border border-red-500/30">Urgent</Badge>
                                    )}
                                  </div>
                                  <div className="text-xs text-slate-400 truncate">{req.description}</div>
                                </div>
                              </div>
                              <div className="text-right shrink-0 ml-2">
                                <Badge className={`text-xs border ${statusColors[req.status]}`}>
                                  {req.status === 'OnTheWay' ? 'On Way' : req.status}
                                </Badge>
                                {req.eta && req.status === 'OnTheWay' && (
                                  <div className="text-xs text-emerald-400 mt-0.5 flex items-center gap-1 justify-end">
                                    <Clock className="h-3 w-3" />
                                    {req.eta}m
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          ))}
                        {activeDeliveries.filter(d => tab === 'all' || d.department === tab).length === 0 && (
                          <div className="text-center py-6 text-slate-500">
                            <CheckCircle2 className="h-6 w-6 mx-auto mb-1" />
                            <p className="text-sm">No {tab === 'all' ? 'active' : tab} deliveries</p>
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </TabsContent>
                ))}
              </Tabs>
            </BentoCard>

            {/* Stand Overview */}
            <BentoCard span={4} className="col-span-4 md:col-span-2 lg:col-span-4" data-testid="stand-overview-card">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-lg bg-emerald-500/20">
                  <MapPin className="h-4 w-4 text-emerald-400" />
                </div>
                <span className="font-medium text-slate-200">Stand Overview</span>
                <SectionHelp
                  title="Stand Overview"
                  description="Real-time status of all concession stands."
                  tips={["Green = open", "Orange = hot spot", "Red = needs help"]}
                  keywords={['stand', 'section', 'status']}
                />
              </div>
              <ScrollArea className="h-[180px]">
                <div className="space-y-1">
                  {standStatuses.map((stand) => (
                    <Link 
                      key={stand.id} 
                      href={`/count-session/${stand.id}/${encodeURIComponent(new Date().toLocaleDateString())}`}
                    >
                      <motion.div 
                        whileHover={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
                        className="flex items-center justify-between p-1.5 rounded cursor-pointer"
                        data-testid={`stand-overview-${stand.id}`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className={`w-2 h-2 rounded-full shrink-0 ${standStatusColors[stand.status]}`} />
                          <div className="min-w-0">
                            <div className="text-sm text-slate-200 truncate">{stand.name}</div>
                            <div className="text-xs text-slate-500">{stand.section}</div>
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-slate-500 shrink-0" />
                      </motion.div>
                    </Link>
                  ))}
                </div>
              </ScrollArea>
            </BentoCard>

            {/* Support Row: AccordionStack for compliance, SOPs, documentation */}
            <BentoCard span={12} className="col-span-4 md:col-span-6 lg:col-span-12" data-testid="support-section-card">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-lg bg-purple-500/20">
                  <FileStack className="h-4 w-4 text-purple-400" />
                </div>
                <span className="font-medium text-slate-200">Support & Documentation</span>
              </div>
              <AccordionStack 
                items={supportSections} 
                defaultOpen={[0]}
                data-testid="support-accordion"
              />
            </BentoCard>
          </LayoutShell>
        </main>
      </div>
    </AnimatedBackground>
  );
}
