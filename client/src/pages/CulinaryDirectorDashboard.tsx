import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ChefHat, 
  Calendar, 
  Plus, 
  Search, 
  Clock,
  User,
  Users,
  Trash2,
  Check,
  X,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Coffee,
  Utensils,
  BookOpen,
  ClipboardList
} from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { 
  AnimatedBackground, 
  PageHeader,
  GlowButton
} from "@/components/ui/premium";
import { LayoutShell, BentoCard, CarouselRail, AccordionStack } from "@/components/ui/bento";
import { useStore } from "@/lib/mockData";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

type Cook = {
  id: string;
  name: string;
  pin: string;
  role: string;
  department: string;
  is_online: boolean;
};

type Assignment = {
  id: string;
  event_id: string;
  event_date: string;
  cook_id: string;
  cook_name: string;
  stand_id: string;
  stand_name: string;
  position: string;
  shift_start: string;
  shift_end: string;
  assigned_by_name: string;
};

type CheckIn = {
  id: string;
  assignment_id: string;
  cook_id: string;
  cook_name: string;
  event_date: string;
  stand_id: string;
  status: 'Scheduled' | 'CheckedIn' | 'OnBreak' | 'CheckedOut' | 'NoShow';
  check_in_time: string;
  check_out_time: string;
  position: string;
  shift_start: string;
  shift_end: string;
  stand_name: string;
};

const POSITIONS = [
  "Lead Cook",
  "Grill",
  "Fryer",
  "Prep",
  "Food Runner",
  "Floater"
];

const SHIFT_TIMES = [
  { value: "08:00", label: "8:00 AM" },
  { value: "09:00", label: "9:00 AM" },
  { value: "10:00", label: "10:00 AM" },
  { value: "11:00", label: "11:00 AM" },
  { value: "12:00", label: "12:00 PM" },
  { value: "13:00", label: "1:00 PM" },
  { value: "14:00", label: "2:00 PM" },
  { value: "15:00", label: "3:00 PM" },
  { value: "16:00", label: "4:00 PM" },
  { value: "17:00", label: "5:00 PM" },
  { value: "18:00", label: "6:00 PM" },
  { value: "19:00", label: "7:00 PM" },
  { value: "20:00", label: "8:00 PM" },
  { value: "21:00", label: "9:00 PM" },
  { value: "22:00", label: "10:00 PM" },
];

const KITCHEN_PROTOCOLS = [
  {
    title: "Food Safety Standards",
    content: "Maintain proper temperatures: cold foods below 40°F, hot foods above 140°F. Use color-coded cutting boards. Label and date all prep items. First In, First Out (FIFO) rotation required."
  },
  {
    title: "Prep Station Guidelines",
    content: "Complete prep checklist before each shift. Stock station with required ingredients. Maintain clean work surface throughout service. Report equipment issues immediately."
  },
  {
    title: "Service Procedures",
    content: "Call out orders clearly. Plate according to menu specs. Check temperatures before serving. Communicate timing with front-of-house. Quality check every plate."
  },
  {
    title: "End of Shift Duties",
    content: "Complete closing checklist. Clean and sanitize all surfaces. Properly store all ingredients. Check equipment is turned off. Report any issues to supervisor."
  }
];

function MetricCard({ icon: Icon, label, value, color, subValue }: { 
  icon: React.ElementType; 
  label: string; 
  value: number | string; 
  color: string;
  subValue?: string;
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
        {subValue && <div className="text-xs text-slate-500">{subValue}</div>}
      </div>
    </div>
  );
}

function StationCard({ stand, checkIns }: { stand: any; checkIns: CheckIn[] }) {
  const stationCheckIns = checkIns.filter(c => c.stand_id === stand.id);
  const activeCount = stationCheckIns.filter(c => c.status === 'CheckedIn').length;
  const scheduledCount = stationCheckIns.filter(c => c.status === 'Scheduled').length;
  
  return (
    <div 
      className="p-3 rounded-xl bg-slate-800/40 border border-white/5 min-w-[160px]"
      data-testid={`station-card-${stand.id}`}
    >
      <div className="flex items-center gap-2 mb-2">
        <Utensils className="w-4 h-4 text-cyan-400" />
        <span className="text-sm font-medium text-white truncate">{stand.name}</span>
      </div>
      <div className="flex items-center gap-2 text-xs">
        <Badge className="bg-green-500/20 text-green-400">{activeCount} active</Badge>
        <Badge className="bg-slate-500/20 text-slate-400">{scheduledCount} waiting</Badge>
      </div>
    </div>
  );
}

function CheckInCard({ checkIn, onCheckIn, onCheckOut, onNoShow }: { 
  checkIn: CheckIn; 
  onCheckIn: (id: string) => void;
  onCheckOut: (id: string) => void;
  onNoShow: (id: string) => void;
}) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CheckedIn':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">In</Badge>;
      case 'CheckedOut':
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs">Out</Badge>;
      case 'OnBreak':
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs">Break</Badge>;
      case 'NoShow':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-xs">No Show</Badge>;
      default:
        return <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30 text-xs">Scheduled</Badge>;
    }
  };
  
  return (
    <div 
      className="p-3 rounded-lg bg-slate-800/40 border border-white/5"
      data-testid={`checkin-card-${checkIn.id}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500/30 to-purple-500/30 flex items-center justify-center">
            <ChefHat className="h-5 w-5 text-cyan-400" />
          </div>
          <div>
            <div className="font-medium text-white text-sm">{checkIn.cook_name}</div>
            <div className="text-xs text-white/60">
              {checkIn.position} @ {checkIn.stand_name || 'TBD'}
            </div>
            <div className="text-xs text-white/40">
              {checkIn.shift_start} - {checkIn.shift_end}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {getStatusBadge(checkIn.status)}
          
          {checkIn.status === 'Scheduled' && (
            <div className="flex gap-1">
              <Button
                size="sm"
                className="h-7 w-7 p-0 bg-green-500/20 hover:bg-green-500/30 text-green-400"
                onClick={() => onCheckIn(checkIn.assignment_id)}
                data-testid={`button-checkin-${checkIn.id}`}
              >
                <Check className="h-3 w-3" />
              </Button>
              <Button
                size="sm"
                className="h-7 w-7 p-0 bg-red-500/20 hover:bg-red-500/30 text-red-400"
                onClick={() => onNoShow(checkIn.assignment_id)}
                data-testid={`button-noshow-${checkIn.id}`}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          )}
          
          {checkIn.status === 'CheckedIn' && (
            <Button
              size="sm"
              className="h-7 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 text-xs"
              onClick={() => onCheckOut(checkIn.assignment_id)}
              data-testid={`button-checkout-${checkIn.id}`}
            >
              <Coffee className="h-3 w-3 mr-1" />
              Out
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CulinaryDirectorDashboard() {
  const [, setLocation] = useLocation();
  const currentUser = useStore((state: { currentUser: any }) => state.currentUser);
  const { toast } = useToast();
  
  const [cooks, setCooks] = useState<Cook[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [stands, setStands] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedCook, setSelectedCook] = useState<string>('');
  const [selectedStand, setSelectedStand] = useState<string>('');
  const [selectedPosition, setSelectedPosition] = useState<string>('');
  const [selectedStartTime, setSelectedStartTime] = useState<string>('10:00');
  const [selectedEndTime, setSelectedEndTime] = useState<string>('18:00');
  
  const today = format(new Date(), 'yyyy-MM-dd');

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const [cooksRes, checkInsRes, standsRes, assignmentsRes] = await Promise.all([
        fetch('/api/culinary/team'),
        fetch(`/api/culinary/checkins/${today}`),
        fetch('/api/stands'),
        fetch(`/api/culinary/assignments/${today}`)
      ]);
      
      if (cooksRes.ok) setCooks(await cooksRes.json());
      if (checkInsRes.ok) setCheckIns(await checkInsRes.json());
      if (standsRes.ok) setStands(await standsRes.json());
      if (assignmentsRes.ok) setAssignments(await assignmentsRes.json());
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleCheckIn(assignmentId: string) {
    try {
      const response = await fetch(`/api/culinary/checkin/${assignmentId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userPin: currentUser?.pin,
          userId: currentUser?.id,
          userName: currentUser?.name
        })
      });
      
      if (response.ok) {
        toast({ title: "Cook checked in successfully" });
        fetchData();
      } else {
        const error = await response.json();
        toast({ title: "Error", description: error.error, variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error checking in cook", variant: "destructive" });
    }
  }

  async function handleCheckOut(assignmentId: string) {
    try {
      const response = await fetch(`/api/culinary/checkout/${assignmentId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userPin: currentUser?.pin,
          userId: currentUser?.id,
          userName: currentUser?.name
        })
      });
      
      if (response.ok) {
        toast({ title: "Cook checked out successfully" });
        fetchData();
      } else {
        const error = await response.json();
        toast({ title: "Error", description: error.error, variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error checking out cook", variant: "destructive" });
    }
  }

  async function handleNoShow(assignmentId: string) {
    try {
      const response = await fetch(`/api/culinary/noshow/${assignmentId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userPin: currentUser?.pin,
          userId: currentUser?.id,
          userName: currentUser?.name
        })
      });
      
      if (response.ok) {
        toast({ title: "Marked as no-show" });
        fetchData();
      } else {
        const error = await response.json();
        toast({ title: "Error", description: error.error, variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error marking no-show", variant: "destructive" });
    }
  }

  async function handleCreateAssignment() {
    if (!selectedCook || !selectedStand || !selectedPosition) {
      toast({ title: "Please fill all fields", variant: "destructive" });
      return;
    }

    const cook = cooks.find(c => c.id === selectedCook);
    const stand = stands.find(s => s.id === selectedStand);

    try {
      const response = await fetch('/api/culinary/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userPin: currentUser?.pin,
          eventDate: today,
          cookId: selectedCook,
          cookName: cook?.name || '',
          standId: selectedStand,
          standName: stand?.name || '',
          position: selectedPosition,
          shiftStart: selectedStartTime,
          shiftEnd: selectedEndTime,
          assignedById: currentUser?.id,
          assignedByName: currentUser?.name
        })
      });

      if (response.ok) {
        toast({ title: "Assignment created successfully" });
        setAssignDialogOpen(false);
        resetForm();
        fetchData();
      } else {
        const error = await response.json();
        toast({ title: "Error", description: error.error, variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error creating assignment", variant: "destructive" });
    }
  }

  function resetForm() {
    setSelectedCook('');
    setSelectedStand('');
    setSelectedPosition('');
    setSelectedStartTime('10:00');
    setSelectedEndTime('18:00');
  }

  const stats = {
    total: checkIns.length,
    checkedIn: checkIns.filter(c => c.status === 'CheckedIn').length,
    scheduled: checkIns.filter(c => c.status === 'Scheduled').length,
    noShow: checkIns.filter(c => c.status === 'NoShow').length,
    checkedOut: checkIns.filter(c => c.status === 'CheckedOut').length
  };

  const filteredCheckIns = checkIns.filter(c => 
    c.cook_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.stand_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.position?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const metricsItems = [
    <MetricCard key="total" icon={Users} label="Total Today" value={stats.total} color="cyan" />,
    <MetricCard key="checkedin" icon={CheckCircle2} label="Checked In" value={stats.checkedIn} color="green" />,
    <MetricCard key="waiting" icon={Clock} label="Waiting" value={stats.scheduled} color="yellow" />,
    <MetricCard key="noshow" icon={XCircle} label="No Shows" value={stats.noShow} color="red" />,
  ];

  const stationItems = stands.slice(0, 8).map(stand => (
    <StationCard key={stand.id} stand={stand} checkIns={checkIns} />
  ));

  return (
    <AnimatedBackground>
      <div className="min-h-screen pb-20">
        <PageHeader 
          title={`Welcome, ${currentUser?.name || 'Chef'}`}
          subtitle="Culinary Team Management"
          icon={<ChefHat className="h-8 w-8" />}
        />

        <main className="container mx-auto px-3 pt-4" data-testid="culinary-director-dashboard">
          <LayoutShell>
            <BentoCard span={12} title="Kitchen Metrics" data-testid="metrics-section">
              <CarouselRail items={metricsItems} data-testid="metrics-carousel" />
            </BentoCard>

            <BentoCard span={8} title="Stations Overview" data-testid="stations-section">
              <div className="flex items-center gap-2 mb-3">
                <Utensils className="w-4 h-4 text-cyan-400" />
                <span className="text-xs text-slate-400">Active kitchen stations</span>
              </div>
              <CarouselRail items={stationItems} data-testid="stations-carousel" />
            </BentoCard>

            <BentoCard span={4} title="Kitchen Protocols" data-testid="protocols-section">
              <div className="flex items-center gap-2 mb-3">
                <BookOpen className="w-4 h-4 text-cyan-400" />
                <span className="text-xs text-slate-400">Reference Guide</span>
              </div>
              <AccordionStack 
                items={KITCHEN_PROTOCOLS}
                defaultOpen={[0]}
                data-testid="protocols-accordion"
              />
            </BentoCard>

            <BentoCard span={12} className="flex flex-col" data-testid="checkins-section">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <ClipboardList className="w-4 h-4 text-green-400" />
                  <span className="text-sm font-medium text-slate-300">Team Check-Ins</span>
                  <Badge className="bg-cyan-500/20 text-cyan-400 text-xs">{format(new Date(), 'MMM d')}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                    <Input
                      placeholder="Search..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8 h-8 w-48 bg-white/5 border-white/10 text-white text-sm"
                      data-testid="input-search"
                    />
                  </div>
                  <GlowButton size="sm" onClick={() => setAssignDialogOpen(true)} data-testid="button-add-assignment">
                    <Plus className="h-4 w-4" />
                    Add
                  </GlowButton>
                </div>
              </div>

              {loading ? (
                <div className="text-center py-8 text-white/60">Loading...</div>
              ) : filteredCheckIns.length === 0 ? (
                <div className="text-center py-8">
                  <Utensils className="h-10 w-10 mx-auto text-white/30 mb-3" />
                  <div className="text-white/60">No assignments for today</div>
                  <div className="text-sm text-white/40 mt-1">Create assignments to start checking in</div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {filteredCheckIns.map((checkIn) => (
                    <CheckInCard
                      key={checkIn.id}
                      checkIn={checkIn}
                      onCheckIn={handleCheckIn}
                      onCheckOut={handleCheckOut}
                      onNoShow={handleNoShow}
                    />
                  ))}
                </div>
              )}
            </BentoCard>
          </LayoutShell>
        </main>

        <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
          <DialogContent className="bg-slate-900 border-white/10 text-white">
            <DialogHeader>
              <DialogTitle>Add Assignment</DialogTitle>
              <DialogDescription className="text-white/60">
                Assign a cook to a stand for today
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label>Cook</Label>
                <Select value={selectedCook} onValueChange={setSelectedCook}>
                  <SelectTrigger className="bg-white/5 border-white/10" data-testid="select-cook">
                    <SelectValue placeholder="Select cook" />
                  </SelectTrigger>
                  <SelectContent>
                    {cooks.map((cook) => (
                      <SelectItem key={cook.id} value={cook.id}>{cook.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Stand</Label>
                <Select value={selectedStand} onValueChange={setSelectedStand}>
                  <SelectTrigger className="bg-white/5 border-white/10" data-testid="select-stand">
                    <SelectValue placeholder="Select stand" />
                  </SelectTrigger>
                  <SelectContent>
                    {stands.map((stand) => (
                      <SelectItem key={stand.id} value={stand.id}>{stand.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Position</Label>
                <Select value={selectedPosition} onValueChange={setSelectedPosition}>
                  <SelectTrigger className="bg-white/5 border-white/10" data-testid="select-position">
                    <SelectValue placeholder="Select position" />
                  </SelectTrigger>
                  <SelectContent>
                    {POSITIONS.map((position) => (
                      <SelectItem key={position} value={position}>{position}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Start Time</Label>
                  <Select value={selectedStartTime} onValueChange={setSelectedStartTime}>
                    <SelectTrigger className="bg-white/5 border-white/10" data-testid="select-start-time">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SHIFT_TIMES.map((time) => (
                        <SelectItem key={time.value} value={time.value}>{time.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>End Time</Label>
                  <Select value={selectedEndTime} onValueChange={setSelectedEndTime}>
                    <SelectTrigger className="bg-white/5 border-white/10" data-testid="select-end-time">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SHIFT_TIMES.map((time) => (
                        <SelectItem key={time.value} value={time.value}>{time.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setAssignDialogOpen(false)}
                className="border-white/10"
                data-testid="button-cancel-assignment"
              >
                Cancel
              </Button>
              <GlowButton onClick={handleCreateAssignment} data-testid="button-create-assignment">
                Create Assignment
              </GlowButton>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AnimatedBackground>
  );
}
