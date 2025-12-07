import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { 
  ClipboardList, 
  ChevronLeft, 
  User, 
  Phone,
  Clock,
  Check,
  AlertCircle,
  Play,
  Users,
  Loader2,
  Package,
  Plus,
  Minus,
  Save
} from "lucide-react";
import { Link, useLocation, useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { 
  AnimatedBackground, 
  GlassCard, 
  GlassCardContent, 
  PageHeader,
  GlowButton
} from "@/components/ui/premium";
import { useStore } from "@/lib/mockData";
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { PDFActionButtons } from "@/components/PDFActionButtons";
import { generateCountSessionPDF } from "@/lib/pdfUtils";
import { jsPDF } from "jspdf";

type CountStage = 'PreEvent' | 'PostEvent' | 'DayAfter';
type CounterRole = 'NPOLead' | 'StandLead' | 'Supervisor' | 'Manager' | 'ManagerAssistant';
type CountSessionStatus = 'InProgress' | 'Completed' | 'Verified';
type EmploymentAffiliation = 'Legends' | 'NPO' | 'Temp' | 'Other';

interface CountSession {
  id: string;
  standId: string;
  eventDate: string;
  stage: CountStage;
  counterName: string;
  counterRole: CounterRole;
  counterPhoneLast4: string;
  counterAffiliation: EmploymentAffiliation;
  assistingCounterName?: string;
  assistingCounterPhone4?: string;
  assistingCounterAffiliation?: EmploymentAffiliation;
  status: CountSessionStatus;
  startedAt: string;
  completedAt?: string;
}

interface Item {
  id: string;
  name: string;
  category: string;
  price: number;
}

interface StandItem {
  id: string;
  standId: string;
  itemId: string;
  sortOrder: number;
  isChargeable: boolean;
  item: Item;
}

interface Stand {
  id: string;
  name: string;
  section: string;
}

const STAGE_CONFIG: Record<CountStage, { label: string; description: string; icon: string; color: string }> = {
  PreEvent: {
    label: 'Pre-Event Count',
    description: 'Verify inventory before gates open. Supervisor delivers count sheets to Stand Lead.',
    icon: '🌅',
    color: 'emerald'
  },
  PostEvent: {
    label: 'Post-Event Count', 
    description: 'Count remaining inventory after event ends. May be different counters than pre-event.',
    icon: '🌙',
    color: 'blue'
  },
  DayAfter: {
    label: 'Final Count (Day After)',
    description: 'Manager verification count. Confirms post-event numbers and catches discrepancies.',
    icon: '☀️',
    color: 'purple'
  }
};

const ROLE_LABELS: Record<CounterRole, string> = {
  NPOLead: 'NPO Worker',
  StandLead: 'Stand Lead',
  Supervisor: 'Supervisor',
  Manager: 'Manager',
  ManagerAssistant: 'Manager Assistant'
};

const AFFILIATION_LABELS: Record<EmploymentAffiliation, string> = {
  Legends: 'Legends',
  NPO: 'NPO Organization',
  Temp: 'Temp Staff',
  Other: 'Other'
};

export default function EventCountSession() {
  const [, setLocation] = useLocation();
  const params = useParams<{ standId: string; eventDate: string }>();
  const currentUser = useStore((state: { currentUser: any }) => state.currentUser);
  const { toast } = useToast();

  const [stand, setStand] = useState<Stand | null>(null);
  const [standItems, setStandItems] = useState<StandItem[]>([]);
  const [sessions, setSessions] = useState<CountSession[]>([]);
  const [counts, setCounts] = useState<Record<string, Record<string, number>>>({});
  const [loading, setLoading] = useState(true);
  const [savingCounts, setSavingCounts] = useState<Record<string, boolean>>({});

  const [activeStage, setActiveStage] = useState<CountStage>('PreEvent');
  const [startSessionDialogOpen, setStartSessionDialogOpen] = useState(false);
  const [startingStage, setStartingStage] = useState<CountStage | null>(null);

  const [counterName, setCounterName] = useState('');
  const [counterRole, setCounterRole] = useState<CounterRole>('StandLead');
  const [counterPhone4, setCounterPhone4] = useState('');
  const [counterAffiliation, setCounterAffiliation] = useState<EmploymentAffiliation>('Legends');
  const [assistingName, setAssistingName] = useState('');
  const [assistingPhone4, setAssistingPhone4] = useState('');
  const [assistingAffiliation, setAssistingAffiliation] = useState<EmploymentAffiliation>('NPO');

  const standId = params?.standId || '';
  const eventDate = params?.eventDate ? decodeURIComponent(params.eventDate) : new Date().toLocaleDateString();

  useEffect(() => {
    if (standId) {
      fetchData();
    }
  }, [standId, eventDate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [standRes, itemsRes, sessionsRes] = await Promise.all([
        fetch(`/api/stands/${standId}`),
        fetch(`/api/stand-items/${standId}`),
        fetch(`/api/count-sessions?standId=${standId}&eventDate=${encodeURIComponent(eventDate)}`)
      ]);

      if (standRes.ok) {
        const standData = await standRes.json();
        setStand(standData);
      }

      if (itemsRes.ok) {
        const itemsData = await itemsRes.json();
        setStandItems(itemsData);
      }

      if (sessionsRes.ok) {
        const sessionsData = await sessionsRes.json();
        setSessions(sessionsData);
        
        const countsMap: Record<string, Record<string, number>> = {};
        for (const session of sessionsData) {
          const countsRes = await fetch(`/api/inventory-counts?sessionId=${session.id}`);
          if (countsRes.ok) {
            const sessionCounts = await countsRes.json();
            countsMap[session.stage] = {};
            for (const count of sessionCounts) {
              countsMap[session.stage][count.itemId] = count.endCount || count.startCount || 0;
            }
          }
        }
        setCounts(countsMap);
        
        const inProgressSession = sessionsData.find((s: CountSession) => s.status === 'InProgress');
        if (inProgressSession) {
          setActiveStage(inProgressSession.stage);
        } else {
          const stages: CountStage[] = ['PreEvent', 'PostEvent', 'DayAfter'];
          const nextStage = stages.find(stage => !sessionsData.some((s: CountSession) => s.stage === stage));
          if (nextStage) {
            setActiveStage(nextStage);
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast({
        title: "Error",
        description: "Failed to load count session data.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getSessionForStage = (stage: CountStage): CountSession | undefined => {
    return sessions.find(s => s.stage === stage);
  };

  const getStageStatus = (stage: CountStage): 'not_started' | 'in_progress' | 'completed' | 'verified' => {
    const session = getSessionForStage(stage);
    if (!session) return 'not_started';
    if (session.status === 'Verified') return 'verified';
    if (session.status === 'Completed') return 'completed';
    return 'in_progress';
  };

  const openStartDialog = (stage: CountStage) => {
    setStartingStage(stage);
    setCounterName(currentUser?.name || '');
    setCounterRole(currentUser?.role === 'Management' ? 'Manager' : 
                   currentUser?.role === 'StandSupervisor' ? 'Supervisor' : 'StandLead');
    setCounterPhone4('');
    setCounterAffiliation('Legends');
    setAssistingName('');
    setAssistingPhone4('');
    setStartSessionDialogOpen(true);
  };

  const startCountSession = async () => {
    if (!startingStage || !counterName || !counterPhone4) {
      toast({
        title: "Missing Information",
        description: "Please provide counter name and phone last 4 digits.",
        variant: "destructive"
      });
      return;
    }

    try {
      const response = await fetch('/api/count-sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          standId,
          eventDate,
          stage: startingStage,
          counterName,
          counterRole,
          counterPhoneLast4: counterPhone4,
          counterAffiliation,
          assistingCounterName: assistingName || undefined,
          assistingCounterPhone4: assistingPhone4 || undefined,
          assistingCounterAffiliation: assistingName ? assistingAffiliation : undefined
        })
      });

      if (response.ok) {
        const newSession = await response.json();
        setSessions(prev => [...prev, newSession]);
        setActiveStage(startingStage);
        
        toast({
          title: "Count Started",
          description: `${STAGE_CONFIG[startingStage].label} has been started.`,
        });
      } else {
        throw new Error('Failed to start session');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start count session.",
        variant: "destructive"
      });
    }

    setStartSessionDialogOpen(false);
    setStartingStage(null);
  };

  const handleCountChange = (stage: CountStage, itemId: string, value: number) => {
    const newValue = Math.max(0, value);
    setCounts(prev => ({
      ...prev,
      [stage]: {
        ...(prev[stage] || {}),
        [itemId]: newValue
      }
    }));
  };

  const saveCount = async (stage: CountStage, itemId: string) => {
    const session = getSessionForStage(stage);
    if (!session) return;

    const key = `${stage}-${itemId}`;
    setSavingCounts(prev => ({ ...prev, [key]: true }));

    try {
      const count = counts[stage]?.[itemId] || 0;
      const isPreEvent = stage === 'PreEvent';
      
      await fetch('/api/inventory-counts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId,
          standId,
          eventDate,
          sessionId: session.id,
          startCount: isPreEvent ? count : 0,
          endCount: !isPreEvent ? count : 0,
          adds: 0,
          spoilage: 0,
          sold: 0
        })
      });

      toast({
        title: "Saved",
        description: "Count updated.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save count.",
        variant: "destructive"
      });
    } finally {
      setSavingCounts(prev => ({ ...prev, [key]: false }));
    }
  };

  const completeSession = async (stage: CountStage) => {
    const session = getSessionForStage(stage);
    if (!session || !stand) return;

    try {
      await fetch(`/api/count-sessions/${session.id}/complete`, {
        method: 'PATCH'
      });

      const completedAt = new Date().toISOString();
      
      setSessions(prev => prev.map(s => 
        s.id === session.id 
          ? { ...s, status: 'Completed' as CountSessionStatus, completedAt }
          : s
      ));

      const countItems = standItems.map(si => ({
        itemName: si.item.name,
        category: si.item.category,
        count: counts[stage]?.[si.itemId] || 0
      }));
      await fetch('/api/manager-documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `${STAGE_CONFIG[stage].label} - ${stand.name}`,
          category: 'count_report',
          subcategory: stage,
          standId: standId,
          eventDate: eventDate,
          submittedById: currentUser?.id,
          jsonData: {
            sessionId: session.id,
            counterName: session.counterName,
            counterRole: session.counterRole,
            assistingCounterName: session.assistingCounterName,
            startedAt: session.startedAt,
            completedAt,
            items: countItems,
            totalItems: countItems.length,
            totalCounted: countItems.reduce((sum, item) => sum + item.count, 0)
          },
          notes: `Count completed by ${session.counterName}${session.assistingCounterName ? ` with ${session.assistingCounterName}` : ''}`
        })
      });

      toast({
        title: "Count Completed",
        description: `${STAGE_CONFIG[stage].label} has been completed and saved to Document Hub.`,
      });

      const stages: CountStage[] = ['PreEvent', 'PostEvent', 'DayAfter'];
      const currentIndex = stages.indexOf(stage);
      if (currentIndex < stages.length - 1) {
        setActiveStage(stages[currentIndex + 1]);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to complete count session.",
        variant: "destructive"
      });
    }
  };

  const generatePDFForStage = useCallback((stage: CountStage, session: CountSession): jsPDF => {
    const countItems = standItems.map(si => ({
      itemName: si.item.name,
      category: si.item.category,
      count: counts[stage]?.[si.itemId] || 0
    }));

    return generateCountSessionPDF({
      standName: stand?.name || '',
      eventDate,
      stage: STAGE_CONFIG[stage].label,
      counterName: session.assistingCounterName 
        ? `${session.counterName} (with ${session.assistingCounterName})`
        : session.counterName,
      counterRole: ROLE_LABELS[session.counterRole],
      counterAffiliation: session.counterAffiliation,
      startedAt: session.startedAt,
      completedAt: session.completedAt,
      items: countItems
    });
  }, [stand, standItems, counts, eventDate]);

  const formatTime = (isoString?: string) => {
    if (!isoString) return '';
    return new Date(isoString).toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const itemsByCategory = standItems.reduce((acc, si) => {
    const cat = si.item.category;
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(si);
    return acc;
  }, {} as Record<string, StandItem[]>);

  const categories = Object.keys(itemsByCategory);
  const stages: CountStage[] = ['PreEvent', 'PostEvent', 'DayAfter'];

  if (loading) {
    return (
      <AnimatedBackground>
        <div className="min-h-screen flex items-center justify-center" data-testid="loading-spinner">
          <Loader2 className="h-8 w-8 text-cyan-400 animate-spin" />
        </div>
      </AnimatedBackground>
    );
  }

  if (!stand) {
    return (
      <AnimatedBackground>
        <div className="min-h-screen flex items-center justify-center p-4" data-testid="stand-not-found">
          <GlassCard className="max-w-md w-full">
            <GlassCardContent className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-amber-400 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-slate-200 mb-2">Stand Not Found</h2>
              <p className="text-slate-400 mb-4">Could not find stand {standId}.</p>
              <Button onClick={() => setLocation('/manager')} className="bg-cyan-500 hover:bg-cyan-600" data-testid="button-return-dashboard">
                Return to Dashboard
              </Button>
            </GlassCardContent>
          </GlassCard>
        </div>
      </AnimatedBackground>
    );
  }

  const session = getSessionForStage(activeStage);
  const status = getStageStatus(activeStage);
  const stageCounts = counts[activeStage] || {};
  const countedItems = Object.keys(stageCounts).length;
  const progress = standItems.length > 0 ? Math.round((countedItems / standItems.length) * 100) : 0;

  const metricsCards = stages.map(stage => {
    const stageStatus = getStageStatus(stage);
    const config = STAGE_CONFIG[stage];
    const stageSession = getSessionForStage(stage);
    const stageCountedItems = Object.keys(counts[stage] || {}).length;
    return (
      <div
        key={stage}
        onClick={() => setActiveStage(stage)}
        className={`p-3 rounded-lg border cursor-pointer transition-all min-w-[140px] ${
          activeStage === stage ? 'bg-cyan-500/20 border-cyan-500/50' : 'bg-white/5 border-white/10 hover:bg-white/10'
        }`}
        data-testid={`metric-card-${stage}`}
      >
        <div className="flex items-center gap-2 mb-1">
          <span className="text-lg">{config.icon}</span>
          <Badge className={`text-[10px] ${
            stageStatus === 'verified' ? 'bg-purple-500/20 text-purple-300' :
            stageStatus === 'completed' ? 'bg-emerald-500/20 text-emerald-300' :
            stageStatus === 'in_progress' ? 'bg-cyan-500/20 text-cyan-300' :
            'bg-slate-500/20 text-slate-400'
          }`}>
            {stageStatus === 'verified' ? '✓✓' : 
             stageStatus === 'completed' ? '✓' : 
             stageStatus === 'in_progress' ? '●' : '○'}
          </Badge>
        </div>
        <div className="text-sm font-medium text-slate-200">{config.label.split(' ')[0]}</div>
        <div className="text-xs text-slate-500">
          {stageSession ? `${stageCountedItems}/${standItems.length}` : 'Not started'}
        </div>
      </div>
    );
  });

  const itemCards = categories.map(category => (
    <div key={category} className="p-3 rounded-lg bg-white/5 border border-white/10 min-w-[120px]" data-testid={`category-card-${category}`}>
      <Package className="h-4 w-4 text-cyan-400 mb-1" />
      <div className="text-sm font-medium text-slate-200">{category}</div>
      <div className="text-xs text-slate-500">{itemsByCategory[category].length} items</div>
    </div>
  ));

  const instructionItems = stages.map(stage => ({
    title: `${STAGE_CONFIG[stage].icon} ${STAGE_CONFIG[stage].label}`,
    content: (
      <div className="space-y-2">
        <p>{STAGE_CONFIG[stage].description}</p>
        {getSessionForStage(stage) && (
          <div className="text-xs text-cyan-400">
            Counter: {getSessionForStage(stage)?.counterName}
          </div>
        )}
      </div>
    )
  }));

  return (
    <AnimatedBackground>
      <div className="min-h-screen pb-20" data-testid="event-count-session">
        <PageHeader
          title={stand.name}
          subtitle={`Event Count Session • ${eventDate}`}
          icon={<ClipboardList className="h-6 w-6 text-cyan-400" />}
          iconColor="cyan"
          actions={
            <Link href="/manager">
              <Button variant="ghost" size="sm" className="text-slate-300 hover:bg-white/10" data-testid="button-back">
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
            </Link>
          }
        />

        <main className="container mx-auto p-4">
          {standItems.length === 0 ? (
            <GlassCard data-testid="no-template-card">
              <GlassCardContent className="text-center py-12">
                <Package className="h-12 w-12 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400 mb-2">No inventory template configured for this stand</p>
                <p className="text-sm text-slate-500 mb-4">Set up the stand's inventory template before counting</p>
                <Button onClick={() => setLocation('/stand-setup')} className="bg-cyan-500 hover:bg-cyan-600" data-testid="button-configure-template">
                  Configure Stand Template
                </Button>
              </GlassCardContent>
            </GlassCard>
          ) : (
            <LayoutShell className="gap-3">
              <BentoCard span={12} className="p-2" data-testid="metrics-carousel-card">
                <CarouselRail items={metricsCards} title="Count Stages" data-testid="metrics-carousel" />
              </BentoCard>

              <BentoCard span={4} className="hidden lg:block" data-testid="items-carousel-card">
                <CarouselRail items={itemCards} title="Categories" showDots data-testid="items-carousel" />
              </BentoCard>

              <BentoCard span={12} rowSpan={2} className="lg:col-span-5" data-testid="progress-grid-card">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-300">{STAGE_CONFIG[activeStage].label}</span>
                    <Badge className={`text-[10px] ${
                      status === 'verified' ? 'bg-purple-500/20 text-purple-300' :
                      status === 'completed' ? 'bg-emerald-500/20 text-emerald-300' :
                      status === 'in_progress' ? 'bg-cyan-500/20 text-cyan-300 animate-pulse' :
                      'bg-slate-500/20 text-slate-400'
                    }`} data-testid="status-badge">
                      {status.replace('_', ' ')}
                    </Badge>
                  </div>

                  {status === 'not_started' ? (
                    <div className="text-center py-8">
                      <GlowButton variant="cyan" onClick={() => openStartDialog(activeStage)} data-testid={`button-start-${activeStage}`}>
                        <Play className="h-4 w-4 mr-2" />
                        Start {STAGE_CONFIG[activeStage].label}
                      </GlowButton>
                    </div>
                  ) : (
                    <>
                      {session && (
                        <div className="p-2 bg-white/5 rounded-lg border border-white/10 text-xs" data-testid="counter-info">
                          <div className="flex items-center gap-2">
                            <User className="h-3 w-3 text-slate-400" />
                            <span className="text-slate-300">{session.counterName}</span>
                            <Badge variant="outline" className="text-[10px] border-white/20">{ROLE_LABELS[session.counterRole]}</Badge>
                          </div>
                          {session.assistingCounterName && (
                            <div className="flex items-center gap-2 mt-1">
                              <Users className="h-3 w-3 text-slate-500" />
                              <span className="text-slate-400">with {session.assistingCounterName}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-3 mt-1 text-slate-500">
                            <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{formatTime(session.startedAt)}</span>
                            {session.completedAt && <span className="flex items-center gap-1"><Check className="h-3 w-3 text-emerald-400" />{formatTime(session.completedAt)}</span>}
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-2 text-sm" data-testid="progress-bar">
                        <div className="flex-1 bg-white/5 rounded-full h-2 overflow-hidden">
                          <motion.div 
                            className={`h-full ${
                              STAGE_CONFIG[activeStage].color === 'emerald' ? 'bg-emerald-500' :
                              STAGE_CONFIG[activeStage].color === 'blue' ? 'bg-blue-500' : 'bg-purple-500'
                            }`}
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                          />
                        </div>
                        <span className="text-slate-400 text-xs">{countedItems}/{standItems.length}</span>
                      </div>

                      {status === 'in_progress' && (
                        <ScrollArea className="h-[240px]" data-testid="items-scroll-area">
                          <div className="space-y-2 pr-2">
                            {categories.map(category => (
                              <div key={category} className="space-y-1">
                                <div className="text-[10px] font-medium text-slate-500 uppercase">{category}</div>
                                {itemsByCategory[category].map(si => {
                                  const key = `${activeStage}-${si.itemId}`;
                                  const count = stageCounts[si.itemId] || 0;
                                  return (
                                    <div key={si.id} className="flex items-center gap-2 p-1.5 bg-white/5 rounded border border-white/10" data-testid={`count-item-${si.itemId}`}>
                                      <span className="flex-1 text-xs text-slate-200 truncate">{si.item.name}</span>
                                      <div className="flex items-center gap-0.5">
                                        <Button variant="outline" size="icon" className="h-6 w-6 rounded-full border-white/20" onClick={() => handleCountChange(activeStage, si.itemId, count - 1)} data-testid={`button-minus-${si.itemId}`}>
                                          <Minus className="h-2.5 w-2.5" />
                                        </Button>
                                        <Input type="number" min="0" value={count || ''} onChange={(e) => handleCountChange(activeStage, si.itemId, parseInt(e.target.value) || 0)} className="w-12 h-6 text-center text-sm bg-white/5 border-white/20 px-1" data-testid={`input-count-${si.itemId}`} />
                                        <Button variant="outline" size="icon" className="h-6 w-6 rounded-full border-white/20" onClick={() => handleCountChange(activeStage, si.itemId, count + 1)} data-testid={`button-plus-${si.itemId}`}>
                                          <Plus className="h-2.5 w-2.5" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => saveCount(activeStage, si.itemId)} disabled={savingCounts[key]} data-testid={`button-save-${si.itemId}`}>
                                          {savingCounts[key] ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3 text-cyan-400" />}
                                        </Button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      )}

                      {(status === 'completed' || status === 'verified') && (
                        <div className="space-y-2" data-testid="completed-items-view">
                          <ScrollArea className="h-[160px]">
                            <div className="space-y-1 pr-2">
                              {standItems.map(si => (
                                <div key={si.id} className="flex items-center justify-between p-1.5 bg-white/5 rounded border border-white/10" data-testid={`completed-item-${si.itemId}`}>
                                  <span className="text-xs text-slate-300">{si.item.name}</span>
                                  <span className="font-bold text-xs text-slate-200">{stageCounts[si.itemId] || 0}</span>
                                </div>
                              ))}
                            </div>
                          </ScrollArea>
                          {session && (
                            <PDFActionButtons generatePDF={() => generatePDFForStage(activeStage, session)} filename={`count-${activeStage.toLowerCase()}-${stand.id}-${eventDate.replace(/\//g, '-')}.pdf`} title={`${STAGE_CONFIG[activeStage].label} Report`} variant="compact" />
                          )}
                        </div>
                      )}

                      {status === 'in_progress' && (
                        <GlowButton variant="cyan" className="w-full" onClick={() => completeSession(activeStage)} data-testid={`button-complete-${activeStage}`}>
                          <Check className="h-4 w-4 mr-2" />
                          Complete {STAGE_CONFIG[activeStage].label}
                        </GlowButton>
                      )}
                    </>
                  )}
                </div>
              </BentoCard>

              <BentoCard span={12} className="lg:col-span-3" data-testid="instructions-accordion-card">
                <AccordionStack items={instructionItems} defaultOpen={[stages.indexOf(activeStage)]} />
              </BentoCard>
            </LayoutShell>
          )}
        </main>

        <Dialog open={startSessionDialogOpen} onOpenChange={setStartSessionDialogOpen}>
          <DialogContent className="bg-slate-900 border-slate-700 max-w-md" data-testid="dialog-start-session">
            <DialogHeader>
              <DialogTitle className="text-slate-200 flex items-center gap-2">
                <Play className="h-5 w-5 text-cyan-400" />
                Start {startingStage ? STAGE_CONFIG[startingStage].label : 'Count'}
              </DialogTitle>
              <DialogDescription className="text-slate-400">Document who is performing this count</DialogDescription>
            </DialogHeader>

            <div className="space-y-4 mt-4">
              <div className="p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-lg">
                <h4 className="text-sm font-medium text-cyan-300 mb-3">Primary Counter</h4>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label className="text-slate-400 text-xs">Name</Label>
                    <Input value={counterName} onChange={(e) => setCounterName(e.target.value)} placeholder="Counter's full name" className="bg-white/5 border-white/10" data-testid="input-counter-name" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-slate-400 text-xs">Role</Label>
                      <Select value={counterRole} onValueChange={(v) => setCounterRole(v as CounterRole)}>
                        <SelectTrigger className="bg-white/5 border-white/10"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {Object.entries(ROLE_LABELS).map(([value, label]) => (
                            <SelectItem key={value} value={value}>{label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-slate-400 text-xs">Phone (last 4)</Label>
                      <Input value={counterPhone4} onChange={(e) => setCounterPhone4(e.target.value.slice(0, 4))} placeholder="1234" maxLength={4} className="bg-white/5 border-white/10" data-testid="input-counter-phone" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-slate-400 text-xs">Affiliation</Label>
                    <Select value={counterAffiliation} onValueChange={(v) => setCounterAffiliation(v as EmploymentAffiliation)}>
                      <SelectTrigger className="bg-white/5 border-white/10"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(AFFILIATION_LABELS).map(([value, label]) => (
                          <SelectItem key={value} value={value}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-white/5 border border-white/10 rounded-lg">
                <h4 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Assisting Counter (Optional)
                </h4>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label className="text-slate-400 text-xs">Name</Label>
                    <Input value={assistingName} onChange={(e) => setAssistingName(e.target.value)} placeholder="Helper's full name (optional)" className="bg-white/5 border-white/10" data-testid="input-assisting-name" />
                  </div>
                  {assistingName && (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-slate-400 text-xs">Phone (last 4)</Label>
                        <Input value={assistingPhone4} onChange={(e) => setAssistingPhone4(e.target.value.slice(0, 4))} placeholder="1234" maxLength={4} className="bg-white/5 border-white/10" data-testid="input-assisting-phone" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-slate-400 text-xs">Affiliation</Label>
                        <Select value={assistingAffiliation} onValueChange={(v) => setAssistingAffiliation(v as EmploymentAffiliation)}>
                          <SelectTrigger className="bg-white/5 border-white/10"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {Object.entries(AFFILIATION_LABELS).map(([value, label]) => (
                              <SelectItem key={value} value={value}>{label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <DialogFooter className="mt-4">
              <Button variant="ghost" onClick={() => setStartSessionDialogOpen(false)} data-testid="button-cancel-start">Cancel</Button>
              <GlowButton variant="cyan" onClick={startCountSession} disabled={!counterName || !counterPhone4} data-testid="button-confirm-start">
                <Play className="h-4 w-4 mr-2" />
                Start Count
              </GlowButton>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AnimatedBackground>
  );
}
