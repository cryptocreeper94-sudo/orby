import { useStore } from "@/lib/mockData";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LogOut, Package, Users, ClipboardCheck, FileBarChart, Menu, MessageSquare, LayoutDashboard, Map, Settings, Shield, Activity, Server, Database, Bell, HelpCircle, BookOpen, Wrench } from "lucide-react";
import { useLocation, Link } from "wouter";
import { TutorialHelpButton } from "@/components/TutorialCoach";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { StaffingGrid } from "@/components/StaffingGrid";
import { useEffect, useState } from "react";
import { Notepad } from "@/components/Notepad";
import { InteractiveMap } from "@/components/InteractiveMap";
import { motion, AnimatePresence } from "framer-motion";
import { AnimatedBackground, StatCard, PageHeader } from "@/components/ui/premium";
import ComplianceAlertPanel from '@/components/ComplianceAlertPanel';
import { GlobalModeBar } from '@/components/GlobalModeBar';
import { HRAdminTour } from '@/components/HRAdminTour';
import { PersonalizedWelcomeTour } from '@/components/PersonalizedWelcomeTour';
import { LayoutShell, BentoCard, CarouselRail, AccordionStack } from "@/components/ui/bento";

export default function AdminDashboard() {
  const logout = useStore((state) => state.logout);
  const currentUser = useStore((state) => state.currentUser);
  const [, setLocation] = useLocation();
  const stands = useStore((state) => state.stands);
  const fetchAll = useStore((state) => state.fetchAll);
  const [activeTab, setActiveTab] = useState<'grid' | 'list' | 'reports' | 'map'>('grid');

  useEffect(() => {
    if (stands.length === 0) {
      fetchAll();
    }
  }, [stands.length, fetchAll]);

  const handleLogout = () => {
    logout();
    setLocation("/");
  };

  const supervisors = [
    { id: '1', name: currentUser?.name ? `${currentUser.name} (You)` : 'You' },
    { id: '2', name: 'Mike Smith' },
    { id: '3', name: 'Sarah Johnson' },
    { id: '4', name: 'Chris Williams' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Open': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'Closed': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  const systemMetricItems = [
    <div key="open-stands" className="w-[140px] h-[80px]" data-testid="metric-open-stands">
      <StatCard
        icon={<Package className="h-5 w-5" />}
        label="Open Stands"
        value={stands.filter(s => s.status === 'Open').length}
        color="green"
      />
    </div>,
    <div key="staff-active" className="w-[140px] h-[80px]" data-testid="metric-staff-active">
      <StatCard
        icon={<Users className="h-5 w-5" />}
        label="Staff Active"
        value={42}
        color="blue"
      />
    </div>,
    <div key="pending-audits" className="w-[140px] h-[80px]" data-testid="metric-pending-audits">
      <StatCard
        icon={<ClipboardCheck className="h-5 w-5" />}
        label="Pending Audits"
        value={3}
        color="amber"
      />
    </div>,
    <div key="total-revenue" className="w-[140px] h-[80px]" data-testid="metric-total-revenue">
      <StatCard
        icon={<FileBarChart className="h-5 w-5" />}
        label="Total Revenue"
        value="$12,450"
        color="purple"
      />
    </div>,
    <div key="server-status" className="w-[140px] h-[80px]" data-testid="metric-server-status">
      <StatCard
        icon={<Server className="h-5 w-5" />}
        label="Server Status"
        value="Online"
        color="green"
      />
    </div>,
    <div key="db-connections" className="w-[140px] h-[80px]" data-testid="metric-db-connections">
      <StatCard
        icon={<Database className="h-5 w-5" />}
        label="DB Connections"
        value={24}
        color="blue"
      />
    </div>,
  ];

  const settingsItems = [
    <div key="system-config" className="p-3 bg-white/5 rounded-lg border border-white/10 w-[180px] h-[100px]" data-testid="setting-system-config">
      <div className="flex items-center gap-2 mb-2">
        <Settings className="h-4 w-4 text-cyan-400" />
        <span className="text-sm font-medium text-slate-200">System Config</span>
      </div>
      <p className="text-xs text-slate-400">Configure system preferences</p>
    </div>,
    <div key="notifications" className="p-3 bg-white/5 rounded-lg border border-white/10 w-[180px] h-[100px]" data-testid="setting-notifications">
      <div className="flex items-center gap-2 mb-2">
        <Bell className="h-4 w-4 text-amber-400" />
        <span className="text-sm font-medium text-slate-200">Notifications</span>
      </div>
      <p className="text-xs text-slate-400">Manage alert settings</p>
    </div>,
    <div key="security" className="p-3 bg-white/5 rounded-lg border border-white/10 w-[180px] h-[100px]" data-testid="setting-security">
      <div className="flex items-center gap-2 mb-2">
        <Shield className="h-4 w-4 text-emerald-400" />
        <span className="text-sm font-medium text-slate-200">Security</span>
      </div>
      <p className="text-xs text-slate-400">Access control settings</p>
    </div>,
  ];

  const adminToolsAccordionItems = [
    {
      title: "System Diagnostics",
      content: (
        <div className="space-y-2" data-testid="admin-tool-diagnostics">
          <Button variant="ghost" size="sm" className="w-full justify-start text-slate-300 hover:text-white">
            <Wrench className="h-4 w-4 mr-2" /> Run Health Check
          </Button>
          <Button variant="ghost" size="sm" className="w-full justify-start text-slate-300 hover:text-white">
            <Database className="h-4 w-4 mr-2" /> Database Status
          </Button>
        </div>
      ),
    },
    {
      title: "Documentation",
      content: (
        <div className="space-y-2" data-testid="admin-tool-docs">
          <Button variant="ghost" size="sm" className="w-full justify-start text-slate-300 hover:text-white">
            <BookOpen className="h-4 w-4 mr-2" /> Admin Guide
          </Button>
          <Button variant="ghost" size="sm" className="w-full justify-start text-slate-300 hover:text-white">
            <HelpCircle className="h-4 w-4 mr-2" /> FAQ
          </Button>
        </div>
      ),
    },
    {
      title: "Quick Actions",
      content: (
        <div className="space-y-2" data-testid="admin-tool-actions">
          <Link href="/roster-builder">
            <Button variant="ghost" size="sm" className="w-full justify-start text-slate-300 hover:text-white">
              <Users className="h-4 w-4 mr-2" /> Roster Builder
            </Button>
          </Link>
          <Button variant="ghost" size="sm" className="w-full justify-start text-slate-300 hover:text-white">
            <FileBarChart className="h-4 w-4 mr-2" /> Export Reports
          </Button>
        </div>
      ),
    },
  ];

  const systemLogEntries = [
    { time: "12:45", message: "User login: admin@orby.io", type: "info" },
    { time: "12:42", message: "Stand 5 status: Open", type: "success" },
    { time: "12:38", message: "Inventory sync completed", type: "info" },
    { time: "12:30", message: "Backup scheduled", type: "warning" },
  ];

  return (
    <AnimatedBackground>
      <HRAdminTour />
      <PersonalizedWelcomeTour />
      <GlobalModeBar />
      <div className="min-h-screen pb-20" data-testid="admin-dashboard">
        <PageHeader
          title="Admin Control"
          subtitle="System administration dashboard"
          icon={<Shield className="h-5 w-5" />}
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
                  <nav className="grid gap-6 text-lg font-medium pt-8">
                    <div className="flex items-center gap-2 text-lg font-semibold text-cyan-400">
                      <Package className="h-6 w-6" />
                      Orby Admin
                    </div>
                    <Link href="#" className="flex items-center gap-4 px-2.5 text-white hover:text-cyan-400">
                      <LayoutDashboard className="h-5 w-5" />
                      Dashboard
                    </Link>
                    <Link href="#" className="flex items-center gap-4 px-2.5 text-slate-400 hover:text-white">
                      <Users className="h-5 w-5" />
                      Roster
                    </Link>
                    <Link href="/messages" className="flex items-center gap-4 px-2.5 text-slate-400 hover:text-white">
                      <MessageSquare className="h-5 w-5" />
                      Messages
                    </Link>
                  </nav>
                </SheetContent>
              </Sheet>
              <Link href="/messages">
                <Button variant="ghost" size="icon" className="text-slate-300 hover:bg-white/10" data-testid="button-messages">
                  <MessageSquare className="h-5 w-5" />
                </Button>
              </Link>
              <Button variant="ghost" size="icon" onClick={handleLogout} className="text-slate-300 hover:bg-white/10" data-testid="button-logout">
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          }
        />

        <main className="p-4 sm:px-6 space-y-4 max-w-6xl mx-auto">
          <ComplianceAlertPanel 
            userId={currentUser?.id} 
            userName={currentUser?.name} 
            isManager={true}
          />
          
          <LayoutShell className="gap-3">
            <BentoCard span={12} className="!p-2" data-testid="bento-hero-metrics">
              <CarouselRail 
                items={systemMetricItems} 
                title="System Metrics"
                showDots
                autoplay
              />
            </BentoCard>

            <BentoCard span={6} title="User Management" data-testid="bento-user-management">
              <div className="space-y-2">
                <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
                  {[
                    { id: 'grid', label: 'Staffing Grid', icon: LayoutDashboard },
                    { id: 'list', label: 'List View', icon: Activity },
                    { id: 'reports', label: 'Reports', icon: FileBarChart },
                    { id: 'map', label: 'Map', icon: Map },
                  ].map((tab) => (
                    <motion.button
                      key={tab.id}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all whitespace-nowrap ${
                        activeTab === tab.id 
                          ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/25' 
                          : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10'
                      }`}
                      data-testid={`tab-${tab.id}`}
                    >
                      <tab.icon className="h-3 w-3" />
                      {tab.label}
                    </motion.button>
                  ))}
                </div>

                <AnimatePresence mode="wait">
                  {activeTab === 'grid' && (
                    <motion.div
                      key="grid"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="max-h-[280px] overflow-y-auto"
                      data-testid="content-grid"
                    >
                      <StaffingGrid />
                    </motion.div>
                  )}

                  {activeTab === 'list' && (
                    <motion.div
                      key="list"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="max-h-[280px] overflow-y-auto space-y-1"
                      data-testid="content-list"
                    >
                      {stands.map((stand, idx) => (
                        <motion.div 
                          key={stand.id} 
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.03 }}
                          className="flex items-center justify-between p-2 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors"
                          data-testid={`stand-row-${stand.id}`}
                        >
                          <div className="flex flex-col">
                            <span className="font-medium text-xs text-slate-200">{stand.name}</span>
                            <span className="text-[10px] text-slate-500">
                              Supervisor: {stand.supervisorId ? 'Assigned' : 'Unassigned'}
                            </span>
                          </div>
                          <Badge className={`border text-[10px] px-1.5 py-0.5 ${getStatusColor(stand.status)}`}>
                            {stand.status}
                          </Badge>
                        </motion.div>
                      ))}
                    </motion.div>
                  )}

                  {activeTab === 'reports' && (
                    <motion.div
                      key="reports"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="grid grid-cols-2 gap-2"
                      data-testid="content-reports"
                    >
                      <Link href="/roster-builder">
                        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                          <div className="cursor-pointer hover:border-cyan-500/30 transition-colors h-full p-3 bg-white/5 rounded-lg border border-white/10 flex flex-col items-center justify-center gap-1">
                            <Users className="h-5 w-5 text-cyan-400" />
                            <span className="text-xs font-medium text-slate-200">Roster Builder</span>
                          </div>
                        </motion.div>
                      </Link>
                      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        <div className="cursor-pointer hover:border-cyan-500/30 transition-colors h-full p-3 bg-white/5 rounded-lg border border-white/10 flex flex-col items-center justify-center gap-1">
                          <FileBarChart className="h-5 w-5 text-cyan-400" />
                          <span className="text-xs font-medium text-slate-200">Export CSV</span>
                        </div>
                      </motion.div>
                    </motion.div>
                  )}

                  {activeTab === 'map' && (
                    <motion.div
                      key="map"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="h-[280px] rounded-lg overflow-hidden border border-white/10"
                      data-testid="content-map"
                    >
                      <InteractiveMap 
                        isManager={true}
                        supervisors={supervisors}
                        onSectionAssign={(section) => console.log('Section assigned:', section)}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </BentoCard>

            <BentoCard span={6} title="System Status" data-testid="bento-system-status">
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20" data-testid="status-api">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-xs text-emerald-400 font-medium">API</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">Response: 45ms</p>
                  </div>
                  <div className="p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20" data-testid="status-database">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-xs text-emerald-400 font-medium">Database</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">24 connections</p>
                  </div>
                  <div className="p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20" data-testid="status-cache">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-xs text-emerald-400 font-medium">Cache</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">Hit rate: 94%</p>
                  </div>
                  <div className="p-2 bg-amber-500/10 rounded-lg border border-amber-500/20" data-testid="status-storage">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-amber-400" />
                      <span className="text-xs text-amber-400 font-medium">Storage</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">78% used</p>
                  </div>
                </div>
                <div className="p-2 bg-white/5 rounded-lg border border-white/10" data-testid="status-uptime">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-300">System Uptime</span>
                    <span className="text-xs font-mono text-emerald-400">99.97%</span>
                  </div>
                  <div className="mt-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full w-[99.97%] bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full" />
                  </div>
                </div>
              </div>
            </BentoCard>

            <BentoCard span={8} className="!p-2" data-testid="bento-settings-carousel">
              <CarouselRail 
                items={settingsItems}
                title="Quick Settings"
              />
            </BentoCard>

            <BentoCard span={4} title="System Logs" data-testid="bento-system-logs">
              <div className="space-y-1.5 max-h-[140px] overflow-y-auto">
                {systemLogEntries.map((log, idx) => (
                  <div 
                    key={idx} 
                    className="flex items-start gap-2 text-[10px] p-1.5 bg-white/5 rounded border border-white/5"
                    data-testid={`log-entry-${idx}`}
                  >
                    <span className="text-slate-500 font-mono shrink-0">{log.time}</span>
                    <span className={`${
                      log.type === 'success' ? 'text-emerald-400' : 
                      log.type === 'warning' ? 'text-amber-400' : 'text-slate-400'
                    }`}>
                      {log.message}
                    </span>
                  </div>
                ))}
              </div>
            </BentoCard>

            <BentoCard span={12} data-testid="bento-admin-tools">
              <AccordionStack 
                items={adminToolsAccordionItems}
                defaultOpen={[0]}
              />
            </BentoCard>
          </LayoutShell>

          <Notepad storageKey="admin-notes" />
        </main>
        
        <TutorialHelpButton page="admin" />
      </div>
    </AnimatedBackground>
  );
}
