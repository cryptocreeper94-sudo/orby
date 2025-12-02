import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Webcam from 'react-webcam';
import { 
  Store, 
  ChevronLeft, 
  Search, 
  Plus,
  Trash2,
  Check,
  X,
  AlertCircle,
  Camera,
  ScanLine,
  FileText,
  SwitchCamera,
  RotateCcw,
  Loader2,
  Settings,
  Package,
  CheckCircle2,
  XCircle
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
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
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";

type Stand = {
  id: string;
  name: string;
  section: string;
  physicalSection: string;
};

type Item = {
  id: string;
  name: string;
  price: number;
  category: string;
};

type StandItem = {
  id: string;
  standId: string;
  itemId: string;
  sortOrder: number;
  isChargeable: boolean;
  item: Item;
};

type ScannedItem = {
  name: string;
  count: number;
  confidence: 'high' | 'medium' | 'low';
  notes?: string;
};

export default function StandSetup() {
  const [, setLocation] = useLocation();
  const currentUser = useStore((state: { currentUser: any }) => state.currentUser);
  const { toast } = useToast();
  
  const [stands, setStands] = useState<Stand[]>([]);
  const [allItems, setAllItems] = useState<Item[]>([]);
  const [standsWithTemplates, setStandsWithTemplates] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [selectedStand, setSelectedStand] = useState<Stand | null>(null);
  const [standItems, setStandItems] = useState<StandItem[]>([]);
  const [loadingStandItems, setLoadingStandItems] = useState(false);
  
  const [scanDialogOpen, setScanDialogOpen] = useState(false);
  const [addItemsDialogOpen, setAddItemsDialogOpen] = useState(false);
  
  const webcamRef = useRef<Webcam>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScannedItem[] | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [selectedScannedItems, setSelectedScannedItems] = useState<Set<number>>(new Set());
  
  const [selectedItemsToAdd, setSelectedItemsToAdd] = useState<Set<string>>(new Set());
  const [itemSearchQuery, setItemSearchQuery] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [standsRes, itemsRes, templatesRes] = await Promise.all([
        fetch('/api/stands'),
        fetch('/api/items'),
        fetch('/api/stand-items')
      ]);
      
      if (standsRes.ok) {
        const standsData = await standsRes.json();
        setStands(standsData);
      }
      if (itemsRes.ok) {
        const itemsData = await itemsRes.json();
        setAllItems(itemsData);
      }
      if (templatesRes.ok) {
        const templateIds = await templatesRes.json();
        setStandsWithTemplates(templateIds);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStandItems = async (standId: string) => {
    setLoadingStandItems(true);
    try {
      const response = await fetch(`/api/stand-items/${standId}`);
      if (response.ok) {
        const items = await response.json();
        setStandItems(items);
      }
    } catch (error) {
      console.error('Failed to fetch stand items:', error);
    } finally {
      setLoadingStandItems(false);
    }
  };

  const selectStand = (stand: Stand) => {
    setSelectedStand(stand);
    fetchStandItems(stand.id);
  };

  const filteredStands = stands.filter(stand => 
    stand.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    stand.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const hasTemplate = (standId: string) => standsWithTemplates.includes(standId);

  const captureImage = useCallback(() => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      if (imageSrc) {
        setCapturedImage(imageSrc);
        setScanError(null);
      }
    }
  }, []);

  const retakePhoto = () => {
    setCapturedImage(null);
    setScanResult(null);
    setScanError(null);
    setSelectedScannedItems(new Set());
  };

  const base64ToBlob = (base64: string): Blob => {
    const parts = base64.split(',');
    const mimeMatch = parts[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
    const byteString = atob(parts[1]);
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: mime });
  };

  const scanCountSheet = async () => {
    if (!capturedImage) return;

    setIsScanning(true);
    setScanError(null);

    try {
      const blob = base64ToBlob(capturedImage);
      const formData = new FormData();
      formData.append('image', blob, 'count-sheet.jpg');

      const response = await fetch('/api/ai-scanner/count-sheet', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to scan count sheet');
      }

      const data = await response.json();
      if (data.success && data.result && data.result.items) {
        setScanResult(data.result.items);
        setSelectedScannedItems(new Set(data.result.items.map((_: any, i: number) => i)));
      } else {
        throw new Error('Invalid response from scanner');
      }
    } catch (err) {
      setScanError(err instanceof Error ? err.message : 'Failed to scan count sheet');
    } finally {
      setIsScanning(false);
    }
  };

  const guessCategory = (name: string): string => {
    const nameLower = name.toLowerCase();
    if (nameLower.includes('bud') || nameLower.includes('miller') || nameLower.includes('coors') ||
        nameLower.includes('corona') || nameLower.includes('modelo') || nameLower.includes('heineken') ||
        nameLower.includes('blue moon') || nameLower.includes('michelob')) {
      return 'Beer';
    }
    if (nameLower.includes('claw') || nameLower.includes('truly') || nameLower.includes('seltzer')) {
      return 'Seltzer';
    }
    if (nameLower.includes('water') || nameLower.includes('soda') || nameLower.includes('coke') ||
        nameLower.includes('pepsi') || nameLower.includes('sprite') || nameLower.includes('tea') ||
        nameLower.includes('lemonade') || nameLower.includes('gatorade')) {
      return 'Beverage';
    }
    if (nameLower.includes('hot dog') || nameLower.includes('nacho') || nameLower.includes('pretzel') ||
        nameLower.includes('pizza') || nameLower.includes('burger') || nameLower.includes('chicken')) {
      return 'Food';
    }
    if (nameLower.includes('peanut') || nameLower.includes('popcorn') || nameLower.includes('candy') ||
        nameLower.includes('chip')) {
      return 'Snacks';
    }
    if (nameLower.includes('cup') || nameLower.includes('lid') || nameLower.includes('napkin') ||
        nameLower.includes('straw') || nameLower.includes('tray') || nameLower.includes('container')) {
      return 'Supplies';
    }
    return 'Other';
  };

  const processScannedItems = async () => {
    if (!scanResult || !selectedStand) return;

    const selectedItems = scanResult.filter((_, index) => selectedScannedItems.has(index));
    const newItemIds: string[] = [];

    for (const scannedItem of selectedItems) {
      let existingItem = allItems.find(item => 
        item.name.toLowerCase() === scannedItem.name.toLowerCase()
      );

      if (!existingItem) {
        try {
          const response = await fetch('/api/items', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: scannedItem.name,
              price: 0,
              category: guessCategory(scannedItem.name)
            })
          });

          if (response.ok) {
            existingItem = await response.json();
            setAllItems(prev => [...prev, existingItem!]);
          }
        } catch (error) {
          console.error('Failed to create item:', scannedItem.name);
          continue;
        }
      }

      if (existingItem) {
        newItemIds.push(existingItem.id);
      }
    }

    if (newItemIds.length > 0) {
      try {
        await fetch(`/api/stand-items/${selectedStand.id}/bulk`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            itemIds: newItemIds,
            clearExisting: true
          })
        });

        await fetchStandItems(selectedStand.id);
        setStandsWithTemplates(prev => 
          prev.includes(selectedStand.id) ? prev : [...prev, selectedStand.id]
        );

        toast({
          title: "Template Created",
          description: `${newItemIds.length} items added to ${selectedStand.name}'s inventory template.`,
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to save stand template.",
          variant: "destructive"
        });
      }
    }

    setScanDialogOpen(false);
    setCapturedImage(null);
    setScanResult(null);
    setSelectedScannedItems(new Set());
  };

  const toggleScannedItem = (index: number) => {
    setSelectedScannedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const removeStandItem = async (itemId: string) => {
    if (!selectedStand) return;

    try {
      await fetch(`/api/stand-items/${selectedStand.id}/${itemId}`, {
        method: 'DELETE'
      });
      
      setStandItems(prev => prev.filter(si => si.itemId !== itemId));
      
      toast({
        title: "Item Removed",
        description: "Item removed from stand template.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove item.",
        variant: "destructive"
      });
    }
  };

  const addSelectedItems = async () => {
    if (!selectedStand || selectedItemsToAdd.size === 0) return;

    const existingItemIds = new Set(standItems.map(si => si.itemId));
    const newItemIds = Array.from(selectedItemsToAdd).filter(id => !existingItemIds.has(id));

    if (newItemIds.length === 0) {
      toast({
        title: "No New Items",
        description: "All selected items are already in this stand's template.",
      });
      return;
    }

    try {
      for (const itemId of newItemIds) {
        await fetch(`/api/stand-items/${selectedStand.id}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ itemId })
        });
      }

      await fetchStandItems(selectedStand.id);
      setStandsWithTemplates(prev => 
        prev.includes(selectedStand.id) ? prev : [...prev, selectedStand.id]
      );

      toast({
        title: "Items Added",
        description: `${newItemIds.length} items added to template.`,
      });

      setAddItemsDialogOpen(false);
      setSelectedItemsToAdd(new Set());
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add items.",
        variant: "destructive"
      });
    }
  };

  const toggleItemToAdd = (itemId: string) => {
    setSelectedItemsToAdd(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const filteredItemsForAdd = allItems.filter(item =>
    item.name.toLowerCase().includes(itemSearchQuery.toLowerCase()) ||
    item.category.toLowerCase().includes(itemSearchQuery.toLowerCase())
  );

  const existingItemIds = new Set(standItems.map(si => si.itemId));

  if (!currentUser || !['Developer', 'Admin', 'Management', 'Warehouse', 'Kitchen'].includes(currentUser.role)) {
    return (
      <AnimatedBackground>
        <div className="min-h-screen flex items-center justify-center p-4">
          <GlassCard className="max-w-md w-full">
            <GlassCardContent className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-amber-400 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-slate-200 mb-2">Access Restricted</h2>
              <p className="text-slate-400 mb-4">Stand setup is only available for managers.</p>
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
      <div className="min-h-screen pb-20" data-testid="stand-setup-page">
        <PageHeader
          title="Stand Setup"
          subtitle="Configure inventory templates for each stand"
          icon={<Store className="h-6 w-6 text-cyan-400" />}
          iconColor="cyan"
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <GlassCard data-testid="card-stand-list">
                <GlassCardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-cyan-500/20">
                      <Store className="h-4 w-4 text-cyan-400" />
                    </div>
                    <span className="font-bold text-sm text-slate-200">
                      Select a Stand
                    </span>
                  </div>
                </GlassCardHeader>
                <GlassCardContent className="pt-0">
                  <div className="relative mb-3">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="Search stands..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 bg-white/5 border-white/10 text-slate-200"
                      data-testid="input-search-stands"
                    />
                  </div>

                  <ScrollArea className="h-[400px]">
                    <div className="space-y-2 pr-2">
                      {loading ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="h-6 w-6 text-cyan-400 animate-spin" />
                        </div>
                      ) : (
                        filteredStands.map(stand => (
                          <motion.div
                            key={stand.id}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => selectStand(stand)}
                            className={`p-3 rounded-lg border cursor-pointer transition-all ${
                              selectedStand?.id === stand.id
                                ? 'bg-cyan-500/20 border-cyan-500/50'
                                : 'bg-white/5 border-white/10 hover:bg-white/10'
                            }`}
                            data-testid={`stand-${stand.id}`}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-medium text-slate-200 text-sm">{stand.name}</div>
                                <div className="text-xs text-slate-500">{stand.id}</div>
                              </div>
                              {hasTemplate(stand.id) ? (
                                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                              ) : (
                                <XCircle className="h-4 w-4 text-slate-500" />
                              )}
                            </div>
                          </motion.div>
                        ))
                      )}
                    </div>
                  </ScrollArea>

                  <div className="mt-3 pt-3 border-t border-white/10">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>Configured: {standsWithTemplates.length}</span>
                      <span>Total: {stands.length}</span>
                    </div>
                  </div>
                </GlassCardContent>
              </GlassCard>
            </div>

            <div className="lg:col-span-2">
              {selectedStand ? (
                <GlassCard data-testid="card-stand-config">
                  <GlassCardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-cyan-500/20">
                          <Settings className="h-4 w-4 text-cyan-400" />
                        </div>
                        <div>
                          <span className="font-bold text-sm text-slate-200">
                            {selectedStand.name}
                          </span>
                          <span className="text-xs text-slate-500 ml-2">({selectedStand.id})</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setAddItemsDialogOpen(true)}
                          className="border-white/20 text-slate-300"
                          data-testid="button-add-items"
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add Items
                        </Button>
                        <GlowButton
                          variant="cyan"
                          size="sm"
                          onClick={() => setScanDialogOpen(true)}
                          data-testid="button-scan-template"
                        >
                          <ScanLine className="h-4 w-4 mr-1" />
                          Scan Sheet
                        </GlowButton>
                      </div>
                    </div>
                  </GlassCardHeader>
                  <GlassCardContent className="pt-0">
                    {loadingStandItems ? (
                      <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-6 w-6 text-cyan-400 animate-spin" />
                      </div>
                    ) : standItems.length === 0 ? (
                      <div className="text-center py-12">
                        <Package className="h-12 w-12 text-slate-600 mx-auto mb-3" />
                        <p className="text-slate-400 mb-2">No inventory template configured</p>
                        <p className="text-sm text-slate-500 mb-4">
                          Scan a count sheet or add items manually to create this stand's inventory template
                        </p>
                        <div className="flex justify-center gap-2">
                          <Button
                            variant="outline"
                            onClick={() => setAddItemsDialogOpen(true)}
                            className="border-white/20 text-slate-300"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Items
                          </Button>
                          <GlowButton variant="cyan" onClick={() => setScanDialogOpen(true)}>
                            <ScanLine className="h-4 w-4 mr-2" />
                            Scan Count Sheet
                          </GlowButton>
                        </div>
                      </div>
                    ) : (
                      <ScrollArea className="h-[400px]">
                        <div className="space-y-2 pr-2">
                          {standItems.map((si, idx) => (
                            <motion.div
                              key={si.id}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: idx * 0.02 }}
                              className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10"
                              data-testid={`stand-item-${si.itemId}`}
                            >
                              <div className="flex items-center gap-3">
                                <span className="text-xs text-slate-500 w-6">{idx + 1}</span>
                                <div>
                                  <div className="font-medium text-slate-200 text-sm">{si.item.name}</div>
                                  <Badge variant="outline" className="text-[10px] border-white/20 text-slate-400">
                                    {si.item.category}
                                  </Badge>
                                </div>
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-red-400 hover:bg-red-500/10"
                                onClick={() => removeStandItem(si.itemId)}
                                data-testid={`button-remove-${si.itemId}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </motion.div>
                          ))}
                        </div>
                      </ScrollArea>
                    )}

                    {standItems.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
                        <span>{standItems.length} items in template</span>
                        <Badge className="bg-emerald-500/20 text-emerald-400">
                          Template Active
                        </Badge>
                      </div>
                    )}
                  </GlassCardContent>
                </GlassCard>
              ) : (
                <GlassCard className="h-full">
                  <GlassCardContent className="flex items-center justify-center h-full min-h-[400px]">
                    <div className="text-center">
                      <Store className="h-16 w-16 text-slate-600 mx-auto mb-4" />
                      <p className="text-slate-400 text-lg mb-2">Select a Stand</p>
                      <p className="text-sm text-slate-500">
                        Choose a stand from the list to configure its inventory template
                      </p>
                    </div>
                  </GlassCardContent>
                </GlassCard>
              )}
            </div>
          </div>
        </main>

        <Dialog open={scanDialogOpen} onOpenChange={setScanDialogOpen}>
          <DialogContent className="bg-slate-900 border-slate-700 max-w-lg" data-testid="dialog-scan">
            <DialogHeader>
              <DialogTitle className="text-slate-200 flex items-center gap-2">
                <FileText className="h-5 w-5 text-cyan-400" />
                Scan Count Sheet for {selectedStand?.name}
              </DialogTitle>
              <DialogDescription className="text-slate-400">
                Scan a paper count sheet to create this stand's inventory template
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 mt-4">
              {!capturedImage ? (
                <div className="space-y-3">
                  <div className="relative rounded-lg overflow-hidden bg-black aspect-[4/3]">
                    <Webcam
                      ref={webcamRef}
                      audio={false}
                      screenshotFormat="image/jpeg"
                      videoConstraints={{
                        width: { ideal: 1920 },
                        height: { ideal: 1080 },
                        facingMode: facingMode
                      }}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => setFacingMode(prev => prev === 'user' ? 'environment' : 'user')}
                      variant="outline"
                      className="border-white/20 text-slate-300"
                    >
                      <SwitchCamera className="h-4 w-4" />
                    </Button>
                    <Button 
                      onClick={captureImage}
                      className="flex-1 bg-cyan-500 hover:bg-cyan-600"
                    >
                      <Camera className="h-4 w-4 mr-2" />
                      Capture
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="relative rounded-lg overflow-hidden aspect-[4/3]">
                    <img src={capturedImage} alt="Captured" className="w-full h-full object-cover" />
                  </div>
                  
                  {!scanResult && !isScanning && (
                    <div className="flex gap-2">
                      <Button 
                        onClick={retakePhoto}
                        variant="outline"
                        className="border-white/20 text-slate-300"
                      >
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Retake
                      </Button>
                      <Button 
                        onClick={scanCountSheet}
                        className="flex-1 bg-cyan-500 hover:bg-cyan-600"
                      >
                        <ScanLine className="h-4 w-4 mr-2" />
                        Scan Sheet
                      </Button>
                    </div>
                  )}

                  {isScanning && (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-6 w-6 text-cyan-400 animate-spin mr-2" />
                      <span className="text-slate-300">Reading count sheet...</span>
                    </div>
                  )}

                  {scanError && (
                    <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                      <div className="flex items-center gap-2 text-red-400">
                        <AlertCircle className="h-4 w-4" />
                        <span className="text-sm">{scanError}</span>
                      </div>
                    </div>
                  )}

                  {scanResult && (
                    <div className="space-y-3">
                      <div className="text-sm text-slate-400">
                        Found {scanResult.length} items. Select items to include in template:
                      </div>
                      <ScrollArea className="h-[200px] pr-2">
                        <div className="space-y-2">
                          {scanResult.map((item, index) => (
                            <div 
                              key={index}
                              className={`flex items-center gap-3 p-2 rounded-lg border ${
                                selectedScannedItems.has(index)
                                  ? 'bg-cyan-500/20 border-cyan-500/30'
                                  : 'bg-white/5 border-white/10'
                              }`}
                            >
                              <Checkbox
                                checked={selectedScannedItems.has(index)}
                                onCheckedChange={() => toggleScannedItem(index)}
                              />
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-slate-200 text-sm truncate">
                                  {item.name}
                                </div>
                                <div className="text-xs text-slate-500">
                                  Category: {guessCategory(item.name)}
                                </div>
                              </div>
                              <Badge 
                                className={`text-[10px] ${
                                  item.confidence === 'high' ? 'bg-emerald-500/20 text-emerald-400' :
                                  item.confidence === 'medium' ? 'bg-amber-500/20 text-amber-400' :
                                  'bg-red-500/20 text-red-400'
                                }`}
                              >
                                {item.confidence}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                      <div className="flex gap-2">
                        <Button 
                          onClick={retakePhoto}
                          variant="outline"
                          className="border-white/20 text-slate-300"
                        >
                          Scan Another
                        </Button>
                        <Button 
                          onClick={processScannedItems}
                          className="flex-1 bg-cyan-500 hover:bg-cyan-600"
                          disabled={selectedScannedItems.size === 0}
                        >
                          <Check className="h-4 w-4 mr-2" />
                          Create Template ({selectedScannedItems.size} items)
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={addItemsDialogOpen} onOpenChange={setAddItemsDialogOpen}>
          <DialogContent className="bg-slate-900 border-slate-700 max-w-lg" data-testid="dialog-add-items">
            <DialogHeader>
              <DialogTitle className="text-slate-200">Add Items to {selectedStand?.name}</DialogTitle>
              <DialogDescription className="text-slate-400">
                Select items to add to this stand's inventory template
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 mt-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search items..."
                  value={itemSearchQuery}
                  onChange={(e) => setItemSearchQuery(e.target.value)}
                  className="pl-10 bg-white/5 border-white/10 text-slate-200"
                />
              </div>

              <ScrollArea className="h-[300px] pr-2">
                <div className="space-y-2">
                  {filteredItemsForAdd.map(item => {
                    const isExisting = existingItemIds.has(item.id);
                    return (
                      <div 
                        key={item.id}
                        className={`flex items-center gap-3 p-2 rounded-lg border ${
                          isExisting
                            ? 'bg-emerald-500/10 border-emerald-500/30'
                            : selectedItemsToAdd.has(item.id)
                              ? 'bg-cyan-500/20 border-cyan-500/30'
                              : 'bg-white/5 border-white/10'
                        }`}
                      >
                        <Checkbox
                          checked={isExisting || selectedItemsToAdd.has(item.id)}
                          disabled={isExisting}
                          onCheckedChange={() => toggleItemToAdd(item.id)}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-slate-200 text-sm truncate">
                            {item.name}
                          </div>
                          <Badge variant="outline" className="text-[10px] border-white/20 text-slate-400">
                            {item.category}
                          </Badge>
                        </div>
                        {isExisting && (
                          <span className="text-xs text-emerald-400">In template</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>

            <DialogFooter className="mt-4">
              <Button variant="ghost" onClick={() => setAddItemsDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={addSelectedItems}
                className="bg-cyan-500 hover:bg-cyan-600"
                disabled={selectedItemsToAdd.size === 0}
              >
                Add {selectedItemsToAdd.size} Items
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AnimatedBackground>
  );
}
