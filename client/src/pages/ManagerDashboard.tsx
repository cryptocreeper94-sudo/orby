import { useState, useEffect } from 'react';
import { useLocation, Link } from 'wouter';
import { useStore } from '@/lib/mockData';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { WeatherWidget, WeatherAlertBanner } from '@/components/WeatherWidget';
import {
  LogOut, Menu, Bell, MessageSquare, Package, Utensils, Beer, Monitor, Trash2,
  AlertTriangle, CheckCircle2, Clock, MapPin, Users, Radio, TrendingUp, 
  ChevronRight, RefreshCw, Eye, Send, ArrowRight, Truck, Zap
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';

interface DeliveryRequest {
  id: string;
  standId: string;
  standName: string;
  department: 'Warehouse' | 'Kitchen' | 'Bar' | 'IT' | 'Janitorial';
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

const MOCK_STAND_STATUSES: StandStatus[] = [
  { id: '101', name: 'Stand 101', section: '2 East', status: 'Open', supervisorName: 'Sarah Johnson', activeIssues: 0, pendingDeliveries: 0 },
  { id: '102', name: 'Stand 102', section: '2 East', status: 'Open', supervisorName: 'Sarah Johnson', activeIssues: 0, pendingDeliveries: 1 },
  { id: '105', name: 'Stand 105', section: '2 East', status: 'Open', supervisorName: 'Sarah Johnson', activeIssues: 1, pendingDeliveries: 1 },
  { id: '110', name: 'Stand 110', section: '2 West', status: 'Open', supervisorName: 'Mike Smith', activeIssues: 0, pendingDeliveries: 0 },
  { id: '118', name: 'Stand 118', section: '2 West', status: 'Open', supervisorName: 'Mike Smith', activeIssues: 0, pendingDeliveries: 1 },
  { id: '201', name: 'Stand 201', section: '7 East', status: 'Hot Spot', supervisorName: 'Chris Williams', activeIssues: 0, pendingDeliveries: 0 },
  { id: '212', name: 'Stand 212', section: '7 East', status: 'Open', supervisorName: 'Chris Williams', activeIssues: 2, pendingDeliveries: 1 },
  { id: '301', name: 'Stand 301', section: '7 West', status: 'Open', supervisorName: 'Amy Brown', activeIssues: 0, pendingDeliveries: 1 },
  { id: '305', name: 'Stand 305', section: '7 West', status: 'Closed', activeIssues: 0, pendingDeliveries: 0 },
  { id: '310', name: 'Stand 310', section: '7 West', status: 'Spare', activeIssues: 0, pendingDeliveries: 0 },
];

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

const statusColors: Record<string, string> = {
  Requested: 'bg-yellow-500/20 text-yellow-300',
  Acknowledged: 'bg-blue-500/20 text-blue-300',
  InProgress: 'bg-purple-500/20 text-purple-300',
  OnTheWay: 'bg-green-500/20 text-green-300',
  Delivered: 'bg-gray-500/20 text-gray-300',
  Resolved: 'bg-gray-500/20 text-gray-300',
};

const standStatusColors: Record<string, string> = {
  Open: 'bg-green-500',
  Closed: 'bg-gray-500',
  'Needs Power': 'bg-red-500',
  Spare: 'bg-yellow-500',
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

  const stats = [
    { label: 'Stands Open', value: openStands.length, total: standStatuses.length, icon: <MapPin className="h-5 w-5" />, color: 'text-green-400' },
    { label: 'Active Deliveries', value: activeDeliveries.length, emergency: emergencyDeliveries.length, icon: <Truck className="h-5 w-5" />, color: 'text-blue-400' },
    { label: 'IT Alerts', value: activeITAlerts.length, emergency: emergencyITAlerts.length, icon: <Zap className="h-5 w-5" />, color: 'text-cyan-400' },
    { label: 'Stands with Issues', value: standsWithIssues.length, icon: <AlertTriangle className="h-5 w-5" />, color: standsWithIssues.length > 0 ? 'text-amber-400' : 'text-green-400' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white" data-testid="manager-dashboard">
      <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b border-white/10 bg-slate-900/80 backdrop-blur-md px-4">
        <Sheet>
          <SheetTrigger asChild>
            <Button size="icon" variant="ghost" className="md:hidden text-white">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="bg-slate-900 border-slate-700">
            <nav className="grid gap-4 text-lg font-medium pt-8">
              <Link href="/messages" className="flex items-center gap-4 px-2.5 text-white hover:text-cyan-400">
                <MessageSquare className="h-5 w-5" />
                Messages
              </Link>
              <Link href="/supervisor" className="flex items-center gap-4 px-2.5 text-white hover:text-cyan-400">
                <Users className="h-5 w-5" />
                Supervisor View
              </Link>
              <Link href="/warehouse" className="flex items-center gap-4 px-2.5 text-white hover:text-cyan-400">
                <Package className="h-5 w-5" />
                Warehouse
              </Link>
            </nav>
          </SheetContent>
        </Sheet>

        <div className="flex-1 flex items-center gap-3">
          <div className="w-8 h-8">
            <img 
              src="/attached_assets/image_1764551627990.png" 
              alt="Orby"
              className="w-full h-full object-contain"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
          <div>
            <h1 className="text-lg font-bold text-cyan-400">Orby Command</h1>
            <p className="text-xs text-cyan-200/60">Operations Dashboard</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="relative text-white" data-testid="button-notifications">
            <Bell className="h-5 w-5" />
            {(emergencyDeliveries.length + emergencyITAlerts.length) > 0 && (
              <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-xs flex items-center justify-center">
                {emergencyDeliveries.length + emergencyITAlerts.length}
              </span>
            )}
          </Button>
          <Button variant="ghost" size="sm" onClick={handleLogout} className="text-white" data-testid="button-logout">
            <LogOut className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Logout</span>
          </Button>
        </div>
      </header>

      <main className="p-4 space-y-4 max-w-7xl mx-auto">
        <WeatherAlertBanner />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {stats.map((stat, i) => (
            <Card key={i} className="bg-white/5 border-white/10" data-testid={`stat-${stat.label.toLowerCase().replace(/\s/g, '-')}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className={stat.color}>{stat.icon}</div>
                  {stat.emergency !== undefined && stat.emergency > 0 && (
                    <Badge variant="destructive" className="text-xs">
                      {stat.emergency} urgent
                    </Badge>
                  )}
                </div>
                <div className="mt-2">
                  <div className="text-2xl font-bold">
                    {stat.value}
                    {stat.total && <span className="text-sm text-white/50">/{stat.total}</span>}
                  </div>
                  <div className="text-xs text-white/60">{stat.label}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-4">
            {emergencyDeliveries.length > 0 && (
              <Card className="bg-red-500/10 border-red-500/30" data-testid="emergency-deliveries">
                <CardHeader className="pb-2">
                  <CardTitle className="text-red-400 flex items-center gap-2 text-lg">
                    <AlertTriangle className="h-5 w-5" />
                    Emergency Requests
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {emergencyDeliveries.map(req => (
                    <div key={req.id} className="flex items-center justify-between p-3 bg-red-500/10 rounded-lg border border-red-500/20">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${departmentColors[req.department]}`}>
                          {departmentIcons[req.department]}
                        </div>
                        <div>
                          <div className="font-medium">{req.standName}</div>
                          <div className="text-sm text-white/70">{req.description}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className={statusColors[req.status]}>{req.status}</Badge>
                        <div className="text-xs text-white/50 mt-1">{formatTimeAgo(req.createdAt)}</div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            <Card className="bg-white/5 border-white/10" data-testid="active-deliveries">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white flex items-center gap-2 text-lg">
                    <Truck className="h-5 w-5 text-blue-400" />
                    Active Deliveries
                  </CardTitle>
                  <Button variant="ghost" size="sm" className="text-cyan-400">
                    View All <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="all" className="w-full">
                  <TabsList className="grid grid-cols-5 bg-white/5 mb-4">
                    <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
                    <TabsTrigger value="Warehouse" className="text-xs">Warehouse</TabsTrigger>
                    <TabsTrigger value="Kitchen" className="text-xs">Kitchen</TabsTrigger>
                    <TabsTrigger value="Bar" className="text-xs">Bar</TabsTrigger>
                    <TabsTrigger value="IT" className="text-xs">IT</TabsTrigger>
                  </TabsList>
                  
                  {['all', 'Warehouse', 'Kitchen', 'Bar', 'IT'].map(tab => (
                    <TabsContent key={tab} value={tab} className="space-y-2">
                      {activeDeliveries
                        .filter(d => tab === 'all' || d.department === tab)
                        .map(req => (
                          <div key={req.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer">
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-lg border ${departmentColors[req.department]}`}>
                                {departmentIcons[req.department]}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{req.standName}</span>
                                  <Badge variant="outline" className="text-xs border-white/20">
                                    {req.department}
                                  </Badge>
                                  {req.priority === 'Emergency' && (
                                    <Badge variant="destructive" className="text-xs">Urgent</Badge>
                                  )}
                                </div>
                                <div className="text-sm text-white/60">{req.description}</div>
                                <div className="text-xs text-white/40 mt-1">
                                  Requested by {req.requesterName} • {formatTimeAgo(req.createdAt)}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <Badge className={statusColors[req.status]}>
                                {req.status === 'OnTheWay' ? 'On the Way' : req.status}
                              </Badge>
                              {req.eta && req.status === 'OnTheWay' && (
                                <div className="text-sm text-green-400 mt-1 flex items-center gap-1 justify-end">
                                  <Clock className="h-3 w-3" />
                                  {req.eta} min
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      {activeDeliveries.filter(d => tab === 'all' || d.department === tab).length === 0 && (
                        <div className="text-center py-8 text-white/40">
                          <CheckCircle2 className="h-8 w-8 mx-auto mb-2" />
                          <p>No active {tab === 'all' ? 'deliveries' : `${tab} requests`}</p>
                        </div>
                      )}
                    </TabsContent>
                  ))}
                </Tabs>
              </CardContent>
            </Card>

            {activeITAlerts.length > 0 && (
              <Card className="bg-white/5 border-cyan-500/20" data-testid="it-alerts">
                <CardHeader className="pb-2">
                  <CardTitle className="text-cyan-400 flex items-center gap-2 text-lg">
                    <Zap className="h-5 w-5" />
                    IT Alerts
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {activeITAlerts.map(alert => (
                    <div key={alert.id} className={`flex items-center justify-between p-3 rounded-lg border ${alert.priority === 'Emergency' ? 'bg-red-500/10 border-red-500/30' : 'bg-cyan-500/10 border-cyan-500/20'}`}>
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-cyan-500/20">
                          <Monitor className="h-4 w-4 text-cyan-400" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{alert.standName}</span>
                            <Badge variant="outline" className="text-xs">{alert.issueType}</Badge>
                            {alert.priority === 'Emergency' && (
                              <Badge variant="destructive" className="text-xs">Urgent</Badge>
                            )}
                          </div>
                          <div className="text-sm text-white/60">{alert.description}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className={statusColors[alert.status]}>{alert.status}</Badge>
                        <div className="text-xs text-white/50 mt-1">{formatTimeAgo(alert.createdAt)}</div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-4">
            <WeatherWidget compact className="w-full" />

            <Card className="bg-white/5 border-white/10" data-testid="stand-overview">
              <CardHeader className="pb-2">
                <CardTitle className="text-white flex items-center gap-2 text-lg">
                  <MapPin className="h-5 w-5 text-green-400" />
                  Stand Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
                  <div className="space-y-2">
                    {standStatuses.map(stand => (
                      <div key={stand.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer">
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${standStatusColors[stand.status]}`} />
                          <div>
                            <div className="font-medium text-sm">{stand.name}</div>
                            <div className="text-xs text-white/50">{stand.section}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {stand.activeIssues > 0 && (
                            <Badge variant="destructive" className="text-xs">
                              {stand.activeIssues} issue{stand.activeIssues > 1 ? 's' : ''}
                            </Badge>
                          )}
                          {stand.pendingDeliveries > 0 && (
                            <Badge variant="outline" className="text-xs border-blue-500/50 text-blue-300">
                              {stand.pendingDeliveries} pending
                            </Badge>
                          )}
                          <Badge variant="outline" className="text-xs border-white/20">
                            {stand.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            <Card className="bg-white/5 border-white/10" data-testid="quick-actions">
              <CardHeader className="pb-2">
                <CardTitle className="text-white text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-2">
                <Button variant="outline" className="h-auto py-3 flex flex-col items-center gap-1 bg-white/5 border-white/20 hover:bg-white/10" data-testid="button-broadcast">
                  <Radio className="h-5 w-5 text-cyan-400" />
                  <span className="text-xs">Broadcast</span>
                </Button>
                <Link href="/messages">
                  <Button variant="outline" className="h-auto py-3 flex flex-col items-center gap-1 bg-white/5 border-white/20 hover:bg-white/10 w-full" data-testid="button-view-messages">
                    <MessageSquare className="h-5 w-5 text-blue-400" />
                    <span className="text-xs">Messages</span>
                  </Button>
                </Link>
                <Link href="/warehouse">
                  <Button variant="outline" className="h-auto py-3 flex flex-col items-center gap-1 bg-white/5 border-white/20 hover:bg-white/10 w-full" data-testid="button-warehouse">
                    <Package className="h-5 w-5 text-orange-400" />
                    <span className="text-xs">Warehouse</span>
                  </Button>
                </Link>
                <Button variant="outline" className="h-auto py-3 flex flex-col items-center gap-1 bg-white/5 border-white/20 hover:bg-white/10" data-testid="button-reports">
                  <TrendingUp className="h-5 w-5 text-green-400" />
                  <span className="text-xs">Reports</span>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        <WeatherWidget className="w-full" />
      </main>
    </div>
  );
}
