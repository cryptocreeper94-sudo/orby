import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Beer, 
  Calendar, 
  Plus, 
  ChevronLeft, 
  Search, 
  Clock,
  User,
  Users,
  Trash2,
  Edit2,
  Check,
  X,
  AlertCircle
} from "lucide-react";
import { Link, useLocation } from "wouter";
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
import { format, addDays, startOfWeek, isSameDay, parseISO } from "date-fns";

type Bartender = {
  id: string;
  name: string;
  phone?: string;
  isActive: boolean;
  isOnline?: boolean;
};

type Shift = {
  id: string;
  bartenderId: string;
  date: string;
  startTime: string;
  endTime: string;
  location?: string;
};

const SHIFT_TIMES = [
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
  { value: "23:00", label: "11:00 PM" },
];

const LOCATIONS = [
  "Club Level Bar",
  "Field Level Bar",
  "Main Concourse Bar 1",
  "Main Concourse Bar 2",
  "Upper Deck Bar",
  "Party Deck Bar",
  "VIP Lounge",
  "Mobile Cart",
];

export default function BarScheduler() {
  const [, setLocation] = useLocation();
  const currentUser = useStore((state: { currentUser: any }) => state.currentUser);
  const { toast } = useToast();
  
  const [bartenders, setBartenders] = useState<Bartender[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState<string>('schedule');
  
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [shiftDialogOpen, setShiftDialogOpen] = useState(false);
  const [newBartenderName, setNewBartenderName] = useState('');
  const [newBartenderPhone, setNewBartenderPhone] = useState('');
  
  const [selectedBartender, setSelectedBartender] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [selectedStartTime, setSelectedStartTime] = useState<string>('');
  const [selectedEndTime, setSelectedEndTime] = useState<string>('');
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 0 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  useEffect(() => {
    async function fetchBartenders() {
      try {
        const response = await fetch('/api/users');
        if (response.ok) {
          const data = await response.json();
          const barWorkers = data.filter((u: any) => u.department === 'Bar');
          setBartenders(barWorkers.map((u: any) => ({
            id: u.id,
            name: u.name,
            phone: u.phone,
            isActive: true,
            isOnline: u.isOnline
          })));
        }
      } catch (error) {
        console.error('Failed to fetch bartenders:', error);
      } finally {
        setLoading(false);
      }
    }

    const savedShifts = localStorage.getItem('bar-scheduler-shifts');
    if (savedShifts) {
      setShifts(JSON.parse(savedShifts));
    }

    fetchBartenders();
  }, []);

  useEffect(() => {
    localStorage.setItem('bar-scheduler-shifts', JSON.stringify(shifts));
  }, [shifts]);

  const filteredBartenders = bartenders.filter(b => 
    b.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddBartender = async () => {
    if (!newBartenderName.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter a name for the bartender.",
        variant: "destructive"
      });
      return;
    }

    const newBartender: Bartender = {
      id: `bar-${Date.now()}`,
      name: newBartenderName.trim(),
      phone: newBartenderPhone.trim() || undefined,
      isActive: true,
    };

    setBartenders(prev => [...prev, newBartender]);
    setNewBartenderName('');
    setNewBartenderPhone('');
    setAddDialogOpen(false);

    toast({
      title: "Bartender Added",
      description: `${newBartender.name} has been added to your team.`,
    });
  };

  const handleAddShift = () => {
    if (!selectedBartender || !selectedDate || !selectedStartTime || !selectedEndTime) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    const newShift: Shift = {
      id: `shift-${Date.now()}`,
      bartenderId: selectedBartender,
      date: selectedDate,
      startTime: selectedStartTime,
      endTime: selectedEndTime,
      location: selectedLocation || undefined,
    };

    setShifts(prev => [...prev, newShift]);
    setSelectedBartender('');
    setSelectedStartTime('');
    setSelectedEndTime('');
    setSelectedLocation('');
    setShiftDialogOpen(false);

    toast({
      title: "Shift Added",
      description: "The shift has been scheduled successfully.",
    });
  };

  const handleRemoveShift = (shiftId: string) => {
    setShifts(prev => prev.filter(s => s.id !== shiftId));
    toast({
      title: "Shift Removed",
      description: "The shift has been removed from the schedule.",
    });
  };

  const handleRemoveBartender = (bartenderId: string) => {
    setBartenders(prev => prev.filter(b => b.id !== bartenderId));
    setShifts(prev => prev.filter(s => s.bartenderId !== bartenderId));
    toast({
      title: "Bartender Removed",
      description: "The bartender has been removed from your team.",
    });
  };

  const getShiftsForDay = (date: Date) => {
    return shifts.filter(s => isSameDay(parseISO(s.date), date));
  };

  const getBartenderName = (bartenderId: string) => {
    const bartender = bartenders.find(b => b.id === bartenderId);
    return bartender?.name || 'Unknown';
  };

  if (!currentUser || !['Developer', 'Admin', 'Management', 'Bar'].includes(currentUser.role)) {
    return (
      <AnimatedBackground>
        <div className="min-h-screen flex items-center justify-center p-4">
          <GlassCard className="max-w-md w-full">
            <GlassCardContent className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-amber-400 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-slate-200 mb-2">Access Restricted</h2>
              <p className="text-slate-400 mb-4">Bar scheduler is only available for bar management.</p>
              <Button onClick={() => setLocation('/')} className="bg-cyan-500 hover:bg-cyan-600">
                Return Home
              </Button>
            </GlassCardContent>
          </GlassCard>
        </div>
      </AnimatedBackground>
    );
  }

  return (
    <AnimatedBackground>
      <div className="min-h-screen pb-20" data-testid="bar-scheduler-page">
        <PageHeader
          title="Bar Scheduler"
          subtitle="Manage bartenders and shifts"
          icon={<Beer className="h-6 w-6 text-amber-400" />}
          iconColor="amber"
          actions={
            <Link href="/manager">
              <Button variant="ghost" size="sm" className="text-slate-300 hover:bg-white/10" data-testid="button-back">
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
            </Link>
          }
        />

        <main className="container mx-auto p-4 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search bartenders..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white/5 border-white/10 text-slate-200"
                data-testid="input-search-bartenders"
              />
            </div>
            <div className="flex gap-2">
              <GlowButton 
                variant="amber"
                onClick={() => setAddDialogOpen(true)}
                data-testid="button-add-bartender"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Bartender
              </GlowButton>
              <GlowButton 
                variant="cyan"
                onClick={() => setShiftDialogOpen(true)}
                data-testid="button-add-shift"
              >
                <Calendar className="h-4 w-4 mr-2" />
                Add Shift
              </GlowButton>
            </div>
          </div>

          <Tabs value={selectedTab} onValueChange={setSelectedTab} data-testid="bar-scheduler-tabs">
            <TabsList className="grid grid-cols-2 bg-white/5 w-full max-w-xs">
              <TabsTrigger value="schedule" className="text-xs data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400" data-testid="tab-schedule">
                <Calendar className="h-4 w-4 mr-1" />
                Schedule
              </TabsTrigger>
              <TabsTrigger value="team" className="text-xs data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400" data-testid="tab-team">
                <Users className="h-4 w-4 mr-1" />
                Team
              </TabsTrigger>
            </TabsList>

            <TabsContent value="schedule" className="mt-4">
              <GlassCard data-testid="card-weekly-schedule">
                <GlassCardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-cyan-500/20">
                      <Calendar className="h-4 w-4 text-cyan-400" />
                    </div>
                    <span className="font-bold text-sm text-slate-200">Weekly Schedule</span>
                  </div>
                </GlassCardHeader>
                <GlassCardContent className="pt-0">
                  <ScrollArea className="w-full">
                    <div className="grid grid-cols-7 gap-2 min-w-[700px]">
                      {weekDays.map((day, idx) => (
                        <div key={idx} className="min-w-[100px]">
                          <div className={`text-center p-2 rounded-t-lg ${
                            isSameDay(day, new Date()) 
                              ? 'bg-cyan-500/20 border-b-2 border-cyan-400' 
                              : 'bg-white/5'
                          }`}>
                            <div className="text-xs text-slate-400">{format(day, 'EEE')}</div>
                            <div className="text-lg font-bold text-slate-200">{format(day, 'd')}</div>
                          </div>
                          <div className="min-h-[200px] bg-white/5 p-2 space-y-2 rounded-b-lg">
                            <AnimatePresence>
                              {getShiftsForDay(day).map((shift, sIdx) => (
                                <motion.div
                                  key={shift.id}
                                  initial={{ opacity: 0, scale: 0.9 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  exit={{ opacity: 0, scale: 0.9 }}
                                  className="p-2 bg-amber-500/20 rounded-lg border border-amber-500/30 text-xs"
                                  data-testid={`shift-${shift.id}`}
                                >
                                  <div className="font-medium text-slate-200 truncate">
                                    {getBartenderName(shift.bartenderId)}
                                  </div>
                                  <div className="text-slate-400 flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {shift.startTime} - {shift.endTime}
                                  </div>
                                  {shift.location && (
                                    <div className="text-amber-400 truncate text-[10px] mt-1">
                                      {shift.location}
                                    </div>
                                  )}
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="w-full h-6 mt-1 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                    onClick={() => handleRemoveShift(shift.id)}
                                    data-testid={`button-remove-shift-${shift.id}`}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </motion.div>
                              ))}
                            </AnimatePresence>
                            {getShiftsForDay(day).length === 0 && (
                              <div className="text-center text-slate-600 text-xs py-4">
                                No shifts
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </GlassCardContent>
              </GlassCard>
            </TabsContent>

            <TabsContent value="team" className="mt-4">
              <GlassCard data-testid="card-bartender-team">
                <GlassCardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-amber-500/20">
                        <Users className="h-4 w-4 text-amber-400" />
                      </div>
                      <span className="font-bold text-sm text-slate-200">
                        Bartender Team ({filteredBartenders.length})
                      </span>
                    </div>
                  </div>
                </GlassCardHeader>
                <GlassCardContent className="pt-0">
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="w-6 h-6 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" />
                    </div>
                  ) : filteredBartenders.length === 0 ? (
                    <div className="text-center py-8">
                      <Users className="h-12 w-12 text-slate-600 mx-auto mb-3" />
                      <p className="text-slate-400">No bartenders found</p>
                      <p className="text-sm text-slate-500 mt-1">Add bartenders to get started</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      <AnimatePresence>
                        {filteredBartenders.map((bartender, idx) => (
                          <motion.div
                            key={bartender.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ delay: idx * 0.05 }}
                            className="p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-colors"
                            data-testid={`bartender-${bartender.id}`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                                  <Beer className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-slate-200">{bartender.name}</span>
                                    {bartender.isOnline && (
                                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                    )}
                                  </div>
                                  {bartender.phone && (
                                    <span className="text-xs text-slate-400">{bartender.phone}</span>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-cyan-400 hover:bg-cyan-500/10"
                                  onClick={() => {
                                    setSelectedBartender(bartender.id);
                                    setShiftDialogOpen(true);
                                  }}
                                  data-testid={`button-schedule-${bartender.id}`}
                                >
                                  <Calendar className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-red-400 hover:bg-red-500/10"
                                  onClick={() => handleRemoveBartender(bartender.id)}
                                  data-testid={`button-remove-${bartender.id}`}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                            <div className="mt-3 text-xs text-slate-500">
                              {shifts.filter(s => s.bartenderId === bartender.id).length} shifts scheduled this week
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  )}
                </GlassCardContent>
              </GlassCard>
            </TabsContent>
          </Tabs>
        </main>

        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogContent className="bg-slate-900 border-slate-700" data-testid="dialog-add-bartender">
            <DialogHeader>
              <DialogTitle className="text-slate-200">Add Bartender</DialogTitle>
              <DialogDescription className="text-slate-400">
                Add a new bartender to your team
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Name *</Label>
                <Input
                  value={newBartenderName}
                  onChange={(e) => setNewBartenderName(e.target.value)}
                  placeholder="Enter bartender's name"
                  className="bg-white/5 border-white/10 text-slate-200"
                  data-testid="input-bartender-name"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Phone (optional)</Label>
                <Input
                  value={newBartenderPhone}
                  onChange={(e) => setNewBartenderPhone(e.target.value)}
                  placeholder="Enter phone number"
                  className="bg-white/5 border-white/10 text-slate-200"
                  data-testid="input-bartender-phone"
                />
              </div>
            </div>
            <DialogFooter className="mt-4">
              <Button variant="ghost" onClick={() => setAddDialogOpen(false)} data-testid="button-cancel-add">
                Cancel
              </Button>
              <Button onClick={handleAddBartender} className="bg-amber-500 hover:bg-amber-600" data-testid="button-confirm-add">
                Add Bartender
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={shiftDialogOpen} onOpenChange={setShiftDialogOpen}>
          <DialogContent className="bg-slate-900 border-slate-700" data-testid="dialog-add-shift">
            <DialogHeader>
              <DialogTitle className="text-slate-200">Schedule Shift</DialogTitle>
              <DialogDescription className="text-slate-400">
                Add a shift to the schedule
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Bartender *</Label>
                <Select value={selectedBartender} onValueChange={setSelectedBartender}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-slate-200" data-testid="select-bartender">
                    <SelectValue placeholder="Select bartender" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    {bartenders.map(b => (
                      <SelectItem key={b.id} value={b.id} className="text-slate-200">
                        {b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Date *</Label>
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-white/5 border-white/10 text-slate-200"
                  data-testid="input-shift-date"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">Start Time *</Label>
                  <Select value={selectedStartTime} onValueChange={setSelectedStartTime}>
                    <SelectTrigger className="bg-white/5 border-white/10 text-slate-200" data-testid="select-start-time">
                      <SelectValue placeholder="Start" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      {SHIFT_TIMES.map(t => (
                        <SelectItem key={t.value} value={t.value} className="text-slate-200">
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">End Time *</Label>
                  <Select value={selectedEndTime} onValueChange={setSelectedEndTime}>
                    <SelectTrigger className="bg-white/5 border-white/10 text-slate-200" data-testid="select-end-time">
                      <SelectValue placeholder="End" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      {SHIFT_TIMES.map(t => (
                        <SelectItem key={t.value} value={t.value} className="text-slate-200">
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Location (optional)</Label>
                <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-slate-200" data-testid="select-location">
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    {LOCATIONS.map(loc => (
                      <SelectItem key={loc} value={loc} className="text-slate-200">
                        {loc}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter className="mt-4">
              <Button variant="ghost" onClick={() => setShiftDialogOpen(false)} data-testid="button-cancel-shift">
                Cancel
              </Button>
              <Button onClick={handleAddShift} className="bg-cyan-500 hover:bg-cyan-600" data-testid="button-confirm-shift">
                Add Shift
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AnimatedBackground>
  );
}
