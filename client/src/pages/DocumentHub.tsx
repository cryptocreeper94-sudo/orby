import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  FileText, 
  ChevronLeft, 
  Search,
  Store,
  Download,
  Eye,
  Trash2,
  FolderOpen,
  ClipboardList,
  AlertTriangle,
  Wine,
  Loader2,
  AlertCircle,
  FileStack,
  BookOpen,
  ScanLine,
  Files,
  TrendingUp,
  Calendar
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AnimatedBackground, GlowButton } from "@/components/ui/premium";
import { useStore } from "@/lib/mockData";
import { useMode } from "@/lib/ModeContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { EventReportBuilder } from "@/components/EventReportBuilder";
import { UniversalDocumentScanner } from "@/components/UniversalDocumentScanner";
import { LayoutShell, BentoCard, CarouselRail, AccordionStack } from "@/components/ui/bento";
import { cn } from "@/lib/utils";

type DocumentCategory = 'count_report' | 'incident' | 'violation' | 'closing' | 'other';

interface ManagerDocument {
  id: string;
  title: string;
  category: DocumentCategory;
  subcategory?: string;
  standId?: string;
  eventDate?: string;
  submittedById?: string;
  pdfUrl?: string;
  jsonData?: any;
  notes?: string;
  createdAt: string;
}

interface Stand {
  id: string;
  name: string;
}

const CATEGORY_CONFIG: Record<string, { label: string; icon: any; color: string }> = {
  count_report: { label: 'Count Reports', icon: ClipboardList, color: 'cyan' },
  incident: { label: 'Incidents', icon: AlertTriangle, color: 'amber' },
  violation: { label: 'Violations', icon: Wine, color: 'red' },
  closing: { label: 'Closing Docs', icon: FileText, color: 'purple' },
  other: { label: 'Other', icon: FolderOpen, color: 'slate' }
};

const normalizeCategory = (category: string): DocumentCategory => {
  const normalized = category.toLowerCase();
  const categoryMap: Record<string, DocumentCategory> = {
    'count_report': 'count_report',
    'countreport': 'count_report',
    'incident': 'incident',
    'incidentreport': 'incident',
    'violation': 'violation',
    'compliance': 'violation',
    'closing': 'closing',
    'finance': 'count_report',
    'operations': 'other',
    'other': 'other'
  };
  return categoryMap[normalized] || 'other';
};

export default function DocumentHub() {
  const [, setLocation] = useLocation();
  const currentUser = useStore((state: { currentUser: any }) => state.currentUser);
  const { toast } = useToast();
  const { isSandbox } = useMode();

  const [documents, setDocuments] = useState<ManagerDocument[]>([]);
  const [stands, setStands] = useState<Stand[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<DocumentCategory | 'all'>('all');
  const [selectedStand, setSelectedStand] = useState<string | 'all'>('all');
  const [dateFilter, setDateFilter] = useState('');
  
  const [viewingDoc, setViewingDoc] = useState<ManagerDocument | null>(null);
  const [showReportBuilder, setShowReportBuilder] = useState(false);
  const [showScanner, setShowScanner] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [docsRes, standsRes] = await Promise.all([
        fetch('/api/manager-documents'),
        fetch('/api/stands')
      ]);

      if (docsRes.ok) {
        const docsData = await docsRes.json();
        setDocuments(docsData);
      }
      if (standsRes.ok) {
        const standsData = await standsRes.json();
        setStands(standsData);
      }
    } catch (error) {
      console.error('Failed to fetch documents:', error);
      toast({
        title: "Error",
        description: "Failed to load documents.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = !searchQuery || 
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.notes?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const docCategory = normalizeCategory(doc.category);
    const matchesCategory = selectedCategory === 'all' || docCategory === selectedCategory;
    const matchesStand = selectedStand === 'all' || doc.standId === selectedStand;
    const matchesDate = !dateFilter || doc.eventDate === dateFilter;

    return matchesSearch && matchesCategory && matchesStand && matchesDate;
  });

  const documentsByCategory = documents.reduce((acc, doc) => {
    const category = normalizeCategory(doc.category);
    if (!acc[category]) acc[category] = [];
    acc[category].push(doc);
    return acc;
  }, {} as Record<string, ManagerDocument[]>);

  const getStandName = (standId?: string) => {
    if (!standId) return 'All Stands';
    const stand = stands.find(s => s.id === standId);
    return stand?.name || standId;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const deleteDocument = async (id: string) => {
    try {
      await fetch(`/api/manager-documents/${id}`, { method: 'DELETE' });
      setDocuments(prev => prev.filter(d => d.id !== id));
      setViewingDoc(null);
      toast({ title: "Deleted", description: "Document has been removed." });
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete document.", variant: "destructive" });
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedStand('all');
    setDateFilter('');
  };

  const hasActiveFilters = searchQuery || selectedCategory !== 'all' || selectedStand !== 'all' || dateFilter;

  const MANAGER_ACCESS_ROLES = ['Developer', 'Management'];
  const hasManagerAccess = currentUser && MANAGER_ACCESS_ROLES.includes(currentUser.role);
  
  if (!hasManagerAccess) {
    return (
      <AnimatedBackground>
        <LayoutShell className="min-h-screen p-4 place-content-center">
          <BentoCard span={12} className="max-w-md mx-auto">
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-amber-400 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-slate-200 mb-2">Access Restricted</h2>
              <p className="text-slate-400 mb-4">Document Hub is restricted to managers only.</p>
              <Button onClick={() => setLocation('/')} className="bg-cyan-500 hover:bg-cyan-600">
                Return Home
              </Button>
            </div>
          </BentoCard>
        </LayoutShell>
      </AnimatedBackground>
    );
  }

  const docMetrics = [
    { label: "Total Documents", value: documents.length, icon: <Files className="h-5 w-5 text-cyan-400" />, bg: "bg-cyan-500/20" },
    { label: "Count Reports", value: documentsByCategory['count_report']?.length || 0, icon: <ClipboardList className="h-5 w-5 text-blue-400" />, bg: "bg-blue-500/20" },
    { label: "Incidents", value: documentsByCategory['incident']?.length || 0, icon: <AlertTriangle className="h-5 w-5 text-amber-400" />, bg: "bg-amber-500/20" },
    { label: "Violations", value: documentsByCategory['violation']?.length || 0, icon: <Wine className="h-5 w-5 text-red-400" />, bg: "bg-red-500/20" },
    { label: "Closing Docs", value: documentsByCategory['closing']?.length || 0, icon: <FileText className="h-5 w-5 text-purple-400" />, bg: "bg-purple-500/20" },
    { label: "This Week", value: documents.filter(d => new Date(d.createdAt) > new Date(Date.now() - 7*24*60*60*1000)).length, icon: <TrendingUp className="h-5 w-5 text-green-400" />, bg: "bg-green-500/20" },
  ];

  const policyItems = [
    {
      title: "Document Retention",
      content: (
        <ul className="space-y-1.5 text-xs text-slate-300">
          <li className="flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-cyan-400" /> Count reports: 90 days</li>
          <li className="flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-amber-400" /> Incidents: 1 year minimum</li>
          <li className="flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-red-400" /> Violations: 3 years</li>
          <li className="flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-purple-400" /> Closing docs: 90 days</li>
        </ul>
      )
    },
    {
      title: "Access Levels",
      content: (
        <ul className="space-y-1.5 text-xs text-slate-300">
          <li className="flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-green-400" /> Managers: Full access</li>
          <li className="flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-blue-400" /> Supervisors: View only</li>
          <li className="flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-slate-400" /> Staff: No access</li>
          <li className="flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-amber-400" /> Auditors: Read-only export</li>
        </ul>
      )
    },
    {
      title: "Submission Guidelines",
      content: (
        <p className="text-xs text-slate-300 leading-relaxed">
          All documents must include the event date, stand ID (if applicable), 
          and submitter information. Use descriptive titles and include 
          relevant notes for context.
        </p>
      )
    },
  ];

  const filterItems = [
    {
      title: "Stand Filter",
      content: (
        <Select value={selectedStand} onValueChange={setSelectedStand}>
          <SelectTrigger className="w-full bg-slate-800/50 border-slate-700/50 h-9" data-testid="select-stand">
            <Store className="h-4 w-4 mr-2 text-slate-400" />
            <SelectValue placeholder="All Stands" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Stands</SelectItem>
            {stands.map(stand => (
              <SelectItem key={stand.id} value={stand.id}>{stand.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )
    },
    {
      title: "Date Filter",
      content: (
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-slate-400" />
          <Input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="flex-1 bg-slate-800/50 border-slate-700/50 text-slate-200 h-9"
            data-testid="input-date-filter"
          />
        </div>
      )
    },
    {
      title: "Quick Actions",
      content: (
        <div className="flex flex-col gap-2">
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="w-full justify-start text-slate-400 hover:text-white h-8"
              data-testid="button-clear-filters"
            >
              Clear All Filters
            </Button>
          )}
          <p className="text-[10px] text-slate-500">
            {filteredDocuments.length} of {documents.length} documents shown
          </p>
        </div>
      )
    },
  ];

  const iconColors: Record<string, string> = {
    cyan: 'text-cyan-400',
    amber: 'text-amber-400',
    red: 'text-red-400',
    purple: 'text-purple-400',
    slate: 'text-slate-400',
  };

  const bgColors: Record<string, string> = {
    cyan: 'bg-cyan-500/20',
    amber: 'bg-amber-500/20',
    red: 'bg-red-500/20',
    purple: 'bg-purple-500/20',
    slate: 'bg-slate-500/20',
  };

  return (
    <AnimatedBackground>
      <div className="min-h-screen pb-20" data-testid="document-hub">
        <LayoutShell className="container mx-auto p-3 max-w-7xl gap-3">
          
          <BentoCard span={12} data-testid="card-header">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30">
                  <FileStack className="h-6 w-6 text-cyan-400" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">Document Hub</h1>
                  <p className="text-xs text-slate-400">Centralized archive for all reports and documents</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => setShowScanner(true)}
                  className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white"
                  size="sm"
                  data-testid="button-scan-document"
                >
                  <ScanLine className="h-4 w-4 mr-1" />
                  Scan
                </Button>
                <Button
                  onClick={() => setShowReportBuilder(true)}
                  className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white"
                  size="sm"
                  data-testid="button-report-builder"
                >
                  <BookOpen className="h-4 w-4 mr-1" />
                  Build Report
                </Button>
                <Link href="/manager">
                  <Button variant="ghost" size="sm" className="text-slate-300 hover:bg-white/10" data-testid="button-back">
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Back
                  </Button>
                </Link>
              </div>
            </div>
          </BentoCard>

          <BentoCard span={12} title="Document Metrics" data-testid="card-metrics">
            <CarouselRail
              items={docMetrics.map((metric, idx) => (
                <div 
                  key={idx} 
                  className={cn(
                    "w-36 p-4 rounded-xl border border-white/10 transition-all hover:scale-105",
                    metric.bg
                  )}
                  data-testid={`metric-${metric.label.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-1.5 rounded-lg bg-white/10">
                      {metric.icon}
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-white">{metric.value}</p>
                  <p className="text-[11px] text-slate-300 mt-1">{metric.label}</p>
                </div>
              ))}
              showDots
            />
          </BentoCard>

          <BentoCard span={12} title="Categories" data-testid="card-categories">
            <CarouselRail
              items={[
                <div
                  key="all"
                  onClick={() => setSelectedCategory('all')}
                  className={cn(
                    "w-32 p-4 rounded-xl border cursor-pointer transition-all hover:scale-105",
                    selectedCategory === 'all'
                      ? 'bg-gradient-to-br from-cyan-500/30 to-blue-500/30 border-cyan-500/50 shadow-lg shadow-cyan-500/20'
                      : 'bg-slate-800/50 border-slate-700/50 hover:border-slate-600'
                  )}
                  data-testid="category-all"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Files className="h-5 w-5 text-cyan-400" />
                    <span className="text-lg font-bold text-white">{documents.length}</span>
                  </div>
                  <p className="text-[11px] text-slate-300">All Documents</p>
                </div>,
                ...Object.entries(CATEGORY_CONFIG).map(([key, config]) => {
                  const count = documentsByCategory[key]?.length || 0;
                  const Icon = config.icon;
                  const isSelected = selectedCategory === key;
                  return (
                    <div
                      key={key}
                      onClick={() => setSelectedCategory(isSelected ? 'all' : key as DocumentCategory)}
                      className={cn(
                        "w-32 p-4 rounded-xl border cursor-pointer transition-all hover:scale-105",
                        isSelected
                          ? `${bgColors[config.color]} border-${config.color}-500/50 shadow-lg`
                          : 'bg-slate-800/50 border-slate-700/50 hover:border-slate-600'
                      )}
                      data-testid={`category-${key}`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Icon className={cn("h-5 w-5", iconColors[config.color])} />
                        <span className="text-lg font-bold text-white">{count}</span>
                      </div>
                      <p className="text-[11px] text-slate-300">{config.label}</p>
                    </div>
                  );
                })
              ]}
            />
          </BentoCard>

          <BentoCard span={12} title="Search" data-testid="card-search">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search documents by title or notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-slate-800/50 border-slate-700/50 text-slate-200 h-10"
                data-testid="input-search"
              />
            </div>
          </BentoCard>

          <BentoCard span={8} title={`Recent Documents (${filteredDocuments.length})`} rowSpan={2} data-testid="card-documents">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-10 w-10 text-cyan-400 animate-spin" />
              </div>
            ) : filteredDocuments.length === 0 ? (
              <div className="text-center py-12">
                <FolderOpen className="h-12 w-12 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400 text-sm font-medium">No documents found</p>
                <p className="text-xs text-slate-500 mt-1">
                  {documents.length === 0 ? "Reports will appear here when submitted" : "Try adjusting your filters"}
                </p>
              </div>
            ) : (
              <>
                <CarouselRail
                  items={filteredDocuments.slice(0, 12).map((doc) => {
                    const config = CATEGORY_CONFIG[normalizeCategory(doc.category)] || CATEGORY_CONFIG.other;
                    const Icon = config.icon;
                    return (
                      <motion.div
                        key={doc.id}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        onClick={() => setViewingDoc(doc)}
                        className="w-56 p-4 bg-slate-800/40 rounded-xl border border-slate-700/30 hover:bg-slate-800/60 hover:border-cyan-500/30 cursor-pointer transition-all"
                        data-testid={`doc-${doc.id}`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={cn("p-2 rounded-lg shrink-0", bgColors[config.color])}>
                            <Icon className={cn("h-4 w-4", iconColors[config.color])} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-200 truncate mb-1">{doc.title}</p>
                            <div className="space-y-0.5">
                              {doc.standId && (
                                <p className="text-[10px] text-slate-500 flex items-center gap-1">
                                  <Store className="h-3 w-3" />
                                  {getStandName(doc.standId)}
                                </p>
                              )}
                              <p className="text-[10px] text-slate-500">{formatDate(doc.createdAt)}</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-700/30">
                          <Badge className={cn("text-[9px] px-1.5 py-0.5", bgColors[config.color])}>
                            {config.label}
                          </Badge>
                          <div className="flex items-center gap-1">
                            {doc.pdfUrl && (
                              <Button 
                                size="icon" 
                                variant="ghost" 
                                className="h-6 w-6" 
                                onClick={(e) => { e.stopPropagation(); window.open(doc.pdfUrl, '_blank'); }}
                              >
                                <Download className="h-3 w-3 text-cyan-400" />
                              </Button>
                            )}
                            <Eye className="h-3 w-3 text-slate-400" />
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                  showDots
                />
                {filteredDocuments.length > 12 && (
                  <p className="text-xs text-slate-500 text-center mt-3">
                    Showing 12 of {filteredDocuments.length} documents
                  </p>
                )}
              </>
            )}
          </BentoCard>

          <BentoCard span={4} title="Policies & Filters" rowSpan={2} data-testid="card-policies">
            <AccordionStack items={policyItems} defaultOpen={[0]} />
            <div className="mt-4 pt-3 border-t border-slate-700/30">
              <p className="text-xs font-medium text-slate-400 mb-2">Filters</p>
              <AccordionStack items={filterItems} defaultOpen={[0, 1]} />
            </div>
          </BentoCard>

        </LayoutShell>

        <Dialog open={!!viewingDoc} onOpenChange={() => setViewingDoc(null)}>
          <DialogContent className="bg-slate-900 border-slate-700 max-w-lg" data-testid="dialog-view-doc">
            <DialogHeader>
              <DialogTitle className="text-slate-200 flex items-center gap-2">
                <FileText className="h-5 w-5 text-cyan-400" />
                {viewingDoc?.title}
              </DialogTitle>
              {viewingDoc?.category && (
                <Badge className={cn(
                  "w-fit",
                  bgColors[CATEGORY_CONFIG[normalizeCategory(viewingDoc.category)]?.color || 'slate'],
                  iconColors[CATEGORY_CONFIG[normalizeCategory(viewingDoc.category)]?.color || 'slate']
                )}>
                  {CATEGORY_CONFIG[normalizeCategory(viewingDoc.category)]?.label || 'Other'}
                </Badge>
              )}
            </DialogHeader>

            {viewingDoc && (
              <div className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-3">
                  {viewingDoc.standId && (
                    <div className="p-2 bg-white/5 rounded-lg">
                      <p className="text-xs text-slate-500">Stand</p>
                      <p className="text-sm text-slate-200">{getStandName(viewingDoc.standId)}</p>
                    </div>
                  )}
                  {viewingDoc.eventDate && (
                    <div className="p-2 bg-white/5 rounded-lg">
                      <p className="text-xs text-slate-500">Event Date</p>
                      <p className="text-sm text-slate-200">{viewingDoc.eventDate}</p>
                    </div>
                  )}
                  <div className="p-2 bg-white/5 rounded-lg">
                    <p className="text-xs text-slate-500">Created</p>
                    <p className="text-sm text-slate-200">{formatDate(viewingDoc.createdAt)}</p>
                  </div>
                  {viewingDoc.subcategory && (
                    <div className="p-2 bg-white/5 rounded-lg">
                      <p className="text-xs text-slate-500">Subcategory</p>
                      <p className="text-sm text-slate-200">{viewingDoc.subcategory}</p>
                    </div>
                  )}
                </div>

                {viewingDoc.notes && (
                  <div className="p-3 bg-white/5 rounded-lg">
                    <p className="text-xs text-slate-500 mb-1">Notes</p>
                    <p className="text-sm text-slate-300">{viewingDoc.notes}</p>
                  </div>
                )}

                {viewingDoc.jsonData && (
                  <div className="p-3 bg-white/5 rounded-lg">
                    <p className="text-xs text-slate-500 mb-2">Report Data</p>
                    <ScrollArea className="h-[200px]">
                      <pre className="text-xs text-slate-300 whitespace-pre-wrap">
                        {JSON.stringify(viewingDoc.jsonData, null, 2)}
                      </pre>
                    </ScrollArea>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  {viewingDoc.pdfUrl && (
                    <GlowButton variant="cyan" className="flex-1" onClick={() => window.open(viewingDoc.pdfUrl, '_blank')}>
                      <Download className="h-4 w-4 mr-2" />
                      Download PDF
                    </GlowButton>
                  )}
                  <Button
                    variant="outline"
                    className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                    onClick={() => viewingDoc && deleteDocument(viewingDoc.id)}
                    data-testid="button-delete-doc"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        <EventReportBuilder isOpen={showReportBuilder} onClose={() => setShowReportBuilder(false)} />

        {showScanner && (
          <UniversalDocumentScanner
            onClose={() => setShowScanner(false)}
            onDocumentSaved={() => { fetchData(); setShowScanner(false); }}
          />
        )}
      </div>
    </AnimatedBackground>
  );
}
