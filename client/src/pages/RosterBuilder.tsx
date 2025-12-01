import { useStore, SECTIONS } from "@/lib/mockData";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, Plus, Users, Save, Trash2 } from "lucide-react";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";

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

  const supervisors = users.filter(u => u.role === 'Supervisor');

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

    // Reset form
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex flex-col">
      <header className="sticky top-0 z-10 bg-slate-950/95 backdrop-blur-sm border-b border-cyan-500/20 px-4 h-14 flex items-center gap-3 shadow-sm shrink-0">
        <Button variant="ghost" size="icon" onClick={() => window.history.back()} className="-ml-2">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="font-bold text-lg flex-1 text-slate-200">Roster & Group Builder</div>
      </header>

      <main className="flex-1 p-4 max-w-5xl mx-auto w-full grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Column: Form */}
        <div className="md:col-span-1 space-y-4">
          <Card className="border-slate-700 bg-slate-900/80 shadow-md">
            <CardHeader>
              <CardTitle className="text-slate-200">Create Group</CardTitle>
              <CardDescription>Configure a new staffing group for this event.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Group Name</Label>
                <Input 
                  placeholder="e.g., 'Joe's Section' or 'Group A'" 
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Stand Supervisor</Label>
                <Select value={selectedSupervisor} onValueChange={setSelectedSupervisor}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Supervisor" />
                  </SelectTrigger>
                  <SelectContent>
                    {supervisors.map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Assign NPO Group (Optional)</Label>
                <Select value={selectedNPO} onValueChange={setSelectedNPO}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select NPO" />
                  </SelectTrigger>
                  <SelectContent>
                    {npos.map(n => (
                      <SelectItem key={n.id} value={n.id}>{n.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedNPO && (
                  <div className="text-xs text-muted-foreground bg-slate-800 border border-slate-700 p-2 rounded">
                    Leader: {npos.find(n => n.id === selectedNPO)?.groupLeader}<br/>
                    Contact: {npos.find(n => n.id === selectedNPO)?.contact}
                  </div>
                )}
              </div>

              <Separator />
              
              <div className="pt-2">
                <Button className="w-full" onClick={handleCreateGroup}>
                  <Save className="mr-2 h-4 w-4" /> Save Group Configuration
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Active Groups List */}
          {staffingGroups.length > 0 && (
            <Card className="border-slate-700 bg-slate-900/80 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold uppercase text-slate-200">Configured Groups</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {staffingGroups.map(group => (
                  <div key={group.id} className="p-3 bg-slate-800/80 border border-slate-700 rounded-lg shadow-sm text-sm">
                    <div className="font-bold flex justify-between text-slate-200">
                      {group.name}
                      <Badge variant="secondary" className="text-[10px]">{group.standIds.length} Stands</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Sup: {users.find(u => u.id === group.supervisorId)?.name}
                    </div>
                    {group.npoId && (
                       <div className="text-xs text-blue-400 mt-1 font-medium">
                         NPO: {npos.find(n => n.id === group.npoId)?.name}
                       </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column: Stand Selector */}
        <div className="md:col-span-2 h-[calc(100vh-120px)] flex flex-col">
          <div className="bg-slate-900/80 border-slate-700 p-4 rounded-t-lg border border-b-0 flex items-center justify-between">
            <h3 className="font-bold flex items-center gap-2 text-slate-200">
              <Users className="h-5 w-5 text-cyan-400" />
              Select Stands ({selectedStands.length})
            </h3>
            <Select value={filterSection} onValueChange={setFilterSection}>
               <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter Section" />
               </SelectTrigger>
               <SelectContent>
                  <SelectItem value="all">All Sections</SelectItem>
                  {SECTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
               </SelectContent>
            </Select>
          </div>
          
          <div className="flex-1 bg-slate-950 border border-slate-700 rounded-b-lg overflow-hidden">
            <ScrollArea className="h-full p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filteredStands.map(stand => (
                  <div 
                    key={stand.id} 
                    className={`
                      flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all
                      ${selectedStands.includes(stand.id) 
                        ? 'bg-cyan-950/30 border-cyan-500 ring-1 ring-cyan-500' 
                        : 'bg-slate-900/80 border-slate-700 hover:border-cyan-500/50'}
                    `}
                    onClick={() => toggleStand(stand.id)}
                  >
                    <Checkbox 
                      checked={selectedStands.includes(stand.id)}
                      onCheckedChange={() => toggleStand(stand.id)}
                    />
                    <div className="flex-1">
                      <div className="font-bold text-sm text-slate-200">{stand.name}</div>
                      <div className="text-xs text-muted-foreground flex gap-2">
                        <Badge variant="outline" className="text-[10px] h-4 px-1 border-slate-600">{stand.section}</Badge>
                        <span className="font-mono">{stand.id}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>

      </main>
    </div>
  );
}
