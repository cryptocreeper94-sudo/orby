import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Users, 
  Crown, 
  ChevronLeft, 
  Search, 
  UserPlus,
  Check,
  X,
  AlertCircle
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  AnimatedBackground, 
  GlassCard, 
  GlassCardContent, 
  PageHeader,
} from "@/components/ui/premium";
import { useStore } from "@/lib/mockData";
import { LayoutShell, BentoCard, CarouselRail, AccordionStack } from "@/components/ui/bento";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";

type Worker = {
  id: string;
  name: string;
  department: string;
  role: string;
  isTeamLead: boolean;
  teamLeadId: string | null;
  isOnline?: boolean;
};

const DEPARTMENTS = ['Warehouse', 'Kitchen', 'Operations', 'Bar'];

export default function TeamManagement() {
  const [, setLocation] = useLocation();
  const currentUser = useStore((state: { currentUser: any }) => state.currentUser);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
  const [teamLeads, setTeamLeads] = useState<Worker[]>([]);

  useEffect(() => {
    async function fetchWorkers() {
      try {
        const response = await fetch('/api/users');
        if (response.ok) {
          const data = await response.json();
          const workerData = data.filter((u: Worker) => 
            DEPARTMENTS.includes(u.department) && 
            ['NPO', 'StandLead', 'StandSupervisor'].includes(u.role)
          );
          setWorkers(workerData);
          setTeamLeads(data.filter((u: Worker) => u.isTeamLead));
        }
      } catch (error) {
        console.error('Failed to fetch workers:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchWorkers();
  }, []);

  const filteredWorkers = workers.filter(worker => {
    const matchesDepartment = selectedDepartment === 'all' || worker.department === selectedDepartment;
    const matchesSearch = worker.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDepartment && matchesSearch;
  });

  const departmentTeamLeads = teamLeads.filter(lead => 
    selectedDepartment === 'all' || lead.department === selectedDepartment
  );

  const getTeamLeadName = (teamLeadId: string | null) => {
    if (!teamLeadId) return null;
    const lead = teamLeads.find(l => l.id === teamLeadId);
    return lead?.name || null;
  };

  const handleAssignTeamLead = async (workerId: string, leadId: string | null) => {
    try {
      const response = await fetch(`/api/users/${workerId}/assign-team-lead`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamLeadId: leadId })
      });
      
      if (response.ok) {
        setWorkers(prev => prev.map(w => 
          w.id === workerId ? { ...w, teamLeadId: leadId } : w
        ));
        setAssignDialogOpen(false);
        setSelectedWorker(null);
      }
    } catch (error) {
      console.error('Failed to assign team lead:', error);
    }
  };

  const handlePromoteToTeamLead = async (workerId: string) => {
    try {
      const response = await fetch(`/api/users/${workerId}/promote-team-lead`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isTeamLead: true })
      });
      
      if (response.ok) {
        setWorkers(prev => prev.map(w => 
          w.id === workerId ? { ...w, isTeamLead: true } : w
        ));
        const promoted = workers.find(w => w.id === workerId);
        if (promoted) {
          setTeamLeads(prev => [...prev, { ...promoted, isTeamLead: true }]);
        }
      }
    } catch (error) {
      console.error('Failed to promote to team lead:', error);
    }
  };

  const handleDemoteFromTeamLead = async (workerId: string) => {
    try {
      const response = await fetch(`/api/users/${workerId}/promote-team-lead`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isTeamLead: false })
      });
      
      if (response.ok) {
        const refreshResponse = await fetch('/api/users');
        if (refreshResponse.ok) {
          const data = await refreshResponse.json();
          const workerData = data.filter((u: Worker) => 
            DEPARTMENTS.includes(u.department) && 
            ['NPO', 'StandLead', 'StandSupervisor'].includes(u.role)
          );
          setWorkers(workerData);
          setTeamLeads(data.filter((u: Worker) => u.isTeamLead));
        }
      }
    } catch (error) {
      console.error('Failed to demote team lead:', error);
    }
  };

  if (!currentUser || !['Developer', 'Admin', 'Management'].includes(currentUser.role)) {
    return (
      <AnimatedBackground>
        <div className="min-h-screen flex items-center justify-center p-4" data-testid="access-restricted">
          <GlassCard className="max-w-md w-full">
            <GlassCardContent className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-amber-400 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-slate-200 mb-2">Access Restricted</h2>
              <p className="text-slate-400 mb-4">Team management is only available for managers.</p>
              <Button onClick={() => setLocation('/')} className="bg-cyan-500 hover:bg-cyan-600" data-testid="button-return-home">
                Return Home
              </Button>
            </GlassCardContent>
          </GlassCard>
        </div>
      </AnimatedBackground>
    );
  }

  const departmentStats = DEPARTMENTS.map(dept => {
    const deptWorkers = workers.filter(w => w.department === dept);
    const deptLeads = teamLeads.filter(l => l.department === dept);
    return { dept, workers: deptWorkers.length, leads: deptLeads.length };
  });

  const metricsCards = [
    <div key="total" className="p-3 rounded-lg bg-white/5 border border-white/10 min-w-[120px]" data-testid="metric-total-workers">
      <Users className="h-4 w-4 text-cyan-400 mb-1" />
      <div className="text-lg font-bold text-slate-200">{workers.length}</div>
      <div className="text-xs text-slate-500">Total Workers</div>
    </div>,
    <div key="leads" className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30 min-w-[120px]" data-testid="metric-team-leads">
      <Crown className="h-4 w-4 text-yellow-400 mb-1" />
      <div className="text-lg font-bold text-yellow-400">{teamLeads.length}</div>
      <div className="text-xs text-slate-500">Team Leads</div>
    </div>,
    ...departmentStats.map(({ dept, workers: count, leads }) => (
      <div key={dept} className="p-3 rounded-lg bg-white/5 border border-white/10 min-w-[120px]" data-testid={`metric-${dept.toLowerCase()}`}>
        <div className="text-xs text-slate-500 mb-1">{dept}</div>
        <div className="text-lg font-bold text-slate-200">{count}</div>
        <div className="text-xs text-cyan-400">{leads} leads</div>
      </div>
    ))
  ];

  const memberCards = departmentTeamLeads.map(lead => (
    <motion.div
      key={lead.id}
      className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 min-w-[180px]"
      data-testid={`team-lead-card-${lead.id}`}
    >
      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-500 to-amber-600 flex items-center justify-center">
          <Crown className="h-4 w-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-slate-200 truncate">{lead.name}</div>
          <div className="text-xs text-slate-400">{lead.department}</div>
        </div>
      </div>
      <Button
        size="sm"
        variant="ghost"
        className="w-full text-slate-400 hover:text-red-400 hover:bg-red-500/10 h-7 text-xs"
        onClick={() => handleDemoteFromTeamLead(lead.id)}
        data-testid={`button-demote-${lead.id}`}
      >
        <X className="h-3 w-3 mr-1" />
        Remove Lead
      </Button>
    </motion.div>
  ));

  const policyItems = [
    {
      title: "👑 Team Lead Responsibilities",
      content: "Team leads are responsible for coordinating staff, ensuring tasks are completed, and reporting to supervisors. They serve as the primary point of contact for their team."
    },
    {
      title: "🔄 Assigning Team Leads",
      content: "Click the crown icon next to a worker's name to promote them to team lead. Each department can have multiple team leads."
    },
    {
      title: "👥 Worker Assignments",
      content: "Use the assign button to link workers to their team lead. Workers can be reassigned as needed throughout the event."
    },
    {
      title: "📊 Department Organization",
      content: "Workers are organized by department: Warehouse, Kitchen, Operations, and Bar. Use the tabs to filter by department."
    }
  ];

  return (
    <AnimatedBackground>
      <div className="min-h-screen pb-20" data-testid="team-management-page">
        <PageHeader
          title="Team Management"
          subtitle="Assign and manage team leads"
          icon={<Crown className="h-6 w-6 text-amber-400" />}
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

        <main className="container mx-auto p-4">
          <LayoutShell className="gap-3">
            <BentoCard span={12} className="p-2" data-testid="metrics-carousel-card">
              <CarouselRail items={metricsCards} title="Team Overview" data-testid="metrics-carousel" />
            </BentoCard>

            <BentoCard span={12} className="lg:col-span-4" data-testid="members-carousel-card">
              <div className="text-sm font-medium text-slate-300 mb-2">Current Team Leads</div>
              {memberCards.length > 0 ? (
                <CarouselRail items={memberCards} showDots data-testid="members-carousel" />
              ) : (
                <div className="text-center py-6 text-slate-500 text-sm" data-testid="no-leads">
                  No team leads in this department
                </div>
              )}
            </BentoCard>

            <BentoCard span={12} rowSpan={2} className="lg:col-span-5" data-testid="roles-grid-card">
              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search workers..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-white/5 border-white/10 text-slate-200"
                    data-testid="input-search-workers"
                  />
                </div>

                <Tabs value={selectedDepartment} onValueChange={setSelectedDepartment} data-testid="department-tabs">
                  <TabsList className="grid grid-cols-5 bg-white/5 h-8">
                    <TabsTrigger value="all" className="text-[10px] data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400" data-testid="tab-all">All</TabsTrigger>
                    {DEPARTMENTS.map(dept => (
                      <TabsTrigger key={dept} value={dept} className="text-[10px] data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400" data-testid={`tab-${dept.toLowerCase()}`}>
                        {dept.slice(0, 4)}
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  <TabsContent value={selectedDepartment} className="mt-2">
                    {loading ? (
                      <div className="flex items-center justify-center py-8" data-testid="loading-workers">
                        <div className="w-6 h-6 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" />
                      </div>
                    ) : filteredWorkers.length === 0 ? (
                      <div className="text-center py-8" data-testid="no-workers">
                        <Users className="h-10 w-10 text-slate-600 mx-auto mb-2" />
                        <p className="text-slate-400 text-sm">No workers found</p>
                      </div>
                    ) : (
                      <ScrollArea className="h-[280px]" data-testid="workers-scroll-area">
                        <div className="space-y-1 pr-2">
                          {filteredWorkers.map((worker) => (
                            <motion.div
                              key={worker.id}
                              initial={{ opacity: 0, y: 5 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="flex items-center justify-between p-2 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors"
                              data-testid={`worker-${worker.id}`}
                            >
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center">
                                  <Users className="h-4 w-4 text-slate-300" />
                                </div>
                                <div>
                                  <div className="flex items-center gap-1">
                                    <span className="font-medium text-slate-200 text-sm">{worker.name}</span>
                                    {worker.isTeamLead && (
                                      <Badge className="text-[10px] bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 h-4 px-1">Lead</Badge>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-1 text-[10px]">
                                    <span className="text-slate-400">{worker.department}</span>
                                    {worker.teamLeadId && (
                                      <span className="text-cyan-400">• {getTeamLeadName(worker.teamLeadId)}</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                {!worker.isTeamLead && (
                                  <Button size="sm" variant="ghost" className="text-yellow-400 hover:bg-yellow-500/10 h-7 w-7 p-0" onClick={() => handlePromoteToTeamLead(worker.id)} data-testid={`button-promote-${worker.id}`}>
                                    <Crown className="h-3.5 w-3.5" />
                                  </Button>
                                )}
                                <Button size="sm" variant="ghost" className="text-cyan-400 hover:bg-cyan-500/10 h-7 w-7 p-0" onClick={() => { setSelectedWorker(worker); setAssignDialogOpen(true); }} data-testid={`button-assign-${worker.id}`}>
                                  <UserPlus className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </ScrollArea>
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            </BentoCard>

            <BentoCard span={12} className="lg:col-span-3" data-testid="policies-accordion-card">
              <AccordionStack items={policyItems} defaultOpen={[0]} />
            </BentoCard>
          </LayoutShell>
        </main>

        <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
          <DialogContent className="bg-slate-900 border-slate-700" data-testid="dialog-assign-lead">
            <DialogHeader>
              <DialogTitle className="text-slate-200">Assign Team Lead</DialogTitle>
              <DialogDescription className="text-slate-400">
                Select a team lead for {selectedWorker?.name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2 mt-4">
              {selectedWorker?.teamLeadId && (
                <Button
                  variant="outline"
                  className="w-full justify-start text-slate-300 border-slate-600 hover:bg-red-500/10 hover:border-red-500/30"
                  onClick={() => handleAssignTeamLead(selectedWorker.id, null)}
                  data-testid="button-remove-lead"
                >
                  <X className="h-4 w-4 mr-2 text-red-400" />
                  Remove Team Lead
                </Button>
              )}
              {teamLeads
                .filter(lead => lead.department === selectedWorker?.department)
                .map(lead => (
                  <Button
                    key={lead.id}
                    variant="outline"
                    className={`w-full justify-start text-slate-300 border-slate-600 hover:bg-cyan-500/10 ${
                      selectedWorker?.teamLeadId === lead.id ? 'bg-cyan-500/20 border-cyan-500/30' : ''
                    }`}
                    onClick={() => handleAssignTeamLead(selectedWorker!.id, lead.id)}
                    data-testid={`button-select-lead-${lead.id}`}
                  >
                    <Crown className="h-4 w-4 mr-2 text-yellow-400" />
                    {lead.name}
                    {selectedWorker?.teamLeadId === lead.id && (
                      <Check className="h-4 w-4 ml-auto text-cyan-400" />
                    )}
                  </Button>
                ))}
              {teamLeads.filter(lead => lead.department === selectedWorker?.department).length === 0 && (
                <div className="text-center py-4" data-testid="no-leads-in-dept">
                  <p className="text-sm text-slate-500">No team leads in this department</p>
                  <p className="text-xs text-slate-600 mt-1">Promote a worker to team lead first</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AnimatedBackground>
  );
}
