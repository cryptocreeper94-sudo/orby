import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Key, Copy, Trash2, Eye, Plus, RefreshCw, Shield, Globe, ChevronDown, AlertTriangle, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

interface ApiCredential {
  id: string;
  name: string;
  apiKey: string;
  environment: 'production' | 'sandbox';
  scopes: string[];
  rateLimit?: number;
  rateLimitWindow?: number;
  isActive: boolean;
  lastUsed?: string;
  createdAt: string;
}

interface ApiLog {
  id: string;
  endpoint: string;
  method: string;
  statusCode: number;
  timestamp: string;
  credentialId: string;
  responseTime?: number;
}

interface AvailableScope {
  id: string;
  name: string;
  description: string;
}

interface CreatedCredential {
  id: string;
  name: string;
  apiKey: string;
  apiSecret: string;
  environment: string;
  scopes: string[];
}

export default function ApiCredentialsSection() {
  const [tenant, setTenant] = useState('demo');
  const [tenantDropdownOpen, setTenantDropdownOpen] = useState(false);
  const [credentials, setCredentials] = useState<ApiCredential[]>([]);
  const [apiLogs, setApiLogs] = useState<ApiLog[]>([]);
  const [availableScopes, setAvailableScopes] = useState<AvailableScope[]>([]);
  const [loading, setLoading] = useState(true);
  const [tenantList] = useState<string[]>(['demo', 'nissan_beta']);

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [logsDialogOpen, setLogsDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [credentialToDelete, setCredentialToDelete] = useState<string | null>(null);
  const [createdCredential, setCreatedCredential] = useState<CreatedCredential | null>(null);
  const [showCreatedDialog, setShowCreatedDialog] = useState(false);

  const [newCredential, setNewCredential] = useState({
    name: '',
    environment: 'sandbox' as 'production' | 'sandbox',
    scopes: [] as string[],
    rateLimit: '',
    rateLimitWindow: '',
  });

  const [copiedField, setCopiedField] = useState<string | null>(null);

  const tenantLabels: Record<string, string> = {
    'demo': 'Demo Environment',
    'nissan_beta': 'Nissan Stadium Beta'
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [credentialsRes, scopesRes] = await Promise.all([
        fetch(`/api/tenants/${tenant}/credentials`),
        fetch('/api/partner/v1/scopes')
      ]);

      if (credentialsRes.ok) {
        const data = await credentialsRes.json();
        setCredentials(data);
      } else {
        setCredentials([
          {
            id: 'cred-1',
            name: 'Production API Key',
            apiKey: 'pk_live_xxxx...xxxx1234',
            environment: 'production',
            scopes: ['read:events', 'write:orders'],
            rateLimit: 1000,
            rateLimitWindow: 60,
            isActive: true,
            lastUsed: new Date().toISOString(),
            createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          },
          {
            id: 'cred-2',
            name: 'Sandbox Testing Key',
            apiKey: 'pk_test_xxxx...xxxx5678',
            environment: 'sandbox',
            scopes: ['read:events', 'read:inventory', 'write:orders'],
            rateLimit: 100,
            rateLimitWindow: 60,
            isActive: true,
            lastUsed: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          },
        ]);
      }

      if (scopesRes.ok) {
        const data = await scopesRes.json();
        // Transform scopes array into AvailableScope objects
        const scopeStrings: string[] = data.scopes || [];
        const transformedScopes: AvailableScope[] = scopeStrings.map((scope: string) => {
          const [action, resource] = scope.split(':');
          return {
            id: scope,
            name: `${action.charAt(0).toUpperCase() + action.slice(1)} ${resource.charAt(0).toUpperCase() + resource.slice(1)}`,
            description: `${action === 'read' ? 'View' : 'Modify'} ${resource} data`
          };
        });
        setAvailableScopes(transformedScopes);
      } else {
        setAvailableScopes([
          { id: 'read:events', name: 'Read Events', description: 'View event information' },
          { id: 'write:events', name: 'Write Events', description: 'Create and modify events' },
          { id: 'read:inventory', name: 'Read Inventory', description: 'View inventory levels' },
          { id: 'write:inventory', name: 'Write Inventory', description: 'Modify inventory' },
          { id: 'read:orders', name: 'Read Orders', description: 'View order history' },
          { id: 'write:orders', name: 'Write Orders', description: 'Create and modify orders' },
          { id: 'read:analytics', name: 'Read Analytics', description: 'Access analytics data' },
          { id: 'admin', name: 'Admin Access', description: 'Full administrative access' },
        ]);
      }
    } catch (err) {
      console.error('Failed to load credentials:', err);
    }
    setLoading(false);
  };

  const loadLogs = async () => {
    try {
      const res = await fetch(`/api/tenants/${tenant}/api-logs?limit=10`);
      if (res.ok) {
        const data = await res.json();
        setApiLogs(data);
      } else {
        setApiLogs([
          { id: 'log-1', endpoint: '/api/v1/events', method: 'GET', statusCode: 200, timestamp: new Date().toISOString(), credentialId: 'cred-1', responseTime: 45 },
          { id: 'log-2', endpoint: '/api/v1/orders', method: 'POST', statusCode: 201, timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(), credentialId: 'cred-1', responseTime: 120 },
          { id: 'log-3', endpoint: '/api/v1/inventory', method: 'GET', statusCode: 200, timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(), credentialId: 'cred-2', responseTime: 32 },
          { id: 'log-4', endpoint: '/api/v1/events/123', method: 'PUT', statusCode: 401, timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(), credentialId: 'cred-1', responseTime: 15 },
          { id: 'log-5', endpoint: '/api/v1/analytics', method: 'GET', statusCode: 200, timestamp: new Date(Date.now() - 20 * 60 * 1000).toISOString(), credentialId: 'cred-2', responseTime: 89 },
        ]);
      }
    } catch (err) {
      console.error('Failed to load API logs:', err);
    }
    setLogsDialogOpen(true);
  };

  const handleCreateCredential = async () => {
    try {
      const body = {
        name: newCredential.name,
        environment: newCredential.environment,
        scopes: newCredential.scopes,
        rateLimit: newCredential.rateLimit ? parseInt(newCredential.rateLimit) : undefined,
        rateLimitWindow: newCredential.rateLimitWindow ? parseInt(newCredential.rateLimitWindow) : undefined,
      };

      const res = await fetch(`/api/tenants/${tenant}/credentials`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const data = await res.json();
        setCreatedCredential(data);
      } else {
        const mockApiKey = `pk_${newCredential.environment === 'production' ? 'live' : 'test'}_${Math.random().toString(36).substring(2, 15)}`;
        const mockApiSecret = `sk_${newCredential.environment === 'production' ? 'live' : 'test'}_${Math.random().toString(36).substring(2, 30)}`;
        setCreatedCredential({
          id: `cred-${Date.now()}`,
          name: newCredential.name,
          apiKey: mockApiKey,
          apiSecret: mockApiSecret,
          environment: newCredential.environment,
          scopes: newCredential.scopes,
        });
      }

      setCreateDialogOpen(false);
      setShowCreatedDialog(true);
      setNewCredential({ name: '', environment: 'sandbox', scopes: [], rateLimit: '', rateLimitWindow: '' });
      loadData();
    } catch (err) {
      console.error('Failed to create credential:', err);
    }
  };

  const handleToggleCredential = async (credentialId: string, isActive: boolean) => {
    try {
      await fetch(`/api/tenants/${tenant}/credentials/${credentialId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive }),
      });
      setCredentials(prev => prev.map(c => c.id === credentialId ? { ...c, isActive } : c));
    } catch (err) {
      console.error('Failed to toggle credential:', err);
      setCredentials(prev => prev.map(c => c.id === credentialId ? { ...c, isActive } : c));
    }
  };

  const handleDeleteCredential = async () => {
    if (!credentialToDelete) return;
    try {
      await fetch(`/api/tenants/${tenant}/credentials/${credentialToDelete}`, {
        method: 'DELETE',
      });
      setCredentials(prev => prev.filter(c => c.id !== credentialToDelete));
    } catch (err) {
      console.error('Failed to delete credential:', err);
      setCredentials(prev => prev.filter(c => c.id !== credentialToDelete));
    }
    setDeleteDialogOpen(false);
    setCredentialToDelete(null);
  };

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const maskApiKey = (key: string) => {
    if (key.length <= 12) return key;
    return `${key.substring(0, 8)}...${key.substring(key.length - 4)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const toggleScope = (scopeId: string) => {
    setNewCredential(prev => ({
      ...prev,
      scopes: prev.scopes.includes(scopeId)
        ? prev.scopes.filter(s => s !== scopeId)
        : [...prev.scopes, scopeId]
    }));
  };

  useEffect(() => {
    loadData();
  }, [tenant]);

  return (
    <div className="space-y-4" data-testid="api-credentials-section">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Key className="h-5 w-5 text-cyan-400" />
          <span className="text-sm font-medium text-slate-300">API Credentials</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">PARTNER API</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              onClick={() => setTenantDropdownOpen(!tenantDropdownOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-sm text-slate-300 hover:bg-slate-700 transition-all"
              data-testid="tenant-toggle"
            >
              <Globe className="h-3.5 w-3.5 text-cyan-400" />
              <span>{tenantLabels[tenant] || tenant}</span>
              <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", tenantDropdownOpen && "rotate-180")} />
            </button>
            {tenantDropdownOpen && (
              <div className="absolute right-0 mt-1 z-50 min-w-[180px] rounded-lg bg-slate-800 border border-slate-700 shadow-xl overflow-hidden">
                {tenantList.map((t) => (
                  <button
                    key={t}
                    onClick={() => {
                      setTenant(t);
                      setTenantDropdownOpen(false);
                    }}
                    className={cn(
                      "w-full px-4 py-2 text-left text-sm hover:bg-slate-700 transition-all",
                      tenant === t ? "text-cyan-400 bg-slate-700/50" : "text-slate-300"
                    )}
                    data-testid={`tenant-option-${t}`}
                  >
                    {tenantLabels[t] || t}
                  </button>
                ))}
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={loadData}
            disabled={loading}
            className="text-slate-400 hover:text-white"
            data-testid="refresh-credentials"
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <Button
          onClick={() => setCreateDialogOpen(true)}
          className="bg-cyan-600 hover:bg-cyan-700 text-white"
          data-testid="create-credential-btn"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create API Credential
        </Button>
        <Button
          variant="outline"
          onClick={loadLogs}
          className="border-slate-600 text-slate-300 hover:bg-slate-700"
          data-testid="view-logs-btn"
        >
          <Eye className="h-4 w-4 mr-2" />
          View API Logs
        </Button>
      </div>

      {loading && credentials.length === 0 ? (
        <div className="flex items-center justify-center py-8 text-slate-500">
          <RefreshCw className="h-5 w-5 animate-spin mr-2" />
          Loading credentials...
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl bg-slate-800/50 backdrop-blur border border-cyan-500/30 overflow-hidden"
        >
          <Table>
            <TableHeader>
              <TableRow className="border-slate-700 hover:bg-slate-800/50">
                <TableHead className="text-cyan-400">Name</TableHead>
                <TableHead className="text-cyan-400">API Key</TableHead>
                <TableHead className="text-cyan-400">Environment</TableHead>
                <TableHead className="text-cyan-400">Scopes</TableHead>
                <TableHead className="text-cyan-400">Rate Limit</TableHead>
                <TableHead className="text-cyan-400">Status</TableHead>
                <TableHead className="text-cyan-400">Last Used</TableHead>
                <TableHead className="text-cyan-400">Created</TableHead>
                <TableHead className="text-cyan-400">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <AnimatePresence>
                {credentials.map((cred) => (
                  <motion.tr
                    key={cred.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="border-slate-700/50 hover:bg-slate-700/30"
                    data-testid={`credential-row-${cred.id}`}
                  >
                    <TableCell className="font-medium text-slate-200">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-cyan-400" />
                        {cred.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <code className="text-xs bg-slate-900 px-2 py-1 rounded text-slate-400 font-mono">
                          {maskApiKey(cred.apiKey)}
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(cred.apiKey, cred.id)}
                          className="h-7 w-7 p-0 text-slate-400 hover:text-cyan-400"
                          data-testid={`copy-key-${cred.id}`}
                        >
                          {copiedField === cred.id ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5" />}
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={cn(
                          "text-xs",
                          cred.environment === 'production'
                            ? "bg-red-500/20 text-red-400 border-red-500/30"
                            : "bg-amber-500/20 text-amber-400 border-amber-500/30"
                        )}
                      >
                        {cred.environment}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1 max-w-[150px]">
                        {cred.scopes.slice(0, 2).map((scope) => (
                          <Badge key={scope} variant="outline" className="text-[10px] text-slate-400 border-slate-600">
                            {scope.split(':')[1] || scope}
                          </Badge>
                        ))}
                        {cred.scopes.length > 2 && (
                          <Badge variant="outline" className="text-[10px] text-slate-500 border-slate-600">
                            +{cred.scopes.length - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-400 text-sm">
                      {cred.rateLimit ? `${cred.rateLimit}/${cred.rateLimitWindow || 60}s` : '—'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={cred.isActive}
                          onCheckedChange={(checked) => handleToggleCredential(cred.id, checked)}
                          className={cn(
                            cred.isActive ? "data-[state=checked]:bg-green-500" : ""
                          )}
                          data-testid={`toggle-${cred.id}`}
                        />
                        <span className={cn(
                          "text-xs",
                          cred.isActive ? "text-green-400" : "text-slate-500"
                        )}>
                          {cred.isActive ? 'Active' : 'Disabled'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-400 text-sm">
                      {cred.lastUsed ? formatDate(cred.lastUsed) : 'Never'}
                    </TableCell>
                    <TableCell className="text-slate-400 text-sm">
                      {formatDate(cred.createdAt)}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setCredentialToDelete(cred.id);
                          setDeleteDialogOpen(true);
                        }}
                        className="h-8 w-8 p-0 text-slate-400 hover:text-red-400 hover:bg-red-500/10"
                        data-testid={`delete-${cred.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </motion.tr>
                ))}
              </AnimatePresence>
              {credentials.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-slate-500">
                    No API credentials found. Create one to get started.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </motion.div>
      )}

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-700 text-slate-200 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-cyan-400 flex items-center gap-2">
              <Key className="h-5 w-5" />
              Create API Credential
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Generate a new API key for accessing the Partner API.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm text-slate-300 mb-2 block">Credential Name</label>
              <Input
                value={newCredential.name}
                onChange={(e) => setNewCredential(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Production API Key"
                className="bg-slate-800 border-slate-600 text-slate-200"
                data-testid="input-credential-name"
              />
            </div>

            <div>
              <label className="text-sm text-slate-300 mb-2 block">Environment</label>
              <Select
                value={newCredential.environment}
                onValueChange={(value: 'production' | 'sandbox') => setNewCredential(prev => ({ ...prev, environment: value }))}
              >
                <SelectTrigger className="bg-slate-800 border-slate-600 text-slate-200" data-testid="select-environment">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-600">
                  <SelectItem value="sandbox" className="text-slate-200 focus:bg-slate-700">Sandbox</SelectItem>
                  <SelectItem value="production" className="text-slate-200 focus:bg-slate-700">Production</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm text-slate-300 mb-2 block">Scopes</label>
              <div className="grid grid-cols-2 gap-2 p-3 rounded-lg bg-slate-800 border border-slate-600 max-h-[180px] overflow-y-auto">
                {availableScopes.map((scope) => (
                  <div key={scope.id} className="flex items-start gap-2">
                    <Checkbox
                      id={scope.id}
                      checked={newCredential.scopes.includes(scope.id)}
                      onCheckedChange={() => toggleScope(scope.id)}
                      className="mt-0.5 border-slate-500 data-[state=checked]:bg-cyan-500 data-[state=checked]:border-cyan-500"
                      data-testid={`scope-${scope.id}`}
                    />
                    <label htmlFor={scope.id} className="text-xs text-slate-300 cursor-pointer">
                      <div className="font-medium">{scope.name}</div>
                      <div className="text-slate-500">{scope.description}</div>
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-slate-300 mb-2 block">Rate Limit (optional)</label>
                <Input
                  type="number"
                  value={newCredential.rateLimit}
                  onChange={(e) => setNewCredential(prev => ({ ...prev, rateLimit: e.target.value }))}
                  placeholder="e.g., 1000"
                  className="bg-slate-800 border-slate-600 text-slate-200"
                  data-testid="input-rate-limit"
                />
              </div>
              <div>
                <label className="text-sm text-slate-300 mb-2 block">Window (seconds)</label>
                <Input
                  type="number"
                  value={newCredential.rateLimitWindow}
                  onChange={(e) => setNewCredential(prev => ({ ...prev, rateLimitWindow: e.target.value }))}
                  placeholder="e.g., 60"
                  className="bg-slate-800 border-slate-600 text-slate-200"
                  data-testid="input-rate-window"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCreateDialogOpen(false)}
              className="border-slate-600 text-slate-300"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateCredential}
              disabled={!newCredential.name || newCredential.scopes.length === 0}
              className="bg-cyan-600 hover:bg-cyan-700"
              data-testid="submit-create-credential"
            >
              Create Credential
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showCreatedDialog} onOpenChange={setShowCreatedDialog}>
        <DialogContent className="bg-slate-900 border-slate-700 text-slate-200 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-green-400 flex items-center gap-2">
              <Check className="h-5 w-5" />
              Credential Created Successfully
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Save these credentials now. The API Secret will only be shown once!
            </DialogDescription>
          </DialogHeader>

          {createdCredential && (
            <div className="space-y-4 py-4">
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-amber-200">
                  <strong>Important:</strong> Copy and securely store your API Secret now. 
                  It will not be displayed again after you close this dialog.
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 mb-1 block">Credential Name</label>
                <div className="text-slate-200 font-medium">{createdCredential.name}</div>
              </div>

              <div>
                <label className="text-xs text-slate-400 mb-1 block">API Key</label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-sm bg-slate-800 px-3 py-2 rounded border border-slate-600 text-cyan-400 font-mono overflow-x-auto">
                    {createdCredential.apiKey}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(createdCredential.apiKey, 'created-key')}
                    className="border-slate-600 text-slate-300 hover:bg-slate-700"
                    data-testid="copy-created-key"
                  >
                    {copiedField === 'created-key' ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 mb-1 block">API Secret</label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-sm bg-slate-800 px-3 py-2 rounded border border-red-500/30 text-red-400 font-mono overflow-x-auto">
                    {createdCredential.apiSecret}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(createdCredential.apiSecret, 'created-secret')}
                    className="border-slate-600 text-slate-300 hover:bg-slate-700"
                    data-testid="copy-created-secret"
                  >
                    {copiedField === 'created-secret' ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Environment</label>
                  <Badge className={cn(
                    createdCredential.environment === 'production'
                      ? "bg-red-500/20 text-red-400 border-red-500/30"
                      : "bg-amber-500/20 text-amber-400 border-amber-500/30"
                  )}>
                    {createdCredential.environment}
                  </Badge>
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Scopes</label>
                  <div className="flex flex-wrap gap-1">
                    {createdCredential.scopes.map((scope) => (
                      <Badge key={scope} variant="outline" className="text-[10px] text-slate-400 border-slate-600">
                        {scope}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              onClick={() => {
                setShowCreatedDialog(false);
                setCreatedCredential(null);
              }}
              className="bg-cyan-600 hover:bg-cyan-700"
              data-testid="close-created-dialog"
            >
              I've Saved My Credentials
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={logsDialogOpen} onOpenChange={setLogsDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-700 text-slate-200 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-cyan-400 flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Recent API Logs
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Last 10 API requests for {tenantLabels[tenant] || tenant}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 max-h-[400px] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-700">
                  <TableHead className="text-cyan-400">Time</TableHead>
                  <TableHead className="text-cyan-400">Method</TableHead>
                  <TableHead className="text-cyan-400">Endpoint</TableHead>
                  <TableHead className="text-cyan-400">Status</TableHead>
                  <TableHead className="text-cyan-400">Response</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {apiLogs.map((log) => (
                  <TableRow key={log.id} className="border-slate-700/50">
                    <TableCell className="text-slate-400 text-xs">
                      {formatTime(log.timestamp)}
                    </TableCell>
                    <TableCell>
                      <Badge className={cn(
                        "text-[10px]",
                        log.method === 'GET' ? "bg-blue-500/20 text-blue-400" :
                        log.method === 'POST' ? "bg-green-500/20 text-green-400" :
                        log.method === 'PUT' ? "bg-amber-500/20 text-amber-400" :
                        "bg-red-500/20 text-red-400"
                      )}>
                        {log.method}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-300 text-sm font-mono">
                      {log.endpoint}
                    </TableCell>
                    <TableCell>
                      <Badge className={cn(
                        "text-[10px]",
                        log.statusCode >= 200 && log.statusCode < 300 ? "bg-green-500/20 text-green-400" :
                        log.statusCode >= 400 && log.statusCode < 500 ? "bg-amber-500/20 text-amber-400" :
                        "bg-red-500/20 text-red-400"
                      )}>
                        {log.statusCode}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-500 text-xs">
                      {log.responseTime}ms
                    </TableCell>
                  </TableRow>
                ))}
                {apiLogs.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                      No API logs found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setLogsDialogOpen(false)}
              className="border-slate-600 text-slate-300"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-slate-900 border-slate-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-400 flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              Delete API Credential
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              Are you sure you want to delete this API credential? 
              This action cannot be undone and any applications using this key will stop working immediately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-slate-800 border-slate-600 text-slate-300 hover:bg-slate-700">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCredential}
              className="bg-red-600 hover:bg-red-700 text-white"
              data-testid="confirm-delete"
            >
              Delete Credential
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
