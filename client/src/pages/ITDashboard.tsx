import { useStore } from "@/lib/mockData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LogOut, Monitor, Wifi, AlertTriangle, CheckCircle2, MessageSquare } from "lucide-react";
import { useLocation } from "wouter";
import { TutorialHelpButton } from "@/components/TutorialCoach";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

export default function ITDashboard() {
  const logout = useStore((state) => state.logout);
  const [, setLocation] = useLocation();
  const stands = useStore((state) => state.stands);

  const handleLogout = () => {
    logout();
    setLocation("/");
  };

  const tickets = [
    { id: 1, location: "Stand 102", issue: "POS Terminal Offline", priority: "High", time: "5m ago" },
    { id: 2, location: "West Gate", issue: "Scanner Connectivity", priority: "Medium", time: "15m ago" },
    { id: 3, location: "Stand 201", issue: "Printer Jam", priority: "Low", time: "30m ago" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-50 pb-20">
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-cyan-500/20 bg-slate-950/95 backdrop-blur-sm px-4 shadow-sm">
        <div className="flex items-center gap-2 font-bold text-lg text-cyan-400">
          <Monitor className="h-5 w-5" />
          IT Command Center
        </div>
        <Button variant="ghost" size="icon" onClick={handleLogout} className="text-slate-400 hover:text-white hover:bg-slate-800">
          <LogOut className="h-5 w-5" />
        </Button>
      </header>

      <main className="p-4 space-y-4 max-w-5xl mx-auto">
        
        {/* System Status Banner */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-4 flex flex-col items-center text-center space-y-1">
              <Wifi className="h-6 w-6 text-green-500" />
              <div className="text-sm font-medium text-slate-300">Network Status</div>
              <div className="text-xs text-green-500 font-bold uppercase">Online</div>
            </CardContent>
          </Card>
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-4 flex flex-col items-center text-center space-y-1">
              <Monitor className="h-6 w-6 text-green-500" />
              <div className="text-sm font-medium text-slate-300">POS Systems</div>
              <div className="text-xs text-green-500 font-bold uppercase">98% Up</div>
            </CardContent>
          </Card>
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-4 flex flex-col items-center text-center space-y-1">
              <AlertTriangle className="h-6 w-6 text-orange-500" />
              <div className="text-sm font-medium text-slate-300">Active Alerts</div>
              <div className="text-xs text-orange-500 font-bold uppercase">3 Critical</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="tickets" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-slate-800 text-slate-400">
            <TabsTrigger value="tickets" className="data-[state=active]:bg-cyan-900 data-[state=active]:text-cyan-100">Active Tickets</TabsTrigger>
            <TabsTrigger value="requests" className="data-[state=active]:bg-cyan-900 data-[state=active]:text-cyan-100">Messages</TabsTrigger>
          </TabsList>

          <TabsContent value="tickets" className="space-y-3 mt-4">
             {tickets.map(ticket => (
               <div key={ticket.id} className="p-4 rounded-lg bg-slate-800 border-l-4 border-l-cyan-500 flex justify-between items-center">
                 <div>
                   <div className="font-bold text-slate-100">{ticket.location}</div>
                   <div className="text-sm text-slate-400">{ticket.issue}</div>
                 </div>
                 <div className="text-right">
                   <div className={`text-xs font-bold uppercase px-2 py-1 rounded ${ticket.priority === 'High' ? 'bg-red-900/50 text-red-400' : 'bg-slate-700 text-slate-300'}`}>
                     {ticket.priority}
                   </div>
                   <div className="text-xs text-slate-500 mt-1">{ticket.time}</div>
                 </div>
               </div>
             ))}
          </TabsContent>

           <TabsContent value="requests" className="mt-4">
              <div className="text-center py-10 text-slate-500 bg-slate-800 rounded-lg border border-dashed border-slate-700">
                <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                No new messages
              </div>
           </TabsContent>
        </Tabs>

      </main>
      
      <TutorialHelpButton page="it" />
    </div>
  );
}
