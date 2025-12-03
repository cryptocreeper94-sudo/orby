import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ChefHat, 
  Calendar, 
  Plus, 
  ChevronLeft, 
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
  Utensils
} from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { 
  AnimatedBackground, 
  GlassCard, 
  GlassCardContent, 
  GlassCardHeader, 
  PageHeader,
  GlowButton
} from "@/components/ui/premium";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  const [selectedTab, setSelectedTab] = useState<string>('checkin');
  
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CheckedIn':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Checked In</Badge>;
      case 'CheckedOut':
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Checked Out</Badge>;
      case 'OnBreak':
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">On Break</Badge>;
      case 'NoShow':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">No Show</Badge>;
      default:
        return <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30">Scheduled</Badge>;
    }
  };

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

  return (
    <AnimatedBackground>
      <div className="min-h-screen pb-20">
        <PageHeader 
          title={`Welcome, ${currentUser?.name || 'Chef'}`}
          subtitle="Culinary Team Management"
          icon={<ChefHat className="h-8 w-8" />}
        />

        <div className="container mx-auto px-4 pt-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <GlassCard className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                  <Users className="h-5 w-5 text-cyan-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">{stats.total}</div>
                  <div className="text-xs text-white/60">Total Today</div>
                </div>
              </div>
            </GlassCard>
            
            <GlassCard className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-green-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">{stats.checkedIn}</div>
                  <div className="text-xs text-white/60">Checked In</div>
                </div>
              </div>
            </GlassCard>
            
            <GlassCard className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-yellow-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">{stats.scheduled}</div>
                  <div className="text-xs text-white/60">Waiting</div>
                </div>
              </div>
            </GlassCard>
            
            <GlassCard className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
                  <XCircle className="h-5 w-5 text-red-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">{stats.noShow}</div>
                  <div className="text-xs text-white/60">No Shows</div>
                </div>
              </div>
            </GlassCard>
          </div>

          <Tabs value={selectedTab} onValueChange={setSelectedTab} className="mb-6">
            <TabsList className="w-full bg-white/5 border border-white/10">
              <TabsTrigger value="checkin" className="flex-1" data-testid="tab-checkin">
                <Check className="h-4 w-4 mr-2" />
                Check-In
              </TabsTrigger>
              <TabsTrigger value="schedule" className="flex-1" data-testid="tab-schedule">
                <Calendar className="h-4 w-4 mr-2" />
                Schedule
              </TabsTrigger>
              <TabsTrigger value="team" className="flex-1" data-testid="tab-team">
                <Users className="h-4 w-4 mr-2" />
                Team
              </TabsTrigger>
            </TabsList>

            <TabsContent value="checkin" className="mt-4">
              <div className="flex gap-3 mb-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                  <Input
                    placeholder="Search by name, stand, or position..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-white/5 border-white/10 text-white"
                    data-testid="input-search"
                  />
                </div>
                <GlowButton onClick={() => setAssignDialogOpen(true)} data-testid="button-add-assignment">
                  <Plus className="h-4 w-4 mr-2" />
                  Add
                </GlowButton>
              </div>

              <ScrollArea className="h-[calc(100vh-400px)]">
                <div className="space-y-3">
                  {loading ? (
                    <div className="text-center py-8 text-white/60">Loading...</div>
                  ) : filteredCheckIns.length === 0 ? (
                    <GlassCard className="p-8 text-center">
                      <Utensils className="h-12 w-12 mx-auto text-white/30 mb-4" />
                      <div className="text-white/60">No assignments for today</div>
                      <div className="text-sm text-white/40 mt-2">Create assignments to start checking in your culinary team</div>
                    </GlassCard>
                  ) : (
                    filteredCheckIns.map((checkIn) => (
                      <motion.div
                        key={checkIn.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        <GlassCard className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500/30 to-purple-500/30 flex items-center justify-center">
                                <ChefHat className="h-6 w-6 text-cyan-400" />
                              </div>
                              <div>
                                <div className="font-medium text-white">{checkIn.cook_name}</div>
                                <div className="text-sm text-white/60">
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
                                    className="bg-green-500/20 hover:bg-green-500/30 text-green-400"
                                    onClick={() => handleCheckIn(checkIn.assignment_id)}
                                    data-testid={`button-checkin-${checkIn.id}`}
                                  >
                                    <Check className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    className="bg-red-500/20 hover:bg-red-500/30 text-red-400"
                                    onClick={() => handleNoShow(checkIn.assignment_id)}
                                    data-testid={`button-noshow-${checkIn.id}`}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              )}
                              
                              {checkIn.status === 'CheckedIn' && (
                                <Button
                                  size="sm"
                                  className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-400"
                                  onClick={() => handleCheckOut(checkIn.assignment_id)}
                                  data-testid={`button-checkout-${checkIn.id}`}
                                >
                                  <Coffee className="h-4 w-4 mr-1" />
                                  Out
                                </Button>
                              )}
                            </div>
                          </div>
                        </GlassCard>
                      </motion.div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="schedule" className="mt-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-white">Today's Schedule</h3>
                <Badge className="bg-cyan-500/20 text-cyan-400">{format(new Date(), 'EEEE, MMM d')}</Badge>
              </div>
              
              <ScrollArea className="h-[calc(100vh-400px)]">
                <div className="space-y-3">
                  {assignments.length === 0 ? (
                    <GlassCard className="p-8 text-center">
                      <Calendar className="h-12 w-12 mx-auto text-white/30 mb-4" />
                      <div className="text-white/60">No schedule for today</div>
                    </GlassCard>
                  ) : (
                    assignments.map((assignment) => (
                      <GlassCard key={assignment.id} className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-white">{assignment.cook_name}</div>
                            <div className="text-sm text-white/60">{assignment.position}</div>
                            <div className="text-xs text-white/40 mt-1">
                              {assignment.stand_name} | {assignment.shift_start} - {assignment.shift_end}
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-400 hover:bg-red-500/20"
                            data-testid={`button-delete-${assignment.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </GlassCard>
                    ))
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="team" className="mt-4">
              <ScrollArea className="h-[calc(100vh-400px)]">
                <div className="space-y-3">
                  {cooks.map((cook) => (
                    <GlassCard key={cook.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            cook.is_online ? 'bg-green-500/20' : 'bg-white/10'
                          }`}>
                            <User className={`h-5 w-5 ${cook.is_online ? 'text-green-400' : 'text-white/40'}`} />
                          </div>
                          <div>
                            <div className="font-medium text-white">{cook.name}</div>
                            <div className="text-sm text-white/60">PIN: {cook.pin}</div>
                          </div>
                        </div>
                        <Badge className={cook.is_online ? 'bg-green-500/20 text-green-400' : 'bg-white/10 text-white/40'}>
                          {cook.is_online ? 'Online' : 'Offline'}
                        </Badge>
                      </div>
                    </GlassCard>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>

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
                    {stands.slice(0, 20).map((stand: any) => (
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
                    {POSITIONS.map((pos) => (
                      <SelectItem key={pos} value={pos}>{pos}</SelectItem>
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
              <Button variant="ghost" onClick={() => setAssignDialogOpen(false)}>Cancel</Button>
              <GlowButton onClick={handleCreateAssignment} data-testid="button-confirm-assignment">
                Create Assignment
              </GlowButton>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AnimatedBackground>
  );
}
