import { useStore } from "@/lib/mockData";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LogOut, MessageSquare, Package, Warehouse, ArrowRight, Map, Plus, Minus, AlertCircle, Info, RefreshCw, Search, Check, Truck, Clock, Box, ChevronRight, Layers, AlertTriangle, FileText, ClipboardList } from "lucide-react";
import { useLocation, Link } from "wouter";
import { TutorialHelpButton } from "@/components/TutorialCoach";
import { useEffect, useState } from "react";
import { Notepad } from "@/components/Notepad";
import { InteractiveMap } from "@/components/InteractiveMap";
import { TeamLeadCard } from "@/components/TeamLeadCard";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { AnimatedBackground, GlassCard, GlassCardContent, GlassCardHeader, PageHeader, GlowButton } from "@/components/ui/premium";
import ComplianceAlertPanel from '@/components/ComplianceAlertPanel';
import { GlobalModeBar } from '@/components/GlobalModeBar';
import { LayoutShell, BentoCard, CarouselRail, AccordionStack } from "@/components/ui/bento";

type WarehouseCategory = {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  icon: string | null;
  sortOrder: number | null;
  isActive: boolean | null;
};

type WarehouseProduct = {
  id: string;
  categoryId: string | null;
  name: string;
  sku: string | null;
  description: string | null;
  unit: string | null;
  unitsPerCase: number | null;
  costPerUnitCents: number | null;
  isPerishable: boolean | null;
  shelfLifeDays: number | null;
  minOrderQty: number | null;
  isActive: boolean | null;
};

type WarehouseStock = {
  id: string;
  productId: string;
  quantity: number;
  lotNumber: string | null;
  expirationDate: string | null;
  location: string | null;
  lastCountedAt: string | null;
  lastCountedBy: string | null;
};

type WarehouseRequest = {
  id: string;
  standId: string;
  requestedById: string;
  status: 'Pending' | 'Approved' | 'Picking' | 'InTransit' | 'Delivered' | 'Confirmed' | 'Cancelled';
  priority: 'Normal' | 'Rush' | 'Emergency';
  notes: string | null;
  createdAt: string | null;
};

type DashboardStats = {
  totalProducts: number;
  totalCategories: number;
  pendingRequestCount: number;
  lowStockCount: number;
  isExampleData: boolean;
  configNote: string;
};

export default function WarehouseDashboard() {
  const logout = useStore((state) => state.logout);
  const [, setLocation] = useLocation();
  const currentUser = useStore((state) => state.currentUser);
  const stands = useStore((state) => state.stands);
  const messages = useStore((state) => state.messages);
  const fetchAll = useStore((state) => state.fetchAll);
  const queryClient = useQueryClient();

  const [showMap, setShowMap] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'inventory' | 'requests'>('overview');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showConfigNotice, setShowConfigNotice] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);

  useEffect(() => {
    if (stands.length === 0) {
      fetchAll();
    }
  }, [stands.length, fetchAll]);

  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ['warehouse-stats'],
    queryFn: async () => {
      const res = await fetch('/api/warehouse/stats');
      if (!res.ok) throw new Error('Failed to fetch stats');
      return res.json();
    }
  });

  const { data: categories = [] } = useQuery<WarehouseCategory[]>({
    queryKey: ['warehouse-categories'],
    queryFn: async () => {
      const res = await fetch('/api/warehouse/categories');
      if (!res.ok) throw new Error('Failed to fetch categories');
      return res.json();
    }
  });

  const { data: products = [] } = useQuery<WarehouseProduct[]>({
    queryKey: ['warehouse-products'],
    queryFn: async () => {
      const res = await fetch('/api/warehouse/products');
      if (!res.ok) throw new Error('Failed to fetch products');
      return res.json();
    }
  });

  const { data: stock = [] } = useQuery<WarehouseStock[]>({
    queryKey: ['warehouse-stock'],
    queryFn: async () => {
      const res = await fetch('/api/warehouse/stock');
      if (!res.ok) throw new Error('Failed to fetch stock');
      return res.json();
    }
  });

  const { data: pendingRequests = [] } = useQuery<WarehouseRequest[]>({
    queryKey: ['warehouse-requests-pending'],
    queryFn: async () => {
      const res = await fetch('/api/warehouse/requests/pending');
      if (!res.ok) throw new Error('Failed to fetch requests');
      return res.json();
    }
  });

  const seedMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/warehouse/seed', { method: 'POST' });
      if (!res.ok) throw new Error('Failed to seed data');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouse-stats'] });
      queryClient.invalidateQueries({ queryKey: ['warehouse-categories'] });
      queryClient.invalidateQueries({ queryKey: ['warehouse-products'] });
      queryClient.invalidateQueries({ queryKey: ['warehouse-stock'] });
    }
  });

  const updateStockMutation = useMutation({
    mutationFn: async ({ productId, quantity }: { productId: string; quantity: number }) => {
      const res = await fetch(`/api/warehouse/stock/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity, userId: currentUser?.id })
      });
      if (!res.ok) throw new Error('Failed to update stock');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouse-stock'] });
      queryClient.invalidateQueries({ queryKey: ['warehouse-stats'] });
    }
  });

  const updateRequestMutation = useMutation({
    mutationFn: async ({ requestId, status }: { requestId: string; status: string }) => {
      const res = await fetch(`/api/warehouse/requests/${requestId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, userId: currentUser?.id })
      });
      if (!res.ok) throw new Error('Failed to update request');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouse-requests-pending'] });
      queryClient.invalidateQueries({ queryKey: ['warehouse-stats'] });
    }
  });

  const handleLogout = () => {
    logout();
    setLocation("/");
  };

  const urgentMessages = messages.filter(m => m.type === 'Urgent');

  const getProductStock = (productId: string) => {
    return stock.find(s => s.productId === productId)?.quantity ?? 0;
  };

  const filteredProducts = products.filter(p => {
    const matchesCategory = selectedCategory === 'all' || p.categoryId === selectedCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (p.sku?.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'Approved': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'Picking': return 'bg-violet-500/20 text-violet-400 border-violet-500/30';
      case 'InTransit': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'Delivered': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'Confirmed': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'Cancelled': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Emergency': return 'bg-red-500/30 text-red-300 border-red-500/40';
      case 'Rush': return 'bg-orange-500/30 text-orange-300 border-orange-500/40';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  const lowStockProducts = products.filter(p => getProductStock(p.id) < 10);

  const inventoryMetricItems = [
    <div key="products" className="w-[140px] h-[90px] p-4 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/20" data-testid="metric-products">
      <div className="flex items-center gap-2 mb-2">
        <Package className="h-5 w-5 text-amber-400" />
        <span className="text-xs text-slate-400">Products</span>
      </div>
      <div className="text-2xl font-bold text-amber-300">{stats?.totalProducts ?? 0}</div>
    </div>,
    <div key="categories" className="w-[140px] h-[90px] p-4 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/20" data-testid="metric-categories">
      <div className="flex items-center gap-2 mb-2">
        <Layers className="h-5 w-5 text-blue-400" />
        <span className="text-xs text-slate-400">Categories</span>
      </div>
      <div className="text-2xl font-bold text-blue-300">{stats?.totalCategories ?? 0}</div>
    </div>,
    <div key="pending" className="w-[140px] h-[90px] p-4 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-600/10 border border-purple-500/20" data-testid="metric-pending">
      <div className="flex items-center gap-2 mb-2">
        <Clock className="h-5 w-5 text-purple-400" />
        <span className="text-xs text-slate-400">Pending</span>
      </div>
      <div className="text-2xl font-bold text-purple-300">{stats?.pendingRequestCount ?? 0}</div>
    </div>,
    <div key="lowstock" className="w-[140px] h-[90px] p-4 rounded-xl bg-gradient-to-br from-red-500/20 to-red-600/10 border border-red-500/20" data-testid="metric-low-stock">
      <div className="flex items-center gap-2 mb-2">
        <AlertTriangle className="h-5 w-5 text-red-400" />
        <span className="text-xs text-slate-400">Low Stock</span>
      </div>
      <div className="text-2xl font-bold text-red-300">{stats?.lowStockCount ?? 0}</div>
    </div>,
  ];

  const pendingOrderItems = pendingRequests.length > 0 
    ? pendingRequests.map((req) => {
        const stand = stands.find(s => s.id === req.standId);
        const nextStatus: Record<string, string> = {
          'Pending': 'Approved',
          'Approved': 'Picking',
          'Picking': 'InTransit',
          'InTransit': 'Delivered',
          'Delivered': 'Confirmed'
        };
        return (
          <div key={req.id} className="min-w-[280px] p-4 rounded-xl bg-white/5 border border-white/10" data-testid={`carousel-request-${req.id}`}>
            <div className="flex items-start justify-between mb-2">
              <div className="font-semibold text-slate-200 text-sm">{stand?.name ?? 'Unknown Stand'}</div>
              <div className="flex gap-1">
                <Badge className={`text-[10px] border ${getStatusColor(req.status)}`}>{req.status}</Badge>
                <Badge className={`text-[10px] border ${getPriorityColor(req.priority)}`}>{req.priority}</Badge>
              </div>
            </div>
            <div className="text-xs text-slate-500 mb-3">
              {req.createdAt ? new Date(req.createdAt).toLocaleString() : 'Unknown time'}
            </div>
            {req.notes && (
              <p className="text-xs text-slate-400 mb-3 italic bg-white/5 rounded-lg p-2 line-clamp-2">"{req.notes}"</p>
            )}
            <div className="flex gap-2">
              {nextStatus[req.status] && (
                <GlowButton
                  size="sm"
                  className="flex-1 text-xs"
                  onClick={() => updateRequestMutation.mutate({ requestId: req.id, status: nextStatus[req.status] })}
                  disabled={updateRequestMutation.isPending}
                  data-testid={`button-advance-${req.id}`}
                >
                  → {nextStatus[req.status]}
                </GlowButton>
              )}
              {req.status !== 'Cancelled' && (
                <Button
                  size="sm"
                  variant="outline"
                  className="text-red-400 border-red-500/30 hover:bg-red-500/10 bg-transparent text-xs"
                  onClick={() => updateRequestMutation.mutate({ requestId: req.id, status: 'Cancelled' })}
                  disabled={updateRequestMutation.isPending}
                  data-testid={`button-cancel-${req.id}`}
                >
                  Cancel
                </Button>
              )}
            </div>
          </div>
        );
      })
    : [
        <div key="no-requests" className="min-w-[280px] p-6 rounded-xl bg-white/5 border border-white/10 text-center" data-testid="no-pending-requests">
          <Truck className="h-10 w-10 text-slate-500 mx-auto mb-2" />
          <p className="text-sm text-slate-400">No pending requests</p>
        </div>
      ];

  const stockLevelItems = categories.length > 0 
    ? categories.map((category) => {
        const categoryProducts = products.filter(p => p.categoryId === category.id);
        const totalStock = categoryProducts.reduce((sum, p) => sum + getProductStock(p.id), 0);
        const lowCount = categoryProducts.filter(p => getProductStock(p.id) < 10).length;
        return (
          <div key={category.id} className="w-[180px] h-[130px] p-4 rounded-xl bg-white/5 border border-white/10" data-testid={`stock-category-${category.id}`}>
            <div className="flex items-center gap-2 mb-3">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: category.color ?? '#F59E0B' }}
              />
              <span className="font-medium text-sm text-slate-200">{category.name}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="p-2 rounded-lg bg-white/5">
                <div className="text-lg font-bold text-slate-200">{categoryProducts.length}</div>
                <div className="text-[10px] text-slate-500">Products</div>
              </div>
              <div className="p-2 rounded-lg bg-white/5">
                <div className="text-lg font-bold text-slate-200">{totalStock}</div>
                <div className="text-[10px] text-slate-500">Units</div>
              </div>
            </div>
            {lowCount > 0 && (
              <div className="mt-2 text-xs text-red-400 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {lowCount} low stock
              </div>
            )}
          </div>
        );
      })
    : [
        <div key="no-stock" className="w-[180px] h-[130px] p-6 rounded-xl bg-white/5 border border-white/10 text-center" data-testid="no-stock-data">
          <Package className="h-10 w-10 text-slate-500 mx-auto mb-2" />
          <p className="text-sm text-slate-400">No inventory data</p>
          <GlowButton 
            size="sm" 
            className="mt-2"
            onClick={() => seedMutation.mutate()}
            disabled={seedMutation.isPending}
            data-testid="button-load-stock-data"
          >
            <Plus className="h-3 w-3 mr-1" />
            Load Example
          </GlowButton>
        </div>
      ];

  const supportAccordionItems = [
    {
      title: "📋 Warehouse Procedures",
      content: (
        <div className="space-y-2" data-testid="accordion-procedures">
          <div className="p-2 rounded-lg bg-white/5 text-xs">
            <div className="font-medium text-slate-300">Receiving Shipments</div>
            <div className="text-slate-500">1. Verify PO number • 2. Count items • 3. Log in system</div>
          </div>
          <div className="p-2 rounded-lg bg-white/5 text-xs">
            <div className="font-medium text-slate-300">Order Picking</div>
            <div className="text-slate-500">1. Print pick list • 2. Verify quantities • 3. Update status</div>
          </div>
          <div className="p-2 rounded-lg bg-white/5 text-xs">
            <div className="font-medium text-slate-300">Inventory Counts</div>
            <div className="text-slate-500">1. Print count sheets • 2. Physical count • 3. Reconcile</div>
          </div>
        </div>
      )
    },
    {
      title: "📦 Recent Receiving Logs",
      content: (
        <div className="space-y-2" data-testid="accordion-receiving-logs">
          <div className="p-2 rounded-lg bg-white/5 text-xs flex items-center justify-between">
            <div>
              <div className="font-medium text-slate-300">Beverage Restock</div>
              <div className="text-slate-500">12 cases received</div>
            </div>
            <div className="text-slate-500">2h ago</div>
          </div>
          <div className="p-2 rounded-lg bg-white/5 text-xs flex items-center justify-between">
            <div>
              <div className="font-medium text-slate-300">Paper Goods</div>
              <div className="text-slate-500">50 units received</div>
            </div>
            <div className="text-slate-500">5h ago</div>
          </div>
          <div className="p-2 rounded-lg bg-white/5 text-xs flex items-center justify-between">
            <div>
              <div className="font-medium text-slate-300">Condiments</div>
              <div className="text-slate-500">24 units received</div>
            </div>
            <div className="text-slate-500">1d ago</div>
          </div>
        </div>
      )
    },
    {
      title: "📝 Notes",
      content: (
        <div data-testid="accordion-notes">
          <Notepad storageKey="warehouse-notes" />
        </div>
      )
    }
  ];

  return (
    <AnimatedBackground>
      <GlobalModeBar />
      <div className="min-h-screen pb-20" data-testid="warehouse-dashboard">
        <PageHeader
          title="Warehouse"
          subtitle={`Welcome, ${currentUser?.name}`}
          icon={<Warehouse className="h-5 w-5" />}
          iconColor="amber"
          actions={
            <div className="flex items-center gap-2">
              <Link href="/messages">
                <Button variant="ghost" size="icon" className="text-slate-300 hover:bg-white/10 relative" data-testid="button-messages">
                  <MessageSquare className="h-5 w-5" />
                  {urgentMessages.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold animate-pulse">
                      {urgentMessages.length}
                    </span>
                  )}
                </Button>
              </Link>
              <Button variant="ghost" size="icon" onClick={handleLogout} className="text-slate-300 hover:bg-white/10" data-testid="button-logout">
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          }
        />

        <main className="p-4 sm:px-6 max-w-6xl mx-auto" data-testid="warehouse-main">
          <ComplianceAlertPanel 
            userId={currentUser?.id} 
            userName={currentUser?.name} 
            isManager={false}
          />
          
          {showConfigNotice && stats?.isExampleData && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-3"
            >
              <GlassCard className="border-blue-500/30" data-testid="card-config-notice">
                <GlassCardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-blue-500/20">
                      <Info className="h-4 w-4 text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-blue-200 text-sm">Configurable Example System</h3>
                      <p className="text-xs text-blue-300/80 mt-1">
                        {stats.configNote}
                      </p>
                      <div className="flex gap-2 mt-3">
                        {categories.length === 0 && (
                          <GlowButton 
                            size="sm" 
                            onClick={() => seedMutation.mutate()}
                            disabled={seedMutation.isPending}
                            data-testid="button-load-example"
                          >
                            {seedMutation.isPending ? (
                              <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                            ) : (
                              <Plus className="h-3 w-3 mr-1" />
                            )}
                            Load Example Data
                          </GlowButton>
                        )}
                        <Button 
                          size="sm" 
                          variant="ghost"
                          className="text-blue-400 text-xs hover:bg-blue-500/10"
                          onClick={() => setShowConfigNotice(false)}
                          data-testid="button-dismiss-notice"
                        >
                          Dismiss
                        </Button>
                      </div>
                    </div>
                  </div>
                </GlassCardContent>
              </GlassCard>
            </motion.div>
          )}

          <div className="flex gap-2 overflow-x-auto pb-3 hide-scrollbar mb-3">
            {['overview', 'inventory', 'requests'].map((tab) => (
              <motion.button
                key={tab}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveTab(tab as any)}
                className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition-all ${
                  activeTab === tab 
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/25' 
                    : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10'
                }`}
                data-testid={`tab-${tab}`}
              >
                {tab}
              </motion.button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {activeTab === 'overview' && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                {showMap && (
                  <div className="fixed inset-0 z-50 bg-slate-950">
                    <InteractiveMap 
                      onClose={() => setShowMap(false)} 
                      showNavigation={true}
                    />
                  </div>
                )}

                <LayoutShell className="gap-3" data-testid="bento-layout-overview">
                  <BentoCard span={12} className="col-span-4 md:col-span-6 lg:col-span-12" data-testid="bento-hero-metrics">
                    <CarouselRail 
                      items={inventoryMetricItems} 
                      title="Inventory Metrics"
                      showDots
                      data-testid="carousel-inventory-metrics"
                    />
                  </BentoCard>

                  <BentoCard span={8} className="col-span-4 md:col-span-4 lg:col-span-8" data-testid="bento-pending-orders">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="h-4 w-4 text-orange-400" />
                      <span className="text-sm font-medium text-slate-300">Pending Orders ({pendingRequests.length})</span>
                    </div>
                    <CarouselRail 
                      items={pendingOrderItems}
                      data-testid="carousel-pending-orders"
                    />
                  </BentoCard>

                  <BentoCard span={4} className="col-span-4 md:col-span-2 lg:col-span-4" data-testid="bento-alerts">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="h-4 w-4 text-red-400" />
                      <span className="text-sm font-medium text-slate-300">Low Stock Alerts</span>
                    </div>
                    {lowStockProducts.length > 0 ? (
                      <div className="space-y-2 max-h-[200px] overflow-y-auto" data-testid="low-stock-list">
                        {lowStockProducts.slice(0, 5).map((product) => {
                          const qty = getProductStock(product.id);
                          return (
                            <div key={product.id} className="p-2 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-between" data-testid={`low-stock-${product.id}`}>
                              <div className="flex items-center gap-2">
                                <AlertCircle className="h-3 w-3 text-red-400" />
                                <span className="text-xs text-slate-300 truncate max-w-[100px]">{product.name}</span>
                              </div>
                              <span className="text-xs font-bold text-red-400">{qty}</span>
                            </div>
                          );
                        })}
                        {lowStockProducts.length > 5 && (
                          <div className="text-xs text-slate-500 text-center pt-1">
                            +{lowStockProducts.length - 5} more items
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="p-4 text-center" data-testid="no-low-stock">
                        <Check className="h-8 w-8 text-emerald-400 mx-auto mb-2" />
                        <p className="text-xs text-slate-400">All stock levels OK</p>
                      </div>
                    )}
                  </BentoCard>

                  <BentoCard span={6} className="col-span-4 md:col-span-3 lg:col-span-6" data-testid="bento-stock-levels">
                    <div className="flex items-center gap-2 mb-2">
                      <Package className="h-4 w-4 text-amber-400" />
                      <span className="text-sm font-medium text-slate-300">Stock by Category</span>
                    </div>
                    <CarouselRail 
                      items={stockLevelItems}
                      data-testid="carousel-stock-levels"
                    />
                  </BentoCard>

                  <BentoCard span={6} className="col-span-4 md:col-span-3 lg:col-span-6" data-testid="bento-quick-actions">
                    <div className="flex items-center gap-2 mb-2">
                      <Map className="h-4 w-4 text-blue-400" />
                      <span className="text-sm font-medium text-slate-300">Quick Actions</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setShowMap(true)}
                        className="p-4 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/20 text-center"
                        data-testid="quick-action-map"
                      >
                        <Map className="h-6 w-6 text-blue-400 mx-auto mb-1" />
                        <span className="text-xs text-slate-300">Stadium Map</span>
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setActiveTab('inventory')}
                        className="p-4 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/20 text-center"
                        data-testid="quick-action-inventory"
                      >
                        <Package className="h-6 w-6 text-amber-400 mx-auto mb-1" />
                        <span className="text-xs text-slate-300">Inventory</span>
                      </motion.button>
                    </div>
                  </BentoCard>

                  <BentoCard span={12} className="col-span-4 md:col-span-6 lg:col-span-12" data-testid="bento-support">
                    <AccordionStack 
                      items={supportAccordionItems}
                      defaultOpen={[0]}
                      data-testid="accordion-support"
                    />
                  </BentoCard>

                  <BentoCard span={12} className="col-span-4 md:col-span-6 lg:col-span-12" data-testid="bento-team-lead">
                    <TeamLeadCard department="Warehouse" />
                  </BentoCard>
                </LayoutShell>
              </motion.div>
            )}

            {activeTab === 'inventory' && (
              <motion.div
                key="inventory"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <LayoutShell className="gap-3" data-testid="bento-layout-inventory">
                  <BentoCard span={12} className="col-span-4 md:col-span-6 lg:col-span-12" data-testid="bento-inventory-search">
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                          placeholder="Search products..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-9 bg-white/5 border-white/10 text-slate-200 placeholder:text-slate-500"
                          data-testid="input-search-products"
                        />
                      </div>
                      <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                        <SelectTrigger className="w-[140px] bg-white/5 border-white/10 text-slate-200" data-testid="select-category">
                          <SelectValue placeholder="Category" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-900 border-white/10">
                          <SelectItem value="all">All Categories</SelectItem>
                          {categories.map(cat => (
                            <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </BentoCard>

                  {categories.length === 0 ? (
                    <BentoCard span={12} className="col-span-4 md:col-span-6 lg:col-span-12" data-testid="bento-no-inventory">
                      <div className="p-8 text-center border-2 border-dashed border-white/20 rounded-xl">
                        <div className="p-4 rounded-2xl bg-amber-500/10 w-fit mx-auto mb-4">
                          <Package className="h-12 w-12 text-amber-400" />
                        </div>
                        <h3 className="font-semibold text-lg mb-2 text-slate-200">No Inventory Data</h3>
                        <p className="text-sm text-slate-400 mb-4">
                          Load example data to see how the warehouse inventory system works.
                        </p>
                        <GlowButton 
                          onClick={() => seedMutation.mutate()}
                          disabled={seedMutation.isPending}
                          data-testid="button-load-example-2"
                        >
                          {seedMutation.isPending ? (
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Plus className="h-4 w-4 mr-2" />
                          )}
                          Load Example Data
                        </GlowButton>
                      </div>
                    </BentoCard>
                  ) : (
                    categories.map((category, catIdx) => {
                      const categoryProducts = filteredProducts.filter(p => p.categoryId === category.id);
                      if (categoryProducts.length === 0 && selectedCategory !== 'all' && selectedCategory !== category.id) return null;
                      const isExpanded = expandedCategories.includes(category.id);
                      
                      return (
                        <BentoCard key={category.id} span={12} className="col-span-4 md:col-span-6 lg:col-span-12 p-0 overflow-hidden" data-testid={`bento-category-${category.id}`}>
                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: catIdx * 0.1 }}
                          >
                            <button
                              onClick={() => toggleCategory(category.id)}
                              className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
                              data-testid={`button-toggle-category-${category.id}`}
                            >
                              <div className="flex items-center gap-3">
                                <div 
                                  className="w-3 h-3 rounded-full shadow-lg" 
                                  style={{ 
                                    backgroundColor: category.color ?? '#F59E0B',
                                    boxShadow: `0 0 10px ${category.color ?? '#F59E0B'}50`
                                  }}
                                />
                                <span className="font-semibold text-sm text-slate-200">{category.name}</span>
                                <Badge variant="secondary" className="text-[10px] bg-white/10 text-slate-300">
                                  {categoryProducts.length}
                                </Badge>
                              </div>
                              <motion.div
                                animate={{ rotate: isExpanded ? 90 : 0 }}
                                transition={{ duration: 0.2 }}
                              >
                                <ChevronRight className="h-4 w-4 text-slate-400" />
                              </motion.div>
                            </button>
                            
                            <AnimatePresence>
                              {isExpanded && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: "auto", opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.2 }}
                                  className="overflow-hidden"
                                >
                                  <div className="px-4 pb-4 space-y-2 border-t border-white/5 pt-3">
                                    {categoryProducts.length === 0 ? (
                                      <p className="text-sm text-slate-500 text-center py-4">
                                        No products in this category
                                      </p>
                                    ) : (
                                      categoryProducts.map((product, idx) => {
                                        const qty = getProductStock(product.id);
                                        const isLowStock = qty < 10;
                                        return (
                                          <motion.div 
                                            key={product.id}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: idx * 0.05 }}
                                            className={`p-3 rounded-xl border flex items-center justify-between transition-colors ${
                                              isLowStock 
                                                ? 'border-red-500/30 bg-red-500/10' 
                                                : 'border-white/10 bg-white/5 hover:bg-white/10'
                                            }`}
                                            data-testid={`product-${product.id}`}
                                          >
                                            <div className="flex-1">
                                              <div className="flex items-center gap-2">
                                                <span className="font-medium text-sm text-slate-200">{product.name}</span>
                                                {isLowStock && (
                                                  <AlertCircle className="h-3 w-3 text-red-400" />
                                                )}
                                              </div>
                                              <div className="text-xs text-slate-500">
                                                SKU: {product.sku ?? 'N/A'} | Unit: {product.unit ?? 'each'}
                                                {product.isPerishable && ' | Perishable'}
                                              </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                              <motion.button
                                                whileTap={{ scale: 0.9 }}
                                                className="h-8 w-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center border border-white/10 text-slate-300"
                                                onClick={() => updateStockMutation.mutate({ productId: product.id, quantity: Math.max(0, qty - 1) })}
                                                disabled={updateStockMutation.isPending}
                                                data-testid={`button-decrement-${product.id}`}
                                              >
                                                <Minus className="h-3 w-3" />
                                              </motion.button>
                                              <span className={`w-12 text-center font-bold ${isLowStock ? 'text-red-400' : 'text-slate-200'}`}>
                                                {qty}
                                              </span>
                                              <motion.button
                                                whileTap={{ scale: 0.9 }}
                                                className="h-8 w-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center border border-white/10 text-slate-300"
                                                onClick={() => updateStockMutation.mutate({ productId: product.id, quantity: qty + 1 })}
                                                disabled={updateStockMutation.isPending}
                                                data-testid={`button-increment-${product.id}`}
                                              >
                                                <Plus className="h-3 w-3" />
                                              </motion.button>
                                            </div>
                                          </motion.div>
                                        );
                                      })
                                    )}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </motion.div>
                        </BentoCard>
                      );
                    })
                  )}
                </LayoutShell>
              </motion.div>
            )}

            {activeTab === 'requests' && (
              <motion.div
                key="requests"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <LayoutShell className="gap-3" data-testid="bento-layout-requests">
                  <BentoCard span={12} className="col-span-4 md:col-span-6 lg:col-span-12" data-testid="bento-request-workflow">
                    <div className="text-sm font-medium text-slate-300 mb-3">Request Workflow</div>
                    <div className="flex items-center justify-between text-xs">
                      {[
                        { label: 'Pending', icon: Clock, color: 'amber' },
                        { label: 'Approved', icon: Check, color: 'blue' },
                        { label: 'Picking', icon: Box, color: 'violet' },
                        { label: 'Transit', icon: Truck, color: 'orange' },
                        { label: 'Done', icon: Check, color: 'emerald' },
                      ].map((step, idx, arr) => (
                        <div key={step.label} className="flex items-center">
                          <div className="flex flex-col items-center">
                            <div className={`w-8 h-8 rounded-full bg-${step.color}-500/20 flex items-center justify-center mb-1`}>
                              <step.icon className={`h-4 w-4 text-${step.color}-400`} />
                            </div>
                            <span className="text-slate-400">{step.label}</span>
                          </div>
                          {idx < arr.length - 1 && (
                            <ArrowRight className="h-3 w-3 mx-1 text-slate-600" />
                          )}
                        </div>
                      ))}
                    </div>
                  </BentoCard>

                  {pendingRequests.length === 0 ? (
                    <BentoCard span={12} className="col-span-4 md:col-span-6 lg:col-span-12" data-testid="bento-no-requests">
                      <div className="p-8 text-center border-2 border-dashed border-white/20 rounded-xl">
                        <div className="p-4 rounded-2xl bg-slate-500/10 w-fit mx-auto mb-4">
                          <Truck className="h-12 w-12 text-slate-400" />
                        </div>
                        <h3 className="font-semibold text-lg mb-2 text-slate-200">No Pending Requests</h3>
                        <p className="text-sm text-slate-400">
                          Stand leads can submit requests from their dashboard.
                        </p>
                      </div>
                    </BentoCard>
                  ) : (
                    pendingRequests.map((req, idx) => {
                      const stand = stands.find(s => s.id === req.standId);
                      const nextStatus: Record<string, string> = {
                        'Pending': 'Approved',
                        'Approved': 'Picking',
                        'Picking': 'InTransit',
                        'InTransit': 'Delivered',
                        'Delivered': 'Confirmed'
                      };
                      
                      return (
                        <BentoCard key={req.id} span={6} className="col-span-4 md:col-span-3 lg:col-span-6" data-testid={`bento-request-${req.id}`}>
                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <div className="font-semibold text-slate-200">{stand?.name ?? 'Unknown Stand'}</div>
                                <div className="text-xs text-slate-500">
                                  {req.createdAt ? new Date(req.createdAt).toLocaleString() : 'Unknown time'}
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Badge className={`border ${getStatusColor(req.status)}`}>{req.status}</Badge>
                                <Badge className={`border ${getPriorityColor(req.priority)}`}>{req.priority}</Badge>
                              </div>
                            </div>
                            {req.notes && (
                              <p className="text-sm text-slate-400 mb-3 italic bg-white/5 rounded-lg p-2">"{req.notes}"</p>
                            )}
                            <div className="flex gap-2">
                              {nextStatus[req.status] && (
                                <GlowButton
                                  size="sm"
                                  className="flex-1"
                                  onClick={() => updateRequestMutation.mutate({ requestId: req.id, status: nextStatus[req.status] })}
                                  disabled={updateRequestMutation.isPending}
                                  data-testid={`button-advance-${req.id}`}
                                >
                                  Mark as {nextStatus[req.status]}
                                </GlowButton>
                              )}
                              {req.status !== 'Cancelled' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-red-400 border-red-500/30 hover:bg-red-500/10 bg-transparent"
                                  onClick={() => updateRequestMutation.mutate({ requestId: req.id, status: 'Cancelled' })}
                                  disabled={updateRequestMutation.isPending}
                                  data-testid={`button-cancel-${req.id}`}
                                >
                                  Cancel
                                </Button>
                              )}
                            </div>
                          </motion.div>
                        </BentoCard>
                      );
                    })
                  )}
                </LayoutShell>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
        
        <TutorialHelpButton page="warehouse" />
      </div>
    </AnimatedBackground>
  );
}
