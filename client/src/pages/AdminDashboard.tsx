import { useStore } from "@/lib/mockData";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LogOut, Package, Users, ClipboardCheck, FileBarChart, Menu, MessageSquare, LayoutDashboard, Map, Settings, Shield, Activity } from "lucide-react";
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
import { AnimatedBackground, GlassCard, GlassCardContent, GlassCardHeader, StatCard, PageHeader, GlowButton } from "@/components/ui/premium";
import ComplianceAlertPanel from '@/components/ComplianceAlertPanel';
import { GlobalModeBar } from '@/components/GlobalModeBar';
import { HRAdminTour } from '@/components/HRAdminTour';
import { PersonalizedWelcomeTour } from '@/components/PersonalizedWelcomeTour';

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
    { id: '1', name: 'Jason (You)' },
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

  return (
    <AnimatedBackground>
      <HRAdminTour />
      <PersonalizedWelcomeTour />
      <GlobalModeBar />
      <div className="min-h-screen pb-20">
        <PageHeader
          title="Admin Control"
          subtitle="System administration dashboard"
          icon={<Shield className="h-5 w-5" />}
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
              <Button variant="ghost" size="icon" onClick={handleLogout} className="text-slate-300 hover:bg-white/10">
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
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard
              icon={<Package className="h-5 w-5" />}
              label="Open Stands"
              value={stands.filter(s => s.status === 'Open').length}
              color="green"
            />
            <StatCard
              icon={<Users className="h-5 w-5" />}
              label="Staff Active"
              value={42}
              color="blue"
            />
            <StatCard
              icon={<ClipboardCheck className="h-5 w-5" />}
              label="Pending Audits"
              value={3}
              color="amber"
            />
            <StatCard
              icon={<FileBarChart className="h-5 w-5" />}
              label="Total Revenue"
              value="$12,450"
              color="purple"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
            {[
              { id: 'grid', label: 'Staffing Grid', icon: LayoutDashboard },
              { id: 'list', label: 'List View', icon: Activity },
              { id: 'reports', label: 'Reports', icon: FileBarChart },
              { id: 'map', label: 'Stadium Map', icon: Map },
            ].map((tab) => (
              <motion.button
                key={tab.id}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 transition-all whitespace-nowrap ${
                  activeTab === tab.id 
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/25' 
                    : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10'
                }`}
                data-testid={`tab-${tab.id}`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </motion.button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {activeTab === 'grid' && (
              <motion.div
                key="grid"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <StaffingGrid />
              </motion.div>
            )}

            {activeTab === 'list' && (
              <motion.div
                key="list"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <GlassCard>
                  <GlassCardHeader>
                    <span className="font-bold text-slate-200">Live Stand Status</span>
                  </GlassCardHeader>
                  <GlassCardContent className="space-y-2 pt-0">
                    {stands.map((stand, idx) => (
                      <motion.div 
                        key={stand.id} 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-colors"
                      >
                        <div className="flex flex-col">
                          <span className="font-bold text-sm text-slate-200">{stand.name}</span>
                          <span className="text-xs text-slate-500">
                            Supervisor: {stand.supervisorId ? 'Assigned' : 'Unassigned'}
                          </span>
                        </div>
                        <Badge className={`border ${getStatusColor(stand.status)}`}>
                          {stand.status}
                        </Badge>
                      </motion.div>
                    ))}
                  </GlassCardContent>
                </GlassCard>
              </motion.div>
            )}

            {activeTab === 'reports' && (
              <motion.div
                key="reports"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="grid grid-cols-2 gap-4"
              >
                <Link href="/roster-builder">
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <GlassCard className="cursor-pointer hover:border-cyan-500/30 transition-colors h-full">
                      <GlassCardContent className="p-6 h-24 flex flex-col items-center justify-center gap-2">
                        <Users className="h-6 w-6 text-cyan-400" />
                        <span className="text-sm font-medium text-slate-200">Roster & Group Builder</span>
                      </GlassCardContent>
                    </GlassCard>
                  </motion.div>
                </Link>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <GlassCard className="cursor-pointer hover:border-cyan-500/30 transition-colors h-full">
                    <GlassCardContent className="p-6 h-24 flex flex-col items-center justify-center gap-2">
                      <FileBarChart className="h-6 w-6 text-cyan-400" />
                      <span className="text-sm font-medium text-slate-200">Export Inventory CSV</span>
                    </GlassCardContent>
                  </GlassCard>
                </motion.div>
              </motion.div>
            )}

            {activeTab === 'map' && (
              <motion.div
                key="map"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="h-[500px] rounded-xl overflow-hidden border border-white/10"
              >
                <InteractiveMap 
                  isManager={true}
                  supervisors={supervisors}
                  onSectionAssign={(section) => console.log('Section assigned:', section)}
                />
              </motion.div>
            )}
          </AnimatePresence>

          <Notepad storageKey="admin-notes" />
        </main>
        
        <TutorialHelpButton page="admin" />
      </div>
    </AnimatedBackground>
  );
}
