import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, TrendingDown, TrendingUp, Package, X, Download, 
  AlertCircle, Loader2, Check
} from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface VarianceItem {
  itemId: string;
  itemName: string;
  category: string;
  preEventCount: number;
  postEventCount: number;
  used: number;
  spoilage: number;
  adds: number;
}

interface VarianceReportProps {
  standId: string;
  standName: string;
  eventDate: string;
  onClose: () => void;
}

export function VarianceReport({ standId, standName, eventDate, onClose }: VarianceReportProps) {
  const [report, setReport] = useState<VarianceItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchReport();
  }, [standId, eventDate]);

  const fetchReport = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/inventory/variance/${standId}/${encodeURIComponent(eventDate)}`);
      if (!response.ok) {
        throw new Error('Failed to fetch variance report');
      }
      const data = await response.json();
      setReport(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load report');
    } finally {
      setIsLoading(false);
    }
  };

  const groupByCategory = (items: VarianceItem[]) => {
    return items.reduce((acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = [];
      }
      acc[item.category].push(item);
      return acc;
    }, {} as Record<string, VarianceItem[]>);
  };

  const getTotals = () => {
    return report.reduce((acc, item) => ({
      started: acc.started + item.preEventCount,
      added: acc.added + item.adds,
      ended: acc.ended + item.postEventCount,
      used: acc.used + item.used,
      spoilage: acc.spoilage + item.spoilage
    }), { started: 0, added: 0, ended: 0, used: 0, spoilage: 0 });
  };

  const categorizedReport = groupByCategory(report);
  const totals = getTotals();

  const exportReport = () => {
    const headers = ['Item', 'Category', 'Started', 'Added', 'Ended', 'Used', 'Spoilage'];
    const rows = report.map(item => [
      item.itemName,
      item.category,
      item.preEventCount,
      item.adds,
      item.postEventCount,
      item.used,
      item.spoilage
    ]);
    
    const csv = [
      `Variance Report - ${standName}`,
      `Event Date: ${eventDate}`,
      '',
      headers.join(','),
      ...rows.map(row => row.join(',')),
      '',
      `TOTALS,, ${totals.started}, ${totals.added}, ${totals.ended}, ${totals.used}, ${totals.spoilage}`
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `variance-report-${standId}-${eventDate.replace(/\//g, '-')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col bg-white">
        <CardHeader className="flex flex-row items-center justify-between pb-2 flex-shrink-0">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <div>
              <CardTitle className="text-lg">Variance Report</CardTitle>
              <p className="text-sm text-muted-foreground">{standName} - {eventDate}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={exportReport}
              disabled={isLoading || report.length === 0}
              data-testid="button-export-report"
            >
              <Download className="w-4 h-4 mr-1" />
              Export
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose} data-testid="button-close-report">
              <X className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="flex-1 overflow-y-auto space-y-4 pb-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <div>
                <p className="font-medium text-red-800">Error Loading Report</p>
                <p className="text-sm text-red-700">{error}</p>
                <Button size="sm" variant="outline" onClick={fetchReport} className="mt-2">
                  Retry
                </Button>
              </div>
            </div>
          ) : report.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No inventory data found for this event.</p>
              <p className="text-sm">Complete both pre-event and post-event counts to see variance.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-5 gap-2">
                <div className="bg-green-50 rounded-lg p-3 text-center">
                  <div className="text-xs text-green-600 font-medium">Started</div>
                  <div className="text-xl font-bold text-green-700">{totals.started}</div>
                </div>
                <div className="bg-blue-50 rounded-lg p-3 text-center">
                  <div className="text-xs text-blue-600 font-medium">Added</div>
                  <div className="text-xl font-bold text-blue-700">+{totals.added}</div>
                </div>
                <div className="bg-amber-50 rounded-lg p-3 text-center">
                  <div className="text-xs text-amber-600 font-medium">Ended</div>
                  <div className="text-xl font-bold text-amber-700">{totals.ended}</div>
                </div>
                <div className="bg-purple-50 rounded-lg p-3 text-center">
                  <div className="text-xs text-purple-600 font-medium">Used/Sold</div>
                  <div className="text-xl font-bold text-purple-700">{totals.used}</div>
                </div>
                <div className="bg-red-50 rounded-lg p-3 text-center">
                  <div className="text-xs text-red-600 font-medium">Spoilage</div>
                  <div className="text-xl font-bold text-red-700">{totals.spoilage}</div>
                </div>
              </div>

              <Accordion type="multiple" defaultValue={Object.keys(categorizedReport)}>
                {Object.entries(categorizedReport).map(([category, items]) => {
                  const categoryTotals = items.reduce((acc, item) => ({
                    started: acc.started + item.preEventCount,
                    used: acc.used + item.used
                  }), { started: 0, used: 0 });
                  
                  return (
                    <AccordionItem key={category} value={category}>
                      <AccordionTrigger className="hover:bg-blue-50 px-3 rounded-lg">
                        <div className="flex items-center justify-between w-full pr-4">
                          <span className="font-medium">{category}</span>
                          <Badge variant="secondary">
                            {categoryTotals.used} used of {categoryTotals.started}
                          </Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-1">
                        <div className="space-y-1">
                          <div className="grid grid-cols-6 text-xs text-muted-foreground font-medium py-1 px-2 bg-gray-100 rounded">
                            <span className="col-span-2">Item</span>
                            <span className="text-center">Start</span>
                            <span className="text-center">End</span>
                            <span className="text-center">Used</span>
                            <span className="text-center">Spoil</span>
                          </div>
                          {items.map((item) => (
                            <div 
                              key={item.itemId}
                              className="grid grid-cols-6 text-sm py-2 px-2 hover:bg-gray-50 rounded items-center"
                              data-testid={`variance-item-${item.itemId}`}
                            >
                              <span className="col-span-2 font-medium truncate">{item.itemName}</span>
                              <span className="text-center text-green-600">{item.preEventCount}</span>
                              <span className="text-center text-amber-600">{item.postEventCount}</span>
                              <span className="text-center font-medium">
                                {item.used > 0 ? (
                                  <span className="text-purple-600 flex items-center justify-center gap-1">
                                    <TrendingDown className="w-3 h-3" />
                                    {item.used}
                                  </span>
                                ) : (
                                  <span className="text-gray-400">0</span>
                                )}
                              </span>
                              <span className="text-center">
                                {item.spoilage > 0 ? (
                                  <span className="text-red-600">{item.spoilage}</span>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </span>
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
