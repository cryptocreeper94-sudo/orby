import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertTriangle, Shield, ClipboardCheck, Wine, Utensils, 
  Bell, BellRing, Check, X, ChevronDown, ChevronUp, MapPin
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface ComplianceAlert {
  id: string;
  alertType: 'abc_board' | 'health_dept' | 'fire_marshal' | 'osha' | 'other';
  title: string;
  message: string;
  isActive: boolean;
  triggeredById?: string;
  triggeredByName?: string;
  resolvedById?: string;
  resolvedAt?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

interface ChecklistItem {
  id: string;
  category: string;
  item: string;
  critical?: boolean;
  points?: number;
}

interface ComplianceAlertPanelProps {
  userId?: string;
  userName?: string;
  isManager?: boolean;
}

export default function ComplianceAlertPanel({ userId, userName, isManager = false }: ComplianceAlertPanelProps) {
  const [showABCChecklist, setShowABCChecklist] = useState(false);
  const [showHealthChecklist, setShowHealthChecklist] = useState(false);
  const [location, setLocation] = useState('');
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const queryClient = useQueryClient();

  const { data: activeAlerts = [] } = useQuery<ComplianceAlert[]>({
    queryKey: ['compliance-alerts-active'],
    queryFn: async () => {
      const response = await fetch('/api/compliance-alerts/active');
      if (!response.ok) throw new Error('Failed to fetch active alerts');
      return response.json();
    },
    refetchInterval: 10000
  });

  const { data: abcChecklist = [] } = useQuery<ChecklistItem[]>({
    queryKey: ['abc-checklist'],
    queryFn: async () => {
      const response = await fetch('/api/compliance/abc-checklist');
      if (!response.ok) throw new Error('Failed to fetch ABC checklist');
      return response.json();
    }
  });

  const { data: healthChecklist = [] } = useQuery<ChecklistItem[]>({
    queryKey: ['health-checklist'],
    queryFn: async () => {
      const response = await fetch('/api/compliance/health-checklist');
      if (!response.ok) throw new Error('Failed to fetch health checklist');
      return response.json();
    }
  });

  const triggerABCAlert = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/compliance-alerts/abc-board', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ triggeredById: userId, triggeredByName: userName, location })
      });
      if (!response.ok) throw new Error('Failed to trigger ABC alert');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['compliance-alerts-active'] });
      toast.success('ABC Board alert sent to all staff');
      setLocation('');
    },
    onError: () => {
      toast.error('Failed to send ABC alert');
    }
  });

  const triggerHealthAlert = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/compliance-alerts/health-dept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ triggeredById: userId, triggeredByName: userName, location })
      });
      if (!response.ok) throw new Error('Failed to trigger Health alert');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['compliance-alerts-active'] });
      toast.success('Health Department alert sent to all staff');
      setLocation('');
    },
    onError: () => {
      toast.error('Failed to send Health alert');
    }
  });

  const resolveAlert = useMutation({
    mutationFn: async (alertId: string) => {
      const response = await fetch(`/api/compliance-alerts/${alertId}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resolvedById: userId })
      });
      if (!response.ok) throw new Error('Failed to resolve alert');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['compliance-alerts-active'] });
      toast.success('Alert resolved');
    },
    onError: () => {
      toast.error('Failed to resolve alert');
    }
  });

  const toggleCheckItem = (id: string) => {
    const newChecked = new Set(checkedItems);
    if (newChecked.has(id)) {
      newChecked.delete(id);
    } else {
      newChecked.add(id);
    }
    setCheckedItems(newChecked);
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'abc_board': return <Wine className="h-5 w-5" />;
      case 'health_dept': return <Utensils className="h-5 w-5" />;
      default: return <AlertTriangle className="h-5 w-5" />;
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'abc_board': return 'from-purple-600/20 to-purple-900/30 border-purple-500/50';
      case 'health_dept': return 'from-emerald-600/20 to-emerald-900/30 border-emerald-500/50';
      default: return 'from-amber-600/20 to-amber-900/30 border-amber-500/50';
    }
  };

  const groupChecklistByCategory = (items: ChecklistItem[]) => {
    return items.reduce((acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = [];
      }
      acc[item.category].push(item);
      return acc;
    }, {} as Record<string, ChecklistItem[]>);
  };

  return (
    <div className="space-y-4" data-testid="compliance-alert-panel">
      <AnimatePresence>
        {activeAlerts.map((alert) => (
          <motion.div
            key={alert.id}
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`relative overflow-hidden rounded-xl border-2 bg-gradient-to-br ${getAlertColor(alert.alertType)} backdrop-blur-sm p-4`}
            data-testid={`compliance-alert-${alert.id}`}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 via-transparent to-red-500/10 animate-pulse" />
            <div className="relative">
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-full bg-red-500/20 animate-pulse">
                    <BellRing className="h-5 w-5 text-red-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white flex items-center gap-2">
                      {getAlertIcon(alert.alertType)}
                      {alert.title}
                    </h3>
                    <p className="text-xs text-slate-400">
                      Triggered by {alert.triggeredByName || 'System'} at {new Date(alert.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                {isManager && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => resolveAlert.mutate(alert.id)}
                    disabled={resolveAlert.isPending}
                    className="text-green-400 hover:text-green-300 hover:bg-green-500/20"
                    data-testid={`resolve-alert-${alert.id}`}
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Clear
                  </Button>
                )}
              </div>
              <div className="bg-black/30 rounded-lg p-3 whitespace-pre-line text-sm text-slate-200 leading-relaxed">
                {alert.message}
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {isManager && (
        <Card className="bg-slate-900/80 border-slate-700/50 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2 text-cyan-400">
              <Shield className="h-5 w-5" />
              Compliance Alert Controls
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-slate-400" />
              <Input
                placeholder="Location (optional, e.g., Section 112)"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="bg-slate-800/50 border-slate-600"
                data-testid="input-alert-location"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={() => triggerABCAlert.mutate()}
                disabled={triggerABCAlert.isPending}
                className="bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-500 hover:to-purple-700 text-white h-auto py-3 flex-col items-center gap-1 overflow-hidden"
                data-testid="button-trigger-abc"
              >
                <Wine className="h-5 w-5 shrink-0" />
                <span className="font-semibold text-sm truncate w-full text-center">ABC Board Alert</span>
                <span className="text-[10px] text-purple-200 truncate w-full text-center">Alcohol Inspection</span>
              </Button>
              
              <Button
                onClick={() => triggerHealthAlert.mutate()}
                disabled={triggerHealthAlert.isPending}
                className="bg-gradient-to-r from-emerald-600 to-emerald-800 hover:from-emerald-500 hover:to-emerald-700 text-white h-auto py-3 flex-col items-center gap-1 overflow-hidden"
                data-testid="button-trigger-health"
              >
                <Utensils className="h-5 w-5 shrink-0" />
                <span className="font-semibold text-sm truncate w-full text-center">Health Dept Alert</span>
                <span className="text-[10px] text-emerald-200 truncate w-full text-center">Food Safety</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="bg-slate-900/80 border-slate-700/50 backdrop-blur-sm overflow-hidden">
        <CardHeader className="pb-2">
          <button
            onClick={() => setShowABCChecklist(!showABCChecklist)}
            className="w-full flex items-center justify-between text-left gap-2"
            data-testid="button-toggle-abc-checklist"
          >
            <CardTitle className="text-base flex items-center gap-2 text-purple-400 truncate">
              <Wine className="h-5 w-5 shrink-0" />
              <span className="truncate">TN ABC Board Checklist</span>
            </CardTitle>
            {showABCChecklist ? <ChevronUp className="h-5 w-5 shrink-0" /> : <ChevronDown className="h-5 w-5 shrink-0" />}
          </button>
        </CardHeader>
        <AnimatePresence>
          {showABCChecklist && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <CardContent className="pt-0 space-y-4">
                {Object.entries(groupChecklistByCategory(abcChecklist)).map(([category, items]) => (
                  <div key={category}>
                    <h4 className="text-sm font-semibold text-slate-400 mb-2">{category}</h4>
                    <div className="space-y-2">
                      {items.map((item) => (
                        <label
                          key={item.id}
                          className={`flex items-start gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                            checkedItems.has(`abc-${item.id}`) 
                              ? 'bg-green-500/20 border border-green-500/30' 
                              : 'bg-slate-800/50 hover:bg-slate-800/80'
                          }`}
                          data-testid={`abc-checklist-item-${item.id}`}
                        >
                          <input
                            type="checkbox"
                            checked={checkedItems.has(`abc-${item.id}`)}
                            onChange={() => toggleCheckItem(`abc-${item.id}`)}
                            className="mt-0.5 h-4 w-4 rounded border-slate-500 bg-slate-700 text-purple-500 focus:ring-purple-500"
                          />
                          <div className="flex-1">
                            <span className={`text-sm ${checkedItems.has(`abc-${item.id}`) ? 'text-green-300 line-through' : 'text-slate-200'}`}>
                              {item.item}
                            </span>
                            {item.critical && (
                              <Badge variant="destructive" className="ml-2 text-[10px] px-1.5 py-0">
                                CRITICAL
                              </Badge>
                            )}
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>

      <Card className="bg-slate-900/80 border-slate-700/50 backdrop-blur-sm overflow-hidden">
        <CardHeader className="pb-2">
          <button
            onClick={() => setShowHealthChecklist(!showHealthChecklist)}
            className="w-full flex items-center justify-between text-left gap-2"
            data-testid="button-toggle-health-checklist"
          >
            <CardTitle className="text-base flex items-center gap-2 text-emerald-400 min-w-0">
              <Utensils className="h-5 w-5 shrink-0" />
              <span className="truncate">TN Health Dept</span>
              <Badge className="bg-emerald-500/20 text-emerald-400 shrink-0 text-[10px]">
                {healthChecklist.reduce((sum, item) => sum + (item.points || 0), 0)} pts
              </Badge>
            </CardTitle>
            {showHealthChecklist ? <ChevronUp className="h-5 w-5 shrink-0" /> : <ChevronDown className="h-5 w-5 shrink-0" />}
          </button>
        </CardHeader>
        <AnimatePresence>
          {showHealthChecklist && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <CardContent className="pt-0 space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                  <span className="text-sm text-emerald-300">Current Score</span>
                  <span className="text-2xl font-bold text-emerald-400">
                    {healthChecklist
                      .filter(item => checkedItems.has(`health-${item.id}`))
                      .reduce((sum, item) => sum + (item.points || 0), 0)
                    } / {healthChecklist.reduce((sum, item) => sum + (item.points || 0), 0)}
                  </span>
                </div>
                {Object.entries(groupChecklistByCategory(healthChecklist)).map(([category, items]) => (
                  <div key={category}>
                    <h4 className="text-sm font-semibold text-slate-400 mb-2">{category}</h4>
                    <div className="space-y-2">
                      {items.map((item) => (
                        <label
                          key={item.id}
                          className={`flex items-start gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                            checkedItems.has(`health-${item.id}`) 
                              ? 'bg-green-500/20 border border-green-500/30' 
                              : 'bg-slate-800/50 hover:bg-slate-800/80'
                          }`}
                          data-testid={`health-checklist-item-${item.id}`}
                        >
                          <input
                            type="checkbox"
                            checked={checkedItems.has(`health-${item.id}`)}
                            onChange={() => toggleCheckItem(`health-${item.id}`)}
                            className="mt-0.5 h-4 w-4 rounded border-slate-500 bg-slate-700 text-emerald-500 focus:ring-emerald-500"
                          />
                          <div className="flex-1">
                            <span className={`text-sm ${checkedItems.has(`health-${item.id}`) ? 'text-green-300 line-through' : 'text-slate-200'}`}>
                              {item.item}
                            </span>
                            <div className="flex items-center gap-2 mt-0.5">
                              {item.points && (
                                <Badge className="bg-slate-700 text-slate-300 text-[10px] px-1.5 py-0">
                                  {item.points} pts
                                </Badge>
                              )}
                              {item.critical && (
                                <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                                  CRITICAL
                                </Badge>
                              )}
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </div>
  );
}
