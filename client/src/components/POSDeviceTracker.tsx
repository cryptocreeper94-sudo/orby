import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Monitor,
  Smartphone,
  CreditCard,
  Plus,
  Minus,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Wrench,
  ArrowRight,
  RefreshCw,
  MessageSquare,
  MapPin,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Package,
  Clock,
  User,
  Building2,
  Repeat2,
  X,
  Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useStore } from '@/lib/mockData';
import {
  GlassCard,
  GlassCardHeader,
  GlassCardContent,
  StatCard,
  GlowButton,
  StatusBadge,
  SectionHeader,
  EmptyState
} from '@/components/ui/premium';
import { cn } from '@/lib/utils';

const DEVICE_TYPE_ICONS: Record<string, React.ReactNode> = {
  'A930': <Smartphone className="h-5 w-5" />,
  'A700': <Monitor className="h-5 w-5" />,
  'PAX': <CreditCard className="h-5 w-5" />
};

const DEVICE_TYPE_COLORS: Record<string, string> = {
  'A930': 'from-cyan-600/30 to-cyan-800/30 border-cyan-500/40',
  'A700': 'from-violet-600/30 to-violet-800/30 border-violet-500/40',
  'PAX': 'from-amber-600/30 to-amber-800/30 border-amber-500/40'
};

const STATUS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  'available': { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/40' },
  'assigned': { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/40' },
  'maintenance': { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/40' },
  'retired': { bg: 'bg-slate-500/20', text: 'text-slate-400', border: 'border-slate-500/40' }
};

const LOCATION_TYPES = [
  { value: 'stand', label: 'Stand', icon: Building2 },
  { value: 'portable', label: 'Portable', icon: Package },
  { value: 'bar', label: 'Bar', icon: CreditCard },
  { value: 'club', label: 'Club', icon: Building2 }
];

interface PosDevice {
  id: string;
  deviceNumber: number;
  deviceType: string;
  serialNumber: string | null;
  status: string;
  currentLocationId: string | null;
  currentLocationType: string | null;
  currentLocationName: string | null;
  assignedById: string | null;
  assignedByName: string | null;
  assignedAt: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

interface PosAssignment {
  id: string;
  posDeviceId: string;
  deviceNumber: number;
  deviceType: string;
  locationId: string;
  locationType: string;
  locationName: string;
  eventDate: string;
  assignedById: string;
  assignedByName: string;
  status: string;
  returnedAt: string | null;
  returnedById: string | null;
  returnedByName: string | null;
  notes: string | null;
  createdAt: string;
}

interface PosIssue {
  id: string;
  posDeviceId: string;
  deviceNumber: number;
  locationId: string | null;
  locationName: string | null;
  issueType: string;
  description: string;
  priority: string;
  status: string;
  reportedById: string;
  reportedByName: string;
  assignedToId: string | null;
  assignedToName: string | null;
  resolution: string | null;
  resolvedById: string | null;
  resolvedByName: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface PosOverview {
  summary: {
    total: number;
    available: number;
    assigned: number;
    maintenance: number;
  };
  byType: Record<string, { total: number; available: number; assigned: number }>;
  activeAssignments: PosAssignment[];
  openIssues: PosIssue[];
  locationGrid: any[];
}

export function POSDeviceTracker() {
  const { currentUser } = useStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedView, setSelectedView] = useState<'overview' | 'devices' | 'assignments' | 'issues'>('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [showReplaceDialog, setShowReplaceDialog] = useState(false);
  const [showIssueDialog, setShowIssueDialog] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<PosDevice | null>(null);
  const [selectedAssignment, setSelectedAssignment] = useState<PosAssignment | null>(null);
  
  const [assignForm, setAssignForm] = useState({
    locationType: '',
    locationId: '',
    locationName: '',
    notes: ''
  });
  
  const [replaceForm, setReplaceForm] = useState({
    replacementDeviceId: '',
    reportedIssue: ''
  });
  
  const [issueForm, setIssueForm] = useState({
    issueType: 'NotBooting',
    description: '',
    priority: 'Normal'
  });
  
  // Fetch POS overview
  const { data: overview, isLoading: overviewLoading, refetch: refetchOverview } = useQuery<PosOverview>({
    queryKey: ['/api/pos/overview'],
    refetchInterval: 15000
  });
  
  // Fetch all devices
  const { data: devices = [], isLoading: devicesLoading } = useQuery<PosDevice[]>({
    queryKey: ['/api/pos/devices']
  });
  
  // Fetch available devices
  const { data: availableDevices = [] } = useQuery<PosDevice[]>({
    queryKey: ['/api/pos/devices/available']
  });
  
  // Fetch open issues
  const { data: openIssues = [] } = useQuery<PosIssue[]>({
    queryKey: ['/api/pos/issues/open']
  });
  
  // Fetch all stands for location selection
  const { data: stands = [] } = useQuery<any[]>({
    queryKey: ['/api/stands']
  });
  
  // Assign POS mutation
  const assignMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/pos/assignments', data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'POS Assigned',
        description: `Device assigned to ${assignForm.locationName}`
      });
      queryClient.invalidateQueries({ queryKey: ['/api/pos'] });
      setShowAssignDialog(false);
      setSelectedDevice(null);
      setAssignForm({ locationType: '', locationId: '', locationName: '', notes: '' });
    },
    onError: (error: any) => {
      toast({
        title: 'Assignment Failed',
        description: error.message || 'Could not assign device',
        variant: 'destructive'
      });
    }
  });
  
  // Return POS mutation
  const returnMutation = useMutation({
    mutationFn: async (assignmentId: string) => {
      const response = await apiRequest('POST', `/api/pos/assignments/${assignmentId}/return`, {
        returnedById: currentUser?.id,
        returnedByName: currentUser?.name
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'POS Returned',
        description: 'Device has been returned to inventory'
      });
      queryClient.invalidateQueries({ queryKey: ['/api/pos'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Return Failed',
        description: error.message || 'Could not return device',
        variant: 'destructive'
      });
    }
  });
  
  // Replace POS mutation
  const replaceMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/pos/replacements', data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'POS Replaced',
        description: 'Replacement device has been assigned'
      });
      queryClient.invalidateQueries({ queryKey: ['/api/pos'] });
      setShowReplaceDialog(false);
      setSelectedAssignment(null);
      setReplaceForm({ replacementDeviceId: '', reportedIssue: '' });
    },
    onError: (error: any) => {
      toast({
        title: 'Replacement Failed',
        description: error.message || 'Could not replace device',
        variant: 'destructive'
      });
    }
  });
  
  // Report issue mutation
  const reportIssueMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/pos/issues', data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Issue Reported',
        description: 'IT team has been notified'
      });
      queryClient.invalidateQueries({ queryKey: ['/api/pos'] });
      setShowIssueDialog(false);
      setSelectedDevice(null);
      setIssueForm({ issueType: 'NotBooting', description: '', priority: 'Normal' });
    },
    onError: (error: any) => {
      toast({
        title: 'Report Failed',
        description: error.message || 'Could not report issue',
        variant: 'destructive'
      });
    }
  });
  
  // Filter devices
  const filteredDevices = devices.filter(device => {
    const matchesSearch = 
      device.deviceNumber.toString().includes(searchTerm) ||
      device.deviceType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      device.currentLocationName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === 'all' || device.deviceType === filterType;
    const matchesStatus = filterStatus === 'all' || device.status === filterStatus;
    
    return matchesSearch && matchesType && matchesStatus;
  });
  
  const handleAssign = () => {
    if (!selectedDevice || !currentUser) return;
    
    assignMutation.mutate({
      posDeviceId: selectedDevice.id,
      deviceNumber: selectedDevice.deviceNumber,
      deviceType: selectedDevice.deviceType,
      locationId: assignForm.locationId,
      locationType: assignForm.locationType,
      locationName: assignForm.locationName,
      eventDate: new Date().toISOString().split('T')[0],
      assignedById: currentUser.id,
      assignedByName: currentUser.name,
      notes: assignForm.notes
    });
  };
  
  const handleReplace = () => {
    if (!selectedAssignment || !currentUser) return;
    
    const replacementDevice = availableDevices.find(d => d.id === replaceForm.replacementDeviceId);
    if (!replacementDevice) return;
    
    replaceMutation.mutate({
      originalPosId: selectedAssignment.posDeviceId,
      originalDeviceNumber: selectedAssignment.deviceNumber,
      replacementPosId: replacementDevice.id,
      replacementDeviceNumber: replacementDevice.deviceNumber,
      locationId: selectedAssignment.locationId,
      locationType: selectedAssignment.locationType,
      locationName: selectedAssignment.locationName,
      eventDate: selectedAssignment.eventDate,
      reportedIssue: replaceForm.reportedIssue,
      replacedById: currentUser.id,
      replacedByName: currentUser.name
    });
  };
  
  const handleReportIssue = () => {
    if (!selectedDevice || !currentUser) return;
    
    reportIssueMutation.mutate({
      posDeviceId: selectedDevice.id,
      deviceNumber: selectedDevice.deviceNumber,
      locationId: selectedDevice.currentLocationId,
      locationName: selectedDevice.currentLocationName,
      issueType: issueForm.issueType,
      description: issueForm.description,
      priority: issueForm.priority,
      reportedById: currentUser.id,
      reportedByName: currentUser.name
    });
  };
  
  const canManagePOS = currentUser && ['Developer', 'Admin', 'IT', 'OpsManager'].includes(currentUser.role);
  
  if (overviewLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 text-cyan-400 animate-spin" />
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-500/20 to-cyan-700/20 border border-cyan-500/30">
            <Monitor className="h-6 w-6 text-cyan-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">POS Device Tracker</h2>
            <p className="text-sm text-slate-400">Manage and track POS assignments</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => refetchOverview()}
          className="text-slate-400 hover:text-white"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>
      
      {/* View Tabs - Horizontal Scroll */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
        {[
          { id: 'overview', label: 'Overview', icon: Zap },
          { id: 'devices', label: 'All Devices', icon: Monitor },
          { id: 'assignments', label: 'Active Assignments', icon: MapPin },
          { id: 'issues', label: 'Open Issues', icon: AlertTriangle }
        ].map(tab => (
          <Button
            key={tab.id}
            variant={selectedView === tab.id ? 'default' : 'ghost'}
            className={cn(
              'min-w-fit h-11 px-4 rounded-xl transition-all whitespace-nowrap',
              selectedView === tab.id
                ? 'bg-gradient-to-r from-cyan-600 to-cyan-700 text-white shadow-lg shadow-cyan-500/25'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            )}
            onClick={() => setSelectedView(tab.id as any)}
          >
            <tab.icon className="h-4 w-4 mr-2" />
            {tab.label}
            {tab.id === 'issues' && openIssues.length > 0 && (
              <Badge className="ml-2 bg-red-500/20 text-red-400 border-red-500/40">
                {openIssues.length}
              </Badge>
            )}
          </Button>
        ))}
      </div>
      
      {/* Overview View */}
      {selectedView === 'overview' && overview && (
        <div className="space-y-6">
          {/* Stats Cards - Horizontal Scroll */}
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="min-w-[160px]"
            >
              <div className="p-4 rounded-xl bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-slate-700/50 backdrop-blur-sm">
                <div className="text-3xl font-bold text-white">{overview.summary.total}</div>
                <div className="text-sm text-slate-400 mt-1">Total Devices</div>
              </div>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="min-w-[160px]"
            >
              <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-900/40 to-emerald-950/40 border border-emerald-500/30 backdrop-blur-sm">
                <div className="text-3xl font-bold text-emerald-400">{overview.summary.available}</div>
                <div className="text-sm text-emerald-400/70 mt-1">Available</div>
              </div>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="min-w-[160px]"
            >
              <div className="p-4 rounded-xl bg-gradient-to-br from-blue-900/40 to-blue-950/40 border border-blue-500/30 backdrop-blur-sm">
                <div className="text-3xl font-bold text-blue-400">{overview.summary.assigned}</div>
                <div className="text-sm text-blue-400/70 mt-1">Assigned</div>
              </div>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="min-w-[160px]"
            >
              <div className="p-4 rounded-xl bg-gradient-to-br from-amber-900/40 to-amber-950/40 border border-amber-500/30 backdrop-blur-sm">
                <div className="text-3xl font-bold text-amber-400">{overview.summary.maintenance}</div>
                <div className="text-sm text-amber-400/70 mt-1">Maintenance</div>
              </div>
            </motion.div>
          </div>
          
          {/* Device Types Breakdown */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-3">By Device Type</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.entries(overview.byType).map(([type, stats]) => (
                <motion.div
                  key={type}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={cn(
                    'p-4 rounded-xl bg-gradient-to-br border backdrop-blur-sm',
                    DEVICE_TYPE_COLORS[type] || 'from-slate-600/30 to-slate-800/30 border-slate-500/40'
                  )}
                >
                  <div className="flex items-center gap-3 mb-3">
                    {DEVICE_TYPE_ICONS[type] || <Monitor className="h-5 w-5" />}
                    <span className="text-lg font-semibold text-white">{type}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <div className="text-xl font-bold text-white">{stats.total}</div>
                      <div className="text-xs text-slate-400">Total</div>
                    </div>
                    <div>
                      <div className="text-xl font-bold text-emerald-400">{stats.available}</div>
                      <div className="text-xs text-slate-400">Available</div>
                    </div>
                    <div>
                      <div className="text-xl font-bold text-blue-400">{stats.assigned}</div>
                      <div className="text-xs text-slate-400">Assigned</div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
          
          {/* Active Assignments Quick View */}
          {overview.activeAssignments.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-white">Active Assignments</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedView('assignments')}
                  className="text-cyan-400 hover:text-cyan-300"
                >
                  View All <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
              <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                {overview.activeAssignments.slice(0, 6).map(assignment => (
                  <motion.div
                    key={assignment.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="min-w-[240px] p-4 rounded-xl bg-slate-800/60 border border-slate-700/50 backdrop-blur-sm"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      {DEVICE_TYPE_ICONS[assignment.deviceType] || <Monitor className="h-4 w-4" />}
                      <span className="font-semibold text-white">
                        {assignment.deviceType} #{assignment.deviceNumber}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-400 mb-2">
                      <MapPin className="h-3.5 w-3.5" />
                      {assignment.locationName}
                    </div>
                    <div className="flex items-center justify-between">
                      <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/40">
                        {assignment.locationType}
                      </Badge>
                      {canManagePOS && (
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedAssignment(assignment);
                              setShowReplaceDialog(true);
                            }}
                            className="h-7 px-2 text-amber-400 hover:text-amber-300"
                          >
                            <Repeat2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => returnMutation.mutate(assignment.id)}
                            className="h-7 px-2 text-emerald-400 hover:text-emerald-300"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
          
          {/* Open Issues Quick View */}
          {overview.openIssues.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-400" />
                  Open Issues
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedView('issues')}
                  className="text-cyan-400 hover:text-cyan-300"
                >
                  View All <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
              <div className="space-y-2">
                {overview.openIssues.slice(0, 3).map(issue => (
                  <motion.div
                    key={issue.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 rounded-xl bg-amber-900/20 border border-amber-500/30 backdrop-blur-sm"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <AlertTriangle className="h-4 w-4 text-amber-400" />
                        <span className="text-white">
                          POS #{issue.deviceNumber} - {issue.issueType}
                        </span>
                      </div>
                      <Badge className={cn(
                        issue.priority === 'Urgent' ? 'bg-red-500/20 text-red-400 border-red-500/40' :
                        issue.priority === 'High' ? 'bg-orange-500/20 text-orange-400 border-orange-500/40' :
                        'bg-slate-500/20 text-slate-400 border-slate-500/40'
                      )}>
                        {issue.priority}
                      </Badge>
                    </div>
                    {issue.locationName && (
                      <div className="text-sm text-slate-400 mt-1 ml-7">
                        Location: {issue.locationName}
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Devices View */}
      {selectedView === 'devices' && (
        <div className="space-y-4">
          {/* Search and Filters */}
          <div className="flex gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search devices..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-slate-800/60 border-slate-700/50 text-white"
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[140px] bg-slate-800/60 border-slate-700/50 text-white">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="A930">A930</SelectItem>
                <SelectItem value="A700">A700</SelectItem>
                <SelectItem value="PAX">PAX</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[140px] bg-slate-800/60 border-slate-700/50 text-white">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="assigned">Assigned</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Device Grid - Horizontal Scroll on Mobile */}
          <div className="flex gap-4 overflow-x-auto pb-2 md:grid md:grid-cols-2 lg:grid-cols-3 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
            {filteredDevices.map(device => (
              <motion.div
                key={device.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  'min-w-[280px] md:min-w-0 p-4 rounded-xl bg-gradient-to-br border backdrop-blur-sm',
                  DEVICE_TYPE_COLORS[device.deviceType] || 'from-slate-600/30 to-slate-800/30 border-slate-500/40'
                )}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {DEVICE_TYPE_ICONS[device.deviceType] || <Monitor className="h-5 w-5" />}
                    <span className="font-bold text-lg text-white">
                      #{device.deviceNumber}
                    </span>
                  </div>
                  <Badge className={cn(
                    'capitalize',
                    STATUS_COLORS[device.status]?.bg,
                    STATUS_COLORS[device.status]?.text,
                    STATUS_COLORS[device.status]?.border
                  )}>
                    {device.status}
                  </Badge>
                </div>
                
                <div className="text-sm text-slate-300 mb-2">{device.deviceType}</div>
                
                {device.currentLocationName && (
                  <div className="flex items-center gap-2 text-sm text-slate-400 mb-3">
                    <MapPin className="h-3.5 w-3.5" />
                    {device.currentLocationName}
                  </div>
                )}
                
                {device.assignedByName && (
                  <div className="flex items-center gap-2 text-sm text-slate-400 mb-3">
                    <User className="h-3.5 w-3.5" />
                    Assigned by {device.assignedByName}
                  </div>
                )}
                
                {canManagePOS && (
                  <div className="flex gap-2 mt-3 pt-3 border-t border-slate-700/50">
                    {device.status === 'available' && (
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedDevice(device);
                          setShowAssignDialog(true);
                        }}
                        className="flex-1 h-9 bg-cyan-600 hover:bg-cyan-700"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Assign
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedDevice(device);
                        setShowIssueDialog(true);
                      }}
                      className="h-9 border-amber-500/40 text-amber-400 hover:bg-amber-500/20"
                    >
                      <AlertTriangle className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
          
          {filteredDevices.length === 0 && (
            <div className="text-center py-12 text-slate-400">
              <Monitor className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No devices found matching your filters</p>
            </div>
          )}
        </div>
      )}
      
      {/* Assignments View */}
      {selectedView === 'assignments' && overview && (
        <div className="space-y-4">
          {overview.activeAssignments.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No active assignments</p>
            </div>
          ) : (
            <div className="flex gap-4 overflow-x-auto pb-2 md:grid md:grid-cols-2 lg:grid-cols-3 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
              {overview.activeAssignments.map(assignment => (
                <motion.div
                  key={assignment.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="min-w-[280px] md:min-w-0 p-4 rounded-xl bg-slate-800/60 border border-slate-700/50 backdrop-blur-sm"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {DEVICE_TYPE_ICONS[assignment.deviceType] || <Monitor className="h-5 w-5" />}
                      <span className="font-bold text-lg text-white">
                        {assignment.deviceType} #{assignment.deviceNumber}
                      </span>
                    </div>
                    <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/40">
                      Active
                    </Badge>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-slate-300">
                      <MapPin className="h-3.5 w-3.5 text-slate-400" />
                      {assignment.locationName}
                    </div>
                    <div className="flex items-center gap-2 text-slate-400">
                      <Building2 className="h-3.5 w-3.5" />
                      {assignment.locationType}
                    </div>
                    <div className="flex items-center gap-2 text-slate-400">
                      <User className="h-3.5 w-3.5" />
                      Assigned by {assignment.assignedByName}
                    </div>
                    <div className="flex items-center gap-2 text-slate-400">
                      <Clock className="h-3.5 w-3.5" />
                      {new Date(assignment.createdAt).toLocaleTimeString()}
                    </div>
                  </div>
                  
                  {canManagePOS && (
                    <div className="flex gap-2 mt-4 pt-3 border-t border-slate-700/50">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedAssignment(assignment);
                          setShowReplaceDialog(true);
                        }}
                        className="flex-1 h-9 border-amber-500/40 text-amber-400 hover:bg-amber-500/20"
                      >
                        <Repeat2 className="h-4 w-4 mr-1" />
                        Replace
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => returnMutation.mutate(assignment.id)}
                        disabled={returnMutation.isPending}
                        className="flex-1 h-9 bg-emerald-600 hover:bg-emerald-700"
                      >
                        <CheckCircle2 className="h-4 w-4 mr-1" />
                        Return
                      </Button>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}
      
      {/* Issues View */}
      {selectedView === 'issues' && (
        <div className="space-y-4">
          {openIssues.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <CheckCircle2 className="h-12 w-12 mx-auto mb-4 opacity-50 text-emerald-400" />
              <p>No open issues - All systems operational</p>
            </div>
          ) : (
            <div className="space-y-3">
              {openIssues.map(issue => (
                <motion.div
                  key={issue.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    'p-4 rounded-xl border backdrop-blur-sm',
                    issue.priority === 'Urgent' ? 'bg-red-900/20 border-red-500/30' :
                    issue.priority === 'High' ? 'bg-orange-900/20 border-orange-500/30' :
                    'bg-slate-800/60 border-slate-700/50'
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className={cn(
                        'h-5 w-5 mt-0.5',
                        issue.priority === 'Urgent' ? 'text-red-400' :
                        issue.priority === 'High' ? 'text-orange-400' :
                        'text-amber-400'
                      )} />
                      <div>
                        <div className="font-semibold text-white">
                          POS #{issue.deviceNumber} - {issue.issueType}
                        </div>
                        <div className="text-sm text-slate-400 mt-1">
                          {issue.description}
                        </div>
                        {issue.locationName && (
                          <div className="flex items-center gap-2 text-sm text-slate-400 mt-2">
                            <MapPin className="h-3.5 w-3.5" />
                            {issue.locationName}
                          </div>
                        )}
                        <div className="flex items-center gap-4 text-sm text-slate-500 mt-2">
                          <span>Reported by {issue.reportedByName}</span>
                          <span>{new Date(issue.createdAt).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={cn(
                        issue.priority === 'Urgent' ? 'bg-red-500/20 text-red-400 border-red-500/40' :
                        issue.priority === 'High' ? 'bg-orange-500/20 text-orange-400 border-orange-500/40' :
                        'bg-slate-500/20 text-slate-400 border-slate-500/40'
                      )}>
                        {issue.priority}
                      </Badge>
                      <Badge className={cn(
                        issue.status === 'Open' ? 'bg-blue-500/20 text-blue-400 border-blue-500/40' :
                        issue.status === 'Acknowledged' ? 'bg-amber-500/20 text-amber-400 border-amber-500/40' :
                        'bg-cyan-500/20 text-cyan-400 border-cyan-500/40'
                      )}>
                        {issue.status}
                      </Badge>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}
      
      {/* Assign Dialog */}
      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-cyan-400" />
              Assign POS Device
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              {selectedDevice && `Assign ${selectedDevice.deviceType} #${selectedDevice.deviceNumber} to a location`}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label className="text-slate-300">Location Type</Label>
              <Select 
                value={assignForm.locationType} 
                onValueChange={(value) => setAssignForm(prev => ({ ...prev, locationType: value }))}
              >
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white mt-1">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {LOCATION_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        <type.icon className="h-4 w-4" />
                        {type.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label className="text-slate-300">Location</Label>
              <Select
                value={assignForm.locationId}
                onValueChange={(value) => {
                  const stand = stands.find(s => s.id === value);
                  setAssignForm(prev => ({
                    ...prev,
                    locationId: value,
                    locationName: stand?.name || value
                  }));
                }}
              >
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white mt-1">
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  {stands.map(stand => (
                    <SelectItem key={stand.id} value={stand.id}>
                      {stand.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label className="text-slate-300">Notes (optional)</Label>
              <Textarea
                placeholder="Add notes about this assignment..."
                value={assignForm.notes}
                onChange={(e) => setAssignForm(prev => ({ ...prev, notes: e.target.value }))}
                className="bg-slate-800 border-slate-700 text-white mt-1"
              />
            </div>
          </div>
          
          <DialogFooter className="gap-2">
            <Button
              variant="ghost"
              onClick={() => setShowAssignDialog(false)}
              className="text-slate-400"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAssign}
              disabled={!assignForm.locationId || !assignForm.locationType || assignMutation.isPending}
              className="bg-cyan-600 hover:bg-cyan-700"
            >
              {assignMutation.isPending ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              Assign Device
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Replace Dialog */}
      <Dialog open={showReplaceDialog} onOpenChange={setShowReplaceDialog}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Repeat2 className="h-5 w-5 text-amber-400" />
              Replace POS Device
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              {selectedAssignment && `Replace ${selectedAssignment.deviceType} #${selectedAssignment.deviceNumber} at ${selectedAssignment.locationName}`}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label className="text-slate-300">Issue</Label>
              <Textarea
                placeholder="What's wrong with the current device?"
                value={replaceForm.reportedIssue}
                onChange={(e) => setReplaceForm(prev => ({ ...prev, reportedIssue: e.target.value }))}
                className="bg-slate-800 border-slate-700 text-white mt-1"
              />
            </div>
            
            <div>
              <Label className="text-slate-300">Replacement Device</Label>
              <Select
                value={replaceForm.replacementDeviceId}
                onValueChange={(value) => setReplaceForm(prev => ({ ...prev, replacementDeviceId: value }))}
              >
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white mt-1">
                  <SelectValue placeholder="Select replacement device" />
                </SelectTrigger>
                <SelectContent>
                  {availableDevices.map(device => (
                    <SelectItem key={device.id} value={device.id}>
                      {device.deviceType} #{device.deviceNumber}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {availableDevices.length === 0 && (
                <p className="text-sm text-amber-400 mt-2">
                  No devices available for replacement
                </p>
              )}
            </div>
          </div>
          
          <DialogFooter className="gap-2">
            <Button
              variant="ghost"
              onClick={() => setShowReplaceDialog(false)}
              className="text-slate-400"
            >
              Cancel
            </Button>
            <Button
              onClick={handleReplace}
              disabled={!replaceForm.replacementDeviceId || !replaceForm.reportedIssue || replaceMutation.isPending}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {replaceMutation.isPending ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Repeat2 className="h-4 w-4 mr-2" />
              )}
              Replace Device
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Report Issue Dialog */}
      <Dialog open={showIssueDialog} onOpenChange={setShowIssueDialog}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-400" />
              Report POS Issue
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              {selectedDevice && `Report an issue with ${selectedDevice.deviceType} #${selectedDevice.deviceNumber}`}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label className="text-slate-300">Issue Type</Label>
              <Select
                value={issueForm.issueType}
                onValueChange={(value) => setIssueForm(prev => ({ ...prev, issueType: value }))}
              >
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NotBooting">Not Booting</SelectItem>
                  <SelectItem value="NoNetwork">No Network</SelectItem>
                  <SelectItem value="CardReaderError">Card Reader Error</SelectItem>
                  <SelectItem value="PrinterJam">Printer Jam</SelectItem>
                  <SelectItem value="TouchscreenIssue">Touchscreen Issue</SelectItem>
                  <SelectItem value="SoftwareError">Software Error</SelectItem>
                  <SelectItem value="BatteryDead">Battery Dead</SelectItem>
                  <SelectItem value="PhysicalDamage">Physical Damage</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label className="text-slate-300">Priority</Label>
              <Select
                value={issueForm.priority}
                onValueChange={(value) => setIssueForm(prev => ({ ...prev, priority: value }))}
              >
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Low">Low</SelectItem>
                  <SelectItem value="Normal">Normal</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label className="text-slate-300">Description</Label>
              <Textarea
                placeholder="Describe the issue in detail..."
                value={issueForm.description}
                onChange={(e) => setIssueForm(prev => ({ ...prev, description: e.target.value }))}
                className="bg-slate-800 border-slate-700 text-white mt-1"
              />
            </div>
          </div>
          
          <DialogFooter className="gap-2">
            <Button
              variant="ghost"
              onClick={() => setShowIssueDialog(false)}
              className="text-slate-400"
            >
              Cancel
            </Button>
            <Button
              onClick={handleReportIssue}
              disabled={!issueForm.description || reportIssueMutation.isPending}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {reportIssueMutation.isPending ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <AlertTriangle className="h-4 w-4 mr-2" />
              )}
              Report Issue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default POSDeviceTracker;
