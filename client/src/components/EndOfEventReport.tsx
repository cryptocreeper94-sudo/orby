import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { 
  FileText, Download, Printer, ClipboardList, AlertTriangle, 
  CheckCircle2, User, Package, Clock, Calendar, MapPin, XCircle
} from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

interface CountSession {
  id: string;
  standId: string;
  eventDate: string;
  stage: 'PreEvent' | 'PostEvent' | 'DayAfter';
  counterName: string;
  counterRole: string;
  counterPhoneLast4: string;
  counterAffiliation?: string;
  assistingCounterName?: string | null;
  assistingCounterPhone4?: string | null;
  status: 'InProgress' | 'Completed' | 'Verified';
  startedAt?: string;
  completedAt?: string | null;
}

interface InventoryCount {
  itemId: string;
  itemName: string;
  category: string;
  startCount: number;
  endCount: number;
  adds: number;
  spoilage: number;
  sold: number;
  variance: number;
}

interface StandIssue {
  id: string;
  category: string;
  severity: string;
  title: string;
  description: string;
  status: string;
  createdAt: string;
  resolvedAt?: string | null;
  resolutionNotes?: string | null;
}

interface DocumentSignature {
  docTitle: string;
  signedBy: string;
  signedAt: string;
}

interface EndOfEventReportProps {
  eventDate: string;
  standId: string;
  standName: string;
  section: string;
  supervisorName?: string;
  countSessions: CountSession[];
  inventoryCounts: InventoryCount[];
  issues: StandIssue[];
  signatures: DocumentSignature[];
  onClose: () => void;
}

const STAGE_ORDER = { PreEvent: 1, PostEvent: 2, DayAfter: 3 };

const SEVERITY_COLORS: Record<string, string> = {
  Emergency: 'bg-red-100 text-red-700 border-red-300',
  High: 'bg-orange-100 text-orange-700 border-orange-300',
  Normal: 'bg-blue-100 text-blue-700 border-blue-300',
  Low: 'bg-gray-100 text-gray-700 border-gray-300'
};

const STATUS_COLORS: Record<string, string> = {
  Open: 'bg-yellow-100 text-yellow-700',
  Acknowledged: 'bg-blue-100 text-blue-700',
  InProgress: 'bg-purple-100 text-purple-700',
  Resolved: 'bg-green-100 text-green-700',
  Closed: 'bg-gray-100 text-gray-700',
  Completed: 'bg-green-100 text-green-700',
  Verified: 'bg-emerald-100 text-emerald-700'
};

export function EndOfEventReport({
  eventDate,
  standId,
  standName,
  section,
  supervisorName,
  countSessions,
  inventoryCounts,
  issues,
  signatures,
  onClose
}: EndOfEventReportProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const sortedSessions = [...countSessions].sort(
    (a, b) => STAGE_ORDER[a.stage] - STAGE_ORDER[b.stage]
  );

  const groupedCounts = inventoryCounts.reduce((acc, count) => {
    if (!acc[count.category]) acc[count.category] = [];
    acc[count.category].push(count);
    return acc;
  }, {} as Record<string, InventoryCount[]>);

  const totalVariance = inventoryCounts.reduce((sum, c) => sum + c.variance, 0);
  const hasVarianceIssues = inventoryCounts.some(c => c.variance !== 0);

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  const formatTime = (dateStr: string | undefined | null) => {
    if (!dateStr) return '--';
    try {
      return new Date(dateStr).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return '--';
    }
  };

  const generatePDF = () => {
    setIsGenerating(true);
    
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('End-of-Event Report', pageWidth / 2, 20, { align: 'center' });
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(`Stand: ${standName} (${standId})`, 20, 35);
      doc.text(`Section: ${section}`, 20, 42);
      doc.text(`Event Date: ${formatDate(eventDate)}`, 20, 49);
      if (supervisorName) {
        doc.text(`Supervisor: ${supervisorName}`, 20, 56);
      }
      doc.text(`Generated: ${new Date().toLocaleString()}`, 20, supervisorName ? 63 : 56);

      let yPos = supervisorName ? 75 : 68;

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Count Sessions', 20, yPos);
      yPos += 8;

      const sessionData = sortedSessions.map(s => [
        s.stage,
        s.counterName,
        s.counterRole,
        s.counterAffiliation || 'Legends',
        s.status,
        formatTime(s.startedAt),
        formatTime(s.completedAt)
      ]);

      doc.autoTable({
        startY: yPos,
        head: [['Stage', 'Counter', 'Role', 'Affiliation', 'Status', 'Started', 'Completed']],
        body: sessionData,
        theme: 'striped',
        headStyles: { fillColor: [59, 130, 246] },
        margin: { left: 20, right: 20 }
      });

      yPos = (doc as any).lastAutoTable.finalY + 15;

      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Inventory Summary', 20, yPos);
      yPos += 8;

      const inventoryData = inventoryCounts.map(c => [
        c.itemName,
        c.category,
        c.startCount.toString(),
        c.adds.toString(),
        c.endCount.toString(),
        c.spoilage.toString(),
        c.sold.toString(),
        c.variance !== 0 ? c.variance.toString() : '-'
      ]);

      doc.autoTable({
        startY: yPos,
        head: [['Item', 'Category', 'Start', 'Adds', 'End', 'Spoil', 'Sold', 'Var']],
        body: inventoryData,
        theme: 'striped',
        headStyles: { fillColor: [59, 130, 246] },
        margin: { left: 20, right: 20 },
        columnStyles: {
          7: { fontStyle: 'bold', textColor: totalVariance !== 0 ? [220, 38, 38] : [0, 0, 0] }
        }
      });

      yPos = (doc as any).lastAutoTable.finalY + 10;
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(`Total Variance: ${totalVariance}`, 20, yPos);

      yPos += 15;
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }

      if (issues.length > 0) {
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Stand Issues', 20, yPos);
        yPos += 8;

        const issueData = issues.map(i => [
          i.category,
          i.severity,
          i.title,
          i.status,
          formatTime(i.createdAt),
          i.resolvedAt ? formatTime(i.resolvedAt) : '--'
        ]);

        doc.autoTable({
          startY: yPos,
          head: [['Category', 'Severity', 'Title', 'Status', 'Reported', 'Resolved']],
          body: issueData,
          theme: 'striped',
          headStyles: { fillColor: [245, 158, 11] },
          margin: { left: 20, right: 20 }
        });

        yPos = (doc as any).lastAutoTable.finalY + 15;
      }

      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }

      if (signatures.length > 0) {
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Document Signatures', 20, yPos);
        yPos += 8;

        const sigData = signatures.map(s => [
          s.docTitle,
          s.signedBy,
          formatTime(s.signedAt)
        ]);

        doc.autoTable({
          startY: yPos,
          head: [['Document', 'Signed By', 'Time']],
          body: sigData,
          theme: 'striped',
          headStyles: { fillColor: [34, 197, 94] },
          margin: { left: 20, right: 20 }
        });
      }

      const pageCount = doc.internal.pages.length - 1;
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(
          `Page ${i} of ${pageCount} | Orby Report`,
          pageWidth / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: 'center' }
        );
      }

      doc.save(`${standId}_${eventDate}_report.pdf`);
    } catch (error) {
      console.error('PDF generation error:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-auto bg-white">
        <CardHeader className="sticky top-0 bg-white z-10 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-xl">End-of-Event Report</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {standName} ({standId}) • {formatDate(eventDate)}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={generatePDF}
                disabled={isGenerating}
                className="btn-3d"
                data-testid="button-download-pdf"
              >
                <Download className="w-4 h-4 mr-2" />
                {isGenerating ? 'Generating...' : 'Download PDF'}
              </Button>
              <Button variant="outline" onClick={onClose} data-testid="button-close-report">
                <XCircle className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-blue-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-blue-600">{countSessions.length}</div>
              <div className="text-xs text-blue-600">Count Sessions</div>
            </div>
            <div className="bg-green-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-green-600">{inventoryCounts.length}</div>
              <div className="text-xs text-green-600">Items Counted</div>
            </div>
            <div className={`rounded-lg p-3 text-center ${hasVarianceIssues ? 'bg-red-50' : 'bg-gray-50'}`}>
              <div className={`text-2xl font-bold ${hasVarianceIssues ? 'text-red-600' : 'text-gray-600'}`}>
                {totalVariance}
              </div>
              <div className={`text-xs ${hasVarianceIssues ? 'text-red-600' : 'text-gray-600'}`}>
                Total Variance
              </div>
            </div>
            <div className={`rounded-lg p-3 text-center ${issues.length > 0 ? 'bg-orange-50' : 'bg-gray-50'}`}>
              <div className={`text-2xl font-bold ${issues.length > 0 ? 'text-orange-600' : 'text-gray-600'}`}>
                {issues.length}
              </div>
              <div className={`text-xs ${issues.length > 0 ? 'text-orange-600' : 'text-gray-600'}`}>
                Issues Reported
              </div>
            </div>
          </div>

          <Accordion type="multiple" defaultValue={['sessions', 'inventory']} className="space-y-2">
            <AccordionItem value="sessions" className="border rounded-lg">
              <AccordionTrigger className="px-4 hover:no-underline">
                <div className="flex items-center gap-2">
                  <ClipboardList className="w-4 h-4 text-blue-500" />
                  <span className="font-medium">Count Sessions ({countSessions.length})</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="space-y-3">
                  {sortedSessions.map((session) => (
                    <div key={session.id} className="border rounded-lg p-3 bg-gray-50">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline" className="bg-blue-50">
                          {session.stage}
                        </Badge>
                        <Badge className={STATUS_COLORS[session.status] || 'bg-gray-100'}>
                          {session.status}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3 text-gray-400" />
                          <span>{session.counterName}</span>
                        </div>
                        <div className="text-gray-500">{session.counterRole}</div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-gray-400" />
                          <span>{formatTime(session.startedAt)}</span>
                        </div>
                        {session.completedAt && (
                          <div className="flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-green-500" />
                            <span>{formatTime(session.completedAt)}</span>
                          </div>
                        )}
                      </div>
                      {session.assistingCounterName && (
                        <div className="mt-2 text-xs text-gray-500">
                          Assisted by: {session.assistingCounterName}
                        </div>
                      )}
                    </div>
                  ))}
                  {sortedSessions.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-4">No count sessions recorded</p>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="inventory" className="border rounded-lg">
              <AccordionTrigger className="px-4 hover:no-underline">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-green-500" />
                  <span className="font-medium">Inventory Counts ({inventoryCounts.length} items)</span>
                  {hasVarianceIssues && (
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="space-y-3">
                  {Object.entries(groupedCounts).map(([category, items]) => (
                    <div key={category} className="border rounded-lg overflow-hidden">
                      <div className="bg-gray-100 px-3 py-2 font-medium text-sm">{category}</div>
                      <div className="divide-y">
                        {items.map((item) => (
                          <div key={item.itemId} className="px-3 py-2 flex items-center justify-between">
                            <span className="text-sm">{item.itemName}</span>
                            <div className="flex items-center gap-4 text-xs">
                              <span className="text-gray-500">Start: {item.startCount}</span>
                              <span className="text-gray-500">End: {item.endCount}</span>
                              <span className="text-gray-500">Sold: {item.sold}</span>
                              {item.variance !== 0 && (
                                <Badge variant="outline" className="bg-red-50 text-red-600">
                                  Var: {item.variance}
                                </Badge>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  {inventoryCounts.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-4">No inventory counts recorded</p>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="issues" className="border rounded-lg">
              <AccordionTrigger className="px-4 hover:no-underline">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-orange-500" />
                  <span className="font-medium">Stand Issues ({issues.length})</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="space-y-3">
                  {issues.map((issue) => (
                    <div key={issue.id} className={`border rounded-lg p-3 ${SEVERITY_COLORS[issue.severity] || 'bg-gray-50'}`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{issue.category}</Badge>
                          <Badge variant="outline" className={SEVERITY_COLORS[issue.severity]}>
                            {issue.severity}
                          </Badge>
                        </div>
                        <Badge className={STATUS_COLORS[issue.status] || 'bg-gray-100'}>
                          {issue.status}
                        </Badge>
                      </div>
                      <h4 className="font-medium text-sm">{issue.title}</h4>
                      <p className="text-xs text-gray-600 mt-1">{issue.description}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <span>Reported: {formatTime(issue.createdAt)}</span>
                        {issue.resolvedAt && <span>Resolved: {formatTime(issue.resolvedAt)}</span>}
                      </div>
                      {issue.resolutionNotes && (
                        <div className="mt-2 text-xs bg-white/50 rounded p-2">
                          <span className="font-medium">Resolution: </span>
                          {issue.resolutionNotes}
                        </div>
                      )}
                    </div>
                  ))}
                  {issues.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-4">No issues reported</p>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="signatures" className="border rounded-lg">
              <AccordionTrigger className="px-4 hover:no-underline">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span className="font-medium">Document Signatures ({signatures.length})</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="space-y-2">
                  {signatures.map((sig, idx) => (
                    <div key={idx} className="flex items-center justify-between border rounded-lg p-3 bg-gray-50">
                      <div>
                        <div className="font-medium text-sm">{sig.docTitle}</div>
                        <div className="text-xs text-gray-500">Signed by: {sig.signedBy}</div>
                      </div>
                      <div className="text-xs text-gray-500">{formatTime(sig.signedAt)}</div>
                    </div>
                  ))}
                  {signatures.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-4">No documents signed</p>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          {supervisorName && (
            <div className="mt-4 pt-4 border-t text-center text-sm text-gray-500">
              <div className="flex items-center justify-center gap-2">
                <User className="w-4 h-4" />
                <span>Supervisor: {supervisorName}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
