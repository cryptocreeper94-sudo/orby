import { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Users, Eye, TrendingUp, Calendar, Globe, BarChart2, Tag, ChevronDown, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface AnalyticsSummary {
  totalVisits: number;
  uniqueVisitors: number;
  uniqueUsers: number;
  visitsToday: number;
  visitsThisWeek: number;
  topRoutes: { route: string; count: number }[];
}

interface DailyCount {
  date: string;
  count: number;
}

interface SeoEdit {
  id: string;
  tagType: string;
  oldValue?: string;
  newValue?: string;
  editedAt: string;
}

export function AnalyticsSection() {
  const [tenant, setTenant] = useState('demo');
  const [tenantDropdownOpen, setTenantDropdownOpen] = useState(false);
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [dailyCounts, setDailyCounts] = useState<DailyCount[]>([]);
  const [seoEdits, setSeoEdits] = useState<SeoEdit[]>([]);
  const [loading, setLoading] = useState(true);
  const [tenantList, setTenantList] = useState<string[]>(['demo', 'nissan_beta']);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const [summaryRes, dailyRes, seoRes, tenantsRes] = await Promise.all([
        fetch(`/api/analytics/summary?tenant=${tenant}&days=30`),
        fetch(`/api/analytics/daily?tenant=${tenant}&days=14`),
        fetch(`/api/analytics/seo?tenant=${tenant}&limit=10`),
        fetch('/api/analytics/tenants')
      ]);

      if (summaryRes.ok) {
        setSummary(await summaryRes.json());
      }
      if (dailyRes.ok) {
        const data = await dailyRes.json();
        setDailyCounts(data.map((d: DailyCount) => ({
          ...d,
          date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        })));
      }
      if (seoRes.ok) {
        setSeoEdits(await seoRes.json());
      }
      if (tenantsRes.ok) {
        const tenants = await tenantsRes.json();
        if (tenants.length > 0) {
          setTenantList(tenants);
        }
      }
    } catch (err) {
      console.error('Failed to load analytics:', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadAnalytics();
  }, [tenant]);

  const tenantLabels: Record<string, string> = {
    'demo': 'Demo Environment',
    'nissan_beta': 'Nissan Stadium Beta'
  };

  return (
    <div className="space-y-4" data-testid="analytics-section">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BarChart2 className="h-5 w-5 text-purple-400" />
          <span className="text-sm font-medium text-slate-300">Developer Analytics</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-400 border border-purple-500/30">BETA</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              onClick={() => setTenantDropdownOpen(!tenantDropdownOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-sm text-slate-300 hover:bg-slate-700 transition-all"
              data-testid="tenant-toggle"
            >
              <Globe className="h-3.5 w-3.5 text-cyan-400" />
              <span>{tenantLabels[tenant] || tenant}</span>
              <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", tenantDropdownOpen && "rotate-180")} />
            </button>
            {tenantDropdownOpen && (
              <div className="absolute right-0 mt-1 z-50 min-w-[180px] rounded-lg bg-slate-800 border border-slate-700 shadow-xl overflow-hidden">
                {tenantList.map((t) => (
                  <button
                    key={t}
                    onClick={() => {
                      setTenant(t);
                      setTenantDropdownOpen(false);
                    }}
                    className={cn(
                      "w-full px-4 py-2 text-left text-sm hover:bg-slate-700 transition-all",
                      tenant === t ? "text-cyan-400 bg-slate-700/50" : "text-slate-300"
                    )}
                    data-testid={`tenant-option-${t}`}
                  >
                    {tenantLabels[t] || t}
                  </button>
                ))}
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={loadAnalytics}
            disabled={loading}
            className="text-slate-400 hover:text-white"
            data-testid="refresh-analytics"
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          </Button>
        </div>
      </div>

      {loading && !summary ? (
        <div className="flex items-center justify-center py-8 text-slate-500">
          <RefreshCw className="h-5 w-5 animate-spin mr-2" />
          Loading analytics...
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3" data-testid="metrics-grid">
            <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-600/10 border border-purple-500/30">
              <div className="flex items-center gap-2 mb-1">
                <Eye className="h-4 w-4 text-purple-400" />
                <span className="text-[10px] text-purple-400 uppercase tracking-wider">Total Visits</span>
              </div>
              <div className="text-2xl font-bold text-white">{summary?.totalVisits || 0}</div>
            </div>
            
            <div className="p-3 rounded-xl bg-gradient-to-br from-cyan-500/20 to-cyan-600/10 border border-cyan-500/30">
              <div className="flex items-center gap-2 mb-1">
                <Users className="h-4 w-4 text-cyan-400" />
                <span className="text-[10px] text-cyan-400 uppercase tracking-wider">Unique Visitors</span>
              </div>
              <div className="text-2xl font-bold text-white">{summary?.uniqueVisitors || 0}</div>
            </div>
            
            <div className="p-3 rounded-xl bg-gradient-to-br from-teal-500/20 to-teal-600/10 border border-teal-500/30">
              <div className="flex items-center gap-2 mb-1">
                <Users className="h-4 w-4 text-teal-400" />
                <span className="text-[10px] text-teal-400 uppercase tracking-wider">Unique Users</span>
              </div>
              <div className="text-2xl font-bold text-white">{summary?.uniqueUsers || 0}</div>
            </div>
            
            <div className="p-3 rounded-xl bg-gradient-to-br from-green-500/20 to-green-600/10 border border-green-500/30">
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="h-4 w-4 text-green-400" />
                <span className="text-[10px] text-green-400 uppercase tracking-wider">Today</span>
              </div>
              <div className="text-2xl font-bold text-white">{summary?.visitsToday || 0}</div>
            </div>
            
            <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/30">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="h-4 w-4 text-amber-400" />
                <span className="text-[10px] text-amber-400 uppercase tracking-wider">This Week</span>
              </div>
              <div className="text-2xl font-bold text-white">{summary?.visitsThisWeek || 0}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="h-4 w-4 text-cyan-400" />
                <span className="text-sm font-medium text-slate-300">Daily Visits (14 days)</span>
              </div>
              <div className="h-[180px]" data-testid="daily-chart">
                {dailyCounts.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={dailyCounts}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                      <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1e293b', 
                          border: '1px solid #334155',
                          borderRadius: '8px'
                        }}
                        labelStyle={{ color: '#e2e8f0' }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="count" 
                        stroke="#06b6d4" 
                        strokeWidth={2}
                        dot={{ fill: '#06b6d4', strokeWidth: 2 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-500 text-sm">
                    No visit data available
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
              <div className="flex items-center gap-2 mb-3">
                <BarChart2 className="h-4 w-4 text-purple-400" />
                <span className="text-sm font-medium text-slate-300">Top Routes</span>
              </div>
              <div className="h-[180px]" data-testid="routes-chart">
                {(summary?.topRoutes?.length || 0) > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={summary?.topRoutes?.slice(0, 6)} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                      <YAxis 
                        dataKey="route" 
                        type="category" 
                        tick={{ fill: '#94a3b8', fontSize: 9 }} 
                        width={100}
                        tickFormatter={(value) => value.length > 15 ? value.substring(0, 15) + '...' : value}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1e293b', 
                          border: '1px solid #334155',
                          borderRadius: '8px'
                        }}
                        labelStyle={{ color: '#e2e8f0' }}
                      />
                      <Bar dataKey="count" fill="#a855f7" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-500 text-sm">
                    No route data available
                  </div>
                )}
              </div>
            </div>
          </div>

          {seoEdits.length > 0 && (
            <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
              <div className="flex items-center gap-2 mb-3">
                <Tag className="h-4 w-4 text-emerald-400" />
                <span className="text-sm font-medium text-slate-300">Recent SEO Tag Edits</span>
              </div>
              <div className="space-y-2 max-h-[150px] overflow-y-auto">
                {seoEdits.map((edit) => (
                  <div key={edit.id} className="flex items-center justify-between p-2 rounded bg-slate-900/50 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono">{edit.tagType}</span>
                      <span className="text-slate-400 truncate max-w-[200px]">
                        {edit.newValue ? `→ ${edit.newValue}` : 'Updated'}
                      </span>
                    </div>
                    <span className="text-slate-500">
                      {new Date(edit.editedAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
