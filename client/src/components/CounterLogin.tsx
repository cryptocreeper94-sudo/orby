import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ClipboardList, User, Phone, Briefcase, X, AlertCircle } from 'lucide-react';

type CountStage = 'PreEvent' | 'PostEvent' | 'DayAfter';
type CounterRole = 'NPOLead' | 'Supervisor' | 'Manager' | 'ManagerAssistant';

interface CounterLoginProps {
  standId: string;
  standName: string;
  eventDate: string;
  allowedStages: CountStage[];
  defaultStage?: CountStage;
  onStartSession: (session: {
    counterName: string;
    counterRole: CounterRole;
    counterPhoneLast4: string;
    stage: CountStage;
  }) => void;
  onClose: () => void;
  existingSessions?: Array<{
    stage: CountStage;
    status: string;
    counterName: string;
    counterPhoneLast4: string;
  }>;
}

const STAGE_LABELS: Record<CountStage, string> = {
  PreEvent: 'Pre-Event Count',
  PostEvent: 'Post-Event Count',
  DayAfter: 'Day-After Recount'
};

const ROLE_LABELS: Record<CounterRole, string> = {
  NPOLead: 'NPO Stand Lead',
  Supervisor: 'Stand Supervisor',
  Manager: 'Manager',
  ManagerAssistant: 'Manager Assistant'
};

const STAGE_ALLOWED_ROLES: Record<CountStage, CounterRole[]> = {
  PreEvent: ['NPOLead'],
  PostEvent: ['Supervisor'],
  DayAfter: ['Manager', 'ManagerAssistant']
};

export function CounterLogin({
  standId,
  standName,
  eventDate,
  allowedStages,
  defaultStage,
  onStartSession,
  onClose,
  existingSessions = []
}: CounterLoginProps) {
  const [name, setName] = useState('');
  const [phoneLast4, setPhoneLast4] = useState('');
  const [stage, setStage] = useState<CountStage>(defaultStage || allowedStages[0] || 'PreEvent');
  const [role, setRole] = useState<CounterRole | ''>('');
  const [error, setError] = useState('');

  const allowedRoles = STAGE_ALLOWED_ROLES[stage] || [];

  const getStageStatus = (stageType: CountStage) => {
    const session = existingSessions.find(s => s.stage === stageType);
    if (!session) return null;
    return session;
  };

  const isStageAvailable = (stageType: CountStage) => {
    const session = getStageStatus(stageType);
    if (session && session.status !== 'InProgress') {
      return false;
    }
    
    if (stageType === 'PostEvent') {
      const preEvent = getStageStatus('PreEvent');
      if (!preEvent || preEvent.status === 'InProgress') return false;
    }
    
    if (stageType === 'DayAfter') {
      const postEvent = getStageStatus('PostEvent');
      if (!postEvent || postEvent.status === 'InProgress') return false;
    }
    
    return true;
  };

  const handleSubmit = () => {
    setError('');
    
    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }
    
    if (!role) {
      setError('Please select your role');
      return;
    }
    
    if (!phoneLast4 || phoneLast4.length !== 4 || !/^\d{4}$/.test(phoneLast4)) {
      setError('Please enter exactly 4 digits from your phone number');
      return;
    }
    
    if (!isStageAvailable(stage)) {
      setError('This count stage is not available');
      return;
    }
    
    onStartSession({
      counterName: name.trim(),
      counterRole: role,
      counterPhoneLast4: phoneLast4,
      stage
    });
  };

  return (
    <Card className="h-full flex flex-col" data-testid="counter-login">
      <CardHeader className="pb-2 flex-shrink-0 bg-gradient-to-r from-blue-900/30 to-indigo-900/30">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-blue-400" />
            Start Inventory Count
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose} data-testid="close-counter-login">
            <X className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-sm text-slate-400 mt-1">
          {standName} • {eventDate}
        </p>
      </CardHeader>

      <CardContent className="flex-1 overflow-auto p-4 space-y-4">
        {existingSessions.length > 0 && (
          <div className="bg-slate-800/50 rounded-lg p-3 space-y-2 border border-slate-700">
            <p className="text-sm font-medium text-slate-300">Previous Counts:</p>
            {existingSessions.map((session) => (
              <div 
                key={session.stage} 
                className={`text-xs px-2 py-1 rounded ${
                  session.status === 'Completed' ? 'bg-green-500/10 text-green-400 border border-green-500/30' :
                  session.status === 'Verified' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30' :
                  'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                }`}
              >
                {STAGE_LABELS[session.stage]}: {session.status} by {session.counterName} (***{session.counterPhoneLast4})
              </div>
            ))}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="stage" className="text-sm font-medium">Count Type</Label>
          <Select value={stage} onValueChange={(v) => { setStage(v as CountStage); setRole(''); }}>
            <SelectTrigger data-testid="select-stage">
              <SelectValue placeholder="Select count type" />
            </SelectTrigger>
            <SelectContent>
              {allowedStages.map((s) => {
                const available = isStageAvailable(s);
                const session = getStageStatus(s);
                return (
                  <SelectItem 
                    key={s} 
                    value={s} 
                    disabled={!available}
                    data-testid={`stage-option-${s}`}
                  >
                    {STAGE_LABELS[s]}
                    {session && ` (${session.status})`}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="name" className="text-sm font-medium flex items-center gap-2">
            <User className="h-4 w-4 text-slate-500" />
            Your Name
          </Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your full name"
            data-testid="input-counter-name"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="role" className="text-sm font-medium flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-slate-500" />
            Your Role
          </Label>
          <Select value={role} onValueChange={(v) => setRole(v as CounterRole)}>
            <SelectTrigger data-testid="select-role">
              <SelectValue placeholder="Select your role" />
            </SelectTrigger>
            <SelectContent>
              {allowedRoles.map((r) => (
                <SelectItem key={r} value={r} data-testid={`role-option-${r}`}>
                  {ROLE_LABELS[r]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-slate-500">
            {stage === 'PreEvent' && 'Pre-event counts are done by NPO Stand Leads'}
            {stage === 'PostEvent' && 'Post-event counts are done by Stand Supervisors'}
            {stage === 'DayAfter' && 'Day-after recounts are done by Managers'}
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone" className="text-sm font-medium flex items-center gap-2">
            <Phone className="h-4 w-4 text-slate-500" />
            Last 4 of Phone Number
          </Label>
          <Input
            id="phone"
            type="tel"
            maxLength={4}
            value={phoneLast4}
            onChange={(e) => setPhoneLast4(e.target.value.replace(/\D/g, '').slice(0, 4))}
            placeholder="####"
            className="text-center text-2xl tracking-widest font-mono"
            data-testid="input-phone-last4"
          />
          <p className="text-xs text-slate-500">
            This identifies you as the person doing this count
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/30 p-3 rounded-lg">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}

        <Button
          onClick={handleSubmit}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 text-lg shadow-lg"
          disabled={!name || !role || phoneLast4.length !== 4}
          data-testid="button-start-count"
        >
          Start {STAGE_LABELS[stage]}
        </Button>

        <div className="text-xs text-center text-slate-500 pt-2">
          Your identity will be recorded with this count session
        </div>
      </CardContent>
    </Card>
  );
}
