import { useStore } from "@/lib/mockData";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LogOut, MessageSquare, Package, Warehouse, ArrowRight, Map, Plus, Minus, AlertCircle, Info, RefreshCw, Search, Check, Truck, Clock, Box, ChevronRight, Layers, AlertTriangle } from "lucide-react";
import { useLocation, Link } from "wouter";
import { TutorialHelpButton } from "@/components/TutorialCoach";
import { useEffect, useState } from "react";
import { Notepad } from "@/components/Notepad";
import { InteractiveMap } from "@/components/InteractiveMap";
import { TeamLeadCard } from "@/components/TeamLeadCard";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { AnimatedBackground, GlassCard, GlassCardContent, GlassCardHeader, StatCard, PageHeader, GlowButton } from "@/components/ui/premium";
import ComplianceAlertPanel from '@/components/ComplianceAlertPanel';
import { GlobalModeBar } from '@/components/GlobalModeBar';

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

  return (
    <AnimatedBackground>
      <GlobalModeBar />
      <div className="min-h-screen pb-20">
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

        <main className="p-4 sm:px-6 space-y-4 max-w-6xl mx-auto">
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

          <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
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
                className="space-y-4"
              >
                {showMap && (
                  <div className="fixed inset-0 z-50 bg-slate-950">
                    <InteractiveMap 
                      onClose={() => setShowMap(false)} 
                      showNavigation={true}
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <StatCard
                    icon={<Package className="h-5 w-5" />}
                    label="Products"
                    value={stats?.totalProducts ?? 0}
                    color="amber"
                    data-testid="stat-products"
                  />
                  <StatCard
                    icon={<Layers className="h-5 w-5" />}
                    label="Categories"
                    value={stats?.totalCategories ?? 0}
                    color="blue"
                    data-testid="stat-categories"
                  />
                  <StatCard
                    icon={<Clock className="h-5 w-5" />}
                    label="Pending"
                    value={stats?.pendingRequestCount ?? 0}
                    color="purple"
                    data-testid="stat-pending"
                  />
                  <StatCard
                    icon={<AlertTriangle className="h-5 w-5" />}
                    label="Low Stock"
                    value={stats?.lowStockCount ?? 0}
                    color="red"
                    data-testid="stat-low-stock"
                  />
                </div>

                <TeamLeadCard department="Warehouse" />

                <Notepad storageKey="warehouse-notes" />

                <div className="grid grid-cols-2 gap-4">
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <GlassCard 
                      className="cursor-pointer hover:border-blue-500/30 transition-colors h-full" 
                      onClick={() => setShowMap(true)} 
                      data-testid="card-stadium-map"
                    >
                      <GlassCardContent className="p-6 flex flex-col items-center justify-center text-center space-y-3">
                        <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-500/20 to-blue-600/10">
                          <Map className="h-8 w-8 text-blue-400" />
                        </div>
                        <div className="font-bold text-sm text-slate-200">Stadium Map</div>
                        <p className="text-xs text-slate-400">View venue layout</p>
                      </GlassCardContent>
                    </GlassCard>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <GlassCard 
                      className="cursor-pointer hover:border-amber-500/30 transition-colors h-full" 
                      onClick={() => setActiveTab('inventory')} 
                      data-testid="card-inventory"
                    >
                      <GlassCardContent className="p-6 flex flex-col items-center justify-center text-center space-y-3">
                        <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-600/10">
                          <Package className="h-8 w-8 text-amber-400" />
                        </div>
                        <div className="font-bold text-sm text-slate-200">Inventory</div>
                        <p className="text-xs text-slate-400">{products.length} products</p>
                      </GlassCardContent>
                    </GlassCard>
                  </motion.div>
                </div>

                {pendingRequests.length > 0 && (
                  <GlassCard data-testid="card-pending-requests">
                    <GlassCardHeader className="pb-2">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-orange-500/20">
                          <Clock className="h-4 w-4 text-orange-400" />
                        </div>
                        <span className="font-bold text-sm text-slate-200">
                          Pending Requests ({pendingRequests.length})
                        </span>
                      </div>
                    </GlassCardHeader>
                    <GlassCardContent className="space-y-2 pt-0">
                      {pendingRequests.slice(0, 3).map((req, idx) => {
                        const stand = stands.find(s => s.id === req.standId);
                        return (
                          <motion.div 
                            key={req.id} 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className="p-3 bg-white/5 rounded-xl border border-white/10 flex items-center justify-between hover:bg-white/10 transition-colors cursor-pointer" 
                            data-testid={`request-${req.id}`}
                          >
                            <div>
                              <div className="font-medium text-sm text-slate-200">{stand?.name ?? 'Unknown Stand'}</div>
                              <div className="flex gap-2 mt-1">
                                <Badge className={`text-[10px] border ${getStatusColor(req.status)}`}>{req.status}</Badge>
                                <Badge className={`text-[10px] border ${getPriorityColor(req.priority)}`}>{req.priority}</Badge>
                              </div>
                            </div>
                            <ChevronRight className="h-4 w-4 text-slate-500" />
                          </motion.div>
                        );
                      })}
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="w-full text-xs text-amber-400 hover:bg-amber-500/10"
                        onClick={() => setActiveTab('requests')}
                        data-testid="button-view-all-requests"
                      >
                        View All <ArrowRight className="h-3 w-3 ml-1" />
                      </Button>
                    </GlassCardContent>
                  </GlassCard>
                )}
              </motion.div>
            )}

            {activeTab === 'inventory' && (
              <motion.div
                key="inventory"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-4"
              >
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

                {categories.length === 0 ? (
                  <GlassCard className="border-dashed border-2 border-white/20" data-testid="card-no-data">
                    <GlassCardContent className="p-8 text-center">
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
                    </GlassCardContent>
                  </GlassCard>
                ) : (
                  <div className="space-y-3">
                    {categories.map((category, catIdx) => {
                      const categoryProducts = filteredProducts.filter(p => p.categoryId === category.id);
                      if (categoryProducts.length === 0 && selectedCategory !== 'all' && selectedCategory !== category.id) return null;
                      const isExpanded = expandedCategories.includes(category.id);
                      
                      return (
                        <motion.div
                          key={category.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: catIdx * 0.1 }}
                        >
                          <GlassCard className="overflow-hidden" data-testid={`category-${category.id}`}>
                            <button
                              onClick={() => toggleCategory(category.id)}
                              className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
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
                          </GlassCard>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'requests' && (
              <motion.div
                key="requests"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-4"
              >
                <GlassCard data-testid="card-request-workflow">
                  <GlassCardHeader className="pb-2">
                    <span className="font-bold text-sm text-slate-200">Request Workflow</span>
                  </GlassCardHeader>
                  <GlassCardContent className="pt-0">
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
                  </GlassCardContent>
                </GlassCard>

                {pendingRequests.length === 0 ? (
                  <GlassCard className="border-dashed border-2 border-white/20" data-testid="card-no-requests">
                    <GlassCardContent className="p-8 text-center">
                      <div className="p-4 rounded-2xl bg-slate-500/10 w-fit mx-auto mb-4">
                        <Truck className="h-12 w-12 text-slate-400" />
                      </div>
                      <h3 className="font-semibold text-lg mb-2 text-slate-200">No Pending Requests</h3>
                      <p className="text-sm text-slate-400">
                        Stand leads can submit requests from their dashboard.
                      </p>
                    </GlassCardContent>
                  </GlassCard>
                ) : (
                  <div className="space-y-3">
                    {pendingRequests.map((req, idx) => {
                      const stand = stands.find(s => s.id === req.standId);
                      const nextStatus: Record<string, string> = {
                        'Pending': 'Approved',
                        'Approved': 'Picking',
                        'Picking': 'InTransit',
                        'InTransit': 'Delivered',
                        'Delivered': 'Confirmed'
                      };
                      
                      return (
                        <motion.div
                          key={req.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.1 }}
                        >
                          <GlassCard data-testid={`request-card-${req.id}`}>
                            <GlassCardContent className="p-4">
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
                            </GlassCardContent>
                          </GlassCard>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </main>
        
        <TutorialHelpButton page="warehouse" />
      </div>
    </AnimatedBackground>
  );
}
