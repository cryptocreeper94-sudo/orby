import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, 
  Crown, 
  ChevronLeft, 
  Search, 
  MessageSquare,
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
      }
    } catch (error) {
      console.error('Failed to demote team lead:', error);
    }
  };

  if (!currentUser || !['Developer', 'Admin', 'Management'].includes(currentUser.role)) {
    return (
      <AnimatedBackground>
        <div className="min-h-screen flex items-center justify-center p-4">
          <GlassCard className="max-w-md w-full">
            <GlassCardContent className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-amber-400 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-slate-200 mb-2">Access Restricted</h2>
              <p className="text-slate-400 mb-4">Team management is only available for managers.</p>
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

        <main className="container mx-auto p-4 space-y-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search workers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white/5 border-white/10 text-slate-200"
                data-testid="input-search-workers"
              />
            </div>
          </div>

          <Tabs value={selectedDepartment} onValueChange={setSelectedDepartment} data-testid="department-tabs">
            <TabsList className="grid grid-cols-5 bg-white/5">
              <TabsTrigger value="all" className="text-xs data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400" data-testid="tab-all">
                All
              </TabsTrigger>
              {DEPARTMENTS.map(dept => (
                <TabsTrigger 
                  key={dept} 
                  value={dept} 
                  className="text-xs data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400"
                  data-testid={`tab-${dept.toLowerCase()}`}
                >
                  {dept}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value={selectedDepartment} className="mt-4 space-y-6">
              {departmentTeamLeads.length > 0 && (
                <GlassCard data-testid="card-team-leads">
                  <GlassCardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-yellow-500/20">
                        <Crown className="h-4 w-4 text-yellow-400" />
                      </div>
                      <span className="font-bold text-sm text-slate-200">Current Team Leads</span>
                    </div>
                  </GlassCardHeader>
                  <GlassCardContent className="space-y-2 pt-0">
                    {departmentTeamLeads.map((lead, idx) => (
                      <motion.div
                        key={lead.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="flex items-center justify-between p-3 bg-yellow-500/10 rounded-xl border border-yellow-500/20"
                        data-testid={`team-lead-${lead.id}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-500 to-amber-600 flex items-center justify-center">
                            <Crown className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-slate-200">{lead.name}</span>
                              <Badge className="text-[10px] bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                                Team Lead
                              </Badge>
                            </div>
                            <span className="text-xs text-slate-400">{lead.department}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-slate-400 hover:text-red-400 hover:bg-red-500/10"
                            onClick={() => handleDemoteFromTeamLead(lead.id)}
                            data-testid={`button-demote-${lead.id}`}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                  </GlassCardContent>
                </GlassCard>
              )}

              <GlassCard data-testid="card-workers">
                <GlassCardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-cyan-500/20">
                      <Users className="h-4 w-4 text-cyan-400" />
                    </div>
                    <span className="font-bold text-sm text-slate-200">
                      Workers ({filteredWorkers.length})
                    </span>
                  </div>
                </GlassCardHeader>
                <GlassCardContent className="pt-0">
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="w-6 h-6 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" />
                    </div>
                  ) : filteredWorkers.length === 0 ? (
                    <div className="text-center py-8">
                      <Users className="h-12 w-12 text-slate-600 mx-auto mb-3" />
                      <p className="text-slate-400">No workers found</p>
                      <p className="text-sm text-slate-500 mt-1">
                        {searchQuery ? 'Try a different search' : 'No workers registered in this department'}
                      </p>
                    </div>
                  ) : (
                    <ScrollArea className="h-[400px]">
                      <div className="space-y-2 pr-4">
                        <AnimatePresence>
                          {filteredWorkers.map((worker, idx) => (
                            <motion.div
                              key={worker.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              transition={{ delay: idx * 0.03 }}
                              className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-colors"
                              data-testid={`worker-${worker.id}`}
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center">
                                  <Users className="h-5 w-5 text-slate-300" />
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-slate-200">{worker.name}</span>
                                    {worker.isTeamLead && (
                                      <Badge className="text-[10px] bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                                        Lead
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs text-slate-400">{worker.department}</span>
                                    {worker.teamLeadId && (
                                      <>
                                        <span className="text-xs text-slate-600">•</span>
                                        <span className="text-xs text-cyan-400">
                                          Lead: {getTeamLeadName(worker.teamLeadId)}
                                        </span>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {!worker.isTeamLead && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="text-yellow-400 hover:bg-yellow-500/10"
                                    onClick={() => handlePromoteToTeamLead(worker.id)}
                                    data-testid={`button-promote-${worker.id}`}
                                  >
                                    <Crown className="h-4 w-4" />
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-cyan-400 hover:bg-cyan-500/10"
                                  onClick={() => {
                                    setSelectedWorker(worker);
                                    setAssignDialogOpen(true);
                                  }}
                                  data-testid={`button-assign-${worker.id}`}
                                >
                                  <UserPlus className="h-4 w-4" />
                                </Button>
                              </div>
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      </div>
                    </ScrollArea>
                  )}
                </GlassCardContent>
              </GlassCard>
            </TabsContent>
          </Tabs>
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
                <div className="text-center py-4">
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
