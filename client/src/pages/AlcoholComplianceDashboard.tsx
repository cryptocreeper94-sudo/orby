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
  Filter,
  ClipboardList,
  BookOpen
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
  GlowButton,
  StatusBadge,
  PageHeader
} from '@/components/ui/premium';
import { LayoutShell, BentoCard, CarouselRail, AccordionStack } from '@/components/ui/bento';
import type { Stand } from '@shared/schema';
import ComplianceAlertPanel from '@/components/ComplianceAlertPanel';
import { GlobalModeBar } from '@/components/GlobalModeBar';

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

const COMPLIANCE_POLICIES = [
  {
    title: "ID Verification Requirements",
    content: "All customers appearing under 40 years old must present valid government-issued ID. Acceptable forms include driver's license, passport, or military ID. Check expiration dates and verify photo matches the customer."
  },
  {
    title: "Service Cutoff Guidelines",
    content: "Stop service to any guest showing signs of intoxication: slurred speech, unsteady balance, bloodshot eyes, or aggressive behavior. Document incidents and notify security immediately."
  },
  {
    title: "Reporting Procedures",
    content: "Report violations within 15 minutes of occurrence. Include location, time, description, and any witness information. Upload photos when safe to do so."
  },
  {
    title: "Training Compliance",
    content: "All alcohol vendors must complete TIPS certification and venue-specific training before each event season. Refresher courses required annually."
  }
];

function MetricCard({ icon: Icon, label, value, color, subValue }: { 
  icon: React.ElementType; 
  label: string; 
  value: number | string; 
  color: string;
  subValue?: string;
}) {
  return (
    <div 
      className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 border border-white/5 min-w-[140px]"
      data-testid={`metric-${label.toLowerCase().replace(/\s+/g, '-')}`}
    >
      <div className={`p-2 rounded-lg bg-${color}-500/20`}>
        <Icon className={`w-4 h-4 text-${color}-400`} />
      </div>
      <div>
        <div className="text-lg font-bold text-white">{value}</div>
        <div className="text-xs text-slate-400">{label}</div>
        {subValue && <div className="text-xs text-slate-500">{subValue}</div>}
      </div>
    </div>
  );
}

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
      className={`relative rounded-xl border overflow-hidden cursor-pointer transition-all duration-300 min-w-[280px] ${
        isResolved 
          ? 'border-slate-700/50 bg-slate-800/30' 
          : 'border-white/10 bg-gradient-to-br from-slate-800/80 to-slate-900/80 shadow-lg hover:shadow-xl'
      }`}
      data-testid={`violation-card-${violation.id}`}
    >
      <div className={`absolute top-0 left-0 w-1 h-full bg-gradient-to-b ${typeConfig.color}`} />
      
      <div className="p-3">
        <div className="flex items-start gap-3">
          <motion.div 
            className={`p-2 rounded-lg bg-gradient-to-br ${typeConfig.color} shadow-lg flex-shrink-0`}
            whileHover={{ rotate: [0, -5, 5, 0] }}
          >
            <TypeIcon className="w-4 h-4 text-white" />
          </motion.div>
          
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center justify-between gap-1 mb-1">
              <h4 className="font-semibold text-white text-sm">{typeConfig.label}</h4>
              <StatusBadge status={violation.status || 'Reported'} pulse={!isResolved} />
            </div>
            
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 mb-2">
              {stand && (
                <span className="flex items-center gap-1 bg-slate-800/50 px-1.5 py-0.5 rounded">
                  <MapPin className="w-3 h-3 text-cyan-400" />
                  {stand.name}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {timeAgo(violation.createdAt)}
              </span>
            </div>
            
            <p className="text-xs text-slate-300 line-clamp-2 mb-2">{violation.description}</p>
            
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge className={`text-xs bg-${severityConfig?.color || 'slate'}-500/20 text-${severityConfig?.color || 'slate'}-400 border-${severityConfig?.color || 'slate'}-500/30`}>
                {violation.severity}
              </Badge>
              {violation.mediaUrls && violation.mediaUrls.length > 0 && (
                <span className="text-xs text-cyan-400 flex items-center gap-1 bg-cyan-500/10 px-1.5 py-0.5 rounded-full">
                  <ImageIcon className="w-3 h-3" />
                  {violation.mediaUrls.length}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function InspectionCard({ stand }: { stand: Stand }) {
  const inspectionStatus = Math.random() > 0.3 ? 'passed' : Math.random() > 0.5 ? 'pending' : 'failed';
  
  return (
    <div 
      className="p-3 rounded-lg bg-slate-800/40 border border-white/5 hover:border-cyan-500/30 transition-colors"
      data-testid={`inspection-card-${stand.id}`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="font-medium text-white text-sm truncate">{stand.name}</span>
        <Badge className={`text-xs ${
          inspectionStatus === 'passed' ? 'bg-green-500/20 text-green-400' :
          inspectionStatus === 'pending' ? 'bg-amber-500/20 text-amber-400' :
          'bg-red-500/20 text-red-400'
        }`}>
          {inspectionStatus}
        </Badge>
      </div>
      <div className="text-xs text-slate-400">Last checked: 2h ago</div>
    </div>
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

  const metricsItems = [
    <MetricCard key="total" icon={FileText} label="Total Reports" value={violations.length} color="cyan" />,
    <MetricCard key="pending" icon={Clock} label="Pending" value={pendingViolations.length} color={pendingViolations.length > 0 ? "amber" : "green"} />,
    <MetricCard key="resolved" icon={CheckCircle2} label="Resolved" value={resolvedViolations.length} color="green" />,
    <MetricCard key="myreports" icon={User} label="My Reports" value={myViolations.length} color="blue" />,
  ];

  const violationItems = getFilteredViolations().map(violation => (
    <ViolationCard 
      key={violation.id}
      violation={violation}
      stands={stands}
      onView={handleViewViolation}
    />
  ));
  
  return (
    <AnimatedBackground>
      <GlobalModeBar />
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
            data-testid="button-logout"
          >
            <LogOut className="w-5 h-5" />
          </Button>
        }
      />

      <main className="p-3 md:p-4 pb-32 max-w-7xl mx-auto" data-testid="alcohol-compliance-dashboard">
        <ComplianceAlertPanel 
          userId={currentUser?.id} 
          userName={currentUser?.name} 
          isManager={false}
        />
        
        <LayoutShell className="mt-4">
          <BentoCard span={12} title="Compliance Metrics" data-testid="metrics-section">
            <CarouselRail items={metricsItems} data-testid="metrics-carousel" />
          </BentoCard>

          <BentoCard span={8} rowSpan={2} className="flex flex-col" data-testid="violations-section">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span className="text-sm font-medium text-slate-300">Violations</span>
              </div>
              <GlowButton
                size="sm"
                variant="red"
                onClick={() => setShowReportDialog(true)}
                data-testid="button-report-violation"
              >
                <Plus className="w-4 h-4" />
                Report
              </GlowButton>
            </div>
            
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
              <TabsList className="w-full bg-slate-800/50 rounded-lg p-1 grid grid-cols-4 mb-3">
                <TabsTrigger 
                  value="all" 
                  className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400 rounded-lg text-xs"
                  data-testid="tab-all"
                >
                  All
                </TabsTrigger>
                <TabsTrigger 
                  value="my" 
                  className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400 rounded-lg text-xs"
                  data-testid="tab-my"
                >
                  Mine
                </TabsTrigger>
                <TabsTrigger 
                  value="pending" 
                  className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400 rounded-lg text-xs"
                  data-testid="tab-pending"
                >
                  Pending
                </TabsTrigger>
                <TabsTrigger 
                  value="resolved" 
                  className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400 rounded-lg text-xs"
                  data-testid="tab-resolved"
                >
                  Done
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value={activeTab} className="flex-1 m-0">
                {loadingViolations ? (
                  <div className="text-center py-8">
                    <Wine className="w-8 h-8 mx-auto mb-2 text-cyan-400 animate-pulse" />
                    <p className="text-sm text-slate-400">Loading...</p>
                  </div>
                ) : violationItems.length === 0 ? (
                  <div className="text-center py-8">
                    <Wine className="w-10 h-10 mx-auto mb-2 text-slate-600" />
                    <p className="text-sm text-slate-400">No violations found</p>
                  </div>
                ) : (
                  <CarouselRail 
                    items={violationItems} 
                    showDots 
                    data-testid="violations-carousel"
                  />
                )}
              </TabsContent>
            </Tabs>
          </BentoCard>

          <BentoCard span={4} rowSpan={2} title="Compliance Policies" data-testid="policies-section">
            <div className="flex items-center gap-2 mb-3">
              <BookOpen className="w-4 h-4 text-cyan-400" />
              <span className="text-xs text-slate-400">Reference Guide</span>
            </div>
            <AccordionStack 
              items={COMPLIANCE_POLICIES}
              defaultOpen={[0]}
              data-testid="policies-accordion"
            />
          </BentoCard>

          <BentoCard span={12} title="Inspection Grid" data-testid="inspection-section">
            <div className="flex items-center gap-2 mb-3">
              <ClipboardList className="w-4 h-4 text-green-400" />
              <span className="text-xs text-slate-400">Stand Compliance Status</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
              {stands.slice(0, 12).map(stand => (
                <InspectionCard key={stand.id} stand={stand} />
              ))}
            </div>
          </BentoCard>
        </LayoutShell>
        
        <motion.div 
          className="fixed bottom-6 left-0 right-0 flex justify-center z-20 lg:hidden"
          initial={{ y: 100 }}
          animate={{ y: 0 }}
        >
          <GlowButton
            size="lg"
            variant="red"
            onClick={() => setShowReportDialog(true)}
            data-testid="button-report-violation-mobile"
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
              <Label className="text-slate-300 mb-2 block">Evidence Photos</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 border-white/10 text-slate-300"
                  onClick={() => cameraInputRef.current?.click()}
                  data-testid="button-camera"
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Camera
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 border-white/10 text-slate-300"
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
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleCameraCapture}
              />
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleFileUpload}
              />
              
              {capturedImages.length > 0 && (
                <div className="flex gap-2 mt-3 flex-wrap">
                  {capturedImages.map((img, idx) => (
                    <div key={idx} className="relative">
                      <img 
                        src={img} 
                        alt={`Evidence ${idx + 1}`}
                        className="w-16 h-16 object-cover rounded-lg border border-white/10"
                      />
                      <button
                        onClick={() => removeImage(idx)}
                        className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center"
                        data-testid={`button-remove-image-${idx}`}
                      >
                        <X className="w-3 h-3 text-white" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={() => setShowReportDialog(false)}
              className="border-white/10 text-slate-300"
              data-testid="button-cancel-report"
            >
              Cancel
            </Button>
            <GlowButton
              onClick={handleSubmitViolation}
              disabled={createViolation.isPending}
              variant="red"
              data-testid="button-submit-report"
            >
              {createViolation.isPending ? 'Submitting...' : 'Submit Report'}
            </GlowButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="bg-slate-900/95 backdrop-blur-xl border-white/10 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Violation Details</DialogTitle>
          </DialogHeader>
          
          {selectedViolation && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-xl bg-gradient-to-br ${VIOLATION_TYPES.find(t => t.id === selectedViolation.violationType)?.color || 'from-slate-500 to-slate-600'}`}>
                  {(() => {
                    const TypeIcon = VIOLATION_TYPES.find(t => t.id === selectedViolation.violationType)?.icon || AlertCircle;
                    return <TypeIcon className="w-5 h-5 text-white" />;
                  })()}
                </div>
                <div>
                  <h3 className="font-bold text-white">
                    {VIOLATION_TYPES.find(t => t.id === selectedViolation.violationType)?.label || 'Unknown'}
                  </h3>
                  <StatusBadge status={selectedViolation.status || 'Reported'} />
                </div>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Severity</span>
                  <Badge>{selectedViolation.severity}</Badge>
                </div>
                {selectedViolation.standId && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Location</span>
                    <span className="text-white">{stands.find(s => s.id === selectedViolation.standId)?.name}</span>
                  </div>
                )}
                {selectedViolation.vendorName && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Vendor</span>
                    <span className="text-white">{selectedViolation.vendorName}</span>
                  </div>
                )}
              </div>
              
              <div>
                <h4 className="text-slate-400 text-sm mb-1">Description</h4>
                <p className="text-white text-sm">{selectedViolation.description}</p>
              </div>
              
              {selectedViolation.mediaUrls && selectedViolation.mediaUrls.length > 0 && (
                <div>
                  <h4 className="text-slate-400 text-sm mb-2">Evidence</h4>
                  <div className="flex gap-2 flex-wrap">
                    {selectedViolation.mediaUrls.map((url, idx) => (
                      <img 
                        key={idx}
                        src={url} 
                        alt={`Evidence ${idx + 1}`}
                        className="w-20 h-20 object-cover rounded-lg border border-white/10"
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AnimatedBackground>
  );
}
