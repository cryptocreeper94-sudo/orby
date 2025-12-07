import { useState, useEffect } from "react";
import { useStore } from "@/lib/mockData";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  LogOut, Map, MessageSquare, Navigation, MapPin, 
  CheckCircle2, AlertTriangle, Clock, UserCheck, Briefcase, Route,
  ClipboardCheck, BookOpen, FileText, Users
} from "lucide-react";
import { useLocation } from "wouter";
import { Notepad } from "@/components/Notepad";
import { InteractiveMap } from "@/components/InteractiveMap";
import { WalkingDirections } from "@/components/WalkingDirections";
import { 
  LocationAcknowledgement, 
  useGeolocation, 
  isWithinGeofence,
  STADIUM_LOCATION,
  GEOFENCE_RADIUS_FEET 
} from "@/components/LocationAcknowledgement";
import { LayoutShell, BentoCard, CarouselRail, AccordionStack } from "@/components/ui/bento";

export default function TempStaffDashboard() {
  const logout = useStore((state) => state.logout);
  const [, setLocation] = useLocation();
  const currentUser = useStore((state) => state.currentUser);
  const [showMap, setShowMap] = useState(false);
  const [showDirections, setShowDirections] = useState(false);
  const [locationAccepted, setLocationAccepted] = useState(false);
  const [isOnSite, setIsOnSite] = useState(false);
  const [checkedIn, setCheckedIn] = useState(false);
  const [checkInTime, setCheckInTime] = useState<Date | null>(null);

  const { location, error, isLoading, requestLocation } = useGeolocation();

  useEffect(() => {
    if (locationAccepted) {
      requestLocation();
    }
  }, [locationAccepted]);

  useEffect(() => {
    if (location) {
      const onSite = isWithinGeofence(
        location.coords.latitude,
        location.coords.longitude,
        STADIUM_LOCATION.lat,
        STADIUM_LOCATION.lng,
        GEOFENCE_RADIUS_FEET
      );
      setIsOnSite(onSite);
    }
  }, [location]);

  const handleLogout = () => {
    logout();
    setLocation("/");
  };

  const handleCheckIn = () => {
    if (isOnSite || process.env.NODE_ENV === 'development') {
      setCheckedIn(true);
      setCheckInTime(new Date());
    }
  };

  const assignedPosition = {
    role: "Runner",
    section: "Section 312",
    floor: "Level 7 (300s)",
    stand: "Beer & Snacks",
    supervisor: "Sarah Johnson",
    shiftTime: "4:00 PM - 10:00 PM"
  };

  const assignmentMetrics = [
    { label: "Role", value: assignedPosition.role, icon: <Briefcase className="h-4 w-4 text-teal-400" /> },
    { label: "Section", value: assignedPosition.section, icon: <MapPin className="h-4 w-4 text-blue-400" /> },
    { label: "Stand", value: assignedPosition.stand, icon: <Users className="h-4 w-4 text-purple-400" /> },
    { label: "Shift", value: assignedPosition.shiftTime, icon: <Clock className="h-4 w-4 text-amber-400" /> },
  ];

  const tasks = [
    { id: "1", title: "Report to Section 312", status: "pending", priority: "high" },
    { id: "2", title: "Check in with supervisor", status: "pending", priority: "high" },
    { id: "3", title: "Complete safety briefing", status: "completed", priority: "medium" },
    { id: "4", title: "Review stand procedures", status: "pending", priority: "low" },
  ];

  const scheduleItems = [
    { time: "4:00 PM", task: "Clock in & report" },
    { time: "4:30 PM", task: "Pre-event prep" },
    { time: "5:00 PM", task: "Gates open" },
    { time: "10:00 PM", task: "Shift ends" },
  ];

  const guidelinesItems = [
    { 
      title: "Safety Guidelines", 
      content: (
        <ul className="space-y-1 text-xs">
          <li>• Always wear your ID badge</li>
          <li>• Report any incidents immediately</li>
          <li>• Follow emergency procedures</li>
          <li>• Keep walkways clear</li>
        </ul>
      )
    },
    { 
      title: "Uniform Policy", 
      content: (
        <ul className="space-y-1 text-xs">
          <li>• Black pants required</li>
          <li>• Company shirt must be visible</li>
          <li>• Closed-toe shoes only</li>
          <li>• No visible jewelry</li>
        </ul>
      )
    },
    { 
      title: "Break Policy", 
      content: (
        <p className="text-xs">
          You are entitled to a 15-minute break for every 4 hours worked. 
          Coordinate with your supervisor for break timing.
        </p>
      )
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 pb-20" data-testid="temp-staff-dashboard">
      <LocationAcknowledgement 
        onAccept={() => setLocationAccepted(true)}
        onDecline={() => setLocation("/")}
        storageKey="temp-location-acknowledged"
      />

      <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-teal-600 text-white px-4 shadow-md">
        <div className="flex items-center gap-2">
          <Briefcase className="h-6 w-6" />
          <span className="font-bold text-lg">Temp Staff</span>
        </div>
        <div className="flex-1" />
        <Button 
          variant="ghost" 
          size="icon" 
          className="text-white hover:bg-teal-700"
          onClick={() => setShowMap(true)}
          data-testid="button-show-map"
        >
          <Map className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon" onClick={handleLogout} className="text-white hover:bg-teal-700" data-testid="button-logout">
          <LogOut className="h-5 w-5" />
        </Button>
      </header>

      {showMap && (
        <div className="fixed inset-0 z-50 bg-background">
          <InteractiveMap 
            onClose={() => setShowMap(false)} 
            showNavigation={true}
            userLocation={location ? { lat: location.coords.latitude, lng: location.coords.longitude } : null}
          />
        </div>
      )}

      {showDirections && (
        <div className="fixed inset-0 z-50 bg-background p-4">
          <WalkingDirections 
            onClose={() => setShowDirections(false)}
            userLocation={location ? { lat: location.coords.latitude, lng: location.coords.longitude } : null}
            defaultDestination="312"
          />
        </div>
      )}

      <main className="p-3 max-w-6xl mx-auto">
        <div className="text-center py-3 mb-2">
          <h1 className="text-xl font-black text-slate-200" data-testid="text-welcome">
            Welcome, {currentUser?.name || 'Temp Staff'}
          </h1>
          <p className="text-sm text-muted-foreground">Temporary Staff Dashboard</p>
        </div>

        <LayoutShell className="gap-3">
          <BentoCard span={12} className={`${isOnSite ? 'border-green-500/50 bg-green-950/30' : 'border-amber-500/50 bg-amber-950/30'}`} data-testid="card-location-status">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MapPin className={`h-5 w-5 ${isOnSite ? 'text-green-500' : 'text-amber-500'}`} />
                <div>
                  {isLoading ? (
                    <p className="text-sm text-muted-foreground">Checking location...</p>
                  ) : error ? (
                    <p className="text-sm text-red-400">{error}</p>
                  ) : isOnSite ? (
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span className="text-green-400 font-medium text-sm">On-site at stadium</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                      <span className="text-amber-400 font-medium text-sm">Outside geofence</span>
                    </div>
                  )}
                </div>
              </div>
              <Button size="sm" variant="outline" onClick={requestLocation} disabled={isLoading} data-testid="button-refresh-location">
                <Navigation className="h-4 w-4 mr-1" />
                Refresh
              </Button>
            </div>
          </BentoCard>

          {!checkedIn ? (
            <BentoCard span={12} className="border-teal-500/40 bg-teal-950/40" data-testid="card-clock-in">
              <div className="text-center space-y-3 py-2">
                <Clock className="h-10 w-10 text-teal-400 mx-auto" />
                <div>
                  <h3 className="text-base font-bold text-teal-200">Clock In for Your Shift</h3>
                  <p className="text-xs text-teal-300">
                    {isOnSite ? "Ready to start?" : "Arrive at stadium to clock in"}
                  </p>
                  <p className="text-xs text-teal-400 mt-1">Shift: {assignedPosition.shiftTime}</p>
                </div>
                <Button 
                  className="w-full bg-teal-600 hover:bg-teal-700"
                  disabled={!isOnSite && process.env.NODE_ENV !== 'development'}
                  onClick={handleCheckIn}
                  data-testid="button-clock-in"
                >
                  <UserCheck className="h-5 w-5 mr-2" />
                  Clock In Now
                </Button>
                {process.env.NODE_ENV === 'development' && !isOnSite && (
                  <p className="text-xs text-muted-foreground">(Dev mode: Clock-in available)</p>
                )}
              </div>
            </BentoCard>
          ) : (
            <>
              <BentoCard span={12} className="border-green-500/40 bg-green-950/40" data-testid="card-clocked-in">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-900/50 rounded-full">
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    </div>
                    <div>
                      <p className="font-bold text-green-200 text-sm">Clocked In</p>
                      <p className="text-xs text-green-400">
                        {checkInTime?.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                  <Badge className="bg-green-600">On Shift</Badge>
                </div>
              </BentoCard>

              <BentoCard span={12} title="Assignment Metrics" data-testid="card-assignment-metrics">
                <CarouselRail
                  items={assignmentMetrics.map((metric, idx) => (
                    <div key={idx} className="w-32 p-3 bg-slate-800/50 rounded-lg border border-slate-700/50" data-testid={`metric-${metric.label.toLowerCase()}`}>
                      <div className="flex items-center gap-2 mb-1">
                        {metric.icon}
                        <span className="text-xs text-slate-400">{metric.label}</span>
                      </div>
                      <p className="text-sm font-bold text-slate-200">{metric.value}</p>
                    </div>
                  ))}
                  showDots
                />
              </BentoCard>

              <BentoCard span={6} title="Tasks" data-testid="card-tasks">
                <CarouselRail
                  items={tasks.map((task) => (
                    <div key={task.id} className="w-40 p-2 bg-slate-800/50 rounded-lg border border-slate-700/50" data-testid={`task-${task.id}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <ClipboardCheck className={`h-3 w-3 ${task.status === 'completed' ? 'text-green-400' : 'text-slate-400'}`} />
                        <Badge variant="outline" className={`text-[9px] px-1 ${task.priority === 'high' ? 'border-red-500/50 text-red-400' : task.priority === 'medium' ? 'border-amber-500/50 text-amber-400' : 'border-slate-500/50 text-slate-400'}`}>
                          {task.priority}
                        </Badge>
                      </div>
                      <p className={`text-xs ${task.status === 'completed' ? 'text-slate-500 line-through' : 'text-slate-200'}`}>{task.title}</p>
                    </div>
                  ))}
                />
              </BentoCard>

              <BentoCard span={6} title="Schedule" data-testid="card-schedule">
                <div className="grid grid-cols-2 gap-2">
                  {scheduleItems.map((item, idx) => (
                    <div key={idx} className="p-2 bg-slate-800/50 rounded-lg border border-slate-700/50" data-testid={`schedule-item-${idx}`}>
                      <p className="text-xs text-cyan-400 font-mono">{item.time}</p>
                      <p className="text-xs text-slate-300">{item.task}</p>
                    </div>
                  ))}
                </div>
              </BentoCard>

              <BentoCard span={12} title="Guidelines" data-testid="card-guidelines">
                <AccordionStack items={guidelinesItems} />
              </BentoCard>
            </>
          )}

          <BentoCard span={4} className="cursor-pointer hover:border-blue-400/50" data-testid="card-action-map">
            <div className="flex flex-col items-center justify-center text-center py-2" onClick={() => setShowMap(true)}>
              <div className="p-3 rounded-full bg-blue-900/30 mb-2">
                <Map className="h-5 w-5 text-blue-400" />
              </div>
              <span className="font-bold text-xs text-slate-200">Map</span>
            </div>
          </BentoCard>

          <BentoCard span={4} className="cursor-pointer hover:border-green-400/50" data-testid="card-action-directions">
            <div className="flex flex-col items-center justify-center text-center py-2" onClick={() => setShowDirections(true)}>
              <div className="p-3 rounded-full bg-green-900/30 mb-2">
                <Route className="h-5 w-5 text-green-400" />
              </div>
              <span className="font-bold text-xs text-slate-200">Directions</span>
            </div>
          </BentoCard>

          <BentoCard span={4} className="cursor-pointer hover:border-teal-400/50" data-testid="card-action-messages">
            <div className="flex flex-col items-center justify-center text-center py-2" onClick={() => setLocation('/messages')}>
              <div className="p-3 rounded-full bg-teal-900/30 mb-2">
                <MessageSquare className="h-5 w-5 text-teal-400" />
              </div>
              <span className="font-bold text-xs text-slate-200">Messages</span>
            </div>
          </BentoCard>

          <BentoCard span={12} data-testid="card-notepad">
            <Notepad storageKey="temp-notes" title="My Shift Notes" />
          </BentoCard>
        </LayoutShell>
      </main>
    </div>
  );
}
