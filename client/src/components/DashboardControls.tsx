import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Settings2, Crown, Eye, EyeOff, Bell, BellOff, Users, 
  LayoutGrid, Sparkles, HelpCircle, X, Check, RotateCcw,
  Shield, Radio, MapPin, MessageSquare, Package, AlertTriangle,
  Thermometer, Bot, ChevronDown, ChevronUp, Zap, Lock, Globe, Maximize2
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CONFIGURABLE_ROLES, type DashboardConfig, type VenueGeofenceConfig } from "@shared/schema";
import { toast } from "sonner";

interface DashboardControlsProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenChange?: (open: boolean) => void;
}

const ROLE_DISPLAY_NAMES: Record<string, string> = {
  NPOWorker: "NPO Worker",
  StandLead: "Stand Lead",
  StandSupervisor: "Stand Supervisor",
  Bartender: "Bartender",
  AlcoholCompliance: "Alcohol Compliance",
  CheckInAssistant: "Check-in Assistant",
  ManagementCore: "Core Management",
  ManagementAssistant: "Assistant Manager",
  Warehouse: "Warehouse",
  Kitchen: "Kitchen",
  IT: "IT Staff",
};

const WIDGET_OPTIONS = [
  { key: "showEmergencyFeed", label: "Emergency Feed", icon: AlertTriangle, color: "text-red-400" },
  { key: "showDeliveries", label: "Deliveries", icon: Package, color: "text-amber-400" },
  { key: "showCompliance", label: "Compliance", icon: Shield, color: "text-purple-400" },
  { key: "showAiChat", label: "Orby AI", icon: Bot, color: "text-cyan-400" },
  { key: "showWeather", label: "Weather", icon: Thermometer, color: "text-sky-400" },
  { key: "showMap", label: "Stadium Map", icon: MapPin, color: "text-green-400" },
  { key: "showMessaging", label: "Messaging", icon: MessageSquare, color: "text-blue-400" },
  { key: "showInventory", label: "Inventory", icon: Package, color: "text-orange-400" },
];

const ALERT_LEVELS = [
  { value: "normal", label: "All Alerts", icon: Bell, description: "Receive all notifications" },
  { value: "priority-only", label: "Priority Only", icon: Zap, description: "Only critical alerts" },
  { value: "silent", label: "Silent Mode", icon: BellOff, description: "No notifications" },
];

const LAYOUT_PRESETS = [
  { value: "ops-lite", label: "Ops Lite", icon: LayoutGrid, description: "Simplified view for training" },
  { value: "standard", label: "Standard", icon: Sparkles, description: "Default balanced layout" },
  { value: "full-command", label: "Full Command", icon: Maximize2, description: "All panels visible" },
];

const GEOFENCE_PRESETS = [
  { value: "standard", label: "Standard Stadium", radiusFeet: 100, maxUsers: 500, description: "Regular games and concerts" },
  { value: "extended", label: "Extended Campus", radiusFeet: 1320, maxUsers: 750, description: "Parking lots and surrounding areas" },
  { value: "largeOutdoor", label: "Large Outdoor Event", radiusFeet: 2640, maxUsers: 1000, description: "CMA Fest, multi-day festivals" },
];

const formatRadius = (feet: number): string => {
  if (feet >= 5280) return `${(feet / 5280).toFixed(1)} miles`;
  if (feet >= 1000) return `${(feet / 5280).toFixed(2)} mi (${feet.toLocaleString()} ft)`;
  return `${feet} feet`;
};

const SectionHeader = ({ icon: Icon, title, color, expanded, onToggle, badge }: {
  icon: React.ElementType;
  title: string;
  color: string;
  expanded: boolean;
  onToggle: () => void;
  badge?: string;
}) => (
  <button
    onClick={onToggle}
    className="w-full px-4 py-3 flex items-center justify-between bg-slate-800/50 hover:bg-slate-800/70 transition-colors"
  >
    <div className="flex items-center gap-3">
      <div className={`p-1.5 rounded-lg ${color.replace('text-', 'bg-').replace('400', '500/20')}`}>
        <Icon className={`w-4 h-4 ${color}`} />
      </div>
      <span className="text-sm font-medium text-white">{title}</span>
      {badge && (
        <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
          {badge}
        </span>
      )}
    </div>
    {expanded ? (
      <ChevronUp className="w-4 h-4 text-slate-400" />
    ) : (
      <ChevronDown className="w-4 h-4 text-slate-400" />
    )}
  </button>
);

export function DashboardControls({ isOpen, onClose }: DashboardControlsProps) {
  const [selectedRole, setSelectedRole] = useState<string>("NPOWorker");
  const [showHelp, setShowHelp] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>("widgets");
  const [pendingChanges, setPendingChanges] = useState<Partial<DashboardConfig>>({});
  const queryClient = useQueryClient();

  const { data: configs = [], isLoading } = useQuery<DashboardConfig[]>({
    queryKey: ["/api/dashboard-configs"],
    refetchInterval: 30000,
  });

  const { data: currentConfig } = useQuery<DashboardConfig | null>({
    queryKey: ["/api/dashboard-configs", selectedRole],
    enabled: !!selectedRole,
  });

  const updateMutation = useMutation({
    mutationFn: async (updates: Partial<DashboardConfig>) => {
      const response = await fetch(`/api/dashboard-configs/${selectedRole}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!response.ok) throw new Error("Failed to update config");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard-configs"] });
      setPendingChanges({});
    },
  });

  const resetMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/dashboard-configs/${selectedRole}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to reset config");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard-configs"] });
    },
  });

  const { data: geofenceConfig } = useQuery<VenueGeofenceConfig>({
    queryKey: ["/api/geofence-config"],
  });

  const [selectedGeofencePreset, setSelectedGeofencePreset] = useState<string>("standard");

  useEffect(() => {
    if (geofenceConfig?.preset) {
      setSelectedGeofencePreset(geofenceConfig.preset);
    }
  }, [geofenceConfig]);

  const geofenceMutation = useMutation({
    mutationFn: async (preset: typeof GEOFENCE_PRESETS[0]) => {
      const userPin = sessionStorage.getItem('userPin') || localStorage.getItem('userPin');
      const userName = sessionStorage.getItem('userName') || localStorage.getItem('userName') || 'Unknown';
      const response = await fetch('/api/geofence-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userPin,
          userName,
          preset: preset.value,
          radiusFeet: preset.radiusFeet,
          maxConcurrentUsers: preset.maxUsers,
          eventName: preset.label
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update geofence config');
      }
      return { ...response.json(), presetLabel: preset.label };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/geofence-config'] });
      toast.success(`Geofence updated to ${variables.label}`, {
        description: `Radius: ${formatRadius(variables.radiusFeet)} • Capacity: ${variables.maxUsers.toLocaleString()} users`,
      });
    },
    onError: (error: Error) => {
      if (geofenceConfig?.preset) {
        setSelectedGeofencePreset(geofenceConfig.preset);
      }
      toast.error("Failed to update geofence", {
        description: error.message,
      });
    },
  });

  const handleGeofenceChange = (presetValue: string) => {
    const preset = GEOFENCE_PRESETS.find(p => p.value === presetValue);
    if (preset) {
      setSelectedGeofencePreset(presetValue);
      geofenceMutation.mutate(preset);
    }
  };

  const getConfigValue = (key: keyof DashboardConfig) => {
    if (pendingChanges[key] !== undefined) return pendingChanges[key];
    if (currentConfig && currentConfig[key] !== undefined) return currentConfig[key];
    if (key === "alertLevel") return "normal";
    if (key === "dataScope") return "assigned";
    if (key === "layoutPreset") return "standard";
    return true;
  };

  const handleChange = (key: keyof DashboardConfig, value: any) => {
    setPendingChanges(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    if (Object.keys(pendingChanges).length > 0) {
      updateMutation.mutate(pendingChanges);
    }
  };

  const handleReset = () => {
    resetMutation.mutate();
    setPendingChanges({});
  };

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="w-full max-w-lg max-h-[90vh] overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900/95 via-slate-800/95 to-slate-900/95 border border-cyan-500/30 shadow-2xl shadow-cyan-500/20"
        >
          {/* Header */}
          <div className="relative px-6 py-4 border-b border-cyan-500/20 bg-gradient-to-r from-cyan-600/20 via-transparent to-purple-600/20">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMtOS45NDEgMC0xOCA4LjA1OS0xOCAxOHM4LjA1OSAxOCAxOCAxOCAxOC04LjA1OSAxOC0xOC04LjA1OS0xOC0xOC0xOHoiIHN0cm9rZT0icmdiYSg2LCAxODIsIDIxMiwgMC4xKSIgc3Ryb2tlLXdpZHRoPSIyIi8+PC9nPjwvc3ZnPg==')] opacity-30" />
            
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-3">
                <motion.div
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  className="p-2 rounded-xl bg-gradient-to-br from-cyan-500/30 to-purple-500/30 border border-cyan-400/40"
                >
                  <Crown className="w-5 h-5 text-cyan-400" />
                </motion.div>
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    Dashboard Controls
                    <motion.span
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="text-xs px-2 py-0.5 rounded-full bg-gradient-to-r from-cyan-500/30 to-purple-500/30 border border-cyan-400/40 text-cyan-300"
                    >
                      SUPERPOWER
                    </motion.span>
                  </h2>
                  <p className="text-xs text-slate-400">Control what other users see</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowHelp(true)}
                  className="p-2 rounded-lg bg-slate-700/50 hover:bg-slate-700 text-slate-400 hover:text-cyan-400 transition-colors"
                  data-testid="dashboard-controls-help"
                >
                  <HelpCircle className="w-4 h-4" />
                </button>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg bg-slate-700/50 hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
                  data-testid="dashboard-controls-close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Role Selector - Bento Grid Layout */}
          <div className="px-4 py-4 border-b border-slate-700/50 bg-slate-800/30">
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-4 h-4 text-cyan-400" />
              <label className="text-xs font-medium text-slate-300">Configure Dashboard For:</label>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {CONFIGURABLE_ROLES.map((role) => (
                <button
                  key={role}
                  onClick={() => {
                    setSelectedRole(role);
                    setPendingChanges({});
                  }}
                  className={`h-10 px-2 text-xs rounded-lg transition-all flex items-center justify-center text-center ${
                    selectedRole === role
                      ? "bg-cyan-500/30 text-cyan-300 border border-cyan-400/50 font-medium"
                      : "bg-slate-700/50 text-slate-400 border border-slate-700/50 hover:border-slate-600 hover:bg-slate-700/70"
                  }`}
                  data-testid={`role-select-${role}`}
                >
                  {ROLE_DISPLAY_NAMES[role] || role}
                </button>
              ))}
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="overflow-y-auto max-h-[50vh] px-4 py-4 space-y-3">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <Settings2 className="w-6 h-6 text-cyan-400" />
                </motion.div>
              </div>
            ) : (
              <>
                {/* Widget Visibility Section */}
                <div className="rounded-xl border border-slate-700/50 overflow-hidden">
                  <SectionHeader
                    icon={LayoutGrid}
                    title="Widget Visibility"
                    color="text-cyan-400"
                    expanded={expandedSection === "widgets"}
                    onToggle={() => toggleSection("widgets")}
                  />
                  
                  <AnimatePresence>
                    {expandedSection === "widgets" && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="border-t border-slate-700/50"
                      >
                        <div className="p-3 grid grid-cols-2 gap-2">
                          {WIDGET_OPTIONS.map((widget) => {
                            const isVisible = getConfigValue(widget.key as keyof DashboardConfig);
                            const Icon = widget.icon;
                            return (
                              <button
                                key={widget.key}
                                onClick={() => handleChange(widget.key as keyof DashboardConfig, !isVisible)}
                                className={`h-14 flex items-center gap-3 px-3 rounded-lg transition-all ${
                                  isVisible
                                    ? "bg-slate-700/50 border border-cyan-500/30"
                                    : "bg-slate-800/30 border border-slate-700/30 opacity-60"
                                }`}
                                data-testid={`toggle-${widget.key}`}
                              >
                                <div className={`p-1.5 rounded-md ${isVisible ? widget.color.replace('text-', 'bg-').replace('400', '500/20') : 'bg-slate-700/50'}`}>
                                  <Icon className={`w-4 h-4 ${isVisible ? widget.color : "text-slate-500"}`} />
                                </div>
                                <span className={`text-xs flex-1 text-left ${isVisible ? "text-white" : "text-slate-500"}`}>
                                  {widget.label}
                                </span>
                                {isVisible ? (
                                  <Eye className="w-3.5 h-3.5 text-green-400 shrink-0" />
                                ) : (
                                  <EyeOff className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Alert Settings Section */}
                <div className="rounded-xl border border-slate-700/50 overflow-hidden">
                  <SectionHeader
                    icon={Bell}
                    title="Alert Settings"
                    color="text-amber-400"
                    expanded={expandedSection === "alerts"}
                    onToggle={() => toggleSection("alerts")}
                  />
                  
                  <AnimatePresence>
                    {expandedSection === "alerts" && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="border-t border-slate-700/50"
                      >
                        <div className="p-3 grid grid-cols-3 gap-2">
                          {ALERT_LEVELS.map((level) => {
                            const isSelected = getConfigValue("alertLevel") === level.value;
                            const Icon = level.icon;
                            return (
                              <button
                                key={level.value}
                                onClick={() => handleChange("alertLevel", level.value)}
                                className={`h-20 flex flex-col items-center justify-center gap-2 p-2 rounded-lg transition-all ${
                                  isSelected
                                    ? "bg-amber-500/20 border border-amber-500/40"
                                    : "bg-slate-800/30 border border-slate-700/30 hover:border-slate-600"
                                }`}
                                data-testid={`alert-level-${level.value}`}
                              >
                                <div className={`p-2 rounded-lg ${isSelected ? 'bg-amber-500/20' : 'bg-slate-700/50'}`}>
                                  <Icon className={`w-4 h-4 ${isSelected ? "text-amber-400" : "text-slate-400"}`} />
                                </div>
                                <div className="text-center">
                                  <div className={`text-xs font-medium ${isSelected ? "text-amber-300" : "text-slate-300"}`}>
                                    {level.label}
                                  </div>
                                </div>
                                {isSelected && (
                                  <div className="absolute top-1 right-1">
                                    <Check className="w-3 h-3 text-amber-400" />
                                  </div>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Data Scope Section */}
                <div className="rounded-xl border border-slate-700/50 overflow-hidden">
                  <SectionHeader
                    icon={Users}
                    title="Data Scope"
                    color="text-green-400"
                    expanded={expandedSection === "scope"}
                    onToggle={() => toggleSection("scope")}
                  />
                  
                  <AnimatePresence>
                    {expandedSection === "scope" && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="border-t border-slate-700/50"
                      >
                        <div className="p-3 space-y-3">
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              onClick={() => handleChange("dataScope", "assigned")}
                              className={`h-16 flex flex-col items-center justify-center gap-1.5 rounded-lg transition-all ${
                                getConfigValue("dataScope") === "assigned"
                                  ? "bg-green-500/20 border border-green-500/40 text-green-300"
                                  : "bg-slate-800/30 border border-slate-700/30 text-slate-400 hover:border-slate-600"
                              }`}
                              data-testid="scope-assigned"
                            >
                              <div className={`p-1.5 rounded-lg ${getConfigValue("dataScope") === "assigned" ? 'bg-green-500/20' : 'bg-slate-700/50'}`}>
                                <Lock className="w-4 h-4" />
                              </div>
                              <span className="text-xs font-medium">Assigned Only</span>
                            </button>
                            <button
                              onClick={() => handleChange("dataScope", "all")}
                              className={`h-16 flex flex-col items-center justify-center gap-1.5 rounded-lg transition-all ${
                                getConfigValue("dataScope") === "all"
                                  ? "bg-green-500/20 border border-green-500/40 text-green-300"
                                  : "bg-slate-800/30 border border-slate-700/30 text-slate-400 hover:border-slate-600"
                              }`}
                              data-testid="scope-all"
                            >
                              <div className={`p-1.5 rounded-lg ${getConfigValue("dataScope") === "all" ? 'bg-green-500/20' : 'bg-slate-700/50'}`}>
                                <Radio className="w-4 h-4" />
                              </div>
                              <span className="text-xs font-medium">All Stands</span>
                            </button>
                          </div>
                          
                          <button
                            onClick={() => handleChange("showSensitiveMetrics", !getConfigValue("showSensitiveMetrics"))}
                            className={`w-full h-14 flex items-center justify-between px-4 rounded-lg transition-all ${
                              getConfigValue("showSensitiveMetrics")
                                ? "bg-purple-500/20 border border-purple-500/40"
                                : "bg-slate-800/30 border border-slate-700/30"
                            }`}
                            data-testid="toggle-sensitive-metrics"
                          >
                            <div className="flex items-center gap-3">
                              <div className={`p-1.5 rounded-lg ${getConfigValue("showSensitiveMetrics") ? 'bg-purple-500/20' : 'bg-slate-700/50'}`}>
                                <Shield className="w-4 h-4 text-purple-400" />
                              </div>
                              <span className="text-sm text-slate-300">Show Sensitive Metrics</span>
                            </div>
                            <div className={`w-10 h-5 rounded-full transition-all ${
                              getConfigValue("showSensitiveMetrics") ? "bg-purple-500" : "bg-slate-600"
                            }`}>
                              <motion.div
                                animate={{ x: getConfigValue("showSensitiveMetrics") ? 20 : 2 }}
                                className="w-4 h-4 mt-0.5 rounded-full bg-white shadow-sm"
                              />
                            </div>
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Layout Presets Section */}
                <div className="rounded-xl border border-slate-700/50 overflow-hidden">
                  <SectionHeader
                    icon={Sparkles}
                    title="Layout Presets"
                    color="text-purple-400"
                    expanded={expandedSection === "layout"}
                    onToggle={() => toggleSection("layout")}
                  />
                  
                  <AnimatePresence>
                    {expandedSection === "layout" && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="border-t border-slate-700/50"
                      >
                        <div className="p-3 grid grid-cols-3 gap-2">
                          {LAYOUT_PRESETS.map((preset) => {
                            const isSelected = getConfigValue("layoutPreset") === preset.value;
                            const Icon = preset.icon;
                            return (
                              <button
                                key={preset.value}
                                onClick={() => handleChange("layoutPreset", preset.value)}
                                className={`h-20 flex flex-col items-center justify-center gap-2 p-2 rounded-lg transition-all relative ${
                                  isSelected
                                    ? "bg-purple-500/20 border border-purple-500/40"
                                    : "bg-slate-800/30 border border-slate-700/30 hover:border-slate-600"
                                }`}
                                data-testid={`layout-${preset.value}`}
                              >
                                <div className={`p-2 rounded-lg ${isSelected ? 'bg-purple-500/20' : 'bg-slate-700/50'}`}>
                                  <Icon className={`w-4 h-4 ${isSelected ? "text-purple-400" : "text-slate-400"}`} />
                                </div>
                                <div className={`text-xs font-medium text-center ${isSelected ? "text-purple-300" : "text-slate-300"}`}>
                                  {preset.label}
                                </div>
                                {isSelected && (
                                  <div className="absolute top-1 right-1">
                                    <Check className="w-3 h-3 text-purple-400" />
                                  </div>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Venue Geofence Section */}
                <div className="rounded-xl border border-cyan-500/30 overflow-hidden bg-gradient-to-br from-cyan-500/5 to-transparent">
                  <SectionHeader
                    icon={Globe}
                    title="Venue Geofence"
                    color="text-cyan-400"
                    expanded={expandedSection === "geofence"}
                    onToggle={() => toggleSection("geofence")}
                    badge="Scalable"
                  />
                  
                  <AnimatePresence>
                    {expandedSection === "geofence" && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="border-t border-cyan-500/20"
                      >
                        <div className="p-3 space-y-3">
                          <p className="text-xs text-slate-400">
                            Configure geofence radius for different event types. Larger events like CMA Fest need extended coverage.
                          </p>
                          
                          <div className="grid grid-cols-1 gap-2">
                            {GEOFENCE_PRESETS.map((preset) => {
                              const isSelected = selectedGeofencePreset === preset.value;
                              return (
                                <button
                                  key={preset.value}
                                  onClick={() => handleGeofenceChange(preset.value)}
                                  disabled={geofenceMutation.isPending}
                                  className={`h-20 flex items-center gap-3 p-3 rounded-lg transition-all ${
                                    isSelected
                                      ? "bg-cyan-500/20 border border-cyan-500/40"
                                      : "bg-slate-800/30 border border-slate-700/30 hover:border-cyan-500/30"
                                  }`}
                                  data-testid={`geofence-${preset.value}`}
                                >
                                  <div className={`p-2 rounded-lg ${isSelected ? 'bg-cyan-500/20' : 'bg-slate-700/50'}`}>
                                    <Maximize2 className={`w-4 h-4 ${isSelected ? "text-cyan-400" : "text-slate-400"}`} />
                                  </div>
                                  <div className="text-left flex-1">
                                    <div className={`text-sm font-medium ${isSelected ? "text-cyan-300" : "text-slate-300"}`}>
                                      {preset.label}
                                    </div>
                                    <div className="text-xs text-slate-500">{preset.description}</div>
                                    <div className="flex gap-3 mt-1">
                                      <span className="text-xs text-cyan-400/70">
                                        {formatRadius(preset.radiusFeet)} radius
                                      </span>
                                      <span className="text-xs text-green-400/70">
                                        {preset.maxUsers.toLocaleString()} users
                                      </span>
                                    </div>
                                  </div>
                                  {isSelected && <Check className="w-4 h-4 text-cyan-400 shrink-0" />}
                                </button>
                              );
                            })}
                          </div>
                          
                          {geofenceConfig && (
                            <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/30">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-slate-400">Current Setting:</span>
                                <span className="text-cyan-300 font-medium">
                                  {formatRadius(geofenceConfig.radiusFeet || 100)}
                                </span>
                              </div>
                              {geofenceConfig.updatedByName && (
                                <div className="text-xs text-slate-500 mt-1">
                                  Last updated by {geofenceConfig.updatedByName}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            )}
          </div>

          {/* Footer Actions */}
          <div className="px-4 py-3 border-t border-slate-700/50 bg-slate-800/30">
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={handleReset}
                className="h-10 flex items-center justify-center gap-2 rounded-lg bg-slate-700/50 text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all text-sm"
                data-testid="reset-config"
              >
                <RotateCcw className="w-4 h-4" />
                Reset
              </button>
              <button
                onClick={onClose}
                className="h-10 rounded-lg bg-slate-700/50 text-slate-300 hover:bg-slate-700 transition-all text-sm"
                data-testid="cancel-config"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={Object.keys(pendingChanges).length === 0 || updateMutation.isPending}
                className={`h-10 flex items-center justify-center gap-2 rounded-lg text-sm font-medium transition-all ${
                  Object.keys(pendingChanges).length > 0
                    ? "bg-gradient-to-r from-cyan-500 to-cyan-600 text-white hover:from-cyan-400 hover:to-cyan-500 shadow-lg shadow-cyan-500/30"
                    : "bg-slate-700/50 text-slate-500 cursor-not-allowed"
                }`}
                data-testid="save-config"
              >
                {updateMutation.isPending ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <Settings2 className="w-4 h-4" />
                  </motion.div>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Apply
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>

        {/* Help Modal */}
        <AnimatePresence>
          {showHelp && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="absolute inset-0 flex items-center justify-center p-4 z-10"
            >
              <div className="w-full max-w-md rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 border border-cyan-500/30 p-6 shadow-2xl">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-xl bg-cyan-500/20 border border-cyan-400/40">
                    <Crown className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Your Superpower</h3>
                    <p className="text-xs text-cyan-400">Exclusive to Operations Manager</p>
                  </div>
                </div>
                
                <div className="space-y-3 text-sm text-slate-300">
                  <p>
                    <span className="text-cyan-400 font-medium">Dashboard Controls</span> gives you the power to customize what every role sees on their dashboard.
                  </p>
                  <ul className="space-y-2 ml-4">
                    <li className="flex items-start gap-2">
                      <Eye className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
                      <span>Toggle which panels are visible for each role</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Bell className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                      <span>Control notification levels per role</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Lock className="w-4 h-4 text-purple-400 mt-0.5 shrink-0" />
                      <span>Limit data access to assigned areas only</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Sparkles className="w-4 h-4 text-pink-400 mt-0.5 shrink-0" />
                      <span>Apply quick layout presets</span>
                    </li>
                  </ul>
                  <div className="mt-4 p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                    <p className="text-xs text-cyan-300">
                      <strong>Note:</strong> Only you can see and use these controls. Changes apply instantly across all user dashboards.
                    </p>
                  </div>
                </div>
                
                <button
                  onClick={() => setShowHelp(false)}
                  className="w-full mt-4 py-2 rounded-lg bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 transition-colors text-sm font-medium"
                  data-testid="close-help"
                >
                  Got it!
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
}
