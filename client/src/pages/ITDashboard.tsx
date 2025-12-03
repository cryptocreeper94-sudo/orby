import { useStore } from "@/lib/mockData";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LogOut, Monitor, Wifi, AlertTriangle, CheckCircle2, MessageSquare, Server, Cpu, Activity, Clock, Shield, Zap } from "lucide-react";
import { useLocation } from "wouter";
import { TutorialHelpButton } from "@/components/TutorialCoach";
import { motion, AnimatePresence } from "framer-motion";
import { AnimatedBackground, GlassCard, GlassCardContent, GlassCardHeader, StatCard, PageHeader } from "@/components/ui/premium";
import ComplianceAlertPanel from '@/components/ComplianceAlertPanel';
import { GlobalModeBar } from '@/components/GlobalModeBar';
import { useState } from "react";

export default function ITDashboard() {
  const logout = useStore((state) => state.logout);
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<'tickets' | 'messages'>('tickets');

  const handleLogout = () => {
    logout();
    setLocation("/");
  };

  const tickets = [
    { id: 1, location: "Stand 102", issue: "POS Terminal Offline", priority: "High", time: "5m ago" },
    { id: 2, location: "West Gate", issue: "Scanner Connectivity", priority: "Medium", time: "15m ago" },
    { id: 3, location: "Stand 201", issue: "Printer Jam", priority: "Low", time: "30m ago" },
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'Medium': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'Low': return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  return (
    <AnimatedBackground>
      <GlobalModeBar />
      <div className="min-h-screen pb-20">
        <PageHeader
          title="IT Command Center"
          subtitle="System monitoring & support"
          icon={<Monitor className="h-5 w-5" />}
          iconColor="cyan"
          actions={
            <Button variant="ghost" size="icon" onClick={handleLogout} className="text-slate-300 hover:bg-white/10" data-testid="button-logout">
              <LogOut className="h-5 w-5" />
            </Button>
          }
        />

        <main className="p-4 space-y-4 max-w-6xl mx-auto">
          <ComplianceAlertPanel 
            isManager={false}
          />
          
          <div className="grid grid-cols-3 gap-3">
            <motion.div whileHover={{ scale: 1.02 }}>
              <GlassCard className="border-emerald-500/20">
                <GlassCardContent className="p-4 flex flex-col items-center text-center space-y-2">
                  <div className="p-2 rounded-xl bg-emerald-500/20">
                    <Wifi className="h-5 w-5 text-emerald-400" />
                  </div>
                  <div className="text-sm font-medium text-slate-300">Network</div>
                  <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] uppercase">
                    Online
                  </Badge>
                </GlassCardContent>
              </GlassCard>
            </motion.div>
            
            <motion.div whileHover={{ scale: 1.02 }}>
              <GlassCard className="border-emerald-500/20">
                <GlassCardContent className="p-4 flex flex-col items-center text-center space-y-2">
                  <div className="p-2 rounded-xl bg-emerald-500/20">
                    <Monitor className="h-5 w-5 text-emerald-400" />
                  </div>
                  <div className="text-sm font-medium text-slate-300">POS Systems</div>
                  <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] uppercase">
                    98% Up
                  </Badge>
                </GlassCardContent>
              </GlassCard>
            </motion.div>
            
            <motion.div whileHover={{ scale: 1.02 }}>
              <GlassCard className="border-amber-500/20">
                <GlassCardContent className="p-4 flex flex-col items-center text-center space-y-2">
                  <div className="p-2 rounded-xl bg-amber-500/20">
                    <AlertTriangle className="h-5 w-5 text-amber-400" />
                  </div>
                  <div className="text-sm font-medium text-slate-300">Alerts</div>
                  <Badge className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] uppercase">
                    3 Critical
                  </Badge>
                </GlassCardContent>
              </GlassCard>
            </motion.div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard
              icon={<Server className="h-5 w-5" />}
              label="Servers"
              value="12/12"
              subValue="All healthy"
              color="green"
            />
            <StatCard
              icon={<Cpu className="h-5 w-5" />}
              label="CPU Load"
              value="45%"
              subValue="Nominal"
              color="cyan"
            />
            <StatCard
              icon={<Activity className="h-5 w-5" />}
              label="Uptime"
              value="99.9%"
              subValue="Last 30 days"
              color="purple"
            />
            <StatCard
              icon={<Zap className="h-5 w-5" />}
              label="Response"
              value="12ms"
              subValue="Avg latency"
              color="amber"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
            {[
              { id: 'tickets', label: 'Active Tickets', icon: AlertTriangle },
              { id: 'messages', label: 'Messages', icon: MessageSquare }
            ].map((tab) => (
              <motion.button
                key={tab.id}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 transition-all ${
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
            {activeTab === 'tickets' && (
              <motion.div
                key="tickets"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-3"
              >
                {tickets.map((ticket, idx) => (
                  <motion.div
                    key={ticket.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                  >
                    <GlassCard className="border-l-4 border-l-cyan-500">
                      <GlassCardContent className="p-4 flex justify-between items-center">
                        <div>
                          <div className="font-bold text-slate-100">{ticket.location}</div>
                          <div className="text-sm text-slate-400">{ticket.issue}</div>
                        </div>
                        <div className="text-right flex flex-col items-end gap-1">
                          <Badge className={`${getPriorityColor(ticket.priority)} text-xs border`}>
                            {ticket.priority}
                          </Badge>
                          <div className="text-xs text-slate-500 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {ticket.time}
                          </div>
                        </div>
                      </GlassCardContent>
                    </GlassCard>
                  </motion.div>
                ))}
              </motion.div>
            )}

            {activeTab === 'messages' && (
              <motion.div
                key="messages"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <GlassCard className="border-dashed border-2 border-white/20">
                  <GlassCardContent className="py-12 text-center">
                    <div className="p-4 rounded-2xl bg-slate-500/10 w-fit mx-auto mb-3">
                      <MessageSquare className="h-10 w-10 text-slate-500" />
                    </div>
                    <p className="text-slate-400">No new messages</p>
                  </GlassCardContent>
                </GlassCard>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
        
        <TutorialHelpButton page="it" />
      </div>
    </AnimatedBackground>
  );
}
