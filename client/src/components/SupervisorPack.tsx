import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { 
  FileText, ClipboardCheck, Wine, Receipt, ShoppingCart,
  CheckCircle2, AlertTriangle, Clock, PenLine, Download,
  X, Save, Printer
} from 'lucide-react';
import SignatureCanvas from 'react-signature-canvas';
import { useRef } from 'react';

interface SupervisorPackProps {
  onClose?: () => void;
  supervisorName?: string;
  standName?: string;
  eventDate?: string;
}

interface ChecklistItem {
  id: string;
  label: string;
  checked: boolean;
  required: boolean;
  category: string;
}

interface VoucherEntry {
  id: string;
  recipientName: string;
  amount: string;
  reason: string;
  time: string;
}

interface OrderItem {
  id: string;
  itemName: string;
  currentCount: number;
  orderQuantity: number;
  unit: string;
}

export function SupervisorPack({ 
  onClose,
  supervisorName = 'Supervisor',
  standName = 'Stand 105',
  eventDate = new Date().toLocaleDateString()
}: SupervisorPackProps) {
  const sigCanvasRef = useRef<SignatureCanvas>(null);
  const [signature, setSignature] = useState<string | null>(null);
  
  const [checklist, setChecklist] = useState<ChecklistItem[]>([
    { id: '1', label: 'All staff present and accounted for', checked: false, required: true, category: 'Opening' },
    { id: '2', label: 'Cash drawers counted and verified', checked: false, required: true, category: 'Opening' },
    { id: '3', label: 'POS terminals powered on and tested', checked: false, required: true, category: 'Opening' },
    { id: '4', label: 'Product inventory verified', checked: false, required: true, category: 'Opening' },
    { id: '5', label: 'Temperature logs recorded', checked: false, required: true, category: 'Opening' },
    { id: '6', label: 'Health inspection certificate displayed', checked: false, required: true, category: 'Compliance' },
    { id: '7', label: 'Handwashing station stocked', checked: false, required: true, category: 'Compliance' },
    { id: '8', label: 'Food handling gloves available', checked: false, required: true, category: 'Compliance' },
    { id: '9', label: 'Alcohol serving training verified for bartenders', checked: false, required: true, category: 'Alcohol' },
    { id: '10', label: 'ID verification tools available', checked: false, required: true, category: 'Alcohol' },
    { id: '11', label: 'Wristband/stamp supplies stocked', checked: false, required: false, category: 'Alcohol' },
    { id: '12', label: 'Drink limit signage displayed', checked: false, required: true, category: 'Alcohol' },
    { id: '13', label: 'Emergency contact list posted', checked: false, required: true, category: 'Safety' },
    { id: '14', label: 'Fire extinguisher accessible', checked: false, required: true, category: 'Safety' },
    { id: '15', label: 'First aid kit available', checked: false, required: true, category: 'Safety' },
    { id: '16', label: 'End of event cash count completed', checked: false, required: true, category: 'Closing' },
    { id: '17', label: 'Equipment powered down properly', checked: false, required: true, category: 'Closing' },
    { id: '18', label: 'Leftover inventory secured', checked: false, required: true, category: 'Closing' },
    { id: '19', label: 'Area cleaned and sanitized', checked: false, required: true, category: 'Closing' },
    { id: '20', label: 'Incident reports filed (if any)', checked: false, required: false, category: 'Closing' },
  ]);

  const [alcoholCompliance, setAlcoholCompliance] = useState({
    trainingDate: '',
    licenseNumber: '',
    expirationDate: '',
    lastAuditDate: '',
    incidentsToday: '0',
    refusalsToday: '0',
    notes: ''
  });

  const [vouchers, setVouchers] = useState<VoucherEntry[]>([]);
  const [newVoucher, setNewVoucher] = useState({ recipientName: '', amount: '', reason: '' });

  const [orderSheet, setOrderSheet] = useState<OrderItem[]>([
    { id: '1', itemName: 'Bud Light 16oz', currentCount: 24, orderQuantity: 0, unit: 'cases' },
    { id: '2', itemName: 'Miller Lite 16oz', currentCount: 18, orderQuantity: 0, unit: 'cases' },
    { id: '3', itemName: 'Coca Cola 20oz', currentCount: 36, orderQuantity: 0, unit: 'cases' },
    { id: '4', itemName: 'Water 20oz', currentCount: 48, orderQuantity: 0, unit: 'cases' },
    { id: '5', itemName: 'Hot Dogs', currentCount: 100, orderQuantity: 0, unit: 'each' },
    { id: '6', itemName: 'Hot Dog Buns', currentCount: 96, orderQuantity: 0, unit: 'packs' },
    { id: '7', itemName: 'Nachos Chips', currentCount: 50, orderQuantity: 0, unit: 'bags' },
    { id: '8', itemName: 'Nacho Cheese', currentCount: 12, orderQuantity: 0, unit: 'cans' },
    { id: '9', itemName: 'Pretzels', currentCount: 40, orderQuantity: 0, unit: 'each' },
    { id: '10', itemName: 'Popcorn Kernels', currentCount: 8, orderQuantity: 0, unit: 'bags' },
    { id: '11', itemName: 'Cups 16oz', currentCount: 200, orderQuantity: 0, unit: 'sleeves' },
    { id: '12', itemName: 'Cups 20oz', currentCount: 150, orderQuantity: 0, unit: 'sleeves' },
    { id: '13', itemName: 'Napkins', currentCount: 500, orderQuantity: 0, unit: 'packs' },
    { id: '14', itemName: 'Straws', currentCount: 400, orderQuantity: 0, unit: 'boxes' },
  ]);

  const toggleChecklistItem = (id: string) => {
    setChecklist(prev => prev.map(item => 
      item.id === id ? { ...item, checked: !item.checked } : item
    ));
  };

  const addVoucher = () => {
    if (newVoucher.recipientName && newVoucher.amount) {
      setVouchers([...vouchers, {
        id: Date.now().toString(),
        ...newVoucher,
        time: new Date().toLocaleTimeString()
      }]);
      setNewVoucher({ recipientName: '', amount: '', reason: '' });
    }
  };

  const updateOrderQuantity = (id: string, quantity: number) => {
    setOrderSheet(prev => prev.map(item =>
      item.id === id ? { ...item, orderQuantity: Math.max(0, quantity) } : item
    ));
  };

  const clearSignature = () => {
    sigCanvasRef.current?.clear();
    setSignature(null);
  };

  const saveSignature = () => {
    if (sigCanvasRef.current) {
      const dataUrl = sigCanvasRef.current.toDataURL();
      setSignature(dataUrl);
    }
  };

  const completedItems = checklist.filter(i => i.checked).length;
  const totalItems = checklist.length;
  const requiredComplete = checklist.filter(i => i.required && i.checked).length;
  const totalRequired = checklist.filter(i => i.required).length;

  const categories = Array.from(new Set(checklist.map(i => i.category)));

  return (
    <div className="h-full flex flex-col bg-background" data-testid="supervisor-pack">
      <div className="flex items-center justify-between p-4 border-b bg-amber-600 text-white">
        <div>
          <h1 className="text-lg font-bold flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Supervisor Pack
          </h1>
          <p className="text-sm text-amber-100">{standName} - {eventDate}</p>
        </div>
        {onClose && (
          <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-amber-700">
            <X className="h-5 w-5" />
          </Button>
        )}
      </div>

      <Tabs defaultValue="checklist" className="flex-1 flex flex-col">
        <TabsList className="w-full rounded-none border-b border-slate-700 bg-slate-800 p-0 h-auto">
          <TabsTrigger value="checklist" className="flex-1 rounded-none py-3 data-[state=active]:bg-slate-900 data-[state=active]:border-b-2 data-[state=active]:border-amber-500">
            <ClipboardCheck className="h-4 w-4 mr-1" />
            Checklist
          </TabsTrigger>
          <TabsTrigger value="alcohol" className="flex-1 rounded-none py-3 data-[state=active]:bg-slate-900 data-[state=active]:border-b-2 data-[state=active]:border-amber-500">
            <Wine className="h-4 w-4 mr-1" />
            Alcohol
          </TabsTrigger>
          <TabsTrigger value="vouchers" className="flex-1 rounded-none py-3 data-[state=active]:bg-slate-900 data-[state=active]:border-b-2 data-[state=active]:border-amber-500">
            <Receipt className="h-4 w-4 mr-1" />
            Vouchers
          </TabsTrigger>
          <TabsTrigger value="orders" className="flex-1 rounded-none py-3 data-[state=active]:bg-slate-900 data-[state=active]:border-b-2 data-[state=active]:border-amber-500">
            <ShoppingCart className="h-4 w-4 mr-1" />
            Orders
          </TabsTrigger>
        </TabsList>

        <ScrollArea className="flex-1">
          <TabsContent value="checklist" className="p-4 m-0 space-y-4">
            <div className="flex items-center justify-between p-3 bg-amber-500/10 rounded-lg border border-amber-500/30">
              <div>
                <p className="font-medium text-amber-300">Progress: {completedItems}/{totalItems}</p>
                <p className="text-sm text-amber-400">Required: {requiredComplete}/{totalRequired}</p>
              </div>
              <Badge className={requiredComplete === totalRequired ? 'bg-green-600' : 'bg-amber-600'}>
                {Math.round((completedItems / totalItems) * 100)}%
              </Badge>
            </div>

            <Accordion type="multiple" defaultValue={categories}>
              {categories.map(category => (
                <AccordionItem key={category} value={category}>
                  <AccordionTrigger className="text-sm font-medium">
                    {category} ({checklist.filter(i => i.category === category && i.checked).length}/{checklist.filter(i => i.category === category).length})
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2">
                      {checklist.filter(i => i.category === category).map(item => (
                        <div 
                          key={item.id}
                          className={`flex items-center gap-3 p-3 rounded-lg border ${
                            item.checked ? 'bg-green-500/10 border-green-500/30' : 'bg-slate-800/50 border-slate-700'
                          }`}
                        >
                          <Checkbox
                            checked={item.checked}
                            onCheckedChange={() => toggleChecklistItem(item.id)}
                            data-testid={`checklist-${item.id}`}
                          />
                          <span className={`flex-1 text-sm ${item.checked ? 'line-through text-muted-foreground' : ''}`}>
                            {item.label}
                          </span>
                          {item.required && !item.checked && (
                            <Badge variant="outline" className="text-xs bg-red-500/10 text-red-400 border-red-500/30">
                              Required
                            </Badge>
                          )}
                          {item.checked && (
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          )}
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>

            <Card className="border-2 border-dashed border-amber-300">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <PenLine className="h-4 w-4" />
                  Supervisor Signature
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!signature ? (
                  <div className="space-y-3">
                    <div className="border border-slate-600 rounded-lg bg-slate-800/50">
                      <SignatureCanvas
                        ref={sigCanvasRef}
                        canvasProps={{
                          className: 'w-full h-32 touch-none',
                          style: { width: '100%', height: '128px' }
                        }}
                        backgroundColor="white"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={clearSignature}>
                        Clear
                      </Button>
                      <Button size="sm" onClick={saveSignature} className="bg-amber-600 hover:bg-amber-700">
                        <Save className="h-4 w-4 mr-1" />
                        Save Signature
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <img src={signature} alt="Signature" className="border border-slate-600 rounded-lg bg-slate-800/50 p-2" />
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Signed by {supervisorName} at {new Date().toLocaleTimeString()}
                      </span>
                      <Button variant="outline" size="sm" onClick={() => setSignature(null)}>
                        Re-sign
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="alcohol" className="p-4 m-0 space-y-4">
            <Card className="border-red-500/30 bg-red-500/10">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2 text-red-300">
                  <AlertTriangle className="h-5 w-5" />
                  Alcohol Compliance
                </CardTitle>
                <CardDescription className="text-red-400">
                  Complete all fields for alcohol service documentation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">TIPS Training Date</Label>
                    <Input 
                      type="date"
                      value={alcoholCompliance.trainingDate}
                      onChange={e => setAlcoholCompliance({...alcoholCompliance, trainingDate: e.target.value})}
                      data-testid="input-training-date"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">License Number</Label>
                    <Input 
                      placeholder="ABC-12345"
                      value={alcoholCompliance.licenseNumber}
                      onChange={e => setAlcoholCompliance({...alcoholCompliance, licenseNumber: e.target.value})}
                      data-testid="input-license-number"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">License Expiration</Label>
                    <Input 
                      type="date"
                      value={alcoholCompliance.expirationDate}
                      onChange={e => setAlcoholCompliance({...alcoholCompliance, expirationDate: e.target.value})}
                      data-testid="input-expiration-date"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Last Audit Date</Label>
                    <Input 
                      type="date"
                      value={alcoholCompliance.lastAuditDate}
                      onChange={e => setAlcoholCompliance({...alcoholCompliance, lastAuditDate: e.target.value})}
                      data-testid="input-audit-date"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Alcohol-Related Incidents Today</Label>
                    <Input 
                      type="number"
                      min="0"
                      value={alcoholCompliance.incidentsToday}
                      onChange={e => setAlcoholCompliance({...alcoholCompliance, incidentsToday: e.target.value})}
                      data-testid="input-incidents"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">ID Refusals Today</Label>
                    <Input 
                      type="number"
                      min="0"
                      value={alcoholCompliance.refusalsToday}
                      onChange={e => setAlcoholCompliance({...alcoholCompliance, refusalsToday: e.target.value})}
                      data-testid="input-refusals"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-xs">Notes / Observations</Label>
                  <Textarea 
                    placeholder="Document any alcohol-related observations or incidents..."
                    value={alcoholCompliance.notes}
                    onChange={e => setAlcoholCompliance({...alcoholCompliance, notes: e.target.value})}
                    rows={3}
                    data-testid="textarea-alcohol-notes"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Staff Alcohol Training Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {['John Bartender', 'Sarah Server', 'Mike Runner'].map((name, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-slate-800/50 rounded-lg">
                      <span className="text-sm font-medium">{name}</span>
                      <Badge className="bg-green-600">TIPS Certified</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="vouchers" className="p-4 m-0 space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Receipt className="h-4 w-4" />
                  Issue New Voucher
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Recipient Name</Label>
                    <Input 
                      placeholder="Guest name"
                      value={newVoucher.recipientName}
                      onChange={e => setNewVoucher({...newVoucher, recipientName: e.target.value})}
                      data-testid="input-voucher-name"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Amount ($)</Label>
                    <Input 
                      type="number"
                      placeholder="0.00"
                      value={newVoucher.amount}
                      onChange={e => setNewVoucher({...newVoucher, amount: e.target.value})}
                      data-testid="input-voucher-amount"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Reason</Label>
                  <Input 
                    placeholder="Customer service recovery, etc."
                    value={newVoucher.reason}
                    onChange={e => setNewVoucher({...newVoucher, reason: e.target.value})}
                    data-testid="input-voucher-reason"
                  />
                </div>
                <Button onClick={addVoucher} className="w-full bg-amber-600 hover:bg-amber-700">
                  Issue Voucher
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Issued Vouchers Today ({vouchers.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {vouchers.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No vouchers issued yet</p>
                ) : (
                  <div className="space-y-2">
                    {vouchers.map(v => (
                      <div key={v.id} className="p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium">{v.recipientName}</span>
                          <Badge className="bg-green-600">${v.amount}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{v.reason}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          <Clock className="h-3 w-3 inline mr-1" />
                          {v.time}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="orders" className="p-4 m-0 space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4" />
                  Ordering Sheet
                </CardTitle>
                <CardDescription>Enter quantities to order for next event</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {orderSheet.map(item => (
                    <div key={item.id} className="flex items-center gap-3 p-2 bg-slate-800/50 rounded-lg">
                      <div className="flex-1">
                        <p className="text-sm font-medium">{item.itemName}</p>
                        <p className="text-xs text-muted-foreground">Current: {item.currentCount} {item.unit}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          size="icon" 
                          variant="outline" 
                          className="h-8 w-8"
                          onClick={() => updateOrderQuantity(item.id, item.orderQuantity - 1)}
                        >
                          -
                        </Button>
                        <Input 
                          type="number"
                          className="w-16 h-8 text-center"
                          value={item.orderQuantity}
                          onChange={e => updateOrderQuantity(item.id, parseInt(e.target.value) || 0)}
                          data-testid={`order-qty-${item.id}`}
                        />
                        <Button 
                          size="icon" 
                          variant="outline" 
                          className="h-8 w-8"
                          onClick={() => updateOrderQuantity(item.id, item.orderQuantity + 1)}
                        >
                          +
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1">
                <Printer className="h-4 w-4 mr-2" />
                Print Order
              </Button>
              <Button className="flex-1 bg-amber-600 hover:bg-amber-700">
                <Download className="h-4 w-4 mr-2" />
                Submit Order
              </Button>
            </div>
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </div>
  );
}
