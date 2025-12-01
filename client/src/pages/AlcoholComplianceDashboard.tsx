import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { 
  AlertTriangle, 
  ChevronLeft,
  Clock,
  MapPin,
  User,
  Camera,
  X,
  Upload,
  CheckCircle2,
  XCircle,
  Shield,
  Wine,
  Image as ImageIcon,
  FileText,
  AlertCircle,
  Eye,
  Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useStore } from '@/lib/mockData';
import type { Stand } from '@shared/schema';

interface AlcoholViolation {
  id: string;
  reporterId: string;
  standId: string | null;
  section: string | null;
  vendorName: string | null;
  vendorBadgeNumber: string | null;
  violationType: string;
  severity: string;
  description: string;
  mediaUrls: string[] | null;
  status: string;
  reviewedBy: string | null;
  reviewedAt: string | null;
  reviewNotes: string | null;
  resolvedBy: string | null;
  resolvedAt: string | null;
  resolutionNotes: string | null;
  actionTaken: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

const VIOLATION_TYPES = [
  { id: 'UnderageSale', label: 'Underage Sale', icon: AlertCircle, color: 'bg-rose-500' },
  { id: 'OverService', label: 'Over-Service', icon: Wine, color: 'bg-amber-500' },
  { id: 'NoIDCheck', label: 'No ID Check', icon: Eye, color: 'bg-cyan-500' },
  { id: 'ExpiredLicense', label: 'Expired License', icon: FileText, color: 'bg-violet-500' },
  { id: 'OpenContainer', label: 'Open Container', icon: Wine, color: 'bg-teal-500' },
  { id: 'UnauthorizedSale', label: 'Unauthorized Sale', icon: Shield, color: 'bg-rose-600' },
  { id: 'PricingViolation', label: 'Pricing Violation', icon: AlertTriangle, color: 'bg-amber-600' },
  { id: 'Other', label: 'Other', icon: AlertCircle, color: 'bg-slate-500' }
];

const SEVERITY_OPTIONS = [
  { value: 'Warning', label: 'Warning', color: 'bg-slate-500' },
  { value: 'Minor', label: 'Minor', color: 'bg-amber-500' },
  { value: 'Major', label: 'Major', color: 'bg-rose-500' },
  { value: 'Critical', label: 'Critical', color: 'bg-rose-700 animate-pulse' }
];

const STATUS_COLORS: Record<string, string> = {
  'Reported': 'bg-amber-500 text-white',
  'UnderReview': 'bg-cyan-500 text-white',
  'Confirmed': 'bg-rose-500 text-white',
  'Dismissed': 'bg-slate-500 text-white',
  'Resolved': 'bg-emerald-500 text-white'
};

function ViolationCard({ 
  violation, 
  stands,
  onView 
}: { 
  violation: AlcoholViolation;
  stands: Stand[];
  onView: (v: AlcoholViolation) => void;
}) {
  const stand = stands.find(s => s.id === violation.standId);
  const typeConfig = VIOLATION_TYPES.find(t => t.id === violation.violationType) || VIOLATION_TYPES[7];
  const TypeIcon = typeConfig.icon;
  const severityConfig = SEVERITY_OPTIONS.find(s => s.value === violation.severity);
  
  const timeAgo = (date: string | null) => {
    if (!date) return '';
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };
  
  return (
    <Card 
      className="bg-slate-800/50 border-slate-700 cursor-pointer hover:bg-slate-800/70 transition-colors"
      onClick={() => onView(violation)}
      data-testid={`violation-card-${violation.id}`}
    >
      <CardContent className="p-3">
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-lg ${typeConfig.color}`}>
            <TypeIcon className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-1">
              <h4 className="font-semibold text-white truncate">{typeConfig.label}</h4>
              <Badge className={STATUS_COLORS[violation.status || 'Reported']}>
                {violation.status}
              </Badge>
            </div>
            
            <div className="flex items-center gap-3 text-xs text-slate-400 mb-2">
              {stand && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {stand.name}
                </span>
              )}
              {violation.section && (
                <span>{violation.section}</span>
              )}
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {timeAgo(violation.createdAt)}
              </span>
            </div>
            
            <p className="text-sm text-slate-300 line-clamp-2 mb-2">{violation.description}</p>
            
            <div className="flex items-center gap-2">
              <Badge className={severityConfig?.color || 'bg-slate-500'}>
                {violation.severity}
              </Badge>
              {violation.vendorName && (
                <span className="text-xs text-slate-400">
                  <User className="w-3 h-3 inline mr-1" />
                  {violation.vendorName}
                </span>
              )}
              {violation.mediaUrls && violation.mediaUrls.length > 0 && (
                <span className="text-xs text-cyan-400 flex items-center gap-1">
                  <ImageIcon className="w-3 h-3" />
                  {violation.mediaUrls.length} photo(s)
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AlcoholComplianceDashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { currentUser } = useStore();
  
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [selectedViolation, setSelectedViolation] = useState<AlcoholViolation | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  
  const [violationType, setViolationType] = useState('');
  const [severity, setSeverity] = useState('Minor');
  const [description, setDescription] = useState('');
  const [standId, setStandId] = useState('');
  const [section, setSection] = useState('');
  const [vendorName, setVendorName] = useState('');
  const [vendorBadge, setVendorBadge] = useState('');
  const [capturedImages, setCapturedImages] = useState<string[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  
  const { data: violations = [], isLoading: loadingViolations } = useQuery<AlcoholViolation[]>({
    queryKey: ['/api/alcohol-violations'],
    refetchInterval: 10000
  });
  
  const { data: stands = [] } = useQuery<Stand[]>({
    queryKey: ['/api/stands']
  });
  
  const createViolation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/alcohol-violations', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/alcohol-violations'] });
      toast({ title: 'Violation reported', description: 'Your report has been submitted for review.' });
      resetForm();
      setShowReportDialog(false);
    },
    onError: (error: any) => {
      toast({ 
        title: 'Error', 
        description: error.message || 'Failed to submit violation report',
        variant: 'destructive'
      });
    }
  });
  
  const resetForm = () => {
    setViolationType('');
    setSeverity('Minor');
    setDescription('');
    setStandId('');
    setSection('');
    setVendorName('');
    setVendorBadge('');
    setCapturedImages([]);
  };
  
  const handleCameraCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setCapturedImages(prev => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
  };
  
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setCapturedImages(prev => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
  };
  
  const removeImage = (index: number) => {
    setCapturedImages(prev => prev.filter((_, i) => i !== index));
  };
  
  const handleSubmitViolation = () => {
    if (!violationType || !description) {
      toast({ 
        title: 'Missing information', 
        description: 'Please select a violation type and add a description',
        variant: 'destructive'
      });
      return;
    }
    
    createViolation.mutate({
      reporterId: currentUser?.id,
      violationType,
      severity,
      description,
      standId: standId || null,
      section: section || null,
      vendorName: vendorName || null,
      vendorBadgeNumber: vendorBadge || null,
      mediaUrls: capturedImages
    });
  };
  
  const handleViewViolation = (violation: AlcoholViolation) => {
    setSelectedViolation(violation);
    setShowViewDialog(true);
  };
  
  const myViolations = violations.filter(v => v.reporterId === currentUser?.id);
  const pendingViolations = violations.filter(v => v.status === 'Reported' || v.status === 'UnderReview');
  const resolvedViolations = violations.filter(v => v.status === 'Resolved' || v.status === 'Dismissed');
  
  const getFilteredViolations = () => {
    switch (activeTab) {
      case 'my': return myViolations;
      case 'pending': return pendingViolations;
      case 'resolved': return resolvedViolations;
      default: return violations;
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-cyan-900 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
        <div className="absolute top-40 right-20 w-1 h-1 bg-white rounded-full animate-twinkle"></div>
        <div className="absolute bottom-40 left-1/4 w-1.5 h-1.5 bg-teal-300 rounded-full animate-pulse delay-300"></div>
        <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-cyan-300 rounded-full animate-twinkle delay-700"></div>
        
        <div className="absolute bottom-10 right-10 opacity-10">
          <Wine className="w-64 h-64 text-cyan-400" />
        </div>
      </div>
      
      <div className="relative z-10 p-4 pb-24">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon"
              className="text-white hover:bg-white/10"
              onClick={() => setLocation('/')}
              data-testid="button-back"
            >
              <ChevronLeft className="w-6 h-6" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <Wine className="w-7 h-7 text-cyan-400" />
                Alcohol Compliance
              </h1>
              <p className="text-sm text-slate-400">Vendor monitoring & violation reporting</p>
            </div>
          </div>
          
        </div>
        
        <div className="grid grid-cols-3 gap-3 mb-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-3 text-center">
              <div className="text-2xl font-bold text-white">{violations.length}</div>
              <div className="text-xs text-slate-400">Total Reports</div>
            </CardContent>
          </Card>
          <Card className="bg-amber-500/20 border-amber-500/30">
            <CardContent className="p-3 text-center">
              <div className="text-2xl font-bold text-amber-400">{pendingViolations.length}</div>
              <div className="text-xs text-amber-300">Pending</div>
            </CardContent>
          </Card>
          <Card className="bg-emerald-500/20 border-emerald-500/30">
            <CardContent className="p-3 text-center">
              <div className="text-2xl font-bold text-emerald-400">{resolvedViolations.length}</div>
              <div className="text-xs text-emerald-300">Resolved</div>
            </CardContent>
          </Card>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-4">
          <TabsList className="grid w-full grid-cols-4 bg-slate-800/50">
            <TabsTrigger value="all" data-testid="tab-all">All</TabsTrigger>
            <TabsTrigger value="my" data-testid="tab-my">My Reports</TabsTrigger>
            <TabsTrigger value="pending" data-testid="tab-pending">Pending</TabsTrigger>
            <TabsTrigger value="resolved" data-testid="tab-resolved">Resolved</TabsTrigger>
          </TabsList>
        </Tabs>
        
        <ScrollArea className="h-[calc(100vh-380px)]">
          <div className="space-y-3">
            {loadingViolations ? (
              <div className="text-center py-10 text-slate-400">Loading violations...</div>
            ) : getFilteredViolations().length === 0 ? (
              <div className="text-center py-10">
                <Wine className="w-16 h-16 mx-auto text-slate-600 mb-4" />
                <p className="text-slate-400">No violations to display</p>
                <p className="text-sm text-slate-500 mt-1">Use the report button to log a new violation</p>
              </div>
            ) : (
              getFilteredViolations().map(violation => (
                <ViolationCard 
                  key={violation.id}
                  violation={violation}
                  stands={stands}
                  onView={handleViewViolation}
                />
              ))
            )}
          </div>
        </ScrollArea>
        
        <div className="fixed bottom-6 left-0 right-0 flex justify-center z-20">
          <Button
            size="lg"
            className="bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white shadow-lg shadow-rose-500/30 gap-2 px-8"
            onClick={() => setShowReportDialog(true)}
            data-testid="button-report-violation"
          >
            <AlertTriangle className="w-5 h-5" />
            Report Violation
          </Button>
        </div>
      </div>
      
      <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <DialogContent className="bg-slate-900 border-slate-700 max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-400" />
              Report Violation
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label className="text-slate-300">Violation Type *</Label>
              <Select value={violationType} onValueChange={setViolationType}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white" data-testid="select-violation-type">
                  <SelectValue placeholder="Select type..." />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {VIOLATION_TYPES.map(type => (
                    <SelectItem key={type.id} value={type.id} className="text-white">
                      <div className="flex items-center gap-2">
                        <type.icon className="w-4 h-4" />
                        {type.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label className="text-slate-300">Severity</Label>
              <Select value={severity} onValueChange={setSeverity}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white" data-testid="select-severity">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {SEVERITY_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value} className="text-white">
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label className="text-slate-300">Description *</Label>
              <Textarea 
                placeholder="Describe what you observed..."
                className="bg-slate-800 border-slate-700 text-white min-h-[100px]"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                data-testid="input-description"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-slate-300">Location/Stand</Label>
                <Select value={standId} onValueChange={setStandId}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white" data-testid="select-stand">
                    <SelectValue placeholder="Select stand..." />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700 max-h-48">
                    {stands.map(stand => (
                      <SelectItem key={stand.id} value={stand.id} className="text-white">
                        {stand.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-slate-300">Section</Label>
                <Input 
                  placeholder="e.g. Section 127"
                  className="bg-slate-800 border-slate-700 text-white"
                  value={section}
                  onChange={(e) => setSection(e.target.value)}
                  data-testid="input-section"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-slate-300">Vendor Name</Label>
                <Input 
                  placeholder="Name if known"
                  className="bg-slate-800 border-slate-700 text-white"
                  value={vendorName}
                  onChange={(e) => setVendorName(e.target.value)}
                  data-testid="input-vendor-name"
                />
              </div>
              <div>
                <Label className="text-slate-300">Badge #</Label>
                <Input 
                  placeholder="Badge number"
                  className="bg-slate-800 border-slate-700 text-white"
                  value={vendorBadge}
                  onChange={(e) => setVendorBadge(e.target.value)}
                  data-testid="input-vendor-badge"
                />
              </div>
            </div>
            
            <div>
              <Label className="text-slate-300 mb-2 block">Evidence (Photos/Video)</Label>
              <div className="flex gap-2 mb-3">
                <Button 
                  type="button"
                  variant="outline"
                  className="flex-1 bg-slate-800 border-slate-700 text-white hover:bg-slate-700"
                  onClick={() => cameraInputRef.current?.click()}
                  data-testid="button-take-photo"
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Take Photo
                </Button>
                <Button 
                  type="button"
                  variant="outline"
                  className="flex-1 bg-slate-800 border-slate-700 text-white hover:bg-slate-700"
                  onClick={() => fileInputRef.current?.click()}
                  data-testid="button-upload"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload
                </Button>
              </div>
              
              <input 
                ref={cameraInputRef}
                type="file"
                accept="image/*,video/*"
                capture="environment"
                className="hidden"
                onChange={handleCameraCapture}
              />
              <input 
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                multiple
                className="hidden"
                onChange={handleFileUpload}
              />
              
              {capturedImages.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {capturedImages.map((img, idx) => (
                    <div key={idx} className="relative aspect-square">
                      <img 
                        src={img} 
                        alt={`Evidence ${idx + 1}`}
                        className="w-full h-full object-cover rounded-lg"
                      />
                      <Button
                        size="icon"
                        variant="destructive"
                        className="absolute top-1 right-1 w-6 h-6"
                        onClick={() => removeImage(idx)}
                        data-testid={`button-remove-image-${idx}`}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowReportDialog(false)}
              className="border-slate-700 text-slate-300"
              data-testid="button-cancel-report"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmitViolation}
              className="bg-rose-500 hover:bg-rose-600"
              disabled={createViolation.isPending}
              data-testid="button-submit-violation"
            >
              {createViolation.isPending ? 'Submitting...' : 'Submit Report'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="bg-slate-900 border-slate-700 max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-cyan-400" />
              Violation Details
            </DialogTitle>
          </DialogHeader>
          
          {selectedViolation && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Badge className={STATUS_COLORS[selectedViolation.status || 'Reported']}>
                  {selectedViolation.status}
                </Badge>
                <Badge className={SEVERITY_OPTIONS.find(s => s.value === selectedViolation.severity)?.color || 'bg-slate-500'}>
                  {selectedViolation.severity}
                </Badge>
              </div>
              
              <div>
                <Label className="text-slate-400 text-xs">Violation Type</Label>
                <p className="text-white font-medium">
                  {VIOLATION_TYPES.find(t => t.id === selectedViolation.violationType)?.label}
                </p>
              </div>
              
              <div>
                <Label className="text-slate-400 text-xs">Description</Label>
                <p className="text-slate-300">{selectedViolation.description}</p>
              </div>
              
              {selectedViolation.vendorName && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-slate-400 text-xs">Vendor Name</Label>
                    <p className="text-white">{selectedViolation.vendorName}</p>
                  </div>
                  {selectedViolation.vendorBadgeNumber && (
                    <div>
                      <Label className="text-slate-400 text-xs">Badge #</Label>
                      <p className="text-white">{selectedViolation.vendorBadgeNumber}</p>
                    </div>
                  )}
                </div>
              )}
              
              {selectedViolation.section && (
                <div>
                  <Label className="text-slate-400 text-xs">Location</Label>
                  <p className="text-white">{selectedViolation.section}</p>
                </div>
              )}
              
              {selectedViolation.mediaUrls && selectedViolation.mediaUrls.length > 0 && (
                <div>
                  <Label className="text-slate-400 text-xs mb-2 block">Evidence</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedViolation.mediaUrls.map((url, idx) => (
                      <img 
                        key={idx}
                        src={url} 
                        alt={`Evidence ${idx + 1}`}
                        className="w-full aspect-square object-cover rounded-lg"
                      />
                    ))}
                  </div>
                </div>
              )}
              
              {selectedViolation.reviewNotes && (
                <div>
                  <Label className="text-slate-400 text-xs">Review Notes</Label>
                  <p className="text-slate-300">{selectedViolation.reviewNotes}</p>
                </div>
              )}
              
              {selectedViolation.resolutionNotes && (
                <div>
                  <Label className="text-slate-400 text-xs">Resolution</Label>
                  <p className="text-slate-300">{selectedViolation.resolutionNotes}</p>
                  {selectedViolation.actionTaken && (
                    <Badge className="mt-2 bg-emerald-500/20 text-emerald-300">
                      Action: {selectedViolation.actionTaken}
                    </Badge>
                  )}
                </div>
              )}
              
              <div className="text-xs text-slate-500 pt-2 border-t border-slate-700">
                Reported: {selectedViolation.createdAt ? new Date(selectedViolation.createdAt).toLocaleString() : 'Unknown'}
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowViewDialog(false)}
              className="border-slate-700 text-slate-300"
              data-testid="button-close-details"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
