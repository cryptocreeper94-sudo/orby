import { useState, useEffect } from "react";
import { useStore } from "@/lib/mockData";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  LogOut, Map, MessageSquare, Navigation, MapPin, 
  CheckCircle2, AlertTriangle, Clock, Users, Building2, Route, ClipboardList,
  ScanLine, Sparkles, BookOpen, Shield
} from "lucide-react";
import { useLocation } from "wouter";
import { Notepad } from "@/components/Notepad";
import { InteractiveMap } from "@/components/InteractiveMap";
import { WalkingDirections } from "@/components/WalkingDirections";
import { CounterLogin } from "@/components/CounterLogin";
import { CountSheet } from "@/components/CountSheet";
import { QuickScanModal } from "@/components/QuickScanModal";
import { TutorialHelpButton } from "@/components/TutorialCoach";
import { 
  LocationAcknowledgement, 
  useGeolocation, 
  isWithinGeofence,
  STADIUM_LOCATION,
  GEOFENCE_RADIUS_FEET 
} from "@/components/LocationAcknowledgement";
import { motion } from "framer-motion";
import { AnimatedBackground, PageHeader, GlowButton } from "@/components/ui/premium";
import { TeamLeadCard } from "@/components/TeamLeadCard";
import ComplianceAlertPanel from '@/components/ComplianceAlertPanel';
import { GlobalModeBar } from '@/components/GlobalModeBar';
import { PersonalizedWelcomeTour } from '@/components/PersonalizedWelcomeTour';
import { LayoutShell, BentoCard, CarouselRail, AccordionStack } from "@/components/ui/bento";

type CountSession = {
  id: string;
  standId: string;
  eventDate: string;
  stage: 'PreEvent' | 'PostEvent' | 'DayAfter';
  counterName: string;
  counterRole: 'NPOLead' | 'Supervisor' | 'Manager' | 'ManagerAssistant';
  counterPhoneLast4: string;
  status: 'InProgress' | 'Completed' | 'Verified';
  startedAt: string;
  completedAt?: string;
};

type Item = {
  id: string;
  name: string;
  category: string;
  price: number;
};

export default function NPODashboard() {
  const logout = useStore((state) => state.logout);
  const [, setLocation] = useLocation();
  const currentUser = useStore((state) => state.currentUser);
  const [showMap, setShowMap] = useState(false);
  const [showDirections, setShowDirections] = useState(false);
  const [showCounterLogin, setShowCounterLogin] = useState(false);
  const [showCountSheet, setShowCountSheet] = useState(false);
  const [showQuickScan, setShowQuickScan] = useState(false);
  const [activeSession, setActiveSession] = useState<CountSession | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [locationAccepted, setLocationAccepted] = useState(false);
  const [isOnSite, setIsOnSite] = useState(false);
  const [checkedIn, setCheckedIn] = useState(false);
  const [checkInTime, setCheckInTime] = useState<Date | null>(null);

  const { location, error, isLoading, requestLocation } = useGeolocation();

  useEffect(() => {
    fetch('/api/items')
      .then(res => res.json())
      .then(data => setItems(data))
      .catch(err => console.error('Failed to load items:', err));
  }, []);

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

  const handleStartCountSession = async (sessionData: {
    counterName: string;
    counterRole: 'NPOLead' | 'Supervisor' | 'Manager' | 'ManagerAssistant';
    counterPhoneLast4: string;
    stage: 'PreEvent' | 'PostEvent' | 'DayAfter';
  }) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await fetch('/api/count-sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          standId: assignedSection.standId,
          eventDate: today,
          ...sessionData
        })
      });
      
      if (response.ok) {
        const session = await response.json();
        setActiveSession(session);
        setShowCounterLogin(false);
        setShowCountSheet(true);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to start count session');
      }
    } catch (err) {
      console.error('Failed to start count session:', err);
      alert('Failed to start count session');
    }
  };

  const handleSaveCount = async (itemId: string, count: number) => {
    if (!activeSession) return;
    
    try {
      await fetch('/api/inventory/counts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          standId: activeSession.standId,
          itemId,
          eventDate: activeSession.eventDate,
          sessionId: activeSession.id,
          startCount: activeSession.stage === 'PreEvent' ? count : 0,
          endCount: activeSession.stage === 'PostEvent' ? count : 0
        })
      });
      setCounts(prev => ({ ...prev, [itemId]: count }));
    } catch (err) {
      console.error('Failed to save count:', err);
    }
  };

  const handleCompleteSession = async () => {
    if (!activeSession) return;
    
    try {
      const response = await fetch(`/api/count-sessions/${activeSession.id}/complete`, {
        method: 'PATCH'
      });
      
      if (response.ok) {
        const updatedSession = await response.json();
        setActiveSession(updatedSession);
        alert('Count completed successfully!');
        setShowCountSheet(false);
      }
    } catch (err) {
      console.error('Failed to complete session:', err);
    }
  };

  const assignedSection = {
    standId: '105S',
    name: "Section 105",
    floor: "Level 2",
    stand: "Hot Dogs & Drinks",
    supervisor: "Mike Smith"
  };

  const donationMetrics = [
    { label: 'Section', value: assignedSection.name, icon: <Building2 className="h-4 w-4" />, color: 'blue' },
    { label: 'Floor', value: assignedSection.floor, icon: <MapPin className="h-4 w-4" />, color: 'emerald' },
    { label: 'Stand', value: assignedSection.stand, icon: <ClipboardList className="h-4 w-4" />, color: 'amber' },
    { label: 'Supervisor', value: assignedSection.supervisor, icon: <Users className="h-4 w-4" />, color: 'purple' },
  ];

  const metricsCarouselItems = donationMetrics.map((metric, idx) => (
    <div 
      key={idx}
      data-testid={`donation-metric-${metric.label.toLowerCase()}`}
      className={`p-4 rounded-xl bg-slate-800/60 border border-white/10 min-w-[130px] hover:border-${metric.color}-400/50 transition-colors`}
    >
      <div className={`p-2 rounded-lg bg-${metric.color}-500/20 w-fit mb-2`}>
        <div className={`text-${metric.color}-400`}>{metric.icon}</div>
      </div>
      <p className="text-[10px] text-slate-500 uppercase tracking-wider">{metric.label}</p>
      <p className="font-bold text-sm text-slate-200">{metric.value}</p>
    </div>
  ));

  const volunteerActions = [
    { icon: <Route className="h-5 w-5" />, label: "Directions", color: "blue", onClick: () => setShowDirections(true), testId: "action-directions" },
    { icon: <ClipboardList className="h-5 w-5" />, label: "Pre-Event Count", color: "emerald", onClick: () => setShowCounterLogin(true), testId: "start-pre-event-count" },
  ];

  const volunteersCarouselItems = volunteerActions.map((action, idx) => (
    <motion.div 
      key={idx}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      data-testid={action.testId}
      className={`p-5 rounded-xl bg-gradient-to-br from-${action.color}-500 to-${action.color}-600 min-w-[160px] cursor-pointer shadow-lg`}
      onClick={action.onClick}
    >
      <div className="p-2 bg-white/20 rounded-lg w-fit mb-2">
        <div className="text-white">{action.icon}</div>
      </div>
      <div className="font-bold text-white">{action.label}</div>
    </motion.div>
  ));

  const eventsGridItems = [
    { icon: <Map className="h-5 w-5" />, label: "Map", color: "blue", onClick: () => setShowMap(true), testId: "nav-map" },
    { icon: <Route className="h-5 w-5" />, label: "Directions", color: "emerald", onClick: () => setShowDirections(true), testId: "nav-directions" },
    { icon: <MessageSquare className="h-5 w-5" />, label: "Messages", color: "violet", onClick: () => setLocation('/messages'), testId: "nav-messages" },
  ];

  const complianceAccordionItems = [
    {
      title: "NPO Guidelines",
      content: (
        <ul className="space-y-2 text-sm">
          <li className="flex items-start gap-2"><span className="text-emerald-400">•</span> Arrive 30 minutes before shift starts</li>
          <li className="flex items-start gap-2"><span className="text-emerald-400">•</span> Wear required uniform and badge</li>
          <li className="flex items-start gap-2"><span className="text-emerald-400">•</span> Follow food safety protocols</li>
          <li className="flex items-start gap-2"><span className="text-emerald-400">•</span> Report to supervisor for shift assignment</li>
        </ul>
      )
    },
    {
      title: "Food Safety Compliance",
      content: (
        <ul className="space-y-2 text-sm">
          <li className="flex items-start gap-2"><span className="text-amber-400">•</span> Wash hands before handling food</li>
          <li className="flex items-start gap-2"><span className="text-amber-400">•</span> Use gloves when required</li>
          <li className="flex items-start gap-2"><span className="text-amber-400">•</span> Check food temperatures regularly</li>
          <li className="flex items-start gap-2"><span className="text-amber-400">•</span> Report any food safety concerns</li>
        </ul>
      )
    },
    {
      title: "Cash Handling Rules",
      content: (
        <ul className="space-y-2 text-sm">
          <li className="flex items-start gap-2"><span className="text-cyan-400">•</span> Count cash with supervisor present</li>
          <li className="flex items-start gap-2"><span className="text-cyan-400">•</span> Use register for all transactions</li>
          <li className="flex items-start gap-2"><span className="text-cyan-400">•</span> Report discrepancies immediately</li>
          <li className="flex items-start gap-2"><span className="text-cyan-400">•</span> Never leave register unattended</li>
        </ul>
      )
    },
    {
      title: "Emergency Procedures",
      content: (
        <ul className="space-y-2 text-sm">
          <li className="flex items-start gap-2"><span className="text-red-400">•</span> Know your nearest exit</li>
          <li className="flex items-start gap-2"><span className="text-red-400">•</span> Follow supervisor instructions</li>
          <li className="flex items-start gap-2"><span className="text-red-400">•</span> Help customers evacuate calmly</li>
          <li className="flex items-start gap-2"><span className="text-red-400">•</span> Report to designated meeting point</li>
        </ul>
      )
    },
  ];

  return (
    <AnimatedBackground>
      <PersonalizedWelcomeTour />
      <GlobalModeBar />
      <div className="min-h-screen pb-20" data-testid="npo-dashboard">
        <LocationAcknowledgement 
          onAccept={() => setLocationAccepted(true)}
          onDecline={() => setLocation("/")}
          storageKey="npo-location-acknowledged"
        />

        <PageHeader
          title="NPO Staff"
          subtitle={`Welcome, ${currentUser?.name || 'NPO Staff'}`}
          icon={<Users className="h-5 w-5" />}
          iconColor="purple"
          actions={
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-slate-300 hover:bg-white/10"
                onClick={() => setShowMap(true)}
                data-testid="button-map"
              >
                <Map className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" onClick={handleLogout} className="text-slate-300 hover:bg-white/10" data-testid="button-logout">
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          }
        />

        {showMap && (
          <div className="fixed inset-0 z-50 bg-slate-950">
            <InteractiveMap 
              onClose={() => setShowMap(false)} 
              showNavigation={true}
              userLocation={location ? { lat: location.coords.latitude, lng: location.coords.longitude } : null}
            />
          </div>
        )}

        {showDirections && (
          <div className="fixed inset-0 z-50 bg-slate-950 p-4">
            <WalkingDirections 
              onClose={() => setShowDirections(false)}
              userLocation={location ? { lat: location.coords.latitude, lng: location.coords.longitude } : null}
              defaultDestination="105"
            />
          </div>
        )}

        {showCounterLogin && (
          <div className="fixed inset-0 z-50 bg-slate-950 p-4">
            <CounterLogin
              standId={assignedSection.standId}
              standName={`${assignedSection.name} - ${assignedSection.stand}`}
              eventDate={new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
              allowedStages={['PreEvent']}
              defaultStage="PreEvent"
              onStartSession={handleStartCountSession}
              onClose={() => setShowCounterLogin(false)}
            />
          </div>
        )}

        {showCountSheet && activeSession && (
          <div className="fixed inset-0 z-50 bg-slate-950 p-4">
            <CountSheet
              session={activeSession}
              standName={`${assignedSection.name} - ${assignedSection.stand}`}
              items={items}
              existingCounts={counts}
              onSaveCount={handleSaveCount}
              onCompleteSession={handleCompleteSession}
              onClose={() => setShowCountSheet(false)}
            />
          </div>
        )}

        {showQuickScan && (
          <QuickScanModal
            onClose={() => setShowQuickScan(false)}
            standName={`${assignedSection.name} - ${assignedSection.stand}`}
            onScanComplete={(items) => {
              console.log('Scanned items:', items);
            }}
          />
        )}

        <main className="p-4 sm:px-6 max-w-6xl mx-auto">
          <div className="mb-4">
            <ComplianceAlertPanel 
              userId={currentUser?.id} 
              userName={currentUser?.name} 
              isManager={false}
            />
          </div>

          <LayoutShell data-testid="bento-layout">
            <BentoCard span={12} data-testid="location-status-card">
              <div className={`p-4 rounded-xl border-2 ${isOnSite ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-amber-500/40 bg-amber-500/5'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${isOnSite ? 'bg-emerald-500/20' : 'bg-amber-500/20'}`}>
                      <MapPin className={`h-5 w-5 ${isOnSite ? 'text-emerald-400' : 'text-amber-400'}`} />
                    </div>
                    <div>
                      <span className="font-bold text-sm text-slate-200">Location Status</span>
                      {isLoading ? (
                        <p className="text-sm text-slate-400">Checking location...</p>
                      ) : error ? (
                        <p className="text-sm text-red-400">{error}</p>
                      ) : isOnSite ? (
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                          <span className="text-emerald-400 font-medium text-sm">On-site at stadium</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-amber-400" />
                          <span className="text-amber-400 font-medium text-sm">Outside geofence</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={requestLocation}
                    disabled={isLoading}
                    className="bg-white/5 border-white/10 text-slate-300 hover:bg-white/10"
                    data-testid="refresh-location"
                  >
                    <Navigation className="h-4 w-4 mr-1" />
                    Refresh
                  </Button>
                </div>
              </div>
            </BentoCard>

            {!checkedIn ? (
              <BentoCard span={12} className="border-2 border-violet-500/40" data-testid="checkin-card">
                <div className="p-4 text-center space-y-4">
                  <div className="p-4 rounded-2xl bg-violet-500/20 w-fit mx-auto">
                    <Clock className="h-10 w-10 text-violet-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-violet-200">Ready to Check In?</h3>
                    <p className="text-sm text-violet-300/80">
                      {isOnSite 
                        ? "You're at the stadium. Tap below to start your shift."
                        : "Please arrive at the stadium to check in (geofence: 100ft radius)."
                      }
                    </p>
                  </div>
                  <GlowButton 
                    className="w-full"
                    disabled={!isOnSite && process.env.NODE_ENV !== 'development'}
                    onClick={handleCheckIn}
                    data-testid="check-in-btn"
                  >
                    <CheckCircle2 className="h-5 w-5 mr-2" />
                    Check In Now
                  </GlowButton>
                  {process.env.NODE_ENV === 'development' && !isOnSite && (
                    <p className="text-xs text-slate-500">(Dev mode: Check-in available regardless of location)</p>
                  )}
                </div>
              </BentoCard>
            ) : (
              <>
                <BentoCard span={12} className="border-2 border-emerald-500/40" data-testid="checked-in-card">
                  <div className="flex items-center justify-between p-2">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-emerald-500/20 rounded-xl">
                        <CheckCircle2 className="h-6 w-6 text-emerald-400" />
                      </div>
                      <div>
                        <p className="font-bold text-emerald-200">Checked In</p>
                        <p className="text-sm text-emerald-400/80">
                          {checkInTime?.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                    <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">Active</Badge>
                  </div>
                </BentoCard>

                <BentoCard span={12} title="Your Assignment" data-testid="assignment-metrics-card">
                  <CarouselRail 
                    items={metricsCarouselItems} 
                    showDots
                    data-testid="donation-metrics-carousel"
                  />
                </BentoCard>

                <BentoCard span={12} data-testid="quick-scan-card">
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className="w-full p-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25"
                    onClick={() => setShowQuickScan(true)}
                    data-testid="quick-scan-btn"
                  >
                    <div className="flex items-center justify-center gap-3">
                      <div className="p-2 bg-white/20 rounded-lg">
                        <ScanLine className="h-6 w-6" />
                      </div>
                      <div className="text-left">
                        <div className="font-bold flex items-center gap-1">
                          <Sparkles className="h-4 w-4" />
                          Quick AI Scan
                        </div>
                        <div className="text-xs text-white/80">Scan cooler or paper sheet</div>
                      </div>
                    </div>
                  </motion.button>
                </BentoCard>
              </>
            )}

            <BentoCard span={8} className="lg:col-span-8 md:col-span-6 col-span-4" data-testid="volunteers-card">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 rounded-lg bg-emerald-500/20">
                  <ClipboardList className="h-4 w-4 text-emerald-400" />
                </div>
                <span className="font-bold text-sm text-slate-200">Quick Actions</span>
              </div>
              <CarouselRail 
                items={volunteersCarouselItems}
                data-testid="volunteers-carousel"
              />
            </BentoCard>

            <BentoCard span={4} className="lg:col-span-4 md:col-span-6 col-span-4 row-span-2" data-testid="compliance-card">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 rounded-lg bg-violet-500/20">
                  <Shield className="h-4 w-4 text-violet-400" />
                </div>
                <span className="font-bold text-sm text-slate-200">Compliance</span>
              </div>
              <AccordionStack 
                items={complianceAccordionItems} 
                defaultOpen={[0]}
                data-testid="compliance-accordion"
              />
            </BentoCard>

            <BentoCard span={8} className="lg:col-span-8 md:col-span-6 col-span-4" data-testid="events-grid-card">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 rounded-lg bg-blue-500/20">
                  <Map className="h-4 w-4 text-blue-400" />
                </div>
                <span className="font-bold text-sm text-slate-200">Navigation</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {eventsGridItems.map((item) => (
                  <motion.div
                    key={item.testId}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`p-4 rounded-xl bg-slate-800/40 border border-white/10 cursor-pointer text-center hover:border-${item.color}-500/30 transition-colors`}
                    onClick={item.onClick}
                    data-testid={item.testId}
                  >
                    <div className={`p-3 rounded-xl bg-${item.color}-500/20 w-fit mx-auto mb-2`}>
                      <div className={`text-${item.color}-400`}>{item.icon}</div>
                    </div>
                    <div className="font-bold text-xs text-slate-200">{item.label}</div>
                  </motion.div>
                ))}
              </div>
            </BentoCard>

            <BentoCard span={6} className="lg:col-span-6 md:col-span-6 col-span-4" data-testid="team-lead-card">
              <TeamLeadCard />
            </BentoCard>

            <BentoCard span={6} className="lg:col-span-6 md:col-span-6 col-span-4" data-testid="notepad-card">
              <Notepad storageKey="npo-notes" title="My Shift Notes" />
            </BentoCard>
          </LayoutShell>
        </main>
        
        <TutorialHelpButton page="npo" />
      </div>
    </AnimatedBackground>
  );
}
