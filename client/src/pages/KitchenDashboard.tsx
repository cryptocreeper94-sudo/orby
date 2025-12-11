import { useStore } from "@/lib/mockData";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LogOut, MessageSquare, ChefHat, ArrowRight, AlertTriangle, UtensilsCrossed, Map, Clock, Flame, Utensils, FileText, BookOpen } from "lucide-react";
import { useLocation, Link } from "wouter";
import { TutorialHelpButton } from "@/components/TutorialCoach";
import { useEffect, useState } from "react";
import { Notepad } from "@/components/Notepad";
import { InteractiveMap } from "@/components/InteractiveMap";
import { TeamLeadCard } from "@/components/TeamLeadCard";
import { motion, AnimatePresence } from "framer-motion";
import { AnimatedBackground, PageHeader } from "@/components/ui/premium";
import ComplianceAlertPanel from '@/components/ComplianceAlertPanel';
import { GlobalModeBar } from '@/components/GlobalModeBar';
import { LayoutShell, BentoCard, CarouselRail, AccordionStack } from "@/components/ui/bento";

export default function KitchenDashboard() {
  const logout = useStore((state) => state.logout);
  const [, setLocation] = useLocation();
  const currentUser = useStore((state) => state.currentUser);
  const stands = useStore((state) => state.stands);
  const messages = useStore((state) => state.messages);
  const fetchAll = useStore((state) => state.fetchAll);

  useEffect(() => {
    if (stands.length === 0) {
      fetchAll();
    }
  }, [stands.length, fetchAll]);

  const handleLogout = () => {
    logout();
    setLocation("/");
  };

  const recentMessages = messages.slice(0, 5);
  const urgentMessages = messages.filter(m => m.type === 'Urgent');
  const [showMap, setShowMap] = useState(false);

  const heroMetrics = [
    { icon: <Flame className="h-5 w-5" />, label: "Active Orders", value: "0", subValue: "Coming soon", color: "red" },
    { icon: <Clock className="h-5 w-5" />, label: "Avg Prep Time", value: "--", subValue: "Coming soon", color: "amber" },
    { icon: <Utensils className="h-5 w-5" />, label: "Items Ready", value: "0", subValue: "Coming soon", color: "green" },
    { icon: <MessageSquare className="h-5 w-5" />, label: "Messages", value: String(messages.length), subValue: `${urgentMessages.length} urgent`, color: "purple" },
  ];

  const metricCarouselItems = heroMetrics.map((metric, idx) => (
    <div 
      key={idx}
      data-testid={`metric-card-${metric.label.toLowerCase().replace(/\s+/g, '-')}`}
      className={`p-4 rounded-xl bg-slate-800/60 border border-white/10 w-[140px] h-[80px] hover:border-${metric.color}-400/50 transition-colors`}
    >
      <div className={`p-2 rounded-lg bg-${metric.color}-500/20 w-fit mb-2`}>
        <div className={`text-${metric.color}-400`}>{metric.icon}</div>
      </div>
      <div className="text-xs text-slate-400 uppercase tracking-wide">{metric.label}</div>
      <div className="text-xl font-bold text-slate-100">{metric.value}</div>
      <div className="text-xs text-slate-500">{metric.subValue}</div>
    </div>
  ));

  const ordersCarouselItems = recentMessages.length > 0 
    ? recentMessages.map((msg, idx) => (
        <div 
          key={msg.id} 
          data-testid={`message-item-${msg.id}`}
          className="p-3 bg-white/5 rounded-xl border border-white/10 w-[180px] h-[90px] hover:bg-white/10 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2 mb-1">
            <Badge 
              className={`text-[10px] border ${
                msg.type === 'Urgent' 
                  ? 'bg-red-500/20 text-red-400 border-red-500/30' 
                  : 'bg-slate-500/20 text-slate-400 border-slate-500/30'
              }`}
            >
              {msg.type}
            </Badge>
            <span className="text-[10px] text-slate-500">
              {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
            </span>
          </div>
          <p className="text-slate-300 text-sm line-clamp-2">{msg.content}</p>
        </div>
      ))
    : [
        <div key="empty" className="p-6 text-center text-slate-500 w-[180px] h-[90px]">
          <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No messages yet</p>
        </div>
      ];

  const prepStatusCards = [
    { icon: <Map className="h-6 w-6" />, label: "Stadium Map", desc: "View venue layout", color: "blue", onClick: () => setShowMap(true), testId: "card-stadium-map" },
    { icon: <MessageSquare className="h-6 w-6" />, label: "Messages", desc: "Communicate with supervisors", color: "rose", onClick: () => setLocation('/messages'), testId: "card-messages" },
    { icon: <UtensilsCrossed className="h-6 w-6" />, label: "Orders", desc: "Coming soon", color: "slate", disabled: true, testId: "card-orders" },
    { icon: <Flame className="h-6 w-6" />, label: "Prep Station", desc: "Coming soon", color: "slate", disabled: true, testId: "card-inventory" },
  ];

  const procedureAccordionItems = [
    {
      title: "Opening Procedures",
      content: (
        <ul className="space-y-2 text-sm">
          <li className="flex items-start gap-2"><span className="text-emerald-400">•</span> Check equipment temperatures</li>
          <li className="flex items-start gap-2"><span className="text-emerald-400">•</span> Verify food stock levels</li>
          <li className="flex items-start gap-2"><span className="text-emerald-400">•</span> Review today's menu items</li>
          <li className="flex items-start gap-2"><span className="text-emerald-400">•</span> Confirm staff assignments</li>
        </ul>
      )
    },
    {
      title: "Food Safety Guidelines",
      content: (
        <ul className="space-y-2 text-sm">
          <li className="flex items-start gap-2"><span className="text-amber-400">•</span> Hot foods above 140°F (60°C)</li>
          <li className="flex items-start gap-2"><span className="text-blue-400">•</span> Cold foods below 40°F (4°C)</li>
          <li className="flex items-start gap-2"><span className="text-emerald-400">•</span> Wash hands every 30 minutes</li>
          <li className="flex items-start gap-2"><span className="text-purple-400">•</span> Use separate cutting boards for proteins</li>
        </ul>
      )
    },
    {
      title: "Closing Procedures",
      content: (
        <ul className="space-y-2 text-sm">
          <li className="flex items-start gap-2"><span className="text-cyan-400">•</span> Clean all prep surfaces</li>
          <li className="flex items-start gap-2"><span className="text-cyan-400">•</span> Store leftover ingredients properly</li>
          <li className="flex items-start gap-2"><span className="text-cyan-400">•</span> Complete inventory count</li>
          <li className="flex items-start gap-2"><span className="text-cyan-400">•</span> Turn off equipment per checklist</li>
        </ul>
      )
    },
  ];

  return (
    <AnimatedBackground>
      <GlobalModeBar />
      <div className="min-h-screen pb-20" data-testid="kitchen-dashboard">
        <PageHeader
          title="Kitchen"
          subtitle={`Welcome, ${currentUser?.name}`}
          icon={<ChefHat className="h-5 w-5" />}
          iconColor="red"
          actions={
            <div className="flex items-center gap-2">
              <Link href="/messages">
                <Button variant="ghost" size="icon" className="text-slate-300 hover:bg-white/10 relative" data-testid="button-messages">
                  <MessageSquare className="h-5 w-5" />
                  {urgentMessages.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-amber-400 text-amber-900 text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold animate-pulse">
                      {urgentMessages.length}
                    </span>
                  )}
                </Button>
              </Link>
              <Button variant="ghost" size="icon" onClick={handleLogout} className="text-slate-300 hover:bg-white/10" data-testid="button-logout">
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          }
        />

        <main className="p-3 sm:px-4 max-w-7xl mx-auto">
          <div className="mb-4">
            <ComplianceAlertPanel 
              userId={currentUser?.id} 
              userName={currentUser?.name} 
              isManager={false}
            />
          </div>

          <AnimatePresence>
            {urgentMessages.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-4"
              >
                <BentoCard span={12} className="border-red-500/30 shadow-lg shadow-red-500/10" data-testid="urgent-messages-panel">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-1.5 rounded-lg bg-red-500/20">
                      <AlertTriangle className="h-4 w-4 text-red-400" />
                    </div>
                    <span className="font-bold text-sm text-red-300">
                      Urgent Messages ({urgentMessages.length})
                    </span>
                  </div>
                  <div className="space-y-2">
                    {urgentMessages.slice(0, 3).map((msg, idx) => (
                      <motion.div 
                        key={msg.id} 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="p-3 bg-red-500/10 rounded-xl border border-red-500/20 text-sm text-slate-200"
                        data-testid={`urgent-message-${msg.id}`}
                      >
                        {msg.content}
                      </motion.div>
                    ))}
                  </div>
                </BentoCard>
              </motion.div>
            )}
          </AnimatePresence>

          <LayoutShell className="mb-4" data-testid="bento-layout">
            <BentoCard span={12} title="Kitchen Metrics" data-testid="metrics-carousel-card">
              <CarouselRail 
                items={metricCarouselItems} 
                autoplay 
                showDots
                data-testid="metrics-carousel"
              />
            </BentoCard>

            <BentoCard span={8} className="lg:col-span-8 md:col-span-6 col-span-4" data-testid="orders-carousel-card">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-cyan-500/20">
                    <MessageSquare className="h-4 w-4 text-cyan-400" />
                  </div>
                  <span className="font-bold text-sm text-slate-200">Recent Messages</span>
                </div>
                <Link href="/messages">
                  <Button variant="ghost" size="sm" className="text-xs text-cyan-400 hover:bg-cyan-500/10" data-testid="view-all-messages">
                    View All <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                </Link>
              </div>
              <CarouselRail 
                items={ordersCarouselItems}
                data-testid="messages-carousel"
              />
            </BentoCard>

            <BentoCard span={4} className="lg:col-span-4 md:col-span-6 col-span-4 row-span-2" data-testid="procedures-card">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 rounded-lg bg-violet-500/20">
                  <BookOpen className="h-4 w-4 text-violet-400" />
                </div>
                <span className="font-bold text-sm text-slate-200">Procedures</span>
              </div>
              <AccordionStack 
                items={procedureAccordionItems} 
                defaultOpen={[0]}
                data-testid="procedures-accordion"
              />
            </BentoCard>

            <BentoCard span={8} className="lg:col-span-8 md:col-span-6 col-span-4" data-testid="prep-status-card">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 rounded-lg bg-emerald-500/20">
                  <Utensils className="h-4 w-4 text-emerald-400" />
                </div>
                <span className="font-bold text-sm text-slate-200">Quick Actions</span>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                {prepStatusCards.map((card) => (
                  <motion.div 
                    key={card.testId}
                    whileHover={{ scale: card.disabled ? 1 : 1.02 }} 
                    whileTap={{ scale: card.disabled ? 1 : 0.98 }}
                    className={`p-4 rounded-xl bg-slate-800/40 border border-white/10 cursor-pointer text-center transition-colors ${
                      card.disabled ? 'opacity-50' : `hover:border-${card.color}-500/30`
                    }`}
                    onClick={card.disabled ? undefined : card.onClick}
                    data-testid={card.testId}
                  >
                    <div className={`p-3 rounded-xl bg-${card.color}-500/20 w-fit mx-auto mb-2`}>
                      <div className={`text-${card.color}-400`}>{card.icon}</div>
                    </div>
                    <div className="font-bold text-sm text-slate-200">{card.label}</div>
                    {card.disabled && (
                      <Badge variant="secondary" className="bg-white/10 text-slate-400 text-[10px] mt-1">Coming soon</Badge>
                    )}
                  </motion.div>
                ))}
              </div>
            </BentoCard>

            <BentoCard span={6} className="lg:col-span-6 md:col-span-6 col-span-4" data-testid="team-lead-card">
              <TeamLeadCard department="Kitchen" />
            </BentoCard>

            <BentoCard span={6} className="lg:col-span-6 md:col-span-6 col-span-4" data-testid="notepad-card">
              <Notepad storageKey="kitchen-notes" />
            </BentoCard>
          </LayoutShell>

          {showMap && (
            <div className="fixed inset-0 z-50 bg-slate-950">
              <InteractiveMap 
                onClose={() => setShowMap(false)} 
                showNavigation={true}
              />
            </div>
          )}
        </main>
        
        <TutorialHelpButton page="kitchen" />
      </div>
    </AnimatedBackground>
  );
}
