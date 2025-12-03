import { useStore } from "@/lib/mockData";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LogOut, MessageSquare, ChefHat, ArrowRight, AlertTriangle, UtensilsCrossed, Map, Clock, Flame, Utensils } from "lucide-react";
import { useLocation, Link } from "wouter";
import { TutorialHelpButton } from "@/components/TutorialCoach";
import { useEffect, useState } from "react";
import { Notepad } from "@/components/Notepad";
import { InteractiveMap } from "@/components/InteractiveMap";
import { TeamLeadCard } from "@/components/TeamLeadCard";
import { motion, AnimatePresence } from "framer-motion";
import { AnimatedBackground, GlassCard, GlassCardContent, GlassCardHeader, StatCard, PageHeader } from "@/components/ui/premium";
import ComplianceAlertPanel from '@/components/ComplianceAlertPanel';
import { GlobalModeBar } from '@/components/GlobalModeBar';

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

  return (
    <AnimatedBackground>
      <GlobalModeBar />
      <div className="min-h-screen pb-20">
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

        <main className="p-4 sm:px-6 space-y-4 max-w-6xl mx-auto">
          <ComplianceAlertPanel 
            userId={currentUser?.id} 
            userName={currentUser?.name} 
            isManager={false}
          />
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard
              icon={<Flame className="h-5 w-5" />}
              label="Active Orders"
              value={0}
              subValue="Coming soon"
              color="red"
            />
            <StatCard
              icon={<Clock className="h-5 w-5" />}
              label="Avg Prep Time"
              value="--"
              subValue="Coming soon"
              color="amber"
            />
            <StatCard
              icon={<Utensils className="h-5 w-5" />}
              label="Items Ready"
              value={0}
              subValue="Coming soon"
              color="green"
            />
            <StatCard
              icon={<MessageSquare className="h-5 w-5" />}
              label="Messages"
              value={messages.length}
              subValue={`${urgentMessages.length} urgent`}
              color="purple"
            />
          </div>

          <AnimatePresence>
            {urgentMessages.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <GlassCard className="border-red-500/30" glow>
                  <GlassCardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-red-500/20">
                        <AlertTriangle className="h-4 w-4 text-red-400" />
                      </div>
                      <span className="font-bold text-sm text-red-300">
                        Urgent Messages ({urgentMessages.length})
                      </span>
                    </div>
                  </GlassCardHeader>
                  <GlassCardContent className="space-y-2 pt-0">
                    {urgentMessages.slice(0, 3).map((msg, idx) => (
                      <motion.div 
                        key={msg.id} 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="p-3 bg-red-500/10 rounded-xl border border-red-500/20 text-sm text-slate-200"
                      >
                        {msg.content}
                      </motion.div>
                    ))}
                  </GlassCardContent>
                </GlassCard>
              </motion.div>
            )}
          </AnimatePresence>

          <TeamLeadCard department="Kitchen" />

          <Notepad storageKey="kitchen-notes" />

          {showMap && (
            <div className="fixed inset-0 z-50 bg-slate-950">
              <InteractiveMap 
                onClose={() => setShowMap(false)} 
                showNavigation={true}
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <GlassCard 
                className="cursor-pointer hover:border-blue-500/30 transition-colors h-full" 
                onClick={() => setShowMap(true)}
                data-testid="card-stadium-map"
              >
                <GlassCardContent className="p-6 flex flex-col items-center justify-center text-center space-y-3">
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-500/20 to-blue-600/10">
                    <Map className="h-8 w-8 text-blue-400" />
                  </div>
                  <div className="font-bold text-sm text-slate-200">Stadium Map</div>
                  <p className="text-xs text-slate-400">View venue layout</p>
                </GlassCardContent>
              </GlassCard>
            </motion.div>

            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <GlassCard 
                className="cursor-pointer hover:border-rose-500/30 transition-colors h-full" 
                onClick={() => setLocation('/messages')}
                data-testid="card-messages"
              >
                <GlassCardContent className="p-6 flex flex-col items-center justify-center text-center space-y-3">
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-rose-500/20 to-rose-600/10">
                    <MessageSquare className="h-8 w-8 text-rose-400" />
                  </div>
                  <div className="font-bold text-sm text-slate-200">Messages</div>
                  <p className="text-xs text-slate-400">Communicate with supervisors</p>
                </GlassCardContent>
              </GlassCard>
            </motion.div>

            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <GlassCard className="h-full opacity-60" data-testid="card-orders">
                <GlassCardContent className="p-6 flex flex-col items-center justify-center text-center space-y-3">
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-500/20 to-slate-600/10">
                    <UtensilsCrossed className="h-8 w-8 text-slate-400" />
                  </div>
                  <div className="font-bold text-sm text-slate-200">Orders</div>
                  <Badge variant="secondary" className="bg-white/10 text-slate-400 text-[10px]">Coming soon</Badge>
                </GlassCardContent>
              </GlassCard>
            </motion.div>

            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <GlassCard className="h-full opacity-60" data-testid="card-inventory">
                <GlassCardContent className="p-6 flex flex-col items-center justify-center text-center space-y-3">
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-500/20 to-slate-600/10">
                    <Flame className="h-8 w-8 text-slate-400" />
                  </div>
                  <div className="font-bold text-sm text-slate-200">Prep Station</div>
                  <Badge variant="secondary" className="bg-white/10 text-slate-400 text-[10px]">Coming soon</Badge>
                </GlassCardContent>
              </GlassCard>
            </motion.div>
          </div>

          <GlassCard data-testid="card-recent-messages">
            <GlassCardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-cyan-500/20">
                    <MessageSquare className="h-4 w-4 text-cyan-400" />
                  </div>
                  <span className="font-bold text-sm text-slate-200">Recent Messages</span>
                </div>
                <Link href="/messages">
                  <Button variant="ghost" size="sm" className="text-xs text-cyan-400 hover:bg-cyan-500/10">
                    View All <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                </Link>
              </div>
            </GlassCardHeader>
            <GlassCardContent className="space-y-2 pt-0">
              {recentMessages.length === 0 ? (
                <div className="text-center py-8">
                  <div className="p-4 rounded-2xl bg-slate-500/10 w-fit mx-auto mb-3">
                    <MessageSquare className="h-8 w-8 text-slate-500" />
                  </div>
                  <p className="text-sm text-slate-500">No messages yet</p>
                </div>
              ) : (
                recentMessages.map((msg, idx) => (
                  <motion.div 
                    key={msg.id} 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="p-3 bg-white/5 rounded-xl border border-white/10 text-sm hover:bg-white/10 transition-colors cursor-pointer"
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
                    <p className="text-slate-300">{msg.content}</p>
                  </motion.div>
                ))
              )}
            </GlassCardContent>
          </GlassCard>
        </main>
        
        <TutorialHelpButton page="kitchen" />
      </div>
    </AnimatedBackground>
  );
}
