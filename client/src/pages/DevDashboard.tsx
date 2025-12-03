import { useState, useEffect } from "react";
import { useStore } from "@/lib/mockData";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { 
  Shield, UserCog, Monitor, LogOut, ChefHat, Package, 
  Wine, Sparkles, Users, Radio, AlertTriangle, Truck,
  MessageSquare, Activity, ChevronDown, ChevronRight,
  Zap, Eye, RefreshCw, Trash2, Clock, CheckCircle2,
  XCircle, Wifi, WifiOff, Siren, FlaskConical, ClipboardList
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useWebSocket, useWebSocketStore } from "@/lib/websocket";
import { useMode } from "@/lib/ModeContext";
import { SandboxStatusCompact } from "@/components/SandboxBanner";
import { FeatureInventory } from "@/components/FeatureInventory";
import { AssetTracker } from "@/components/AssetTracker";
import ComplianceAlertPanel from '@/components/ComplianceAlertPanel';
import { GlobalModeBar } from '@/components/GlobalModeBar';

interface AccordionSectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  accentColor?: string;
  badge?: string | number;
}

function AccordionSection({ title, icon, children, defaultOpen = false, accentColor = "cyan", badge }: AccordionSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  const colorClasses: Record<string, string> = {
    cyan: "border-cyan-500/50 bg-cyan-500/10",
    teal: "border-teal-500/50 bg-teal-500/10",
    green: "border-emerald-500/50 bg-emerald-500/10",
    red: "border-rose-500/50 bg-rose-500/10",
    purple: "border-violet-500/50 bg-violet-500/10",
    blue: "border-sky-500/50 bg-sky-500/10",
  };

  const textColors: Record<string, string> = {
    cyan: "text-cyan-400",
    teal: "text-teal-400",
    green: "text-emerald-400",
    red: "text-rose-400",
    purple: "text-violet-400",
    blue: "text-sky-400",
  };

  return (
    <div className={cn(
      "rounded-lg border overflow-hidden transition-all duration-200",
      isOpen ? colorClasses[accentColor] : "border-slate-700/50 bg-slate-900/50"
    )}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 flex items-center justify-between text-left"
        data-testid={`accordion-${title.toLowerCase().replace(/\s+/g, '-')}`}
      >
        <div className="flex items-center gap-3">
          <span className={textColors[accentColor]}>{icon}</span>
          <span className="font-semibold text-slate-200">{title}</span>
          {badge !== undefined && (
            <span className={cn(
              "px-2 py-0.5 rounded-full text-xs font-bold",
              colorClasses[accentColor],
              textColors[accentColor]
            )}>
              {badge}
            </span>
          )}
        </div>
        {isOpen ? (
          <ChevronDown className="h-5 w-5 text-slate-400" />
        ) : (
          <ChevronRight className="h-5 w-5 text-slate-400" />
        )}
      </button>
      {isOpen && (
        <div className="px-4 pb-4 space-y-2">
          {children}
        </div>
      )}
    </div>
  );
}

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

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  status?: 'good' | 'warning' | 'error';
}

function StatCard({ label, value, icon, status = 'good' }: StatCardProps) {
  const statusColors = {
    good: "text-emerald-400",
    warning: "text-cyan-300",
    error: "text-rose-400",
  };

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50 border border-slate-700/30">
      <span className={statusColors[status]}>{icon}</span>
      <div>
        <div className="text-lg font-bold text-slate-200">{value}</div>
        <div className="text-xs text-slate-500">{label}</div>
      </div>
    </div>
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
      { name: "Developer", description: "Jason - Dev + Field Ops (unified view)", pin: "0424", route: "/ops-command", icon: <Monitor className="h-5 w-5" />, color: "cyan" },
      { name: "Ops Manager", description: "David - full ops control", pin: "0424", route: "/ops-command", icon: <Radio className="h-5 w-5" />, color: "cyan" },
      { name: "Special Ops", description: "Sid's controller view", pin: "0424", route: "/ops-command", icon: <Zap className="h-5 w-5" />, color: "purple" },
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      <GlobalModeBar />
      {/* Compact Header */}
      <header className="sticky top-0 z-50 bg-slate-950/90 backdrop-blur-sm border-b border-cyan-500/20 px-4 py-3">
        <div className="flex items-center justify-between">
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
              <div className="flex items-center gap-1 text-green-400 text-xs">
                <Wifi className="h-4 w-4" />
                <span className="hidden sm:inline">Live</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-red-400 text-xs">
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

      {/* Main Content */}
      <main className="px-4 py-4 space-y-4 max-w-lg mx-auto pb-24">
        <ComplianceAlertPanel 
          userId={currentUser?.id} 
          userName={currentUser?.name} 
          isManager={true}
        />
        
        {/* Quick Stats Row */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard 
            label="Active Deliveries" 
            value={systemStats.pendingDeliveries} 
            icon={<Truck className="h-5 w-5" />}
            status={systemStats.pendingDeliveries > 5 ? 'warning' : 'good'}
          />
          <StatCard 
            label="Emergencies" 
            value={systemStats.activeEmergencies} 
            icon={<AlertTriangle className="h-5 w-5" />}
            status={systemStats.activeEmergencies > 0 ? 'error' : 'good'}
          />
        </div>

        {/* Emergency Command Center Quick Access */}
        <Button
          onClick={() => setLocation('/command-center')}
          className={cn(
            "w-full py-4 text-left justify-start gap-3 font-bold",
            systemStats.activeEmergencies > 0 
              ? "bg-red-600 hover:bg-red-700 animate-pulse" 
              : "bg-gradient-to-r from-red-900/50 to-red-800/50 border border-red-700/50 hover:from-red-800/60 hover:to-red-700/60"
          )}
          data-testid="button-command-center"
        >
          <Siren className="h-5 w-5" />
          <div className="flex-1">
            <div className="text-sm">Emergency Command Center</div>
            <div className="text-xs text-white/70 font-normal">
              {systemStats.activeEmergencies > 0 
                ? `${systemStats.activeEmergencies} active incident${systemStats.activeEmergencies > 1 ? 's' : ''}` 
                : 'All clear - No active incidents'}
            </div>
          </div>
          <AlertTriangle className={cn("h-4 w-4", systemStats.activeEmergencies > 0 ? "text-cyan-300" : "text-slate-400")} />
        </Button>

        {/* Reporting Dashboard Quick Access */}
        <Button
          onClick={() => setLocation('/reports')}
          className="w-full py-4 text-left justify-start gap-3 font-bold bg-gradient-to-r from-cyan-900/50 to-teal-900/50 border border-cyan-700/50 hover:from-cyan-800/60 hover:to-teal-800/60"
          data-testid="button-reports"
        >
          <Activity className="h-5 w-5 text-cyan-400" />
          <div className="flex-1">
            <div className="text-sm">Ultimate Reporting Dashboard</div>
            <div className="text-xs text-white/70 font-normal">
              Puzzle-style unified operations view
            </div>
          </div>
          <Zap className="h-4 w-4 text-cyan-400" />
        </Button>

        {/* Role Sections */}
        <AccordionSection 
          title="Command Center" 
          icon={<Radio className="h-5 w-5" />}
          defaultOpen={true}
          accentColor="cyan"
          badge={3}
        >
          <div className="space-y-2">
            {roles.command.map(role => (
              <RoleButton key={role.pin + role.route} {...role} onClick={handleRoleSwitch} />
            ))}
          </div>
        </AccordionSection>

        <AccordionSection 
          title="Department Managers" 
          icon={<UserCog className="h-5 w-5" />}
          accentColor="teal"
          badge={4}
        >
          <div className="space-y-2">
            {roles.management.map(role => (
              <RoleButton key={role.pin + role.route} {...role} onClick={handleRoleSwitch} />
            ))}
          </div>
        </AccordionSection>

        <AccordionSection 
          title="Field Operations" 
          icon={<Users className="h-5 w-5" />}
          accentColor="green"
          badge={3}
        >
          <div className="space-y-2">
            {roles.field.map(role => (
              <RoleButton key={role.pin + role.route} {...role} onClick={handleRoleSwitch} />
            ))}
          </div>
        </AccordionSection>

        <AccordionSection 
          title="Specialty Roles" 
          icon={<ClipboardList className="h-5 w-5" />}
          accentColor="red"
          badge={2}
        >
          <div className="space-y-2">
            {roles.specialty.map(role => (
              <RoleButton key={role.pin + role.route} {...role} onClick={handleRoleSwitch} />
            ))}
          </div>
        </AccordionSection>

        <AccordionSection 
          title="Admin & Executive" 
          icon={<Shield className="h-5 w-5" />}
          accentColor="purple"
          badge={2}
        >
          <div className="space-y-2">
            {roles.admin.map(role => (
              <RoleButton key={role.pin + role.route} {...role} onClick={handleRoleSwitch} />
            ))}
          </div>
        </AccordionSection>

        {/* Sandbox Mode Toggle */}
        <AccordionSection 
          title="Sandbox Mode" 
          icon={<FlaskConical className="h-5 w-5" />}
          defaultOpen={isSandbox}
          accentColor="cyan"
          badge={isSandbox ? "Active" : undefined}
        >
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
            <div className="text-[10px] text-slate-500 space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>All changes are simulated - no real data affected</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-500"></span>
                <span>Demo fixtures loaded automatically</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-violet-500"></span>
                <span>Clear visual indicator when in sandbox</span>
              </div>
            </div>
          </div>
        </AccordionSection>

        {/* Quick Actions */}
        <AccordionSection 
          title="Developer Tools" 
          icon={<Zap className="h-5 w-5" />}
          accentColor="red"
        >
          <div className="grid grid-cols-2 gap-2">
            <Button 
              variant="outline" 
              size="sm"
              className="border-slate-700 text-slate-300 text-xs justify-start"
              onClick={() => window.location.reload()}
              data-testid="button-refresh"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              className="border-slate-700 text-slate-300 text-xs justify-start"
              onClick={() => loadSystemStats()}
              data-testid="button-reload-stats"
            >
              <Activity className="h-4 w-4 mr-2" />
              Reload Stats
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              className="border-green-800 text-green-400 text-xs justify-start"
              onClick={() => {
                localStorage.setItem("stadiumops_dev_bypass", "true");
              }}
              data-testid="button-enable-bypass"
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Auto-Bypass
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              className="border-red-800 text-red-400 text-xs justify-start"
              onClick={() => {
                localStorage.removeItem("stadiumops_dev_bypass");
              }}
              data-testid="button-disable-bypass"
            >
              <XCircle className="h-4 w-4 mr-2" />
              Clear Bypass
            </Button>
          </div>
          <Button 
            variant="destructive" 
            size="sm"
            className="w-full mt-2 text-xs"
            onClick={() => { localStorage.clear(); window.location.reload(); }}
            data-testid="button-reset-all"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Reset All Local Data
          </Button>
        </AccordionSection>

        {/* Feature Inventory */}
        <AccordionSection
          title="Feature Inventory"
          icon={<ClipboardList className="h-5 w-5" />}
          defaultOpen={false}
          accentColor="purple"
          badge="Track"
        >
          <FeatureInventory />
        </AccordionSection>

        {/* Genesis Hallmark Asset Tracker */}
        <AccordionSection
          title="Asset Tracker"
          icon={<Shield className="h-5 w-5" />}
          defaultOpen={false}
          accentColor="cyan"
          badge="Hallmark"
        >
          <AssetTracker />
        </AccordionSection>

        {/* System Status */}
        <div className="rounded-lg border border-slate-700/30 bg-slate-900/30 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Activity className="h-4 w-4 text-cyan-400" />
            <span className="text-sm font-medium text-slate-300">System Status</span>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-500">WebSocket</span>
              <span className={isConnected ? "text-green-400" : "text-red-400"}>
                {isConnected ? "Connected" : "Disconnected"}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Messages</span>
              <span className="text-slate-400">
                {wsStore.messages.length > 0 ? `${wsStore.messages.length} received` : "—"}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Database</span>
              <span className="text-green-400">Online</span>
            </div>
          </div>
        </div>
      </main>

      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6">
        <Button
          size="lg"
          className="rounded-full w-14 h-14 bg-gradient-to-br from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 shadow-lg shadow-cyan-500/40"
          onClick={() => setLocation("/ops-command")}
          data-testid="button-ops-command"
        >
          <Radio className="h-6 w-6" />
        </Button>
      </div>

      {/* Twinkling Stars Background */}
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
    </div>
  );
}
