import { useState, useEffect } from "react";
import { useStore } from "@/lib/mockData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  LogOut, Map, MessageSquare, ClipboardList, AlertTriangle, 
  CheckCircle2, Building2, Route, X, Send, Thermometer, Zap,
  Tv, UtensilsCrossed, Wrench, Users, HelpCircle
} from "lucide-react";
import { useLocation } from "wouter";
import { Notepad } from "@/components/Notepad";
import { InteractiveMap } from "@/components/InteractiveMap";
import { WalkingDirections } from "@/components/WalkingDirections";
import { CounterLogin } from "@/components/CounterLogin";
import { CountSheet } from "@/components/CountSheet";
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

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20">
      <header className="sticky top-0 z-10 bg-gradient-to-r from-amber-600 to-orange-600 text-white px-4 h-14 flex items-center justify-between shadow-md">
        <div className="font-bold text-lg">Stand Lead</div>
        <Button variant="ghost" size="icon" onClick={handleLogout} className="text-white hover:bg-white/20">
          <LogOut className="h-5 w-5" />
        </Button>
      </header>

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

            <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-lg text-sm">
              <p className="font-medium text-slate-700 dark:text-slate-300">Auto-Routing</p>
              <p className="text-slate-500 text-xs mt-1">
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

      <main className="p-4 sm:px-6 space-y-6 max-w-4xl mx-auto mt-4">
        <div className="text-center py-4">
          <h1 className="text-2xl font-black text-slate-800 dark:text-slate-200">
            Welcome, {currentUser?.name || 'Stand Lead'}
          </h1>
          <p className="text-muted-foreground">Stand Lead Dashboard</p>
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="h-5 w-5 text-orange-600" />
              Your Stand
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="text-xs text-muted-foreground uppercase">Section</p>
                <p className="font-bold">{assignedSection.name}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="text-xs text-muted-foreground uppercase">Floor</p>
                <p className="font-bold">{assignedSection.floor}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="text-xs text-muted-foreground uppercase">Stand</p>
                <p className="font-bold">{assignedSection.stand}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="text-xs text-muted-foreground uppercase">Supervisor</p>
                <p className="font-bold">{assignedSection.supervisor}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-3">
          <Button 
            className="h-20 bg-green-600 hover:bg-green-700 text-white flex-col"
            onClick={() => setShowCounterLogin(true)}
            data-testid="start-pre-event-count"
          >
            <ClipboardList className="h-6 w-6 mb-1" />
            <span className="text-sm">Pre-Event Count</span>
          </Button>
          <Button 
            className="h-20 bg-red-600 hover:bg-red-700 text-white flex-col"
            onClick={() => setShowIssueForm(true)}
            data-testid="report-issue"
          >
            <AlertTriangle className="h-6 w-6 mb-1" />
            <span className="text-sm">Report Issue</span>
          </Button>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Card 
            className="border-none shadow-md hover:shadow-lg transition-shadow cursor-pointer" 
            onClick={() => setShowMap(true)}
          >
            <CardContent className="p-4 flex flex-col items-center justify-center text-center space-y-2">
              <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/30">
                <Map className="h-6 w-6 text-blue-600" />
              </div>
              <div className="font-bold text-xs">Map</div>
            </CardContent>
          </Card>
          <Card 
            className="border-none shadow-md hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => setShowDirections(true)}
          >
            <CardContent className="p-4 flex flex-col items-center justify-center text-center space-y-2">
              <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/30">
                <Route className="h-6 w-6 text-green-600" />
              </div>
              <div className="font-bold text-xs">Directions</div>
            </CardContent>
          </Card>
          <Card 
            className="border-none shadow-md hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => setLocation('/messages')}
          >
            <CardContent className="p-4 flex flex-col items-center justify-center text-center space-y-2">
              <div className="p-3 rounded-full bg-indigo-100 dark:bg-indigo-900/30">
                <MessageSquare className="h-6 w-6 text-indigo-600" />
              </div>
              <div className="font-bold text-xs">Messages</div>
            </CardContent>
          </Card>
        </div>

        <Notepad storageKey="standlead-notes" title="My Shift Notes" />
      </main>
    </div>
  );
}
