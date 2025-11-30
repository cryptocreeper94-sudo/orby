import { useStore } from "@/lib/mockData";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LogOut, ChevronLeft, ChevronRight, QrCode, Beer, UtensilsCrossed, AlertCircle, CheckCircle2, FileText, Phone, CheckSquare, PenTool, Loader2, Map } from "lucide-react";
import { useLocation } from "wouter";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useEffect } from "react";
import Webcam from "react-webcam";
import { Badge } from "@/components/ui/badge";
import { Notepad } from "@/components/Notepad";
import { InteractiveMap } from "@/components/InteractiveMap";

export default function SupervisorDashboard() {
  const logout = useStore((state) => state.logout);
  const [, setLocation] = useLocation();
  const stands = useStore((state) => state.stands);
  const items = useStore((state) => state.items);
  const supervisorDocs = useStore((state) => state.supervisorDocs);
  const currentUser = useStore((state) => state.currentUser);
  const updateCount = useStore((state) => state.updateCount);
  const countSheets = useStore((state) => state.countSheets);
  const fetchAll = useStore((state) => state.fetchAll);
  const isLoading = useStore((state) => state.isLoading);

  useEffect(() => {
    if (stands.length === 0) {
      fetchAll();
    }
  }, [stands.length, fetchAll]);
  
  // Filter stands for this supervisor
  const myStands = stands.filter(s => s.supervisorId === currentUser?.id);
  const [activeStandId, setActiveStandId] = useState<string | null>(null);
  const [showScanner, setShowScanner] = useState(false);
  const [activeTab, setActiveTab] = useState("inventory");
  const [showMap, setShowMap] = useState(false);

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
        <main className="p-4 space-y-6">
          {/* Supervisor Pack Section */}
          <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
             <CardHeader className="pb-2">
               <CardTitle className="text-lg flex items-center gap-2 text-blue-800 dark:text-blue-200">
                 <FileText className="w-5 h-5" />
                 Supervisor Pack
               </CardTitle>
               <CardDescription className="text-blue-600 dark:text-blue-300 text-xs">
                 Quick access to essential documents and checklists
               </CardDescription>
             </CardHeader>
             <CardContent>
               <Accordion type="single" collapsible className="w-full bg-white dark:bg-slate-900 rounded-lg shadow-sm border">
                 {/* Compliance Docs */}
                 <AccordionItem value="compliance" className="px-4">
                   <AccordionTrigger className="hover:no-underline">
                     <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-amber-500" />
                        <span>Compliance & Safety</span>
                     </div>
                   </AccordionTrigger>
                   <AccordionContent className="space-y-2 pt-2">
                     {supervisorDocs.filter(d => d.category === 'Compliance').map(doc => (
                       <div key={doc.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-md border">
                         <span className="text-sm font-medium">{doc.title}</span>
                         {doc.requiresSignature && (
                           <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 gap-1">
                             <PenTool className="w-3 h-3" /> Sign
                           </Badge>
                         )}
                       </div>
                     ))}
                   </AccordionContent>
                 </AccordionItem>

                 {/* Checklists */}
                 <AccordionItem value="checklists" className="px-4">
                   <AccordionTrigger className="hover:no-underline">
                     <div className="flex items-center gap-2">
                        <CheckSquare className="w-4 h-4 text-green-500" />
                        <span>Operational Checklists</span>
                     </div>
                   </AccordionTrigger>
                   <AccordionContent className="space-y-2 pt-2">
                      {supervisorDocs.filter(d => d.category === 'Checklist').map(doc => (
                       <div key={doc.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-md border">
                         <span className="text-sm font-medium">{doc.title}</span>
                         <Button size="sm" variant="ghost" className="h-6 text-xs">View</Button>
                       </div>
                     ))}
                   </AccordionContent>
                 </AccordionItem>

                 {/* Contacts */}
                 <AccordionItem value="contacts" className="px-4 border-b-0">
                   <AccordionTrigger className="hover:no-underline">
                     <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-blue-500" />
                        <span>Important Contacts</span>
                     </div>
                   </AccordionTrigger>
                   <AccordionContent className="pt-2">
                      <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-md border text-sm whitespace-pre-line font-mono">
                        {supervisorDocs.find(d => d.category === 'Contact')?.content || 'No contacts available'}
                      </div>
                   </AccordionContent>
                 </AccordionItem>
               </Accordion>
             </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-4">
            <Notepad storageKey="supervisor-notes" className="col-span-2" />
            <Button 
              variant="outline" 
              className="h-16 flex flex-col gap-1"
              onClick={() => setShowMap(true)}
              data-testid="open-map"
            >
              <Map className="h-5 w-5 text-blue-600" />
              <span className="text-xs">Stadium Map</span>
            </Button>
          </div>

          {showMap && (
            <div className="fixed inset-0 z-50 bg-background">
              <InteractiveMap 
                onClose={() => setShowMap(false)} 
                showNavigation={true}
              />
            </div>
          )}

          <div className="space-y-4">
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
          </div>
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

        <Tabs defaultValue="inventory" className="w-full" onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="inventory">Inventory Count</TabsTrigger>
            <TabsTrigger value="compliance">Stand Docs</TabsTrigger>
          </TabsList>
          
          <TabsContent value="inventory" className="space-y-4">
            
            <div className="flex gap-2 mb-4">
              <Button className="flex-1" variant="outline" onClick={() => setShowScanner(true)}>
                <QrCode className="mr-2 h-4 w-4" /> Scan Item
              </Button>
            </div>

            <Accordion type="single" collapsible className="w-full space-y-2">
              {items.map(item => {
                 const standCounts = countSheets[activeStandId!] || {};
                 const count = standCounts[item.id] || { startCount: 0, adds: 0, endCount: 0, spoilage: 0, sold: 0 };
                 
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
                <CardTitle className="text-lg">Stand Documentation</CardTitle>
                <CardDescription>Required sheets for {activeStand?.name}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md text-sm text-yellow-800 mb-4">
                  <AlertCircle className="h-4 w-4 inline mr-2" />
                  Ensure all staff have signed the TABC compliance sheet.
                </div>

                <div className="grid gap-4">
                   {supervisorDocs.map(doc => (
                     <div key={doc.id} className="border rounded-lg p-4 bg-white dark:bg-slate-900 flex items-center justify-between shadow-sm">
                       <div className="flex items-center gap-3">
                         {doc.category === 'Compliance' ? <AlertCircle className="text-amber-500" /> : 
                          doc.category === 'Checklist' ? <CheckSquare className="text-green-500" /> :
                          <FileText className="text-blue-500" />}
                         <div>
                           <div className="font-bold text-sm">{doc.title}</div>
                           <div className="text-xs text-muted-foreground">{doc.category}</div>
                         </div>
                       </div>
                       {doc.requiresSignature ? (
                         <Button size="sm" variant="outline" className="gap-2">
                           <PenTool className="w-4 h-4" /> Sign
                         </Button>
                       ) : (
                         <Button size="sm" variant="ghost">View</Button>
                       )}
                     </div>
                   ))}
                </div>

                {/* Signature Pad Placeholder */}
                <div className="space-y-2 pt-4 border-t mt-4">
                    <label className="text-sm font-medium">Stand Lead Signature</label>
                    <div className="h-32 bg-slate-50 border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 cursor-pointer transition-colors">
                        <div className="text-center">
                          <PenTool className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          Tap to Sign
                        </div>
                    </div>
                </div>
                <Button className="w-full mt-4 btn-3d btn-glow">Submit Compliance Sheet</Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
