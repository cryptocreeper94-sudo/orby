import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Webcam from 'react-webcam';
import { 
  Package, 
  Plus, 
  ChevronLeft, 
  Search, 
  Trash2,
  Edit2,
  Check,
  X,
  AlertCircle,
  Camera,
  ScanLine,
  FileText,
  DollarSign,
  Tag,
  SwitchCamera,
  RotateCcw,
  Loader2,
  Settings,
  Info
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
import { LayoutShell, BentoCard, CarouselRail, AccordionStack } from '@/components/ui/bento';

type Item = {
  id: string;
  name: string;
  price: number;
  category: string;
};

type ScannedItem = {
  name: string;
  count: number;
  confidence: 'high' | 'medium' | 'low';
  notes?: string;
  selected?: boolean;
};

const CATEGORIES = [
  'Beverage',
  'Beer',
  'Seltzer',
  'Food',
  'Snacks',
  'Merchandise',
  'Other'
];

export default function ItemManagement() {
  const [, setLocation] = useLocation();
  const currentUser = useStore((state: { currentUser: any }) => state.currentUser);
  const { toast } = useToast();
  
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [scanDialogOpen, setScanDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('');
  
  const webcamRef = useRef<Webcam>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScannedItem[] | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [selectedScannedItems, setSelectedScannedItems] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const response = await fetch('/api/items');
      if (response.ok) {
        const data = await response.json();
        setItems(data);
      }
    } catch (error) {
      console.error('Failed to fetch items:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = items.filter(item => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const categories = Array.from(new Set(items.map(item => item.category)));

  const handleAddItem = async () => {
    if (!newItemName.trim() || !newItemCategory) {
      toast({
        title: "Missing Information",
        description: "Please enter a name and category for the item.",
        variant: "destructive"
      });
      return;
    }

    try {
      const response = await fetch('/api/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newItemName.trim(),
          price: Math.round(parseFloat(newItemPrice || '0') * 100),
          category: newItemCategory
        })
      });

      if (response.ok) {
        const newItem = await response.json();
        setItems(prev => [...prev, newItem]);
        setNewItemName('');
        setNewItemPrice('');
        setNewItemCategory('');
        setAddDialogOpen(false);

        toast({
          title: "Item Added",
          description: `${newItem.name} has been added to the inventory.`,
        });
      } else {
        throw new Error('Failed to add item');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add item. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    try {
      const response = await fetch(`/api/items/${itemId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setItems(prev => prev.filter(item => item.id !== itemId));
        toast({
          title: "Item Deleted",
          description: "The item has been removed from inventory.",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete item.",
        variant: "destructive"
      });
    }
  };

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
        const scannedItems = data.result.items;
        setScanResult(scannedItems);
        
        const unmatchedIndices = new Set<number>();
        scannedItems.forEach((scannedItem: ScannedItem, index: number) => {
          const exists = items.some(item => 
            item.name.toLowerCase() === scannedItem.name.toLowerCase()
          );
          if (!exists) {
            unmatchedIndices.add(index);
          }
        });
        setSelectedScannedItems(unmatchedIndices);
      } else {
        throw new Error('Invalid response from scanner');
      }
    } catch (err) {
      setScanError(err instanceof Error ? err.message : 'Failed to scan count sheet');
    } finally {
      setIsScanning(false);
    }
  };

  const addScannedItems = async () => {
    if (!scanResult) return;

    const itemsToAdd = scanResult.filter((_, index) => selectedScannedItems.has(index));
    let addedCount = 0;

    for (const scannedItem of itemsToAdd) {
      const exists = items.some(item => 
        item.name.toLowerCase() === scannedItem.name.toLowerCase()
      );
      
      if (!exists) {
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
            const newItem = await response.json();
            setItems(prev => [...prev, newItem]);
            addedCount++;
          }
        } catch (error) {
          console.error('Failed to add item:', scannedItem.name);
        }
      }
    }

    toast({
      title: "Items Added",
      description: `${addedCount} new items added to inventory.`,
    });

    setScanDialogOpen(false);
    setCapturedImage(null);
    setScanResult(null);
    setSelectedScannedItems(new Set());
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
    return 'Other';
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

  const isItemInInventory = (name: string) => {
    return items.some(item => item.name.toLowerCase() === name.toLowerCase());
  };

  if (!currentUser || !['Developer', 'Admin', 'Management', 'Warehouse', 'Kitchen'].includes(currentUser.role)) {
    return (
      <AnimatedBackground>
        <div className="min-h-screen flex items-center justify-center p-4" data-testid="access-restricted">
          <GlassCard className="max-w-md w-full">
            <GlassCardContent className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-amber-400 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-slate-200 mb-2">Access Restricted</h2>
              <p className="text-slate-400 mb-4">Item management is only available for managers.</p>
              <Button onClick={() => setLocation('/')} className="bg-cyan-500 hover:bg-cyan-600" data-testid="button-return-home">
                Return Home
              </Button>
            </GlassCardContent>
          </GlassCard>
        </div>
      </AnimatedBackground>
    );
  }

  const metricsItems = [
    <div key="total" className="flex flex-col items-center p-3 bg-slate-800/60 rounded-lg min-w-[100px]" data-testid="metric-total-items">
      <Package className="h-5 w-5 text-cyan-400 mb-1" />
      <span className="text-xl font-bold text-white">{items.length}</span>
      <span className="text-[10px] text-white/50">Total Items</span>
    </div>,
    <div key="beverage" className="flex flex-col items-center p-3 bg-slate-800/60 rounded-lg min-w-[100px]" data-testid="metric-beverages">
      <Tag className="h-5 w-5 text-blue-400 mb-1" />
      <span className="text-xl font-bold text-white">{items.filter(i => i.category === 'Beverage').length}</span>
      <span className="text-[10px] text-white/50">Beverages</span>
    </div>,
    <div key="beer" className="flex flex-col items-center p-3 bg-slate-800/60 rounded-lg min-w-[100px]" data-testid="metric-beer">
      <Tag className="h-5 w-5 text-amber-400 mb-1" />
      <span className="text-xl font-bold text-white">{items.filter(i => i.category === 'Beer').length}</span>
      <span className="text-[10px] text-white/50">Beer</span>
    </div>,
    <div key="food" className="flex flex-col items-center p-3 bg-slate-800/60 rounded-lg min-w-[100px]" data-testid="metric-food">
      <Tag className="h-5 w-5 text-orange-400 mb-1" />
      <span className="text-xl font-bold text-white">{items.filter(i => i.category === 'Food').length}</span>
      <span className="text-[10px] text-white/50">Food</span>
    </div>,
    <div key="snacks" className="flex flex-col items-center p-3 bg-slate-800/60 rounded-lg min-w-[100px]" data-testid="metric-snacks">
      <Tag className="h-5 w-5 text-purple-400 mb-1" />
      <span className="text-xl font-bold text-white">{items.filter(i => i.category === 'Snacks').length}</span>
      <span className="text-[10px] text-white/50">Snacks</span>
    </div>,
  ];

  const categoryCarouselItems = [
    <Button
      key="all"
      variant={selectedCategory === 'all' ? 'default' : 'outline'}
      size="sm"
      onClick={() => setSelectedCategory('all')}
      className={`min-w-[80px] ${selectedCategory === 'all' ? 'bg-cyan-500' : 'border-white/20 text-slate-300'}`}
      data-testid="filter-all"
    >
      All ({items.length})
    </Button>,
    ...categories.map(cat => (
      <Button
        key={cat}
        variant={selectedCategory === cat ? 'default' : 'outline'}
        size="sm"
        onClick={() => setSelectedCategory(cat)}
        className={`min-w-[80px] ${selectedCategory === cat ? 'bg-cyan-500' : 'border-white/20 text-slate-300'}`}
        data-testid={`filter-${cat.toLowerCase()}`}
      >
        {cat} ({items.filter(i => i.category === cat).length})
      </Button>
    ))
  ];

  const settingsAccordionItems = [
    {
      title: 'Quick Actions',
      content: (
        <div className="flex flex-wrap gap-2" data-testid="quick-actions-content">
          <GlowButton 
            variant="cyan"
            onClick={() => setScanDialogOpen(true)}
            data-testid="button-scan-sheet"
          >
            <ScanLine className="h-4 w-4 mr-2" />
            Scan Count Sheet
          </GlowButton>
          <GlowButton 
            variant="cyan"
            onClick={() => setAddDialogOpen(true)}
            data-testid="button-add-item"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Item
          </GlowButton>
        </div>
      )
    },
    {
      title: 'About Item Management',
      content: (
        <div className="space-y-2 text-sm" data-testid="about-content">
          <p>Configure inventory items that can be counted at any stand. Items are organized by category for easy filtering.</p>
          <p>Use the AI-powered count sheet scanner to quickly add multiple items from paper inventory sheets.</p>
        </div>
      )
    }
  ];

  return (
    <AnimatedBackground>
      <div className="min-h-screen pb-20" data-testid="item-management-page">
        <div className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur-xl border-b border-white/10 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/manager">
                <Button variant="ghost" size="sm" className="text-slate-300 hover:bg-white/10" data-testid="button-back">
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Back
                </Button>
              </Link>
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-cyan-400" />
                <div>
                  <h1 className="text-lg font-bold text-white" data-testid="text-page-title">Item Management</h1>
                  <p className="text-xs text-slate-400">Configure inventory items for all stands</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-3">
          <LayoutShell className="gap-3">
            <BentoCard span={12} className="p-2" title="Item Metrics" data-testid="bento-card-metrics">
              <CarouselRail items={metricsItems} data-testid="carousel-metrics" />
            </BentoCard>

            <BentoCard span={12} className="p-2" title="Categories" data-testid="bento-card-categories">
              <CarouselRail items={categoryCarouselItems} data-testid="carousel-categories" />
            </BentoCard>

            <BentoCard span={12} className="p-2" data-testid="bento-card-search">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search items..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-white/5 border-white/10 text-slate-200"
                  data-testid="input-search-items"
                />
              </div>
            </BentoCard>

            <BentoCard span={12} className="p-2" title={`Inventory Items (${filteredItems.length})`} data-testid="bento-card-items">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" />
                </div>
              ) : filteredItems.length === 0 ? (
                <div className="text-center py-8" data-testid="empty-items-state">
                  <Package className="h-10 w-10 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-400 text-sm">No items found</p>
                  <p className="text-xs text-slate-500 mt-1">Add items or scan a count sheet to get started</p>
                </div>
              ) : (
                <ScrollArea className="h-[400px]">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 pr-2">
                    <AnimatePresence>
                      {filteredItems.map((item, idx) => (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ delay: idx * 0.02 }}
                          className="p-3 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-colors"
                          data-testid={`item-${item.id}`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-slate-200 truncate text-sm" data-testid={`item-name-${item.id}`}>{item.name}</div>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-[10px] border-white/20 text-slate-400">
                                  {item.category}
                                </Badge>
                                {item.price > 0 && (
                                  <span className="text-xs text-emerald-400" data-testid={`item-price-${item.id}`}>
                                    ${(item.price / 100).toFixed(2)}
                                  </span>
                                )}
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-red-400 hover:bg-red-500/10 h-8 w-8 p-0"
                              onClick={() => handleDeleteItem(item.id)}
                              data-testid={`button-delete-${item.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </ScrollArea>
              )}
            </BentoCard>

            <BentoCard span={12} className="p-2" title="Settings & Actions" data-testid="bento-card-settings">
              <AccordionStack 
                items={settingsAccordionItems} 
                defaultOpen={[0]} 
                data-testid="accordion-settings"
              />
            </BentoCard>
          </LayoutShell>
        </div>

        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogContent className="bg-slate-900 border-slate-700" data-testid="dialog-add-item">
            <DialogHeader>
              <DialogTitle className="text-slate-200">Add New Item</DialogTitle>
              <DialogDescription className="text-slate-400">
                Add a new inventory item that can be counted at any stand
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Item Name *</Label>
                <Input
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  placeholder="e.g., Bud Light 16oz"
                  className="bg-white/5 border-white/10 text-slate-200"
                  data-testid="input-item-name"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Category *</Label>
                <Select value={newItemCategory} onValueChange={setNewItemCategory}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-slate-200" data-testid="select-category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    {CATEGORIES.map(cat => (
                      <SelectItem key={cat} value={cat} className="text-slate-200">
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Price (optional)</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    type="number"
                    step="0.01"
                    value={newItemPrice}
                    onChange={(e) => setNewItemPrice(e.target.value)}
                    placeholder="0.00"
                    className="pl-10 bg-white/5 border-white/10 text-slate-200"
                    data-testid="input-item-price"
                  />
                </div>
              </div>
            </div>
            <DialogFooter className="mt-4">
              <Button variant="ghost" onClick={() => setAddDialogOpen(false)} data-testid="button-cancel-add">
                Cancel
              </Button>
              <Button onClick={handleAddItem} className="bg-cyan-500 hover:bg-cyan-600" data-testid="button-confirm-add">
                Add Item
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={scanDialogOpen} onOpenChange={setScanDialogOpen}>
          <DialogContent className="bg-slate-900 border-slate-700 max-w-lg" data-testid="dialog-scan-sheet">
            <DialogHeader>
              <DialogTitle className="text-slate-200 flex items-center gap-2">
                <FileText className="h-5 w-5 text-cyan-400" />
                Scan Count Sheet
              </DialogTitle>
              <DialogDescription className="text-slate-400">
                Scan a paper count sheet to add new items to the system
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
                      data-testid="scan-webcam"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => setFacingMode(prev => prev === 'user' ? 'environment' : 'user')}
                      variant="outline"
                      className="border-white/20 text-slate-300"
                      data-testid="button-switch-camera"
                    >
                      <SwitchCamera className="h-4 w-4" />
                    </Button>
                    <Button 
                      onClick={captureImage}
                      className="flex-1 bg-cyan-500 hover:bg-cyan-600"
                      data-testid="button-capture"
                    >
                      <Camera className="h-4 w-4 mr-2" />
                      Capture Photo
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="relative rounded-lg overflow-hidden aspect-[4/3]">
                    <img 
                      src={capturedImage} 
                      alt="Captured count sheet" 
                      className="w-full h-full object-cover"
                      data-testid="captured-image"
                    />
                  </div>
                  
                  {scanError && (
                    <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2" data-testid="scan-error">
                      <AlertCircle className="h-4 w-4 text-red-400" />
                      <span className="text-sm text-red-400">{scanError}</span>
                    </div>
                  )}
                  
                  {scanResult && (
                    <div className="space-y-2">
                      <p className="text-sm text-slate-300">Found {scanResult.length} items:</p>
                      <ScrollArea className="h-48">
                        <div className="space-y-1">
                          {scanResult.map((scannedItem, index) => {
                            const inInventory = isItemInInventory(scannedItem.name);
                            return (
                              <div 
                                key={index}
                                className={`p-2 rounded-lg flex items-center gap-2 ${
                                  inInventory ? 'bg-green-500/10 border border-green-500/30' : 'bg-white/5 border border-white/10'
                                }`}
                                data-testid={`scanned-item-${index}`}
                              >
                                <Checkbox
                                  checked={selectedScannedItems.has(index)}
                                  onCheckedChange={() => toggleScannedItem(index)}
                                  disabled={inInventory}
                                  data-testid={`checkbox-scanned-${index}`}
                                />
                                <span className={`text-sm flex-1 ${inInventory ? 'text-green-400' : 'text-slate-200'}`}>
                                  {scannedItem.name}
                                </span>
                                {inInventory && (
                                  <Badge className="bg-green-500/20 text-green-400 text-[10px]">In Inventory</Badge>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </ScrollArea>
                    </div>
                  )}
                  
                  <div className="flex gap-2">
                    <Button 
                      onClick={retakePhoto}
                      variant="outline"
                      className="border-white/20 text-slate-300"
                      data-testid="button-retake"
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Retake
                    </Button>
                    {!scanResult ? (
                      <Button 
                        onClick={scanCountSheet}
                        disabled={isScanning}
                        className="flex-1 bg-cyan-500 hover:bg-cyan-600"
                        data-testid="button-scan"
                      >
                        {isScanning ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Scanning...
                          </>
                        ) : (
                          <>
                            <ScanLine className="h-4 w-4 mr-2" />
                            Scan Sheet
                          </>
                        )}
                      </Button>
                    ) : (
                      <Button 
                        onClick={addScannedItems}
                        disabled={selectedScannedItems.size === 0}
                        className="flex-1 bg-cyan-500 hover:bg-cyan-600"
                        data-testid="button-add-scanned"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Selected ({selectedScannedItems.size})
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AnimatedBackground>
  );
}
