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
  Loader2
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";

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
        <div className="min-h-screen flex items-center justify-center p-4">
          <GlassCard className="max-w-md w-full">
            <GlassCardContent className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-amber-400 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-slate-200 mb-2">Access Restricted</h2>
              <p className="text-slate-400 mb-4">Item management is only available for managers.</p>
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
      <div className="min-h-screen pb-20" data-testid="item-management-page">
        <PageHeader
          title="Item Management"
          subtitle="Configure inventory items for all stands"
          icon={<Package className="h-6 w-6 text-cyan-400" />}
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

        <main className="container mx-auto p-4 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white/5 border-white/10 text-slate-200"
                data-testid="input-search-items"
              />
            </div>
            <div className="flex gap-2">
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
          </div>

          <div className="flex gap-2 flex-wrap">
            <Button
              variant={selectedCategory === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory('all')}
              className={selectedCategory === 'all' ? 'bg-cyan-500' : 'border-white/20 text-slate-300'}
              data-testid="filter-all"
            >
              All ({items.length})
            </Button>
            {categories.map(cat => (
              <Button
                key={cat}
                variant={selectedCategory === cat ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(cat)}
                className={selectedCategory === cat ? 'bg-cyan-500' : 'border-white/20 text-slate-300'}
                data-testid={`filter-${cat.toLowerCase()}`}
              >
                {cat} ({items.filter(i => i.category === cat).length})
              </Button>
            ))}
          </div>

          <GlassCard data-testid="card-items-list">
            <GlassCardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-cyan-500/20">
                  <Package className="h-4 w-4 text-cyan-400" />
                </div>
                <span className="font-bold text-sm text-slate-200">
                  Inventory Items ({filteredItems.length})
                </span>
              </div>
            </GlassCardHeader>
            <GlassCardContent className="pt-0">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" />
                </div>
              ) : filteredItems.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-400">No items found</p>
                  <p className="text-sm text-slate-500 mt-1">Add items or scan a count sheet to get started</p>
                </div>
              ) : (
                <ScrollArea className="h-[500px]">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pr-4">
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
                              <div className="font-medium text-slate-200 truncate">{item.name}</div>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-[10px] border-white/20 text-slate-400">
                                  {item.category}
                                </Badge>
                                {item.price > 0 && (
                                  <span className="text-xs text-emerald-400">
                                    ${(item.price / 100).toFixed(2)}
                                  </span>
                                )}
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-red-400 hover:bg-red-500/10"
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
            </GlassCardContent>
          </GlassCard>
        </main>

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
                        data-testid="button-retake"
                      >
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Retake
                      </Button>
                      <Button 
                        onClick={scanCountSheet}
                        className="flex-1 bg-cyan-500 hover:bg-cyan-600"
                        data-testid="button-scan"
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
                        Found {scanResult.length} items. Select new items to add:
                      </div>
                      <ScrollArea className="h-[200px] pr-2">
                        <div className="space-y-2">
                          {scanResult.map((item, index) => {
                            const exists = isItemInInventory(item.name);
                            return (
                              <div 
                                key={index}
                                className={`flex items-center gap-3 p-2 rounded-lg border ${
                                  exists 
                                    ? 'bg-emerald-500/10 border-emerald-500/30' 
                                    : selectedScannedItems.has(index)
                                      ? 'bg-cyan-500/20 border-cyan-500/30'
                                      : 'bg-white/5 border-white/10'
                                }`}
                              >
                                <Checkbox
                                  checked={exists || selectedScannedItems.has(index)}
                                  disabled={exists}
                                  onCheckedChange={() => toggleScannedItem(index)}
                                  data-testid={`checkbox-item-${index}`}
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium text-slate-200 text-sm truncate">
                                    {item.name}
                                  </div>
                                  <div className="text-xs text-slate-500">
                                    {exists ? (
                                      <span className="text-emerald-400">Already in system</span>
                                    ) : (
                                      <span>Will be added as: {guessCategory(item.name)}</span>
                                    )}
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
                            );
                          })}
                        </div>
                      </ScrollArea>
                      <div className="flex gap-2">
                        <Button 
                          onClick={retakePhoto}
                          variant="outline"
                          className="border-white/20 text-slate-300"
                          data-testid="button-scan-again"
                        >
                          Scan Another
                        </Button>
                        <Button 
                          onClick={addScannedItems}
                          className="flex-1 bg-cyan-500 hover:bg-cyan-600"
                          disabled={selectedScannedItems.size === 0}
                          data-testid="button-add-scanned"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add {selectedScannedItems.size} Items
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AnimatedBackground>
  );
}
