import { useState, useEffect } from "react";
import { useStore } from "@/lib/mockData";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  LogOut, Map, MessageSquare, ClipboardList, AlertTriangle, 
  Building2, Route, Send, Thermometer, Zap,
  Tv, UtensilsCrossed, Wrench, Users, HelpCircle, ScanLine, Sparkles, BookOpen
} from "lucide-react";
import { useLocation } from "wouter";
import { Notepad } from "@/components/Notepad";
import { InteractiveMap } from "@/components/InteractiveMap";
import { WalkingDirections } from "@/components/WalkingDirections";
import { CounterLogin } from "@/components/CounterLogin";
import { CountSheet } from "@/components/CountSheet";
import { QuickScanModal } from "@/components/QuickScanModal";
import { TutorialHelpButton } from "@/components/TutorialCoach";
import ComplianceAlertPanel from '@/components/ComplianceAlertPanel';
import { GlobalModeBar } from '@/components/GlobalModeBar';
import { PersonalizedWelcomeTour } from '@/components/PersonalizedWelcomeTour';
import { AnimatedBackground, PageHeader } from "@/components/ui/premium";
import { motion } from "framer-motion";
import { LayoutShell, BentoCard, CarouselRail, AccordionStack } from "@/components/ui/bento";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

type CounterRole = 'NPOLead' | 'StandLead' | 'Supervisor' | 'Manager' | 'ManagerAssistant';

type CountSession = {
  id: string;
  standId: string;
  eventDate: string;
  stage: 'PreEvent' | 'PostEvent' | 'DayAfter';
  counterName: string;
  counterRole: CounterRole;
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

const ISSUE_CATEGORIES = [
  { id: 'Cooling', label: 'Cooling/Refrigeration', icon: Thermometer, color: 'text-blue-600' },
  { id: 'Beverage', label: 'Beverage/Fountain', icon: UtensilsCrossed, color: 'text-cyan-600' },
  { id: 'Power', label: 'Power/Electrical', icon: Zap, color: 'text-yellow-600' },
  { id: 'AV', label: 'TV/Audio/Visual', icon: Tv, color: 'text-purple-600' },
  { id: 'Menu', label: 'Menu Boards', icon: ClipboardList, color: 'text-orange-600' },
  { id: 'FoodSafety', label: 'Food Safety', icon: UtensilsCrossed, color: 'text-red-600' },
  { id: 'Equipment', label: 'Equipment', icon: Wrench, color: 'text-gray-600' },
  { id: 'Staffing', label: 'Staffing', icon: Users, color: 'text-indigo-600' },
  { id: 'Other', label: 'Other', icon: HelpCircle, color: 'text-slate-600' },
];

export default function StandLeadDashboard() {
  const logout = useStore((state) => state.logout);
  const [, setLocation] = useLocation();
  const currentUser = useStore((state) => state.currentUser);
  const [showMap, setShowMap] = useState(false);
  const [showDirections, setShowDirections] = useState(false);
  const [showCounterLogin, setShowCounterLogin] = useState(false);
  const [showCountSheet, setShowCountSheet] = useState(false);
  const [showQuickScan, setShowQuickScan] = useState(false);
  const [showIssueForm, setShowIssueForm] = useState(false);
  const [activeSession, setActiveSession] = useState<CountSession | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [issueCategory, setIssueCategory] = useState('');
  const [issueSeverity, setIssueSeverity] = useState<'Emergency' | 'High' | 'Normal' | 'Low'>('Normal');
  const [issueTitle, setIssueTitle] = useState('');
  const [issueDescription, setIssueDescription] = useState('');

  const assignedSection = {
    standId: '105S',
    name: "Section 105",
    floor: "Level 2",
    stand: "Ice Crown",
    supervisor: "Sarah"
  };

  useEffect(() => {
    fetch('/api/items')
      .then(res => res.json())
      .then(data => setItems(data))
      .catch(err => console.error('Failed to load items:', err));
  }, []);

  const handleLogout = () => {
    logout();
    setLocation("/");
  };

  const handleStartCountSession = async (sessionData: {
    counterName: string;
    counterRole: 'NPOLead' | 'StandLead' | 'Supervisor' | 'Manager' | 'ManagerAssistant';
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
        
        const countsRes = await fetch(`/api/count-sessions/${session.id}/counts`);
        if (countsRes.ok) {
          const existingCounts = await countsRes.json();
          const countsMap: Record<string, number> = {};
          existingCounts.forEach((c: { itemId: string; quantity: number }) => {
            countsMap[c.itemId] = c.quantity;
          });
          setCounts(countsMap);
        }
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to start count session');
      }
    } catch (err) {
      console.error('Failed to start count session:', err);
      alert('Failed to start count session');
    }
  };

  const handleSaveCount = async (itemId: string, quantity: number) => {
    if (!activeSession) return;
    
    try {
      await fetch('/api/inventory-counts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          standId: activeSession.standId,
          itemId,
          eventDate: activeSession.eventDate,
          stage: activeSession.stage,
          quantity,
          counterId: activeSession.id
        })
      });
      setCounts(prev => ({ ...prev, [itemId]: quantity }));
    } catch (err) {
      console.error('Failed to save count:', err);
    }
  };

  const handleCompleteSession = async () => {
    if (!activeSession) return;
    
    try {
      const response = await fetch(`/api/count-sessions/${activeSession.id}/complete`, {
        method: 'POST'
      });
      
      if (response.ok) {
        setActiveSession(null);
        setCounts({});
        alert('Count completed successfully!');
        setShowCountSheet(false);
      }
    } catch (err) {
      console.error('Failed to complete session:', err);
    }
  };

  const handleSubmitIssue = async () => {
    if (!issueCategory || !issueTitle || !issueDescription) {
      alert('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/stand-issues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reporterId: currentUser?.id,
          standId: assignedSection.standId,
          category: issueCategory,
          severity: issueSeverity,
          title: issueTitle,
          description: issueDescription,
          location: `${assignedSection.name} - ${assignedSection.stand}`
        })
      });

      if (response.ok) {
        alert(issueSeverity === 'Emergency' 
          ? 'Emergency issue reported! Management has been notified immediately.' 
          : 'Issue reported successfully!');
        setShowIssueForm(false);
        setIssueCategory('');
        setIssueSeverity('Normal');
        setIssueTitle('');
        setIssueDescription('');
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to report issue');
      }
    } catch (err) {
      console.error('Failed to submit issue:', err);
      alert('Failed to submit issue');
    } finally {
      setIsSubmitting(false);
    }
  };

  const standMetrics = [
    { label: 'Section', value: assignedSection.name, color: 'blue' },
    { label: 'Floor', value: assignedSection.floor, color: 'emerald' },
    { label: 'Stand', value: assignedSection.stand, color: 'amber' },
    { label: 'Supervisor', value: assignedSection.supervisor, color: 'purple' },
  ];

  const metricsCarouselItems = standMetrics.map((metric, idx) => (
    <div 
      key={idx}
      data-testid={`stand-metric-${metric.label.toLowerCase()}`}
      className={`p-4 rounded-xl bg-slate-800/60 border border-white/10 min-w-[120px] hover:border-${metric.color}-400/50 transition-colors`}
    >
      <p className="text-[10px] text-slate-500 uppercase tracking-wider">{metric.label}</p>
      <p className="font-bold text-lg text-slate-200">{metric.value}</p>
    </div>
  ));

  const quickActions = [
    { icon: <ClipboardList className="h-5 w-5" />, label: "Pre-Event Count", color: "emerald", onClick: () => setShowCounterLogin(true), testId: "start-pre-event-count" },
    { icon: <AlertTriangle className="h-5 w-5" />, label: "Report Issue", color: "red", onClick: () => setShowIssueForm(true), testId: "report-issue" },
  ];

  const inventoryCarouselItems = quickActions.map((action, idx) => (
    <motion.div 
      key={idx}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      data-testid={action.testId}
      className={`p-5 rounded-xl bg-gradient-to-br from-${action.color}-600 to-${action.color}-700 min-w-[160px] cursor-pointer shadow-lg shadow-${action.color}-500/25`}
      onClick={action.onClick}
    >
      <div className="p-2 bg-white/20 rounded-lg w-fit mb-2">
        <div className="text-white">{action.icon}</div>
      </div>
      <div className="font-bold text-white">{action.label}</div>
    </motion.div>
  ));

  const staffGridItems = [
    { icon: <Map className="h-5 w-5" />, label: "Map", color: "blue", onClick: () => setShowMap(true), testId: "nav-map" },
    { icon: <Route className="h-5 w-5" />, label: "Directions", color: "emerald", onClick: () => setShowDirections(true), testId: "nav-directions" },
    { icon: <MessageSquare className="h-5 w-5" />, label: "Messages", color: "violet", onClick: () => setLocation('/messages'), testId: "nav-messages" },
  ];

  const procedureAccordionItems = [
    {
      title: "Stand Opening Checklist",
      content: (
        <ul className="space-y-2 text-sm">
          <li className="flex items-start gap-2"><span className="text-emerald-400">•</span> Check product stock levels</li>
          <li className="flex items-start gap-2"><span className="text-emerald-400">•</span> Verify cash drawer float</li>
          <li className="flex items-start gap-2"><span className="text-emerald-400">•</span> Test POS terminal</li>
          <li className="flex items-start gap-2"><span className="text-emerald-400">•</span> Complete pre-event count</li>
          <li className="flex items-start gap-2"><span className="text-emerald-400">•</span> Confirm staff assignments</li>
        </ul>
      )
    },
    {
      title: "During Event Guidelines",
      content: (
        <ul className="space-y-2 text-sm">
          <li className="flex items-start gap-2"><span className="text-amber-400">•</span> Monitor inventory levels</li>
          <li className="flex items-start gap-2"><span className="text-amber-400">•</span> Address customer issues promptly</li>
          <li className="flex items-start gap-2"><span className="text-amber-400">•</span> Report equipment issues immediately</li>
          <li className="flex items-start gap-2"><span className="text-amber-400">•</span> Keep work areas clean and organized</li>
        </ul>
      )
    },
    {
      title: "Stand Closing Procedures",
      content: (
        <ul className="space-y-2 text-sm">
          <li className="flex items-start gap-2"><span className="text-cyan-400">•</span> Complete post-event inventory count</li>
          <li className="flex items-start gap-2"><span className="text-cyan-400">•</span> Balance cash drawer</li>
          <li className="flex items-start gap-2"><span className="text-cyan-400">•</span> Clean and sanitize all surfaces</li>
          <li className="flex items-start gap-2"><span className="text-cyan-400">•</span> Secure all equipment</li>
          <li className="flex items-start gap-2"><span className="text-cyan-400">•</span> Report any issues to supervisor</li>
        </ul>
      )
    },
    {
      title: "Emergency Procedures",
      content: (
        <ul className="space-y-2 text-sm">
          <li className="flex items-start gap-2"><span className="text-red-400">•</span> Medical: Call security, notify supervisor</li>
          <li className="flex items-start gap-2"><span className="text-red-400">•</span> Fire: Evacuate customers, follow exit routes</li>
          <li className="flex items-start gap-2"><span className="text-red-400">•</span> Security issue: Alert security immediately</li>
          <li className="flex items-start gap-2"><span className="text-red-400">•</span> Equipment failure: Report via issue form</li>
        </ul>
      )
    },
  ];

  return (
    <AnimatedBackground>
      <PersonalizedWelcomeTour />
      <GlobalModeBar />
      <div className="min-h-screen pb-20" data-testid="standlead-dashboard">
        <PageHeader
          title="Stand Lead"
          subtitle={`Welcome, ${currentUser?.name || 'Stand Lead'}`}
          icon={<Building2 className="h-5 w-5" />}
          iconColor="amber"
          actions={
            <Button variant="ghost" size="icon" onClick={handleLogout} className="text-slate-300 hover:bg-white/10" data-testid="button-logout">
              <LogOut className="h-5 w-5" />
            </Button>
          }
        />

        {showMap && (
          <div className="fixed inset-0 z-50 bg-background">
            <InteractiveMap 
              onClose={() => setShowMap(false)} 
              showNavigation={true}
            />
          </div>
        )}

        {showDirections && (
          <div className="fixed inset-0 z-50 bg-background p-4">
            <WalkingDirections 
              onClose={() => setShowDirections(false)}
              defaultDestination="105"
            />
          </div>
        )}

        {showCounterLogin && (
          <div className="fixed inset-0 z-50 bg-background p-4">
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
          <div className="fixed inset-0 z-50 bg-background p-4">
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

        <Dialog open={showIssueForm} onOpenChange={setShowIssueForm}>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                Report Stand Issue
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label>Issue Category *</Label>
                <Select value={issueCategory} onValueChange={setIssueCategory}>
                  <SelectTrigger data-testid="select-issue-category">
                    <SelectValue placeholder="Select category..." />
                  </SelectTrigger>
                  <SelectContent>
                    {ISSUE_CATEGORIES.map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>
                        <div className="flex items-center gap-2">
                          <cat.icon className={`h-4 w-4 ${cat.color}`} />
                          {cat.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Severity *</Label>
                <Select value={issueSeverity} onValueChange={(v) => setIssueSeverity(v as typeof issueSeverity)}>
                  <SelectTrigger data-testid="select-issue-severity">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Emergency">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></span>
                        Emergency - Immediate Response
                      </div>
                    </SelectItem>
                    <SelectItem value="High">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                        High Priority
                      </div>
                    </SelectItem>
                    <SelectItem value="Normal">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                        Normal
                      </div>
                    </SelectItem>
                    <SelectItem value="Low">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-gray-400"></span>
                        Low Priority
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                {issueSeverity === 'Emergency' && (
                  <p className="text-xs text-red-600 mt-1">
                    Emergency issues immediately notify all managers on duty
                  </p>
                )}
              </div>

              <div>
                <Label>Issue Title *</Label>
                <Input
                  placeholder="Brief description of the issue"
                  value={issueTitle}
                  onChange={(e) => setIssueTitle(e.target.value)}
                  data-testid="input-issue-title"
                />
              </div>

              <div>
                <Label>Details *</Label>
                <Textarea
                  placeholder="Provide more details about the issue..."
                  value={issueDescription}
                  onChange={(e) => setIssueDescription(e.target.value)}
                  rows={4}
                  data-testid="input-issue-description"
                />
              </div>

              <div className="bg-slate-800 p-3 rounded-lg text-sm border border-slate-700">
                <p className="font-medium text-slate-200">Auto-Routing</p>
                <p className="text-slate-400 text-xs mt-1">
                  {issueCategory === 'Cooling' || issueCategory === 'Beverage' 
                    ? '→ Warehouse Manager'
                    : issueCategory === 'Power' || issueCategory === 'AV' || issueCategory === 'Menu'
                    ? '→ Operations Manager'
                    : issueCategory === 'FoodSafety'
                    ? '→ Kitchen Manager'
                    : issueCategory === 'Staffing'
                    ? '→ General Manager & Operations'
                    : '→ Operations Manager'}
                </p>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setShowIssueForm(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleSubmitIssue} 
                disabled={isSubmitting}
                className={issueSeverity === 'Emergency' ? 'bg-red-600 hover:bg-red-700' : ''}
                data-testid="button-submit-issue"
              >
                {isSubmitting ? 'Submitting...' : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    {issueSeverity === 'Emergency' ? 'Report Emergency' : 'Submit Issue'}
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <main className="p-4 sm:px-6 max-w-6xl mx-auto">
          <div className="mb-4">
            <ComplianceAlertPanel 
              userId={currentUser?.id} 
              userName={currentUser?.name} 
              isManager={false}
            />
          </div>

          <LayoutShell data-testid="bento-layout">
            <BentoCard span={12} title="Your Stand" data-testid="stand-metrics-card">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 rounded-lg bg-amber-500/20">
                  <Building2 className="h-4 w-4 text-amber-400" />
                </div>
                <span className="font-bold text-sm text-slate-200">Stand Information</span>
              </div>
              <CarouselRail 
                items={metricsCarouselItems} 
                showDots
                data-testid="stand-metrics-carousel"
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

            <BentoCard span={8} className="lg:col-span-8 md:col-span-6 col-span-4" data-testid="inventory-card">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 rounded-lg bg-emerald-500/20">
                  <ClipboardList className="h-4 w-4 text-emerald-400" />
                </div>
                <span className="font-bold text-sm text-slate-200">Quick Actions</span>
              </div>
              <CarouselRail 
                items={inventoryCarouselItems}
                data-testid="inventory-carousel"
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

            <BentoCard span={8} className="lg:col-span-8 md:col-span-6 col-span-4" data-testid="staff-grid-card">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 rounded-lg bg-blue-500/20">
                  <Map className="h-4 w-4 text-blue-400" />
                </div>
                <span className="font-bold text-sm text-slate-200">Navigation</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {staffGridItems.map((item) => (
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

            <BentoCard span={12} data-testid="notepad-card">
              <Notepad storageKey="standlead-notes" title="My Shift Notes" />
            </BentoCard>
          </LayoutShell>
        </main>
        
        <TutorialHelpButton page="standlead" />
      </div>
    </AnimatedBackground>
  );
}
