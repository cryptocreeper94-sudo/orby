import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ClipboardCheck, Trash2, Receipt, Check, Plus, Minus, 
  AlertCircle, Loader2, CheckCircle, X, DollarSign
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface ChecklistTask {
  id: string;
  taskKey: string;
  taskLabel: string;
  isCompleted: boolean;
  completedAt?: string;
  remarks?: string;
}

interface SpoilageItem {
  id: string;
  itemName: string;
  quantity: number;
  unit: string;
  reason: 'ThrownAway' | 'Returned' | 'Damaged' | 'Expired' | 'Other';
  notes?: string;
}

interface SupervisorClosingPanelProps {
  standId: string;
  standName: string;
  eventDate: string;
  supervisorId: string;
  onClose?: () => void;
}

const SPOILAGE_REASONS = [
  { value: 'ThrownAway', label: 'Thrown Away' },
  { value: 'Returned', label: 'Returned' },
  { value: 'Damaged', label: 'Damaged' },
  { value: 'Expired', label: 'Expired' },
  { value: 'Other', label: 'Other' },
];

export function SupervisorClosingPanel({
  standId,
  standName,
  eventDate,
  supervisorId,
  onClose
}: SupervisorClosingPanelProps) {
  const [activeTab, setActiveTab] = useState('checklist');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Checklist state
  const [checklistId, setChecklistId] = useState<string | null>(null);
  const [tasks, setTasks] = useState<ChecklistTask[]>([]);
  const [checklistComplete, setChecklistComplete] = useState(false);
  
  // Spoilage state
  const [spoilageReportId, setSpoilageReportId] = useState<string | null>(null);
  const [spoilageItems, setSpoilageItems] = useState<SpoilageItem[]>([]);
  const [spoilageSubmitted, setSpoilageSubmitted] = useState(false);
  const [newSpoilage, setNewSpoilage] = useState({
    itemName: '',
    quantity: 1,
    reason: 'ThrownAway' as const,
    notes: ''
  });
  
  // Voucher state
  const [voucherReportId, setVoucherReportId] = useState<string | null>(null);
  const [voucherCount, setVoucherCount] = useState(0);
  const [voucherTotal, setVoucherTotal] = useState(0);
  const [voucherNotes, setVoucherNotes] = useState('');
  const [voucherSubmitted, setVoucherSubmitted] = useState(false);
  
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadAllData();
  }, [standId, eventDate]);

  const loadAllData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      await Promise.all([
        loadChecklist(),
        loadSpoilageReport(),
        loadVoucherReport()
      ]);
    } catch (err) {
      setError('Failed to load closing data');
    } finally {
      setIsLoading(false);
    }
  };

  const loadChecklist = async () => {
    const res = await fetch(`/api/closing-checklists/${standId}/${eventDate}`);
    const data = await res.json();
    
    if (data.checklist) {
      setChecklistId(data.checklist.id);
      setTasks(data.tasks || []);
      setChecklistComplete(data.checklist.isComplete);
    }
  };

  const loadSpoilageReport = async () => {
    const res = await fetch(`/api/spoilage-reports/${standId}/${eventDate}`);
    const data = await res.json();
    
    if (data.report) {
      setSpoilageReportId(data.report.id);
      setSpoilageItems(data.items || []);
      setSpoilageSubmitted(data.report.isSubmitted);
    }
  };

  const loadVoucherReport = async () => {
    const res = await fetch(`/api/voucher-reports/${standId}/${eventDate}`);
    const data = await res.json();
    
    if (data.report) {
      setVoucherReportId(data.report.id);
      setVoucherCount(data.report.voucherCount);
      setVoucherTotal(data.report.totalAmountCents / 100);
      setVoucherNotes(data.report.notes || '');
      setVoucherSubmitted(data.report.isSubmitted);
    }
  };

  const startChecklist = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/closing-checklists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ standId, eventDate, supervisorId })
      });
      const data = await res.json();
      setChecklistId(data.checklist.id);
      setTasks(data.tasks || []);
    } catch (err) {
      setError('Failed to start checklist');
    } finally {
      setSaving(false);
    }
  };

  const toggleTask = async (taskId: string, isCompleted: boolean) => {
    try {
      await fetch(`/api/closing-checklist-tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isCompleted })
      });
      
      setTasks(prev => prev.map(t => 
        t.id === taskId ? { ...t, isCompleted } : t
      ));
    } catch (err) {
      setError('Failed to update task');
    }
  };

  const completeChecklist = async () => {
    if (!checklistId) return;
    setSaving(true);
    try {
      await fetch(`/api/closing-checklists/${checklistId}/complete`, {
        method: 'PATCH'
      });
      setChecklistComplete(true);
    } catch (err) {
      setError('Failed to complete checklist');
    } finally {
      setSaving(false);
    }
  };

  const startSpoilageReport = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/spoilage-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ standId, eventDate, supervisorId })
      });
      const data = await res.json();
      setSpoilageReportId(data.report.id);
    } catch (err) {
      setError('Failed to start spoilage report');
    } finally {
      setSaving(false);
    }
  };

  const addSpoilageItem = async () => {
    if (!spoilageReportId || !newSpoilage.itemName) return;
    setSaving(true);
    try {
      const res = await fetch('/api/spoilage-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportId: spoilageReportId,
          itemName: newSpoilage.itemName,
          quantity: newSpoilage.quantity,
          unit: 'each',
          reason: newSpoilage.reason,
          notes: newSpoilage.notes
        })
      });
      const item = await res.json();
      setSpoilageItems(prev => [...prev, item]);
      setNewSpoilage({ itemName: '', quantity: 1, reason: 'ThrownAway', notes: '' });
    } catch (err) {
      setError('Failed to add spoilage item');
    } finally {
      setSaving(false);
    }
  };

  const removeSpoilageItem = async (itemId: string) => {
    try {
      await fetch(`/api/spoilage-items/${itemId}`, { method: 'DELETE' });
      setSpoilageItems(prev => prev.filter(i => i.id !== itemId));
    } catch (err) {
      setError('Failed to remove item');
    }
  };

  const submitSpoilageReport = async () => {
    if (!spoilageReportId) return;
    setSaving(true);
    try {
      await fetch(`/api/spoilage-reports/${spoilageReportId}/submit`, {
        method: 'PATCH'
      });
      setSpoilageSubmitted(true);
    } catch (err) {
      setError('Failed to submit spoilage report');
    } finally {
      setSaving(false);
    }
  };

  const startVoucherReport = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/voucher-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ standId, eventDate, supervisorId })
      });
      const data = await res.json();
      setVoucherReportId(data.report.id);
    } catch (err) {
      setError('Failed to start voucher report');
    } finally {
      setSaving(false);
    }
  };

  const updateVoucherReport = async () => {
    if (!voucherReportId) return;
    setSaving(true);
    try {
      await fetch(`/api/voucher-reports/${voucherReportId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          voucherCount,
          totalAmountCents: Math.round(voucherTotal * 100),
          notes: voucherNotes
        })
      });
    } catch (err) {
      setError('Failed to update voucher report');
    } finally {
      setSaving(false);
    }
  };

  const submitVoucherReport = async () => {
    if (!voucherReportId) return;
    setSaving(true);
    try {
      await updateVoucherReport();
      await fetch(`/api/voucher-reports/${voucherReportId}/submit`, {
        method: 'PATCH'
      });
      setVoucherSubmitted(true);
    } catch (err) {
      setError('Failed to submit voucher report');
    } finally {
      setSaving(false);
    }
  };

  const completedTasks = tasks.filter(t => t.isCompleted).length;
  const totalTasks = tasks.length;
  const checklistProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full" data-testid="supervisor-closing-panel">
      <CardHeader className="pb-2 bg-gradient-to-r from-slate-50 to-blue-50">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5 text-blue-600" />
              End of Shift Closeout
            </CardTitle>
            <p className="text-sm text-slate-600">{standName} - {eventDate}</p>
          </div>
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        
        {error && (
          <div className="flex items-center gap-2 text-red-600 bg-red-50 p-2 rounded mt-2">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">{error}</span>
          </div>
        )}
      </CardHeader>

      <CardContent className="p-0">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0">
            <TabsTrigger 
              value="checklist" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600"
              data-testid="tab-checklist"
            >
              <ClipboardCheck className="h-4 w-4 mr-1" />
              Checklist
              {checklistComplete && <CheckCircle className="h-3 w-3 ml-1 text-green-600" />}
            </TabsTrigger>
            <TabsTrigger 
              value="spoilage"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600"
              data-testid="tab-spoilage"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Spoilage
              {spoilageSubmitted && <CheckCircle className="h-3 w-3 ml-1 text-green-600" />}
            </TabsTrigger>
            <TabsTrigger 
              value="vouchers"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600"
              data-testid="tab-vouchers"
            >
              <Receipt className="h-4 w-4 mr-1" />
              Vouchers
              {voucherSubmitted && <CheckCircle className="h-3 w-3 ml-1 text-green-600" />}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="checklist" className="p-4 space-y-4">
            {!checklistId ? (
              <div className="text-center py-8">
                <ClipboardCheck className="h-12 w-12 mx-auto text-slate-300 mb-4" />
                <p className="text-slate-600 mb-4">Start your end-of-shift equipment checklist</p>
                <Button onClick={startChecklist} disabled={saving} data-testid="start-checklist">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Start Checklist
                </Button>
              </div>
            ) : (
              <>
                <div className="bg-slate-50 rounded-lg p-3">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span>Progress: {completedTasks}/{totalTasks} tasks</span>
                    <span className="font-medium">{checklistProgress}%</span>
                  </div>
                  <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-300 ${
                        checklistProgress === 100 ? 'bg-green-500' : 'bg-blue-500'
                      }`}
                      style={{ width: `${checklistProgress}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {tasks.map((task) => (
                    <div 
                      key={task.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border ${
                        task.isCompleted ? 'bg-green-50 border-green-200' : 'bg-white'
                      }`}
                      data-testid={`checklist-task-${task.taskKey}`}
                    >
                      <Checkbox
                        checked={task.isCompleted}
                        onCheckedChange={(checked) => toggleTask(task.id, !!checked)}
                        disabled={checklistComplete}
                        data-testid={`checkbox-${task.taskKey}`}
                      />
                      <span className={task.isCompleted ? 'line-through text-slate-500' : ''}>
                        {task.taskLabel}
                      </span>
                      {task.isCompleted && (
                        <Check className="h-4 w-4 text-green-600 ml-auto" />
                      )}
                    </div>
                  ))}
                </div>

                {!checklistComplete && checklistProgress === 100 && (
                  <Button 
                    onClick={completeChecklist} 
                    disabled={saving}
                    className="w-full bg-green-600 hover:bg-green-700"
                    data-testid="complete-checklist"
                  >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                    Complete Checklist
                  </Button>
                )}

                {checklistComplete && (
                  <div className="flex items-center justify-center gap-2 text-green-700 bg-green-50 p-3 rounded-lg">
                    <CheckCircle className="h-5 w-5" />
                    <span className="font-medium">Checklist Completed</span>
                  </div>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="spoilage" className="p-4 space-y-4">
            {!spoilageReportId ? (
              <div className="text-center py-8">
                <Trash2 className="h-12 w-12 mx-auto text-slate-300 mb-4" />
                <p className="text-slate-600 mb-4">Track items thrown away, returned, or wasted</p>
                <Button onClick={startSpoilageReport} disabled={saving} data-testid="start-spoilage">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Start Spoilage Log
                </Button>
              </div>
            ) : (
              <>
                {!spoilageSubmitted && (
                  <div className="bg-slate-50 rounded-lg p-3 space-y-3">
                    <Input
                      placeholder="Item name (e.g., Hot Dogs, Bud Light)"
                      value={newSpoilage.itemName}
                      onChange={(e) => setNewSpoilage(p => ({ ...p, itemName: e.target.value }))}
                      data-testid="spoilage-item-name"
                    />
                    <div className="flex gap-2">
                      <div className="flex items-center gap-1">
                        <Button 
                          variant="outline" 
                          size="icon"
                          onClick={() => setNewSpoilage(p => ({ ...p, quantity: Math.max(1, p.quantity - 1) }))}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <Input
                          type="number"
                          value={newSpoilage.quantity}
                          onChange={(e) => setNewSpoilage(p => ({ ...p, quantity: parseInt(e.target.value) || 1 }))}
                          className="w-16 text-center"
                          min={1}
                          data-testid="spoilage-quantity"
                        />
                        <Button 
                          variant="outline" 
                          size="icon"
                          onClick={() => setNewSpoilage(p => ({ ...p, quantity: p.quantity + 1 }))}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <Select 
                        value={newSpoilage.reason} 
                        onValueChange={(v) => setNewSpoilage(p => ({ ...p, reason: v as any }))}
                      >
                        <SelectTrigger className="flex-1" data-testid="spoilage-reason">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {SPOILAGE_REASONS.map(r => (
                            <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Input
                      placeholder="Notes (optional)"
                      value={newSpoilage.notes}
                      onChange={(e) => setNewSpoilage(p => ({ ...p, notes: e.target.value }))}
                      data-testid="spoilage-notes"
                    />
                    <Button 
                      onClick={addSpoilageItem} 
                      disabled={saving || !newSpoilage.itemName}
                      className="w-full"
                      data-testid="add-spoilage-item"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Spoilage Item
                    </Button>
                  </div>
                )}

                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {spoilageItems.length === 0 ? (
                    <p className="text-center text-slate-500 py-4">No spoilage items recorded</p>
                  ) : (
                    spoilageItems.map((item) => (
                      <div 
                        key={item.id}
                        className="flex items-center justify-between p-3 bg-white border rounded-lg"
                        data-testid={`spoilage-item-${item.id}`}
                      >
                        <div>
                          <p className="font-medium">{item.itemName}</p>
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <span>Qty: {item.quantity}</span>
                            <Badge variant="outline">{SPOILAGE_REASONS.find(r => r.value === item.reason)?.label}</Badge>
                          </div>
                          {item.notes && <p className="text-xs text-slate-500">{item.notes}</p>}
                        </div>
                        {!spoilageSubmitted && (
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => removeSpoilageItem(item.id)}
                          >
                            <X className="h-4 w-4 text-red-500" />
                          </Button>
                        )}
                      </div>
                    ))
                  )}
                </div>

                {!spoilageSubmitted && (
                  <Button 
                    onClick={submitSpoilageReport} 
                    disabled={saving}
                    className="w-full bg-green-600 hover:bg-green-700"
                    data-testid="submit-spoilage"
                  >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                    Submit Spoilage Report
                  </Button>
                )}

                {spoilageSubmitted && (
                  <div className="flex items-center justify-center gap-2 text-green-700 bg-green-50 p-3 rounded-lg">
                    <CheckCircle className="h-5 w-5" />
                    <span className="font-medium">Spoilage Report Submitted</span>
                  </div>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="vouchers" className="p-4 space-y-4">
            {!voucherReportId ? (
              <div className="text-center py-8">
                <Receipt className="h-12 w-12 mx-auto text-slate-300 mb-4" />
                <p className="text-slate-600 mb-4">Record employee meal vouchers collected</p>
                <Button onClick={startVoucherReport} disabled={saving} data-testid="start-vouchers">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Start Voucher Report
                </Button>
              </div>
            ) : (
              <>
                <div className="bg-blue-50 rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Number of Vouchers</span>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="icon"
                        onClick={() => setVoucherCount(Math.max(0, voucherCount - 1))}
                        disabled={voucherSubmitted}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <Input
                        type="number"
                        value={voucherCount}
                        onChange={(e) => setVoucherCount(parseInt(e.target.value) || 0)}
                        className="w-20 text-center"
                        min={0}
                        disabled={voucherSubmitted}
                        data-testid="voucher-count"
                      />
                      <Button 
                        variant="outline" 
                        size="icon"
                        onClick={() => setVoucherCount(voucherCount + 1)}
                        disabled={voucherSubmitted}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="font-medium">Total Amount ($10/voucher)</span>
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-slate-500" />
                      <Input
                        type="number"
                        value={voucherTotal}
                        onChange={(e) => setVoucherTotal(parseFloat(e.target.value) || 0)}
                        className="w-24 text-right"
                        step={10}
                        min={0}
                        disabled={voucherSubmitted}
                        data-testid="voucher-total"
                      />
                    </div>
                  </div>

                  <div className="text-center py-2 border-t">
                    <p className="text-sm text-slate-600">
                      {voucherCount} vouchers × $10 = <span className="font-bold">${voucherCount * 10}</span>
                    </p>
                    {voucherTotal !== voucherCount * 10 && voucherTotal > 0 && (
                      <p className="text-xs text-amber-600">
                        Note: Entered total (${voucherTotal}) differs from calculated
                      </p>
                    )}
                  </div>

                  <Input
                    placeholder="Envelope ID or notes (optional)"
                    value={voucherNotes}
                    onChange={(e) => setVoucherNotes(e.target.value)}
                    disabled={voucherSubmitted}
                    data-testid="voucher-notes"
                  />
                </div>

                {!voucherSubmitted && (
                  <div className="space-y-2">
                    <Button 
                      onClick={updateVoucherReport} 
                      disabled={saving}
                      variant="outline"
                      className="w-full"
                      data-testid="save-vouchers"
                    >
                      {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                      Save Draft
                    </Button>
                    <Button 
                      onClick={submitVoucherReport} 
                      disabled={saving}
                      className="w-full bg-green-600 hover:bg-green-700"
                      data-testid="submit-vouchers"
                    >
                      {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                      Submit Voucher Report
                    </Button>
                  </div>
                )}

                {voucherSubmitted && (
                  <div className="flex items-center justify-center gap-2 text-green-700 bg-green-50 p-3 rounded-lg">
                    <CheckCircle className="h-5 w-5" />
                    <span className="font-medium">Voucher Report Submitted</span>
                  </div>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
