import { useState, useEffect } from "react";
import { useStore } from "@/lib/mockData";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  LogOut, AlertTriangle, CheckCircle2, Clock, ClipboardList,
  Building2, Users, Thermometer, Zap, Tv, UtensilsCrossed, Wrench,
  HelpCircle, Bell, Eye, Check
} from "lucide-react";
import { useLocation } from "wouter";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

type StandIssue = {
  id: string;
  reporterId: string;
  standId: string;
  category: string;
  severity: 'Emergency' | 'High' | 'Normal' | 'Low';
  title: string;
  description: string;
  status: 'Open' | 'Acknowledged' | 'InProgress' | 'Resolved' | 'Closed';
  routedTo: string;
  location: string;
  createdAt: string;
  acknowledgedAt?: string;
  resolvedAt?: string;
  resolutionNotes?: string;
};

const CATEGORY_ICONS: Record<string, any> = {
  Cooling: Thermometer,
  Beverage: UtensilsCrossed,
  Power: Zap,
  AV: Tv,
  Menu: ClipboardList,
  FoodSafety: UtensilsCrossed,
  Equipment: Wrench,
  Staffing: Users,
  Other: HelpCircle,
};

const SEVERITY_COLORS: Record<string, string> = {
  Emergency: 'bg-red-100 text-red-800 border-red-200',
  High: 'bg-orange-100 text-orange-800 border-orange-200',
  Normal: 'bg-blue-100 text-blue-800 border-blue-200',
  Low: 'bg-gray-100 text-gray-800 border-gray-200',
};

const STATUS_COLORS: Record<string, string> = {
  Open: 'bg-red-500',
  Acknowledged: 'bg-yellow-500',
  InProgress: 'bg-blue-500',
  Resolved: 'bg-green-500',
  Closed: 'bg-gray-500',
};

export default function ManagerDashboard() {
  const logout = useStore((state) => state.logout);
  const [location, setLocation] = useLocation();
  const currentUser = useStore((state) => state.currentUser);
  const [issues, setIssues] = useState<StandIssue[]>([]);
  const [selectedIssue, setSelectedIssue] = useState<StandIssue | null>(null);
  const [showIssueDetails, setShowIssueDetails] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchIssues = async () => {
    try {
      const response = await fetch('/api/stand-issues/open');
      if (response.ok) {
        const data = await response.json();
        setIssues(data);
      }
    } catch (err) {
      console.error('Failed to fetch issues:', err);
    }
  };

  useEffect(() => {
    fetchIssues();
    const interval = setInterval(fetchIssues, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    logout();
    setLocation("/");
  };

  const handleAcknowledge = async (issueId: string) => {
    if (!currentUser) return;
    setIsSubmitting(true);
    try {
      await fetch(`/api/stand-issues/${issueId}/acknowledge`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id })
      });
      fetchIssues();
      setShowIssueDetails(false);
    } catch (err) {
      console.error('Failed to acknowledge:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResolve = async (issueId: string) => {
    if (!currentUser) return;
    setIsSubmitting(true);
    try {
      await fetch(`/api/stand-issues/${issueId}/resolve`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, notes: resolutionNotes })
      });
      fetchIssues();
      setShowIssueDetails(false);
      setResolutionNotes('');
    } catch (err) {
      console.error('Failed to resolve:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRoleTitle = () => {
    switch (location) {
      case '/warehouse-manager': return 'Warehouse Manager';
      case '/kitchen-manager': return 'Kitchen Manager';
      case '/operations': return 'Operations Manager';
      case '/manager': return 'General Manager';
      case '/executive': return 'Regional VP';
      default: return 'Manager';
    }
  };

  const emergencyIssues = issues.filter(i => i.severity === 'Emergency');
  const highPriorityIssues = issues.filter(i => i.severity === 'High');
  const normalIssues = issues.filter(i => i.severity === 'Normal' || i.severity === 'Low');

  const openIssue = (issue: StandIssue) => {
    setSelectedIssue(issue);
    setShowIssueDetails(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20">
      <header className="sticky top-0 z-10 bg-gradient-to-r from-slate-700 to-slate-800 text-white px-4 h-14 flex items-center justify-between shadow-md">
        <div className="font-bold text-lg">{getRoleTitle()}</div>
        <div className="flex items-center gap-2">
          {emergencyIssues.length > 0 && (
            <Badge className="bg-red-600 animate-pulse">
              <Bell className="h-3 w-3 mr-1" />
              {emergencyIssues.length} Emergency
            </Badge>
          )}
          <Button variant="ghost" size="icon" onClick={handleLogout} className="text-white hover:bg-white/20">
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <Dialog open={showIssueDetails} onOpenChange={setShowIssueDetails}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          {selectedIssue && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {CATEGORY_ICONS[selectedIssue.category] && 
                    (() => { const Icon = CATEGORY_ICONS[selectedIssue.category]; return <Icon className="h-5 w-5" />; })()
                  }
                  {selectedIssue.title}
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Badge className={SEVERITY_COLORS[selectedIssue.severity]}>
                    {selectedIssue.severity}
                  </Badge>
                  <Badge variant="outline">
                    {selectedIssue.category}
                  </Badge>
                  <Badge variant="outline" className="flex items-center gap-1">
                    <span className={`w-2 h-2 rounded-full ${STATUS_COLORS[selectedIssue.status]}`}></span>
                    {selectedIssue.status}
                  </Badge>
                </div>

                <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-lg">
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Location</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">{selectedIssue.location || selectedIssue.standId}</p>
                </div>

                <div>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">{selectedIssue.description}</p>
                </div>

                <div className="text-xs text-muted-foreground">
                  Reported: {new Date(selectedIssue.createdAt).toLocaleString()}
                </div>

                {selectedIssue.status === 'Acknowledged' && (
                  <div>
                    <p className="text-sm font-medium mb-2">Resolution Notes</p>
                    <Textarea
                      placeholder="Describe how the issue was resolved..."
                      value={resolutionNotes}
                      onChange={(e) => setResolutionNotes(e.target.value)}
                      rows={3}
                    />
                  </div>
                )}
              </div>

              <DialogFooter className="gap-2 mt-4">
                {selectedIssue.status === 'Open' && (
                  <Button 
                    onClick={() => handleAcknowledge(selectedIssue.id)}
                    disabled={isSubmitting}
                    className="bg-yellow-600 hover:bg-yellow-700"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Acknowledge
                  </Button>
                )}
                {selectedIssue.status === 'Acknowledged' && (
                  <Button 
                    onClick={() => handleResolve(selectedIssue.id)}
                    disabled={isSubmitting}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Mark Resolved
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <main className="p-4 sm:px-6 space-y-6 max-w-4xl mx-auto mt-4">
        <div className="text-center py-4">
          <h1 className="text-2xl font-black text-slate-800 dark:text-slate-200">
            Welcome, {currentUser?.name || getRoleTitle()}
          </h1>
          <p className="text-muted-foreground">{getRoleTitle()} Dashboard</p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Card className="border-red-200 bg-red-50 dark:bg-red-900/20">
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-red-600">{emergencyIssues.length}</div>
              <div className="text-xs text-red-700">Emergency</div>
            </CardContent>
          </Card>
          <Card className="border-orange-200 bg-orange-50 dark:bg-orange-900/20">
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-orange-600">{highPriorityIssues.length}</div>
              <div className="text-xs text-orange-700">High Priority</div>
            </CardContent>
          </Card>
          <Card className="border-blue-200 bg-blue-50 dark:bg-blue-900/20">
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-blue-600">{normalIssues.length}</div>
              <div className="text-xs text-blue-700">Normal</div>
            </CardContent>
          </Card>
        </div>

        <Accordion type="multiple" defaultValue={['emergency', 'high']} className="w-full">
          {emergencyIssues.length > 0 && (
            <AccordionItem value="emergency" className="border-red-200 bg-red-50/50">
              <AccordionTrigger className="px-4 hover:no-underline">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-600 animate-pulse" />
                  <span className="font-bold text-red-800">Emergency Issues ({emergencyIssues.length})</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 space-y-2">
                {emergencyIssues.map(issue => (
                  <Card 
                    key={issue.id} 
                    className="cursor-pointer hover:shadow-md transition-shadow border-red-200"
                    onClick={() => openIssue(issue)}
                    data-testid={`issue-card-${issue.id}`}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-medium">{issue.title}</div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {issue.location || issue.standId} • {issue.category}
                          </div>
                        </div>
                        <Badge className={`${STATUS_COLORS[issue.status]} text-white text-xs`}>
                          {issue.status}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </AccordionContent>
            </AccordionItem>
          )}

          {highPriorityIssues.length > 0 && (
            <AccordionItem value="high" className="border-orange-200 bg-orange-50/50">
              <AccordionTrigger className="px-4 hover:no-underline">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-orange-600" />
                  <span className="font-bold text-orange-800">High Priority ({highPriorityIssues.length})</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 space-y-2">
                {highPriorityIssues.map(issue => (
                  <Card 
                    key={issue.id} 
                    className="cursor-pointer hover:shadow-md transition-shadow border-orange-200"
                    onClick={() => openIssue(issue)}
                    data-testid={`issue-card-${issue.id}`}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-medium">{issue.title}</div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {issue.location || issue.standId} • {issue.category}
                          </div>
                        </div>
                        <Badge className={`${STATUS_COLORS[issue.status]} text-white text-xs`}>
                          {issue.status}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </AccordionContent>
            </AccordionItem>
          )}

          <AccordionItem value="normal">
            <AccordionTrigger className="px-4 hover:no-underline">
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-blue-600" />
                <span className="font-medium">Other Issues ({normalIssues.length})</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 space-y-2">
              {normalIssues.length === 0 ? (
                <div className="text-center text-muted-foreground py-4">
                  <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-500" />
                  No pending issues
                </div>
              ) : (
                normalIssues.map(issue => (
                  <Card 
                    key={issue.id} 
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => openIssue(issue)}
                    data-testid={`issue-card-${issue.id}`}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-medium">{issue.title}</div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {issue.location || issue.standId} • {issue.category}
                          </div>
                        </div>
                        <Badge className={`${STATUS_COLORS[issue.status]} text-white text-xs`}>
                          {issue.status}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </main>
    </div>
  );
}
