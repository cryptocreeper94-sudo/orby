import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface PDFHeaderInfo {
  title: string;
  standName?: string;
  eventDate?: string;
  supervisorName?: string;
  additionalInfo?: Record<string, string>;
}

export function createPDFWithHeader(info: PDFHeaderInfo): { doc: jsPDF; yPos: number } {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(info.title, pageWidth / 2, 20, { align: 'center' });
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  let yPos = 35;
  
  if (info.standName) {
    doc.text(`Stand: ${info.standName}`, 20, yPos);
    yPos += 7;
  }
  if (info.eventDate) {
    doc.text(`Event Date: ${info.eventDate}`, 20, yPos);
    yPos += 7;
  }
  if (info.supervisorName) {
    doc.text(`Supervisor: ${info.supervisorName}`, 20, yPos);
    yPos += 7;
  }
  if (info.additionalInfo) {
    Object.entries(info.additionalInfo).forEach(([key, value]) => {
      doc.text(`${key}: ${value}`, 20, yPos);
      yPos += 7;
    });
  }
  
  doc.text(`Generated: ${new Date().toLocaleString()}`, 20, yPos);
  yPos += 5;
  
  doc.setDrawColor(200);
  doc.line(20, yPos, pageWidth - 20, yPos);
  yPos += 10;
  
  return { doc, yPos };
}

export function downloadPDF(doc: jsPDF, filename: string): void {
  doc.save(filename);
}

export function printPDF(doc: jsPDF): void {
  const pdfBlob = doc.output('blob');
  const pdfUrl = URL.createObjectURL(pdfBlob);
  const printWindow = window.open(pdfUrl, '_blank');
  if (printWindow) {
    printWindow.onload = () => {
      printWindow.print();
    };
  }
}

export async function sharePDF(doc: jsPDF, filename: string, title?: string): Promise<boolean> {
  const pdfBlob = doc.output('blob');
  const file = new File([pdfBlob], filename, { type: 'application/pdf' });
  
  if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({
        files: [file],
        title: title || 'Orby Report',
        text: `${title || 'Report'} from Orby Operations`
      });
      return true;
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error('Share failed:', error);
      }
      return false;
    }
  } else {
    downloadPDF(doc, filename);
    return false;
  }
}

export function canShareFiles(): boolean {
  if (!navigator.share || !navigator.canShare) return false;
  try {
    const testFile = new File(['test'], 'test.pdf', { type: 'application/pdf' });
    return navigator.canShare({ files: [testFile] });
  } catch {
    return false;
  }
}

export function generateIncidentReportPDF(incident: {
  id: string;
  title: string;
  description: string;
  severity: string;
  status: string;
  location?: string;
  reporterName?: string;
  createdAt: string;
  notes?: string;
  resolvedAt?: string;
}): jsPDF {
  const { doc, yPos: startY } = createPDFWithHeader({
    title: 'Incident Report',
    additionalInfo: {
      'Incident ID': incident.id.slice(0, 8),
      'Status': incident.status,
      'Severity': incident.severity
    }
  });
  
  let yPos = startY;
  const pageWidth = doc.internal.pageSize.getWidth();
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Incident Details', 20, yPos);
  yPos += 10;
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Title:', 20, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(incident.title, 50, yPos);
  yPos += 8;
  
  if (incident.location) {
    doc.setFont('helvetica', 'bold');
    doc.text('Location:', 20, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(incident.location, 55, yPos);
    yPos += 8;
  }
  
  if (incident.reporterName) {
    doc.setFont('helvetica', 'bold');
    doc.text('Reported By:', 20, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(incident.reporterName, 60, yPos);
    yPos += 8;
  }
  
  doc.setFont('helvetica', 'bold');
  doc.text('Reported At:', 20, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(new Date(incident.createdAt).toLocaleString(), 60, yPos);
  yPos += 15;
  
  doc.setFont('helvetica', 'bold');
  doc.text('Description:', 20, yPos);
  yPos += 8;
  doc.setFont('helvetica', 'normal');
  const descLines = doc.splitTextToSize(incident.description, pageWidth - 45);
  doc.text(descLines, 25, yPos);
  yPos += descLines.length * 6 + 10;
  
  if (incident.notes) {
    doc.setFont('helvetica', 'bold');
    doc.text('Notes:', 20, yPos);
    yPos += 8;
    doc.setFont('helvetica', 'normal');
    const noteLines = doc.splitTextToSize(incident.notes, pageWidth - 45);
    doc.text(noteLines, 25, yPos);
    yPos += noteLines.length * 6 + 10;
  }
  
  if (incident.resolvedAt) {
    doc.setFont('helvetica', 'bold');
    doc.text('Resolved At:', 20, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(new Date(incident.resolvedAt).toLocaleString(), 60, yPos);
  }
  
  return doc;
}

export function generateStandIssueReportPDF(issue: {
  id: string;
  category: string;
  description: string;
  severity: string;
  status: string;
  standName?: string;
  reporterName?: string;
  createdAt: string;
  notes?: string;
  resolvedAt?: string;
  assignedTo?: string;
}): jsPDF {
  const { doc, yPos: startY } = createPDFWithHeader({
    title: 'Stand Issue Report',
    standName: issue.standName,
    additionalInfo: {
      'Issue ID': issue.id.slice(0, 8),
      'Category': issue.category,
      'Status': issue.status,
      'Severity': issue.severity
    }
  });
  
  let yPos = startY;
  const pageWidth = doc.internal.pageSize.getWidth();
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Issue Details', 20, yPos);
  yPos += 10;
  
  if (issue.reporterName) {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Reported By:', 20, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(issue.reporterName, 60, yPos);
    yPos += 8;
  }
  
  if (issue.assignedTo) {
    doc.setFont('helvetica', 'bold');
    doc.text('Assigned To:', 20, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(issue.assignedTo, 60, yPos);
    yPos += 8;
  }
  
  doc.setFont('helvetica', 'bold');
  doc.text('Reported At:', 20, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(new Date(issue.createdAt).toLocaleString(), 60, yPos);
  yPos += 15;
  
  doc.setFont('helvetica', 'bold');
  doc.text('Description:', 20, yPos);
  yPos += 8;
  doc.setFont('helvetica', 'normal');
  const descLines = doc.splitTextToSize(issue.description, pageWidth - 45);
  doc.text(descLines, 25, yPos);
  yPos += descLines.length * 6 + 10;
  
  if (issue.notes) {
    doc.setFont('helvetica', 'bold');
    doc.text('Resolution Notes:', 20, yPos);
    yPos += 8;
    doc.setFont('helvetica', 'normal');
    const noteLines = doc.splitTextToSize(issue.notes, pageWidth - 45);
    doc.text(noteLines, 25, yPos);
    yPos += noteLines.length * 6 + 10;
  }
  
  if (issue.resolvedAt) {
    doc.setFont('helvetica', 'bold');
    doc.text('Resolved At:', 20, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(new Date(issue.resolvedAt).toLocaleString(), 60, yPos);
  }
  
  return doc;
}

export function generateCountSessionPDF(session: {
  standName: string;
  eventDate: string;
  stage: string;
  counterName: string;
  counterRole?: string;
  counterAffiliation?: string;
  startedAt: string;
  completedAt?: string;
  items: Array<{
    itemName: string;
    category: string;
    count: number;
  }>;
}): jsPDF {
  const { doc, yPos: startY } = createPDFWithHeader({
    title: `Inventory Count Sheet - ${session.stage}`,
    standName: session.standName,
    eventDate: session.eventDate,
    additionalInfo: {
      'Counter': session.counterName,
      'Role': session.counterRole || 'N/A',
      'Affiliation': session.counterAffiliation || 'Legends',
      'Started': new Date(session.startedAt).toLocaleTimeString(),
      'Completed': session.completedAt ? new Date(session.completedAt).toLocaleTimeString() : 'In Progress'
    }
  });
  
  let yPos = startY + 5;
  
  const groupedItems = session.items.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, typeof session.items>);
  
  Object.entries(groupedItems).forEach(([category, items]) => {
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(category, 20, yPos);
    yPos += 5;
    
    const tableData = items.map(item => [
      item.itemName,
      item.count.toString()
    ]);
    
    (doc as any).autoTable({
      startY: yPos,
      head: [['Item', 'Count']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246], fontSize: 10 },
      bodyStyles: { fontSize: 10 },
      margin: { left: 20, right: 20 },
      columnStyles: {
        0: { cellWidth: 120 },
        1: { cellWidth: 40, halign: 'center' }
      }
    });
    
    yPos = (doc as any).lastAutoTable.finalY + 10;
  });
  
  const totalCount = session.items.reduce((sum, item) => sum + item.count, 0);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(`Total Items Counted: ${totalCount}`, 20, yPos + 5);
  
  return doc;
}

export function generateDeliveryReportPDF(delivery: {
  id: string;
  standName: string;
  department: string;
  status: string;
  priority: string;
  requestedBy: string;
  requestedAt: string;
  items: Array<{
    productName: string;
    quantity: number;
    unit?: string;
  }>;
  timeline?: Array<{
    status: string;
    timestamp: string;
    actor?: string;
    notes?: string;
  }>;
  etaMinutes?: number;
  deliveredAt?: string;
  confirmedAt?: string;
}): jsPDF {
  const { doc, yPos: startY } = createPDFWithHeader({
    title: 'Delivery Report',
    standName: delivery.standName,
    additionalInfo: {
      'Delivery ID': delivery.id.slice(0, 8),
      'Department': delivery.department,
      'Status': delivery.status,
      'Priority': delivery.priority
    }
  });
  
  let yPos = startY;
  const pageWidth = doc.internal.pageSize.getWidth();
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Requested By:', 20, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(delivery.requestedBy, 60, yPos);
  yPos += 8;
  
  doc.setFont('helvetica', 'bold');
  doc.text('Requested At:', 20, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(new Date(delivery.requestedAt).toLocaleString(), 60, yPos);
  yPos += 15;
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Items Requested', 20, yPos);
  yPos += 5;
  
  const itemsData = delivery.items.map(item => [
    item.productName,
    item.quantity.toString(),
    item.unit || 'units'
  ]);
  
  (doc as any).autoTable({
    startY: yPos,
    head: [['Item', 'Qty', 'Unit']],
    body: itemsData,
    theme: 'striped',
    headStyles: { fillColor: [6, 182, 212], fontSize: 10 },
    bodyStyles: { fontSize: 10 },
    margin: { left: 20, right: 20 },
    columnStyles: {
      0: { cellWidth: 100 },
      1: { cellWidth: 30, halign: 'center' },
      2: { cellWidth: 30, halign: 'center' }
    }
  });
  
  yPos = (doc as any).lastAutoTable.finalY + 15;
  
  if (delivery.timeline && delivery.timeline.length > 0) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Delivery Timeline', 20, yPos);
    yPos += 5;
    
    const timelineData = delivery.timeline.map(t => [
      t.status,
      new Date(t.timestamp).toLocaleString(),
      t.actor || '-',
      t.notes || '-'
    ]);
    
    (doc as any).autoTable({
      startY: yPos,
      head: [['Status', 'Time', 'By', 'Notes']],
      body: timelineData,
      theme: 'striped',
      headStyles: { fillColor: [6, 182, 212], fontSize: 9 },
      bodyStyles: { fontSize: 9 },
      margin: { left: 20, right: 20 }
    });
    
    yPos = (doc as any).lastAutoTable.finalY + 10;
  }
  
  if (delivery.deliveredAt) {
    doc.setFont('helvetica', 'bold');
    doc.text('Delivered At:', 20, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(new Date(delivery.deliveredAt).toLocaleString(), 60, yPos);
    yPos += 8;
  }
  
  if (delivery.confirmedAt) {
    doc.setFont('helvetica', 'bold');
    doc.text('Confirmed At:', 20, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(new Date(delivery.confirmedAt).toLocaleString(), 60, yPos);
  }
  
  return doc;
}

export function generateVarianceReportPDF(report: {
  standName: string;
  eventDate: string;
  eventName?: string;
  supervisorName: string;
  items: Array<{
    itemName: string;
    category: string;
    startCount: number;
    endCount: number;
    addCount: number;
    soldCount: number;
    spoilageCount: number;
    variance: number;
    variancePercent: number;
  }>;
  totalVariance: number;
  totalVariancePercent: number;
}): jsPDF {
  const { doc, yPos: startY } = createPDFWithHeader({
    title: 'Inventory Variance Report',
    standName: report.standName,
    eventDate: report.eventDate,
    supervisorName: report.supervisorName,
    additionalInfo: report.eventName ? { 'Event': report.eventName } : undefined
  });
  
  let yPos = startY;
  
  const groupedItems = report.items.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, typeof report.items>);
  
  Object.entries(groupedItems).forEach(([category, items]) => {
    if (yPos > 220) {
      doc.addPage();
      yPos = 20;
    }
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(category, 20, yPos);
    yPos += 3;
    
    const tableData = items.map(item => [
      item.itemName,
      item.startCount.toString(),
      item.addCount > 0 ? `+${item.addCount}` : '-',
      item.endCount.toString(),
      item.spoilageCount > 0 ? item.spoilageCount.toString() : '-',
      item.soldCount.toString(),
      item.variance !== 0 ? item.variance.toString() : '-',
      item.variancePercent !== 0 ? `${item.variancePercent.toFixed(1)}%` : '-'
    ]);
    
    (doc as any).autoTable({
      startY: yPos,
      head: [['Item', 'Start', 'Add', 'End', 'Spoil', 'Sold', 'Var', '%']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [6, 182, 212], fontSize: 8 },
      bodyStyles: { fontSize: 8 },
      margin: { left: 15, right: 15 },
      columnStyles: {
        0: { cellWidth: 45 },
        1: { cellWidth: 18, halign: 'center' },
        2: { cellWidth: 18, halign: 'center' },
        3: { cellWidth: 18, halign: 'center' },
        4: { cellWidth: 18, halign: 'center' },
        5: { cellWidth: 20, halign: 'center' },
        6: { cellWidth: 18, halign: 'center' },
        7: { cellWidth: 22, halign: 'center' }
      }
    });
    
    yPos = (doc as any).lastAutoTable.finalY + 10;
  });
  
  yPos += 5;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(`Total Variance: ${report.totalVariance} units (${report.totalVariancePercent.toFixed(1)}%)`, 20, yPos);
  
  return doc;
}

export function generateEmergencyReportPDF(emergency: {
  id: string;
  alertType: string;
  title: string;
  description: string;
  severity: string;
  status: string;
  standName?: string;
  location?: string;
  reporterName: string;
  createdAt: string;
  acknowledgedAt?: string;
  acknowledgedBy?: string;
  resolvedAt?: string;
  resolvedBy?: string;
  resolutionNotes?: string;
  escalationLevel?: number;
  responseTimeMinutes?: number;
}): jsPDF {
  const { doc, yPos: startY } = createPDFWithHeader({
    title: 'Emergency Incident Report',
    standName: emergency.standName,
    additionalInfo: {
      'Alert ID': emergency.id.slice(0, 8),
      'Type': emergency.alertType,
      'Severity': emergency.severity,
      'Status': emergency.status
    }
  });
  
  let yPos = startY;
  const pageWidth = doc.internal.pageSize.getWidth();
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(220, 38, 38);
  doc.text('EMERGENCY ALERT', pageWidth / 2, yPos, { align: 'center' });
  doc.setTextColor(0, 0, 0);
  yPos += 12;
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(emergency.title, 20, yPos);
  yPos += 10;
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  
  if (emergency.location) {
    doc.setFont('helvetica', 'bold');
    doc.text('Location:', 20, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(emergency.location, 55, yPos);
    yPos += 8;
  }
  
  doc.setFont('helvetica', 'bold');
  doc.text('Reported By:', 20, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(emergency.reporterName, 60, yPos);
  yPos += 8;
  
  doc.setFont('helvetica', 'bold');
  doc.text('Reported At:', 20, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(new Date(emergency.createdAt).toLocaleString(), 60, yPos);
  yPos += 12;
  
  doc.setFont('helvetica', 'bold');
  doc.text('Description:', 20, yPos);
  yPos += 7;
  doc.setFont('helvetica', 'normal');
  const descLines = doc.splitTextToSize(emergency.description, pageWidth - 45);
  doc.text(descLines, 25, yPos);
  yPos += descLines.length * 6 + 12;
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Response Timeline', 20, yPos);
  yPos += 10;
  
  doc.setFontSize(11);
  
  if (emergency.acknowledgedAt) {
    doc.setFont('helvetica', 'bold');
    doc.text('Acknowledged:', 20, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(`${new Date(emergency.acknowledgedAt).toLocaleString()} by ${emergency.acknowledgedBy || 'Staff'}`, 60, yPos);
    yPos += 8;
  }
  
  if (emergency.responseTimeMinutes !== undefined) {
    doc.setFont('helvetica', 'bold');
    doc.text('Response Time:', 20, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(`${emergency.responseTimeMinutes} minutes`, 65, yPos);
    yPos += 8;
  }
  
  if (emergency.escalationLevel && emergency.escalationLevel > 0) {
    doc.setFont('helvetica', 'bold');
    doc.text('Escalation Level:', 20, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(`Level ${emergency.escalationLevel}`, 70, yPos);
    yPos += 8;
  }
  
  if (emergency.resolvedAt) {
    yPos += 5;
    doc.setFont('helvetica', 'bold');
    doc.text('Resolved:', 20, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(`${new Date(emergency.resolvedAt).toLocaleString()} by ${emergency.resolvedBy || 'Staff'}`, 55, yPos);
    yPos += 10;
    
    if (emergency.resolutionNotes) {
      doc.setFont('helvetica', 'bold');
      doc.text('Resolution Notes:', 20, yPos);
      yPos += 7;
      doc.setFont('helvetica', 'normal');
      const resLines = doc.splitTextToSize(emergency.resolutionNotes, pageWidth - 45);
      doc.text(resLines, 25, yPos);
    }
  }
  
  return doc;
}

export function generateActivityLogPDF(logs: Array<{
  id: string;
  action: string;
  actor: string;
  timestamp: string;
  details?: string;
  category?: string;
}>, options?: {
  title?: string;
  dateRange?: { from: string; to: string };
  filterCategory?: string;
}): jsPDF {
  const { doc, yPos: startY } = createPDFWithHeader({
    title: options?.title || 'Activity Log Report',
    additionalInfo: options?.dateRange ? {
      'From': new Date(options.dateRange.from).toLocaleDateString(),
      'To': new Date(options.dateRange.to).toLocaleDateString(),
      ...(options.filterCategory ? { 'Category': options.filterCategory } : {})
    } : undefined
  });
  
  let yPos = startY;
  
  const tableData = logs.map(log => [
    new Date(log.timestamp).toLocaleString(),
    log.actor,
    log.category || '-',
    log.action,
    log.details || '-'
  ]);
  
  (doc as any).autoTable({
    startY: yPos,
    head: [['Time', 'User', 'Category', 'Action', 'Details']],
    body: tableData,
    theme: 'striped',
    headStyles: { fillColor: [6, 182, 212], fontSize: 9 },
    bodyStyles: { fontSize: 8 },
    margin: { left: 15, right: 15 },
    columnStyles: {
      0: { cellWidth: 35 },
      1: { cellWidth: 25 },
      2: { cellWidth: 25 },
      3: { cellWidth: 50 },
      4: { cellWidth: 40 }
    }
  });
  
  yPos = (doc as any).lastAutoTable.finalY + 10;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Total entries: ${logs.length}`, 20, yPos);
  
  return doc;
}
