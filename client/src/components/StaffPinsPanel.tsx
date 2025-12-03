import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, Copy, Check, RotateCcw, UserPlus, Eye, EyeOff, 
  Shield, Crown, Clipboard, Radio, AlertTriangle, CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { GlassCard, GlassCardHeader, GlassCardContent } from '@/components/ui/premium';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';

interface StaffMember {
  id: string;
  name: string;
  role: string;
  department?: string;
  managementType?: string;
  presetPin?: string;
  pinChanged: boolean;
  requiresPinReset: boolean;
  presetPinIssuedAt?: string;
  isOnline: boolean;
  hasDualRole?: boolean;
  secondaryRole?: string;
}

const ROLE_LABELS: Record<string, string> = {
  'OperationsManager': 'Ops Manager',
  'Admin': 'Admin',
  'Supervisor': 'Supervisor',
  'ManagementCore': 'Manager',
  'ManagementAssistant': 'Asst. Manager',
  'IT': 'IT Support',
  'AlcoholCompliance': 'Compliance',
  'CheckInAssistant': 'Check-In',
  'StandLead': 'Stand Lead',
  'NPOWorker': 'NPO Worker',
};

const ROLE_COLORS: Record<string, string> = {
  'OperationsManager': 'from-cyan-500 to-blue-600',
  'Admin': 'from-purple-500 to-pink-600',
  'Supervisor': 'from-emerald-500 to-teal-600',
  'ManagementCore': 'from-amber-500 to-orange-600',
  'ManagementAssistant': 'from-amber-400 to-orange-500',
  'IT': 'from-slate-500 to-slate-600',
  'AlcoholCompliance': 'from-rose-500 to-red-600',
  'CheckInAssistant': 'from-indigo-500 to-purple-600',
  'StandLead': 'from-lime-500 to-green-600',
  'NPOWorker': 'from-gray-500 to-gray-600',
};

export function StaffPinsPanel() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showPins, setShowPins] = useState(false);
  const [newStaff, setNewStaff] = useState({
    name: '',
    pin: '',
    role: 'Supervisor',
    department: '',
  });

  const { data: staffList, isLoading } = useQuery<StaffMember[]>({
    queryKey: ['/api/admin/staff-pins'],
  });

  const createStaffMutation = useMutation({
    mutationFn: async (data: typeof newStaff) => {
      const res = await fetch('/api/admin/staff-pins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to create staff');
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/staff-pins'] });
      toast({
        title: 'Staff Added',
        description: `${data.user.name} created with PIN ${data.user.presetPin}`,
      });
      setShowAddModal(false);
      setNewStaff({ name: '', pin: '', role: 'Supervisor', department: '' });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const resetPinMutation = useMutation({
    mutationFn: async ({ userId, newPin }: { userId: string; newPin?: string }) => {
      const res = await fetch(`/api/admin/staff-pins/${userId}/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPin }),
      });
      if (!res.ok) throw new Error('Failed to reset PIN');
      return res.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/staff-pins'] });
      toast({
        title: 'PIN Reset',
        description: `New preset PIN: ${data.presetPin}`,
      });
    },
  });

  const copyPin = (id: string, pin: string) => {
    navigator.clipboard.writeText(pin);
    setCopiedId(id);
    toast({ title: 'PIN Copied', description: 'Copied to clipboard' });
    setTimeout(() => setCopiedId(null), 2000);
  };

  const generatePin = () => {
    const pin = String(Math.floor(1000 + Math.random() * 9000));
    setNewStaff(prev => ({ ...prev, pin }));
  };

  if (isLoading) {
    return (
      <GlassCard>
        <GlassCardHeader>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-cyan-400" />
            <span className="font-bold text-white">Staff PINs</span>
          </div>
        </GlassCardHeader>
        <GlassCardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin h-6 w-6 border-2 border-cyan-500 border-t-transparent rounded-full" />
          </div>
        </GlassCardContent>
      </GlassCard>
    );
  }

  return (
    <>
      <GlassCard>
        <GlassCardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-cyan-400" />
              <span className="font-bold text-white">Legends Staff PINs</span>
              <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">
                {staffList?.length || 0} staff
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPins(!showPins)}
                className="text-slate-400 hover:text-white"
              >
                {showPins ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                <span className="ml-1 text-xs">{showPins ? 'Hide' : 'Show'} PINs</span>
              </Button>
              <Button
                size="sm"
                onClick={() => setShowAddModal(true)}
                className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white"
              >
                <UserPlus className="h-4 w-4 mr-1" />
                Add Staff
              </Button>
            </div>
          </div>
        </GlassCardHeader>
        <GlassCardContent className="p-0">
          <ScrollArea className="h-[400px]">
            <div className="divide-y divide-white/5">
              {staffList?.map((staff, idx) => (
                <motion.div
                  key={staff.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  className="p-3 hover:bg-white/5 transition-colors"
                  data-testid={`staff-row-${staff.id}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${ROLE_COLORS[staff.role] || 'from-slate-500 to-slate-600'} flex items-center justify-center shadow-lg`}>
                        {staff.role === 'OperationsManager' ? (
                          <Crown className="h-5 w-5 text-white" />
                        ) : staff.role === 'Admin' ? (
                          <Shield className="h-5 w-5 text-white" />
                        ) : (
                          <span className="text-white font-bold text-sm">
                            {staff.name.charAt(0)}
                          </span>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white">{staff.name}</span>
                          {staff.isOnline && (
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                          <span>{ROLE_LABELS[staff.role] || staff.role}</span>
                          {staff.department && (
                            <>
                              <span className="text-slate-600">•</span>
                              <span>{staff.department}</span>
                            </>
                          )}
                          {staff.hasDualRole && staff.secondaryRole && (
                            <>
                              <span className="text-slate-600">•</span>
                              <Badge variant="outline" className="text-[10px] py-0 h-4">
                                +{ROLE_LABELS[staff.secondaryRole] || staff.secondaryRole}
                              </Badge>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      {staff.pinChanged ? (
                        <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Changed
                        </Badge>
                      ) : staff.presetPin ? (
                        <div className="flex items-center gap-2">
                          <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Preset
                          </Badge>
                          <div className="flex items-center gap-1 bg-slate-800/50 rounded-lg px-2 py-1">
                            <span className="font-mono text-lg text-white tracking-wider">
                              {showPins ? staff.presetPin : '••••'}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-slate-400 hover:text-white"
                              onClick={() => staff.presetPin && copyPin(staff.id, staff.presetPin)}
                            >
                              {copiedId === staff.id ? (
                                <Check className="h-3 w-3 text-emerald-400" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <Badge className="bg-slate-500/20 text-slate-400 border-slate-500/30">
                          No PIN
                        </Badge>
                      )}
                      
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-slate-400 hover:text-cyan-400"
                        onClick={() => resetPinMutation.mutate({ userId: staff.id })}
                        title="Reset PIN"
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </ScrollArea>
        </GlassCardContent>
      </GlassCard>

      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="bg-slate-900 border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white">Add Legends Staff Member</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label className="text-slate-300">Name</Label>
              <Input
                value={newStaff.name}
                onChange={(e) => setNewStaff(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Brian Smith"
                className="bg-slate-800 border-white/10 text-white"
              />
            </div>
            
            <div>
              <Label className="text-slate-300">Role</Label>
              <Select
                value={newStaff.role}
                onValueChange={(value) => setNewStaff(prev => ({ ...prev, role: value }))}
              >
                <SelectTrigger className="bg-slate-800 border-white/10 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-white/10">
                  <SelectItem value="OperationsManager">Operations Manager</SelectItem>
                  <SelectItem value="Admin">Admin</SelectItem>
                  <SelectItem value="Supervisor">Supervisor</SelectItem>
                  <SelectItem value="ManagementCore">Manager</SelectItem>
                  <SelectItem value="ManagementAssistant">Assistant Manager</SelectItem>
                  <SelectItem value="IT">IT Support</SelectItem>
                  <SelectItem value="AlcoholCompliance">Alcohol Compliance</SelectItem>
                  <SelectItem value="CheckInAssistant">Check-In Assistant</SelectItem>
                  <SelectItem value="StandLead">Stand Lead</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label className="text-slate-300">Department (optional)</Label>
              <Select
                value={newStaff.department}
                onValueChange={(value) => setNewStaff(prev => ({ ...prev, department: value }))}
              >
                <SelectTrigger className="bg-slate-800 border-white/10 text-white">
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-white/10">
                  <SelectItem value="Operations">Operations</SelectItem>
                  <SelectItem value="HR">HR</SelectItem>
                  <SelectItem value="Warehouse">Warehouse</SelectItem>
                  <SelectItem value="Kitchen">Kitchen</SelectItem>
                  <SelectItem value="Bar">Bar</SelectItem>
                  <SelectItem value="IT">IT</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label className="text-slate-300">Preset PIN</Label>
              <div className="flex gap-2">
                <Input
                  value={newStaff.pin}
                  onChange={(e) => setNewStaff(prev => ({ ...prev, pin: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
                  placeholder="4 digits"
                  maxLength={4}
                  className="bg-slate-800 border-white/10 text-white font-mono text-lg tracking-wider"
                />
                <Button
                  variant="outline"
                  onClick={generatePin}
                  className="border-white/10 text-slate-300"
                >
                  Generate
                </Button>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                They'll be prompted to change this on first login
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setShowAddModal(false)}
              className="text-slate-400"
            >
              Cancel
            </Button>
            <Button
              onClick={() => createStaffMutation.mutate(newStaff)}
              disabled={!newStaff.name || !newStaff.pin || newStaff.pin.length !== 4}
              className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white"
            >
              <UserPlus className="h-4 w-4 mr-1" />
              Add Staff Member
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
