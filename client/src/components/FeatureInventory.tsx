import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle, ChevronDown, ChevronRight, ExternalLink, Rocket } from "lucide-react";

interface FeatureItem {
  id: string;
  name: string;
  description: string;
  status: "complete" | "partial" | "planned";
  route?: string;
}

interface FeatureCategory {
  name: string;
  icon: string;
  color: string;
  features: FeatureItem[];
}

const FEATURE_CATEGORIES: FeatureCategory[] = [
  {
    name: "Authentication & Roles",
    icon: "🔐",
    color: "purple",
    features: [
      { id: "auth-1", name: "Multi-Role Login", description: "12+ role types with unique dashboards", status: "complete", route: "/" },
      { id: "auth-2", name: "Role-Based Routing", description: "Automatic redirect to appropriate dashboard", status: "complete" },
      { id: "auth-3", name: "Sandbox Mode", description: "Developer toggle for testing all roles", status: "complete" },
      { id: "auth-4", name: "Session Management", description: "Secure login/logout with state persistence", status: "complete" },
    ]
  },
  {
    name: "Command Center",
    icon: "🎮",
    color: "cyan",
    features: [
      { id: "cmd-1", name: "Emergency Command Center", description: "All-seeing ops dashboard for managers", status: "complete", route: "/command" },
      { id: "cmd-2", name: "Live Status Grid", description: "Real-time stand status monitoring", status: "complete" },
      { id: "cmd-3", name: "Department Queue View", description: "Warehouse, Kitchen, Bar, IT queues", status: "complete" },
      { id: "cmd-4", name: "Emergency Alerts", description: "Priority escalation system", status: "complete" },
    ]
  },
  {
    name: "Role Dashboards",
    icon: "📊",
    color: "blue",
    features: [
      { id: "dash-1", name: "Manager Dashboard", description: "Full ops overview with delivery tracking", status: "complete", route: "/manager" },
      { id: "dash-2", name: "Supervisor Dashboard", description: "Section management with stand grid", status: "complete", route: "/supervisor" },
      { id: "dash-3", name: "Stand Lead Dashboard", description: "Stand-level operations view", status: "complete", route: "/stand-lead" },
      { id: "dash-4", name: "Warehouse Dashboard", description: "Inventory and delivery fulfillment", status: "complete", route: "/warehouse" },
      { id: "dash-5", name: "Kitchen Dashboard", description: "Food prep and order management", status: "complete", route: "/kitchen" },
      { id: "dash-6", name: "IT Dashboard", description: "Tech support ticket management", status: "complete", route: "/it" },
      { id: "dash-7", name: "NPO Worker Dashboard", description: "Frontline staff check-in and tasks", status: "complete", route: "/npo" },
      { id: "dash-8", name: "Admin Dashboard", description: "System administration and staffing", status: "complete", route: "/admin" },
      { id: "dash-9", name: "Developer Dashboard", description: "Dev tools with role switcher", status: "complete", route: "/developer" },
    ]
  },
  {
    name: "Delivery Tracking",
    icon: "🚚",
    color: "green",
    features: [
      { id: "del-1", name: "Request System", description: "Create delivery requests to any department", status: "complete" },
      { id: "del-2", name: "Status Lifecycle", description: "Requested → Approved → Picking → On the Way → Delivered", status: "complete" },
      { id: "del-3", name: "ETA Tracking", description: "Real-time estimated delivery times", status: "complete" },
      { id: "del-4", name: "Department Routing", description: "Auto-route to Warehouse, Kitchen, Bar, IT", status: "complete" },
      { id: "del-5", name: "Priority Levels", description: "Normal vs Emergency request handling", status: "complete" },
    ]
  },
  {
    name: "Inventory Management",
    icon: "📦",
    color: "orange",
    features: [
      { id: "inv-1", name: "Count Sessions", description: "Pre-Event, Post-Event, Day After counting", status: "complete" },
      { id: "inv-2", name: "AI Cooler Scanning", description: "GPT-4o Vision auto-count from photos", status: "complete" },
      { id: "inv-3", name: "OCR Paper Scanning", description: "Tesseract.js for handwritten sheets", status: "complete" },
      { id: "inv-4", name: "Item Database", description: "Full product catalog with categories", status: "complete" },
      { id: "inv-5", name: "Stock Level Tracking", description: "Monitor inventory across all stands", status: "complete" },
    ]
  },
  {
    name: "Alcohol Compliance",
    icon: "🍺",
    color: "red",
    features: [
      { id: "alc-1", name: "Compliance Dashboard", description: "Vendor monitoring and status tracking", status: "complete", route: "/alcohol-compliance" },
      { id: "alc-2", name: "Violation Reporting", description: "Report issues with photo/video evidence", status: "complete" },
      { id: "alc-3", name: "Vendor Status Grid", description: "Active, Warning, Violation status view", status: "complete" },
      { id: "alc-4", name: "Evidence Capture", description: "Camera integration for documentation", status: "complete" },
    ]
  },
  {
    name: "Communication",
    icon: "💬",
    color: "indigo",
    features: [
      { id: "com-1", name: "Real-Time Messaging", description: "WebSocket-powered live chat", status: "complete", route: "/messages" },
      { id: "com-2", name: "Department Routing", description: "Auto-route messages to right team", status: "complete" },
      { id: "com-3", name: "Quick Messages", description: "Pre-built responses for common situations", status: "complete" },
      { id: "com-4", name: "Broadcast System", description: "Send alerts to all staff", status: "partial" },
      { id: "com-5", name: "Message History", description: "Full audit trail of communications", status: "complete" },
    ]
  },
  {
    name: "Stadium Operations",
    icon: "🏟️",
    color: "emerald",
    features: [
      { id: "ops-1", name: "Interactive Map", description: "Visual stadium layout with sections", status: "complete" },
      { id: "ops-2", name: "Walking Directions", description: "Turn-by-turn navigation for staff", status: "complete" },
      { id: "ops-3", name: "Geofencing", description: "Location verification for check-ins", status: "complete" },
      { id: "ops-4", name: "Stand Assignment", description: "Visual section/supervisor assignment", status: "complete" },
      { id: "ops-5", name: "Weather Integration", description: "Live weather with game-day alerts", status: "complete" },
    ]
  },
  {
    name: "Closing Workflows",
    icon: "✅",
    color: "teal",
    features: [
      { id: "close-1", name: "Guided Checklists", description: "Step-by-step closing procedures", status: "complete" },
      { id: "close-2", name: "Signature Capture", description: "Digital signatures for verification", status: "complete" },
      { id: "close-3", name: "PDF Report Generation", description: "Automated closing report PDFs", status: "complete" },
      { id: "close-4", name: "Photo Documentation", description: "End-of-day photo requirements", status: "complete" },
    ]
  },
  {
    name: "Premium UI/UX",
    icon: "✨",
    color: "violet",
    features: [
      { id: "ui-1", name: "Glassmorphic Design", description: "Premium glass cards with blur effects", status: "complete" },
      { id: "ui-2", name: "Animated Backgrounds", description: "Gradient canvas with floating particles", status: "complete" },
      { id: "ui-3", name: "Framer Motion", description: "Smooth animations and transitions", status: "complete" },
      { id: "ui-4", name: "Mobile-First Responsive", description: "Optimized for phones and tablets", status: "complete" },
      { id: "ui-5", name: "Dark Cyan Theme", description: "Consistent aqua/cyan brand colors", status: "complete" },
      { id: "ui-6", name: "Orby Mascot Branding", description: "Aqua planet character integration", status: "partial" },
    ]
  },
  {
    name: "Data & Reporting",
    icon: "📈",
    color: "pink",
    features: [
      { id: "data-1", name: "PostgreSQL Database", description: "25+ tables with Drizzle ORM", status: "complete" },
      { id: "data-2", name: "Audit Logging", description: "Full activity trail for accountability", status: "complete" },
      { id: "data-3", name: "Live Sales Widget", description: "Real-time revenue tracking", status: "complete" },
      { id: "data-4", name: "Roster Builder", description: "Staff scheduling and group management", status: "complete", route: "/roster-builder" },
      { id: "data-5", name: "Export CSV", description: "Data export functionality", status: "partial" },
    ]
  },
  {
    name: "PWA & Offline",
    icon: "📱",
    color: "amber",
    features: [
      { id: "pwa-1", name: "Service Worker", description: "Offline-capable PWA architecture", status: "complete" },
      { id: "pwa-2", name: "Install Prompt", description: "Add to home screen support", status: "complete" },
      { id: "pwa-3", name: "Offline Mode", description: "Works when radio signals don't", status: "partial" },
      { id: "pwa-4", name: "Push Notifications", description: "Alert delivery when app closed", status: "planned" },
    ]
  },
];

const PUBLISH_LOG = [
  { version: "0.1.0", date: "2025-11-28", time: "10:00 CST", notes: "Initial prototype with basic dashboards" },
  { version: "0.2.0", date: "2025-11-29", time: "14:30 CST", notes: "Added delivery tracking and messaging" },
  { version: "0.3.0", date: "2025-11-30", time: "16:00 CST", notes: "Inventory counting with AI scanning" },
  { version: "0.4.0", date: "2025-12-01", time: "11:00 CST", notes: "Alcohol compliance and closing workflows" },
  { version: "1.0.0-beta", date: "2025-12-01", time: "21:30 CST", notes: "Premium UI polish - glassmorphic design, animations, all dashboards upgraded. Ready for Nissan Stadium beta!" },
];

function FeatureInventory() {
  const [expandedCategories, setExpandedCategories] = useState<string[]>(FEATURE_CATEGORIES.map(c => c.name));
  const [checkedFeatures, setCheckedFeatures] = useState<string[]>(() => {
    const saved = localStorage.getItem('orby_feature_checklist');
    return saved ? JSON.parse(saved) : [];
  });

  const toggleCategory = (name: string) => {
    setExpandedCategories(prev => prev.includes(name) ? prev.filter(c => c !== name) : [...prev, name]);
  };

  const toggleFeature = (id: string) => {
    setCheckedFeatures(prev => {
      const next = prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id];
      localStorage.setItem('orby_feature_checklist', JSON.stringify(next));
      return next;
    });
  };

  const totalFeatures = FEATURE_CATEGORIES.reduce((sum, cat) => sum + cat.features.length, 0);
  const completedFeatures = FEATURE_CATEGORIES.reduce((sum, cat) => sum + cat.features.filter(f => f.status === "complete").length, 0);
  const partialFeatures = FEATURE_CATEGORIES.reduce((sum, cat) => sum + cat.features.filter(f => f.status === "partial").length, 0);

  const colorMap: Record<string, string> = {
    purple: "from-purple-600 to-purple-800 border-purple-500",
    blue: "from-blue-600 to-blue-800 border-blue-500",
    green: "from-green-600 to-green-800 border-green-500",
    red: "from-red-600 to-red-800 border-red-500",
    amber: "from-amber-600 to-amber-800 border-amber-500",
    cyan: "from-cyan-600 to-cyan-800 border-cyan-500",
    pink: "from-pink-600 to-pink-800 border-pink-500",
    teal: "from-teal-600 to-teal-800 border-teal-500",
    orange: "from-orange-600 to-orange-800 border-orange-500",
    emerald: "from-emerald-600 to-emerald-800 border-emerald-500",
    indigo: "from-indigo-600 to-indigo-800 border-indigo-500",
    violet: "from-violet-600 to-violet-800 border-violet-500",
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card className="bg-gradient-to-br from-emerald-900 to-emerald-800 border-emerald-500">
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-white">{totalFeatures}</div>
            <div className="text-emerald-200 text-xs">Total Features</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-900 to-green-800 border-green-500">
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-white">{completedFeatures}</div>
            <div className="text-green-200 text-xs">Built & Ready</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-yellow-900 to-yellow-800 border-yellow-500">
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-white">{partialFeatures}</div>
            <div className="text-yellow-200 text-xs">Partial</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-900 to-blue-800 border-blue-500">
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-white">{checkedFeatures.length}</div>
            <div className="text-blue-200 text-xs">Verified ✓</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-900 to-purple-800 border-purple-500">
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-white">{PUBLISH_LOG.length}</div>
            <div className="text-purple-200 text-xs">Publishes</div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-600">
        <CardHeader className="pb-2">
          <CardTitle className="text-slate-100 flex items-center gap-2 text-base">
            <Rocket className="h-5 w-5 text-cyan-400" />
            Orby Publish History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {[...PUBLISH_LOG].reverse().map((log, idx) => (
              <div key={idx} className="flex items-start gap-3 p-2 bg-slate-800/50 rounded-lg border border-slate-700/50">
                <div className="text-center min-w-[80px]">
                  <div className="text-cyan-400 font-mono text-sm font-bold">{log.version}</div>
                  <div className="text-slate-500 text-[10px]">{log.date}</div>
                  <div className="text-slate-500 text-[10px]">{log.time}</div>
                </div>
                <div className="flex-1">
                  <p className="text-slate-300 text-sm">{log.notes}</p>
                </div>
                {idx === 0 && <Badge className="bg-green-600 text-white text-[10px]">LATEST</Badge>}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {FEATURE_CATEGORIES.map((category) => (
          <Card key={category.name} className={`bg-gradient-to-br ${colorMap[category.color]} border overflow-hidden`}>
            <CardHeader className="pb-2 cursor-pointer hover:bg-white/5 transition-colors" onClick={() => toggleCategory(category.name)}>
              <CardTitle className="text-white flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{category.icon}</span>
                  {category.name}
                  <Badge variant="outline" className="text-white/80 border-white/30 text-[10px] ml-2">
                    {category.features.filter(f => checkedFeatures.includes(f.id)).length}/{category.features.length}
                  </Badge>
                </div>
                {expandedCategories.includes(category.name) ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </CardTitle>
            </CardHeader>
            {expandedCategories.includes(category.name) && (
              <CardContent className="pt-0">
                <div className="space-y-1.5">
                  {category.features.map((feature) => (
                    <div key={feature.id} className={`flex items-start gap-2 p-2 rounded-lg transition-all cursor-pointer ${checkedFeatures.includes(feature.id) ? 'bg-green-900/40 border border-green-500/50' : 'bg-black/20 hover:bg-black/30'}`} onClick={() => toggleFeature(feature.id)}>
                      <div className="mt-0.5">
                        {checkedFeatures.includes(feature.id) ? <CheckCircle2 className="h-4 w-4 text-green-400" /> : <Circle className="h-4 w-4 text-white/40" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-sm font-medium ${checkedFeatures.includes(feature.id) ? 'text-green-200' : 'text-white'}`}>{feature.name}</span>
                          {feature.status === "complete" && <Badge className="bg-green-600/80 text-[9px] px-1.5 py-0">BUILT</Badge>}
                          {feature.status === "partial" && <Badge className="bg-yellow-600/80 text-[9px] px-1.5 py-0">PARTIAL</Badge>}
                          {feature.status === "planned" && <Badge className="bg-blue-600/80 text-[9px] px-1.5 py-0">PLANNED</Badge>}
                        </div>
                        <p className="text-white/60 text-xs mt-0.5">{feature.description}</p>
                      </div>
                      {feature.route && <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-white/60 hover:text-white hover:bg-white/10" onClick={(e) => { e.stopPropagation(); window.location.href = feature.route!; }}><ExternalLink className="h-3 w-3" /></Button>}
                    </div>
                  ))}
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      <div className="flex justify-between items-center">
        <div className="text-slate-400 text-sm">
          {Math.round((completedFeatures / totalFeatures) * 100)}% complete ({completedFeatures}/{totalFeatures} features)
        </div>
        <Button variant="outline" size="sm" className="text-slate-400 border-slate-600 hover:bg-slate-800" onClick={() => { setCheckedFeatures([]); localStorage.removeItem('orby_feature_checklist'); }}>Reset Checklist</Button>
      </div>
    </div>
  );
}

export { FeatureInventory };
