import { useState, useRef, useCallback } from 'react';
import Webcam from 'react-webcam';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Camera, X, RotateCcw, Check, Loader2, AlertCircle, 
  ScanLine, Package, ChevronDown, ChevronUp, SwitchCamera,
  Sparkles, FileText, CheckCircle
} from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';

interface ProductCount {
  name: string;
  count: number;
  shelf?: string;
  confidence?: 'high' | 'medium' | 'low';
}

interface ScanResult {
  totalCount: number;
  confidence: 'high' | 'medium' | 'low';
  products: ProductCount[];
  notes?: string;
}

interface QuickScanModalProps {
  onClose: () => void;
  onScanComplete?: (items: Array<{name: string; count: number}>) => void;
  standName?: string;
  mode?: 'cooler' | 'paper' | 'both';
}

const CONFIDENCE_COLORS = {
  high: 'bg-green-100 text-green-700 border-green-200',
  medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  low: 'bg-red-100 text-red-700 border-red-200',
};

export function QuickScanModal({ 
  onClose, 
  onScanComplete,
  standName = 'Your Stand',
  mode = 'both'
}: QuickScanModalProps) {
  const webcamRef = useRef<Webcam>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [scanType, setScanType] = useState<'cooler' | 'paper'>('cooler');
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [editedCounts, setEditedCounts] = useState<Record<number, number>>({});

  const videoConstraints = {
    width: { ideal: 1920 },
    height: { ideal: 1080 },
    facingMode: facingMode
  };

  const captureImage = useCallback(() => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      if (imageSrc) {
        setCapturedImage(imageSrc);
        setError(null);
      }
    }
  }, []);

  const retakePhoto = () => {
    setCapturedImage(null);
    setScanResult(null);
    setError(null);
    setSelectedItems(new Set());
    setEditedCounts({});
  };

  const toggleCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
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

  const analyzeImage = async () => {
    if (!capturedImage) return;

    setIsScanning(true);
    setError(null);

    try {
      const blob = base64ToBlob(capturedImage);
      const formData = new FormData();
      formData.append('image', blob, 'scan.jpg');

      const endpoint = scanType === 'cooler' 
        ? '/api/ai-scanner/count' 
        : '/api/ai-scanner/count-sheet';

      const apiResponse = await fetch(endpoint, {
        method: 'POST',
        body: formData
      });

      if (!apiResponse.ok) {
        const errorData = await apiResponse.json();
        throw new Error(errorData.error || 'Failed to analyze image');
      }

      const data = await apiResponse.json();
      if (data.success && data.result) {
        const result = data.result;
        setScanResult({
          totalCount: result.totalCount || result.totalItems || 0,
          confidence: result.confidence || result.overallConfidence || 'medium',
          products: result.products || result.items?.map((item: any) => ({
            name: item.name,
            count: item.count,
            confidence: item.confidence
          })) || [],
          notes: result.notes
        });
        const allIndices = new Set<number>(
          (result.products || result.items || []).map((_: any, i: number) => i)
        );
        setSelectedItems(allIndices);
      } else {
        throw new Error('Invalid response from AI scanner');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze image');
    } finally {
      setIsScanning(false);
    }
  };

  const handleCountEdit = (index: number, value: string) => {
    const numValue = parseInt(value) || 0;
    setEditedCounts(prev => ({
      ...prev,
      [index]: numValue
    }));
  };

  const toggleItemSelection = (index: number) => {
    setSelectedItems(prev => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const handleConfirm = () => {
    if (!scanResult) return;
    
    const selectedData = scanResult.products
      .map((product, index) => ({
        name: product.name,
        count: editedCounts[index] !== undefined ? editedCounts[index] : product.count
      }))
      .filter((_, index) => selectedItems.has(index));

    if (onScanComplete) {
      onScanComplete(selectedData);
    }
    onClose();
  };

  const getConfidenceBadge = (confidence: string) => {
    switch (confidence) {
      case 'high':
        return <Badge className="bg-green-100 text-green-700 text-xs">High</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-100 text-yellow-700 text-xs">Medium</Badge>;
      case 'low':
        return <Badge className="bg-red-100 text-red-700 text-xs">Low</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" data-testid="quick-scan-modal">
      <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white">
        <CardHeader className="pb-2 border-b sticky top-0 bg-white z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg">Quick AI Scan</CardTitle>
                <p className="text-xs text-muted-foreground">{standName}</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} data-testid="close-quick-scan">
              <X className="h-5 w-5" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="p-4 space-y-4">
          {mode === 'both' && !capturedImage && (
            <Tabs value={scanType} onValueChange={(v) => setScanType(v as 'cooler' | 'paper')} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="cooler" className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Cooler Scan
                </TabsTrigger>
                <TabsTrigger value="paper" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Paper Sheet
                </TabsTrigger>
              </TabsList>
            </Tabs>
          )}

          {!capturedImage ? (
            <div className="space-y-3">
              <div className="relative rounded-lg overflow-hidden bg-black aspect-[4/3]">
                <Webcam
                  ref={webcamRef}
                  audio={false}
                  screenshotFormat="image/jpeg"
                  videoConstraints={videoConstraints}
                  className="w-full h-full object-cover"
                  data-testid="quick-scan-webcam"
                />
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute inset-4 border-2 border-white/30 rounded-lg" />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                    <ScanLine className="h-12 w-12 text-cyan-400 animate-pulse" />
                  </div>
                </div>
              </div>
              
              <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-3">
                <p className="text-sm text-cyan-800">
                  {scanType === 'cooler' 
                    ? "📸 Point your camera at the cooler. The AI will count all visible cans and bottles."
                    : "📝 Point your camera at a handwritten count sheet. The AI will read the items and quantities."
                  }
                </p>
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={captureImage} 
                  className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white"
                  data-testid="capture-quick-scan"
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Take Photo
                </Button>
                <Button 
                  onClick={toggleCamera} 
                  variant="outline"
                  data-testid="toggle-camera"
                >
                  <SwitchCamera className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative rounded-lg overflow-hidden">
                <img src={capturedImage} alt="Captured" className="w-full rounded-lg" />
                {isScanning && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <div className="text-center text-white">
                      <Loader2 className="h-10 w-10 animate-spin mx-auto mb-2" />
                      <p className="font-medium">AI is counting...</p>
                      <p className="text-sm text-white/70">This may take a few seconds</p>
                    </div>
                  </div>
                )}
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-red-700 font-medium">Scan Failed</p>
                    <p className="text-xs text-red-600">{error}</p>
                  </div>
                </div>
              )}

              {!scanResult && !isScanning && !error && (
                <div className="flex gap-2">
                  <Button 
                    onClick={retakePhoto} 
                    variant="outline" 
                    className="flex-1"
                    data-testid="retake-photo"
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Retake
                  </Button>
                  <Button 
                    onClick={analyzeImage} 
                    className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
                    data-testid="analyze-image"
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Analyze with AI
                  </Button>
                </div>
              )}

              {scanResult && (
                <div className="space-y-3">
                  <div className="bg-gradient-to-r from-cyan-50 to-blue-50 border border-cyan-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-lg font-bold text-cyan-900">
                        Total: {scanResult.totalCount} items
                      </span>
                      {getConfidenceBadge(scanResult.confidence)}
                    </div>
                    
                    {scanResult.notes && (
                      <p className="text-xs text-cyan-700 bg-white/50 p-2 rounded mb-3">
                        {scanResult.notes}
                      </p>
                    )}

                    <div className="max-h-48 overflow-y-auto space-y-2">
                      {scanResult.products.map((product, index) => (
                        <div 
                          key={index}
                          className={`flex items-center gap-2 p-2 rounded-lg transition-colors ${
                            selectedItems.has(index) ? 'bg-white shadow-sm' : 'bg-gray-50'
                          }`}
                          data-testid={`scanned-product-${index}`}
                        >
                          <Checkbox
                            checked={selectedItems.has(index)}
                            onCheckedChange={() => toggleItemSelection(index)}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm truncate">{product.name}</span>
                              {product.confidence && product.confidence !== 'high' && (
                                getConfidenceBadge(product.confidence)
                              )}
                            </div>
                            {product.shelf && (
                              <span className="text-xs text-muted-foreground">{product.shelf}</span>
                            )}
                          </div>
                          <Input
                            type="number"
                            value={editedCounts[index] !== undefined ? editedCounts[index] : product.count}
                            onChange={(e) => handleCountEdit(index, e.target.value)}
                            className="w-16 h-8 text-center text-sm"
                            min={0}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      onClick={retakePhoto} 
                      variant="outline" 
                      className="flex-1"
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Scan Again
                    </Button>
                    <Button 
                      onClick={handleConfirm}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      disabled={selectedItems.size === 0}
                      data-testid="confirm-scan"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Use {selectedItems.size} Items
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
