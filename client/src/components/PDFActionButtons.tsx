import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Printer, Share2, Check, Loader2 } from 'lucide-react';
import { downloadPDF, printPDF, sharePDF, canShareFiles } from '@/lib/pdfUtils';
import jsPDF from 'jspdf';
import { cn } from '@/lib/utils';

interface PDFActionButtonsProps {
  generatePDF: () => jsPDF;
  filename: string;
  title?: string;
  variant?: 'default' | 'compact' | 'icon-only';
  className?: string;
}

export function PDFActionButtons({ 
  generatePDF, 
  filename, 
  title,
  variant = 'default',
  className 
}: PDFActionButtonsProps) {
  const [downloading, setDownloading] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);
  
  const canShare = canShareFiles();

  const handleDownload = async () => {
    try {
      setDownloading(true);
      const doc = generatePDF();
      downloadPDF(doc, filename);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 2000);
    } catch (error) {
      console.error('Download failed:', error);
    } finally {
      setDownloading(false);
    }
  };

  const handlePrint = async () => {
    try {
      setPrinting(true);
      const doc = generatePDF();
      printPDF(doc);
    } catch (error) {
      console.error('Print failed:', error);
    } finally {
      setPrinting(false);
    }
  };

  const handleShare = async () => {
    try {
      setSharing(true);
      const doc = generatePDF();
      const success = await sharePDF(doc, filename, title);
      if (success) {
        setShareSuccess(true);
        setTimeout(() => setShareSuccess(false), 2000);
      }
    } catch (error) {
      console.error('Share failed:', error);
    } finally {
      setSharing(false);
    }
  };

  if (variant === 'icon-only') {
    return (
      <div className={cn("flex items-center gap-1", className)}>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleDownload}
          disabled={downloading}
          className="h-8 w-8"
          title="Download PDF"
          data-testid="button-download-pdf"
        >
          {downloading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : downloadSuccess ? (
            <Check className="h-4 w-4 text-green-400" />
          ) : (
            <Download className="h-4 w-4" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={handlePrint}
          disabled={printing}
          className="h-8 w-8"
          title="Print"
          data-testid="button-print-pdf"
        >
          {printing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Printer className="h-4 w-4" />
          )}
        </Button>
        {canShare && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleShare}
            disabled={sharing}
            className="h-8 w-8"
            title="Share via Email/Text"
            data-testid="button-share-pdf"
          >
            {sharing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : shareSuccess ? (
              <Check className="h-4 w-4 text-green-400" />
            ) : (
              <Share2 className="h-4 w-4" />
            )}
          </Button>
        )}
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <Button
          variant="outline"
          size="sm"
          onClick={handleDownload}
          disabled={downloading}
          className="h-8 px-3 text-xs"
          data-testid="button-download-pdf"
        >
          {downloading ? (
            <Loader2 className="h-3 w-3 animate-spin mr-1" />
          ) : downloadSuccess ? (
            <Check className="h-3 w-3 text-green-400 mr-1" />
          ) : (
            <Download className="h-3 w-3 mr-1" />
          )}
          PDF
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handlePrint}
          disabled={printing}
          className="h-8 px-3 text-xs"
          data-testid="button-print-pdf"
        >
          {printing ? (
            <Loader2 className="h-3 w-3 animate-spin mr-1" />
          ) : (
            <Printer className="h-3 w-3 mr-1" />
          )}
          Print
        </Button>
        {canShare && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleShare}
            disabled={sharing}
            className="h-8 px-3 text-xs bg-cyan-500/10 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20"
            data-testid="button-share-pdf"
          >
            {sharing ? (
              <Loader2 className="h-3 w-3 animate-spin mr-1" />
            ) : shareSuccess ? (
              <Check className="h-3 w-3 text-green-400 mr-1" />
            ) : (
              <Share2 className="h-3 w-3 mr-1" />
            )}
            Share
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <Button
        variant="outline"
        onClick={handleDownload}
        disabled={downloading}
        className="flex-1 sm:flex-none"
        data-testid="button-download-pdf"
      >
        {downloading ? (
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
        ) : downloadSuccess ? (
          <Check className="h-4 w-4 text-green-400 mr-2" />
        ) : (
          <Download className="h-4 w-4 mr-2" />
        )}
        Download PDF
      </Button>
      <Button
        variant="outline"
        onClick={handlePrint}
        disabled={printing}
        className="flex-1 sm:flex-none"
        data-testid="button-print-pdf"
      >
        {printing ? (
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
        ) : (
          <Printer className="h-4 w-4 mr-2" />
        )}
        Print
      </Button>
      {canShare && (
        <Button
          variant="glow"
          onClick={handleShare}
          disabled={sharing}
          className="flex-1 sm:flex-none"
          data-testid="button-share-pdf"
        >
          {sharing ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : shareSuccess ? (
            <Check className="h-4 w-4 mr-2" />
          ) : (
            <Share2 className="h-4 w-4 mr-2" />
          )}
          Share via Email/Text
        </Button>
      )}
    </div>
  );
}

export function PDFExportBanner({ 
  generatePDF, 
  filename, 
  title,
  description
}: PDFActionButtonsProps & { description?: string }) {
  return (
    <div className="p-4 rounded-xl bg-gradient-to-r from-slate-800/80 to-slate-900/80 border border-cyan-500/20 backdrop-blur-sm">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="font-semibold text-white flex items-center gap-2">
            <Download className="h-4 w-4 text-cyan-400" />
            {title || 'Export Report'}
          </h3>
          {description && (
            <p className="text-sm text-slate-400 mt-1">{description}</p>
          )}
        </div>
        <PDFActionButtons
          generatePDF={generatePDF}
          filename={filename}
          title={title}
          variant="compact"
        />
      </div>
    </div>
  );
}
