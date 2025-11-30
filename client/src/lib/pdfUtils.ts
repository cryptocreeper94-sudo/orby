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
