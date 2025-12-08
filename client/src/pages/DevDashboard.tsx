import { useState, useEffect } from "react";
import { useStore } from "@/lib/mockData";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { 
  Shield, UserCog, Monitor, LogOut, ChefHat, Package, 
  Wine, Sparkles, Users, Radio, AlertTriangle, Truck,
  Activity, Zap, Eye, RefreshCw, Trash2, CheckCircle2,
  XCircle, Wifi, WifiOff, Siren, FlaskConical, Crown, Calendar,
  Database, Server, Globe, FileText, BookOpen
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useWebSocket, useWebSocketStore } from "@/lib/websocket";
import { useMode } from "@/lib/ModeContext";
import { SandboxStatusCompact } from "@/components/SandboxBanner";
import { FeatureInventory } from "@/components/FeatureInventory";
import { AssetTracker } from "@/components/AssetTracker";
import ComplianceAlertPanel from '@/components/ComplianceAlertPanel';
import { GlobalModeBar } from '@/components/GlobalModeBar';
import { DashboardControls } from '@/components/DashboardControls';
import { StaffPinsPanel } from '@/components/StaffPinsPanel';
import { EventControlPanel } from '@/components/EventControlPanel';
import { ReleaseManager } from '@/components/ReleaseManager';
import { LayoutShell, BentoCard, CarouselRail, AccordionStack } from '@/components/ui/bento';

interface RoleButtonProps {
  name: string;
  description: string;
  pin: string;
  route: string;
  icon: React.ReactNode;
  color: string;
  onClick: (pin: string, route: string) => void;
}

function RoleButton({ name, description, pin, route, icon, color, onClick }: RoleButtonProps) {
  const colorClasses: Record<string, string> = {
    cyan: "hover:border-cyan-500 hover:bg-cyan-500/10",
    teal: "hover:border-teal-500 hover:bg-teal-500/10",
    green: "hover:border-emerald-500 hover:bg-emerald-500/10",
    red: "hover:border-rose-500 hover:bg-rose-500/10",
    purple: "hover:border-violet-500 hover:bg-violet-500/10",
    blue: "hover:border-sky-500 hover:bg-sky-500/10",
    pink: "hover:border-pink-400 hover:bg-pink-400/10",
    sky: "hover:border-sky-400 hover:bg-sky-400/10",
  };

  const textColors: Record<string, string> = {
    cyan: "text-cyan-400",
    teal: "text-teal-400",
    green: "text-emerald-400",
    red: "text-rose-400",
    purple: "text-violet-400",
    blue: "text-sky-400",
    pink: "text-pink-400",
    sky: "text-sky-400",
  };

  return (
    <button
      onClick={() => onClick(pin, route)}
      className={cn(
        "w-full p-3 rounded-lg border border-slate-700/50 bg-slate-800/50",
        "flex items-center gap-3 text-left transition-all duration-200",
        colorClasses[color]
      )}
      data-testid={`role-${name.toLowerCase().replace(/\s+/g, '-')}`}
    >
      <span className={textColors[color]}>{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-slate-200 text-sm">{name}</div>
        <div className="text-xs text-slate-500 truncate">{description}</div>
      </div>
      <span className="text-xs text-slate-600 font-mono">{pin}</span>
    </button>
  );
}

interface MetricCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  status?: 'good' | 'warning' | 'error';
}

function MetricCard({ label, value, icon, status = 'good' }: MetricCardProps) {
  const statusColors = {
    good: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
    warning: "text-amber-400 border-amber-500/30 bg-amber-500/10",
    error: "text-rose-400 border-rose-500/30 bg-rose-500/10",
  };

  return (
    <div 
      className={cn(
        "flex items-center gap-3 p-4 rounded-xl border min-w-[160px]",
        statusColors[status]
      )}
      data-testid={`metric-${label.toLowerCase().replace(/\s+/g, '-')}`}
    >
      {icon}
      <div>
        <div className="text-xl font-bold">{value}</div>
        <div className="text-xs opacity-70">{label}</div>
      </div>
    </div>
  );
}

interface QuickToolButtonProps {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  variant?: 'default' | 'success' | 'danger' | 'warning';
}

function QuickToolButton({ label, icon, onClick, variant = 'default' }: QuickToolButtonProps) {
  const variantClasses = {
    default: "border-slate-600 text-slate-300 hover:border-cyan-500 hover:bg-cyan-500/10",
    success: "border-green-700 text-green-400 hover:bg-green-500/20",
    danger: "border-red-700 text-red-400 hover:bg-red-500/20",
    warning: "border-amber-700 text-amber-400 hover:bg-amber-500/20",
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-2 p-4 rounded-xl border min-w-[100px]",
        "transition-all duration-200",
        variantClasses[variant]
      )}
      data-testid={`tool-${label.toLowerCase().replace(/\s+/g, '-')}`}
    >
      {icon}
      <span className="text-xs font-medium">{label}</span>
    </button>
  );
}

export default function DevDashboard() {
  const login = useStore((state) => state.login);
  const logout = useStore((state) => state.logout);
  const currentUser = useStore((state) => state.currentUser);
  const [, setLocation] = useLocation();
  const { isConnected } = useWebSocket(currentUser?.id ?? undefined);
  const wsStore = useWebSocketStore();
  const { isSandbox, enterSandbox, exitSandbox } = useMode();
  
  const [showDashboardControls, setShowDashboardControls] = useState(false);
  const [systemStats, setSystemStats] = useState({
    activeUsers: 0,
    pendingDeliveries: 0,
    activeEmergencies: 0,
    messagesLast24h: 0
  });

  useEffect(() => {
    loadSystemStats();
  }, []);

  async function loadSystemStats() {
    try {
      const [deliveriesRes, emergenciesRes] = await Promise.all([
        fetch('/api/delivery-requests'),
        fetch('/api/emergency-alerts/active')
      ]);
      
      if (deliveriesRes.ok) {
        const deliveries = await deliveriesRes.json();
        const pending = deliveries.filter((d: any) => 
          ['requested', 'acknowledged', 'picking', 'on_the_way'].includes(d.status)
        ).length;
        setSystemStats(prev => ({ ...prev, pendingDeliveries: pending }));
      }
      
      if (emergenciesRes.ok) {
        const emergencies = await emergenciesRes.json();
        setSystemStats(prev => ({ ...prev, activeEmergencies: emergencies.length }));
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  }

  const handleRoleSwitch = (pin: string, route: string) => {
    logout();
    login(pin);
    setLocation(route);
  };

  const roles = {
    command: [
      { name: "Developer", description: "Dev + Field Ops (unified view)", pin: "2424", route: "/ops-command", icon: <Monitor className="h-5 w-5" />, color: "cyan" },
      { name: "Ops Manager", description: "David - full ops control", pin: "2424", route: "/ops-command", icon: <Radio className="h-5 w-5" />, color: "cyan" },
    ],
    management: [
      { name: "Management", description: "All managers - full access", pin: "4444", route: "/manager-dashboard", icon: <UserCog className="h-5 w-5" />, color: "teal" },
      { name: "Warehouse", description: "Jay/AJ - purchasing & receiving", pin: "4444", route: "/warehouse", icon: <Package className="h-5 w-5" />, color: "teal" },
      { name: "Kitchen", description: "Chef Deb/Bobby - culinary ops", pin: "4444", route: "/kitchen", icon: <ChefHat className="h-5 w-5" />, color: "sky" },
      { name: "Bar Manager", description: "Darby - bar scheduler & ops", pin: "4444", route: "/bar-scheduler", icon: <Wine className="h-5 w-5" />, color: "pink" },
    ],
    field: [
      { name: "Stand Supervisor", description: "Section oversight, full dashboard", pin: "3333", route: "/supervisor", icon: <UserCog className="h-5 w-5" />, color: "teal" },
      { name: "Stand Lead", description: "Stand flow, worker direction", pin: "2222", route: "/standlead", icon: <Users className="h-5 w-5" />, color: "green" },
      { name: "NPO Worker", description: "Frontline concessions", pin: "1111", route: "/npo", icon: <Sparkles className="h-5 w-5" />, color: "blue" },
    ],
    specialty: [
      { name: "Alcohol Compliance", description: "Vendor monitoring, violation reports", pin: "5555", route: "/alcohol-compliance", icon: <Wine className="h-5 w-5" />, color: "red" },
      { name: "Check-in Assistant", description: "Guest services, incident reporting", pin: "6666", route: "/checkin-assistant", icon: <Users className="h-5 w-5" />, color: "sky" },
    ],
    admin: [
      { name: "Admin", description: "Full system access", pin: "0424", route: "/admin", icon: <Shield className="h-5 w-5" />, color: "red" },
      { name: "Executive", description: "Brian/Megan - high-level view", pin: "0424", route: "/executive", icon: <Eye className="h-5 w-5" />, color: "purple" },
    ]
  };

  const heroMetrics = [
    <MetricCard 
      key="api" 
      label="API Status" 
      value="Online" 
      icon={<Globe className="h-5 w-5" />} 
      status="good" 
    />,
    <MetricCard 
      key="db" 
      label="Database" 
      value="Healthy" 
      icon={<Database className="h-5 w-5" />} 
      status="good" 
    />,
    <MetricCard 
      key="ws" 
      label="WebSocket" 
      value={isConnected ? "Live" : "Offline"} 
      icon={isConnected ? <Wifi className="h-5 w-5" /> : <WifiOff className="h-5 w-5" />} 
      status={isConnected ? "good" : "error"} 
    />,
    <MetricCard 
      key="deliveries" 
      label="Deliveries" 
      value={systemStats.pendingDeliveries} 
      icon={<Truck className="h-5 w-5" />} 
      status={systemStats.pendingDeliveries > 5 ? "warning" : "good"} 
    />,
    <MetricCard 
      key="emergencies" 
      label="Emergencies" 
      value={systemStats.activeEmergencies} 
      icon={<AlertTriangle className="h-5 w-5" />} 
      status={systemStats.activeEmergencies > 0 ? "error" : "good"} 
    />,
    <MetricCard 
      key="server" 
      label="Server" 
      value="Running" 
      icon={<Server className="h-5 w-5" />} 
      status="good" 
    />,
  ];

  const quickTools = [
    <QuickToolButton 
      key="refresh" 
      label="Refresh" 
      icon={<RefreshCw className="h-5 w-5" />} 
      onClick={() => window.location.reload()} 
    />,
    <QuickToolButton 
      key="stats" 
      label="Reload Stats" 
      icon={<Activity className="h-5 w-5" />} 
      onClick={() => loadSystemStats()} 
    />,
    <QuickToolButton 
      key="bypass" 
      label="Auto-Bypass" 
      icon={<CheckCircle2 className="h-5 w-5" />} 
      onClick={() => localStorage.setItem("stadiumops_dev_bypass", "true")} 
      variant="success" 
    />,
    <QuickToolButton 
      key="clear" 
      label="Clear Bypass" 
      icon={<XCircle className="h-5 w-5" />} 
      onClick={() => localStorage.removeItem("stadiumops_dev_bypass")} 
      variant="danger" 
    />,
    <QuickToolButton 
      key="controls" 
      label="Dashboard" 
      icon={<Crown className="h-5 w-5" />} 
      onClick={() => setShowDashboardControls(true)} 
      variant="warning" 
    />,
    <QuickToolButton 
      key="reset" 
      label="Reset All" 
      icon={<Trash2 className="h-5 w-5" />} 
      onClick={() => { localStorage.clear(); window.location.reload(); }} 
      variant="danger" 
    />,
  ];

  const orbitStatusItems = [
    <div key="api-gateway" className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/30" data-testid="orbit-api-gateway">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
        <span className="text-xs text-slate-400">API Gateway</span>
      </div>
      <div className="text-lg font-bold text-green-400">Active</div>
    </div>,
    <div key="database" className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/30" data-testid="orbit-database">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
        <span className="text-xs text-slate-400">Database</span>
      </div>
      <div className="text-lg font-bold text-green-400">Online</div>
    </div>,
    <div key="websocket" className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/30" data-testid="orbit-websocket">
      <div className="flex items-center gap-2 mb-2">
        <div className={cn("w-2 h-2 rounded-full", isConnected ? "bg-green-500 animate-pulse" : "bg-red-500")} />
        <span className="text-xs text-slate-400">WebSocket</span>
      </div>
      <div className={cn("text-lg font-bold", isConnected ? "text-green-400" : "text-red-400")}>
        {isConnected ? "Connected" : "Offline"}
      </div>
    </div>,
    <div key="messages" className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/30" data-testid="orbit-messages">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
        <span className="text-xs text-slate-400">Messages</span>
      </div>
      <div className="text-lg font-bold text-cyan-400">
        {wsStore.messages.length > 0 ? wsStore.messages.length : "—"}
      </div>
    </div>,
  ];

  const supportItems = [
    {
      title: "Command Center Roles",
      content: (
        <div className="space-y-2">
          {roles.command.map(role => (
            <RoleButton key={role.name} {...role} onClick={handleRoleSwitch} />
          ))}
        </div>
      )
    },
    {
      title: "Department Managers",
      content: (
        <div className="space-y-2">
          {roles.management.map(role => (
            <RoleButton key={role.name} {...role} onClick={handleRoleSwitch} />
          ))}
        </div>
      )
    },
    {
      title: "Field Operations",
      content: (
        <div className="space-y-2">
          {roles.field.map(role => (
            <RoleButton key={role.name} {...role} onClick={handleRoleSwitch} />
          ))}
        </div>
      )
    },
    {
      title: "Specialty Roles",
      content: (
        <div className="space-y-2">
          {roles.specialty.map(role => (
            <RoleButton key={role.name} {...role} onClick={handleRoleSwitch} />
          ))}
        </div>
      )
    },
    {
      title: "Admin & Executive",
      content: (
        <div className="space-y-2">
          {roles.admin.map(role => (
            <RoleButton key={role.name} {...role} onClick={handleRoleSwitch} />
          ))}
        </div>
      )
    },
    {
      title: "Sandbox Mode",
      content: (
        <div className="space-y-3">
          <p className="text-xs text-slate-400">
            Train staff, demo to stakeholders, or test features safely without affecting live operations.
          </p>
          {isSandbox ? (
            <Button 
              onClick={exitSandbox}
              className="w-full bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500"
              data-testid="button-exit-sandbox"
            >
              <FlaskConical className="h-4 w-4 mr-2" />
              Exit Sandbox Mode
            </Button>
          ) : (
            <Button 
              onClick={() => enterSandbox('/dev')}
              variant="outline"
              className="w-full border-cyan-500/50 text-cyan-300 hover:bg-cyan-500/20"
              data-testid="button-enter-sandbox"
            >
              <FlaskConical className="h-4 w-4 mr-2" />
              Enter Sandbox Mode
            </Button>
          )}
        </div>
      )
    },
    {
      title: "Feature Inventory",
      content: <FeatureInventory />
    },
    {
      title: "Asset Tracker (Hallmark)",
      content: <AssetTracker />
    },
    {
      title: "Staff PINs (Legends)",
      content: <StaffPinsPanel />
    },
  ];

  return (
    <LayoutShell className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 !block" data-testid="dev-dashboard">
      <GlobalModeBar />
      
      <header className="sticky top-0 z-50 bg-slate-950/90 backdrop-blur-sm border-b border-cyan-500/20 px-4 py-3" data-testid="dev-dashboard-header">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center shadow-lg shadow-cyan-500/30">
                <Radio className="h-5 w-5 text-white" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-green-500 border-2 border-slate-950 animate-pulse" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-cyan-400">Orby Command</h1>
              <p className="text-xs text-slate-500">Developer Console</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <SandboxStatusCompact />
            {isConnected ? (
              <div className="flex items-center gap-1 text-green-400 text-xs" data-testid="status-connected">
                <Wifi className="h-4 w-4" />
                <span className="hidden sm:inline">Live</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-red-400 text-xs" data-testid="status-disconnected">
                <WifiOff className="h-4 w-4" />
                <span className="hidden sm:inline">Offline</span>
              </div>
            )}
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setLocation("/")} 
              className="text-slate-400 hover:text-white"
              data-testid="button-exit"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="px-4 py-4 max-w-7xl mx-auto pb-24" data-testid="dev-dashboard-main">
        <ComplianceAlertPanel 
          userId={currentUser?.id} 
          userName={currentUser?.name} 
          isManager={true}
        />

        <LayoutShell className="mt-4">
          <BentoCard span={12} className="col-span-4 md:col-span-6 lg:col-span-12" data-testid="bento-hero-metrics">
            <div className="flex items-center gap-2 mb-3">
              <Activity className="h-4 w-4 text-cyan-400" />
              <span className="text-sm font-medium text-slate-300">System Metrics</span>
            </div>
            <CarouselRail items={heroMetrics} showDots autoplay />
          </BentoCard>

          <BentoCard span={6} className="col-span-4 md:col-span-6 lg:col-span-6" data-testid="bento-quick-tools">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="h-4 w-4 text-amber-400" />
              <span className="text-sm font-medium text-slate-300">Quick Tools</span>
            </div>
            <CarouselRail items={quickTools} />
          </BentoCard>

          <BentoCard span={6} className="col-span-4 md:col-span-6 lg:col-span-6" data-testid="bento-release-manager">
            <div className="flex items-center gap-2 mb-3">
              <Package className="h-4 w-4 text-green-400" />
              <span className="text-sm font-medium text-slate-300">Release Manager</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-500/20 text-green-400 border border-green-500/30">Solana</span>
            </div>
            <ReleaseManager />
          </BentoCard>

          <BentoCard span={8} className="col-span-4 md:col-span-6 lg:col-span-8" data-testid="bento-orbit-hub">
            <div className="flex items-center gap-2 mb-3">
              <Globe className="h-4 w-4 text-violet-400" />
              <span className="text-sm font-medium text-slate-300">ORBIT Hub Status</span>
            </div>
            <CarouselRail items={orbitStatusItems} />
            
            <div className="mt-4 pt-4 border-t border-slate-700/30">
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="h-4 w-4 text-emerald-400" />
                <span className="text-sm font-medium text-slate-300">Event Control</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">LIVE</span>
              </div>
              <EventControlPanel 
                userPin={currentUser?.pin || ''} 
                userId={currentUser?.id || ''} 
                userName={currentUser?.name || ''} 
              />
            </div>
          </BentoCard>

          <BentoCard span={4} className="col-span-4 md:col-span-6 lg:col-span-4" data-testid="bento-system-logs">
            <div className="flex items-center gap-2 mb-3">
              <FileText className="h-4 w-4 text-slate-400" />
              <span className="text-sm font-medium text-slate-300">System Logs</span>
            </div>
            <div className="space-y-2 text-xs max-h-[200px] overflow-y-auto" data-testid="system-logs-container">
              <div className="flex items-start gap-2 p-2 rounded bg-slate-800/50" data-testid="log-entry-init">
                <span className="text-green-400 shrink-0">[OK]</span>
                <span className="text-slate-400">System initialized successfully</span>
              </div>
              <div className="flex items-start gap-2 p-2 rounded bg-slate-800/50" data-testid="log-entry-ws">
                <span className="text-cyan-400 shrink-0">[WS]</span>
                <span className="text-slate-400">{isConnected ? "WebSocket connected" : "WebSocket disconnected"}</span>
              </div>
              <div className="flex items-start gap-2 p-2 rounded bg-slate-800/50" data-testid="log-entry-db">
                <span className="text-violet-400 shrink-0">[DB]</span>
                <span className="text-slate-400">Database connection pool active</span>
              </div>
              {systemStats.activeEmergencies > 0 && (
                <div className="flex items-start gap-2 p-2 rounded bg-red-900/30 border border-red-500/30" data-testid="log-entry-alert">
                  <span className="text-red-400 shrink-0">[ALERT]</span>
                  <span className="text-red-300">{systemStats.activeEmergencies} active emergency alert(s)</span>
                </div>
              )}
              <div className="flex items-start gap-2 p-2 rounded bg-slate-800/50" data-testid="log-entry-api">
                <span className="text-amber-400 shrink-0">[API]</span>
                <span className="text-slate-400">All endpoints responding</span>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-slate-700/30">
              <div className="flex gap-2 flex-wrap">
                <Button
                  onClick={() => setLocation('/command-center')}
                  size="sm"
                  className={cn(
                    "flex-1 text-xs",
                    systemStats.activeEmergencies > 0 
                      ? "bg-red-600 hover:bg-red-700 animate-pulse" 
                      : "bg-red-900/50 border border-red-700/50 hover:bg-red-800/50"
                  )}
                  data-testid="button-command-center"
                >
                  <Siren className="h-3 w-3 mr-1" />
                  Emergency
                </Button>
                <Button
                  onClick={() => setLocation('/reports')}
                  size="sm"
                  className="flex-1 text-xs bg-cyan-900/50 border border-cyan-700/50 hover:bg-cyan-800/50"
                  data-testid="button-reports"
                >
                  <Activity className="h-3 w-3 mr-1" />
                  Reports
                </Button>
              </div>
            </div>
          </BentoCard>

          <BentoCard span={12} className="col-span-4 md:col-span-6 lg:col-span-12" data-testid="bento-support-section">
            <div className="flex items-center gap-2 mb-3">
              <BookOpen className="h-4 w-4 text-violet-400" />
              <span className="text-sm font-medium text-slate-300">Documentation & Tools</span>
            </div>
            <AccordionStack items={supportItems} defaultOpen={[5, 8]} />
          </BentoCard>
        </LayoutShell>
      </main>

      <div className="fixed bottom-6 right-6" data-testid="fab-container">
        <Button
          size="lg"
          className="rounded-full w-14 h-14 bg-gradient-to-br from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 shadow-lg shadow-cyan-500/40"
          onClick={() => setLocation("/ops-command")}
          data-testid="button-ops-command"
        >
          <Radio className="h-6 w-6" />
        </Button>
      </div>

      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              opacity: Math.random() * 0.5 + 0.2
            }}
          />
        ))}
      </div>

      <DashboardControls
        isOpen={showDashboardControls}
        onClose={() => setShowDashboardControls(false)}
      />
    </LayoutShell>
  );
}
