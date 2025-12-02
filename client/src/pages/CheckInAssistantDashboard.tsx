import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  MessageSquare, Send, UserCircle, LogOut, Camera, Video,
  Clock, CheckCircle2, AlertCircle, Users, Map, Navigation,
  AlertTriangle, Phone, MapPin, X, Upload, Locate, ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  useGeolocation, 
  isWithinGeofence,
  STADIUM_LOCATION,
  GEOFENCE_RADIUS_FEET 
} from '@/components/LocationAcknowledgement';
import { InteractiveMap, STADIUM_SECTIONS, STADIUM_ZONES } from '@/components/InteractiveMap';
import { WalkingDirections } from '@/components/WalkingDirections';
import { useStore } from '@/lib/mockData';
import { toast } from 'sonner';

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
  { id: '1', name: 'Brooke K', role: 'HR Manager', isOnline: true },
  { id: '2', name: 'David', role: 'Operations', isOnline: true },
  { id: '3', name: 'Jay', role: 'Warehouse', isOnline: false },
  { id: '4', name: 'Chef Deb', role: 'Kitchen', isOnline: true },
  { id: '5', name: 'Darby', role: 'Bar Manager', isOnline: false },
  { id: '6', name: 'Shelia', role: 'Operations', isOnline: true },
  { id: '7', name: 'Megan', role: 'Manager', isOnline: true },
];

const INCIDENT_TYPES = [
  { id: 'customer_complaint', label: 'Customer Complaint', icon: '😤' },
  { id: 'lost_item', label: 'Lost & Found', icon: '🔍' },
  { id: 'safety_hazard', label: 'Safety Hazard', icon: '⚠️' },
  { id: 'medical', label: 'Medical Issue', icon: '🏥' },
  { id: 'spill', label: 'Spill/Cleanup', icon: '🧹' },
  { id: 'disturbance', label: 'Guest Disturbance', icon: '🚨' },
  { id: 'other', label: 'Other', icon: '📝' },
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <header className="bg-slate-800/80 backdrop-blur-lg border-b border-slate-700/50 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
              <UserCircle className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Check-in Assistant</h1>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${isOnSite ? 'bg-emerald-400' : 'bg-amber-400'}`} />
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
            className="text-slate-400 hover:text-white"
            data-testid="button-logout"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid grid-cols-3 bg-slate-800/50 border border-slate-700/50">
            <TabsTrigger value="messages" className="data-[state=active]:bg-cyan-500/20" data-testid="tab-messages">
              <MessageSquare className="h-4 w-4 mr-2" />
              Messages
            </TabsTrigger>
            <TabsTrigger value="incidents" className="data-[state=active]:bg-cyan-500/20" data-testid="tab-incidents">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Report
            </TabsTrigger>
            <TabsTrigger value="map" className="data-[state=active]:bg-cyan-500/20" data-testid="tab-map">
              <Map className="h-4 w-4 mr-2" />
              Map
            </TabsTrigger>
          </TabsList>

          <TabsContent value="messages" className="space-y-4">
            <Card className="bg-slate-800/50 border-cyan-500/20 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-white flex items-center gap-2 text-base">
                  <Users className="h-5 w-5 text-cyan-400" />
                  Contact a Manager
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  {MANAGERS.map((manager) => (
                    <motion.button
                      key={manager.id}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedManager(manager)}
                      className={`p-3 rounded-xl border transition-all text-left ${
                        selectedManager?.id === manager.id
                          ? 'bg-cyan-500/20 border-cyan-500/50'
                          : 'bg-slate-700/30 border-slate-600/30 active:border-slate-500/50'
                      }`}
                      data-testid={`manager-${manager.id}`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`w-2 h-2 rounded-full ${manager.isOnline ? 'bg-emerald-400' : 'bg-slate-500'}`} />
                        <span className="text-sm font-medium text-white truncate">{manager.name}</span>
                      </div>
                      <p className="text-xs text-slate-400 truncate">{manager.role}</p>
                    </motion.button>
                  ))}
                </div>

                <AnimatePresence>
                  {selectedManager && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-3"
                    >
                      <div className="flex items-center gap-2 text-sm text-cyan-400">
                        <Send className="h-4 w-4" />
                        <span>To: {selectedManager.name}</span>
                      </div>
                      <Textarea
                        placeholder="Describe the situation..."
                        value={messageContent}
                        onChange={(e) => setMessageContent(e.target.value)}
                        className="min-h-[80px] bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500"
                        data-testid="message-input"
                      />
                      <div className="flex gap-2">
                        <Button
                          onClick={handleSendMessage}
                          disabled={!messageContent.trim() || isSending}
                          className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600"
                          data-testid="button-send"
                        >
                          <Send className="h-4 w-4 mr-2" />
                          Send
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setSelectedManager(null)}
                          className="border-slate-600 text-slate-300"
                          data-testid="button-cancel"
                        >
                          Cancel
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>

            {messages.length > 0 && (
              <Card className="bg-slate-800/50 border-slate-700/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-white text-sm flex items-center gap-2">
                    <Clock className="h-4 w-4 text-slate-400" />
                    Recent Messages
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {messages.map((message) => (
                    <div key={message.id} className="p-3 bg-slate-700/30 rounded-lg border border-slate-600/30" data-testid={`message-item-${message.id}`}>
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <Badge variant="outline" className="bg-cyan-500/10 text-cyan-400 border-cyan-500/30 text-xs">
                          To: {message.recipient}
                        </Badge>
                        <div className="flex items-center gap-1 text-xs text-slate-500">
                          {getStatusIcon(message.status)}
                          <span>{message.sentAt}</span>
                        </div>
                      </div>
                      <p className="text-sm text-slate-300">{message.content}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="incidents" className="space-y-4">
            <Card className="bg-slate-800/50 border-cyan-500/20">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white flex items-center gap-2 text-base">
                    <AlertTriangle className="h-5 w-5 text-amber-400" />
                    Report an Incident
                  </CardTitle>
                  {!showIncidentForm && (
                    <Button
                      onClick={() => setShowIncidentForm(true)}
                      size="sm"
                      className="bg-amber-500 hover:bg-amber-400"
                      data-testid="button-new-incident"
                    >
                      New Report
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <AnimatePresence>
                  {showIncidentForm ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="space-y-4"
                    >
                      <div>
                        <label className="text-xs text-slate-400 mb-2 block">Incident Type</label>
                        <div className="grid grid-cols-3 gap-2">
                          {INCIDENT_TYPES.map((type) => (
                            <button
                              key={type.id}
                              onClick={() => setIncidentType(type.id)}
                              className={`p-2 rounded-lg border text-center transition-all ${
                                incidentType === type.id
                                  ? 'bg-amber-500/20 border-amber-500/50'
                                  : 'bg-slate-700/30 border-slate-600/30'
                              }`}
                              data-testid={`incident-type-${type.id}`}
                            >
                              <span className="text-xl block mb-1">{type.icon}</span>
                              <span className="text-xs text-slate-300">{type.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="text-xs text-slate-400 mb-2 block">Location</label>
                        <div className="flex gap-2">
                          <Select value={incidentLocation} onValueChange={setIncidentLocation}>
                            <SelectTrigger className="flex-1 bg-slate-700/50 border-slate-600" data-testid="select-incident-location">
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
                            className="border-slate-600"
                            data-testid="button-use-gps"
                          >
                            <Locate className="h-4 w-4" />
                          </Button>
                        </div>
                        {currentLocation && (
                          <p className="text-xs text-emerald-400 mt-1">
                            <MapPin className="h-3 w-3 inline mr-1" />
                            GPS: {currentLocation}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="text-xs text-slate-400 mb-2 block">Description</label>
                        <Textarea
                          placeholder="Describe what happened..."
                          value={incidentDescription}
                          onChange={(e) => setIncidentDescription(e.target.value)}
                          className="min-h-[80px] bg-slate-700/50 border-slate-600 text-white"
                          data-testid="incident-description"
                        />
                      </div>

                      <div>
                        <label className="text-xs text-slate-400 mb-2 block">Add Photo/Video</label>
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
                            className="flex-1 border-slate-600"
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
                            className="flex-1 border-slate-600"
                            data-testid="button-add-video"
                          >
                            <Video className="h-4 w-4 mr-2" />
                            Record Video
                          </Button>
                        </div>
                        {capturedMedia.length > 0 && (
                          <div className="flex gap-2 mt-2 overflow-x-auto">
                            {capturedMedia.map((media, idx) => (
                              <div key={idx} className="relative w-16 h-16 flex-shrink-0">
                                <img src={media} className="w-full h-full object-cover rounded-lg" />
                                <button
                                  onClick={() => setCapturedMedia(prev => prev.filter((_, i) => i !== idx))}
                                  className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center"
                                >
                                  <X className="h-3 w-3 text-white" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Button
                          onClick={handleSubmitIncident}
                          disabled={!incidentType || !incidentDescription}
                          className="flex-1 bg-amber-500 hover:bg-amber-400"
                          data-testid="button-submit-incident"
                        >
                          Submit Report
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setShowIncidentForm(false);
                            setIncidentType('');
                            setIncidentDescription('');
                            setCapturedMedia([]);
                          }}
                          className="border-slate-600"
                          data-testid="button-cancel-incident"
                        >
                          Cancel
                        </Button>
                      </div>
                    </motion.div>
                  ) : (
                    <div className="text-center py-6 text-slate-500">
                      <AlertTriangle className="h-10 w-10 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">Tap "New Report" to report an incident</p>
                    </div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>

            {incidents.length > 0 && (
              <Card className="bg-slate-800/50 border-slate-700/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-white text-sm">Your Reports</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {incidents.map((incident) => (
                    <div key={incident.id} className="p-3 bg-slate-700/30 rounded-lg border border-slate-600/30" data-testid={`incident-item-${incident.id}`}>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
                              {incident.type}
                            </Badge>
                            {incident.hasMedia && (
                              <Camera className="h-3 w-3 text-slate-400" />
                            )}
                          </div>
                          <p className="text-sm text-slate-300">{incident.description}</p>
                          <p className="text-xs text-slate-500 mt-1">
                            <MapPin className="h-3 w-3 inline mr-1" />
                            {incident.location}
                          </p>
                        </div>
                        <div className="text-xs text-slate-500">{incident.reportedAt}</div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="map" className="space-y-4">
            <Card className="bg-slate-800/50 border-cyan-500/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-white flex items-center gap-2 text-base">
                  <Navigation className="h-5 w-5 text-cyan-400" />
                  Find a Location
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    onClick={() => setShowMap(true)}
                    className="h-20 flex-col gap-2 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 hover:border-cyan-500/50"
                    variant="outline"
                    data-testid="button-open-map"
                  >
                    <Map className="h-6 w-6 text-cyan-400" />
                    <span className="text-white">Stadium Map</span>
                  </Button>
                  <Button
                    onClick={() => setShowDirections(true)}
                    className="h-20 flex-col gap-2 bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 hover:border-emerald-500/50"
                    variant="outline"
                    data-testid="button-get-directions"
                  >
                    <Navigation className="h-6 w-6 text-emerald-400" />
                    <span className="text-white">Get Directions</span>
                  </Button>
                </div>

                <div>
                  <label className="text-xs text-slate-400 mb-2 block">Quick Destinations</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['Restrooms', 'Guest Services', 'First Aid', 'Concessions', 'Elevators', 'Exits'].map((dest) => (
                      <Button
                        key={dest}
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedDestination(dest);
                          setShowDirections(true);
                        }}
                        className="border-slate-600 text-slate-300 text-xs"
                        data-testid={`quick-dest-${dest.toLowerCase()}`}
                      >
                        {dest}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="p-3 bg-slate-700/30 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Locate className="h-4 w-4 text-cyan-400" />
                    <span className="text-sm font-medium text-white">Your Location</span>
                  </div>
                  {gpsLoading ? (
                    <p className="text-xs text-slate-400">Detecting location...</p>
                  ) : isOnSite ? (
                    <p className="text-xs text-emerald-400">You are at Nissan Stadium</p>
                  ) : (
                    <Button
                      onClick={requestLocation}
                      variant="outline"
                      size="sm"
                      className="border-slate-600 text-slate-300"
                      data-testid="button-enable-gps"
                    >
                      <Locate className="h-3 w-3 mr-2" />
                      Enable GPS
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border-cyan-500/20">
              <CardContent className="py-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-medium text-white mb-1">Guest Assistance Tips</h3>
                    <ul className="text-xs text-slate-400 space-y-1">
                      <li>• Use the interactive map to show guests their destination</li>
                      <li>• Walking directions include step-by-step guidance</li>
                      <li>• Elevators are available at each gate for accessibility</li>
                      <li>• Guest Services is located at the North and South plazas</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <Dialog open={showMap} onOpenChange={setShowMap}>
        <DialogContent className="max-w-4xl h-[80vh] p-0 bg-slate-900 border-slate-700">
          <DialogHeader className="p-4 border-b border-slate-700">
            <DialogTitle className="text-white flex items-center gap-2">
              <Map className="h-5 w-5 text-cyan-400" />
              Nissan Stadium Map
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-hidden">
            <InteractiveMap />
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showDirections} onOpenChange={setShowDirections}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto bg-slate-900 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Navigation className="h-5 w-5 text-emerald-400" />
              Walking Directions
            </DialogTitle>
          </DialogHeader>
          <WalkingDirections 
            userLocation={gpsLocation ? { lat: gpsLocation.coords.latitude, lng: gpsLocation.coords.longitude } : null}
            defaultDestination={selectedDestination}
            onClose={() => {
              setShowDirections(false);
              setSelectedDestination('');
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
