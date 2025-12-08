import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ClipboardList, User, Phone, Clock, Check, Save, 
  Package, Plus, Minus, AlertCircle, X, ChevronDown, ChevronUp, ScanLine, FileText
} from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { AIScanner } from './AIScanner';
import { PaperCountSheetScanner } from './PaperCountSheetScanner';
import { PDFActionButtons } from './PDFActionButtons';
import { generateCountSessionPDF } from '@/lib/pdfUtils';

type CountStage = 'PreEvent' | 'PostEvent' | 'DayAfter';
type CounterRole = 'NPOLead' | 'StandLead' | 'Supervisor' | 'Manager' | 'ManagerAssistant';

interface CountSession {
  id: string;
  standId: string;
  eventDate: string;
  stage: CountStage;
  counterName: string;
  counterRole: CounterRole;
  counterPhoneLast4: string;
  status: 'InProgress' | 'Completed' | 'Verified';
  startedAt: string;
  completedAt?: string;
}

interface Item {
  id: string;
  name: string;
  category: string;
  price: number;
}

interface InventoryCount {
  itemId: string;
  count: number;
}

interface CountSheetProps {
  session: CountSession;
  standName: string;
  items: Item[];
  existingCounts?: Record<string, number>;
  onSaveCount: (itemId: string, count: number) => void;
  onCompleteSession: () => void;
  onClose: () => void;
  isReadOnly?: boolean;
}

const STAGE_LABELS: Record<CountStage, string> = {
  PreEvent: 'Pre-Event Count',
  PostEvent: 'Post-Event Count',
  DayAfter: 'Day-After Recount'
};

const STAGE_COLORS: Record<CountStage, string> = {
  PreEvent: 'bg-green-500/10 text-green-400 border border-green-500/30',
  PostEvent: 'bg-blue-500/10 text-blue-400 border border-blue-500/30',
  DayAfter: 'bg-purple-500/10 text-purple-400 border border-purple-500/30'
};

const ROLE_LABELS: Record<CounterRole, string> = {
  NPOLead: 'NPO Lead',
  StandLead: 'Stand Lead',
  Supervisor: 'Supervisor',
  Manager: 'Manager',
  ManagerAssistant: 'Mgr Asst'
};

export function CountSheet({
  session,
  standName,
  items,
  existingCounts = {},
  onSaveCount,
  onCompleteSession,
  onClose,
  isReadOnly = false
}: CountSheetProps) {
  const [counts, setCounts] = useState<Record<string, number>>(existingCounts);
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['Beverage', 'Food']);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [savingItem, setSavingItem] = useState<string | null>(null);
  const [showAIScanner, setShowAIScanner] = useState(false);
  const [showPaperScanner, setShowPaperScanner] = useState(false);
  const [lastScanResult, setLastScanResult] = useState<{totalCount: number; productsMatched: number} | null>(null);
  const [lastPaperScanResult, setLastPaperScanResult] = useState<{totalItems: number; matched: number} | null>(null);

  const categories = Array.from(new Set(items.map((item: Item) => item.category)));
  const itemsByCategory = categories.reduce((acc, cat) => {
    acc[cat] = items.filter((item: Item) => item.category === cat);
    return acc;
  }, {} as Record<string, Item[]>);

  const handleCountChange = (itemId: string, value: number) => {
    if (isReadOnly) return;
    const newValue = Math.max(0, value);
    setCounts(prev => ({ ...prev, [itemId]: newValue }));
    setHasUnsavedChanges(true);
  };

  const handleSaveItem = async (itemId: string) => {
    if (isReadOnly) return;
    setSavingItem(itemId);
    await onSaveCount(itemId, counts[itemId] || 0);
    setSavingItem(null);
  };

  const handleIncrement = (itemId: string) => {
    const current = counts[itemId] || 0;
    handleCountChange(itemId, current + 1);
  };

  const handleDecrement = (itemId: string) => {
    const current = counts[itemId] || 0;
    if (current > 0) {
      handleCountChange(itemId, current - 1);
    }
  };

  const totalItemsCounted = Object.keys(counts).length;
  const totalItems = items.length;
  const countProgress = Math.round((totalItemsCounted / totalItems) * 100);

  const handleAIScanComplete = (result: {
    totalCount: number;
    products: Array<{ name: string; count: number; shelf?: string }>;
    confidence: string;
    notes?: string;
  }) => {
    let productsMatched = 0;
    
    for (const scannedProduct of result.products) {
      const productNameLower = scannedProduct.name.toLowerCase();
      
      const matchingItem = items.find(item => {
        const itemNameLower = item.name.toLowerCase();
        return itemNameLower.includes(productNameLower) || 
               productNameLower.includes(itemNameLower) ||
               itemNameLower.split(' ').some(word => productNameLower.includes(word) && word.length > 3);
      });
      
      if (matchingItem) {
        const currentCount = counts[matchingItem.id] || 0;
        setCounts(prev => ({ 
          ...prev, 
          [matchingItem.id]: currentCount + scannedProduct.count 
        }));
        setHasUnsavedChanges(true);
        productsMatched++;
      }
    }
    
    setLastScanResult({ totalCount: result.totalCount, productsMatched });
    setShowAIScanner(false);
  };

  const handlePaperScanComplete = (scannedItems: Array<{name: string; count: number}>) => {
    let matched = 0;
    
    for (const scannedItem of scannedItems) {
      const scannedNameLower = scannedItem.name.toLowerCase();
      
      const matchingItem = items.find(item => {
        const itemNameLower = item.name.toLowerCase();
        return itemNameLower.includes(scannedNameLower) || 
               scannedNameLower.includes(itemNameLower) ||
               itemNameLower.split(' ').some(word => scannedNameLower.includes(word) && word.length > 3);
      });
      
      if (matchingItem) {
        setCounts(prev => ({ 
          ...prev, 
          [matchingItem.id]: scannedItem.count 
        }));
        setHasUnsavedChanges(true);
        matched++;
      }
    }
    
    setLastPaperScanResult({ totalItems: scannedItems.length, matched });
    setShowPaperScanner(false);
  };

  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const generatePDF = useCallback(() => {
    const countItems = items.map(item => ({
      itemName: item.name,
      category: item.category,
      count: counts[item.id] || 0
    }));
    
    return generateCountSessionPDF({
      standName,
      eventDate: session.eventDate,
      stage: STAGE_LABELS[session.stage],
      counterName: session.counterName,
      counterRole: ROLE_LABELS[session.counterRole],
      counterAffiliation: 'Legends',
      startedAt: session.startedAt,
      completedAt: session.completedAt,
      items: countItems
    });
  }, [items, counts, standName, session]);

  return (
    <Card className="h-full flex flex-col" data-testid="count-sheet">
      <CardHeader className="pb-2 flex-shrink-0 bg-gradient-to-r from-slate-800/50 to-blue-900/30">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-blue-400" />
              {standName}
            </CardTitle>
            <p className="text-sm text-slate-400">{session.eventDate}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} data-testid="close-count-sheet">
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex items-center gap-2 flex-wrap mt-2">
          <Badge className={STAGE_COLORS[session.stage]}>
            {STAGE_LABELS[session.stage]}
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1">
            <User className="h-3 w-3" />
            {session.counterName}
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1">
            <Phone className="h-3 w-3" />
            ***{session.counterPhoneLast4}
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1">
            {ROLE_LABELS[session.counterRole]}
          </Badge>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500 mt-2">
          <Clock className="h-3 w-3" />
          Started: {formatTime(session.startedAt)}
          {session.status === 'InProgress' && (
            <span className="animate-pulse text-green-400 font-medium">• Active</span>
          )}
        </div>

        <div className="mt-3 bg-slate-800/50 rounded-lg p-2 border border-slate-700">
          <div className="flex items-center justify-between text-sm text-slate-300">
            <span>Progress: {totalItemsCounted}/{totalItems} items</span>
            <span className="font-medium">{countProgress}%</span>
          </div>
          <div className="h-2 bg-slate-700/50 rounded-full mt-1 overflow-hidden">
            <div 
              className="h-full bg-blue-500 rounded-full transition-all duration-300"
              style={{ width: `${countProgress}%` }}
            />
          </div>
        </div>

        {!isReadOnly && session.status === 'InProgress' && (
          <div className="mt-3 space-y-2">
            <Button
              onClick={() => setShowAIScanner(true)}
              variant="outline"
              className="w-full bg-gradient-to-r from-purple-500/10 to-blue-500/10 border-purple-500/30 hover:from-purple-500/20 hover:to-blue-500/20"
              data-testid="button-open-ai-scanner"
            >
              <ScanLine className="w-4 h-4 mr-2 text-purple-400" />
              <span className="text-purple-300">AI Can Counter</span>
              <Badge variant="secondary" className="ml-2 bg-purple-500/20 text-purple-300 text-xs">
                Beta
              </Badge>
            </Button>
            {lastScanResult && (
              <div className="text-xs text-center text-purple-400 mt-1">
                Last scan: {lastScanResult.totalCount} items found, {lastScanResult.productsMatched} matched
              </div>
            )}
            
            <Button
              onClick={() => setShowPaperScanner(true)}
              variant="outline"
              className="w-full bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/30 hover:from-green-500/20 hover:to-emerald-500/20"
              data-testid="button-open-paper-scanner"
            >
              <FileText className="w-4 h-4 mr-2 text-green-400" />
              <span className="text-green-300">Scan Paper Count Sheet</span>
            </Button>
            {lastPaperScanResult && (
              <div className="text-xs text-center text-green-400 mt-1">
                Last scan: {lastPaperScanResult.totalItems} items read, {lastPaperScanResult.matched} matched
              </div>
            )}
          </div>
        )}

        <div className="mt-3">
          <PDFActionButtons
            generatePDF={generatePDF}
            filename={`count-sheet-${session.stage.toLowerCase()}-${session.standId}-${session.eventDate.replace(/\//g, '-')}.pdf`}
            title={`Count Sheet - ${standName}`}
            variant="compact"
          />
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-auto p-3">
        <Accordion 
          type="multiple" 
          value={expandedCategories} 
          onValueChange={setExpandedCategories}
          className="space-y-2"
        >
          {categories.map((category) => (
            <AccordionItem 
              key={category} 
              value={category}
              className="border rounded-lg overflow-hidden"
            >
              <AccordionTrigger className="px-3 py-2 bg-slate-800/50 hover:bg-slate-700/50">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-slate-400" />
                  <span className="font-medium">{category}</span>
                  <Badge variant="secondary" className="ml-2">
                    {itemsByCategory[category].length} items
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="p-2 space-y-2">
                {itemsByCategory[category].map((item) => (
                  <div 
                    key={item.id}
                    className="flex items-center gap-2 p-2 bg-slate-800/50 border border-slate-700 rounded-lg"
                    data-testid={`count-item-${item.id}`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{item.name}</p>
                      <p className="text-xs text-slate-500">
                        ${(item.price / 100).toFixed(2)}
                      </p>
                    </div>
                    
                    {isReadOnly ? (
                      <div className="text-lg font-bold text-slate-700 px-4">
                        {counts[item.id] || 0}
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-10 w-10 rounded-full"
                          onClick={() => handleDecrement(item.id)}
                          data-testid={`decrement-${item.id}`}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        
                        <Input
                          type="number"
                          min="0"
                          value={counts[item.id] || ''}
                          onChange={(e) => handleCountChange(item.id, parseInt(e.target.value) || 0)}
                          className="w-16 text-center text-lg font-bold"
                          data-testid={`input-count-${item.id}`}
                        />
                        
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-10 w-10 rounded-full"
                          onClick={() => handleIncrement(item.id)}
                          data-testid={`increment-${item.id}`}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-10 w-10"
                          onClick={() => handleSaveItem(item.id)}
                          disabled={savingItem === item.id}
                          data-testid={`save-${item.id}`}
                        >
                          {savingItem === item.id ? (
                            <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full" />
                          ) : (
                            <Save className="h-4 w-4 text-blue-600" />
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>

      {!isReadOnly && session.status === 'InProgress' && (
        <div className="p-3 border-t border-slate-700 bg-slate-800/50">
          <Button
            onClick={onCompleteSession}
            className="w-full bg-green-600 hover:bg-green-700 text-white py-6 text-lg shadow-lg flex items-center justify-center gap-2"
            data-testid="complete-count-session"
          >
            <Check className="h-5 w-5" />
            Complete {STAGE_LABELS[session.stage]}
          </Button>
          <p className="text-xs text-center text-slate-500 mt-2">
            This will finalize your count and record the completion time
          </p>
        </div>
      )}

      {session.status === 'Completed' && (
        <div className="p-3 border-t border-green-500/30 bg-green-500/10">
          <div className="flex items-center justify-center gap-2 text-green-400">
            <Check className="h-5 w-5" />
            <span className="font-medium">Count Completed</span>
          </div>
          {session.completedAt && (
            <p className="text-xs text-center text-green-300 mt-1">
              Finished at {formatTime(session.completedAt)}
            </p>
          )}
        </div>
      )}

      {showAIScanner && (
        <AIScanner
          onScanComplete={handleAIScanComplete}
          onClose={() => setShowAIScanner(false)}
          standName={standName}
        />
      )}
    </Card>
  );
}
