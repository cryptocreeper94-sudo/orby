import { useState, useRef, useCallback } from 'react';
import Webcam from 'react-webcam';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Camera, X, RefreshCw, Check, AlertCircle, Loader2, 
  ScanLine, Package, ChevronDown, ChevronUp
} from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface ProductCount {
  name: string;
  count: number;
  shelf?: string;
}

interface ScanResult {
  totalCount: number;
  products: ProductCount[];
  confidence: 'high' | 'medium' | 'low';
  notes?: string;
}

interface AIScannerProps {
  onScanComplete: (result: ScanResult) => void;
  onClose: () => void;
  standName?: string;
}

const CONFIDENCE_COLORS = {
  high: 'bg-green-500/10 text-green-400 border border-green-500/30',
  medium: 'bg-amber-500/10 text-amber-400 border border-amber-500/30',
  low: 'bg-red-500/10 text-red-400 border border-red-500/30'
};

export function AIScanner({ onScanComplete, onClose, standName }: AIScannerProps) {
  const webcamRef = useRef<Webcam>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');

  const videoConstraints = {
    width: 1280,
    height: 720,
    facingMode: facingMode
  };

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      setCapturedImage(imageSrc);
      setError(null);
      setScanResult(null);
    }
  }, []);

  const retake = () => {
    setCapturedImage(null);
    setScanResult(null);
    setError(null);
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

      const apiResponse = await fetch('/api/ai-scanner/count', {
        method: 'POST',
        body: formData
      });

      if (!apiResponse.ok) {
        const errorData = await apiResponse.json();
        throw new Error(errorData.error || 'Failed to analyze image');
      }

      const data = await apiResponse.json();
      if (data.success && data.result) {
        setScanResult(data.result);
      } else {
        throw new Error('Invalid response from AI scanner');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze image');
    } finally {
      setIsScanning(false);
    }
  };

  const handleConfirm = () => {
    if (scanResult) {
      onScanComplete(scanResult);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-slate-900">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="flex items-center gap-2">
            <ScanLine className="w-5 h-5 text-blue-400" />
            <CardTitle className="text-lg">AI Inventory Scanner</CardTitle>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} data-testid="button-close-scanner">
            <X className="w-5 h-5" />
          </Button>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {standName && (
            <div className="text-sm text-muted-foreground text-center">
              Scanning for: <span className="font-medium">{standName}</span>
            </div>
          )}

          {!capturedImage ? (
            <div className="space-y-4">
              <div className="relative rounded-lg overflow-hidden bg-black aspect-video">
                <Webcam
                  ref={webcamRef}
                  audio={false}
                  screenshotFormat="image/jpeg"
                  videoConstraints={videoConstraints}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 border-2 border-dashed border-white/50 m-4 rounded-lg pointer-events-none">
                  <div className="absolute top-2 left-2 right-2 text-center text-white text-xs bg-black/50 rounded px-2 py-1">
                    Position cooler shelf in frame
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  onClick={toggleCamera} 
                  variant="outline" 
                  className="flex-1"
                  data-testid="button-toggle-camera"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Flip Camera
                </Button>
                <Button 
                  onClick={capture} 
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                  data-testid="button-capture"
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Capture
                </Button>
              </div>
              
              <div className="text-xs text-muted-foreground text-center space-y-1">
                <p>Position the camera above the cooler for a top-down view.</p>
                <p>Works best with single-layer items like cans.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative rounded-lg overflow-hidden bg-black aspect-video">
                <img 
                  src={capturedImage} 
                  alt="Captured" 
                  className="w-full h-full object-cover"
                />
                {isScanning && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <div className="text-center text-white">
                      <Loader2 className="w-10 h-10 animate-spin mx-auto mb-2" />
                      <p className="text-sm">AI is counting...</p>
                    </div>
                  </div>
                )}
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                  <div className="text-sm text-red-300">{error}</div>
                </div>
              )}

              {scanResult && (
                <div className="space-y-3">
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-lg font-bold text-blue-300">
                        Total Count: {scanResult.totalCount}
                      </span>
                      <Badge className={CONFIDENCE_COLORS[scanResult.confidence]}>
                        {scanResult.confidence} confidence
                      </Badge>
                    </div>
                    
                    <Accordion type="single" collapsible defaultValue="products">
                      <AccordionItem value="products" className="border-none">
                        <AccordionTrigger className="text-sm font-medium py-2">
                          <div className="flex items-center gap-2">
                            <Package className="w-4 h-4" />
                            Product Breakdown ({scanResult.products.length} items)
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-2">
                            {scanResult.products.map((product, index) => (
                              <div 
                                key={index}
                                className="flex items-center justify-between bg-slate-800/50 rounded-lg p-2 shadow-sm"
                                data-testid={`product-count-${index}`}
                              >
                                <div>
                                  <span className="font-medium">{product.name}</span>
                                  {product.shelf && (
                                    <span className="text-xs text-muted-foreground ml-2">
                                      ({product.shelf})
                                    </span>
                                  )}
                                </div>
                                <Badge variant="secondary" className="font-bold">
                                  {product.count}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>

                    {scanResult.notes && (
                      <div className="mt-3 text-xs text-muted-foreground border-t pt-2">
                        <strong>Notes:</strong> {scanResult.notes}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button 
                  onClick={retake} 
                  variant="outline" 
                  className="flex-1"
                  disabled={isScanning}
                  data-testid="button-retake"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Retake
                </Button>
                {!scanResult ? (
                  <Button 
                    onClick={analyzeImage} 
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                    disabled={isScanning}
                    data-testid="button-analyze"
                  >
                    {isScanning ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <ScanLine className="w-4 h-4 mr-2" />
                        Analyze Image
                      </>
                    )}
                  </Button>
                ) : (
                  <Button 
                    onClick={handleConfirm} 
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    data-testid="button-confirm-scan"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Use These Counts
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
