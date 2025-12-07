import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  ChefHat, 
  Clock,
  MapPin,
  MessageCircle,
  Calendar,
  Utensils,
  AlertCircle,
  BookOpen,
  ClipboardList,
  User
} from "lucide-react";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { 
  AnimatedBackground, 
  PageHeader,
  GlowButton
} from "@/components/ui/premium";
import { LayoutShell, BentoCard, CarouselRail, AccordionStack } from "@/components/ui/bento";
import { useStore } from "@/lib/mockData";
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

const RECIPE_GUIDES = [
  {
    title: "Grill Station Temps",
    content: "Burgers: 160°F internal. Chicken: 165°F internal. Hot dogs: grill marks both sides. Keep warming drawer at 140°F minimum."
  },
  {
    title: "Fryer Guidelines",
    content: "Oil temp: 350-375°F. Fries: 3-4 min until golden. Chicken tenders: 6-8 min. Never overcrowd basket. Filter oil every 4 hours."
  },
  {
    title: "Prep Checklist",
    content: "Slice vegetables uniformly. Pre-portion proteins. Label all containers with date/time. Rotate stock using FIFO. Check par levels before service."
  },
  {
    title: "Plating Standards",
    content: "Follow menu photos exactly. Check portion sizes. Clean plate edges before serving. Garnish as specified. Temperature check before sending."
  }
];

function MetricCard({ icon: Icon, label, value, color }: { 
  icon: React.ElementType; 
  label: string; 
  value: string | number; 
  color: string;
}) {
  return (
    <div 
      className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 border border-white/5 min-w-[130px]"
      data-testid={`metric-${label.toLowerCase().replace(/\s+/g, '-')}`}
    >
      <div className={`p-2 rounded-lg bg-${color}-500/20`}>
        <Icon className={`w-4 h-4 text-${color}-400`} />
      </div>
      <div>
        <div className="text-lg font-bold text-white">{value}</div>
        <div className="text-xs text-slate-400">{label}</div>
      </div>
    </div>
  );
}

function ShiftCard({ assignment, isToday }: { assignment: Assignment; isToday: boolean }) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CheckedIn':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">Checked In</Badge>;
      case 'CheckedOut':
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs">Complete</Badge>;
      case 'OnBreak':
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs">On Break</Badge>;
      case 'NoShow':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-xs">No Show</Badge>;
      default:
        return <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30 text-xs">Scheduled</Badge>;
    }
  };

  return (
    <div 
      className={`p-3 rounded-lg border min-w-[200px] ${
        isToday 
          ? 'bg-gradient-to-br from-cyan-500/10 to-purple-500/10 border-cyan-500/30' 
          : 'bg-slate-800/40 border-white/5'
      }`}
      data-testid={`shift-card-${assignment.id}`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-white">
          {isToday ? 'Today' : format(new Date(assignment.event_date), 'EEE, MMM d')}
        </span>
        {getStatusBadge(assignment.status || 'Scheduled')}
      </div>
      <div className="text-xs text-slate-400 mb-1">
        {assignment.position} @ {assignment.stand_name || 'TBD'}
      </div>
      <div className="text-xs text-slate-500">
        {assignment.shift_start} - {assignment.shift_end}
      </div>
    </div>
  );
}

function QuickActionCard({ href, icon: Icon, title, subtitle, color }: {
  href: string;
  icon: React.ElementType;
  title: string;
  subtitle: string;
  color: string;
}) {
  return (
    <Link href={href}>
      <div 
        className={`p-3 rounded-lg bg-slate-800/40 border border-white/5 hover:border-${color}-500/30 transition-colors cursor-pointer`}
        data-testid={`action-${title.toLowerCase().replace(/\s+/g, '-')}`}
      >
        <div className="flex flex-col items-center text-center">
          <div className={`w-10 h-10 rounded-full bg-${color}-500/20 flex items-center justify-center mb-2`}>
            <Icon className={`h-5 w-5 text-${color}-400`} />
          </div>
          <div className="font-medium text-white text-sm">{title}</div>
          <div className="text-xs text-white/60">{subtitle}</div>
        </div>
      </div>
    </Link>
  );
}

function StationStatusCard({ assignment }: { assignment: Assignment | null }) {
  if (!assignment) {
    return (
      <div 
        className="p-4 rounded-lg bg-slate-800/40 border border-white/10 text-center"
        data-testid="station-status-empty"
      >
        <Calendar className="h-8 w-8 mx-auto text-white/30 mb-2" />
        <div className="text-sm text-white/60">No shift scheduled</div>
      </div>
    );
  }

  return (
    <div 
      className="p-4 rounded-lg bg-gradient-to-br from-cyan-500/10 to-purple-500/10 border border-cyan-500/30"
      data-testid="station-status-active"
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500/30 to-purple-500/30 flex items-center justify-center">
          <ChefHat className="h-6 w-6 text-cyan-400" />
        </div>
        <div>
          <div className="text-sm font-bold text-white">Today's Station</div>
          <div className="text-xs text-white/60">{format(new Date(), 'EEEE, MMM d')}</div>
        </div>
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm">
          <MapPin className="h-4 w-4 text-cyan-400" />
          <span className="text-white">{assignment.stand_name || 'TBD'}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Utensils className="h-4 w-4 text-purple-400" />
          <span className="text-white">{assignment.position}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Clock className="h-4 w-4 text-green-400" />
          <span className="text-white">{assignment.shift_start} - {assignment.shift_end}</span>
        </div>
      </div>
      
      <div className="mt-3 p-2 bg-white/5 rounded-lg border border-white/10">
        <div className="flex items-center gap-2 text-xs text-white/60">
          <AlertCircle className="h-3 w-3" />
          <span>Check in with supervisor when you arrive</span>
        </div>
      </div>
    </div>
  );
}

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

  const upcomingAssignments = assignments.filter(a => a.event_date >= today).slice(0, 5);
  
  const metricsItems = [
    <MetricCard key="position" icon={Utensils} label="Position" value={todayAssignment?.position || 'N/A'} color="purple" />,
    <MetricCard key="shift" icon={Clock} label="Shift" value={todayAssignment ? `${todayAssignment.shift_start}` : 'N/A'} color="green" />,
    <MetricCard key="upcoming" icon={Calendar} label="Upcoming" value={upcomingAssignments.length} color="cyan" />,
    <MetricCard key="status" icon={User} label="Status" value={todayAssignment?.status || 'No Shift'} color="blue" />,
  ];

  const shiftItems = upcomingAssignments.map(assignment => (
    <ShiftCard 
      key={assignment.id} 
      assignment={assignment} 
      isToday={assignment.event_date === today}
    />
  ));

  return (
    <AnimatedBackground>
      <div className="min-h-screen pb-20">
        <PageHeader 
          title={`Welcome, ${currentUser?.name || 'Cook'}`}
          subtitle="Culinary Team"
          icon={<ChefHat className="h-8 w-8" />}
        />

        <main className="container mx-auto px-3 pt-4" data-testid="culinary-cook-dashboard">
          {loading ? (
            <div className="text-center py-8 text-white/60">Loading...</div>
          ) : (
            <LayoutShell>
              <BentoCard span={12} title="Prep Metrics" data-testid="metrics-section">
                <CarouselRail items={metricsItems} data-testid="metrics-carousel" />
              </BentoCard>

              <BentoCard span={8} title="Upcoming Shifts" data-testid="orders-section">
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs text-slate-400">Your scheduled shifts</span>
                </div>
                {shiftItems.length === 0 ? (
                  <div className="text-center py-6">
                    <Calendar className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                    <p className="text-xs text-slate-400">No upcoming shifts</p>
                  </div>
                ) : (
                  <CarouselRail items={shiftItems} data-testid="orders-carousel" />
                )}
              </BentoCard>

              <BentoCard span={4} rowSpan={2} title="Recipe Guides" data-testid="recipes-section">
                <div className="flex items-center gap-2 mb-3">
                  <BookOpen className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs text-slate-400">Quick Reference</span>
                </div>
                <AccordionStack 
                  items={RECIPE_GUIDES}
                  defaultOpen={[0]}
                  data-testid="recipes-accordion"
                />
              </BentoCard>

              <BentoCard span={4} title="Station Status" data-testid="station-section">
                <StationStatusCard assignment={todayAssignment} />
              </BentoCard>

              <BentoCard span={4} title="Quick Actions" data-testid="actions-section">
                <div className="grid grid-cols-2 gap-2">
                  <QuickActionCard
                    href="/messages"
                    icon={MessageCircle}
                    title="Messages"
                    subtitle="Contact kitchen"
                    color="cyan"
                  />
                  <QuickActionCard
                    href="/stadium-map"
                    icon={MapPin}
                    title="Map"
                    subtitle="Find location"
                    color="purple"
                  />
                </div>
              </BentoCard>
            </LayoutShell>
          )}
        </main>
      </div>
    </AnimatedBackground>
  );
}
