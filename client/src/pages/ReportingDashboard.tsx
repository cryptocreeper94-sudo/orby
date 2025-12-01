import { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'wouter';
import { useStore } from '@/lib/mockData';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useMode } from '@/lib/ModeContext';
import { SandboxStatusCompact, SandboxBadge } from '@/components/SandboxBanner';
import { useSandboxData } from '@/lib/useSandboxData';
import { demoDeliveries, demoEmergencies, demoMessages, demoStats } from '@/lib/demoFixtures';
import { staggerContainer, staggerItem, slideUp, scaleIn, cardHover } from '@/lib/motion';
import {
  LogOut, RefreshCw, Package, Utensils, Beer, Monitor, Trash2, MapPin,
  AlertTriangle, CheckCircle2, Clock, Users, Truck, Zap, Radio, Shield,
  Activity, Bell, ChevronRight, ChevronDown, Wifi, WifiOff, Flame, ThermometerSun,
  MessageSquare, FileText, BarChart3, TrendingUp, Timer, Target, Eye,
  ArrowUpRight, ArrowDownRight, Minus, Search, Filter, Calendar, Layers,
  Home, Settings, Menu, X, History, ClipboardList
} from 'lucide-react';
import { cn } from '@/lib/utils';

const departmentIcons: Record<string, React.ReactNode> = {
  Warehouse: <Package className="h-4 w-4" />,
  Kitchen: <Utensils className="h-4 w-4" />,
  Bar: <Beer className="h-4 w-4" />,
  IT: <Monitor className="h-4 w-4" />,
  Janitorial: <Trash2 className="h-4 w-4" />,
};

const departmentColors: Record<string, string> = {
  Warehouse: 'from-blue-600/20 to-blue-800/20 border-blue-500/30',
  Kitchen: 'from-orange-600/20 to-orange-800/20 border-orange-500/30',
  Bar: 'from-purple-600/20 to-purple-800/20 border-purple-500/30',
  IT: 'from-cyan-600/20 to-cyan-800/20 border-cyan-500/30',
  Janitorial: 'from-green-600/20 to-green-800/20 border-green-500/30',
};

const statusColors: Record<string, { bg: string; text: string; glow: string }> = {
  requested: { bg: 'bg-amber-500/20', text: 'text-amber-300', glow: 'shadow-amber-500/20' },
  picking: { bg: 'bg-blue-500/20', text: 'text-blue-300', glow: 'shadow-blue-500/20' },
  on_the_way: { bg: 'bg-green-500/20', text: 'text-green-300', glow: 'shadow-green-500/20' },
  delivered: { bg: 'bg-slate-500/20', text: 'text-slate-400', glow: '' },
  active: { bg: 'bg-red-500/20', text: 'text-red-300', glow: 'shadow-red-500/30' },
  responding: { bg: 'bg-amber-500/20', text: 'text-amber-300', glow: 'shadow-amber-500/20' },
};

function formatTimeAgo(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

interface PuzzleTileProps {
  title: string;
  icon: React.ReactNode;
  count?: number | string;
  trend?: 'up' | 'down' | 'stable';
  status?: 'good' | 'warning' | 'critical';
  className?: string;
  children: React.ReactNode;
  compact?: boolean;
}

function PuzzleTile({ title, icon, count, trend, status = 'good', className, children, compact }: PuzzleTileProps) {
  const statusGlow = {
    good: 'shadow-emerald-500/10',
    warning: 'shadow-amber-500/20',
    critical: 'shadow-red-500/30 animate-pulse',
  };

  const trendIcon = {
    up: <ArrowUpRight className="h-3 w-3 text-emerald-400" />,
    down: <ArrowDownRight className="h-3 w-3 text-red-400" />,
    stable: <Minus className="h-3 w-3 text-slate-400" />,
  };

  return (
    <motion.div
      variants={scaleIn}
      initial="initial"
      animate="animate"
      whileHover={{ scale: 1.01, transition: { duration: 0.2 } }}
      className={cn(
        "relative overflow-hidden rounded-xl border border-slate-700/50",
        "bg-gradient-to-br from-slate-900/90 to-slate-950/90 backdrop-blur-sm",
        "shadow-lg", statusGlow[status],
        compact ? "p-3" : "p-4",
        className
      )}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent pointer-events-none" />
      <div className="relative">
        <div className={cn("flex items-center justify-between", compact ? "mb-2" : "mb-3")}>
          <div className="flex items-center gap-2">
            <span className="text-cyan-400">{icon}</span>
            <span className={cn("font-semibold text-slate-200", compact ? "text-xs" : "text-sm")}>{title}</span>
          </div>
          {count !== undefined && (
            <div className="flex items-center gap-1">
              <span className={cn("font-bold", compact ? "text-lg text-cyan-300" : "text-2xl text-white")}>{count}</span>
              {trend && trendIcon[trend]}
            </div>
          )}
        </div>
        {children}
      </div>
    </motion.div>
  );
}

interface StatBadgeProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger';
}

function StatBadge({ label, value, icon, variant = 'default' }: StatBadgeProps) {
  const variants = {
    default: 'bg-slate-800/50 text-slate-300 border-slate-700/50',
    success: 'bg-emerald-900/30 text-emerald-300 border-emerald-700/50',
    warning: 'bg-amber-900/30 text-amber-300 border-amber-700/50',
    danger: 'bg-red-900/30 text-red-300 border-red-700/50',
  };

  return (
    <div className={cn("px-2 py-1 rounded-lg border flex items-center gap-1.5 text-xs", variants[variant])}>
      {icon}
      <span className="font-medium">{value}</span>
      <span className="text-slate-500 hidden sm:inline">{label}</span>
    </div>
  );
}

interface DeliveryItemProps {
  delivery: typeof demoDeliveries[0];
  compact?: boolean;
}

function DeliveryItem({ delivery, compact }: DeliveryItemProps) {
  const status = statusColors[delivery.status] || statusColors.requested;
  
  return (
    <motion.div
      variants={staggerItem}
      className={cn(
        "flex items-center gap-2 p-2 rounded-lg border border-slate-700/30 bg-slate-800/30",
        "hover:bg-slate-800/50 transition-colors cursor-pointer",
        status.glow && `shadow-md ${status.glow}`
      )}
    >
      <div className={cn("w-2 h-2 rounded-full", status.bg.replace('/20', ''))} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-200 truncate">{delivery.standName}</span>
          {delivery.eta && (
            <span className="text-[10px] text-cyan-400 font-mono">{delivery.eta}</span>
          )}
        </div>
        {!compact && (
          <p className="text-[10px] text-slate-500 truncate">{delivery.items}</p>
        )}
      </div>
      <Badge variant="outline" className={cn("text-[9px] px-1.5 py-0", status.bg, status.text)}>
        {delivery.status.replace('_', ' ')}
      </Badge>
    </motion.div>
  );
}

interface EmergencyItemProps {
  emergency: typeof demoEmergencies[0];
}

function EmergencyItem({ emergency }: EmergencyItemProps) {
  const status = statusColors[emergency.status] || statusColors.active;
  const isActive = emergency.status === 'active';
  
  return (
    <motion.div
      variants={staggerItem}
      className={cn(
        "flex items-center gap-2 p-2 rounded-lg border",
        isActive ? "border-red-500/50 bg-red-950/30" : "border-amber-500/30 bg-amber-950/20",
        isActive && "animate-pulse"
      )}
    >
      <AlertTriangle className={cn("h-4 w-4 flex-shrink-0", isActive ? "text-red-400" : "text-amber-400")} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-200 truncate">{emergency.type}</span>
          <span className="text-[10px] text-slate-500">{emergency.location}</span>
        </div>
        <p className="text-[10px] text-slate-400 truncate">{emergency.description}</p>
      </div>
      <Badge variant="outline" className={cn("text-[9px]", status.bg, status.text)}>
        {emergency.priority}
      </Badge>
    </motion.div>
  );
}

interface MessageItemProps {
  message: typeof demoMessages[0];
}

function MessageItem({ message }: MessageItemProps) {
  const isUnread = message.status === 'unread';
  
  return (
    <motion.div
      variants={staggerItem}
      className={cn(
        "flex items-start gap-2 p-2 rounded-lg border border-slate-700/30",
        isUnread ? "bg-cyan-950/20" : "bg-slate-800/20"
      )}
    >
      <div className={cn(
        "w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold",
        isUnread ? "bg-cyan-500/30 text-cyan-300" : "bg-slate-700/50 text-slate-400"
      )}>
        {message.from.charAt(0)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-200">{message.from}</span>
          <span className="text-[10px] text-slate-600">{message.fromRole}</span>
          <span className="text-[10px] text-slate-500 ml-auto">{formatTimeAgo(message.timestamp)}</span>
        </div>
        <p className="text-[10px] text-slate-400 truncate">{message.content}</p>
      </div>
      {isUnread && <div className="w-2 h-2 rounded-full bg-cyan-400 flex-shrink-0" />}
    </motion.div>
  );
}

interface AuditItemProps {
  action: string;
  target: string;
  user: string;
  time: string;
}

function AuditItem({ action, target, user, time }: AuditItemProps) {
  return (
    <motion.div
      variants={staggerItem}
      className="flex items-center gap-2 py-1.5 border-b border-slate-800/50 last:border-0"
    >
      <div className="w-1 h-1 rounded-full bg-cyan-500" />
      <span className="text-[10px] text-slate-500 font-mono w-12">{time}</span>
      <span className="text-[10px] text-cyan-400">{action}</span>
      <span className="text-[10px] text-slate-400">{target}</span>
      <span className="text-[10px] text-slate-600 ml-auto">by {user}</span>
    </motion.div>
  );
}

export default function ReportingDashboard() {
  const [, navigate] = useLocation();
  const currentUser = useStore((state) => state.currentUser);
  const logout = useStore((state) => state.logout);
  const { isSandbox } = useMode();
  const [loading, setLoading] = useState(true);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('overview');

  const [liveData, setLiveData] = useState({
    deliveries: [] as typeof demoDeliveries,
    emergencies: [] as typeof demoEmergencies,
    messages: [] as typeof demoMessages,
    stats: { activeStands: 0, openIssues: 0, pendingDeliveries: 0, onlineUsers: 0, responseTime: '—', satisfaction: '—' }
  });

  const deliveries = useSandboxData(liveData.deliveries, demoDeliveries);
  const emergencies = useSandboxData(liveData.emergencies, demoEmergencies);
  const messages = useSandboxData(liveData.messages, demoMessages);
  const stats = useSandboxData(liveData.stats, demoStats);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [deliveriesRes, emergenciesRes, messagesRes, standsRes] = await Promise.all([
        fetch('/api/deliveries'),
        fetch('/api/emergency-alerts/active'),
        fetch('/api/messages'),
        fetch('/api/stands')
      ]);
      
      if (deliveriesRes.ok) {
        const data = await deliveriesRes.json();
        const mapped = data.map((d: any) => ({
          id: d.id,
          standId: d.standId,
          standName: d.standId || 'Unknown Stand',
          items: d.description || d.items,
          status: d.status?.toLowerCase().replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '') || 'requested',
          eta: d.eta ? `${d.eta}m` : null,
          requestedBy: d.requesterId,
          requestedAt: d.createdAt,
          driver: d.assignedTo
        }));
        setLiveData(prev => ({ ...prev, deliveries: mapped }));
      }
      if (emergenciesRes.ok) {
        const data = await emergenciesRes.json();
        const mapped = data.map((e: any) => ({
          id: e.id,
          type: e.alertType || e.emergencyType,
          location: e.location || e.standId || 'Unknown',
          description: e.description,
          status: e.isActive ? 'active' : (e.acknowledgedAt ? 'responding' : 'resolved'),
          priority: e.escalationLevel === 'Level3' || e.escalationLevel === 'Level4' ? 'high' : 'medium',
          reportedBy: e.reporterId,
          reportedAt: e.createdAt,
          assignedTo: e.assignedTeam
        }));
        setLiveData(prev => ({ ...prev, emergencies: mapped }));
      }
      if (messagesRes.ok) {
        const data = await messagesRes.json();
        const mapped = data.slice(0, 10).map((m: any) => ({
          id: m.id,
          from: m.senderId || 'Unknown',
          fromRole: 'Staff',
          to: 'Command',
          content: m.content,
          timestamp: m.createdAt,
          status: 'read',
          thread: m.id
        }));
        setLiveData(prev => ({ ...prev, messages: mapped }));
      }
      if (standsRes.ok) {
        const data = await standsRes.json();
        const activeStands = data.filter((s: any) => s.status === 'Open').length;
        setLiveData(prev => ({ 
          ...prev, 
          stats: { 
            ...prev.stats, 
            activeStands,
            onlineUsers: Math.floor(activeStands * 3.2)
          } 
        }));
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  }

  const activeDeliveries = deliveries.filter(d => d.status !== 'delivered');
  const activeEmergencies = emergencies.filter(e => e.status === 'active' || e.status === 'responding');
  const unreadMessages = messages.filter(m => m.status === 'unread');

  const navItems = [
    { id: 'overview', label: 'Overview', icon: <Layers className="h-4 w-4" /> },
    { id: 'deliveries', label: 'Deliveries', icon: <Truck className="h-4 w-4" />, badge: activeDeliveries.length },
    { id: 'emergencies', label: 'Emergencies', icon: <AlertTriangle className="h-4 w-4" />, badge: activeEmergencies.length },
    { id: 'messages', label: 'Messages', icon: <MessageSquare className="h-4 w-4" />, badge: unreadMessages.length },
    { id: 'audit', label: 'Audit Trail', icon: <History className="h-4 w-4" /> },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-slate-950/95 backdrop-blur-md border-b border-cyan-500/20 px-3 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden p-1.5"
              onClick={() => setMobileNavOpen(!mobileNavOpen)}
              data-testid="button-mobile-nav"
            >
              {mobileNavOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-teal-600 flex items-center justify-center shadow-lg shadow-cyan-500/30">
                <BarChart3 className="h-4 w-4 text-white" />
              </div>
              <div>
                <h1 className="text-sm font-bold text-cyan-400">Orby Reports</h1>
                <p className="text-[10px] text-slate-500 hidden sm:block">Nissan Stadium Operations</p>
              </div>
            </div>
          </div>

          {/* Quick Stats Bar */}
          <div className="hidden md:flex items-center gap-2">
            <StatBadge 
              value={stats.activeStands} 
              label="Stands" 
              icon={<Target className="h-3 w-3" />}
              variant="success"
            />
            <StatBadge 
              value={activeDeliveries.length} 
              label="Active" 
              icon={<Truck className="h-3 w-3" />}
              variant={activeDeliveries.length > 5 ? 'warning' : 'default'}
            />
            <StatBadge 
              value={activeEmergencies.length} 
              label="Alerts" 
              icon={<AlertTriangle className="h-3 w-3" />}
              variant={activeEmergencies.length > 0 ? 'danger' : 'default'}
            />
          </div>

          <div className="flex items-center gap-2">
            <SandboxStatusCompact />
            <Button
              variant="ghost"
              size="sm"
              onClick={loadData}
              className="p-1.5 text-slate-400 hover:text-cyan-400"
              data-testid="button-refresh"
            >
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { logout(); navigate('/'); }}
              className="p-1.5 text-slate-400 hover:text-white"
              data-testid="button-logout"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Mobile Quick Stats */}
        <div className="flex md:hidden items-center gap-2 mt-2 overflow-x-auto pb-1">
          <StatBadge value={stats.activeStands} label="Stands" variant="success" />
          <StatBadge value={activeDeliveries.length} label="Deliveries" variant={activeDeliveries.length > 5 ? 'warning' : 'default'} />
          <StatBadge value={activeEmergencies.length} label="Alerts" variant={activeEmergencies.length > 0 ? 'danger' : 'default'} />
          <StatBadge value={unreadMessages.length} label="Unread" />
        </div>
      </header>

      <div className="flex">
        {/* Desktop Sidebar Nav */}
        <aside className="hidden md:flex flex-col w-14 hover:w-48 transition-all duration-300 bg-slate-900/50 border-r border-slate-800/50 sticky top-[60px] h-[calc(100vh-60px)] overflow-hidden group">
          <nav className="flex-1 py-3 px-2 space-y-1">
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-2 py-2 rounded-lg transition-all",
                  activeSection === item.id
                    ? "bg-cyan-500/20 text-cyan-300"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                )}
                data-testid={`nav-${item.id}`}
              >
                {item.icon}
                <span className="text-sm font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                  {item.label}
                </span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className={cn(
                    "ml-auto text-[10px] font-bold px-1.5 rounded-full",
                    item.id === 'emergencies' ? "bg-red-500 text-white" : "bg-cyan-500/30 text-cyan-300"
                  )}>
                    {item.badge}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </aside>

        {/* Mobile Nav Overlay */}
        <AnimatePresence>
          {mobileNavOpen && (
            <motion.div
              initial={{ opacity: 0, x: -200 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -200 }}
              className="fixed inset-0 z-40 md:hidden"
            >
              <div className="absolute inset-0 bg-black/50" onClick={() => setMobileNavOpen(false)} />
              <div className="absolute left-0 top-0 bottom-0 w-64 bg-slate-900 border-r border-slate-800 p-4">
                <h2 className="text-lg font-bold text-cyan-400 mb-4">Navigation</h2>
                <nav className="space-y-1">
                  {navItems.map(item => (
                    <button
                      key={item.id}
                      onClick={() => { setActiveSection(item.id); setMobileNavOpen(false); }}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all",
                        activeSection === item.id
                          ? "bg-cyan-500/20 text-cyan-300"
                          : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                      )}
                    >
                      {item.icon}
                      <span className="text-sm font-medium">{item.label}</span>
                      {item.badge !== undefined && item.badge > 0 && (
                        <span className={cn(
                          "ml-auto text-xs font-bold px-2 py-0.5 rounded-full",
                          item.id === 'emergencies' ? "bg-red-500 text-white" : "bg-cyan-500/30 text-cyan-300"
                        )}>
                          {item.badge}
                        </span>
                      )}
                    </button>
                  ))}
                </nav>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content - Puzzle Grid */}
        <main className="flex-1 p-3 md:p-4 overflow-x-hidden">
          <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 auto-rows-min"
          >
            {/* Overview Section */}
            {(activeSection === 'overview' || activeSection === 'deliveries') && (
              <PuzzleTile
                title="Active Deliveries"
                icon={<Truck className="h-4 w-4" />}
                count={activeDeliveries.length}
                trend={activeDeliveries.length > 3 ? 'up' : 'stable'}
                status={activeDeliveries.length > 5 ? 'warning' : 'good'}
                className="md:col-span-2 lg:col-span-2"
              >
                <Accordion type="single" collapsible className="space-y-1">
                  <AccordionItem value="in-transit" className="border-0">
                    <AccordionTrigger className="py-1 text-xs text-slate-400 hover:text-cyan-300 hover:no-underline">
                      <div className="flex items-center gap-2">
                        <Truck className="h-3 w-3" />
                        <span>In Transit ({deliveries.filter(d => d.status === 'on_the_way').length})</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <motion.div variants={staggerContainer} className="space-y-1.5 pt-1">
                        {deliveries.filter(d => d.status === 'on_the_way').map(d => (
                          <DeliveryItem key={d.id} delivery={d} />
                        ))}
                        {deliveries.filter(d => d.status === 'on_the_way').length === 0 && (
                          <p className="text-[10px] text-slate-600 text-center py-2">No deliveries in transit</p>
                        )}
                      </motion.div>
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="picking" className="border-0">
                    <AccordionTrigger className="py-1 text-xs text-slate-400 hover:text-cyan-300 hover:no-underline">
                      <div className="flex items-center gap-2">
                        <Package className="h-3 w-3" />
                        <span>Picking ({deliveries.filter(d => d.status === 'picking').length})</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <motion.div variants={staggerContainer} className="space-y-1.5 pt-1">
                        {deliveries.filter(d => d.status === 'picking').map(d => (
                          <DeliveryItem key={d.id} delivery={d} />
                        ))}
                        {deliveries.filter(d => d.status === 'picking').length === 0 && (
                          <p className="text-[10px] text-slate-600 text-center py-2">No items being picked</p>
                        )}
                      </motion.div>
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="requested" className="border-0">
                    <AccordionTrigger className="py-1 text-xs text-slate-400 hover:text-cyan-300 hover:no-underline">
                      <div className="flex items-center gap-2">
                        <Clock className="h-3 w-3" />
                        <span>Requested ({deliveries.filter(d => d.status === 'requested').length})</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <motion.div variants={staggerContainer} className="space-y-1.5 pt-1">
                        {deliveries.filter(d => d.status === 'requested').map(d => (
                          <DeliveryItem key={d.id} delivery={d} />
                        ))}
                        {deliveries.filter(d => d.status === 'requested').length === 0 && (
                          <p className="text-[10px] text-slate-600 text-center py-2">No pending requests</p>
                        )}
                      </motion.div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </PuzzleTile>
            )}

            {/* Emergencies */}
            {(activeSection === 'overview' || activeSection === 'emergencies') && (
              <PuzzleTile
                title="Emergency Alerts"
                icon={<AlertTriangle className="h-4 w-4" />}
                count={activeEmergencies.length}
                status={activeEmergencies.length > 0 ? 'critical' : 'good'}
                className={activeEmergencies.length > 0 ? "md:col-span-2 row-span-1" : ""}
              >
                <motion.div variants={staggerContainer} className="space-y-2">
                  {emergencies.map(e => (
                    <EmergencyItem key={e.id} emergency={e} />
                  ))}
                  {emergencies.length === 0 && (
                    <div className="text-center py-4">
                      <CheckCircle2 className="h-8 w-8 text-emerald-500/50 mx-auto mb-2" />
                      <p className="text-xs text-slate-500">All clear - No active incidents</p>
                    </div>
                  )}
                </motion.div>
              </PuzzleTile>
            )}

            {/* Messages */}
            {(activeSection === 'overview' || activeSection === 'messages') && (
              <PuzzleTile
                title="Recent Messages"
                icon={<MessageSquare className="h-4 w-4" />}
                count={unreadMessages.length}
                status={unreadMessages.length > 3 ? 'warning' : 'good'}
                className="lg:col-span-2"
              >
                <motion.div variants={staggerContainer} className="space-y-1.5 max-h-48 overflow-y-auto">
                  {messages.slice(0, 5).map(m => (
                    <MessageItem key={m.id} message={m} />
                  ))}
                  {messages.length === 0 && (
                    <p className="text-[10px] text-slate-600 text-center py-4">No messages</p>
                  )}
                </motion.div>
              </PuzzleTile>
            )}

            {/* SLA Performance */}
            {activeSection === 'overview' && (
              <PuzzleTile
                title="Response SLA"
                icon={<Timer className="h-4 w-4" />}
                compact
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-500">Avg Response</span>
                    <span className="text-sm font-bold text-emerald-400">{stats.responseTime || '2.3m'}</span>
                  </div>
                  <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full w-[85%] bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full" />
                  </div>
                  <div className="flex justify-between text-[9px] text-slate-600">
                    <span>Target: 3m</span>
                    <span className="text-emerald-400">On Track</span>
                  </div>
                </div>
              </PuzzleTile>
            )}

            {/* Department Summary */}
            {activeSection === 'overview' && (
              <PuzzleTile
                title="Departments"
                icon={<Users className="h-4 w-4" />}
                compact
              >
                <div className="grid grid-cols-5 gap-1">
                  {Object.entries(departmentIcons).map(([dept, icon]) => {
                    const deptDeliveries = deliveries.filter(d => 
                      d.items?.toLowerCase().includes(dept.toLowerCase()) || 
                      (dept === 'Warehouse' && d.items)
                    );
                    return (
                      <div 
                        key={dept} 
                        className={cn(
                          "flex flex-col items-center p-1.5 rounded-lg border transition-all",
                          departmentColors[dept] || "border-slate-700/30 bg-slate-800/30"
                        )}
                      >
                        {icon}
                        <span className="text-[8px] text-slate-500 mt-0.5">{deptDeliveries.length}</span>
                      </div>
                    );
                  })}
                </div>
              </PuzzleTile>
            )}

            {/* Audit Trail */}
            {(activeSection === 'overview' || activeSection === 'audit') && (
              <PuzzleTile
                title="Audit Trail"
                icon={<History className="h-4 w-4" />}
                className="md:col-span-2 lg:col-span-2 xl:col-span-2"
              >
                <div className="space-y-0.5 max-h-48 overflow-y-auto">
                  <AuditItem action="Delivery" target="Stand 103" user="Sharrod" time="2m" />
                  <AuditItem action="Alert Ack" target="Medical" user="David" time="4m" />
                  <AuditItem action="Message" target="Kitchen" user="James R." time="8m" />
                  <AuditItem action="Status" target="Stand 202" user="Mike B." time="12m" />
                  <AuditItem action="Delivery" target="Stand 201" user="AJ" time="25m" />
                  <AuditItem action="Login" target="System" user="Emily D." time="45m" />
                </div>
              </PuzzleTile>
            )}

            {/* Quick Stats Grid */}
            {activeSection === 'overview' && (
              <>
                <PuzzleTile title="Online Staff" icon={<Users className="h-4 w-4" />} count={stats.onlineUsers || 156} trend="stable" compact>
                  <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full w-[92%] bg-gradient-to-r from-cyan-500 to-teal-500 rounded-full" />
                  </div>
                </PuzzleTile>
                
                <PuzzleTile title="Satisfaction" icon={<TrendingUp className="h-4 w-4" />} count={stats.satisfaction || '94%'} trend="up" compact>
                  <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full w-[94%] bg-gradient-to-r from-emerald-500 to-green-400 rounded-full" />
                  </div>
                </PuzzleTile>
              </>
            )}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
