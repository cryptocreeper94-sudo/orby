import { useStore } from "@/lib/mockData";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LogOut, ChevronLeft, ChevronRight, QrCode, Beer, UtensilsCrossed, AlertCircle, CheckCircle2, FileText, Phone, CheckSquare, PenTool, Loader2, Map, ClipboardList, ClipboardCheck, Send, Package, Warehouse, Plus, Minus, Truck, ScanLine, Sparkles, ChevronDown } from "lucide-react";
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
import { useState, useEffect, useRef, useMemo } from "react";
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
import { cn } from "@/lib/utils";

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

function getStandSection(standName: string): string {
  if (standName.startsWith('1')) return '100 Level';
  if (standName.startsWith('2')) return '200 Level';
  if (standName.startsWith('3')) return '300 Level';
  if (standName.startsWith('OA') || standName.toLowerCase().includes('tailgate')) return 'Outdoor Areas';
  if (standName.toLowerCase().includes('bar')) return 'Bars';
  if (standName.toLowerCase().includes('suite') || standName.toLowerCase().includes('club')) return 'Premium';
  if (standName.toLowerCase().includes('vend')) return 'Vending';
  return 'Other Locations';
}

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
  
  const [activeStandId, setActiveStandId] = useState<string | null>(null);
  const [showScanner, setShowScanner] = useState(false);
  const [activeTab, setActiveTab] = useState("inventory");
  const [showMap, setShowMap] = useState(false);
  const [showSupervisorPack, setShowSupervisorPack] = useState(false);
  const [showWarehouseRequest, setShowWarehouseRequest] = useState(false);
  const [showQuickScan, setShowQuickScan] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const signatureRef = useRef<SignatureCanvas>(null);
  const [complianceSubmitting, setComplianceSubmitting] = useState(false);
  const [complianceSubmitted, setComplianceSubmitted] = useState(false);
  const [complianceError, setComplianceError] = useState<string | null>(null);

  const [requestItems, setRequestItems] = useState<Record<string, number>>({});
  const [requestPriority, setRequestPriority] = useState<'Normal' | 'Rush' | 'Emergency'>('Normal');
  const [requestNotes, setRequestNotes] = useState('');
  const [selectedStandForRequest, setSelectedStandForRequest] = useState<string>('');

  const groupedStands = useMemo(() => {
    const filtered = searchQuery 
      ? stands.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()))
      : stands;
    
    const groups: Record<string, typeof stands> = {};
    filtered.forEach(stand => {
      const section = getStandSection(stand.name);
      if (!groups[section]) groups[section] = [];
      groups[section].push(stand);
    });
    
    Object.keys(groups).forEach(key => {
      groups[key].sort((a, b) => a.name.localeCompare(b.name));
    });
    
    return groups;
  }, [stands, searchQuery]);

  const sectionOrder = ['100 Level', '200 Level', '300 Level', 'Bars', 'Premium', 'Outdoor Areas', 'Vending', 'Other Locations'];
  const sortedSections = Object.keys(groupedStands).sort((a, b) => {
    const aIdx = sectionOrder.indexOf(a);
    const bIdx = sectionOrder.indexOf(b);
    if (aIdx === -1 && bIdx === -1) return a.localeCompare(b);
    if (aIdx === -1) return 1;
    if (bIdx === -1) return -1;
    return aIdx - bIdx;
  });

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
      const standId = selectedStandForRequest || stands[0]?.id;
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
      alert('Warehouse request submitted successfully!');
      setShowWarehouseRequest(false);
      setRequestItems({});
      setRequestPriority('Normal');
      setRequestNotes('');
    }
  });

  const getTotalItemsInRequest = () => {
    return Object.values(requestItems).reduce((sum, qty) => sum + qty, 0);
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
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 pb-24">
        <header className="sticky top-0 z-50 bg-slate-950/95 backdrop-blur-sm border-b border-cyan-500/20 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/30">
                <ClipboardList className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-amber-400">Supervisor</h1>
                <p className="text-xs text-slate-500">{stands.length} stands available</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={handleLogout} className="text-slate-400 hover:text-white">
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </header>

        <main className="px-4 py-4 space-y-4 max-w-lg mx-auto">
          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-3">
            <Button 
              className="h-14 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/20"
              onClick={() => setShowQuickScan(true)}
              data-testid="quick-scan-btn"
            >
              <ScanLine className="h-5 w-5 mr-2" />
              <span className="text-sm">AI Scan</span>
            </Button>
            <Button 
              className="h-14 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white shadow-lg shadow-amber-500/20"
              onClick={() => setShowSupervisorPack(true)}
              data-testid="open-supervisor-pack"
            >
              <FileText className="h-5 w-5 mr-2" />
              <span className="text-sm">Pack</span>
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button 
              variant="outline" 
              className="h-12 border-slate-700 bg-slate-900/50 text-slate-300 hover:bg-slate-800"
              onClick={() => setShowMap(true)}
              data-testid="open-map"
            >
              <Map className="h-4 w-4 mr-2 text-blue-400" />
              <span className="text-sm">Map</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-12 border-slate-700 bg-slate-900/50 text-slate-300 hover:bg-slate-800"
              onClick={() => setShowWarehouseRequest(true)}
              data-testid="open-warehouse-request"
            >
              <Warehouse className="h-4 w-4 mr-2 text-amber-400" />
              <span className="text-sm">Supplies</span>
            </Button>
          </div>

          {/* Search */}
          <div className="relative">
            <Input
              placeholder="Search stands..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-900/50 border-slate-700 text-slate-200 placeholder:text-slate-500 pl-4 pr-10"
              data-testid="input-search-stands"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                ×
              </button>
            )}
          </div>

          {/* Grouped Stands Accordion */}
          <Accordion type="multiple" className="space-y-2" defaultValue={['100 Level']}>
            {sortedSections.map(section => (
              <AccordionItem 
                key={section} 
                value={section}
                className="rounded-lg border border-slate-700/50 bg-slate-900/50 overflow-hidden"
              >
                <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-slate-800/50">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold",
                      section === '100 Level' && "bg-green-500/20 text-green-400",
                      section === '200 Level' && "bg-blue-500/20 text-blue-400",
                      section === '300 Level' && "bg-purple-500/20 text-purple-400",
                      section === 'Bars' && "bg-pink-500/20 text-pink-400",
                      section === 'Premium' && "bg-amber-500/20 text-amber-400",
                      section === 'Outdoor Areas' && "bg-cyan-500/20 text-cyan-400",
                      section === 'Vending' && "bg-orange-500/20 text-orange-400",
                      section === 'Other Locations' && "bg-slate-500/20 text-slate-400"
                    )}>
                      {groupedStands[section].length}
                    </div>
                    <span className="text-slate-200 font-medium">{section}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-2 pb-2">
                  <div className="space-y-1">
                    {groupedStands[section].map(stand => (
                      <button
                        key={stand.id}
                        onClick={() => setActiveStandId(stand.id)}
                        className={cn(
                          "w-full px-3 py-2.5 rounded-lg flex items-center justify-between",
                          "bg-slate-800/50 hover:bg-slate-700/50 transition-colors",
                          "border-l-2",
                          stand.status === 'Open' ? "border-l-green-500" : "border-l-red-500"
                        )}
                        data-testid={`stand-${stand.id}`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-slate-200 font-medium text-sm truncate">{stand.name}</span>
                          <Badge 
                            variant="outline" 
                            className={cn(
                              "text-xs px-1.5 py-0",
                              stand.status === 'Open' 
                                ? "border-green-500/50 text-green-400 bg-green-500/10" 
                                : "border-red-500/50 text-red-400 bg-red-500/10"
                            )}
                          >
                            {stand.status}
                          </Badge>
                        </div>
                        <ChevronRight className="h-4 w-4 text-slate-500 flex-shrink-0" />
                      </button>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          {stands.length === 0 && (
            <div className="text-center py-10 text-slate-500">
              <ClipboardList className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>No stands available</p>
            </div>
          )}

          <Notepad storageKey="supervisor-notes" className="bg-slate-900/50 border-slate-700" />
        </main>

        {/* Modals */}
        <Dialog open={showWarehouseRequest} onOpenChange={setShowWarehouseRequest}>
          <DialogContent className="max-w-md max-h-[90vh] flex flex-col bg-slate-900 border-slate-700 text-slate-200">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-amber-400">
                <Warehouse className="h-5 w-5" />
                Request from Warehouse
              </DialogTitle>
            </DialogHeader>
            
            <div className="flex-1 overflow-hidden flex flex-col space-y-4">
              {stands.length > 1 && (
                <div>
                  <Label className="text-slate-300">For Stand</Label>
                  <Select 
                    value={selectedStandForRequest || stands[0]?.id} 
                    onValueChange={setSelectedStandForRequest}
                  >
                    <SelectTrigger className="bg-slate-800 border-slate-600" data-testid="select-stand-for-request">
                      <SelectValue placeholder="Select stand..." />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-600">
                      {stands.map(stand => (
                        <SelectItem key={stand.id} value={stand.id}>{stand.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div>
                <Label className="text-slate-300">Priority</Label>
                <Select value={requestPriority} onValueChange={(v) => setRequestPriority(v as typeof requestPriority)}>
                  <SelectTrigger className="bg-slate-800 border-slate-600" data-testid="select-request-priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-600">
                    <SelectItem value="Normal">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                        Normal
                      </div>
                    </SelectItem>
                    <SelectItem value="Rush">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                        Rush
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
                <Label className="text-slate-300 mb-2 block">Items ({getTotalItemsInRequest()} selected)</Label>
                {warehouseProducts.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No products available</p>
                  </div>
                ) : (
                  <ScrollArea className="h-[200px] border border-slate-700 rounded-md p-2 bg-slate-800/50">
                    <div className="space-y-2">
                      {warehouseCategories.map(category => {
                        const categoryProducts = warehouseProducts.filter(p => p.categoryId === category.id);
                        if (categoryProducts.length === 0) return null;
                        return (
                          <div key={category.id}>
                            <div className="text-xs font-semibold text-slate-400 uppercase mb-1 sticky top-0 bg-slate-800 py-1">
                              {category.name}
                            </div>
                            {categoryProducts.map(product => (
                              <div 
                                key={product.id} 
                                className="flex items-center justify-between p-2 rounded hover:bg-slate-700/50"
                              >
                                <div className="flex-1 min-w-0">
                                  <span className="text-sm text-slate-200 truncate block">{product.name}</span>
                                  <span className="text-xs text-slate-500">{product.unit}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-7 w-7 border-slate-600"
                                    onClick={() => setRequestItems(prev => ({
                                      ...prev,
                                      [product.id]: Math.max(0, (prev[product.id] || 0) - 1)
                                    }))}
                                    disabled={(requestItems[product.id] || 0) === 0}
                                  >
                                    <Minus className="h-3 w-3" />
                                  </Button>
                                  <span className="w-8 text-center font-mono text-sm text-slate-200">
                                    {requestItems[product.id] || 0}
                                  </span>
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-7 w-7 border-slate-600"
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
                <Label className="text-slate-300">Notes</Label>
                <Textarea
                  placeholder="Special instructions..."
                  value={requestNotes}
                  onChange={(e) => setRequestNotes(e.target.value)}
                  rows={2}
                  className="bg-slate-800 border-slate-600 text-slate-200"
                  data-testid="input-request-notes"
                />
              </div>
            </div>

            <DialogFooter className="gap-2 mt-4">
              <Button variant="outline" onClick={() => setShowWarehouseRequest(false)} className="border-slate-600">
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
                Submit
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {showMap && (
          <div className="fixed inset-0 z-50 bg-slate-950">
            <InteractiveMap 
              onClose={() => setShowMap(false)} 
              showNavigation={true}
            />
          </div>
        )}

        {showSupervisorPack && (
          <div className="fixed inset-0 z-50 bg-slate-950">
            <SupervisorPack 
              onClose={() => setShowSupervisorPack(false)}
              supervisorName={currentUser?.name}
              standName={stands[0]?.name || 'All Stands'}
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

        <TutorialHelpButton page="supervisor" />
      </div>
    );
  }

  const activeStand = stands.find(s => s.id === activeStandId);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 pb-24">
      <header className="sticky top-0 z-50 bg-slate-950/95 backdrop-blur-sm border-b border-cyan-500/20 px-4 py-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setActiveStandId(null)} className="text-slate-400 hover:text-white -ml-2">
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="font-bold text-lg text-slate-200 truncate">{activeStand?.name}</h1>
            <p className="text-xs text-slate-500">
              {activeStand?.status === 'Open' ? (
                <span className="text-green-400">● Open</span>
              ) : (
                <span className="text-red-400">● Closed</span>
              )}
            </p>
          </div>
        </div>
      </header>

      <main className="p-4 max-w-lg mx-auto">
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
               <Button onClick={() => setShowScanner(false)} className="bg-cyan-600 text-white">Capture</Button>
             </div>
           </div>
        )}

        <Tabs defaultValue="inventory" className="w-full" onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 mb-4 bg-slate-800/50">
            <TabsTrigger value="inventory" className="data-[state=active]:bg-slate-700">Inventory</TabsTrigger>
            <TabsTrigger value="compliance" className="data-[state=active]:bg-slate-700">Docs</TabsTrigger>
            <TabsTrigger value="closeout" className="data-[state=active]:bg-slate-700" data-testid="tab-closeout">
              <ClipboardCheck className="h-3 w-3 mr-1" />
              Close
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="inventory" className="space-y-4">
            <div className="flex gap-2 mb-4">
              <Button className="flex-1 bg-slate-800 hover:bg-slate-700 border border-slate-700" variant="outline" onClick={() => setShowScanner(true)}>
                <QrCode className="mr-2 h-4 w-4 text-cyan-400" /> Scan Item
              </Button>
            </div>

            <Accordion type="single" collapsible className="w-full space-y-2">
              {items.map(item => {
                 const standCounts = countSheets[activeStandId!] || {};
                 const count = standCounts[item.id] || { startCount: 0, adds: 0, endCount: 0, spoilage: 0, sold: 0 };
                 
                 return (
                  <AccordionItem key={item.id} value={item.id} className="bg-slate-900/80 border border-slate-700 rounded-lg px-4">
                    <AccordionTrigger className="hover:no-underline py-3">
                      <div className="flex items-center gap-3 w-full text-left">
                        <div className={`p-2 rounded-full ${item.category === 'Beverage' ? 'bg-blue-500/20 text-blue-400' : 'bg-orange-500/20 text-orange-400'}`}>
                          {item.category === 'Beverage' ? <Beer className="h-4 w-4" /> : <UtensilsCrossed className="h-4 w-4" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-sm text-slate-200 truncate">{item.name}</div>
                          <div className="text-xs text-slate-500">Sold: <span className="font-mono font-bold text-cyan-400">{count.sold}</span></div>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-4">
                      <div className="grid grid-cols-2 gap-4 pt-2">
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-slate-400 uppercase">Start</label>
                          <Input 
                            type="number" 
                            className="text-center font-mono text-lg bg-slate-800 border-slate-600 text-slate-200" 
                            value={count.startCount}
                            onChange={(e) => updateCount(activeStandId!, item.id, 'startCount', parseInt(e.target.value) || 0)}
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-slate-400 uppercase">Adds</label>
                          <Input 
                            type="number" 
                            className="text-center font-mono text-lg bg-slate-800 border-slate-600 text-green-400" 
                            value={count.adds}
                            onChange={(e) => updateCount(activeStandId!, item.id, 'adds', parseInt(e.target.value) || 0)}
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-slate-400 uppercase">End</label>
                          <Input 
                            type="number" 
                            className="text-center font-mono text-lg bg-slate-800 border-slate-600 text-blue-400" 
                            value={count.endCount}
                            onChange={(e) => updateCount(activeStandId!, item.id, 'endCount', parseInt(e.target.value) || 0)}
                          />
                        </div>
                         <div className="space-y-1">
                          <label className="text-xs font-medium text-slate-400 uppercase">Spoilage</label>
                          <Input 
                            type="number" 
                            className="text-center font-mono text-lg bg-slate-800 border-slate-600 text-red-400" 
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
            <div className="space-y-4">
              <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg text-sm text-amber-300">
                <AlertCircle className="h-4 w-4 inline mr-2" />
                Ensure all staff have signed the TABC compliance sheet.
              </div>

              <div className="space-y-2">
                 {supervisorDocs.map(doc => (
                   <div key={doc.id} className="border border-slate-700 rounded-lg p-4 bg-slate-900/80 flex items-center justify-between">
                     <div className="flex items-center gap-3">
                       {doc.category === 'Compliance' ? <AlertCircle className="text-amber-400" /> : 
                        doc.category === 'Checklist' ? <CheckSquare className="text-green-400" /> :
                        <FileText className="text-blue-400" />}
                       <div>
                         <div className="font-bold text-sm text-slate-200">{doc.title}</div>
                         <div className="text-xs text-slate-500">{doc.category}</div>
                       </div>
                     </div>
                     {doc.requiresSignature ? (
                       <Button size="sm" variant="outline" className="gap-2 border-slate-600">
                         <PenTool className="w-4 h-4" /> Sign
                       </Button>
                     ) : (
                       <Button size="sm" variant="ghost" className="text-slate-400">View</Button>
                     )}
                   </div>
                 ))}
              </div>

              {complianceError && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-md text-sm text-red-400 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  {complianceError}
                </div>
              )}

              <div className="space-y-2 pt-4 border-t border-slate-700 mt-4">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-slate-300">Supervisor Signature</label>
                    <Button variant="ghost" size="sm" onClick={clearSignature} disabled={complianceSubmitted} className="text-slate-400">
                      Clear
                    </Button>
                  </div>
                  <div className="border-2 border-slate-600 rounded-lg bg-white overflow-hidden">
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
                  className="w-full mt-4 bg-cyan-600 hover:bg-cyan-700"
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
                <div className="flex items-center justify-center gap-2 text-green-400 bg-green-500/10 p-3 rounded-lg mt-4 border border-green-500/30">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="font-medium">Submitted to Operations Manager</span>
                </div>
              )}
            </div>
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
