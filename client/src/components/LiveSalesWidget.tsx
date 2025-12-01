import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, TrendingDown, AlertTriangle, Beer, DollarSign, 
  Clock, RefreshCw, Zap, Package, ArrowRight, Info
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface StandSales {
  standId: string;
  standName: string;
  section: string;
  hourlyRevenue: number;
  hourlyUnits: number;
  trend: 'up' | 'down' | 'stable';
  trendPercent: number;
  topItem: string;
  topItemCount: number;
  inventoryLevel: 'good' | 'low' | 'critical';
  estimatedRunout?: number;
}

interface SalesAlert {
  id: string;
  type: 'restock' | 'hot' | 'slow';
  standName: string;
  message: string;
  timestamp: Date;
}

const SIMULATED_STANDS: StandSales[] = [
  { standId: '105S', standName: 'Stand 105 - Ice Crown', section: '2 East', hourlyRevenue: 2847, hourlyUnits: 156, trend: 'up', trendPercent: 23, topItem: 'Bud Light 16oz', topItemCount: 67, inventoryLevel: 'good' },
  { standId: '212', standName: 'Stand 212 - Hot Spot', section: '7 East', hourlyRevenue: 4120, hourlyUnits: 234, trend: 'up', trendPercent: 45, topItem: 'Miller Lite 16oz', topItemCount: 89, inventoryLevel: 'low', estimatedRunout: 35 },
  { standId: '118', standName: 'Stand 118 - Corner Bar', section: '2 West', hourlyRevenue: 1654, hourlyUnits: 92, trend: 'down', trendPercent: 12, topItem: 'Coca Cola 20oz', topItemCount: 34, inventoryLevel: 'good' },
  { standId: '301', standName: 'Stand 301 - Premium', section: '7 West', hourlyRevenue: 3280, hourlyUnits: 145, trend: 'up', trendPercent: 18, topItem: 'Craft Beer', topItemCount: 52, inventoryLevel: 'critical', estimatedRunout: 12 },
  { standId: '126L', standName: 'Stand 126 - Jack Bar', section: '2 West', hourlyRevenue: 2190, hourlyUnits: 118, trend: 'stable', trendPercent: 2, topItem: 'Jack & Coke', topItemCount: 41, inventoryLevel: 'good' },
];

const SIMULATED_ALERTS: SalesAlert[] = [
  { id: '1', type: 'restock', standName: 'Stand 301', message: 'Craft Beer running low - ~12 min until stockout at current pace', timestamp: new Date(Date.now() - 2 * 60000) },
  { id: '2', type: 'hot', standName: 'Stand 212', message: 'Sales up 45% vs last hour - potential restock needed soon', timestamp: new Date(Date.now() - 5 * 60000) },
  { id: '3', type: 'restock', standName: 'Stand 212', message: 'Miller Lite below threshold - suggest 2 cases', timestamp: new Date(Date.now() - 8 * 60000) },
];

function formatCurrency(cents: number): string {
  return `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function formatTimeAgo(date: Date): string {
  const minutes = Math.floor((Date.now() - date.getTime()) / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes === 1) return '1 min ago';
  return `${minutes} min ago`;
}

interface LiveSalesWidgetProps {
  compact?: boolean;
  className?: string;
}

export function LiveSalesWidget({ compact = false, className = '' }: LiveSalesWidgetProps) {
  const [stands, setStands] = useState<StandSales[]>(SIMULATED_STANDS);
  const [alerts, setAlerts] = useState<SalesAlert[]>(SIMULATED_ALERTS);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [isSimulating, setIsSimulating] = useState(true);

  useEffect(() => {
    if (!isSimulating) return;

    const interval = setInterval(() => {
      setStands(prev => prev.map(stand => ({
        ...stand,
        hourlyRevenue: Math.max(500, Math.min(10000, stand.hourlyRevenue + Math.floor(Math.random() * 200) - 30)),
        hourlyUnits: Math.max(20, Math.min(500, stand.hourlyUnits + Math.floor(Math.random() * 10) - 2)),
        estimatedRunout: stand.estimatedRunout ? Math.max(0, stand.estimatedRunout - 1) : undefined,
      })));
      setLastUpdate(new Date());
    }, 5000);

    return () => clearInterval(interval);
  }, [isSimulating]);

  const totalRevenue = stands.reduce((sum, s) => sum + s.hourlyRevenue, 0);
  const totalUnits = stands.reduce((sum, s) => sum + s.hourlyUnits, 0);
  const criticalStands = stands.filter(s => s.inventoryLevel === 'critical').length;
  const lowStands = stands.filter(s => s.inventoryLevel === 'low').length;

  if (compact) {
    return (
      <Card className={`bg-gradient-to-br from-emerald-900/20 to-cyan-900/20 border-emerald-500/30 ${className}`} data-testid="live-sales-widget-compact">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-white flex items-center gap-2 text-lg">
              <DollarSign className="h-5 w-5 text-emerald-400" />
              Live Sales
              <Badge variant="outline" className="text-xs border-amber-500/50 text-amber-300 ml-2">
                DEMO
              </Badge>
            </CardTitle>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-4 w-4 text-white/40" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>This is a demo showing what's possible with Yellow Dog API integration. Data is simulated.</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/5 rounded-lg p-3">
              <div className="text-2xl font-bold text-emerald-400">{formatCurrency(totalRevenue)}</div>
              <div className="text-xs text-white/60">This Hour</div>
            </div>
            <div className="bg-white/5 rounded-lg p-3">
              <div className="text-2xl font-bold text-cyan-400">{totalUnits}</div>
              <div className="text-xs text-white/60">Units Sold</div>
            </div>
          </div>

          {(criticalStands > 0 || lowStands > 0) && (
            <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 rounded-lg p-2">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
              <span className="text-sm text-amber-200">
                {criticalStands > 0 && `${criticalStands} critical`}
                {criticalStands > 0 && lowStands > 0 && ', '}
                {lowStands > 0 && `${lowStands} low stock`}
              </span>
            </div>
          )}

          <div className="text-xs text-white/40 flex items-center gap-1">
            <RefreshCw className="h-3 w-3" />
            Updated {formatTimeAgo(lastUpdate)}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`bg-gradient-to-br from-slate-800 to-slate-900 border-white/10 ${className}`} data-testid="live-sales-widget">
      <CardHeader className="pb-2 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-600">
              <DollarSign className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-white flex items-center gap-2">
                Live Sales Dashboard
                <Badge variant="outline" className="text-xs border-amber-500/50 text-amber-300">
                  DEMO - Simulated Data
                </Badge>
              </CardTitle>
              <p className="text-xs text-white/50">What's possible with Yellow Dog API</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="border-white/20 text-white/70 hover:text-white"
              onClick={() => setIsSimulating(!isSimulating)}
            >
              {isSimulating ? 'Pause' : 'Resume'} Demo
            </Button>
            <div className="text-xs text-white/40 flex items-center gap-1">
              <div className={`w-2 h-2 rounded-full ${isSimulating ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`} />
              {isSimulating ? 'Live' : 'Paused'}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-4">
        <div className="grid grid-cols-4 gap-3">
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3">
            <div className="flex items-center gap-2 text-emerald-400 mb-1">
              <DollarSign className="h-4 w-4" />
              <span className="text-xs uppercase">Hourly Revenue</span>
            </div>
            <div className="text-2xl font-bold text-white">{formatCurrency(totalRevenue)}</div>
          </div>
          <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-3">
            <div className="flex items-center gap-2 text-cyan-400 mb-1">
              <Beer className="h-4 w-4" />
              <span className="text-xs uppercase">Units Sold</span>
            </div>
            <div className="text-2xl font-bold text-white">{totalUnits}</div>
          </div>
          <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3">
            <div className="flex items-center gap-2 text-purple-400 mb-1">
              <TrendingUp className="h-4 w-4" />
              <span className="text-xs uppercase">Avg/Stand</span>
            </div>
            <div className="text-2xl font-bold text-white">{formatCurrency(Math.floor(totalRevenue / stands.length))}</div>
          </div>
          <div className={`rounded-lg p-3 ${criticalStands > 0 ? 'bg-red-500/10 border border-red-500/30' : 'bg-green-500/10 border border-green-500/30'}`}>
            <div className={`flex items-center gap-2 mb-1 ${criticalStands > 0 ? 'text-red-400' : 'text-green-400'}`}>
              <Package className="h-4 w-4" />
              <span className="text-xs uppercase">Stock Status</span>
            </div>
            <div className="text-2xl font-bold text-white">
              {criticalStands > 0 ? `${criticalStands} Critical` : 'All Good'}
            </div>
          </div>
        </div>

        {alerts.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium text-white/70 flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-400" />
              Smart Alerts
            </div>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {alerts.map(alert => (
                <div 
                  key={alert.id}
                  className={`flex items-center justify-between p-2 rounded-lg ${
                    alert.type === 'restock' ? 'bg-red-500/10 border border-red-500/20' :
                    alert.type === 'hot' ? 'bg-amber-500/10 border border-amber-500/20' :
                    'bg-blue-500/10 border border-blue-500/20'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {alert.type === 'restock' && <Package className="h-4 w-4 text-red-400" />}
                    {alert.type === 'hot' && <TrendingUp className="h-4 w-4 text-amber-400" />}
                    <div>
                      <span className="text-sm font-medium text-white">{alert.standName}</span>
                      <span className="text-sm text-white/60 ml-2">{alert.message}</span>
                    </div>
                  </div>
                  <span className="text-xs text-white/40">{formatTimeAgo(alert.timestamp)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-2">
          <div className="text-sm font-medium text-white/70">Stand Performance</div>
          <div className="space-y-2">
            {stands.sort((a, b) => b.hourlyRevenue - a.hourlyRevenue).map(stand => (
              <div 
                key={stand.standId}
                className="flex items-center gap-3 p-2 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
              >
                <div className={`w-2 h-full min-h-[40px] rounded-full ${
                  stand.inventoryLevel === 'critical' ? 'bg-red-500' :
                  stand.inventoryLevel === 'low' ? 'bg-amber-500' :
                  'bg-green-500'
                }`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white truncate">{stand.standName}</span>
                    <span className="text-xs text-white/40">{stand.section}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-sm text-emerald-400 font-medium">{formatCurrency(stand.hourlyRevenue)}</span>
                    <span className="text-xs text-white/50">{stand.hourlyUnits} units</span>
                    <span className="text-xs text-white/40">Top: {stand.topItem} ({stand.topItemCount})</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`flex items-center gap-1 ${
                    stand.trend === 'up' ? 'text-green-400' :
                    stand.trend === 'down' ? 'text-red-400' :
                    'text-gray-400'
                  }`}>
                    {stand.trend === 'up' && <TrendingUp className="h-4 w-4" />}
                    {stand.trend === 'down' && <TrendingDown className="h-4 w-4" />}
                    <span className="text-sm font-medium">{stand.trendPercent}%</span>
                  </div>
                  {stand.estimatedRunout && (
                    <div className="flex items-center gap-1 text-xs text-red-400 mt-1">
                      <Clock className="h-3 w-3" />
                      ~{stand.estimatedRunout}m to stockout
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white/5 border border-dashed border-white/20 rounded-lg p-4 text-center">
          <p className="text-sm text-white/60 mb-2">
            This demo shows what's possible with Yellow Dog API integration.
          </p>
          <p className="text-xs text-white/40">
            Real-time sales data, smart restock alerts, trend analysis - all automated.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
