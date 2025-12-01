import { useStore } from "@/lib/mockData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { LogOut, MessageSquare, Package, Warehouse, ArrowRight, AlertTriangle, Map, Settings, Plus, Minus, AlertCircle, Info, RefreshCw, Search, Check, Truck, Clock, Box, ChevronRight } from "lucide-react";
import { useLocation, Link } from "wouter";
import { TutorialHelpButton } from "@/components/TutorialCoach";
import { useEffect, useState } from "react";
import { Notepad } from "@/components/Notepad";
import { InteractiveMap } from "@/components/InteractiveMap";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

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

  const getCategoryName = (categoryId: string | null) => {
    return categories.find(c => c.id === categoryId)?.name ?? 'Uncategorized';
  };

  const filteredProducts = products.filter(p => {
    const matchesCategory = selectedCategory === 'all' || p.categoryId === selectedCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (p.sku?.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'Approved': return 'bg-blue-100 text-blue-800';
      case 'Picking': return 'bg-purple-100 text-purple-800';
      case 'InTransit': return 'bg-orange-100 text-orange-800';
      case 'Delivered': return 'bg-green-100 text-green-800';
      case 'Confirmed': return 'bg-emerald-100 text-emerald-800';
      case 'Cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Emergency': return 'bg-red-500 text-white';
      case 'Rush': return 'bg-orange-500 text-white';
      default: return 'bg-slate-200 text-slate-700';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 pb-20">
      <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b border-amber-500/30 bg-amber-500 text-white px-4 shadow-md">
        <div className="flex items-center gap-2">
          <Warehouse className="h-6 w-6" />
          <span className="font-bold text-lg">Warehouse</span>
        </div>
        <div className="flex-1" />
        <Link href="/messages">
          <Button variant="ghost" size="icon" className="text-white hover:bg-amber-600 relative" data-testid="button-messages">
            <MessageSquare className="h-5 w-5" />
            {urgentMessages.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                {urgentMessages.length}
              </span>
            )}
          </Button>
        </Link>
        <Button variant="ghost" size="icon" onClick={handleLogout} className="text-white hover:bg-amber-600" data-testid="button-logout">
          <LogOut className="h-5 w-5" />
        </Button>
      </header>

      <main className="p-4 sm:px-6 space-y-4 max-w-4xl mx-auto mt-4">
        <div className="text-center py-2">
          <h1 className="text-2xl font-black text-slate-200">Welcome, {currentUser?.name}</h1>
          <p className="text-muted-foreground">Warehouse Operations Dashboard</p>
        </div>

        {showConfigNotice && stats?.isExampleData && (
          <Card className="border-blue-500/30 bg-blue-950/40" data-testid="card-config-notice">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-blue-200 text-sm">Configurable Example System</h3>
                  <p className="text-xs text-blue-300 mt-1">
                    {stats.configNote}
                  </p>
                  <div className="flex gap-2 mt-3">
                    {categories.length === 0 && (
                      <Button 
                        size="sm" 
                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs"
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
                      </Button>
                    )}
                    <Button 
                      size="sm" 
                      variant="ghost"
                      className="text-blue-600 text-xs"
                      onClick={() => setShowConfigNotice(false)}
                      data-testid="button-dismiss-notice"
                    >
                      Dismiss
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex gap-2 overflow-x-auto pb-2">
          {['overview', 'inventory', 'requests'].map((tab) => (
            <Button
              key={tab}
              variant={activeTab === tab ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab(tab as any)}
              className={`capitalize ${activeTab === tab ? 'bg-amber-500 hover:bg-amber-600' : ''}`}
              data-testid={`tab-${tab}`}
            >
              {tab}
            </Button>
          ))}
        </div>

        {activeTab === 'overview' && (
          <>
            {showMap && (
              <div className="fixed inset-0 z-50 bg-background">
                <InteractiveMap 
                  onClose={() => setShowMap(false)} 
                  showNavigation={true}
                />
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Card className="border-slate-700 bg-slate-900/80 shadow-md" data-testid="stat-products">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-amber-400">{stats?.totalProducts ?? 0}</div>
                  <div className="text-xs text-muted-foreground">Products</div>
                </CardContent>
              </Card>
              <Card className="border-slate-700 bg-slate-900/80 shadow-md" data-testid="stat-categories">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-blue-400">{stats?.totalCategories ?? 0}</div>
                  <div className="text-xs text-muted-foreground">Categories</div>
                </CardContent>
              </Card>
              <Card className="border-slate-700 bg-slate-900/80 shadow-md" data-testid="stat-pending">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-orange-400">{stats?.pendingRequestCount ?? 0}</div>
                  <div className="text-xs text-muted-foreground">Pending</div>
                </CardContent>
              </Card>
              <Card className="border-slate-700 bg-slate-900/80 shadow-md" data-testid="stat-low-stock">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-red-400">{stats?.lowStockCount ?? 0}</div>
                  <div className="text-xs text-muted-foreground">Low Stock</div>
                </CardContent>
              </Card>
            </div>

            <Notepad storageKey="warehouse-notes" />

            <div className="grid grid-cols-2 gap-4">
              <Card className="border-slate-700 bg-slate-900/80 shadow-md hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setShowMap(true)} data-testid="card-stadium-map">
                <CardContent className="p-6 flex flex-col items-center justify-center text-center space-y-3">
                  <div className="p-4 rounded-full bg-blue-900/30">
                    <Map className="h-8 w-8 text-blue-400" />
                  </div>
                  <div className="font-bold text-sm text-slate-200">Stadium Map</div>
                </CardContent>
              </Card>
              <Card className="border-slate-700 bg-slate-900/80 shadow-md hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setActiveTab('inventory')} data-testid="card-inventory">
                <CardContent className="p-6 flex flex-col items-center justify-center text-center space-y-3">
                  <div className="p-4 rounded-full bg-amber-900/30">
                    <Package className="h-8 w-8 text-amber-400" />
                  </div>
                  <div className="font-bold text-sm text-slate-200">Inventory</div>
                  <p className="text-xs text-muted-foreground">{products.length} products</p>
                </CardContent>
              </Card>
            </div>

            {pendingRequests.length > 0 && (
              <Card className="border-slate-700 bg-slate-900/80 shadow-md" data-testid="card-pending-requests">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-200">
                    <Clock className="h-4 w-4 text-orange-400" />
                    Pending Requests ({pendingRequests.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {pendingRequests.slice(0, 3).map(req => {
                    const stand = stands.find(s => s.id === req.standId);
                    return (
                      <div key={req.id} className="p-3 bg-slate-800/80 rounded-lg border border-slate-700 flex items-center justify-between" data-testid={`request-${req.id}`}>
                        <div>
                          <div className="font-medium text-sm">{stand?.name ?? 'Unknown Stand'}</div>
                          <div className="flex gap-2 mt-1">
                            <Badge className={`text-[10px] ${getStatusColor(req.status)}`}>{req.status}</Badge>
                            <Badge className={`text-[10px] ${getPriorityColor(req.priority)}`}>{req.priority}</Badge>
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    );
                  })}
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full text-xs"
                    onClick={() => setActiveTab('requests')}
                    data-testid="button-view-all-requests"
                  >
                    View All <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {activeTab === 'inventory' && (
          <>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                  data-testid="input-search-products"
                />
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-[140px]" data-testid="select-category">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {categories.length === 0 ? (
              <Card className="border-dashed border-2" data-testid="card-no-data">
                <CardContent className="p-8 text-center">
                  <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-semibold text-lg mb-2">No Inventory Data</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Load example data to see how the warehouse inventory system works, 
                    or add your own categories and products.
                  </p>
                  <Button 
                    onClick={() => seedMutation.mutate()}
                    disabled={seedMutation.isPending}
                    className="bg-amber-500 hover:bg-amber-600"
                    data-testid="button-load-example-2"
                  >
                    {seedMutation.isPending ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4 mr-2" />
                    )}
                    Load Example Data
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Accordion type="multiple" className="space-y-2">
                {categories.map(category => {
                  const categoryProducts = filteredProducts.filter(p => p.categoryId === category.id);
                  if (categoryProducts.length === 0 && selectedCategory !== 'all' && selectedCategory !== category.id) return null;
                  
                  return (
                    <AccordionItem key={category.id} value={category.id} className="border rounded-lg px-4 bg-white dark:bg-slate-900" data-testid={`category-${category.id}`}>
                      <AccordionTrigger className="hover:no-underline py-3">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: category.color ?? '#3B82F6' }}
                          />
                          <span className="font-semibold text-sm">{category.name}</span>
                          <Badge variant="secondary" className="text-[10px]">
                            {categoryProducts.length}
                          </Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-2 pt-2">
                          {categoryProducts.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-4">
                              No products in this category
                            </p>
                          ) : (
                            categoryProducts.map(product => {
                              const qty = getProductStock(product.id);
                              const isLowStock = qty < 10;
                              return (
                                <div 
                                  key={product.id} 
                                  className={`p-3 rounded-lg border flex items-center justify-between ${isLowStock ? 'border-red-200 bg-red-50 dark:bg-red-950/20' : ''}`}
                                  data-testid={`product-${product.id}`}
                                >
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium text-sm">{product.name}</span>
                                      {isLowStock && (
                                        <AlertCircle className="h-3 w-3 text-red-500" />
                                      )}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      SKU: {product.sku ?? 'N/A'} | Unit: {product.unit ?? 'each'}
                                      {product.isPerishable && ' | Perishable'}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      className="h-8 w-8"
                                      onClick={() => updateStockMutation.mutate({ productId: product.id, quantity: Math.max(0, qty - 1) })}
                                      disabled={updateStockMutation.isPending}
                                      data-testid={`button-decrement-${product.id}`}
                                    >
                                      <Minus className="h-3 w-3" />
                                    </Button>
                                    <span className={`w-12 text-center font-bold ${isLowStock ? 'text-red-600' : ''}`}>
                                      {qty}
                                    </span>
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      className="h-8 w-8"
                                      onClick={() => updateStockMutation.mutate({ productId: product.id, quantity: qty + 1 })}
                                      disabled={updateStockMutation.isPending}
                                      data-testid={`button-increment-${product.id}`}
                                    >
                                      <Plus className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            )}
          </>
        )}

        {activeTab === 'requests' && (
          <>
            <Card className="border-none shadow-md" data-testid="card-request-workflow">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold">Request Workflow</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center mb-1">
                      <Clock className="h-4 w-4 text-yellow-600" />
                    </div>
                    <span>Pending</span>
                  </div>
                  <ArrowRight className="h-3 w-3" />
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mb-1">
                      <Check className="h-4 w-4 text-blue-600" />
                    </div>
                    <span>Approved</span>
                  </div>
                  <ArrowRight className="h-3 w-3" />
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center mb-1">
                      <Box className="h-4 w-4 text-purple-600" />
                    </div>
                    <span>Picking</span>
                  </div>
                  <ArrowRight className="h-3 w-3" />
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center mb-1">
                      <Truck className="h-4 w-4 text-orange-600" />
                    </div>
                    <span>Transit</span>
                  </div>
                  <ArrowRight className="h-3 w-3" />
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center mb-1">
                      <Check className="h-4 w-4 text-green-600" />
                    </div>
                    <span>Done</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {pendingRequests.length === 0 ? (
              <Card className="border-dashed border-2" data-testid="card-no-requests">
                <CardContent className="p-8 text-center">
                  <Truck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-semibold text-lg mb-2">No Pending Requests</h3>
                  <p className="text-sm text-muted-foreground">
                    Stand leads can submit requests from their dashboard.
                    Requests will appear here for processing.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {pendingRequests.map(req => {
                  const stand = stands.find(s => s.id === req.standId);
                  const nextStatus: Record<string, string> = {
                    'Pending': 'Approved',
                    'Approved': 'Picking',
                    'Picking': 'InTransit',
                    'InTransit': 'Delivered',
                    'Delivered': 'Confirmed'
                  };
                  
                  return (
                    <Card key={req.id} className="border-none shadow-md" data-testid={`request-card-${req.id}`}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="font-semibold">{stand?.name ?? 'Unknown Stand'}</div>
                            <div className="text-xs text-muted-foreground">
                              {req.createdAt ? new Date(req.createdAt).toLocaleString() : 'Unknown time'}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Badge className={getStatusColor(req.status)}>{req.status}</Badge>
                            <Badge className={getPriorityColor(req.priority)}>{req.priority}</Badge>
                          </div>
                        </div>
                        {req.notes && (
                          <p className="text-sm text-muted-foreground mb-3 italic">"{req.notes}"</p>
                        )}
                        <div className="flex gap-2">
                          {nextStatus[req.status] && (
                            <Button
                              size="sm"
                              className="bg-amber-500 hover:bg-amber-600 flex-1"
                              onClick={() => updateRequestMutation.mutate({ requestId: req.id, status: nextStatus[req.status] })}
                              disabled={updateRequestMutation.isPending}
                              data-testid={`button-advance-${req.id}`}
                            >
                              Mark as {nextStatus[req.status]}
                            </Button>
                          )}
                          {req.status !== 'Cancelled' && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 border-red-200 hover:bg-red-50"
                              onClick={() => updateRequestMutation.mutate({ requestId: req.id, status: 'Cancelled' })}
                              disabled={updateRequestMutation.isPending}
                              data-testid={`button-cancel-${req.id}`}
                            >
                              Cancel
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </>
        )}
      </main>
      
      <TutorialHelpButton page="warehouse" />
    </div>
  );
}
