import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  ChefHat, 
  Clock,
  MapPin,
  MessageCircle,
  Calendar,
  Utensils,
  AlertCircle
} from "lucide-react";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { 
  AnimatedBackground, 
  GlassCard, 
  GlassCardContent, 
  PageHeader,
  GlowButton
} from "@/components/ui/premium";
import { useStore } from "@/lib/mockData";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

type Assignment = {
  id: string;
  event_date: string;
  cook_name: string;
  stand_id: string;
  stand_name: string;
  position: string;
  shift_start: string;
  shift_end: string;
  status?: string;
};

export default function CulinaryCookDashboard() {
  const currentUser = useStore((state: { currentUser: any }) => state.currentUser);
  const { toast } = useToast();
  
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [todayAssignment, setTodayAssignment] = useState<Assignment | null>(null);
  const [loading, setLoading] = useState(true);
  
  const today = format(new Date(), 'yyyy-MM-dd');

  useEffect(() => {
    fetchAssignments();
  }, [currentUser]);

  async function fetchAssignments() {
    if (!currentUser?.id) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/culinary/assignments/cook/${currentUser.id}`);
      if (response.ok) {
        const data = await response.json();
        setAssignments(data);
        
        const todayShift = data.find((a: Assignment) => a.event_date === today);
        setTodayAssignment(todayShift || null);
      }
    } catch (error) {
      console.error('Error fetching assignments:', error);
    } finally {
      setLoading(false);
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CheckedIn':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Checked In</Badge>;
      case 'CheckedOut':
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Shift Complete</Badge>;
      case 'OnBreak':
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">On Break</Badge>;
      case 'NoShow':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">No Show</Badge>;
      default:
        return <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">Scheduled</Badge>;
    }
  };

  return (
    <AnimatedBackground>
      <div className="min-h-screen pb-20">
        <PageHeader 
          title={`Welcome, ${currentUser?.name || 'Cook'}`}
          subtitle="Culinary Team"
          icon={<ChefHat className="h-8 w-8" />}
        />

        <div className="container mx-auto px-4 pt-4">
          {loading ? (
            <div className="text-center py-8 text-white/60">Loading...</div>
          ) : (
            <>
              {todayAssignment ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6"
                >
                  <GlassCard className="p-6 border-2 border-cyan-500/30">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-cyan-500/30 to-purple-500/30 flex items-center justify-center">
                        <ChefHat className="h-7 w-7 text-cyan-400" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-white">Today's Shift</h2>
                        <div className="text-sm text-white/60">{format(new Date(), 'EEEE, MMMM d, yyyy')}</div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                          <MapPin className="h-5 w-5 text-cyan-400" />
                        </div>
                        <div>
                          <div className="text-sm text-white/60">Stand Location</div>
                          <div className="font-medium text-white">{todayAssignment.stand_name || 'TBD'}</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                          <Utensils className="h-5 w-5 text-purple-400" />
                        </div>
                        <div>
                          <div className="text-sm text-white/60">Position</div>
                          <div className="font-medium text-white">{todayAssignment.position}</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                          <Clock className="h-5 w-5 text-green-400" />
                        </div>
                        <div>
                          <div className="text-sm text-white/60">Shift Time</div>
                          <div className="font-medium text-white">
                            {todayAssignment.shift_start} - {todayAssignment.shift_end}
                          </div>
                        </div>
                      </div>
                      
                      <div className="pt-2">
                        <div className="text-sm text-white/60 mb-2">Status</div>
                        {getStatusBadge(todayAssignment.status || 'Scheduled')}
                      </div>
                    </div>
                    
                    <div className="mt-6 p-4 bg-white/5 rounded-lg border border-white/10">
                      <div className="flex items-center gap-2 text-white/60">
                        <AlertCircle className="h-4 w-4" />
                        <span className="text-sm">Check in with Chef Deb or Shelia when you arrive</span>
                      </div>
                    </div>
                  </GlassCard>
                </motion.div>
              ) : (
                <GlassCard className="p-8 text-center mb-6">
                  <Calendar className="h-12 w-12 mx-auto text-white/30 mb-4" />
                  <div className="text-white/60">No shift scheduled for today</div>
                  <div className="text-sm text-white/40 mt-2">Contact Chef Deb if you believe this is an error</div>
                </GlassCard>
              )}

              <h3 className="text-lg font-medium text-white mb-4">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <Link href="/messages">
                  <GlassCard className="p-4 hover:border-cyan-500/30 transition-colors cursor-pointer">
                    <div className="flex flex-col items-center text-center">
                      <div className="w-12 h-12 rounded-full bg-cyan-500/20 flex items-center justify-center mb-3">
                        <MessageCircle className="h-6 w-6 text-cyan-400" />
                      </div>
                      <div className="font-medium text-white">Messages</div>
                      <div className="text-xs text-white/60">Contact kitchen or managers</div>
                    </div>
                  </GlassCard>
                </Link>
                
                <Link href="/stadium-map">
                  <GlassCard className="p-4 hover:border-purple-500/30 transition-colors cursor-pointer">
                    <div className="flex flex-col items-center text-center">
                      <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center mb-3">
                        <MapPin className="h-6 w-6 text-purple-400" />
                      </div>
                      <div className="font-medium text-white">Stadium Map</div>
                      <div className="text-xs text-white/60">Find your stand location</div>
                    </div>
                  </GlassCard>
                </Link>
              </div>

              {assignments.length > 0 && (
                <>
                  <h3 className="text-lg font-medium text-white mb-4">Upcoming Shifts</h3>
                  <ScrollArea className="h-[200px]">
                    <div className="space-y-3">
                      {assignments
                        .filter(a => a.event_date >= today)
                        .slice(0, 5)
                        .map((assignment) => (
                          <GlassCard key={assignment.id} className="p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-medium text-white">
                                  {format(new Date(assignment.event_date), 'EEE, MMM d')}
                                </div>
                                <div className="text-sm text-white/60">
                                  {assignment.position} @ {assignment.stand_name || 'TBD'}
                                </div>
                                <div className="text-xs text-white/40">
                                  {assignment.shift_start} - {assignment.shift_end}
                                </div>
                              </div>
                              <Calendar className="h-5 w-5 text-white/40" />
                            </div>
                          </GlassCard>
                        ))}
                    </div>
                  </ScrollArea>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </AnimatedBackground>
  );
}
