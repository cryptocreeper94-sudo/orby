import { useStore, ITEMS } from "@/lib/mockData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LogOut, ChevronLeft, ChevronRight, Calculator, QrCode, Beer, UtensilsCrossed, AlertCircle, CheckCircle2 } from "lucide-react";
import { useLocation } from "wouter";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import Webcam from "react-webcam";

export default function SupervisorDashboard() {
  const logout = useStore((state) => state.logout);
  const [, setLocation] = useLocation();
  const stands = useStore((state) => state.stands);
  const currentUser = useStore((state) => state.currentUser);
  const updateCount = useStore((state) => state.updateCount);
  
  // Filter stands for this supervisor
  const myStands = stands.filter(s => s.supervisorId === currentUser?.id);
  const [activeStandId, setActiveStandId] = useState<string | null>(null);
  const [showScanner, setShowScanner] = useState(false);

  const handleLogout = () => {
    logout();
    setLocation("/");
  };

  if (!activeStandId) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20">
        <header className="sticky top-0 z-10 bg-white dark:bg-slate-900 border-b px-4 h-14 flex items-center justify-between shadow-sm">
          <div className="font-bold text-lg truncate">My Stands</div>
          <Button variant="ghost" size="icon" onClick={handleLogout} className="text-muted-foreground">
            <LogOut className="h-5 w-5" />
          </Button>
        </header>
        <main className="p-4 space-y-4">
          <div className="text-sm text-muted-foreground mb-2 uppercase font-bold tracking-wider">Select a Stand</div>
          {myStands.map(stand => (
            <Card 
              key={stand.id} 
              className={`border-l-4 shadow-sm active:scale-98 transition-transform cursor-pointer ${stand.status === 'Open' ? 'border-l-green-500' : 'border-l-red-500'}`}
              onClick={() => setActiveStandId(stand.id)}
            >
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <div className="font-bold text-lg">{stand.name}</div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    {stand.status === 'Open' ? <CheckCircle2 className="w-3 h-3 text-green-600"/> : <AlertCircle className="w-3 h-3 text-red-600"/>}
                    {stand.status}
                  </div>
                </div>
                <ChevronRight className="text-slate-300" />
              </CardContent>
            </Card>
          ))}
          {myStands.length === 0 && (
            <div className="text-center py-10 text-muted-foreground">No stands assigned.</div>
          )}
        </main>
      </div>
    );
  }

  const activeStand = stands.find(s => s.id === activeStandId);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-24">
      <header className="sticky top-0 z-20 bg-white dark:bg-slate-900 border-b px-4 h-14 flex items-center gap-3 shadow-sm">
        <Button variant="ghost" size="icon" onClick={() => setActiveStandId(null)} className="-ml-2">
          <ChevronLeft className="h-6 w-6" />
        </Button>
        <div className="font-bold text-lg truncate flex-1">{activeStand?.name}</div>
      </header>

      <main className="p-4">
        {showScanner && (
           <div className="fixed inset-0 z-50 bg-black flex flex-col">
             <div className="relative flex-1 bg-black">
                <Webcam 
                  audio={false}
                  screenshotFormat="image/jpeg"
                  videoConstraints={{ facingMode: "environment" }}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 border-2 border-white/50 m-12 rounded-lg pointer-events-none flex items-center justify-center">
                  <span className="bg-black/50 text-white px-2 py-1 text-xs rounded">Align Product Code</span>
                </div>
             </div>
             <div className="p-6 bg-black flex justify-between items-center">
               <Button variant="secondary" onClick={() => setShowScanner(false)}>Cancel</Button>
               <Button onClick={() => setShowScanner(false)} className="bg-primary text-primary-foreground">Capture</Button>
             </div>
           </div>
        )}

        <Tabs defaultValue="inventory" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="inventory">Inventory Count</TabsTrigger>
            <TabsTrigger value="compliance">Compliance</TabsTrigger>
          </TabsList>
          
          <TabsContent value="inventory" className="space-y-4">
            
            <div className="flex gap-2 mb-4">
              <Button className="flex-1" variant="outline" onClick={() => setShowScanner(true)}>
                <QrCode className="mr-2 h-4 w-4" /> Scan Item
              </Button>
            </div>

            <Accordion type="single" collapsible className="w-full space-y-2">
              {ITEMS.map(item => {
                 const count = activeStand?.countSheet?.[item.id] || { startCount: 0, adds: 0, endCount: 0, spoilage: 0, sold: 0 };
                 
                 return (
                  <AccordionItem key={item.id} value={item.id} className="bg-white dark:bg-slate-900 border rounded-lg px-4 shadow-sm">
                    <AccordionTrigger className="hover:no-underline py-3">
                      <div className="flex items-center gap-3 w-full text-left">
                        <div className={`p-2 rounded-full ${item.category === 'Beverage' ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'}`}>
                          {item.category === 'Beverage' ? <Beer className="h-4 w-4" /> : <UtensilsCrossed className="h-4 w-4" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-sm truncate">{item.name}</div>
                          <div className="text-xs text-muted-foreground">Sold: <span className="font-mono font-bold text-foreground">{count.sold}</span></div>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-4">
                      <div className="grid grid-cols-2 gap-4 pt-2">
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-muted-foreground uppercase">Start</label>
                          <Input 
                            type="number" 
                            className="text-center font-mono text-lg" 
                            value={count.startCount}
                            onChange={(e) => updateCount(activeStandId!, item.id, 'startCount', parseInt(e.target.value) || 0)}
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-muted-foreground uppercase">Adds</label>
                          <Input 
                            type="number" 
                            className="text-center font-mono text-lg text-green-600" 
                            value={count.adds}
                            onChange={(e) => updateCount(activeStandId!, item.id, 'adds', parseInt(e.target.value) || 0)}
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-muted-foreground uppercase">End</label>
                          <Input 
                            type="number" 
                            className="text-center font-mono text-lg text-blue-600" 
                            value={count.endCount}
                            onChange={(e) => updateCount(activeStandId!, item.id, 'endCount', parseInt(e.target.value) || 0)}
                          />
                        </div>
                         <div className="space-y-1">
                          <label className="text-xs font-medium text-muted-foreground uppercase">Spoilage</label>
                          <Input 
                            type="number" 
                            className="text-center font-mono text-lg text-red-600" 
                            value={count.spoilage}
                            onChange={(e) => updateCount(activeStandId!, item.id, 'spoilage', parseInt(e.target.value) || 0)}
                          />
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                 )
              })}
            </Accordion>
          </TabsContent>
          
          <TabsContent value="compliance">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Alcohol Compliance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md text-sm text-yellow-800">
                  <AlertCircle className="h-4 w-4 inline mr-2" />
                  Ensure all staff have valid TABC certification on file before opening stand.
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium">Stand Lead Signature</label>
                    <div className="h-32 bg-slate-50 border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center text-slate-400">
                        Tap to Sign
                    </div>
                </div>
                <Button className="w-full">Submit Compliance Sheet</Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
