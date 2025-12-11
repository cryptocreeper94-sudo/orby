import { useStore } from "@/lib/mockData";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LogOut, Monitor, Wifi, AlertTriangle, MessageSquare, Server, Cpu, Activity, Clock, Zap, FileText, Terminal } from "lucide-react";
import { useLocation } from "wouter";
import { TutorialHelpButton } from "@/components/TutorialCoach";
import { motion } from "framer-motion";
import { AnimatedBackground, PageHeader } from "@/components/ui/premium";
import ComplianceAlertPanel from '@/components/ComplianceAlertPanel';
import { GlobalModeBar } from '@/components/GlobalModeBar';
import { useState } from "react";
import { LayoutShell, BentoCard, CarouselRail, AccordionStack } from "@/components/ui/bento";
import { EventHeader } from '@/components/EventHeader';

export default function ITDashboard() {
  const logout = useStore((state) => state.logout);
  const [, setLocation] = useLocation();

  const handleLogout = () => {
    logout();
    setLocation("/");
  };

  const tickets = [
    { id: 1, location: "Stand 102", issue: "POS Terminal Offline", priority: "High", time: "5m ago" },
    { id: 2, location: "West Gate", issue: "Scanner Connectivity", priority: "Medium", time: "15m ago" },
    { id: 3, location: "Stand 201", issue: "Printer Jam", priority: "Low", time: "30m ago" },
    { id: 4, location: "East Concourse", issue: "WiFi Dead Zone", priority: "Medium", time: "45m ago" },
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'Medium': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'Low': return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  const systemStatusItems = [
    { icon: <Wifi className="h-5 w-5" />, label: "Network", status: "Online", color: "emerald" },
    { icon: <Monitor className="h-5 w-5" />, label: "POS Systems", status: "98% Up", color: "emerald" },
    { icon: <AlertTriangle className="h-5 w-5" />, label: "Alerts", status: "3 Critical", color: "amber" },
    { icon: <Server className="h-5 w-5" />, label: "Servers", status: "12/12", color: "emerald" },
  ];

  const statusCarouselItems = systemStatusItems.map((item, idx) => (
    <div 
      key={idx}
      data-testid={`status-card-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
      className={`p-4 rounded-xl bg-slate-800/60 border border-${item.color}-500/20 w-[140px] h-[100px] hover:border-${item.color}-400/50 transition-colors`}
    >
      <div className={`p-2 rounded-xl bg-${item.color}-500/20 w-fit mb-2`}>
        <div className={`text-${item.color}-400`}>{item.icon}</div>
      </div>
      <div className="text-sm font-medium text-slate-300">{item.label}</div>
      <Badge className={`bg-${item.color}-500/20 text-${item.color}-400 border border-${item.color}-500/30 text-[10px] uppercase mt-1`}>
        {item.status}
      </Badge>
    </div>
  ));

  const ticketsCarouselItems = tickets.map((ticket) => (
    <div 
      key={ticket.id}
      data-testid={`ticket-card-${ticket.id}`}
      className="p-4 rounded-xl bg-slate-800/60 border-l-4 border-l-cyan-500 border border-white/10 min-w-[220px] hover:bg-slate-800/80 transition-colors"
    >
      <div className="flex justify-between items-start mb-2">
        <div className="font-bold text-slate-100">{ticket.location}</div>
        <Badge className={`${getPriorityColor(ticket.priority)} text-xs border`}>
          {ticket.priority}
        </Badge>
      </div>
      <div className="text-sm text-slate-400 mb-2">{ticket.issue}</div>
      <div className="text-xs text-slate-500 flex items-center gap-1">
        <Clock className="h-3 w-3" />
        {ticket.time}
      </div>
    </div>
  ));

  const equipmentMetrics = [
    { icon: <Server className="h-5 w-5" />, label: "Servers", value: "12/12", subValue: "All healthy", color: "green" },
    { icon: <Cpu className="h-5 w-5" />, label: "CPU Load", value: "45%", subValue: "Nominal", color: "cyan" },
    { icon: <Activity className="h-5 w-5" />, label: "Uptime", value: "99.9%", subValue: "Last 30 days", color: "purple" },
    { icon: <Zap className="h-5 w-5" />, label: "Response", value: "12ms", subValue: "Avg latency", color: "amber" },
  ];

  const logAccordionItems = [
    {
      title: "System Events (Last Hour)",
      content: (
        <div className="space-y-2 text-sm font-mono">
          <div className="flex items-start gap-2">
            <span className="text-emerald-400 text-xs">10:45</span>
            <span className="text-slate-400">Network health check passed</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-amber-400 text-xs">10:32</span>
            <span className="text-slate-400">POS-102 reconnected after timeout</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-emerald-400 text-xs">10:15</span>
            <span className="text-slate-400">Backup completed successfully</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-blue-400 text-xs">10:00</span>
            <span className="text-slate-400">Scheduled maintenance window started</span>
          </div>
        </div>
      )
    },
    {
      title: "Error Logs",
      content: (
        <div className="space-y-2 text-sm font-mono">
          <div className="flex items-start gap-2">
            <span className="text-red-400 text-xs">ERROR</span>
            <span className="text-slate-400">Connection timeout on POS-102</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-amber-400 text-xs">WARN</span>
            <span className="text-slate-400">High CPU usage on Server-03</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-red-400 text-xs">ERROR</span>
            <span className="text-slate-400">Printer queue overflow at Stand 201</span>
          </div>
        </div>
      )
    },
    {
      title: "Security Alerts",
      content: (
        <div className="space-y-2 text-sm">
          <div className="flex items-start gap-2">
            <span className="text-emerald-400">✓</span>
            <span className="text-slate-400">No security incidents in the last 24 hours</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-blue-400">ℹ</span>
            <span className="text-slate-400">Last security scan: 2 hours ago</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-emerald-400">✓</span>
            <span className="text-slate-400">All firewalls active and updated</span>
          </div>
        </div>
      )
    },
    {
      title: "Troubleshooting Guide",
      content: (
        <ul className="space-y-2 text-sm">
          <li className="flex items-start gap-2"><span className="text-cyan-400">1.</span> POS Offline: Check network cable and restart terminal</li>
          <li className="flex items-start gap-2"><span className="text-cyan-400">2.</span> Printer Issue: Clear queue and check paper</li>
          <li className="flex items-start gap-2"><span className="text-cyan-400">3.</span> WiFi Dead Zone: Report to network team for repeater placement</li>
          <li className="flex items-start gap-2"><span className="text-cyan-400">4.</span> Scanner Fail: Replace batteries, reset Bluetooth pairing</li>
        </ul>
      )
    },
  ];

  return (
    <AnimatedBackground>
      <EventHeader compact showDepartmentNotes="IT" />
      <GlobalModeBar />
      <div className="min-h-screen pb-20" data-testid="it-dashboard">
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

        <main className="p-3 sm:px-4 max-w-7xl mx-auto">
          <div className="mb-4">
            <ComplianceAlertPanel isManager={false} />
          </div>

          <LayoutShell data-testid="bento-layout">
            <BentoCard span={12} title="System Status" data-testid="system-status-card">
              <CarouselRail 
                items={statusCarouselItems} 
                autoplay 
                showDots
                data-testid="system-status-carousel"
              />
            </BentoCard>

            <BentoCard span={8} className="lg:col-span-8 md:col-span-6 col-span-4" data-testid="tickets-card">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 rounded-lg bg-cyan-500/20">
                  <AlertTriangle className="h-4 w-4 text-cyan-400" />
                </div>
                <span className="font-bold text-sm text-slate-200">Active Tickets</span>
                <Badge className="bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-xs ml-auto">
                  {tickets.length} open
                </Badge>
              </div>
              <CarouselRail 
                items={ticketsCarouselItems}
                data-testid="tickets-carousel"
              />
            </BentoCard>

            <BentoCard span={4} className="lg:col-span-4 md:col-span-6 col-span-4 row-span-2" data-testid="logs-card">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 rounded-lg bg-violet-500/20">
                  <Terminal className="h-4 w-4 text-violet-400" />
                </div>
                <span className="font-bold text-sm text-slate-200">Logs & Guides</span>
              </div>
              <AccordionStack 
                items={logAccordionItems} 
                defaultOpen={[0]}
                data-testid="logs-accordion"
              />
            </BentoCard>

            <BentoCard span={8} className="lg:col-span-8 md:col-span-6 col-span-4" data-testid="equipment-grid-card">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 rounded-lg bg-emerald-500/20">
                  <Server className="h-4 w-4 text-emerald-400" />
                </div>
                <span className="font-bold text-sm text-slate-200">Equipment Metrics</span>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                {equipmentMetrics.map((metric, idx) => (
                  <motion.div 
                    key={idx}
                    whileHover={{ scale: 1.02 }}
                    data-testid={`equipment-metric-${metric.label.toLowerCase().replace(/\s+/g, '-')}`}
                    className={`p-4 rounded-xl bg-slate-800/40 border border-white/10 text-center hover:border-${metric.color}-500/30 transition-colors`}
                  >
                    <div className={`p-2 rounded-lg bg-${metric.color}-500/20 w-fit mx-auto mb-2`}>
                      <div className={`text-${metric.color}-400`}>{metric.icon}</div>
                    </div>
                    <div className="text-xs text-slate-400 uppercase tracking-wide">{metric.label}</div>
                    <div className="text-lg font-bold text-slate-100">{metric.value}</div>
                    <div className="text-xs text-slate-500">{metric.subValue}</div>
                  </motion.div>
                ))}
              </div>
            </BentoCard>

            <BentoCard span={12} data-testid="messages-card">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 rounded-lg bg-blue-500/20">
                  <MessageSquare className="h-4 w-4 text-blue-400" />
                </div>
                <span className="font-bold text-sm text-slate-200">Messages</span>
              </div>
              <div className="border-dashed border-2 border-white/20 rounded-xl py-8 text-center">
                <div className="p-4 rounded-2xl bg-slate-500/10 w-fit mx-auto mb-3">
                  <MessageSquare className="h-10 w-10 text-slate-500" />
                </div>
                <p className="text-slate-400">No new messages</p>
              </div>
            </BentoCard>
          </LayoutShell>
        </main>
        
        <TutorialHelpButton page="it" />
      </div>
    </AnimatedBackground>
  );
}
