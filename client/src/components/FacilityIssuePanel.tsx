import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  AlertTriangle, Thermometer, Zap, Tv, Coffee, 
  Wrench, Users, HelpCircle, Send, Loader2, CheckCircle,
  Droplets, Flame, Wind, Beer, ChevronDown, ChevronUp
} from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface FacilityIssuePanelProps {
  standId: string;
  standName: string;
  reporterId: string;
  reporterName?: string;
  eventDate?: string;
  onIssueReported?: (issue: any) => void;
}

type IssueCategory = 'Cooling' | 'Beverage' | 'Power' | 'AV' | 'Menu' | 'FoodSafety' | 'Equipment' | 'Staffing' | 'Other';
type IssueSeverity = 'Emergency' | 'High' | 'Normal' | 'Low';

interface QuickIssue {
  id: string;
  title: string;
  category: IssueCategory;
  defaultSeverity: IssueSeverity;
  icon: React.ReactNode;
}

const QUICK_ISSUES: QuickIssue[] = [
  { id: 'cooler_not_cooling', title: 'Cooler not cooling', category: 'Cooling', defaultSeverity: 'High', icon: <Thermometer className="w-4 h-4" /> },
  { id: 'freezer_not_freezing', title: 'Freezer not freezing', category: 'Cooling', defaultSeverity: 'High', icon: <Thermometer className="w-4 h-4" /> },
  { id: 'fountain_leaking', title: 'Fountain leaking', category: 'Beverage', defaultSeverity: 'Normal', icon: <Droplets className="w-4 h-4" /> },
  { id: 'fountain_not_working', title: 'Fountain not working', category: 'Beverage', defaultSeverity: 'High', icon: <Coffee className="w-4 h-4" /> },
  { id: 'co2_empty', title: 'CO2 not working / empty', category: 'Beverage', defaultSeverity: 'High', icon: <Beer className="w-4 h-4" /> },
  { id: 'fryer_not_frying', title: 'Fryer not working', category: 'Equipment', defaultSeverity: 'High', icon: <Flame className="w-4 h-4" /> },
  { id: 'cheese_warmer_broken', title: 'Cheese warmer broken', category: 'Equipment', defaultSeverity: 'Normal', icon: <Flame className="w-4 h-4" /> },
  { id: 'fan_broken', title: 'Fan not working', category: 'Equipment', defaultSeverity: 'Normal', icon: <Wind className="w-4 h-4" /> },
  { id: 'tv_remote_missing', title: 'TV remote missing', category: 'AV', defaultSeverity: 'Low', icon: <Tv className="w-4 h-4" /> },
  { id: 'tv_not_working', title: 'TV not working', category: 'AV', defaultSeverity: 'Normal', icon: <Tv className="w-4 h-4" /> },
  { id: 'pos_down', title: 'POS system down', category: 'Equipment', defaultSeverity: 'Emergency', icon: <Wrench className="w-4 h-4" /> },
  { id: 'power_outage', title: 'Power outage / outlet not working', category: 'Power', defaultSeverity: 'High', icon: <Zap className="w-4 h-4" /> },
  { id: 'lights_out', title: 'Lights not working', category: 'Power', defaultSeverity: 'Normal', icon: <Zap className="w-4 h-4" /> },
  { id: 'water_leak', title: 'Water leak', category: 'Equipment', defaultSeverity: 'High', icon: <Droplets className="w-4 h-4" /> },
  { id: 'grill_not_working', title: 'Grill not working', category: 'Equipment', defaultSeverity: 'High', icon: <Flame className="w-4 h-4" /> },
  { id: 'hot_dog_roller_broken', title: 'Hot dog roller broken', category: 'Equipment', defaultSeverity: 'Normal', icon: <Flame className="w-4 h-4" /> },
  { id: 'ice_machine_broken', title: 'Ice machine not working', category: 'Equipment', defaultSeverity: 'High', icon: <Thermometer className="w-4 h-4" /> },
  { id: 'short_staffed', title: 'Short staffed', category: 'Staffing', defaultSeverity: 'Normal', icon: <Users className="w-4 h-4" /> },
];

const CATEGORY_COLORS: Record<IssueCategory, string> = {
  Cooling: 'bg-blue-100 text-blue-700 border-blue-200',
  Beverage: 'bg-cyan-100 text-cyan-700 border-cyan-200',
  Power: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  AV: 'bg-purple-100 text-purple-700 border-purple-200',
  Menu: 'bg-orange-100 text-orange-700 border-orange-200',
  FoodSafety: 'bg-red-100 text-red-700 border-red-200',
  Equipment: 'bg-slate-100 text-slate-700 border-slate-200',
  Staffing: 'bg-green-100 text-green-700 border-green-200',
  Other: 'bg-gray-100 text-gray-700 border-gray-200',
};

const SEVERITY_COLORS: Record<IssueSeverity, string> = {
  Emergency: 'bg-red-500 text-white',
  High: 'bg-orange-500 text-white',
  Normal: 'bg-blue-500 text-white',
  Low: 'bg-gray-500 text-white',
};

const CATEGORY_ICONS: Record<IssueCategory, React.ReactNode> = {
  Cooling: <Thermometer className="w-4 h-4" />,
  Beverage: <Coffee className="w-4 h-4" />,
  Power: <Zap className="w-4 h-4" />,
  AV: <Tv className="w-4 h-4" />,
  Menu: <HelpCircle className="w-4 h-4" />,
  FoodSafety: <AlertTriangle className="w-4 h-4" />,
  Equipment: <Wrench className="w-4 h-4" />,
  Staffing: <Users className="w-4 h-4" />,
  Other: <HelpCircle className="w-4 h-4" />,
};

export function FacilityIssuePanel({
  standId,
  standName,
  reporterId,
  reporterName,
  eventDate,
  onIssueReported
}: FacilityIssuePanelProps) {
  const queryClient = useQueryClient();
  const [selectedIssue, setSelectedIssue] = useState<QuickIssue | null>(null);
  const [customTitle, setCustomTitle] = useState('');
  const [customCategory, setCustomCategory] = useState<IssueCategory>('Equipment');
  const [severity, setSeverity] = useState<IssueSeverity>('Normal');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [location, setLocation] = useState('');
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showAllQuickIssues, setShowAllQuickIssues] = useState(false);

  const { data: existingIssues = [] } = useQuery({
    queryKey: ['stand-issues', standId, eventDate],
    queryFn: async () => {
      const dateParam = eventDate ? `&eventDate=${eventDate}` : '';
      const res = await fetch(`/api/stand-issues?standId=${standId}${dateParam}`);
      if (!res.ok) return [];
      return res.json();
    }
  });

  const reportIssueMutation = useMutation({
    mutationFn: async (issueData: {
      reporterId: string;
      standId: string;
      category: IssueCategory;
      severity: IssueSeverity;
      title: string;
      description: string;
      location?: string;
      routedTo: 'ManagementCore';
    }) => {
      const res = await fetch('/api/stand-issues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(issueData)
      });
      if (!res.ok) throw new Error('Failed to report issue');
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['stand-issues'] });
      setSuccessMessage('Issue reported to Operations!');
      setSelectedIssue(null);
      setCustomTitle('');
      setAdditionalNotes('');
      setLocation('');
      setShowCustomForm(false);
      onIssueReported?.(data);
      setTimeout(() => setSuccessMessage(null), 3000);
    }
  });

  const handleQuickIssue = (issue: QuickIssue) => {
    setSelectedIssue(issue);
    setSeverity(issue.defaultSeverity);
    setShowCustomForm(false);
  };

  const handleSubmit = () => {
    const title = selectedIssue ? selectedIssue.title : customTitle;
    const category = selectedIssue ? selectedIssue.category : customCategory;
    
    if (!title.trim()) return;

    const description = additionalNotes 
      ? `${title}${location ? ` (Location: ${location})` : ''}\n\nNotes: ${additionalNotes}`
      : `${title}${location ? ` (Location: ${location})` : ''}`;

    reportIssueMutation.mutate({
      reporterId,
      standId,
      category,
      severity,
      title,
      description,
      location: location || undefined,
      routedTo: 'ManagementCore'
    });
  };

  const displayedQuickIssues = showAllQuickIssues ? QUICK_ISSUES : QUICK_ISSUES.slice(0, 6);
  const openIssues = existingIssues.filter((i: any) => i.status !== 'Resolved' && i.status !== 'Closed');

  return (
    <Card className="border-slate-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            <CardTitle className="text-base">Report Facility Issue</CardTitle>
          </div>
          {openIssues.length > 0 && (
            <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
              {openIssues.length} Open
            </Badge>
          )}
        </div>
        <p className="text-sm text-slate-500">
          {standName} - Issues go directly to Operations
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        {successMessage && (
          <div className="flex items-center gap-2 p-3 bg-green-50 text-green-700 rounded-lg">
            <CheckCircle className="w-5 h-5" />
            <span className="font-medium">{successMessage}</span>
          </div>
        )}

        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-700">Quick Report:</p>
          <div className="grid grid-cols-2 gap-2">
            {displayedQuickIssues.map((issue) => (
              <Button
                key={issue.id}
                variant={selectedIssue?.id === issue.id ? "default" : "outline"}
                size="sm"
                className={`justify-start h-auto py-2 px-3 text-left ${
                  selectedIssue?.id === issue.id 
                    ? 'bg-cyan-600 hover:bg-cyan-700' 
                    : ''
                }`}
                onClick={() => handleQuickIssue(issue)}
                data-testid={`quick-issue-${issue.id}`}
              >
                <span className="mr-2">{issue.icon}</span>
                <span className="text-xs leading-tight">{issue.title}</span>
              </Button>
            ))}
          </div>
          
          {QUICK_ISSUES.length > 6 && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-slate-500"
              onClick={() => setShowAllQuickIssues(!showAllQuickIssues)}
              data-testid="toggle-more-issues"
            >
              {showAllQuickIssues ? (
                <>Show Less <ChevronUp className="w-4 h-4 ml-1" /></>
              ) : (
                <>Show More ({QUICK_ISSUES.length - 6} more) <ChevronDown className="w-4 h-4 ml-1" /></>
              )}
            </Button>
          )}
        </div>

        <div className="text-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setShowCustomForm(!showCustomForm);
              setSelectedIssue(null);
            }}
            className="text-cyan-600"
            data-testid="toggle-custom-issue"
          >
            {showCustomForm ? 'Cancel Custom' : '+ Report Something Else'}
          </Button>
        </div>

        {showCustomForm && (
          <div className="space-y-3 p-3 bg-slate-50 rounded-lg">
            <div>
              <label className="text-sm font-medium">Issue Description</label>
              <Textarea
                placeholder="Describe the problem..."
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                className="mt-1"
                rows={2}
                data-testid="custom-issue-title"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Category</label>
              <Select value={customCategory} onValueChange={(v) => setCustomCategory(v as IssueCategory)}>
                <SelectTrigger className="mt-1" data-testid="select-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(CATEGORY_COLORS).map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      <div className="flex items-center gap-2">
                        {CATEGORY_ICONS[cat as IssueCategory]}
                        {cat}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {(selectedIssue || showCustomForm) && (
          <div className="space-y-3 p-3 border rounded-lg bg-white">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {selectedIssue ? selectedIssue.title : 'Custom Issue'}
              </span>
              {selectedIssue && (
                <Badge className={CATEGORY_COLORS[selectedIssue.category]}>
                  {selectedIssue.category}
                </Badge>
              )}
            </div>

            <div>
              <label className="text-sm font-medium">Severity</label>
              <Select value={severity} onValueChange={(v) => setSeverity(v as IssueSeverity)}>
                <SelectTrigger className="mt-1" data-testid="select-severity">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Emergency">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-red-500" />
                      Emergency - Need help NOW
                    </div>
                  </SelectItem>
                  <SelectItem value="High">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-orange-500" />
                      High - Affecting sales/safety
                    </div>
                  </SelectItem>
                  <SelectItem value="Normal">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                      Normal - Needs attention today
                    </div>
                  </SelectItem>
                  <SelectItem value="Low">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-gray-500" />
                      Low - Can wait
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Specific Location (optional)</label>
              <Textarea
                placeholder="e.g., Back cooler, left fryer, register 2..."
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="mt-1"
                rows={1}
                data-testid="issue-location"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Additional Notes (optional)</label>
              <Textarea
                placeholder="Any other details that might help..."
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
                className="mt-1"
                rows={2}
                data-testid="issue-notes"
              />
            </div>

            <Button
              onClick={handleSubmit}
              disabled={reportIssueMutation.isPending || (!selectedIssue && !customTitle.trim())}
              className="w-full bg-cyan-600 hover:bg-cyan-700"
              data-testid="submit-issue"
            >
              {reportIssueMutation.isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending...</>
              ) : (
                <><Send className="w-4 h-4 mr-2" /> Send to Operations</>
              )}
            </Button>
          </div>
        )}

        {openIssues.length > 0 && (
          <Collapsible>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="w-full text-slate-600" data-testid="view-open-issues">
                View {openIssues.length} Open Issue{openIssues.length > 1 ? 's' : ''} <ChevronDown className="w-4 h-4 ml-1" />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-2 mt-2">
              {openIssues.map((issue: any) => (
                <div 
                  key={issue.id} 
                  className="p-2 bg-slate-50 rounded-lg text-sm"
                  data-testid={`open-issue-${issue.id}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{issue.title}</span>
                    <div className="flex gap-1">
                      <Badge className={SEVERITY_COLORS[issue.severity as IssueSeverity]} variant="secondary">
                        {issue.severity}
                      </Badge>
                      <Badge variant="outline">{issue.status}</Badge>
                    </div>
                  </div>
                  {issue.createdAt && (
                    <p className="text-xs text-slate-500 mt-1">
                      Reported {new Date(issue.createdAt).toLocaleTimeString()}
                    </p>
                  )}
                </div>
              ))}
            </CollapsibleContent>
          </Collapsible>
        )}
      </CardContent>
    </Card>
  );
}
