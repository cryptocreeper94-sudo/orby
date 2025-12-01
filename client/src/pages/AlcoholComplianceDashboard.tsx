import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertTriangle, 
  Clock,
  MapPin,
  User,
  Camera,
  X,
  Upload,
  CheckCircle2,
  Shield,
  Wine,
  Image as ImageIcon,
  FileText,
  AlertCircle,
  Eye,
  LogOut,
  Plus,
  Filter
} from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import { 
  AnimatedBackground, 
  GlassCard, 
  GlassCardHeader, 
  GlassCardContent,
  StatCard,
  GlowButton,
  StatusBadge,
  SectionHeader,
  EmptyState,
  PageHeader,
  AnimatedList
} from '@/components/ui/premium';
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
  { id: 'UnderageSale', label: 'Underage Sale', icon: AlertCircle, color: 'from-rose-500 to-rose-600' },
  { id: 'OverService', label: 'Over-Service', icon: Wine, color: 'from-amber-500 to-amber-600' },
  { id: 'NoIDCheck', label: 'No ID Check', icon: Eye, color: 'from-cyan-500 to-cyan-600' },
  { id: 'ExpiredLicense', label: 'Expired License', icon: FileText, color: 'from-violet-500 to-violet-600' },
  { id: 'OpenContainer', label: 'Open Container', icon: Wine, color: 'from-teal-500 to-teal-600' },
  { id: 'UnauthorizedSale', label: 'Unauthorized Sale', icon: Shield, color: 'from-rose-600 to-rose-700' },
  { id: 'PricingViolation', label: 'Pricing Violation', icon: AlertTriangle, color: 'from-amber-600 to-amber-700' },
  { id: 'Other', label: 'Other', icon: AlertCircle, color: 'from-slate-500 to-slate-600' }
];

const SEVERITY_OPTIONS = [
  { value: 'Warning', label: 'Warning', color: 'slate' },
  { value: 'Minor', label: 'Minor', color: 'amber' },
  { value: 'Major', label: 'Major', color: 'red' },
  { value: 'Critical', label: 'Critical', color: 'red' }
];

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

  const isResolved = violation.status === 'Resolved' || violation.status === 'Dismissed';
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01, x: 4 }}
      onClick={() => onView(violation)}
      className={`relative rounded-2xl border overflow-hidden cursor-pointer transition-all duration-300 ${
        isResolved 
          ? 'border-slate-700/50 bg-slate-800/30' 
          : 'border-white/10 bg-gradient-to-br from-slate-800/80 to-slate-900/80 shadow-lg hover:shadow-xl'
      }`}
      data-testid={`violation-card-${violation.id}`}
    >
      <div className={`absolute top-0 left-0 w-1 h-full bg-gradient-to-b ${typeConfig.color}`} />
      
      <div className="p-4 md:p-5">
        <div className="flex items-start gap-4">
          <motion.div 
            className={`p-3 rounded-xl bg-gradient-to-br ${typeConfig.color} shadow-lg`}
            whileHover={{ rotate: [0, -5, 5, 0] }}
          >
            <TypeIcon className="w-5 h-5 text-white" />
          </motion.div>
          
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <h4 className="font-bold text-white">{typeConfig.label}</h4>
              <StatusBadge status={violation.status || 'Reported'} pulse={!isResolved} />
            </div>
            
            <div className="flex flex-wrap items-center gap-3 text-sm text-slate-400 mb-3">
              {stand && (
                <span className="flex items-center gap-1.5 bg-slate-800/50 px-2 py-1 rounded-lg">
                  <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                  {stand.name}
                </span>
              )}
              {violation.section && (
                <span className="text-slate-500">{violation.section}</span>
              )}
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                {timeAgo(violation.createdAt)}
              </span>
            </div>
            
            <p className="text-sm text-slate-300 line-clamp-2 mb-3">{violation.description}</p>
            
            <div className="flex flex-wrap items-center gap-2">
              <Badge className={`bg-${severityConfig?.color || 'slate'}-500/20 text-${severityConfig?.color || 'slate'}-400 border-${severityConfig?.color || 'slate'}-500/30`}>
                {violation.severity}
              </Badge>
              {violation.vendorName && (
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <User className="w-3 h-3" />
                  {violation.vendorName}
                </span>
              )}
              {violation.mediaUrls && violation.mediaUrls.length > 0 && (
                <span className="text-xs text-cyan-400 flex items-center gap-1 bg-cyan-500/10 px-2 py-0.5 rounded-full">
                  <ImageIcon className="w-3 h-3" />
                  {violation.mediaUrls.length} photo(s)
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function AlcoholComplianceDashboard() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { currentUser, logout } = useStore();
  
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

  const handleLogout = () => {
    logout();
    navigate('/');
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
    <AnimatedBackground>
      <PageHeader 
        title="Alcohol Compliance"
        subtitle="Vendor monitoring & violation reporting"
        icon={<Wine className="w-5 h-5" />}
        backAction={() => navigate('/')}
        actions={
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleLogout}
            className="text-slate-400 hover:text-white"
          >
            <LogOut className="w-5 h-5" />
          </Button>
        }
      />

      <main className="p-4 md:p-6 lg:p-8 space-y-6 pb-32 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <StatCard 
                icon={<FileText className="w-5 h-5" />}
                label="Total Reports"
                value={violations.length}
                color="cyan"
              />
              <StatCard 
                icon={<Clock className="w-5 h-5" />}
                label="Pending"
                value={pendingViolations.length}
                color={pendingViolations.length > 0 ? "amber" : "green"}
              />
              <StatCard 
                icon={<CheckCircle2 className="w-5 h-5" />}
                label="Resolved"
                value={resolvedViolations.length}
                color="green"
              />
            </div>

            <GlassCard gradient>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="w-full bg-slate-800/50 rounded-t-2xl rounded-b-none border-b border-white/5 p-1 grid grid-cols-4">
                  <TabsTrigger 
                    value="all" 
                    className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400 rounded-xl text-xs md:text-sm"
                    data-testid="tab-all"
                  >
                    All
                  </TabsTrigger>
                  <TabsTrigger 
                    value="my" 
                    className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400 rounded-xl text-xs md:text-sm"
                    data-testid="tab-my"
                  >
                    My Reports
                  </TabsTrigger>
                  <TabsTrigger 
                    value="pending" 
                    className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400 rounded-xl text-xs md:text-sm"
                    data-testid="tab-pending"
                  >
                    Pending
                  </TabsTrigger>
                  <TabsTrigger 
                    value="resolved" 
                    className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400 rounded-xl text-xs md:text-sm"
                    data-testid="tab-resolved"
                  >
                    Resolved
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value={activeTab} className="p-4 md:p-5 m-0">
                  <ScrollArea className="h-[calc(100vh-450px)] md:h-[calc(100vh-400px)]">
                    <AnimatePresence mode="popLayout">
                      {loadingViolations ? (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="text-center py-12"
                        >
                          <Wine className="w-10 h-10 mx-auto mb-3 text-cyan-400 animate-pulse" />
                          <p className="text-slate-400">Loading violations...</p>
                        </motion.div>
                      ) : getFilteredViolations().length === 0 ? (
                        <EmptyState 
                          icon={<Wine className="w-12 h-12" />}
                          title="No Violations"
                          description="Use the report button to log a new violation"
                        />
                      ) : (
                        <div className="space-y-4">
                          {getFilteredViolations().map(violation => (
                            <ViolationCard 
                              key={violation.id}
                              violation={violation}
                              stands={stands}
                              onView={handleViewViolation}
                            />
                          ))}
                        </div>
                      )}
                    </AnimatePresence>
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            </GlassCard>
          </div>

          <div className="space-y-6 hidden lg:block">
            <SectionHeader 
              title="Quick Actions" 
              icon={<Plus className="w-5 h-5" />}
            />
            
            <GlowButton 
              variant="red"
              size="lg"
              onClick={() => setShowReportDialog(true)}
              className="w-full"
            >
              <AlertTriangle className="w-5 h-5" />
              Report Violation
            </GlowButton>

            <GlassCard gradient>
              <GlassCardHeader>
                <h3 className="text-sm font-semibold text-slate-300">Violation Types</h3>
              </GlassCardHeader>
              <GlassCardContent className="space-y-3">
                {VIOLATION_TYPES.slice(0, 5).map(type => (
                  <div key={type.id} className="flex items-center gap-3 text-sm">
                    <div className={`p-1.5 rounded-lg bg-gradient-to-br ${type.color}`}>
                      <type.icon className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-slate-300">{type.label}</span>
                  </div>
                ))}
              </GlassCardContent>
            </GlassCard>
          </div>
        </div>
        
        <motion.div 
          className="fixed bottom-6 left-0 right-0 flex justify-center z-20 lg:hidden"
          initial={{ y: 100 }}
          animate={{ y: 0 }}
        >
          <GlowButton
            size="lg"
            variant="red"
            onClick={() => setShowReportDialog(true)}
            className="shadow-2xl"
          >
            <AlertTriangle className="w-5 h-5" />
            Report Violation
          </GlowButton>
        </motion.div>
      </main>
      
      <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <DialogContent className="bg-slate-900/95 backdrop-blur-xl border-white/10 max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <div className="p-2 rounded-lg bg-gradient-to-br from-rose-500 to-amber-500">
                <AlertTriangle className="w-5 h-5 text-white" />
              </div>
              Report Violation
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label className="text-slate-300">Violation Type *</Label>
              <Select value={violationType} onValueChange={setViolationType}>
                <SelectTrigger className="bg-slate-800/50 border-white/10 text-white mt-1.5" data-testid="select-violation-type">
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
                <SelectTrigger className="bg-slate-800/50 border-white/10 text-white mt-1.5" data-testid="select-severity">
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
                className="bg-slate-800/50 border-white/10 text-white min-h-[100px] mt-1.5"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                data-testid="input-description"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-slate-300">Location/Stand</Label>
                <Select value={standId} onValueChange={setStandId}>
                  <SelectTrigger className="bg-slate-800/50 border-white/10 text-white mt-1.5" data-testid="select-stand">
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
                  className="bg-slate-800/50 border-white/10 text-white mt-1.5"
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
                  className="bg-slate-800/50 border-white/10 text-white mt-1.5"
                  value={vendorName}
                  onChange={(e) => setVendorName(e.target.value)}
                  data-testid="input-vendor-name"
                />
              </div>
              <div>
                <Label className="text-slate-300">Badge #</Label>
                <Input 
                  placeholder="Badge number"
                  className="bg-slate-800/50 border-white/10 text-white mt-1.5"
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
                  className="flex-1 bg-slate-800/50 border-white/10 text-white hover:bg-slate-700/50"
                  onClick={() => cameraInputRef.current?.click()}
                  data-testid="button-take-photo"
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Take Photo
                </Button>
                <Button 
                  type="button"
                  variant="outline"
                  className="flex-1 bg-slate-800/50 border-white/10 text-white hover:bg-slate-700/50"
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
                    <motion.div 
                      key={idx} 
                      className="relative aspect-square"
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                    >
                      <img 
                        src={img} 
                        alt={`Evidence ${idx + 1}`}
                        className="w-full h-full object-cover rounded-xl border border-white/10"
                      />
                      <Button
                        size="icon"
                        variant="destructive"
                        className="absolute top-1 right-1 w-6 h-6 rounded-full"
                        onClick={() => removeImage(idx)}
                        data-testid={`button-remove-image-${idx}`}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <DialogFooter className="gap-2">
            <Button 
              variant="ghost" 
              onClick={() => setShowReportDialog(false)}
              className="text-slate-400"
              data-testid="button-cancel-report"
            >
              Cancel
            </Button>
            <GlowButton 
              variant="red"
              onClick={handleSubmitViolation}
              disabled={createViolation.isPending}
            >
              <Plus className="w-4 h-4" />
              Submit Report
            </GlowButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="bg-slate-900/95 backdrop-blur-xl border-white/10 max-w-md max-h-[90vh] overflow-y-auto">
          {selectedViolation && (
            <>
              <DialogHeader>
                <DialogTitle className="text-white flex items-center gap-2">
                  {(() => {
                    const typeConfig = VIOLATION_TYPES.find(t => t.id === selectedViolation.violationType) || VIOLATION_TYPES[7];
                    const TypeIcon = typeConfig.icon;
                    return (
                      <>
                        <div className={`p-2 rounded-lg bg-gradient-to-br ${typeConfig.color}`}>
                          <TypeIcon className="w-5 h-5 text-white" />
                        </div>
                        {typeConfig.label}
                      </>
                    );
                  })()}
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <StatusBadge status={selectedViolation.status || 'Reported'} />
                  <Badge className={`bg-${SEVERITY_OPTIONS.find(s => s.value === selectedViolation.severity)?.color || 'slate'}-500/20`}>
                    {selectedViolation.severity}
                  </Badge>
                </div>
                
                <div>
                  <Label className="text-slate-400 text-xs">Description</Label>
                  <p className="text-slate-200 mt-1">{selectedViolation.description}</p>
                </div>
                
                {(selectedViolation.standId || selectedViolation.section) && (
                  <div className="flex gap-4">
                    {selectedViolation.standId && (
                      <div>
                        <Label className="text-slate-400 text-xs">Location</Label>
                        <p className="text-slate-200 flex items-center gap-1 mt-1">
                          <MapPin className="w-4 h-4 text-cyan-400" />
                          {stands.find(s => s.id === selectedViolation.standId)?.name}
                        </p>
                      </div>
                    )}
                    {selectedViolation.section && (
                      <div>
                        <Label className="text-slate-400 text-xs">Section</Label>
                        <p className="text-slate-200 mt-1">{selectedViolation.section}</p>
                      </div>
                    )}
                  </div>
                )}
                
                {(selectedViolation.vendorName || selectedViolation.vendorBadgeNumber) && (
                  <div className="flex gap-4">
                    {selectedViolation.vendorName && (
                      <div>
                        <Label className="text-slate-400 text-xs">Vendor Name</Label>
                        <p className="text-slate-200 mt-1">{selectedViolation.vendorName}</p>
                      </div>
                    )}
                    {selectedViolation.vendorBadgeNumber && (
                      <div>
                        <Label className="text-slate-400 text-xs">Badge #</Label>
                        <p className="text-slate-200 mt-1">{selectedViolation.vendorBadgeNumber}</p>
                      </div>
                    )}
                  </div>
                )}
                
                {selectedViolation.mediaUrls && selectedViolation.mediaUrls.length > 0 && (
                  <div>
                    <Label className="text-slate-400 text-xs">Evidence</Label>
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      {selectedViolation.mediaUrls.map((url, idx) => (
                        <img 
                          key={idx}
                          src={url} 
                          alt={`Evidence ${idx + 1}`}
                          className="w-full aspect-square object-cover rounded-xl border border-white/10"
                        />
                      ))}
                    </div>
                  </div>
                )}
                
                {selectedViolation.reviewNotes && (
                  <div className="p-3 bg-slate-800/50 rounded-xl border border-white/10">
                    <Label className="text-slate-400 text-xs">Review Notes</Label>
                    <p className="text-slate-200 mt-1">{selectedViolation.reviewNotes}</p>
                  </div>
                )}
                
                {selectedViolation.resolutionNotes && (
                  <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                    <Label className="text-emerald-400 text-xs">Resolution</Label>
                    <p className="text-slate-200 mt-1">{selectedViolation.resolutionNotes}</p>
                    {selectedViolation.actionTaken && (
                      <p className="text-xs text-slate-400 mt-2">Action: {selectedViolation.actionTaken}</p>
                    )}
                  </div>
                )}
              </div>
              
              <DialogFooter>
                <Button 
                  variant="ghost" 
                  onClick={() => setShowViewDialog(false)}
                  className="text-slate-400"
                >
                  Close
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </AnimatedBackground>
  );
}
