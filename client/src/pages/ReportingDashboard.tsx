import { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'wouter';
import { useStore } from '@/lib/mockData';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useMode } from '@/lib/ModeContext';
import { SandboxStatusCompact } from '@/components/SandboxBanner';
import { useSandboxData } from '@/lib/useSandboxData';
import { demoDeliveries, demoEmergencies, demoMessages, demoStats } from '@/lib/demoFixtures';
import {
  LogOut, RefreshCw, Package, Utensils, Beer, Monitor,
  AlertTriangle, CheckCircle2, Clock, Users, Truck,
  Activity, MessageSquare, FileText, BarChart3, TrendingUp, Target,
  ArrowUpRight, ArrowDownRight, Minus, Layers, History, ClipboardList
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { LayoutShell, BentoCard, CarouselRail, AccordionStack } from "@/components/ui/bento";

const departmentIcons: Record<string, React.ReactNode> = {
  Warehouse: <Package className="h-4 w-4" />,
  Kitchen: <Utensils className="h-4 w-4" />,
  Bar: <Beer className="h-4 w-4" />,
  IT: <Monitor className="h-4 w-4" />,
  Operations: <Activity className="h-4 w-4" />,
  HR: <Users className="h-4 w-4" />,
};

const statusColors: Record<string, { bg: string; text: string }> = {
  requested: { bg: 'bg-amber-500/20', text: 'text-amber-300' },
  picking: { bg: 'bg-blue-500/20', text: 'text-blue-300' },
  on_the_way: { bg: 'bg-green-500/20', text: 'text-green-300' },
  delivered: { bg: 'bg-slate-500/20', text: 'text-slate-400' },
  active: { bg: 'bg-red-500/20', text: 'text-red-300' },
  responding: { bg: 'bg-amber-500/20', text: 'text-amber-300' },
};

function formatTimeAgo(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

export default function ReportingDashboard() {
  const [, navigate] = useLocation();
  const currentUser = useStore((state) => state.currentUser);
  const logout = useStore((state) => state.logout);
  const { isSandbox } = useMode();
  const [loading, setLoading] = useState(true);

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

  const reportMetrics = [
    { label: "Active Stands", value: stats.activeStands, icon: <Target className="h-4 w-4 text-emerald-400" />, trend: 'up' as const },
    { label: "Deliveries", value: activeDeliveries.length, icon: <Truck className="h-4 w-4 text-blue-400" />, trend: activeDeliveries.length > 3 ? 'up' as const : 'stable' as const },
    { label: "Active Alerts", value: activeEmergencies.length, icon: <AlertTriangle className="h-4 w-4 text-red-400" />, trend: activeEmergencies.length > 0 ? 'up' as const : 'stable' as const },
    { label: "Users Online", value: stats.onlineUsers, icon: <Users className="h-4 w-4 text-cyan-400" />, trend: 'stable' as const },
    { label: "Unread Messages", value: unreadMessages.length, icon: <MessageSquare className="h-4 w-4 text-purple-400" />, trend: 'stable' as const },
  ];

  const trendIcon = {
    up: <ArrowUpRight className="h-3 w-3 text-emerald-400" />,
    down: <ArrowDownRight className="h-3 w-3 text-red-400" />,
    stable: <Minus className="h-3 w-3 text-slate-400" />,
  };

  const recentReports = [
    { id: "1", title: "End of Day Report", type: "Daily", date: "Today", status: "Complete" },
    { id: "2", title: "Inventory Count", type: "Weekly", date: "Yesterday", status: "Complete" },
    { id: "3", title: "Incident Report #42", type: "Incident", date: "2 days ago", status: "Review" },
    { id: "4", title: "Staff Performance", type: "Monthly", date: "Dec 1", status: "Draft" },
  ];

  const reportTemplates = [
    { id: "1", name: "Daily Ops Summary", icon: <FileText className="h-4 w-4" />, color: "cyan" },
    { id: "2", name: "Incident Report", icon: <AlertTriangle className="h-4 w-4" />, color: "amber" },
    { id: "3", name: "Inventory Audit", icon: <ClipboardList className="h-4 w-4" />, color: "purple" },
    { id: "4", name: "Staff Schedule", icon: <Users className="h-4 w-4" />, color: "green" },
    { id: "5", name: "Revenue Report", icon: <TrendingUp className="h-4 w-4" />, color: "blue" },
    { id: "6", name: "Activity Log", icon: <History className="h-4 w-4" />, color: "slate" },
  ];

  const documentationItems = [
    {
      title: "Report Guidelines",
      content: (
        <ul className="space-y-1 text-xs">
          <li>• Submit daily reports before 11 PM</li>
          <li>• Include all incidents regardless of severity</li>
          <li>• Use standard templates for consistency</li>
          <li>• Attach photos when applicable</li>
        </ul>
      )
    },
    {
      title: "Data Entry Standards",
      content: (
        <ul className="space-y-1 text-xs">
          <li>• Use 24-hour time format</li>
          <li>• Enter monetary values without symbols</li>
          <li>• Double-check stand IDs before submitting</li>
          <li>• Include employee badges in records</li>
        </ul>
      )
    },
    {
      title: "Export Options",
      content: (
        <p className="text-xs">
          Reports can be exported as PDF, CSV, or Excel. Use the export button 
          in the top-right corner of any report view. Batch exports are available 
          for date ranges up to 30 days.
        </p>
      )
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950" data-testid="reporting-dashboard">
      <header className="sticky top-0 z-50 bg-slate-950/95 backdrop-blur-md border-b border-cyan-500/20 px-3 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-teal-600 flex items-center justify-center shadow-lg shadow-cyan-500/30">
              <BarChart3 className="h-4 w-4 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-cyan-400" data-testid="text-title">Orby Reports</h1>
              <p className="text-[10px] text-slate-500 hidden sm:block">Nissan Stadium Operations</p>
            </div>
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
      </header>

      <main className="p-3 max-w-7xl mx-auto">
        <LayoutShell className="gap-3">
          <BentoCard span={12} title="Report Metrics" data-testid="card-metrics">
            <CarouselRail
              items={reportMetrics.map((metric, idx) => (
                <div key={idx} className="w-36 p-3 bg-slate-800/50 rounded-lg border border-slate-700/50" data-testid={`metric-${metric.label.toLowerCase().replace(/\s+/g, '-')}`}>
                  <div className="flex items-center justify-between mb-1">
                    {metric.icon}
                    {trendIcon[metric.trend]}
                  </div>
                  <p className="text-lg font-bold text-white">{metric.value}</p>
                  <p className="text-xs text-slate-400">{metric.label}</p>
                </div>
              ))}
              showDots
            />
          </BentoCard>

          <BentoCard span={6} title="Recent Reports" data-testid="card-recent-reports">
            <CarouselRail
              items={recentReports.map((report) => (
                <div key={report.id} className="w-44 p-3 bg-slate-800/50 rounded-lg border border-slate-700/50" data-testid={`report-${report.id}`}>
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline" className="text-[9px] px-1.5">{report.type}</Badge>
                    <Badge className={cn(
                      "text-[9px] px-1.5",
                      report.status === 'Complete' ? 'bg-green-500/20 text-green-300' :
                      report.status === 'Review' ? 'bg-amber-500/20 text-amber-300' :
                      'bg-slate-500/20 text-slate-300'
                    )}>
                      {report.status}
                    </Badge>
                  </div>
                  <p className="text-sm font-medium text-slate-200 truncate">{report.title}</p>
                  <p className="text-xs text-slate-500 mt-1">{report.date}</p>
                </div>
              ))}
            />
          </BentoCard>

          <BentoCard span={6} title="Templates" data-testid="card-templates">
            <div className="grid grid-cols-3 gap-2">
              {reportTemplates.map((template) => (
                <div 
                  key={template.id} 
                  className={cn(
                    "p-2 rounded-lg border cursor-pointer transition-all hover:scale-105",
                    `bg-${template.color}-500/10 border-${template.color}-500/30 hover:border-${template.color}-400/50`
                  )}
                  data-testid={`template-${template.id}`}
                >
                  <div className={`text-${template.color}-400 mb-1`}>{template.icon}</div>
                  <p className="text-[10px] text-slate-300 truncate">{template.name}</p>
                </div>
              ))}
            </div>
          </BentoCard>

          <BentoCard span={4} title="Active Deliveries" data-testid="card-deliveries">
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {activeDeliveries.slice(0, 4).map((d) => {
                const status = statusColors[d.status] || statusColors.requested;
                return (
                  <div key={d.id} className="flex items-center gap-2 p-2 rounded-lg bg-slate-800/30 border border-slate-700/30" data-testid={`delivery-${d.id}`}>
                    <div className={cn("w-2 h-2 rounded-full", status.bg.replace('/20', ''))} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-slate-200 truncate">{d.standName}</p>
                      <p className="text-[10px] text-slate-500 truncate">{d.items}</p>
                    </div>
                    <Badge variant="outline" className={cn("text-[9px] px-1", status.bg, status.text)}>
                      {d.status.replace('_', ' ')}
                    </Badge>
                  </div>
                );
              })}
              {activeDeliveries.length === 0 && (
                <div className="flex items-center justify-center py-4 text-slate-500 text-xs">
                  <CheckCircle2 className="h-4 w-4 mr-2" /> All deliveries complete
                </div>
              )}
            </div>
          </BentoCard>

          <BentoCard span={4} title="Active Alerts" data-testid="card-alerts">
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {activeEmergencies.slice(0, 4).map((e) => {
                const isActive = e.status === 'active';
                return (
                  <div key={e.id} className={cn(
                    "flex items-center gap-2 p-2 rounded-lg border",
                    isActive ? "border-red-500/50 bg-red-950/30" : "border-amber-500/30 bg-amber-950/20"
                  )} data-testid={`alert-${e.id}`}>
                    <AlertTriangle className={cn("h-4 w-4", isActive ? "text-red-400" : "text-amber-400")} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-slate-200 truncate">{e.type}</p>
                      <p className="text-[10px] text-slate-500">{e.location}</p>
                    </div>
                    <Badge variant="outline" className={cn("text-[9px]", isActive ? "border-red-500/50 text-red-300" : "border-amber-500/50 text-amber-300")}>
                      {e.priority}
                    </Badge>
                  </div>
                );
              })}
              {activeEmergencies.length === 0 && (
                <div className="flex items-center justify-center py-4 text-slate-500 text-xs">
                  <CheckCircle2 className="h-4 w-4 mr-2" /> No active alerts
                </div>
              )}
            </div>
          </BentoCard>

          <BentoCard span={4} title="Recent Messages" data-testid="card-messages">
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {messages.slice(0, 4).map((m) => {
                const isUnread = m.status === 'unread';
                return (
                  <div key={m.id} className={cn(
                    "flex items-start gap-2 p-2 rounded-lg border border-slate-700/30",
                    isUnread ? "bg-cyan-950/20" : "bg-slate-800/20"
                  )} data-testid={`message-${m.id}`}>
                    <div className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold",
                      isUnread ? "bg-cyan-500/30 text-cyan-300" : "bg-slate-700/50 text-slate-400"
                    )}>
                      {m.from.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-medium text-slate-200">{m.from}</span>
                        <span className="text-[10px] text-slate-500">{formatTimeAgo(m.timestamp)}</span>
                      </div>
                      <p className="text-[10px] text-slate-400 truncate">{m.content}</p>
                    </div>
                    {isUnread && <div className="w-2 h-2 rounded-full bg-cyan-400 flex-shrink-0" />}
                  </div>
                );
              })}
            </div>
          </BentoCard>

          <BentoCard span={12} title="Documentation" data-testid="card-documentation">
            <AccordionStack items={documentationItems} />
          </BentoCard>
        </LayoutShell>
      </main>
    </div>
  );
}
