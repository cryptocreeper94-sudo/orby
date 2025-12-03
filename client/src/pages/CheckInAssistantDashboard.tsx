import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  MessageSquare, Send, UserCircle, LogOut, Camera, Video,
  Clock, CheckCircle2, AlertCircle, Users, Map, Navigation,
  AlertTriangle, MapPin, X, Locate, Headphones, Shield,
  HelpCircle, Sparkles
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
  GlassCard,
  GlassCardHeader,
  GlassCardContent,
  GlowButton,
  StatusBadge,
  StatCard,
  PageHeader,
  AnimatedList,
  SectionHeader
} from '@/components/ui/premium';
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
  { id: '7', name: 'Megan', role: 'General Manager', department: 'Manager', isOnline: true },
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

export default function CheckInAssistantDashboard() {
  const [, setLocation] = useLocation();
  const currentUser = useStore((state) => state.currentUser);
  const logout = useStore((state) => state.logout);
  const [activeTab, setActiveTab] = useState('messages');
  
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

  return (
    <AnimatedBackground>
      <GlobalModeBar />
      <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-900/80 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div 
              className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/30"
              whileHover={{ scale: 1.05, rotate: 5 }}
            >
              <Headphones className="h-6 w-6 text-white" />
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

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        <ComplianceAlertPanel 
          userId={currentUser?.id} 
          userName={currentUser?.name} 
          isManager={false}
        />
        
        <div className="grid grid-cols-3 gap-3">
          <StatCard
            icon={<Users className="h-5 w-5" />}
            label="Managers Online"
            value={onlineManagers}
            subValue={`of ${MANAGERS.length}`}
            color="cyan"
            size="compact"
          />
          <StatCard
            icon={<MessageSquare className="h-5 w-5" />}
            label="Messages Sent"
            value={messages.length}
            color="blue"
            size="compact"
          />
          <StatCard
            icon={<AlertTriangle className="h-5 w-5" />}
            label="Incidents"
            value={incidents.length}
            color="amber"
            size="compact"
          />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid grid-cols-3 bg-slate-800/50 border border-white/10 rounded-xl p-1">
            <TabsTrigger 
              value="messages" 
              className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500/20 data-[state=active]:to-blue-500/20 data-[state=active]:text-cyan-400 data-[state=active]:border-cyan-500/30 transition-all"
              data-testid="tab-messages"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Messages
            </TabsTrigger>
            <TabsTrigger 
              value="incidents" 
              className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500/20 data-[state=active]:to-orange-500/20 data-[state=active]:text-amber-400 data-[state=active]:border-amber-500/30 transition-all"
              data-testid="tab-incidents"
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              Report
            </TabsTrigger>
            <TabsTrigger 
              value="map" 
              className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500/20 data-[state=active]:to-cyan-500/20 data-[state=active]:text-emerald-400 data-[state=active]:border-emerald-500/30 transition-all"
              data-testid="tab-map"
            >
              <Map className="h-4 w-4 mr-2" />
              Map
            </TabsTrigger>
          </TabsList>

          <TabsContent value="messages" className="space-y-4">
            <GlassCard gradient glow>
              <GlassCardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Contact a Manager</h3>
                    <p className="text-sm text-slate-400">Select who you need to reach</p>
                  </div>
                </div>
              </GlassCardHeader>
              <GlassCardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  {MANAGERS.map((manager) => (
                    <motion.button
                      key={manager.id}
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedManager(manager)}
                      className={`relative p-4 rounded-xl border overflow-hidden text-left transition-all ${
                        selectedManager?.id === manager.id
                          ? 'bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border-cyan-500/50 shadow-lg shadow-cyan-500/20'
                          : 'bg-slate-800/50 border-white/10 hover:border-white/20'
                      }`}
                      data-testid={`manager-${manager.id}`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <motion.span 
                          className={`w-2.5 h-2.5 rounded-full ${manager.isOnline ? 'bg-emerald-400' : 'bg-slate-500'}`}
                          animate={manager.isOnline ? { scale: [1, 1.3, 1], opacity: [1, 0.7, 1] } : {}}
                          transition={{ repeat: Infinity, duration: 2 }}
                        />
                        <span className="text-sm font-semibold text-white">{manager.name}</span>
                      </div>
                      <p className="text-xs text-slate-400">{manager.role}</p>
                      {selectedManager?.id === manager.id && (
                        <motion.div 
                          className="absolute top-2 right-2"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                        >
                          <CheckCircle2 className="h-4 w-4 text-cyan-400" />
                        </motion.div>
                      )}
                    </motion.button>
                  ))}
                </div>

                <AnimatePresence>
                  {selectedManager && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-4 overflow-hidden"
                    >
                      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30">
                        <Send className="h-4 w-4 text-cyan-400" />
                        <span className="text-sm text-cyan-400">To: {selectedManager.name} ({selectedManager.role})</span>
                      </div>
                      <Textarea
                        placeholder="Describe the situation or ask a question..."
                        value={messageContent}
                        onChange={(e) => setMessageContent(e.target.value)}
                        className="min-h-[100px] bg-slate-800/50 border-white/10 text-white placeholder:text-slate-500 focus:border-cyan-500/50 resize-none"
                        data-testid="message-input"
                      />
                      <div className="flex gap-3">
                        <GlowButton
                          onClick={handleSendMessage}
                          disabled={!messageContent.trim() || isSending}
                          variant="cyan"
                          className="flex-1"
                          data-testid="button-send-message"
                        >
                          <Send className="h-4 w-4" />
                          Send Message
                        </GlowButton>
                        <Button
                          variant="outline"
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
              </GlassCardContent>
            </GlassCard>

            {messages.length > 0 && (
              <GlassCard>
                <GlassCardHeader>
                  <SectionHeader icon={<Clock className="h-4 w-4" />} title="Recent Messages" />
                </GlassCardHeader>
                <GlassCardContent>
                  <AnimatedList>
                    {messages.map((message) => (
                      <motion.div 
                        key={message.id} 
                        className="p-4 bg-slate-800/30 rounded-xl border border-white/5"
                        whileHover={{ x: 4 }}
                        data-testid={`message-item-${message.id}`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">
                            To: {message.recipient}
                          </Badge>
                          <div className="flex items-center gap-1.5 text-xs text-slate-500">
                            {getStatusIcon(message.status)}
                            <span>{message.sentAt}</span>
                          </div>
                        </div>
                        <p className="text-sm text-slate-300">{message.content}</p>
                      </motion.div>
                    ))}
                  </AnimatedList>
                </GlassCardContent>
              </GlassCard>
            )}
          </TabsContent>

          <TabsContent value="incidents" className="space-y-4">
            <GlassCard gradient glow>
              <GlassCardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600">
                      <AlertTriangle className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">Report an Incident</h3>
                      <p className="text-sm text-slate-400">Document issues with photos & details</p>
                    </div>
                  </div>
                  {!showIncidentForm && (
                    <GlowButton
                      onClick={() => setShowIncidentForm(true)}
                      variant="amber"
                      size="sm"
                      data-testid="button-new-incident"
                    >
                      New Report
                    </GlowButton>
                  )}
                </div>
              </GlassCardHeader>
              <GlassCardContent>
                <AnimatePresence mode="wait">
                  {showIncidentForm ? (
                    <motion.div
                      key="form"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="space-y-5"
                    >
                      <div>
                        <label className="text-xs text-slate-400 mb-3 block font-medium">Incident Type</label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
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
                                <div className={`w-10 h-10 rounded-lg mx-auto mb-2 flex items-center justify-center bg-gradient-to-br ${type.color}`}>
                                  <TypeIcon className="h-5 w-5 text-white" />
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
                            className="border-white/10 hover:bg-white/5"
                            data-testid="button-use-gps"
                          >
                            <Locate className="h-4 w-4" />
                          </Button>
                        </div>
                        {currentLocation && (
                          <motion.p 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-xs text-emerald-400 mt-2 flex items-center gap-1"
                          >
                            <MapPin className="h-3 w-3" />
                            GPS: {currentLocation}
                          </motion.p>
                        )}
                      </div>

                      <div>
                        <label className="text-xs text-slate-400 mb-2 block font-medium">Description</label>
                        <Textarea
                          placeholder="Describe what happened in detail..."
                          value={incidentDescription}
                          onChange={(e) => setIncidentDescription(e.target.value)}
                          className="min-h-[100px] bg-slate-800/50 border-white/10 text-white placeholder:text-slate-500 resize-none"
                          data-testid="incident-description"
                        />
                      </div>

                      <div>
                        <label className="text-xs text-slate-400 mb-2 block font-medium">Add Photo/Video Evidence</label>
                        <div className="flex gap-2">
                          <input
                            type="file"
                            ref={fileInputRef}
                            accept="image/*,video/*"
                            capture="environment"
                            multiple
                            onChange={handleFileUpload}
                            className="hidden"
                          />
                          <Button
                            variant="outline"
                            onClick={() => fileInputRef.current?.click()}
                            className="flex-1 border-white/10 hover:bg-white/5"
                            data-testid="button-add-media"
                          >
                            <Camera className="h-4 w-4 mr-2" />
                            Take Photo
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => {
                              if (fileInputRef.current) {
                                fileInputRef.current.accept = 'video/*';
                                fileInputRef.current.click();
                              }
                            }}
                            className="flex-1 border-white/10 hover:bg-white/5"
                            data-testid="button-add-video"
                          >
                            <Video className="h-4 w-4 mr-2" />
                            Record Video
                          </Button>
                        </div>
                        {capturedMedia.length > 0 && (
                          <div className="flex gap-2 mt-3 overflow-x-auto pb-2">
                            {capturedMedia.map((media, idx) => (
                              <motion.div 
                                key={idx} 
                                className="relative w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden border-2 border-white/10"
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                              >
                                <img src={media} className="w-full h-full object-cover" />
                                <button
                                  onClick={() => setCapturedMedia(prev => prev.filter((_, i) => i !== idx))}
                                  className="absolute top-1 right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center shadow-lg"
                                >
                                  <X className="h-3 w-3 text-white" />
                                </button>
                              </motion.div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex gap-3 pt-2">
                        <GlowButton
                          onClick={handleSubmitIncident}
                          disabled={!incidentType || !incidentDescription}
                          variant="amber"
                          className="flex-1"
                          data-testid="button-submit-incident"
                        >
                          Submit Report
                        </GlowButton>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setShowIncidentForm(false);
                            setIncidentType('');
                            setIncidentDescription('');
                            setCapturedMedia([]);
                          }}
                          className="border-white/10 text-slate-300 hover:bg-white/5"
                          data-testid="button-cancel-incident"
                        >
                          Cancel
                        </Button>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div 
                      key="empty"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center py-8"
                    >
                      <div className="w-16 h-16 rounded-2xl bg-slate-800/50 mx-auto mb-4 flex items-center justify-center">
                        <AlertTriangle className="h-8 w-8 text-slate-600" />
                      </div>
                      <p className="text-slate-500">Tap "New Report" to document an incident</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </GlassCardContent>
            </GlassCard>

            {incidents.length > 0 && (
              <GlassCard>
                <GlassCardHeader>
                  <SectionHeader icon={<AlertCircle className="h-4 w-4" />} title="Your Reports" />
                </GlassCardHeader>
                <GlassCardContent>
                  <AnimatedList>
                    {incidents.map((incident) => (
                      <motion.div 
                        key={incident.id} 
                        className="p-4 bg-slate-800/30 rounded-xl border border-white/5"
                        whileHover={{ x: 4 }}
                        data-testid={`incident-item-${incident.id}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <StatusBadge status={incident.status} pulse={incident.status === 'reported'} />
                              {incident.hasMedia && (
                                <Badge variant="outline" className="text-xs">
                                  <Camera className="h-3 w-3 mr-1" />
                                  Media
                                </Badge>
                              )}
                            </div>
                            <h4 className="font-semibold text-white mb-1">{incident.type}</h4>
                            <p className="text-sm text-slate-400 mb-2">{incident.description}</p>
                            <p className="text-xs text-slate-500 flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {incident.location}
                            </p>
                          </div>
                          <span className="text-xs text-slate-500">{incident.reportedAt}</span>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatedList>
                </GlassCardContent>
              </GlassCard>
            )}
          </TabsContent>

          <TabsContent value="map" className="space-y-4">
            <GlassCard gradient glow>
              <GlassCardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-600">
                    <Navigation className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Find a Location</h3>
                    <p className="text-sm text-slate-400">Help guests navigate the stadium</p>
                  </div>
                </div>
              </GlassCardHeader>
              <GlassCardContent className="space-y-5">
                <div className="grid grid-cols-2 gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowMap(true)}
                    className="h-24 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 hover:border-cyan-500/50 flex flex-col items-center justify-center gap-2 transition-all"
                    data-testid="button-open-map"
                  >
                    <Map className="h-8 w-8 text-cyan-400" />
                    <span className="text-sm font-medium text-white">Stadium Map</span>
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowDirections(true)}
                    className="h-24 rounded-xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 hover:border-emerald-500/50 flex flex-col items-center justify-center gap-2 transition-all"
                    data-testid="button-get-directions"
                  >
                    <Navigation className="h-8 w-8 text-emerald-400" />
                    <span className="text-sm font-medium text-white">Get Directions</span>
                  </motion.button>
                </div>

                <div>
                  <label className="text-xs text-slate-400 mb-3 block font-medium">Quick Destinations</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['Restrooms', 'Guest Services', 'First Aid', 'Concessions', 'Elevators', 'Exits'].map((dest) => (
                      <motion.button
                        key={dest}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          setSelectedDestination(dest);
                          setShowDirections(true);
                        }}
                        className="p-2.5 rounded-lg bg-slate-800/50 border border-white/10 hover:border-white/20 text-xs font-medium text-slate-300 transition-all"
                        data-testid={`quick-dest-${dest.toLowerCase()}`}
                      >
                        {dest}
                      </motion.button>
                    ))}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-800/50 border border-white/10">
                  <div className="flex items-center gap-2 mb-2">
                    <Locate className="h-4 w-4 text-cyan-400" />
                    <span className="text-sm font-medium text-white">Your Location</span>
                  </div>
                  {gpsLoading ? (
                    <p className="text-xs text-slate-400">Detecting location...</p>
                  ) : isOnSite ? (
                    <p className="text-xs text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      You are at Nissan Stadium
                    </p>
                  ) : (
                    <Button
                      onClick={requestLocation}
                      variant="outline"
                      size="sm"
                      className="border-white/10 text-slate-300 hover:bg-white/5"
                      data-testid="button-enable-gps"
                    >
                      <Locate className="h-3 w-3 mr-2" />
                      Enable GPS
                    </Button>
                  )}
                </div>
              </GlassCardContent>
            </GlassCard>

            <GlassCard className="bg-gradient-to-r from-cyan-500/5 to-blue-500/5">
              <GlassCardContent className="py-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-cyan-500/20">
                    <HelpCircle className="h-4 w-4 text-cyan-400" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white mb-2">Guest Assistance Tips</h4>
                    <ul className="text-xs text-slate-400 space-y-1.5">
                      <li className="flex items-start gap-2">
                        <span className="text-cyan-400">•</span>
                        Use the interactive map to show guests their destination
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-cyan-400">•</span>
                        Walking directions include step-by-step guidance
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-cyan-400">•</span>
                        Elevators are available at each gate for accessibility
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-cyan-400">•</span>
                        Guest Services is located at North and South plazas
                      </li>
                    </ul>
                  </div>
                </div>
              </GlassCardContent>
            </GlassCard>
          </TabsContent>
        </Tabs>
      </main>

      <Dialog open={showMap} onOpenChange={setShowMap}>
        <DialogContent className="max-w-4xl h-[85vh] p-0 bg-slate-900 border-white/10">
          <DialogHeader className="p-4 border-b border-white/10">
            <DialogTitle className="text-white flex items-center gap-2">
              <Map className="h-5 w-5 text-cyan-400" />
              Nissan Stadium Map
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="flex-1">
            <InteractiveMap />
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <Dialog open={showDirections} onOpenChange={setShowDirections}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-hidden bg-slate-900 border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Navigation className="h-5 w-5 text-emerald-400" />
              Walking Directions
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[calc(85vh-100px)]">
            <WalkingDirections 
              userLocation={gpsLocation ? { lat: gpsLocation.coords.latitude, lng: gpsLocation.coords.longitude } : null}
              defaultDestination={selectedDestination}
              onClose={() => {
                setShowDirections(false);
                setSelectedDestination('');
              }}
            />
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </AnimatedBackground>
  );
}
