import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FileText, 
  ChevronLeft, 
  Search,
  Calendar,
  Store,
  Filter,
  Download,
  Eye,
  Trash2,
  Clock,
  User,
  FolderOpen,
  ClipboardList,
  AlertTriangle,
  Wine,
  Loader2,
  AlertCircle,
  FileStack,
  BookOpen,
  ScanLine,
  DollarSign,
  Users,
  Grid3X3,
  Thermometer
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  AnimatedBackground, 
  GlassCard, 
  GlassCardContent, 
  GlassCardHeader, 
  PageHeader,
  GlowButton
} from "@/components/ui/premium";
import { useStore } from "@/lib/mockData";
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EventReportBuilder } from "@/components/EventReportBuilder";
import { UniversalDocumentScanner } from "@/components/UniversalDocumentScanner";

type DocumentCategory = 'count_report' | 'incident' | 'violation' | 'closing' | 'other' | 'compliance' | 'finance' | 'operations';

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
  count_report: {
    label: 'Count Reports',
    icon: ClipboardList,
    color: 'cyan'
  },
  CountReport: {
    label: 'Count Reports',
    icon: ClipboardList,
    color: 'cyan'
  },
  incident: {
    label: 'Incidents',
    icon: AlertTriangle,
    color: 'amber'
  },
  IncidentReport: {
    label: 'Incidents',
    icon: AlertTriangle,
    color: 'amber'
  },
  violation: {
    label: 'Violations',
    icon: Wine,
    color: 'red'
  },
  closing: {
    label: 'Closing Docs',
    icon: FileText,
    color: 'purple'
  },
  Closing: {
    label: 'Closing Docs',
    icon: FileText,
    color: 'purple'
  },
  compliance: {
    label: 'Compliance',
    icon: Wine,
    color: 'emerald'
  },
  Compliance: {
    label: 'Compliance',
    icon: Wine,
    color: 'emerald'
  },
  finance: {
    label: 'Finance',
    icon: DollarSign,
    color: 'green'
  },
  Finance: {
    label: 'Finance',
    icon: DollarSign,
    color: 'green'
  },
  operations: {
    label: 'Operations',
    icon: Grid3X3,
    color: 'blue'
  },
  Operations: {
    label: 'Operations',
    icon: Grid3X3,
    color: 'blue'
  },
  other: {
    label: 'Other',
    icon: FolderOpen,
    color: 'slate'
  },
  Other: {
    label: 'Other',
    icon: FolderOpen,
    color: 'slate'
  }
};

export default function DocumentHub() {
  const [, setLocation] = useLocation();
  const currentUser = useStore((state: { currentUser: any }) => state.currentUser);
  const { toast } = useToast();

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
    
    const matchesCategory = selectedCategory === 'all' || doc.category === selectedCategory;
    const matchesStand = selectedStand === 'all' || doc.standId === selectedStand;
    const matchesDate = !dateFilter || doc.eventDate === dateFilter;

    return matchesSearch && matchesCategory && matchesStand && matchesDate;
  });

  const documentsByCategory = documents.reduce((acc, doc) => {
    if (!acc[doc.category]) acc[doc.category] = [];
    acc[doc.category].push(doc);
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
      toast({
        title: "Deleted",
        description: "Document has been removed.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete document.",
        variant: "destructive"
      });
    }
  };

  if (!currentUser || !['Developer', 'Admin', 'Management', 'Warehouse', 'Kitchen', 'Operations'].includes(currentUser.role)) {
    return (
      <AnimatedBackground>
        <div className="min-h-screen flex items-center justify-center p-4">
          <GlassCard className="max-w-md w-full">
            <GlassCardContent className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-amber-400 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-slate-200 mb-2">Access Restricted</h2>
              <p className="text-slate-400 mb-4">Document Hub is only available for managers.</p>
              <Button onClick={() => setLocation('/')} className="bg-cyan-500 hover:bg-cyan-600">
                Return Home
              </Button>
            </GlassCardContent>
          </GlassCard>
        </div>
      </AnimatedBackground>
    );
  }

  return (
    <AnimatedBackground>
      <div className="min-h-screen pb-20" data-testid="document-hub">
        <PageHeader
          title="Document Hub"
          subtitle="Centralized archive for all reports and documents"
          icon={<FileStack className="h-6 w-6 text-cyan-400" />}
          iconColor="cyan"
          actions={
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
          }
        />

        <main className="container mx-auto p-4 max-w-6xl">
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3 mb-6">
            {Object.entries(CATEGORY_CONFIG).map(([key, config]) => {
              const count = documentsByCategory[key]?.length || 0;
              const Icon = config.icon;
              const isSelected = selectedCategory === key;
              return (
                <motion.div
                  key={key}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedCategory(isSelected ? 'all' : key as DocumentCategory)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? `bg-${config.color}-500/20 border-${config.color}-500/50`
                      : 'bg-white/5 border-white/10 hover:bg-white/10'
                  }`}
                  data-testid={`category-${key}`}
                >
                  <div className="flex items-center gap-2">
                    <Icon className={`h-5 w-5 text-${config.color}-400`} />
                    <span className="text-sm font-medium text-slate-200">{count}</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{config.label}</p>
                </motion.div>
              );
            })}
          </div>

          <GlassCard className="mb-4">
            <GlassCardContent className="py-3">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search documents..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-white/5 border-white/10 text-slate-200"
                    data-testid="input-search"
                  />
                </div>
                
                <Select value={selectedStand} onValueChange={setSelectedStand}>
                  <SelectTrigger className="w-full sm:w-[180px] bg-white/5 border-white/10">
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

                <Input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="w-full sm:w-[160px] bg-white/5 border-white/10 text-slate-200"
                  data-testid="input-date-filter"
                />

                {(searchQuery || selectedCategory !== 'all' || selectedStand !== 'all' || dateFilter) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCategory('all');
                      setSelectedStand('all');
                      setDateFilter('');
                    }}
                    className="text-slate-400"
                  >
                    Clear
                  </Button>
                )}
              </div>
            </GlassCardContent>
          </GlassCard>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 text-cyan-400 animate-spin" />
            </div>
          ) : filteredDocuments.length === 0 ? (
            <GlassCard>
              <GlassCardContent className="text-center py-12">
                <FolderOpen className="h-12 w-12 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400 mb-2">No documents found</p>
                <p className="text-sm text-slate-500">
                  {documents.length === 0 
                    ? "Reports will appear here as they're generated"
                    : "Try adjusting your filters"
                  }
                </p>
              </GlassCardContent>
            </GlassCard>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm text-slate-400 px-2">
                <span>{filteredDocuments.length} document{filteredDocuments.length !== 1 ? 's' : ''}</span>
                <span>Sorted by date</span>
              </div>
              
              <ScrollArea className="h-[600px]">
                <div className="space-y-2 pr-2">
                  <AnimatePresence mode="popLayout">
                    {filteredDocuments.map((doc, idx) => {
                      const config = CATEGORY_CONFIG[doc.category] || CATEGORY_CONFIG.other;
                      const Icon = config.icon;
                      return (
                        <motion.div
                          key={doc.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ delay: idx * 0.02 }}
                          onClick={() => setViewingDoc(doc)}
                          className="p-3 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 cursor-pointer transition-all"
                          data-testid={`doc-${doc.id}`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg bg-${config.color}-500/20`}>
                              <Icon className={`h-4 w-4 text-${config.color}-400`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h3 className="font-medium text-slate-200 text-sm truncate">
                                  {doc.title}
                                </h3>
                                {doc.subcategory && (
                                  <Badge variant="outline" className="text-[10px] border-white/20 text-slate-400">
                                    {doc.subcategory}
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                                {doc.standId && (
                                  <span className="flex items-center gap-1">
                                    <Store className="h-3 w-3" />
                                    {getStandName(doc.standId)}
                                  </span>
                                )}
                                {doc.eventDate && (
                                  <span className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {doc.eventDate}
                                  </span>
                                )}
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {formatDate(doc.createdAt)}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              {doc.pdfUrl && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 w-8 p-0"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    window.open(doc.pdfUrl, '_blank');
                                  }}
                                >
                                  <Download className="h-4 w-4 text-cyan-400" />
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0"
                              >
                                <Eye className="h-4 w-4 text-slate-400" />
                              </Button>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              </ScrollArea>
            </div>
          )}
        </main>

        <Dialog open={!!viewingDoc} onOpenChange={() => setViewingDoc(null)}>
          <DialogContent className="bg-slate-900 border-slate-700 max-w-lg" data-testid="dialog-view-doc">
            <DialogHeader>
              <DialogTitle className="text-slate-200 flex items-center gap-2">
                <FileText className="h-5 w-5 text-cyan-400" />
                {viewingDoc?.title}
              </DialogTitle>
              {viewingDoc?.category && (
                <Badge className={`w-fit bg-${CATEGORY_CONFIG[viewingDoc.category].color}-500/20 text-${CATEGORY_CONFIG[viewingDoc.category].color}-300`}>
                  {CATEGORY_CONFIG[viewingDoc.category].label}
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
                    <GlowButton
                      variant="cyan"
                      className="flex-1"
                      onClick={() => window.open(viewingDoc.pdfUrl, '_blank')}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download PDF
                    </GlowButton>
                  )}
                  <Button
                    variant="outline"
                    className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                    onClick={() => viewingDoc && deleteDocument(viewingDoc.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Event Report Builder */}
        <EventReportBuilder
          isOpen={showReportBuilder}
          onClose={() => setShowReportBuilder(false)}
        />

        {/* Universal Document Scanner */}
        {showScanner && (
          <UniversalDocumentScanner
            isOpen={showScanner}
            onClose={() => setShowScanner(false)}
            onDocumentSaved={() => {
              fetchData();
              setShowScanner(false);
            }}
          />
        )}
      </div>
    </AnimatedBackground>
  );
}
