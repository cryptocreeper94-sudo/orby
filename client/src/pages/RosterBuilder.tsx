import { useStore, SECTIONS } from "@/lib/mockData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, Users, Save, ClipboardList, Building2 } from "lucide-react";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { AnimatedBackground, PageHeader, GlowButton } from "@/components/ui/premium";
import { LayoutShell, BentoCard, CarouselRail, AccordionStack } from "@/components/ui/bento";

export default function RosterBuilder() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const stands = useStore((state) => state.stands);
  const users = useStore((state) => state.users);
  const npos = useStore((state) => state.npos);
  const createStaffingGroup = useStore((state) => state.createStaffingGroup);
  const staffingGroups = useStore((state) => state.staffingGroups);
  const fetchAll = useStore((state) => state.fetchAll);
  
  const [groupName, setGroupName] = useState("");
  const [selectedSupervisor, setSelectedSupervisor] = useState("");
  const [selectedNPO, setSelectedNPO] = useState("");
  const [selectedStands, setSelectedStands] = useState<string[]>([]);
  const [filterSection, setFilterSection] = useState<string>("all");

  useEffect(() => {
    if (users.length === 0) {
      fetchAll();
    }
  }, [users.length, fetchAll]);

  const supervisors = users.filter(u => u.role === 'StandSupervisor');

  const handleCreateGroup = () => {
    if (!groupName || !selectedSupervisor || selectedStands.length === 0) {
       toast({
         title: "Missing Information",
         description: "Please provide a group name, supervisor, and select at least one stand.",
         variant: "destructive"
       });
       return;
    }

    createStaffingGroup({
      name: groupName,
      supervisorId: selectedSupervisor,
      standIds: selectedStands,
      npoId: selectedNPO || undefined
    });

    toast({
      title: "Group Created",
      description: `${groupName} has been successfully created with ${selectedStands.length} stands.`,
    });

    setGroupName("");
    setSelectedSupervisor("");
    setSelectedNPO("");
    setSelectedStands([]);
  };

  const toggleStand = (standId: string) => {
    setSelectedStands(prev => 
      prev.includes(standId) 
        ? prev.filter(id => id !== standId)
        : [...prev, standId]
    );
  };

  const filteredStands = filterSection === "all" 
    ? stands 
    : stands.filter(s => s.section === filterSection);

  const metricsCards = [
    <div key="groups" className="p-3 rounded-lg bg-white/5 border border-white/10 min-w-[120px]" data-testid="metric-groups">
      <ClipboardList className="h-4 w-4 text-cyan-400 mb-1" />
      <div className="text-lg font-bold text-slate-200">{staffingGroups.length}</div>
      <div className="text-xs text-slate-500">Groups</div>
    </div>,
    <div key="supervisors" className="p-3 rounded-lg bg-white/5 border border-white/10 min-w-[120px]" data-testid="metric-supervisors">
      <Users className="h-4 w-4 text-cyan-400 mb-1" />
      <div className="text-lg font-bold text-slate-200">{supervisors.length}</div>
      <div className="text-xs text-slate-500">Supervisors</div>
    </div>,
    <div key="stands" className="p-3 rounded-lg bg-white/5 border border-white/10 min-w-[120px]" data-testid="metric-stands">
      <Building2 className="h-4 w-4 text-cyan-400 mb-1" />
      <div className="text-lg font-bold text-slate-200">{stands.length}</div>
      <div className="text-xs text-slate-500">Stands</div>
    </div>,
    <div key="npos" className="p-3 rounded-lg bg-white/5 border border-white/10 min-w-[120px]" data-testid="metric-npos">
      <Users className="h-4 w-4 text-amber-400 mb-1" />
      <div className="text-lg font-bold text-slate-200">{npos.length}</div>
      <div className="text-xs text-slate-500">NPO Groups</div>
    </div>,
    <div key="selected" className="p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/30 min-w-[120px]" data-testid="metric-selected">
      <div className="text-xs text-cyan-400 mb-1">Selected</div>
      <div className="text-lg font-bold text-cyan-400">{selectedStands.length}</div>
      <div className="text-xs text-slate-500">Stands</div>
    </div>
  ];

  const staffCards = supervisors.map(sup => (
    <div
      key={sup.id}
      onClick={() => setSelectedSupervisor(sup.id)}
      className={`p-3 rounded-lg border cursor-pointer transition-all min-w-[160px] ${
        selectedSupervisor === sup.id
          ? 'bg-cyan-500/20 border-cyan-500/50'
          : 'bg-white/5 border-white/10 hover:bg-white/10'
      }`}
      data-testid={`supervisor-card-${sup.id}`}
    >
      <div className="flex items-center gap-2 mb-1">
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
          <Users className="h-3.5 w-3.5 text-white" />
        </div>
        <span className="font-medium text-slate-200 text-sm truncate">{sup.name}</span>
      </div>
      <div className="text-xs text-slate-500">{sup.department}</div>
    </div>
  ));

  const existingGroupCards = staffingGroups.map(group => (
    <div key={group.id} className="p-3 rounded-lg bg-slate-800/80 border border-slate-700 min-w-[180px]" data-testid={`group-card-${group.id}`}>
      <div className="flex items-center justify-between mb-1">
        <span className="font-bold text-sm text-slate-200 truncate">{group.name}</span>
        <Badge variant="secondary" className="text-[10px]">{group.standIds?.length ?? 0}</Badge>
      </div>
      <div className="text-xs text-slate-400">
        Sup: {users.find(u => u.id === group.supervisorId)?.name}
      </div>
      {group.npoId && (
        <div className="text-xs text-blue-400 mt-0.5">
          NPO: {npos.find(n => n.id === group.npoId)?.name}
        </div>
      )}
    </div>
  ));

  const guidelineItems = [
    {
      title: "📋 Creating a Group",
      content: "Enter a group name, select a supervisor from the staff carousel, optionally assign an NPO, then select stands from the grid. Click 'Save Group' to create."
    },
    {
      title: "👤 Supervisor Assignment",
      content: "Each group must have one supervisor who oversees all stands in the group. Supervisors are responsible for staff coordination and count verification."
    },
    {
      title: "🏢 Stand Selection",
      content: "Click on stands in the grid to add them to your group. Use the section filter to narrow down stands. Selected stands are highlighted in cyan."
    },
    {
      title: "🤝 NPO Assignment",
      content: "Optionally assign an NPO group to handle staffing. The NPO leader contact information will be displayed for coordination."
    }
  ];

  return (
    <AnimatedBackground>
      <div className="min-h-screen pb-20" data-testid="roster-builder-page">
        <PageHeader
          title="Roster & Group Builder"
          subtitle="Configure staffing groups for events"
          icon={<ClipboardList className="h-6 w-6 text-cyan-400" />}
          iconColor="cyan"
          actions={
            <Button variant="ghost" size="sm" onClick={() => window.history.back()} className="text-slate-300 hover:bg-white/10" data-testid="button-back">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
          }
        />

        <main className="container mx-auto p-4">
          <LayoutShell className="gap-3">
            <BentoCard span={12} className="p-2" data-testid="metrics-carousel-card">
              <CarouselRail items={metricsCards} title="Roster Overview" data-testid="metrics-carousel" />
            </BentoCard>

            <BentoCard span={12} className="lg:col-span-5" data-testid="staff-carousel-card">
              <div className="text-sm font-medium text-slate-300 mb-2">Select Supervisor</div>
              <CarouselRail items={staffCards} showDots data-testid="staff-carousel" />
              
              {staffingGroups.length > 0 && (
                <div className="mt-4">
                  <div className="text-sm font-medium text-slate-300 mb-2">Existing Groups</div>
                  <CarouselRail items={existingGroupCards} showDots data-testid="groups-carousel" />
                </div>
              )}
            </BentoCard>

            <BentoCard span={12} rowSpan={2} className="lg:col-span-4" data-testid="assignments-grid-card">
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label className="text-slate-400 text-xs">Group Name</Label>
                  <Input 
                    placeholder="e.g., 'Joe's Section' or 'Group A'" 
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    className="bg-white/5 border-white/10 text-slate-200"
                    data-testid="input-group-name"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-400 text-xs">NPO Group (Optional)</Label>
                  <Select value={selectedNPO} onValueChange={setSelectedNPO}>
                    <SelectTrigger className="bg-white/5 border-white/10" data-testid="select-npo">
                      <SelectValue placeholder="Select NPO" />
                    </SelectTrigger>
                    <SelectContent>
                      {npos.map(n => (
                        <SelectItem key={n.id} value={n.id}>{n.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedNPO && (
                    <div className="text-xs text-slate-400 bg-slate-800 border border-slate-700 p-2 rounded" data-testid="npo-info">
                      Leader: {npos.find(n => n.id === selectedNPO)?.groupLeader}<br/>
                      Contact: {npos.find(n => n.id === selectedNPO)?.contact}
                    </div>
                  )}
                </div>

                <Separator className="bg-white/10" />

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-300">Select Stands ({selectedStands.length})</span>
                  <Select value={filterSection} onValueChange={setFilterSection}>
                    <SelectTrigger className="w-[120px] bg-white/5 border-white/10 h-7 text-xs" data-testid="select-section">
                      <SelectValue placeholder="Section" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      {SECTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <ScrollArea className="h-[200px]" data-testid="stands-scroll-area">
                  <div className="grid grid-cols-2 gap-2 pr-2">
                    {filteredStands.map(stand => (
                      <div 
                        key={stand.id} 
                        className={`
                          flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all
                          ${selectedStands.includes(stand.id) 
                            ? 'bg-cyan-950/30 border-cyan-500 ring-1 ring-cyan-500' 
                            : 'bg-slate-900/80 border-slate-700 hover:border-cyan-500/50'}
                        `}
                        onClick={() => toggleStand(stand.id)}
                        data-testid={`stand-${stand.id}`}
                      >
                        <Checkbox 
                          checked={selectedStands.includes(stand.id)}
                          onCheckedChange={() => toggleStand(stand.id)}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-xs text-slate-200 truncate">{stand.name}</div>
                          <Badge variant="outline" className="text-[10px] h-4 px-1 border-slate-600">{stand.section}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>

                <GlowButton variant="cyan" className="w-full" onClick={handleCreateGroup} data-testid="button-save-group">
                  <Save className="mr-2 h-4 w-4" /> Save Group Configuration
                </GlowButton>
              </div>
            </BentoCard>

            <BentoCard span={12} className="lg:col-span-3" data-testid="guidelines-accordion-card">
              <AccordionStack items={guidelineItems} defaultOpen={[0]} />
            </BentoCard>
          </LayoutShell>
        </main>
      </div>
    </AnimatedBackground>
  );
}
