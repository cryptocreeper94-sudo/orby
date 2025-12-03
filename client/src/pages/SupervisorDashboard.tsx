import { useStore } from "@/lib/mockData";
import { Button } from "@/components/ui/button";
import { LogOut, ChevronLeft, ChevronRight, QrCode, Beer, UtensilsCrossed, AlertCircle, CheckCircle2, FileText, CheckSquare, PenTool, Loader2, Map, ClipboardList, ClipboardCheck, Send, Package, Warehouse, Plus, Minus, Truck, ScanLine, ChevronDown } from "lucide-react";
import { useLocation } from "wouter";
import SignatureCanvas from 'react-signature-canvas';
import jsPDF from 'jspdf';
import { motion, AnimatePresence } from 'framer-motion';
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
import { FacilityIssuePanel } from "@/components/FacilityIssuePanel";
import { QuickScanModal } from "@/components/QuickScanModal";
import { TutorialHelpButton } from "@/components/TutorialCoach";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { 
  AnimatedBackground,
  GlassCard,
  GlassCardHeader,
  GlassCardContent,
  GlowButton,
  PageHeader,
  SectionHeader,
  StatCard
} from "@/components/ui/premium";
import { SectionHelp } from '@/components/OrbyHelp';
import ComplianceAlertPanel from '@/components/ComplianceAlertPanel';
import { GlobalModeBar } from '@/components/GlobalModeBar';

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

const SECTION_COLORS: Record<string, string> = {
  '100 Level': 'from-emerald-500 to-emerald-600',
  '200 Level': 'from-blue-500 to-blue-600',
  '300 Level': 'from-violet-500 to-violet-600',
  'Bars': 'from-pink-500 to-pink-600',
  'Premium': 'from-amber-500 to-amber-600',
  'Outdoor Areas': 'from-cyan-500 to-cyan-600',
  'Vending': 'from-orange-500 to-orange-600',
  'Other Locations': 'from-slate-500 to-slate-600'
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
      <AnimatedBackground>
        <GlobalModeBar />
        <PageHeader 
          title="Supervisor"
          subtitle={`${stands.length} stands available`}
          icon={<ClipboardList className="w-5 h-5" />}
          iconColor="amber"
          actions={
            <Button variant="ghost" size="icon" onClick={handleLogout} className="text-slate-400 hover:text-white">
              <LogOut className="h-5 w-5" />
            </Button>
          }
        />

        <main className="px-4 md:px-6 lg:px-8 py-4 space-y-4 max-w-4xl mx-auto pb-24">
          <ComplianceAlertPanel 
            userId={currentUser?.id} 
            userName={currentUser?.name} 
            isManager={false}
          />
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <motion.button
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="h-16 md:h-20 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 p-4 shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-3"
              onClick={() => setShowQuickScan(true)}
              data-testid="quick-scan-btn"
            >
              <ScanLine className="h-5 w-5 md:h-6 md:w-6 text-white" />
              <span className="text-sm md:text-base font-semibold text-white">AI Scan</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="h-16 md:h-20 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 p-4 shadow-lg shadow-amber-500/20 flex items-center justify-center gap-3"
              onClick={() => setShowSupervisorPack(true)}
              data-testid="open-supervisor-pack"
            >
              <FileText className="h-5 w-5 md:h-6 md:w-6 text-white" />
              <span className="text-sm md:text-base font-semibold text-white">Pack</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="h-16 md:h-20 rounded-2xl border border-white/10 bg-slate-800/50 backdrop-blur-sm p-4 flex items-center justify-center gap-3 hover:bg-slate-700/50 transition-colors"
              onClick={() => setShowMap(true)}
              data-testid="open-map"
            >
              <Map className="h-5 w-5 md:h-6 md:w-6 text-blue-400" />
              <span className="text-sm md:text-base font-medium text-slate-200">Map</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="h-16 md:h-20 rounded-2xl border border-white/10 bg-slate-800/50 backdrop-blur-sm p-4 flex items-center justify-center gap-3 hover:bg-slate-700/50 transition-colors"
              onClick={() => setShowWarehouseRequest(true)}
              data-testid="open-warehouse-request"
            >
              <Warehouse className="h-5 w-5 md:h-6 md:w-6 text-amber-400" />
              <span className="text-sm md:text-base font-medium text-slate-200">Supplies</span>
            </motion.button>
          </div>

          <div className="relative">
            <Input
              placeholder="Search stands..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-800/50 backdrop-blur-sm border-white/10 text-slate-200 placeholder:text-slate-500 pl-4 pr-10 rounded-xl h-12"
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

          <Accordion type="multiple" className="space-y-3" defaultValue={['100 Level']}>
            {sortedSections.map(section => (
              <AccordionItem 
                key={section} 
                value={section}
                className="rounded-2xl border border-white/10 bg-slate-800/40 backdrop-blur-sm overflow-hidden"
              >
                <AccordionTrigger className="px-4 py-4 hover:no-underline hover:bg-white/5 [&[data-state=open]]:bg-white/5">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold bg-gradient-to-br shadow-lg",
                      SECTION_COLORS[section] || 'from-slate-500 to-slate-600'
                    )}>
                      <span className="text-white">{groupedStands[section].length}</span>
                    </div>
                    <span className="text-slate-200 font-semibold">{section}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-2 pb-2">
                  <div className="space-y-2">
                    {groupedStands[section].map(stand => (
                      <motion.button
                        key={stand.id}
                        whileHover={{ x: 4 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setActiveStandId(stand.id)}
                        className={cn(
                          "w-full px-4 py-3 rounded-xl flex items-center justify-between",
                          "bg-slate-800/50 hover:bg-slate-700/50 transition-all duration-200",
                          "border-l-3",
                          stand.status === 'Open' ? "border-l-emerald-500" : "border-l-red-500"
                        )}
                        data-testid={`stand-${stand.id}`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="text-slate-200 font-medium truncate">{stand.name}</span>
                          <Badge 
                            variant="outline" 
                            className={cn(
                              "text-xs px-2",
                              stand.status === 'Open' 
                                ? "border-emerald-500/50 text-emerald-400 bg-emerald-500/10" 
                                : "border-red-500/50 text-red-400 bg-red-500/10"
                            )}
                          >
                            {stand.status}
                          </Badge>
                        </div>
                        <ChevronRight className="h-4 w-4 text-slate-500 flex-shrink-0" />
                      </motion.button>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          {stands.length === 0 && (
            <div className="text-center py-12 text-slate-500">
              <ClipboardList className="h-16 w-16 mx-auto mb-4 opacity-30" />
              <p className="text-lg">No stands available</p>
            </div>
          )}

          <Notepad storageKey="supervisor-notes" className="bg-slate-800/40 backdrop-blur-sm border-white/10 rounded-2xl" />
        </main>

        <Dialog open={showWarehouseRequest} onOpenChange={setShowWarehouseRequest}>
          <DialogContent className="max-w-md max-h-[90vh] flex flex-col bg-slate-900/95 backdrop-blur-xl border-white/10 text-slate-200">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-amber-400">
                <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600">
                  <Warehouse className="h-5 w-5 text-white" />
                </div>
                Request from Warehouse
                <SectionHelp
                  title="Warehouse Request"
                  description="Order supplies from the warehouse for your stand. Select items, choose priority level, and submit. Runners will bring your order."
                  tips={[
                    "Normal: Added to queue in order received",
                    "Rush: Prioritized in the queue",
                    "Emergency: Immediate attention required"
                  ]}
                  keywords={['delivery', 'eta', 'priority', 'picking', 'on-the-way']}
                />
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
                    <SelectTrigger className="bg-slate-800/50 border-white/10 mt-1.5" data-testid="select-stand-for-request">
                      <SelectValue placeholder="Select stand..." />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
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
                  <SelectTrigger className="bg-slate-800/50 border-white/10 mt-1.5" data-testid="select-request-priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
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
                    <Package className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No products available</p>
                  </div>
                ) : (
                  <ScrollArea className="h-[200px] border border-white/10 rounded-xl p-2 bg-slate-800/30">
                    <div className="space-y-2">
                      {warehouseCategories.map(category => {
                        const categoryProducts = warehouseProducts.filter(p => p.categoryId === category.id);
                        if (categoryProducts.length === 0) return null;
                        return (
                          <div key={category.id}>
                            <div className="text-xs font-semibold text-slate-400 uppercase mb-1 sticky top-0 bg-slate-800 py-1 px-2 rounded">
                              {category.name}
                            </div>
                            {categoryProducts.map(product => (
                              <div 
                                key={product.id} 
                                className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5"
                              >
                                <div className="flex-1 min-w-0">
                                  <span className="text-sm text-slate-200 truncate block">{product.name}</span>
                                  <span className="text-xs text-slate-500">{product.unit}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-7 w-7 border-white/10 hover:bg-white/10"
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
                                    className="h-7 w-7 border-white/10 hover:bg-white/10"
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
                  className="bg-slate-800/50 border-white/10 text-slate-200 mt-1.5"
                  data-testid="input-request-notes"
                />
              </div>
            </div>

            <DialogFooter className="gap-2 mt-4">
              <Button variant="ghost" onClick={() => setShowWarehouseRequest(false)} className="text-slate-400">
                Cancel
              </Button>
              <GlowButton 
                variant="amber"
                onClick={() => createRequestMutation.mutate()}
                disabled={createRequestMutation.isPending || getTotalItemsInRequest() === 0}
              >
                {createRequestMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Truck className="h-4 w-4" />
                )}
                Submit Request
              </GlowButton>
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
      </AnimatedBackground>
    );
  }

  const activeStand = stands.find(s => s.id === activeStandId);

  return (
    <AnimatedBackground>
      <GlobalModeBar />
      <PageHeader 
        title={activeStand?.name || 'Stand'}
        subtitle={activeStand?.status === 'Open' ? '● Open' : '● Closed'}
        subtitleColor={activeStand?.status === 'Open' ? 'text-emerald-400' : 'text-red-400'}
        backAction={() => setActiveStandId(null)}
      />

      <main className="p-4 md:p-6 max-w-4xl mx-auto pb-24">
        {showScanner && (
           <div className="fixed inset-0 z-50 bg-black flex flex-col">
             <div className="relative flex-1 bg-black">
                <Webcam 
                  audio={false}
                  screenshotFormat="image/jpeg"
                  videoConstraints={{ facingMode: "environment" }}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 border-2 border-cyan-400/50 m-12 rounded-2xl pointer-events-none flex items-center justify-center">
                  <span className="bg-black/50 text-white px-3 py-1.5 text-sm rounded-lg backdrop-blur-sm">Align Product Code</span>
                </div>
             </div>
             <div className="p-6 bg-black flex justify-between items-center">
               <Button variant="secondary" onClick={() => setShowScanner(false)} className="bg-slate-800">Cancel</Button>
               <GlowButton variant="cyan" onClick={() => setShowScanner(false)}>Capture</GlowButton>
             </div>
           </div>
        )}

        <GlassCard gradient className="mb-6">
          <Tabs defaultValue="inventory" className="w-full" onValueChange={setActiveTab}>
            <div className="flex items-center justify-between px-4 pt-3">
              <TabsList className="grid w-full grid-cols-3 bg-slate-800/50 rounded-2xl p-1">
                <TabsTrigger value="inventory" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400 rounded-xl">
                  Inventory
                </TabsTrigger>
                <TabsTrigger value="compliance" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400 rounded-xl">
                  Docs
                </TabsTrigger>
                <TabsTrigger value="closeout" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400 rounded-xl" data-testid="tab-closeout">
                  <ClipboardCheck className="h-3 w-3 mr-1" />
                  Close
                </TabsTrigger>
              </TabsList>
              <SectionHelp
                title="Stand Management Tabs"
                description="Three core functions for managing your stand: Inventory counting, compliance documents, and end-of-event closeout procedures."
                tips={[
                  "Inventory: Count items at start, add deliveries, count at end",
                  "Docs: Sign required compliance forms",
                  "Close: Complete closeout checklist and submit"
                ]}
                keywords={['count-session', 'variance', 'violation', 'par-level']}
              />
            </div>
            
            <TabsContent value="inventory" className="p-4 md:p-5 space-y-4">
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className="w-full py-3 px-4 rounded-xl border border-white/10 bg-slate-800/50 flex items-center justify-center gap-2 hover:bg-slate-700/50 transition-colors"
                onClick={() => setShowScanner(true)}
              >
                <QrCode className="h-4 w-4 text-cyan-400" /> 
                <span className="text-slate-200 font-medium">Scan Item</span>
              </motion.button>

              <Accordion type="single" collapsible className="w-full space-y-2">
                {items.map(item => {
                   const standCounts = countSheets[activeStandId!] || {};
                   const count = standCounts[item.id] || { startCount: 0, adds: 0, endCount: 0, spoilage: 0, sold: 0 };
                   
                   return (
                    <AccordionItem key={item.id} value={item.id} className="bg-slate-800/40 border border-white/10 rounded-xl px-4">
                      <AccordionTrigger className="hover:no-underline py-3">
                        <div className="flex items-center gap-3 w-full text-left">
                          <div className={cn(
                            "p-2.5 rounded-xl",
                            item.category === 'Beverage' 
                              ? 'bg-gradient-to-br from-blue-500 to-blue-600' 
                              : 'bg-gradient-to-br from-orange-500 to-orange-600'
                          )}>
                            {item.category === 'Beverage' ? <Beer className="h-4 w-4 text-white" /> : <UtensilsCrossed className="h-4 w-4 text-white" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-sm text-slate-200 truncate">{item.name}</div>
                            <div className="text-xs text-slate-500">Sold: <span className="font-mono font-bold text-cyan-400">{count.sold}</span></div>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pb-4">
                        <div className="grid grid-cols-2 gap-4 pt-2">
                          <div className="space-y-1.5">
                            <label className="text-xs font-medium text-slate-400 uppercase">Start</label>
                            <Input 
                              type="number" 
                              className="text-center font-mono text-lg bg-slate-800/50 border-white/10 text-slate-200 rounded-xl" 
                              value={count.startCount}
                              onChange={(e) => updateCount(activeStandId!, item.id, 'startCount', parseInt(e.target.value) || 0)}
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs font-medium text-emerald-400 uppercase">Adds</label>
                            <Input 
                              type="number" 
                              className="text-center font-mono text-lg bg-slate-800/50 border-white/10 text-emerald-400 rounded-xl" 
                              value={count.adds}
                              onChange={(e) => updateCount(activeStandId!, item.id, 'adds', parseInt(e.target.value) || 0)}
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs font-medium text-blue-400 uppercase">End</label>
                            <Input 
                              type="number" 
                              className="text-center font-mono text-lg bg-slate-800/50 border-white/10 text-blue-400 rounded-xl" 
                              value={count.endCount}
                              onChange={(e) => updateCount(activeStandId!, item.id, 'endCount', parseInt(e.target.value) || 0)}
                            />
                          </div>
                           <div className="space-y-1.5">
                            <label className="text-xs font-medium text-red-400 uppercase">Spoilage</label>
                            <Input 
                              type="number" 
                              className="text-center font-mono text-lg bg-slate-800/50 border-white/10 text-red-400 rounded-xl" 
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
            
            <TabsContent value="compliance" className="p-4 md:p-5">
              <div className="space-y-4">
                <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl text-sm text-amber-300 flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 flex-shrink-0" />
                  <span>Ensure all staff have signed the TABC compliance sheet.</span>
                </div>

                <div className="space-y-2">
                   {supervisorDocs.map(doc => (
                     <motion.div 
                       key={doc.id} 
                       whileHover={{ x: 4 }}
                       className="border border-white/10 rounded-xl p-4 bg-slate-800/40 flex items-center justify-between"
                     >
                       <div className="flex items-center gap-3">
                         <div className={cn(
                           "p-2 rounded-lg",
                           doc.category === 'Compliance' ? 'bg-amber-500/20' : 
                           doc.category === 'Checklist' ? 'bg-emerald-500/20' : 'bg-blue-500/20'
                         )}>
                           {doc.category === 'Compliance' ? <AlertCircle className="text-amber-400 w-4 h-4" /> : 
                            doc.category === 'Checklist' ? <CheckSquare className="text-emerald-400 w-4 h-4" /> :
                            <FileText className="text-blue-400 w-4 h-4" />}
                         </div>
                         <div>
                           <div className="font-bold text-sm text-slate-200">{doc.title}</div>
                           <div className="text-xs text-slate-500">{doc.category}</div>
                         </div>
                       </div>
                       {doc.requiresSignature ? (
                         <Button size="sm" variant="outline" className="gap-2 border-white/10 hover:bg-white/5">
                           <PenTool className="w-3.5 h-3.5" /> Sign
                         </Button>
                       ) : (
                         <Button size="sm" variant="ghost" className="text-slate-400">View</Button>
                       )}
                     </motion.div>
                   ))}
                </div>

                {complianceError && (
                  <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-sm text-red-400 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    {complianceError}
                  </div>
                )}

                <div className="space-y-2 pt-4 border-t border-white/10 mt-4">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-slate-300">Supervisor Signature</label>
                      <Button variant="ghost" size="sm" onClick={clearSignature} disabled={complianceSubmitted} className="text-slate-400">
                        Clear
                      </Button>
                    </div>
                    <div className="border-2 border-white/10 rounded-xl bg-white overflow-hidden">
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
                  <GlowButton 
                    variant="cyan"
                    className="w-full mt-4"
                    onClick={submitComplianceSheet}
                    disabled={complianceSubmitting}
                  >
                    {complianceSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    Submit to Operations Manager
                  </GlowButton>
                ) : (
                  <div className="flex items-center justify-center gap-2 text-emerald-400 bg-emerald-500/10 p-3 rounded-xl mt-4 border border-emerald-500/30">
                    <CheckCircle2 className="h-5 w-5" />
                    <span className="font-medium">Submitted to Operations Manager</span>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="closeout" className="p-4 md:p-5 space-y-4">
              <FacilityIssuePanel
                standId={activeStandId!}
                standName={activeStand?.name || ''}
                reporterId={currentUser?.id || ''}
                reporterName={currentUser?.name}
                eventDate={new Date().toISOString().split('T')[0]}
              />
              <SupervisorClosingPanel
                standId={activeStandId!}
                standName={activeStand?.name || ''}
                eventDate={new Date().toISOString().split('T')[0]}
                supervisorId={currentUser?.id || ''}
                supervisorName={currentUser?.name}
              />
            </TabsContent>
          </Tabs>
        </GlassCard>
      </main>
      
      <TutorialHelpButton page="supervisor" />
    </AnimatedBackground>
  );
}
