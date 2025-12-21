import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  MessageSquare, Send, UserCircle, LogOut, Camera,
  Clock, CheckCircle2, AlertCircle, Users, Map, Navigation,
  AlertTriangle, MapPin, X, Locate, Headphones, Shield,
  HelpCircle, Sparkles, ClipboardCheck, BookOpen
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  useGeolocation, 
  isWithinGeofence,
  STADIUM_LOCATION,
  GEOFENCE_RADIUS_FEET 
} from '@/components/LocationAcknowledgement';
import { InteractiveMap } from '@/components/InteractiveMap';
import { WalkingDirections } from '@/components/WalkingDirections';
import { useStore } from '@/lib/mockData';
import { toast } from 'sonner';
import {
  AnimatedBackground,
  GlowButton,
  StatusBadge
} from '@/components/ui/premium';
import { LayoutShell, BentoCard, CarouselRail, AccordionStack } from '@/components/ui/bento';
import ComplianceAlertPanel from '@/components/ComplianceAlertPanel';
import { GlobalModeBar } from '@/components/GlobalModeBar';

interface Message {
  id: string;
  content: string;
  sentAt: string;
  recipient: string;
  status: 'sent' | 'delivered' | 'read';
}

interface Manager {
  id: string;
  name: string;
  role: string;
  department: string;
  isOnline: boolean;
}

interface Incident {
  id: string;
  type: string;
  description: string;
  location: string;
  reportedAt: string;
  status: 'reported' | 'acknowledged' | 'resolved';
  hasMedia: boolean;
}

const MANAGERS: Manager[] = [
  { id: '1', name: 'Brooke K', role: 'HR Manager', department: 'HR Manager', isOnline: true },
  { id: '2', name: 'David', role: 'Operations Manager', department: 'Operations', isOnline: true },
  { id: '3', name: 'Jay', role: 'Purchasing Manager', department: 'Warehouse', isOnline: false },
  { id: '4', name: 'Chef Deb', role: 'Culinary Manager', department: 'Kitchen', isOnline: true },
  { id: '5', name: 'Darby', role: 'Beverage Manager', department: 'Bar Manager', isOnline: false },
  { id: '6', name: 'Shelia', role: 'Operations Supervisor', department: 'Operations', isOnline: true },
  { id: '7', name: 'Meghann', role: 'General Manager', department: 'Manager', isOnline: true },
];

const INCIDENT_TYPES = [
  { id: 'customer_complaint', label: 'Customer Complaint', icon: AlertCircle, color: 'from-rose-500 to-rose-600' },
  { id: 'lost_item', label: 'Lost & Found', icon: HelpCircle, color: 'from-blue-500 to-blue-600' },
  { id: 'safety_hazard', label: 'Safety Hazard', icon: AlertTriangle, color: 'from-amber-500 to-amber-600' },
  { id: 'medical', label: 'Medical Issue', icon: Shield, color: 'from-red-500 to-red-600' },
  { id: 'spill', label: 'Spill/Cleanup', icon: Sparkles, color: 'from-cyan-500 to-cyan-600' },
  { id: 'disturbance', label: 'Guest Disturbance', icon: Users, color: 'from-purple-500 to-purple-600' },
  { id: 'other', label: 'Other', icon: MessageSquare, color: 'from-slate-500 to-slate-600' },
];

const QUICK_LOCATIONS = [
  'Gate 1', 'Gate 2', 'Gate 3', 'Gate 4', 'Gate 5', 'Gate 6',
  'North Plaza', 'South Plaza', 'Main Concourse', 'Club Level',
  'Section 101-112', 'Section 113-124', 'Section 125-140',
  'Restrooms East', 'Restrooms West', 'Guest Services'
];

const CHECK_IN_PROCEDURES = [
  {
    title: "Arrival & Check-In",
    content: "Report to your assigned location 15 minutes before shift. Use the mobile app to clock in. Verify your assignment with your supervisor and collect any required equipment."
  },
  {
    title: "Guest Assistance Protocol",
    content: "Greet guests warmly and offer assistance proactively. Direct them to facilities, answer questions about seating, and escalate complex issues to supervisors."
  },
  {
    title: "Incident Reporting",
    content: "Document all incidents immediately using the incident form. Include photos when possible. For emergencies, contact security first then file report. All incidents require supervisor acknowledgment."
  },
  {
    title: "Communication Guidelines",
    content: "Use professional language in all messages. Respond to manager requests within 5 minutes. Keep messages concise and include relevant location details."
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
      className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 border border-white/5 min-w-[130px]"
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

function ManagerCard({ manager, selected, onSelect }: { 
  manager: Manager; 
  selected: boolean; 
  onSelect: () => void;
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onSelect}
      className={`relative p-3 rounded-xl border overflow-hidden text-left transition-all min-w-[140px] ${
        selected
          ? 'bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border-cyan-500/50 shadow-lg shadow-cyan-500/20'
          : 'bg-slate-800/50 border-white/10 hover:border-white/20'
      }`}
      data-testid={`manager-${manager.id}`}
    >
      <div className="flex items-center gap-2 mb-1">
        <motion.span 
          className={`w-2 h-2 rounded-full ${manager.isOnline ? 'bg-emerald-400' : 'bg-slate-500'}`}
          animate={manager.isOnline ? { scale: [1, 1.3, 1], opacity: [1, 0.7, 1] } : {}}
          transition={{ repeat: Infinity, duration: 2 }}
        />
        <span className="text-sm font-semibold text-white truncate">{manager.name}</span>
      </div>
      <p className="text-xs text-slate-400 truncate">{manager.role}</p>
      {selected && (
        <motion.div 
          className="absolute top-2 right-2"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
        >
          <CheckCircle2 className="h-4 w-4 text-cyan-400" />
        </motion.div>
      )}
    </motion.button>
  );
}

function MessageCard({ message, getStatusIcon }: { message: Message; getStatusIcon: (status: Message['status']) => React.ReactNode }) {
  return (
    <motion.div 
      className="p-3 bg-slate-800/30 rounded-xl border border-white/5 min-w-[200px]"
      whileHover={{ x: 4 }}
      data-testid={`message-item-${message.id}`}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30 text-xs">
          To: {message.recipient}
        </Badge>
        <div className="flex items-center gap-1 text-xs text-slate-500">
          {getStatusIcon(message.status)}
          <span>{message.sentAt}</span>
        </div>
      </div>
      <p className="text-xs text-slate-300 line-clamp-2">{message.content}</p>
    </motion.div>
  );
}

function IncidentCard({ incident }: { incident: Incident }) {
  const typeConfig = INCIDENT_TYPES.find(t => t.label === incident.type);
  const TypeIcon = typeConfig?.icon || AlertCircle;
  
  return (
    <div 
      className="p-3 rounded-lg bg-slate-800/40 border border-white/5"
      data-testid={`incident-card-${incident.id}`}
    >
      <div className="flex items-center gap-2 mb-2">
        <div className={`p-1.5 rounded-lg bg-gradient-to-br ${typeConfig?.color || 'from-slate-500 to-slate-600'}`}>
          <TypeIcon className="w-3 h-3 text-white" />
        </div>
        <span className="text-sm font-medium text-white">{incident.type}</span>
        <StatusBadge status={incident.status} />
      </div>
      <p className="text-xs text-slate-400 line-clamp-1">{incident.description}</p>
      <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
        <MapPin className="w-3 h-3" />
        <span>{incident.location}</span>
        <span>•</span>
        <span>{incident.reportedAt}</span>
      </div>
    </div>
  );
}

export default function CheckInAssistantDashboard() {
  const [, setLocation] = useLocation();
  const currentUser = useStore((state) => state.currentUser);
  const logout = useStore((state) => state.logout);
  
  const [selectedManager, setSelectedManager] = useState<Manager | null>(null);
  const [messageContent, setMessageContent] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isSending, setIsSending] = useState(false);
  
  const [showIncidentForm, setShowIncidentForm] = useState(false);
  const [incidentType, setIncidentType] = useState('');
  const [incidentDescription, setIncidentDescription] = useState('');
  const [incidentLocation, setIncidentLocation] = useState('');
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [capturedMedia, setCapturedMedia] = useState<string[]>([]);
  
  const [showMap, setShowMap] = useState(false);
  const [showDirections, setShowDirections] = useState(false);
  const [selectedDestination, setSelectedDestination] = useState<string>('');
  
  const { location: gpsLocation, error: gpsError, isLoading: gpsLoading, requestLocation } = useGeolocation();
  const [currentLocation, setCurrentLocation] = useState<string>('');
  const [isOnSite, setIsOnSite] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (gpsLocation) {
      const onSite = isWithinGeofence(
        gpsLocation.coords.latitude,
        gpsLocation.coords.longitude,
        STADIUM_LOCATION.lat,
        STADIUM_LOCATION.lng,
        GEOFENCE_RADIUS_FEET
      );
      setIsOnSite(onSite);
      if (onSite) {
        setCurrentLocation('Nissan Stadium');
      }
    }
  }, [gpsLocation]);

  const handleSendMessage = async () => {
    if (!messageContent.trim() || !selectedManager || !currentUser) return;
    
    setIsSending(true);
    
    try {
      const newMessage: Message = {
        id: Date.now().toString(),
        content: messageContent,
        sentAt: 'Just now',
        recipient: selectedManager.name,
        status: 'sent'
      };
      setMessages([newMessage, ...messages]);
      setMessageContent('');
      setSelectedManager(null);
      toast.success(`Message sent to ${selectedManager.name}`);
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error('Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  const handleSubmitIncident = async () => {
    if (!incidentType || !incidentDescription || !currentUser) return;
    
    try {
      const incidentLabel = INCIDENT_TYPES.find(t => t.id === incidentType)?.label || incidentType;
      const locationStr = incidentLocation || currentLocation || 'Not specified';
      
      const response = await fetch('/api/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reporterId: currentUser.id,
          title: incidentLabel,
          description: incidentDescription,
          location: locationStr,
          severity: 'Medium',
          status: 'Open',
          mediaUrls: capturedMedia.length > 0 ? capturedMedia : undefined
        })
      });
      
      if (response.ok) {
        const newIncident: Incident = {
          id: Date.now().toString(),
          type: incidentLabel,
          description: incidentDescription,
          location: locationStr,
          reportedAt: 'Just now',
          status: 'reported',
          hasMedia: capturedMedia.length > 0
        };
        
        setIncidents([newIncident, ...incidents]);
        setShowIncidentForm(false);
        setIncidentType('');
        setIncidentDescription('');
        setIncidentLocation('');
        setCapturedMedia([]);
        toast.success('Incident reported successfully');
      } else {
        toast.error('Failed to submit incident');
      }
    } catch (error) {
      console.error('Failed to submit incident:', error);
      toast.error('Failed to submit incident');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result) {
            setCapturedMedia(prev => [...prev, e.target!.result as string]);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleLogout = () => {
    logout();
    setLocation('/');
  };

  const getStatusIcon = (status: Message['status']) => {
    switch (status) {
      case 'sent': return <Clock className="h-3 w-3 text-slate-400" />;
      case 'delivered': return <CheckCircle2 className="h-3 w-3 text-blue-400" />;
      case 'read': return <CheckCircle2 className="h-3 w-3 text-emerald-400" />;
    }
  };

  const onlineManagers = MANAGERS.filter(m => m.isOnline).length;

  const metricsItems = [
    <MetricCard key="online" icon={Users} label="Managers Online" value={onlineManagers} color="cyan" subValue={`of ${MANAGERS.length}`} />,
    <MetricCard key="messages" icon={MessageSquare} label="Messages Sent" value={messages.length} color="blue" />,
    <MetricCard key="incidents" icon={AlertTriangle} label="Incidents" value={incidents.length} color="amber" />,
    <MetricCard key="location" icon={MapPin} label="Location" value={isOnSite ? 'On Site' : 'Off Site'} color={isOnSite ? 'green' : 'amber'} />,
  ];

  const managerItems = MANAGERS.map(manager => (
    <ManagerCard 
      key={manager.id} 
      manager={manager} 
      selected={selectedManager?.id === manager.id}
      onSelect={() => setSelectedManager(manager)}
    />
  ));

  const messageItems = messages.map(message => (
    <MessageCard key={message.id} message={message} getStatusIcon={getStatusIcon} />
  ));

  return (
    <AnimatedBackground>
      <GlobalModeBar />
      <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-900/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div 
              className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/30"
              whileHover={{ scale: 1.05, rotate: 5 }}
            >
              <Headphones className="h-5 w-5 text-white" />
            </motion.div>
            <div>
              <h1 className="text-lg font-bold text-white">Check-in Assistant</h1>
              <div className="flex items-center gap-2">
                <motion.span 
                  className={`w-2 h-2 rounded-full ${isOnSite ? 'bg-emerald-400' : 'bg-amber-400'}`}
                  animate={isOnSite ? { scale: [1, 1.2, 1] } : {}}
                  transition={{ repeat: Infinity, duration: 2 }}
                />
                <p className="text-xs text-slate-400">
                  {isOnSite ? 'On Site' : gpsLoading ? 'Locating...' : 'Location pending'}
                </p>
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="text-slate-400 hover:text-white hover:bg-white/10"
            data-testid="button-logout"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-3 py-4" data-testid="checkin-assistant-dashboard">
        <ComplianceAlertPanel 
          userId={currentUser?.id} 
          userName={currentUser?.name} 
          isManager={false}
        />
        
        <LayoutShell className="mt-4">
          <BentoCard span={12} title="Check-In Metrics" data-testid="metrics-section">
            <CarouselRail items={metricsItems} data-testid="metrics-carousel" />
          </BentoCard>

          <BentoCard span={8} rowSpan={2} className="flex flex-col" data-testid="messaging-section">
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-4 h-4 text-cyan-400" />
              <span className="text-sm font-medium text-slate-300">Contact a Manager</span>
            </div>
            
            <CarouselRail items={managerItems} className="mb-3" data-testid="managers-carousel" />

            <AnimatePresence>
              {selectedManager && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-3 overflow-hidden"
                >
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30">
                    <Send className="h-4 w-4 text-cyan-400" />
                    <span className="text-sm text-cyan-400">To: {selectedManager.name} ({selectedManager.role})</span>
                  </div>
                  <Textarea
                    placeholder="Describe the situation or ask a question..."
                    value={messageContent}
                    onChange={(e) => setMessageContent(e.target.value)}
                    className="min-h-[80px] bg-slate-800/50 border-white/10 text-white placeholder:text-slate-500 focus:border-cyan-500/50 resize-none text-sm"
                    data-testid="message-input"
                  />
                  <div className="flex gap-2">
                    <GlowButton
                      onClick={handleSendMessage}
                      disabled={!messageContent.trim() || isSending}
                      variant="cyan"
                      size="sm"
                      className="flex-1"
                      data-testid="button-send-message"
                    >
                      <Send className="h-4 w-4" />
                      Send
                    </GlowButton>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedManager(null)}
                      className="border-white/10 text-slate-300 hover:bg-white/5"
                      data-testid="button-cancel"
                    >
                      Cancel
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {messages.length > 0 && !selectedManager && (
              <div className="mt-3">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4 text-slate-400" />
                  <span className="text-xs text-slate-400">Recent Messages</span>
                </div>
                <CarouselRail items={messageItems} data-testid="messages-carousel" />
              </div>
            )}
          </BentoCard>

          <BentoCard span={4} rowSpan={2} title="Procedures" data-testid="procedures-section">
            <div className="flex items-center gap-2 mb-3">
              <BookOpen className="w-4 h-4 text-cyan-400" />
              <span className="text-xs text-slate-400">Reference Guide</span>
            </div>
            <AccordionStack 
              items={CHECK_IN_PROCEDURES}
              defaultOpen={[0]}
              data-testid="procedures-accordion"
            />
          </BentoCard>

          <BentoCard span={6} title="Incident Reports" data-testid="incidents-section">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span className="text-xs text-slate-400">Document issues</span>
              </div>
              <GlowButton
                onClick={() => setShowIncidentForm(true)}
                variant="amber"
                size="sm"
                data-testid="button-new-incident"
              >
                New Report
              </GlowButton>
            </div>
            
            {incidents.length === 0 ? (
              <div className="text-center py-6">
                <ClipboardCheck className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                <p className="text-xs text-slate-400">No incidents reported</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {incidents.slice(0, 4).map(incident => (
                  <IncidentCard key={incident.id} incident={incident} />
                ))}
              </div>
            )}
          </BentoCard>

          <BentoCard span={6} title="Quick Navigation" data-testid="navigation-section">
            <div className="flex items-center gap-2 mb-3">
              <Map className="w-4 h-4 text-emerald-400" />
              <span className="text-xs text-slate-400">Stadium Map & Directions</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                onClick={() => setShowMap(true)}
                className="border-white/10 text-slate-300 hover:bg-white/5 h-auto py-3"
                data-testid="button-show-map"
              >
                <div className="flex flex-col items-center gap-1">
                  <Map className="h-5 w-5 text-emerald-400" />
                  <span className="text-xs">View Map</span>
                </div>
              </Button>
              <Button
                variant="outline"
                onClick={requestLocation}
                className="border-white/10 text-slate-300 hover:bg-white/5 h-auto py-3"
                data-testid="button-locate"
              >
                <div className="flex flex-col items-center gap-1">
                  <Locate className="h-5 w-5 text-cyan-400" />
                  <span className="text-xs">My Location</span>
                </div>
              </Button>
            </div>
          </BentoCard>
        </LayoutShell>
      </main>

      <Dialog open={showIncidentForm} onOpenChange={setShowIncidentForm}>
        <DialogContent className="bg-slate-900/95 backdrop-blur-xl border-white/10 max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600">
                <AlertTriangle className="w-5 h-5 text-white" />
              </div>
              Report Incident
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-xs text-slate-400 mb-2 block font-medium">Incident Type</label>
              <div className="grid grid-cols-2 gap-2">
                {INCIDENT_TYPES.map((type) => {
                  const TypeIcon = type.icon;
                  return (
                    <motion.button
                      key={type.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setIncidentType(type.id)}
                      className={`p-3 rounded-xl border text-center transition-all ${
                        incidentType === type.id
                          ? 'bg-gradient-to-br border-amber-500/50 shadow-lg shadow-amber-500/20 ' + type.color.replace('from-', 'from-').replace(' to-', '/20 to-') + '/10'
                          : 'bg-slate-800/50 border-white/10 hover:border-white/20'
                      }`}
                      data-testid={`incident-type-${type.id}`}
                    >
                      <div className={`w-8 h-8 rounded-lg mx-auto mb-2 flex items-center justify-center bg-gradient-to-br ${type.color}`}>
                        <TypeIcon className="h-4 w-4 text-white" />
                      </div>
                      <span className="text-xs text-slate-300 font-medium">{type.label}</span>
                    </motion.button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-400 mb-2 block font-medium">Location</label>
              <div className="flex gap-2">
                <Select value={incidentLocation} onValueChange={setIncidentLocation}>
                  <SelectTrigger className="flex-1 bg-slate-800/50 border-white/10" data-testid="select-incident-location">
                    <SelectValue placeholder="Select location..." />
                  </SelectTrigger>
                  <SelectContent>
                    {QUICK_LOCATIONS.map((loc) => (
                      <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={requestLocation}
                  className="border-white/10"
                  data-testid="button-use-gps"
                >
                  <Locate className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-400 mb-2 block font-medium">Description</label>
              <Textarea
                placeholder="Describe the incident..."
                value={incidentDescription}
                onChange={(e) => setIncidentDescription(e.target.value)}
                className="min-h-[100px] bg-slate-800/50 border-white/10 text-white"
                data-testid="incident-description"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 mb-2 block font-medium">Photos (optional)</label>
              <Button
                type="button"
                variant="outline"
                className="w-full border-white/10 text-slate-300"
                onClick={() => fileInputRef.current?.click()}
                data-testid="button-add-photo"
              >
                <Camera className="w-4 h-4 mr-2" />
                Add Photo
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleFileUpload}
              />
              
              {capturedMedia.length > 0 && (
                <div className="flex gap-2 mt-2 flex-wrap">
                  {capturedMedia.map((img, idx) => (
                    <div key={idx} className="relative">
                      <img 
                        src={img} 
                        alt={`Photo ${idx + 1}`}
                        className="w-16 h-16 object-cover rounded-lg border border-white/10"
                      />
                      <button
                        onClick={() => setCapturedMedia(prev => prev.filter((_, i) => i !== idx))}
                        className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center"
                      >
                        <X className="w-3 h-3 text-white" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setShowIncidentForm(false)}
                className="flex-1 border-white/10 text-slate-300"
                data-testid="button-cancel-incident"
              >
                Cancel
              </Button>
              <GlowButton
                onClick={handleSubmitIncident}
                variant="amber"
                className="flex-1"
                disabled={!incidentType || !incidentDescription}
                data-testid="button-submit-incident"
              >
                Submit Report
              </GlowButton>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showMap} onOpenChange={setShowMap}>
        <DialogContent className="bg-slate-900/95 backdrop-blur-xl border-white/10 max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="text-white">Stadium Map</DialogTitle>
          </DialogHeader>
          <InteractiveMap />
        </DialogContent>
      </Dialog>

      <Dialog open={showDirections} onOpenChange={setShowDirections}>
        <DialogContent className="bg-slate-900/95 backdrop-blur-xl border-white/10 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Walking Directions</DialogTitle>
          </DialogHeader>
          <WalkingDirections defaultDestination={selectedDestination} />
        </DialogContent>
      </Dialog>
    </AnimatedBackground>
  );
}
