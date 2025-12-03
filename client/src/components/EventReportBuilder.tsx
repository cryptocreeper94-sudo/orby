import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileStack,
  Calendar,
  Download,
  Loader2,
  CheckCircle2,
  Package,
  Shield,
  Wrench,
  ClipboardList,
  AlertTriangle,
  Wine,
  FileText,
  FolderOpen,
  ChevronRight,
  X,
  Printer,
  Share2,
  BookOpen
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import jsPDF from "jspdf";
import "jspdf-autotable";

type DocumentCategory = 'count_report' | 'incident' | 'violation' | 'closing' | 'other';

interface ManagerDocument {
  id: string;
  title: string;
  category: string;
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
  incident: {
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
  other: {
    label: 'Other',
    icon: FolderOpen,
    color: 'slate'
  }
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

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  icon: any;
  color: string;
  categories: DocumentCategory[];
}

const REPORT_TEMPLATES: ReportTemplate[] = [
  {
    id: 'finance',
    name: 'Finance Package',
    description: 'Count reports, closing docs, cash counts, and variance reports',
    icon: Package,
    color: 'emerald',
    categories: ['count_report', 'closing']
  },
  {
    id: 'compliance',
    name: 'Compliance Package',
    description: 'Incidents, violations, bar control, alcohol compliance, and ABC/Health alerts',
    icon: Shield,
    color: 'amber',
    categories: ['incident', 'violation']
  },
  {
    id: 'operations',
    name: 'Operations Package',
    description: 'Full event summary including all document types',
    icon: Wrench,
    color: 'cyan',
    categories: ['count_report', 'incident', 'violation', 'closing', 'other']
  },
  {
    id: 'custom',
    name: 'Custom Package',
    description: 'Select exactly which categories to include',
    icon: FileStack,
    color: 'violet',
    categories: []
  }
];

interface EventReportBuilderProps {
  isOpen: boolean;
  onClose: () => void;
}

export function EventReportBuilder({ isOpen, onClose }: EventReportBuilderProps) {
  const { toast } = useToast();
  const [step, setStep] = useState<'date' | 'template' | 'preview' | 'generating'>('date');
  const [eventDate, setEventDate] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null);
  const [customCategories, setCustomCategories] = useState<DocumentCategory[]>([]);
  const [documents, setDocuments] = useState<ManagerDocument[]>([]);
  const [stands, setStands] = useState<Stand[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [availableDates, setAvailableDates] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setStep('date');
      setEventDate('');
      setSelectedTemplate(null);
      setCustomCategories([]);
    }
  }, [isOpen]);

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
        const dateSet = new Set<string>();
        docsData.forEach((d: ManagerDocument) => {
          if (d.eventDate) dateSet.add(d.eventDate);
        });
        const dates = Array.from(dateSet);
        setAvailableDates(dates.sort().reverse());
      }
      if (standsRes.ok) {
        const standsData = await standsRes.json();
        setStands(standsData);
      }
    } catch (error) {
      console.error('Failed to fetch documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSelectedCategories = (): DocumentCategory[] => {
    if (!selectedTemplate) return [];
    if (selectedTemplate.id === 'custom') return customCategories;
    return selectedTemplate.categories;
  };

  const getFilteredDocuments = () => {
    const categories = getSelectedCategories();
    return documents.filter(doc => {
      const docCategory = normalizeCategory(doc.category);
      return doc.eventDate === eventDate && categories.includes(docCategory);
    });
  };

  const getDocumentsByCategory = () => {
    const filtered = getFilteredDocuments();
    return filtered.reduce((acc, doc) => {
      const category = normalizeCategory(doc.category);
      if (!acc[category]) acc[category] = [];
      acc[category].push(doc);
      return acc;
    }, {} as Record<string, ManagerDocument[]>);
  };

  const getStandName = (standId?: string) => {
    if (!standId) return 'All Stands';
    const stand = stands.find(s => s.id === standId);
    return stand?.name || standId;
  };

  const toggleCategory = (category: DocumentCategory) => {
    setCustomCategories(prev => 
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const generateCombinedPDF = async () => {
    const filteredDocs = getFilteredDocuments();
    
    if (filteredDocs.length === 0) {
      toast({
        title: "No Documents Found",
        description: "There are no documents matching your selection. Please try a different date or template.",
        variant: "destructive"
      });
      return;
    }
    
    setGenerating(true);
    setStep('generating');

    try {
      const docsByCategory = getDocumentsByCategory();
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, pageWidth, pageHeight, 'F');

      doc.setTextColor(6, 182, 212);
      doc.setFontSize(28);
      doc.setFont('helvetica', 'bold');
      doc.text('EVENT REPORT PACKAGE', pageWidth / 2, 40, { align: 'center' });

      doc.setTextColor(148, 163, 184);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'normal');
      doc.text(`Event Date: ${eventDate}`, pageWidth / 2, 55, { align: 'center' });
      doc.text(`Template: ${selectedTemplate?.name || 'Custom'}`, pageWidth / 2, 65, { align: 'center' });
      doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth / 2, 75, { align: 'center' });

      doc.setTextColor(6, 182, 212);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('TABLE OF CONTENTS', pageWidth / 2, 100, { align: 'center' });

      let tocY = 115;
      let pageNum = 2;
      const tocEntries: { title: string; page: number }[] = [];

      Object.entries(docsByCategory).forEach(([category, docs]) => {
        const config = CATEGORY_CONFIG[category as DocumentCategory];
        tocEntries.push({ title: `${config.label} (${docs.length} documents)`, page: pageNum });
        pageNum += Math.ceil(docs.length / 3);
      });

      doc.setTextColor(226, 232, 240);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      tocEntries.forEach(entry => {
        const dotCount = Math.floor((pageWidth - 80) / 2);
        const dots = '.'.repeat(dotCount);
        doc.text(entry.title, 30, tocY);
        doc.text(dots, 30 + doc.getTextWidth(entry.title) + 5, tocY);
        doc.text(`Page ${entry.page}`, pageWidth - 30, tocY, { align: 'right' });
        tocY += 10;
      });

      doc.setTextColor(100, 116, 139);
      doc.setFontSize(10);
      doc.text(`Total Documents: ${filteredDocs.length}`, pageWidth / 2, pageHeight - 30, { align: 'center' });
      doc.text('Orby - Venue Operations Platform', pageWidth / 2, pageHeight - 20, { align: 'center' });

      Object.entries(docsByCategory).forEach(([category, docs]) => {
        const config = CATEGORY_CONFIG[category as DocumentCategory];
        
        doc.addPage();
        
        doc.setFillColor(15, 23, 42);
        doc.rect(0, 0, pageWidth, pageHeight, 'F');

        doc.setTextColor(6, 182, 212);
        doc.setFontSize(20);
        doc.setFont('helvetica', 'bold');
        doc.text(config.label.toUpperCase(), pageWidth / 2, 25, { align: 'center' });

        doc.setDrawColor(6, 182, 212);
        doc.setLineWidth(0.5);
        doc.line(30, 30, pageWidth - 30, 30);

        doc.setTextColor(148, 163, 184);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`${docs.length} document(s) for ${eventDate}`, pageWidth / 2, 38, { align: 'center' });

        let yPos = 50;
        docs.forEach((document, idx) => {
          if (yPos > pageHeight - 80) {
            doc.addPage();
            doc.setFillColor(15, 23, 42);
            doc.rect(0, 0, pageWidth, pageHeight, 'F');
            yPos = 30;
          }

          doc.setFillColor(30, 41, 59);
          doc.roundedRect(20, yPos, pageWidth - 40, 45, 3, 3, 'F');

          doc.setTextColor(226, 232, 240);
          doc.setFontSize(12);
          doc.setFont('helvetica', 'bold');
          doc.text(document.title, 30, yPos + 15);

          doc.setTextColor(148, 163, 184);
          doc.setFontSize(9);
          doc.setFont('helvetica', 'normal');
          
          const infoLine = [
            document.standId ? `Stand: ${getStandName(document.standId)}` : null,
            `Created: ${new Date(document.createdAt).toLocaleString()}`
          ].filter(Boolean).join(' | ');
          doc.text(infoLine, 30, yPos + 28);

          if (document.subcategory) {
            doc.setTextColor(6, 182, 212);
            doc.text(document.subcategory, pageWidth - 30, yPos + 15, { align: 'right' });
          }

          if (document.notes) {
            doc.setTextColor(100, 116, 139);
            doc.setFontSize(8);
            const truncatedNotes = document.notes.length > 60 
              ? document.notes.substring(0, 60) + '...' 
              : document.notes;
            doc.text(truncatedNotes, 30, yPos + 38);
          }

          yPos += 53;

          if (document.jsonData && document.jsonData.items && Array.isArray(document.jsonData.items) && document.jsonData.items.length > 0) {
            const items = document.jsonData.items.slice(0, 20);
            const tableData = items.map((item: any) => [
              item.itemName || item.name || 'Unknown',
              item.category || '-',
              String(item.count || item.quantity || 0)
            ]);
            
            if (yPos > pageHeight - 60) {
              doc.addPage();
              doc.setFillColor(15, 23, 42);
              doc.rect(0, 0, pageWidth, pageHeight, 'F');
              yPos = 30;
            }

            (doc as any).autoTable({
              startY: yPos,
              head: [['Item', 'Category', 'Count']],
              body: tableData,
              theme: 'striped',
              headStyles: { 
                fillColor: [6, 182, 212], 
                textColor: [15, 23, 42],
                fontSize: 8,
                fontStyle: 'bold'
              },
              bodyStyles: { 
                fillColor: [30, 41, 59],
                textColor: [226, 232, 240],
                fontSize: 7
              },
              alternateRowStyles: {
                fillColor: [15, 23, 42]
              },
              margin: { left: 25, right: 25 },
              columnStyles: {
                0: { cellWidth: 70 },
                1: { cellWidth: 50 },
                2: { cellWidth: 30, halign: 'center' }
              }
            });
            
            yPos = (doc as any).lastAutoTable.finalY + 5;
            
            const totalCount = document.jsonData.items.reduce((sum: number, item: any) => sum + (item.count || item.quantity || 0), 0);
            doc.setTextColor(6, 182, 212);
            doc.setFontSize(9);
            doc.setFont('helvetica', 'bold');
            doc.text(`Total: ${totalCount} items`, pageWidth - 30, yPos, { align: 'right' });
            if (document.jsonData.items.length > 20) {
              doc.setTextColor(148, 163, 184);
              doc.setFontSize(7);
              doc.text(`(showing 20 of ${document.jsonData.items.length})`, pageWidth - 30, yPos + 8, { align: 'right' });
            }
            yPos += 15;
          } else if (document.jsonData && document.jsonData.totalVariance !== undefined) {
            doc.setTextColor(6, 182, 212);
            doc.setFontSize(9);
            doc.setFont('helvetica', 'bold');
            doc.text(`Variance: ${document.jsonData.totalVariance} units (${document.jsonData.totalVariancePercent?.toFixed(1) || 0}%)`, 30, yPos);
            yPos += 12;
          } else if (document.jsonData && (document.jsonData.description || document.jsonData.severity)) {
            if (document.jsonData.severity) {
              doc.setTextColor(document.jsonData.severity === 'high' || document.jsonData.severity === 'critical' ? 220 : 6, 
                              document.jsonData.severity === 'high' || document.jsonData.severity === 'critical' ? 38 : 182, 
                              document.jsonData.severity === 'high' || document.jsonData.severity === 'critical' ? 38 : 212);
              doc.setFontSize(9);
              doc.setFont('helvetica', 'bold');
              doc.text(`Severity: ${document.jsonData.severity.toUpperCase()}`, 30, yPos);
              yPos += 10;
            }
            if (document.jsonData.description) {
              doc.setTextColor(226, 232, 240);
              doc.setFontSize(8);
              doc.setFont('helvetica', 'normal');
              const descLines = doc.splitTextToSize(document.jsonData.description, pageWidth - 60);
              doc.text(descLines.slice(0, 4), 30, yPos);
              yPos += Math.min(descLines.length, 4) * 5 + 8;
            }
          }

          yPos += 5;
        });

        doc.setTextColor(100, 116, 139);
        doc.setFontSize(8);
        doc.text(`Page ${doc.internal.pages.length - 1}`, pageWidth - 20, pageHeight - 10, { align: 'right' });
      });

      doc.addPage();
      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, pageWidth, pageHeight, 'F');

      doc.setTextColor(6, 182, 212);
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('SUMMARY', pageWidth / 2, 40, { align: 'center' });

      const summaryData = Object.entries(docsByCategory).map(([category, docs]) => {
        const config = CATEGORY_CONFIG[category as DocumentCategory];
        return [config.label, docs.length.toString()];
      });

      (doc as any).autoTable({
        startY: 60,
        head: [['Category', 'Documents']],
        body: summaryData,
        foot: [['Total', filteredDocs.length.toString()]],
        theme: 'grid',
        headStyles: { 
          fillColor: [6, 182, 212], 
          textColor: [15, 23, 42],
          fontSize: 11,
          fontStyle: 'bold'
        },
        bodyStyles: { 
          fillColor: [30, 41, 59],
          textColor: [226, 232, 240],
          fontSize: 10
        },
        footStyles: {
          fillColor: [15, 23, 42],
          textColor: [6, 182, 212],
          fontSize: 11,
          fontStyle: 'bold'
        },
        margin: { left: 40, right: 40 },
        columnStyles: {
          0: { cellWidth: 80 },
          1: { cellWidth: 40, halign: 'center' }
        }
      });

      const finalY = (doc as any).lastAutoTable.finalY + 30;
      doc.setTextColor(100, 116, 139);
      doc.setFontSize(10);
      doc.text('This report was generated by Orby - Venue Operations Platform', pageWidth / 2, finalY, { align: 'center' });
      doc.text('All documents are archived and can be accessed individually in the Document Hub', pageWidth / 2, finalY + 12, { align: 'center' });

      const filename = `Event_Report_${eventDate}_${selectedTemplate?.id || 'custom'}.pdf`;
      doc.save(filename);

      toast({
        title: "Report Generated",
        description: `${filename} has been downloaded with ${filteredDocs.length} documents.`,
      });

      setTimeout(() => {
        setGenerating(false);
        onClose();
      }, 1000);

    } catch (error) {
      console.error('Failed to generate PDF:', error);
      toast({
        title: "Generation Failed",
        description: "Failed to create the report. Please try again.",
        variant: "destructive"
      });
      setGenerating(false);
      setStep('preview');
    }
  };

  const canProceedFromDate = eventDate !== '';
  const canProceedFromTemplate = selectedTemplate !== null && 
    (selectedTemplate.id !== 'custom' || customCategories.length > 0);
  const filteredDocsCount = getFilteredDocuments().length;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900/95 backdrop-blur-xl border-white/10 max-w-2xl max-h-[85vh] overflow-hidden p-0" data-testid="event-report-builder">
        <DialogHeader className="p-6 pb-4 border-b border-white/10">
          <DialogTitle className="text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-cyan-400" />
            Event Report Builder
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(85vh-120px)]">
          <div className="p-6">
            <AnimatePresence mode="wait">
              {step === 'date' && (
                <motion.div
                  key="date"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div className="text-center mb-6">
                    <Calendar className="h-12 w-12 text-cyan-400 mx-auto mb-3" />
                    <h3 className="text-lg font-semibold text-white">Select Event Date</h3>
                    <p className="text-sm text-slate-400">Choose the event you want to generate a report for</p>
                  </div>

                  <Input
                    type="date"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="bg-white/5 border-white/10 text-white text-center text-lg py-6"
                    data-testid="input-event-date"
                  />

                  {availableDates.length > 0 && (
                    <div className="mt-4">
                      <p className="text-xs text-slate-500 mb-2">Recent events with documents:</p>
                      <div className="flex flex-wrap gap-2">
                        {availableDates.slice(0, 6).map(date => (
                          <Badge
                            key={date}
                            variant={eventDate === date ? "default" : "outline"}
                            className={`cursor-pointer ${
                              eventDate === date 
                                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50' 
                                : 'border-white/20 text-slate-400 hover:bg-white/10'
                            }`}
                            onClick={() => setEventDate(date)}
                          >
                            {date}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end pt-4">
                    <Button
                      disabled={!canProceedFromDate}
                      onClick={() => setStep('template')}
                      className="bg-cyan-500 hover:bg-cyan-600"
                      data-testid="button-next-template"
                    >
                      Next: Choose Template
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </motion.div>
              )}

              {step === 'template' && (
                <motion.div
                  key="template"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div className="text-center mb-4">
                    <Package className="h-12 w-12 text-cyan-400 mx-auto mb-3" />
                    <h3 className="text-lg font-semibold text-white">Choose Report Template</h3>
                    <p className="text-sm text-slate-400">Select a preset or build your own custom package</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {REPORT_TEMPLATES.map(template => {
                      const Icon = template.icon;
                      const isSelected = selectedTemplate?.id === template.id;
                      return (
                        <motion.div
                          key={template.id}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setSelectedTemplate(template)}
                          className={`p-4 rounded-xl border cursor-pointer transition-all ${
                            isSelected
                              ? `bg-${template.color}-500/20 border-${template.color}-500/50`
                              : 'bg-white/5 border-white/10 hover:bg-white/10'
                          }`}
                          data-testid={`template-${template.id}`}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`p-2 rounded-lg bg-${template.color}-500/20`}>
                              <Icon className={`h-5 w-5 text-${template.color}-400`} />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium text-white">{template.name}</h4>
                                {isSelected && <CheckCircle2 className="h-4 w-4 text-cyan-400" />}
                              </div>
                              <p className="text-xs text-slate-400 mt-1">{template.description}</p>
                              {template.categories.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {template.categories.map(cat => (
                                    <Badge key={cat} variant="outline" className="text-[10px] border-white/20 text-slate-400">
                                      {CATEGORY_CONFIG[cat].label}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>

                  {selectedTemplate?.id === 'custom' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="p-4 bg-white/5 rounded-xl border border-white/10 mt-4"
                    >
                      <p className="text-sm text-slate-300 mb-3">Select categories to include:</p>
                      <div className="space-y-2">
                        {(Object.entries(CATEGORY_CONFIG) as [DocumentCategory, typeof CATEGORY_CONFIG[DocumentCategory]][]).map(([key, config]) => {
                          const Icon = config.icon;
                          const docCount = documents.filter(d => d.eventDate === eventDate && d.category === key).length;
                          return (
                            <div
                              key={key}
                              className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5"
                              onClick={() => toggleCategory(key)}
                            >
                              <Checkbox
                                checked={customCategories.includes(key)}
                                onCheckedChange={() => toggleCategory(key)}
                                className="border-white/30"
                              />
                              <Icon className={`h-4 w-4 text-${config.color}-400`} />
                              <span className="text-sm text-slate-200 flex-1">{config.label}</span>
                              <Badge variant="outline" className="text-[10px] border-white/20 text-slate-500">
                                {docCount} docs
                              </Badge>
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}

                  <div className="flex justify-between pt-4">
                    <Button
                      variant="ghost"
                      onClick={() => setStep('date')}
                      className="text-slate-400"
                    >
                      Back
                    </Button>
                    <Button
                      disabled={!canProceedFromTemplate}
                      onClick={() => setStep('preview')}
                      className="bg-cyan-500 hover:bg-cyan-600"
                      data-testid="button-next-preview"
                    >
                      Preview Report
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </motion.div>
              )}

              {step === 'preview' && (
                <motion.div
                  key="preview"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div className="text-center mb-4">
                    <FileStack className="h-12 w-12 text-cyan-400 mx-auto mb-3" />
                    <h3 className="text-lg font-semibold text-white">Report Preview</h3>
                    <p className="text-sm text-slate-400">
                      {filteredDocsCount} documents will be included
                    </p>
                  </div>

                  <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-slate-500">Event Date</p>
                        <p className="text-white font-medium">{eventDate}</p>
                      </div>
                      <div>
                        <p className="text-slate-500">Template</p>
                        <p className="text-white font-medium">{selectedTemplate?.name}</p>
                      </div>
                      <div>
                        <p className="text-slate-500">Categories</p>
                        <p className="text-white font-medium">{getSelectedCategories().length}</p>
                      </div>
                      <div>
                        <p className="text-slate-500">Documents</p>
                        <p className="text-white font-medium">{filteredDocsCount}</p>
                      </div>
                    </div>
                  </div>

                  {filteredDocsCount === 0 ? (
                    <div className="p-6 bg-amber-500/10 rounded-xl border border-amber-500/30 text-center">
                      <AlertTriangle className="h-8 w-8 text-amber-400 mx-auto mb-2" />
                      <p className="text-amber-300">No documents found for this selection</p>
                      <p className="text-sm text-amber-400/70 mt-1">
                        Try selecting a different date or template
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-xs text-slate-500 uppercase tracking-wide">Documents by Category</p>
                      {Object.entries(getDocumentsByCategory()).map(([category, docs]) => {
                        const config = CATEGORY_CONFIG[category as DocumentCategory];
                        const Icon = config.icon;
                        return (
                          <div key={category} className="p-3 bg-white/5 rounded-lg border border-white/10">
                            <div className="flex items-center gap-2 mb-2">
                              <Icon className={`h-4 w-4 text-${config.color}-400`} />
                              <span className="text-sm font-medium text-white">{config.label}</span>
                              <Badge variant="outline" className="ml-auto text-[10px] border-white/20">
                                {docs.length}
                              </Badge>
                            </div>
                            <div className="space-y-1">
                              {docs.slice(0, 3).map(doc => (
                                <p key={doc.id} className="text-xs text-slate-400 truncate pl-6">
                                  {doc.title}
                                </p>
                              ))}
                              {docs.length > 3 && (
                                <p className="text-xs text-slate-500 pl-6">
                                  +{docs.length - 3} more...
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <div className="flex justify-between pt-4">
                    <Button
                      variant="ghost"
                      onClick={() => setStep('template')}
                      className="text-slate-400"
                    >
                      Back
                    </Button>
                    <Button
                      disabled={filteredDocsCount === 0}
                      onClick={generateCombinedPDF}
                      className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
                      data-testid="button-generate-report"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Generate PDF
                    </Button>
                  </div>
                </motion.div>
              )}

              {step === 'generating' && (
                <motion.div
                  key="generating"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="py-12 text-center"
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                    className="mx-auto mb-6"
                  >
                    <Loader2 className="h-16 w-16 text-cyan-400" />
                  </motion.div>
                  <h3 className="text-lg font-semibold text-white mb-2">Generating Report</h3>
                  <p className="text-sm text-slate-400">
                    Compiling {filteredDocsCount} documents into one PDF...
                  </p>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 2 }}
                    className="h-1 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full mt-6 mx-auto max-w-xs"
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
