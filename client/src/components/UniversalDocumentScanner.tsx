import { useState, useRef, useCallback, useEffect } from 'react';
import Webcam from 'react-webcam';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Camera, X, RotateCcw, Check, Loader2, AlertCircle, 
  ScanLine, SwitchCamera, Sparkles, FileText, CheckCircle,
  Wine, Shield, Grid3X3, Users, Calendar, Package,
  AlertTriangle, CheckSquare, Thermometer, DollarSign, Truck
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useMode } from '@/lib/ModeContext';
import { DOCUMENT_TYPE_CONFIG } from '@shared/schema';

interface ClassificationResult {
  documentType: string;
  confidence: 'high' | 'medium' | 'low';
  title: string;
  extractedData: Record<string, any>;
  rawText: string;
  standId?: string;
  eventDate?: string;
}

interface UniversalDocumentScannerProps {
  onClose: () => void;
  onDocumentSaved?: (doc: any) => void;
  defaultStandId?: string;
  defaultEventDate?: string;
}

const DOCUMENT_TYPE_ICONS: Record<string, React.ReactNode> = {
  bar_control: <Wine className="h-4 w-4" />,
  alcohol_compliance: <Shield className="h-4 w-4" />,
  stand_grid: <Grid3X3 className="h-4 w-4" />,
  worker_grid: <Users className="h-4 w-4" />,
  schedule: <Calendar className="h-4 w-4" />,
  inventory_count: <Package className="h-4 w-4" />,
  incident_report: <AlertTriangle className="h-4 w-4" />,
  closing_checklist: <CheckSquare className="h-4 w-4" />,
  temperature_log: <Thermometer className="h-4 w-4" />,
  cash_count: <DollarSign className="h-4 w-4" />,
  delivery_receipt: <Truck className="h-4 w-4" />,
  other: <FileText className="h-4 w-4" />
};

const CONFIDENCE_COLORS = {
  high: 'bg-green-100 text-green-700 border-green-200',
  medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  low: 'bg-red-100 text-red-700 border-red-200',
};

const DOCUMENT_ROUTING_MAP: Record<string, { destination: string; department: string; description: string }> = {
  bar_control: { destination: 'Bar Manager (Darby)', department: 'Bar', description: 'Liquor inventory and bar control documents' },
  alcohol_compliance: { destination: 'Alcohol Compliance Team', department: 'Compliance', description: 'ABC/TABC compliance documentation' },
  stand_grid: { destination: 'Operations Command', department: 'Operations', description: 'Stand assignment and layout records' },
  worker_grid: { destination: 'HR Admin (KD)', department: 'HR', description: 'Staff scheduling and assignment records' },
  schedule: { destination: 'Culinary Director (Chef Deb)', department: 'Culinary', description: 'Kitchen and cook scheduling' },
  inventory_count: { destination: 'Inventory Control', department: 'Operations', description: 'Pre/Post event count sheets' },
  incident_report: { destination: 'Emergency Command Center', department: 'Operations', description: 'Incident and safety reports' },
  closing_checklist: { destination: 'Stand Supervisor', department: 'Operations', description: 'End-of-event checklists' },
  temperature_log: { destination: 'Health & Safety', department: 'Compliance', description: 'Food safety temperature records' },
  cash_count: { destination: 'Finance Team', department: 'Finance', description: 'Cash handling and reconciliation' },
  delivery_receipt: { destination: 'Warehouse Manager', department: 'Warehouse', description: 'Delivery confirmation records' },
  other: { destination: 'Document Hub', department: 'General', description: 'General documents for review' }
};

const ROUTING_DESTINATIONS = [
  { id: 'ops', label: 'Operations Command', department: 'Operations' },
  { id: 'bar', label: 'Bar Manager (Darby)', department: 'Bar' },
  { id: 'culinary', label: 'Culinary Director (Chef Deb)', department: 'Culinary' },
  { id: 'hr', label: 'HR Admin (KD)', department: 'HR' },
  { id: 'compliance', label: 'Alcohol Compliance', department: 'Compliance' },
  { id: 'finance', label: 'Finance Team', department: 'Finance' },
  { id: 'warehouse', label: 'Warehouse Manager', department: 'Warehouse' },
  { id: 'safety', label: 'Health & Safety', department: 'Compliance' },
  { id: 'command', label: 'Emergency Command Center', department: 'Operations' },
  { id: 'hub', label: 'Document Hub (General)', department: 'General' },
];

export function UniversalDocumentScanner({ 
  onClose, 
  onDocumentSaved,
  defaultStandId,
  defaultEventDate
}: UniversalDocumentScannerProps) {
  const { isSandbox } = useMode();
  const queryClient = useQueryClient();
  const webcamRef = useRef<Webcam>(null);
  
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isClassifying, setIsClassifying] = useState(false);
  const [classificationResult, setClassificationResult] = useState<ClassificationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  
  const [documentType, setDocumentType] = useState<string>('');
  const [title, setTitle] = useState('');
  const [standId, setStandId] = useState(defaultStandId || '');
  const [eventDate, setEventDate] = useState(defaultEventDate || new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
  const [routingStep, setRoutingStep] = useState<'confirm' | 'change' | 'ready'>('confirm');
  const [suggestedRouting, setSuggestedRouting] = useState<{ destination: string; department: string } | null>(null);
  const [selectedRouting, setSelectedRouting] = useState<string>('');

  const { data: stands } = useQuery({
    queryKey: ['/api/stands'],
    queryFn: async () => {
      const res = await fetch('/api/stands');
      return res.json();
    }
  });

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
        setClassificationResult(null);
      }
    }
  }, []);

  const retakePhoto = () => {
    setCapturedImage(null);
    setClassificationResult(null);
    setError(null);
    setDocumentType('');
    setTitle('');
    setNotes('');
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

  const classifyDocument = async () => {
    if (!capturedImage) return;

    setIsClassifying(true);
    setError(null);

    try {
      const blob = base64ToBlob(capturedImage);
      const formData = new FormData();
      formData.append('image', blob, 'document.jpg');

      const response = await fetch('/api/ai-scanner/classify', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to classify document');
      }

      const data = await response.json();
      if (data.success && data.result) {
        setClassificationResult(data.result);
        setDocumentType(data.result.documentType);
        setTitle(data.result.title);
        if (data.result.standId) setStandId(data.result.standId);
        if (data.result.eventDate) setEventDate(data.result.eventDate);
        
        const routing = DOCUMENT_ROUTING_MAP[data.result.documentType] || DOCUMENT_ROUTING_MAP['other'];
        setSuggestedRouting({ destination: routing.destination, department: routing.department });
        setSelectedRouting(routing.destination);
        setRoutingStep('confirm');
      } else {
        throw new Error('Invalid response from AI scanner');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to classify document');
    } finally {
      setIsClassifying(false);
    }
  };

  const saveDocument = async () => {
    if (!capturedImage || !documentType || !title) {
      setError('Please provide document type and title');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const docData = {
        title,
        documentType,
        detectedType: classificationResult?.documentType,
        confidence: classificationResult?.confidence,
        standId: standId || null,
        eventDate: eventDate || null,
        imageUrl: capturedImage,
        extractedData: classificationResult?.extractedData || {},
        rawOcrText: classificationResult?.rawText || '',
        notes,
        isSandbox,
        status: 'pending'
      };

      const response = await apiRequest('POST', '/api/scanned-documents', docData);
      const savedDoc = await response.json();

      const categoryMapping: Record<string, string> = {
        bar_control: 'violation',
        alcohol_compliance: 'violation',
        inventory_count: 'count_report',
        incident_report: 'incident',
        closing_checklist: 'closing',
        temperature_log: 'violation',
        cash_count: 'count_report',
        stand_grid: 'other',
        worker_grid: 'other',
        schedule: 'other',
        delivery_receipt: 'other',
        other: 'other'
      };

      await apiRequest('POST', '/api/manager-documents', {
        title,
        category: categoryMapping[documentType] || 'other',
        subcategory: documentType,
        standId: standId || null,
        eventDate: eventDate || null,
        jsonData: {
          scannedDocumentId: savedDoc.id,
          extractedData: classificationResult?.extractedData,
          confidence: classificationResult?.confidence,
          isSandbox
        },
        notes
      });

      queryClient.invalidateQueries({ queryKey: ['/api/scanned-documents'] });
      queryClient.invalidateQueries({ queryKey: ['/api/manager-documents'] });

      if (onDocumentSaved) {
        onDocumentSaved(savedDoc);
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save document');
    } finally {
      setIsSaving(false);
    }
  };

  const getDocumentTypeLabel = (type: string) => {
    const config = DOCUMENT_TYPE_CONFIG[type as keyof typeof DOCUMENT_TYPE_CONFIG];
    return config?.name || type;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" data-testid="universal-document-scanner">
      <Card className="w-full max-w-2xl max-h-[95vh] overflow-y-auto bg-slate-900 border-cyan-500/30">
        <CardHeader className="pb-3 border-b border-slate-700 sticky top-0 bg-slate-900 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30">
                <ScanLine className="h-5 w-5 text-cyan-400" />
              </div>
              <div>
                <CardTitle className="text-lg text-white">Universal Document Scanner</CardTitle>
                <p className="text-xs text-slate-400">
                  {isSandbox ? '🧪 Sandbox Mode' : 'Scan any document - AI auto-classifies'}
                </p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onClose}
              className="text-slate-400 hover:text-white"
              data-testid="close-scanner"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-4 space-y-4">
          {!capturedImage ? (
            <div className="space-y-4">
              <div className="relative rounded-xl overflow-hidden bg-black aspect-[4/3]">
                <Webcam
                  ref={webcamRef}
                  audio={false}
                  screenshotFormat="image/jpeg"
                  videoConstraints={videoConstraints}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 border-2 border-cyan-500/50 rounded-xl pointer-events-none">
                  <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-cyan-400"></div>
                  <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-cyan-400"></div>
                  <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-cyan-400"></div>
                  <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-cyan-400"></div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={toggleCamera}
                  variant="outline"
                  className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-800"
                  data-testid="button-toggle-camera"
                >
                  <SwitchCamera className="h-4 w-4 mr-2" />
                  Switch Camera
                </Button>
                <Button
                  onClick={captureImage}
                  className="flex-[2] bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-medium"
                  data-testid="button-capture"
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Capture Document
                </Button>
              </div>

              <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                <p className="text-xs text-slate-400 text-center">
                  Position your document within the frame. The AI will automatically detect the document type.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative rounded-xl overflow-hidden bg-black">
                <img 
                  src={capturedImage} 
                  alt="Captured document" 
                  className="w-full h-auto max-h-64 object-contain"
                />
                {classificationResult && (
                  <div className="absolute top-2 right-2">
                    <Badge className={`${CONFIDENCE_COLORS[classificationResult.confidence]} border`}>
                      {classificationResult.confidence} confidence
                    </Badge>
                  </div>
                )}
              </div>

              {!classificationResult && !isClassifying && (
                <div className="flex gap-3">
                  <Button
                    onClick={retakePhoto}
                    variant="outline"
                    className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-800"
                    data-testid="button-retake"
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Retake
                  </Button>
                  <Button
                    onClick={classifyDocument}
                    className="flex-[2] bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium"
                    data-testid="button-classify"
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Auto-Classify with AI
                  </Button>
                </div>
              )}

              {isClassifying && (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-cyan-400 mx-auto mb-3" />
                    <p className="text-slate-300">Analyzing document...</p>
                    <p className="text-xs text-slate-500 mt-1">AI is detecting document type and extracting data</p>
                  </div>
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              {classificationResult && (
                <div className="space-y-4">
                  <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-lg p-4 border border-cyan-500/30">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 rounded-lg bg-cyan-500/20">
                        {DOCUMENT_TYPE_ICONS[classificationResult.documentType]}
                      </div>
                      <div>
                        <p className="text-sm text-slate-400">Detected Document Type</p>
                        <p className="text-white font-medium">{getDocumentTypeLabel(classificationResult.documentType)}</p>
                      </div>
                    </div>
                    {classificationResult.extractedData && Object.keys(classificationResult.extractedData).length > 0 && (
                      <div className="mt-3 pt-3 border-t border-slate-700">
                        <p className="text-xs text-slate-400 mb-2">Extracted Data:</p>
                        <div className="grid grid-cols-2 gap-2">
                          {Object.entries(classificationResult.extractedData).slice(0, 6).map(([key, value]) => (
                            <div key={key} className="text-xs">
                              <span className="text-slate-500">{key}:</span>
                              <span className="text-slate-300 ml-1">{String(value)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {routingStep === 'confirm' && suggestedRouting && (
                    <div className="bg-gradient-to-r from-emerald-500/10 to-green-500/10 rounded-lg p-4 border border-emerald-500/30">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 rounded-lg bg-emerald-500/20">
                          <Truck className="h-5 w-5 text-emerald-400" />
                        </div>
                        <div>
                          <p className="text-sm text-slate-400">Suggested Routing</p>
                          <p className="text-white font-medium">{suggestedRouting.destination}</p>
                        </div>
                      </div>
                      <p className="text-sm text-slate-300 mb-4">
                        This document is scheduled to be delivered to <span className="text-emerald-400 font-medium">{suggestedRouting.destination}</span>. Is this correct?
                      </p>
                      <div className="flex gap-3">
                        <Button
                          onClick={() => setRoutingStep('ready')}
                          className="flex-1 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white"
                          data-testid="button-confirm-routing"
                        >
                          <Check className="h-4 w-4 mr-2" />
                          Yes, Route Here
                        </Button>
                        <Button
                          onClick={() => setRoutingStep('change')}
                          variant="outline"
                          className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-800"
                          data-testid="button-change-routing"
                        >
                          Send Elsewhere
                        </Button>
                      </div>
                    </div>
                  )}

                  {routingStep === 'change' && (
                    <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-lg p-4 border border-purple-500/30">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 rounded-lg bg-purple-500/20">
                          <Users className="h-5 w-5 text-purple-400" />
                        </div>
                        <div>
                          <p className="text-sm text-slate-400">Select Destination</p>
                          <p className="text-white font-medium">Where would you like to send this?</p>
                        </div>
                      </div>
                      <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
                        {ROUTING_DESTINATIONS.map((dest) => (
                          <button
                            key={dest.id}
                            onClick={() => {
                              setSelectedRouting(dest.label);
                              setSuggestedRouting({ destination: dest.label, department: dest.department });
                            }}
                            className={`w-full text-left p-3 rounded-lg border transition-all ${
                              selectedRouting === dest.label
                                ? 'bg-purple-500/20 border-purple-500/50 text-white'
                                : 'bg-slate-800/50 border-slate-700 text-slate-300 hover:border-slate-600'
                            }`}
                            data-testid={`routing-option-${dest.id}`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-medium">{dest.label}</span>
                              <span className="text-xs text-slate-500">{dest.department}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                      <div className="flex gap-3">
                        <Button
                          onClick={() => setRoutingStep('confirm')}
                          variant="outline"
                          className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-800"
                        >
                          Back
                        </Button>
                        <Button
                          onClick={() => setRoutingStep('ready')}
                          className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                          data-testid="button-confirm-new-routing"
                        >
                          <Check className="h-4 w-4 mr-2" />
                          Send to {selectedRouting.split(' ')[0]}
                        </Button>
                      </div>
                    </div>
                  )}

                  {routingStep === 'ready' && (
                  <div className="space-y-3">
                    <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700 mb-3">
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-emerald-400" />
                        <span className="text-slate-300">Routing to: </span>
                        <span className="text-emerald-400 font-medium">{selectedRouting}</span>
                      </div>
                    </div>
                    <div>
                      <Label className="text-slate-300">Document Type</Label>
                      <Select value={documentType} onValueChange={setDocumentType}>
                        <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                          <SelectValue placeholder="Select document type" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-600">
                          {Object.entries(DOCUMENT_TYPE_CONFIG).map(([key, config]) => (
                            <SelectItem key={key} value={key} className="text-white hover:bg-slate-700">
                              <div className="flex items-center gap-2">
                                {DOCUMENT_TYPE_ICONS[key]}
                                {config.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-slate-300">Title</Label>
                      <Input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Document title"
                        className="bg-slate-800 border-slate-600 text-white"
                        data-testid="input-title"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-slate-300">Stand (optional)</Label>
                        <Select value={standId} onValueChange={setStandId}>
                          <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                            <SelectValue placeholder="Select stand" />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-800 border-slate-600 max-h-48">
                            <SelectItem value="" className="text-slate-400">No stand</SelectItem>
                            {(stands as any[] | undefined)?.map((stand: any) => (
                              <SelectItem key={stand.id} value={stand.id} className="text-white hover:bg-slate-700">
                                {stand.id} - {stand.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-slate-300">Event Date</Label>
                        <Input
                          type="date"
                          value={eventDate}
                          onChange={(e) => setEventDate(e.target.value)}
                          className="bg-slate-800 border-slate-600 text-white"
                          data-testid="input-event-date"
                        />
                      </div>
                    </div>

                    <div>
                      <Label className="text-slate-300">Notes (optional)</Label>
                      <Textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Additional notes..."
                        className="bg-slate-800 border-slate-600 text-white resize-none"
                        rows={2}
                        data-testid="input-notes"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button
                      onClick={retakePhoto}
                      variant="outline"
                      className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-800"
                      disabled={isSaving}
                      data-testid="button-retake-2"
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Retake
                    </Button>
                    <Button
                      onClick={saveDocument}
                      className="flex-[2] bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-medium"
                      disabled={isSaving || !documentType || !title}
                      data-testid="button-save-document"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Save & Route Document
                        </>
                      )}
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
