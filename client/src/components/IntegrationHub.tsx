import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Monitor, 
  Package, 
  Users, 
  Check, 
  Clock, 
  Zap, 
  TrendingUp,
  DollarSign,
  ArrowRight,
  Boxes,
  CreditCard,
  RefreshCw,
  Database,
  Link2,
  Settings,
  ExternalLink,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useTenant } from '@/lib/TenantContext';

interface IntegrationHubProps {
  onClose?: () => void;
}

const mockSalesData = {
  todayTotal: 47832.50,
  devicesReporting: 28,
  lastBatchTime: '10:45 AM',
  posMix: { a930: 18, a700: 8, pax: 2 },
  topItems: ['Bud Light', 'Hot Dog', 'Nachos', 'Pepsi']
};

const mockInventoryData = {
  onHandItems: 847,
  variances: 12,
  lastEodImport: '11:30 PM (Yesterday)',
  categories: { beverages: 324, food: 412, supplies: 111 }
};

const mockStaffingData = {
  onDuty: 156,
  noShowPercent: 3.2,
  sectionsFilled: '94%',
  shifts: { stands: 89, warehouse: 24, kitchen: 43 }
};

export function IntegrationHub({ onClose }: IntegrationHubProps) {
  const { tenant } = useTenant();
  const [showSalesDemo, setShowSalesDemo] = useState(false);
  const [activeView, setActiveView] = useState<string | null>(null);
  
  const showSalesContent = tenant.features.showSalesContent;

  const allIntegrations = [
    {
      id: 'pax',
      name: 'PAX Payment Systems',
      description: 'A930, A700/E700 POS Terminals',
      icon: CreditCard,
      color: 'from-violet-500 to-purple-600',
      bgColor: 'bg-violet-500/10',
      borderColor: 'border-violet-500/30',
      status: 'configurable',
      dataFlow: 'PAX → Sales Metrics → Orby Dashboard',
      features: ['Real-time transaction data', 'Device health monitoring', 'Sales by stand/zone', 'Payment method breakdown'],
      nextStep: 'PAX API integration endpoint',
      demoData: mockSalesData,
      isSalesRelated: true
    },
    {
      id: 'yellowdog',
      name: 'Yellow Dog Inventory',
      description: 'Back-Office Inventory Management',
      icon: Boxes,
      color: 'from-amber-500 to-orange-600',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/30',
      status: 'planned',
      dataFlow: 'Yellow Dog → Inventory → Orby Counts',
      features: ['EOD inventory import', 'Variance reporting', 'Purchase order sync', 'Par level alerts'],
      nextStep: 'Yellow Dog export file ingest',
      demoData: mockInventoryData,
      isSalesRelated: false
    },
    {
      id: 'orbitstaffing',
      name: 'OrbitStaffing',
      description: 'Workforce Scheduling Platform',
      icon: Users,
      color: 'from-cyan-500 to-teal-600',
      bgColor: 'bg-cyan-500/10',
      borderColor: 'border-cyan-500/30',
      status: 'planned',
      dataFlow: 'OrbitStaffing → Roster → Orby Presence',
      features: ['Staff roster sync', 'GPS clock-in verification', 'Section assignments', 'Certification tracking'],
      nextStep: 'OrbitStaffing API bridge',
      demoData: mockStaffingData,
      isSalesRelated: false
    }
  ];

  // Filter out sales-related integrations for production tenants
  const integrations = showSalesContent 
    ? allIntegrations 
    : allIntegrations.filter(i => !i.isSalesRelated);

  const statusColors: Record<string, { bg: string; text: string; label: string }> = {
    configurable: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', label: 'Configurable' },
    planned: { bg: 'bg-amber-500/20', text: 'text-amber-400', label: 'Planned' },
    ready: { bg: 'bg-cyan-500/20', text: 'text-cyan-400', label: 'Ready' }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Link2 className="w-5 h-5 text-cyan-400" />
            Integration Hub
          </h3>
          <p className="text-sm text-cyan-200/60 mt-1">
            Single dashboard view • No more switching screens
          </p>
        </div>
        {showSalesContent && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Label htmlFor="demo-mode" className="text-xs text-slate-400">Beta</Label>
              <Switch
                id="demo-mode"
                checked={showSalesDemo}
                onCheckedChange={setShowSalesDemo}
                className="data-[state=checked]:bg-cyan-500"
                data-testid="switch-demo-mode"
              />
              <Label htmlFor="demo-mode" className="text-xs text-slate-400">Sales Demo</Label>
            </div>
            {showSalesDemo && (
              <Badge className="bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-cyan-300 border-cyan-500/40">
                <Sparkles className="w-3 h-3 mr-1" />
                Stripe Ready
              </Badge>
            )}
          </div>
        )}
      </div>

      <div className="bg-slate-800/30 rounded-xl p-4 border border-cyan-500/20">
        <div className="flex items-center gap-2 mb-2">
          <Database className="w-4 h-4 text-cyan-400" />
          <span className="text-sm font-medium text-white">Unified Data View</span>
          <Badge variant="outline" className="text-[10px] border-cyan-500/40 text-cyan-300 ml-auto">
            Read-Only Preview
          </Badge>
        </div>
        <p className="text-xs text-slate-400">
          All systems connected to one Orby dashboard — sales, inventory, and staffing in a single view.
          No need to check 4-5 different screens.
        </p>
      </div>

      <ScrollArea className="h-[400px] pr-4">
        <div className="space-y-4">
          {integrations.map((integration) => {
            const Icon = integration.icon;
            const status = statusColors[integration.status];
            const isExpanded = activeView === integration.id;

            return (
              <motion.div
                key={integration.id}
                layout
                className={`rounded-xl border ${integration.borderColor} ${integration.bgColor} overflow-hidden`}
              >
                <button
                  onClick={() => setActiveView(isExpanded ? null : integration.id)}
                  className="w-full p-4 text-left"
                  data-testid={`button-integration-${integration.id}`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${integration.color} flex items-center justify-center flex-shrink-0`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-white">{integration.name}</span>
                        <Badge className={`${status.bg} ${status.text} text-[10px]`}>
                          {status.label}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-400">{integration.description}</p>
                      <div className="flex items-center gap-1 mt-2 text-xs text-cyan-300/70">
                        <ArrowRight className="w-3 h-3" />
                        <span>{integration.dataFlow}</span>
                      </div>
                    </div>
                    <motion.div
                      animate={{ rotate: isExpanded ? 90 : 0 }}
                      className="text-slate-400"
                    >
                      <ArrowRight className="w-5 h-5" />
                    </motion.div>
                  </div>
                </button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="border-t border-white/10"
                    >
                      <div className="p-4 space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {integration.features.map((feature, i) => (
                            <div key={i} className="flex items-center gap-2 text-sm text-slate-300">
                              <Check className="w-4 h-4 text-emerald-400" />
                              <span>{feature}</span>
                            </div>
                          ))}
                        </div>

                        {integration.id === 'pax' && (
                          <div className="bg-slate-900/50 rounded-lg p-3 space-y-3">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-slate-400">Demo: Today's Sales</span>
                              <span className="font-bold text-emerald-400">${mockSalesData.todayTotal.toLocaleString()}</span>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                              <div className="text-center p-2 bg-slate-800/50 rounded">
                                <div className="text-lg font-bold text-violet-400">{mockSalesData.posMix.a930}</div>
                                <div className="text-[10px] text-slate-500">A930s</div>
                              </div>
                              <div className="text-center p-2 bg-slate-800/50 rounded">
                                <div className="text-lg font-bold text-purple-400">{mockSalesData.posMix.a700}</div>
                                <div className="text-[10px] text-slate-500">A700s</div>
                              </div>
                              <div className="text-center p-2 bg-slate-800/50 rounded">
                                <div className="text-lg font-bold text-cyan-400">{mockSalesData.posMix.pax}</div>
                                <div className="text-[10px] text-slate-500">PAX</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                              <Clock className="w-3 h-3" />
                              <span>Last batch: {mockSalesData.lastBatchTime}</span>
                            </div>
                          </div>
                        )}

                        {integration.id === 'yellowdog' && (
                          <div className="bg-slate-900/50 rounded-lg p-3 space-y-3">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-slate-400">Demo: Inventory Status</span>
                              <span className="font-bold text-amber-400">{mockInventoryData.onHandItems} items</span>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                              <div className="text-center p-2 bg-slate-800/50 rounded">
                                <div className="text-lg font-bold text-amber-400">{mockInventoryData.categories.beverages}</div>
                                <div className="text-[10px] text-slate-500">Beverages</div>
                              </div>
                              <div className="text-center p-2 bg-slate-800/50 rounded">
                                <div className="text-lg font-bold text-orange-400">{mockInventoryData.categories.food}</div>
                                <div className="text-[10px] text-slate-500">Food</div>
                              </div>
                              <div className="text-center p-2 bg-slate-800/50 rounded">
                                <div className="text-lg font-bold text-yellow-400">{mockInventoryData.categories.supplies}</div>
                                <div className="text-[10px] text-slate-500">Supplies</div>
                              </div>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                              <div className="flex items-center gap-2 text-slate-500">
                                <Clock className="w-3 h-3" />
                                <span>Last EOD: {mockInventoryData.lastEodImport}</span>
                              </div>
                              <Badge className="bg-rose-500/20 text-rose-400 text-[10px]">
                                {mockInventoryData.variances} variances
                              </Badge>
                            </div>
                          </div>
                        )}

                        {integration.id === 'orbitstaffing' && (
                          <div className="bg-slate-900/50 rounded-lg p-3 space-y-3">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-slate-400">Demo: Staff Status</span>
                              <span className="font-bold text-cyan-400">{mockStaffingData.onDuty} on duty</span>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                              <div className="text-center p-2 bg-slate-800/50 rounded">
                                <div className="text-lg font-bold text-cyan-400">{mockStaffingData.shifts.stands}</div>
                                <div className="text-[10px] text-slate-500">Stands</div>
                              </div>
                              <div className="text-center p-2 bg-slate-800/50 rounded">
                                <div className="text-lg font-bold text-teal-400">{mockStaffingData.shifts.warehouse}</div>
                                <div className="text-[10px] text-slate-500">Warehouse</div>
                              </div>
                              <div className="text-center p-2 bg-slate-800/50 rounded">
                                <div className="text-lg font-bold text-emerald-400">{mockStaffingData.shifts.kitchen}</div>
                                <div className="text-[10px] text-slate-500">Kitchen</div>
                              </div>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                              <div className="text-slate-500">
                                Sections filled: <span className="text-emerald-400">{mockStaffingData.sectionsFilled}</span>
                              </div>
                              <Badge className="bg-amber-500/20 text-amber-400 text-[10px]">
                                {mockStaffingData.noShowPercent}% no-show
                              </Badge>
                            </div>
                          </div>
                        )}

                        <div className="flex items-center gap-2 text-xs text-cyan-300/60 pt-2 border-t border-white/5">
                          <Settings className="w-3 h-3" />
                          <span>Next: {integration.nextStep}</span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </ScrollArea>

      <div className="flex items-center justify-between pt-4 border-t border-white/10">
        <div className="text-xs text-slate-500 flex items-center gap-2">
          <RefreshCw className="w-3 h-3" />
          <span>Visual preview only • Not live yet</span>
        </div>
        {showSalesContent && showSalesDemo && (
          <Badge className="bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 text-emerald-300 border-emerald-500/40">
            <CreditCard className="w-3 h-3 mr-1" />
            Pricing & Stripe Ready for Sales Demo
          </Badge>
        )}
      </div>
    </div>
  );
}
