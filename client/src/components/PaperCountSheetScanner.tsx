import { useState, useRef, useCallback } from 'react';
import Webcam from 'react-webcam';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Camera, X, RotateCcw, Check, Loader2, AlertCircle, 
  FileText, SwitchCamera, CheckCircle, Edit2
} from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';

interface ScannedItem {
  name: string;
  count: number;
  confidence: 'high' | 'medium' | 'low';
  notes?: string;
  selected?: boolean;
  editedCount?: number;
}

interface ScanResult {
  items: ScannedItem[];
  totalItems: number;
  overallConfidence: 'high' | 'medium' | 'low';
  notes: string;
}

interface PaperCountSheetScannerProps {
  onScanComplete: (items: Array<{name: string; count: number}>) => void;
  onClose: () => void;
  existingItems?: Array<{id: string; name: string; category: string}>;
}

export function PaperCountSheetScanner({ 
  onScanComplete, 
  onClose,
  existingItems = []
}: PaperCountSheetScannerProps) {
  const webcamRef = useRef<Webcam>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
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
      formData.append('image', blob, 'count-sheet.jpg');

      const apiResponse = await fetch('/api/ai-scanner/count-sheet', {
        method: 'POST',
        body: formData
      });

      if (!apiResponse.ok) {
        const errorData = await apiResponse.json();
        throw new Error(errorData.error || 'Failed to read count sheet');
      }

      const data = await apiResponse.json();
      if (data.success && data.result) {
        setScanResult(data.result);
        const allIndices = new Set<number>(data.result.items.map((_: ScannedItem, i: number) => i));
        setSelectedItems(allIndices);
      } else {
        throw new Error('Invalid response from scanner');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to read count sheet');
    } finally {
      setIsScanning(false);
    }
  };

  const toggleItemSelection = (index: number) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const handleCountEdit = (index: number, value: string) => {
    const numValue = parseInt(value) || 0;
    setEditedCounts(prev => ({
      ...prev,
      [index]: numValue
    }));
  };

  const getConfidenceBadge = (confidence: string) => {
    switch (confidence) {
      case 'high':
        return <Badge className="bg-green-100 text-green-700">High</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-100 text-yellow-700">Medium</Badge>;
      case 'low':
        return <Badge className="bg-red-100 text-red-700">Low</Badge>;
      default:
        return null;
    }
  };

  const handleConfirm = () => {
    if (!scanResult) return;

    const selectedData = scanResult.items
      .map((item, index) => ({
        name: item.name,
        count: editedCounts[index] !== undefined ? editedCounts[index] : item.count
      }))
      .filter((_, index) => selectedItems.has(index));

    onScanComplete(selectedData);
  };

  const selectAll = () => {
    if (scanResult) {
      setSelectedItems(new Set(scanResult.items.map((_, i) => i)));
    }
  };

  const selectNone = () => {
    setSelectedItems(new Set());
  };

  return (
    <Card className="w-full max-w-lg mx-auto" data-testid="paper-scanner-card">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            Scan Paper Count Sheet
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose} data-testid="close-paper-scanner">
            <X className="h-5 w-5" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!capturedImage ? (
          <div className="space-y-3">
            <div className="relative rounded-lg overflow-hidden bg-black">
              <Webcam
                ref={webcamRef}
                audio={false}
                screenshotFormat="image/jpeg"
                videoConstraints={videoConstraints}
                className="w-full"
                data-testid="paper-scanner-webcam"
              />
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={captureImage} 
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                data-testid="capture-paper-photo"
              >
                <Camera className="h-4 w-4 mr-2" />
                Capture Photo
              </Button>
              <Button 
                onClick={toggleCamera} 
                variant="outline"
                data-testid="toggle-paper-camera"
              >
                <SwitchCamera className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-sm text-gray-500 text-center">
              Position the paper count sheet clearly in frame. 
              Works with handwritten or printed sheets.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="relative rounded-lg overflow-hidden">
              <img 
                src={capturedImage} 
                alt="Captured count sheet" 
                className="w-full"
                data-testid="captured-paper-image"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            {!scanResult && !isScanning && (
              <div className="flex gap-2">
                <Button 
                  onClick={retakePhoto} 
                  variant="outline" 
                  className="flex-1"
                  data-testid="retake-paper-photo"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Retake
                </Button>
                <Button 
                  onClick={analyzeImage} 
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  data-testid="read-paper-sheet"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Read Sheet
                </Button>
              </div>
            )}

            {isScanning && (
              <div className="flex items-center justify-center gap-2 py-4">
                <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                <span className="text-gray-600">Reading count sheet...</span>
              </div>
            )}

            {scanResult && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Found {scanResult.totalItems} items</span>
                    {getConfidenceBadge(scanResult.overallConfidence)}
                  </div>
                </div>

                {scanResult.notes && (
                  <p className="text-sm text-gray-500 bg-gray-50 p-2 rounded">
                    {scanResult.notes}
                  </p>
                )}

                <div className="flex gap-2 text-sm">
                  <Button variant="link" size="sm" onClick={selectAll} className="p-0 h-auto">
                    Select All
                  </Button>
                  <span className="text-gray-300">|</span>
                  <Button variant="link" size="sm" onClick={selectNone} className="p-0 h-auto">
                    Select None
                  </Button>
                </div>

                <div className="max-h-60 overflow-y-auto space-y-2 border rounded-lg p-2">
                  {scanResult.items.map((item, index) => (
                    <div 
                      key={index}
                      className={`flex items-center gap-2 p-2 rounded ${
                        selectedItems.has(index) ? 'bg-blue-50' : 'bg-gray-50'
                      }`}
                      data-testid={`scanned-item-${index}`}
                    >
                      <Checkbox
                        checked={selectedItems.has(index)}
                        onCheckedChange={() => toggleItemSelection(index)}
                        data-testid={`select-item-${index}`}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium truncate">{item.name}</span>
                          {item.confidence !== 'high' && getConfidenceBadge(item.confidence)}
                        </div>
                        {item.notes && (
                          <p className="text-xs text-gray-500 truncate">{item.notes}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <Input
                          type="number"
                          value={editedCounts[index] !== undefined ? editedCounts[index] : item.count}
                          onChange={(e) => handleCountEdit(index, e.target.value)}
                          className="w-16 h-8 text-center"
                          min={0}
                          data-testid={`edit-count-${index}`}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <Button 
                    onClick={retakePhoto} 
                    variant="outline" 
                    className="flex-1"
                    data-testid="rescan-paper"
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Rescan
                  </Button>
                  <Button 
                    onClick={handleConfirm}
                    disabled={selectedItems.size === 0}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    data-testid="confirm-paper-counts"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Add {selectedItems.size} Items
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
