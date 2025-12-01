import { useStore } from "@/lib/mockData";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LogOut, ChevronLeft, ChevronRight, QrCode, Beer, UtensilsCrossed, AlertCircle, CheckCircle2, FileText, Phone, CheckSquare, PenTool, Loader2, Map, ClipboardList, ClipboardCheck, Send, Package, Warehouse, Plus, Minus, Truck, ScanLine, Sparkles } from "lucide-react";
import { useLocation } from "wouter";
import SignatureCanvas from 'react-signature-canvas';
import jsPDF from 'jspdf';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useEffect, useRef } from "react";
import Webcam from "react-webcam";
import { Badge } from "@/components/ui/badge";
import { Notepad } from "@/components/Notepad";
import { InteractiveMap } from "@/components/InteractiveMap";
import { SupervisorPack } from "@/components/SupervisorPack";
import { SupervisorClosingPanel } from "@/components/SupervisorClosingPanel";
import { QuickScanModal } from "@/components/QuickScanModal";
import { TutorialHelpButton } from "@/components/TutorialCoach";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

type WarehouseProduct = {
  id: string;
  categoryId: string | null;
  name: string;
  sku: string | null;
  unit: string | null;
};

type WarehouseCategory = {
  id: string;
  name: string;
  color: string | null;
};

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
  const queryClient = useQueryClient();

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
  const [showSupervisorPack, setShowSupervisorPack] = useState(false);
  const [showWarehouseRequest, setShowWarehouseRequest] = useState(false);
  const [showQuickScan, setShowQuickScan] = useState(false);
  
  // Compliance sheet state
  const signatureRef = useRef<SignatureCanvas>(null);
  const [complianceSubmitting, setComplianceSubmitting] = useState(false);
  const [complianceSubmitted, setComplianceSubmitted] = useState(false);
  const [complianceError, setComplianceError] = useState<string | null>(null);

  // Warehouse request state
  const [requestItems, setRequestItems] = useState<Record<string, number>>({});
  const [requestPriority, setRequestPriority] = useState<'Normal' | 'Rush' | 'Emergency'>('Normal');
  const [requestNotes, setRequestNotes] = useState('');
  const [selectedStandForRequest, setSelectedStandForRequest] = useState<string>('');

  const { data: warehouseProducts = [] } = useQuery<WarehouseProduct[]>({
    queryKey: ['warehouse-products'],
    queryFn: async () => {
      const res = await fetch('/api/warehouse/products');
      if (!res.ok) return [];
      return res.json();
    }
  });

  const { data: warehouseCategories = [] } = useQuery<WarehouseCategory[]>({
    queryKey: ['warehouse-categories'],
    queryFn: async () => {
      const res = await fetch('/api/warehouse/categories');
      if (!res.ok) return [];
      return res.json();
    }
  });

  const createRequestMutation = useMutation({
    mutationFn: async () => {
      const standId = selectedStandForRequest || myStands[0]?.id;
      if (!standId) throw new Error('No stand selected');
      
      const res = await fetch('/api/warehouse/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          standId,
          requestedById: currentUser?.id,
          priority: requestPriority,
          notes: requestNotes
        })
      });
      if (!res.ok) throw new Error('Failed to create request');
      return res.json();
    },
    onSuccess: async (request) => {
      const itemEntries = Object.entries(requestItems).filter(([_, qty]) => qty > 0);
      for (const [productId, qty] of itemEntries) {
        await fetch(`/api/warehouse/requests/${request.id}/items`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productId,
            quantityRequested: qty
          })
        });
      }
      queryClient.invalidateQueries({ queryKey: ['warehouse-requests'] });
      alert('Warehouse request submitted successfully! The warehouse team has been notified.');
      setShowWarehouseRequest(false);
      setRequestItems({});
      setRequestPriority('Normal');
      setRequestNotes('');
    }
  });

  const getTotalItemsInRequest = () => {
    return Object.values(requestItems).reduce((sum, qty) => sum + qty, 0);
  };

  const getCategoryName = (categoryId: string | null) => {
    return warehouseCategories.find(c => c.id === categoryId)?.name ?? 'Other';
  };

  const handleLogout = () => {
    logout();
    setLocation("/");
  };

  const clearSignature = () => {
    signatureRef.current?.clear();
  };

  const generateCompliancePDF = (): string => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const activeStand = stands.find(s => s.id === activeStandId);
    
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Alcohol Compliance Sheet', pageWidth / 2, 20, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Stand: ${activeStand?.name || 'N/A'}`, 20, 35);
    doc.text(`Event Date: ${new Date().toISOString().split('T')[0]}`, 20, 42);
    doc.text(`Supervisor: ${currentUser?.name || 'N/A'}`, 20, 49);
    doc.text(`Submitted: ${new Date().toLocaleString()}`, 20, 56);
    
    doc.setDrawColor(200);
    doc.line(20, 62, pageWidth - 20, 62);
    
    doc.setFontSize(11);
    doc.text('I confirm that all staff working at this stand have been TABC certified', 20, 75);
    doc.text('and have signed the required compliance documentation.', 20, 83);
    
    doc.text('All alcohol service protocols have been reviewed with staff including:', 20, 100);
    doc.text('• Checking IDs for all customers who appear under 40', 25, 110);
    doc.text('• Refusing service to intoxicated individuals', 25, 118);
    doc.text('• Proper wristband verification for alcohol purchases', 25, 126);
    doc.text('• No alcohol service after designated cutoff time', 25, 134);
    
    // Add signature if available
    if (signatureRef.current && !signatureRef.current.isEmpty()) {
      const signatureData = signatureRef.current.getTrimmedCanvas().toDataURL('image/png');
      doc.text('Supervisor Signature:', 20, 160);
      doc.addImage(signatureData, 'PNG', 20, 165, 80, 30);
    } else {
      doc.text('Supervisor Signature: _______________________________', 20, 170);
    }
    
    doc.setFontSize(10);
    doc.text(`Date/Time: ${new Date().toLocaleString()}`, 20, 200);
    
    return doc.output('datauristring');
  };

  const submitComplianceSheet = async () => {
    if (!activeStandId) return;
    
    if (signatureRef.current?.isEmpty()) {
      setComplianceError('Please sign the compliance sheet first');
      return;
    }
    
    setComplianceSubmitting(true);
    setComplianceError(null);
    
    try {
      const pdfData = generateCompliancePDF();
      const signatureData = signatureRef.current?.getTrimmedCanvas().toDataURL('image/png');
      
      const res = await fetch('/api/document-submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentType: 'AlcoholCompliance',
          standId: activeStandId,
          eventDate: new Date().toISOString().split('T')[0],
          submittedById: currentUser?.id,
          submittedByName: currentUser?.name,
          pdfData,
          signatureData
        })
      });
      
      if (!res.ok) throw new Error('Failed to submit');
      
      setComplianceSubmitted(true);
    } catch (err) {
      setComplianceError('Failed to submit compliance sheet');
    } finally {
      setComplianceSubmitting(false);
    }
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

          <Button 
            className="w-full h-14 bg-amber-600 hover:bg-amber-700 text-white font-bold"
            onClick={() => setShowSupervisorPack(true)}
            data-testid="open-supervisor-pack"
          >
            <ClipboardList className="h-5 w-5 mr-2" />
            Open Full Supervisor Pack
          </Button>

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
            <Button 
              variant="outline" 
              className="h-16 flex flex-col gap-1 border-amber-200 hover:bg-amber-50"
              onClick={() => setShowWarehouseRequest(true)}
              data-testid="open-warehouse-request"
            >
              <Warehouse className="h-5 w-5 text-amber-600" />
              <span className="text-xs">Request Supplies</span>
            </Button>
          </div>

          <Dialog open={showWarehouseRequest} onOpenChange={setShowWarehouseRequest}>
            <DialogContent className="max-w-md max-h-[90vh] flex flex-col">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Warehouse className="h-5 w-5 text-amber-600" />
                  Request from Warehouse
                </DialogTitle>
              </DialogHeader>
              
              <div className="flex-1 overflow-hidden flex flex-col space-y-4">
                {myStands.length > 1 && (
                  <div>
                    <Label>For Stand</Label>
                    <Select 
                      value={selectedStandForRequest || myStands[0]?.id} 
                      onValueChange={setSelectedStandForRequest}
                    >
                      <SelectTrigger data-testid="select-stand-for-request">
                        <SelectValue placeholder="Select stand..." />
                      </SelectTrigger>
                      <SelectContent>
                        {myStands.map(stand => (
                          <SelectItem key={stand.id} value={stand.id}>{stand.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div>
                  <Label>Priority</Label>
                  <Select value={requestPriority} onValueChange={(v) => setRequestPriority(v as typeof requestPriority)}>
                    <SelectTrigger data-testid="select-request-priority">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Normal">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                          Normal
                        </div>
                      </SelectItem>
                      <SelectItem value="Rush">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                          Rush (High Priority)
                        </div>
                      </SelectItem>
                      <SelectItem value="Emergency">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                          Emergency
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex-1 overflow-hidden">
                  <Label className="mb-2 block">Select Items ({getTotalItemsInRequest()} items selected)</Label>
                  {warehouseProducts.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No products available</p>
                      <p className="text-xs">The warehouse inventory needs to be set up first.</p>
                    </div>
                  ) : (
                    <ScrollArea className="h-[200px] border rounded-md p-2">
                      <div className="space-y-2">
                        {warehouseCategories.map(category => {
                          const categoryProducts = warehouseProducts.filter(p => p.categoryId === category.id);
                          if (categoryProducts.length === 0) return null;
                          return (
                            <div key={category.id}>
                              <div className="text-xs font-semibold text-muted-foreground uppercase mb-1 sticky top-0 bg-white py-1">
                                {category.name}
                              </div>
                              {categoryProducts.map(product => (
                                <div 
                                  key={product.id} 
                                  className="flex items-center justify-between p-2 rounded hover:bg-slate-50"
                                >
                                  <div className="flex-1 min-w-0">
                                    <span className="text-sm truncate block">{product.name}</span>
                                    <span className="text-xs text-muted-foreground">{product.unit}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      className="h-7 w-7"
                                      onClick={() => setRequestItems(prev => ({
                                        ...prev,
                                        [product.id]: Math.max(0, (prev[product.id] || 0) - 1)
                                      }))}
                                      disabled={(requestItems[product.id] || 0) === 0}
                                    >
                                      <Minus className="h-3 w-3" />
                                    </Button>
                                    <span className="w-8 text-center font-mono text-sm">
                                      {requestItems[product.id] || 0}
                                    </span>
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      className="h-7 w-7"
                                      onClick={() => setRequestItems(prev => ({
                                        ...prev,
                                        [product.id]: (prev[product.id] || 0) + 1
                                      }))}
                                    >
                                      <Plus className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          );
                        })}
                      </div>
                    </ScrollArea>
                  )}
                </div>

                <div>
                  <Label>Notes (optional)</Label>
                  <Textarea
                    placeholder="Any special instructions..."
                    value={requestNotes}
                    onChange={(e) => setRequestNotes(e.target.value)}
                    rows={2}
                    data-testid="input-request-notes"
                  />
                </div>
              </div>

              <DialogFooter className="gap-2 mt-4">
                <Button variant="outline" onClick={() => setShowWarehouseRequest(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={() => createRequestMutation.mutate()}
                  disabled={createRequestMutation.isPending || getTotalItemsInRequest() === 0}
                  className={requestPriority === 'Emergency' ? 'bg-red-600 hover:bg-red-700' : 'bg-amber-600 hover:bg-amber-700'}
                  data-testid="button-submit-warehouse-request"
                >
                  {createRequestMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Truck className="h-4 w-4 mr-2" />
                  )}
                  Submit Request
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {showMap && (
            <div className="fixed inset-0 z-50 bg-background">
              <InteractiveMap 
                onClose={() => setShowMap(false)} 
                showNavigation={true}
              />
            </div>
          )}

          {showSupervisorPack && (
            <div className="fixed inset-0 z-50 bg-background">
              <SupervisorPack 
                onClose={() => setShowSupervisorPack(false)}
                supervisorName={currentUser?.name}
                standName={myStands[0]?.name || 'My Stand'}
              />
            </div>
          )}

          {showQuickScan && (
            <QuickScanModal
              onClose={() => setShowQuickScan(false)}
              standName="Spot Check"
              onScanComplete={(items) => {
                console.log('Supervisor scanned items:', items);
              }}
            />
          )}

          <Button 
            className="w-full h-14 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white shadow-lg mb-4"
            onClick={() => setShowQuickScan(true)}
            data-testid="quick-scan-btn"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <ScanLine className="h-5 w-5" />
              </div>
              <div className="text-left">
                <div className="font-bold flex items-center gap-1">
                  <Sparkles className="h-4 w-4" />
                  Quick AI Scan
                </div>
                <div className="text-xs text-white/80">Spot check any cooler</div>
              </div>
            </div>
          </Button>

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
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="inventory">Inventory</TabsTrigger>
            <TabsTrigger value="compliance">Docs</TabsTrigger>
            <TabsTrigger value="closeout" data-testid="tab-closeout">
              <ClipboardCheck className="h-3 w-3 mr-1" />
              Closeout
            </TabsTrigger>
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

                {complianceError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-600 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    {complianceError}
                  </div>
                )}

                {/* Signature Pad */}
                <div className="space-y-2 pt-4 border-t mt-4">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">Supervisor Signature</label>
                      <Button variant="ghost" size="sm" onClick={clearSignature} disabled={complianceSubmitted}>
                        Clear
                      </Button>
                    </div>
                    <div className="border-2 border-slate-300 rounded-lg bg-white overflow-hidden">
                      <SignatureCanvas
                        ref={signatureRef}
                        canvasProps={{
                          className: 'w-full h-32',
                          style: { width: '100%', height: '128px' }
                        }}
                        backgroundColor="white"
                      />
                    </div>
                </div>
                
                {!complianceSubmitted ? (
                  <Button 
                    className="w-full mt-4 bg-blue-600 hover:bg-blue-700"
                    onClick={submitComplianceSheet}
                    disabled={complianceSubmitting}
                    data-testid="submit-compliance"
                  >
                    {complianceSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Send className="h-4 w-4 mr-2" />
                    )}
                    Submit to Operations Manager
                  </Button>
                ) : (
                  <div className="flex items-center justify-center gap-2 text-green-700 bg-green-50 p-3 rounded-lg mt-4">
                    <CheckCircle2 className="h-5 w-5" />
                    <span className="font-medium">Submitted to Operations Manager</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="closeout">
            <SupervisorClosingPanel
              standId={activeStandId!}
              standName={activeStand?.name || ''}
              eventDate={new Date().toISOString().split('T')[0]}
              supervisorId={currentUser?.id || ''}
              supervisorName={currentUser?.name}
            />
          </TabsContent>
        </Tabs>
      </main>
      
      <TutorialHelpButton page="supervisor" />
    </div>
  );
}
