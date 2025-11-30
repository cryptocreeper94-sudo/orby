import { useStore } from "@/lib/mockData";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { Shield, UserCog, Monitor, LogOut, LayoutDashboard, Database, RefreshCw } from "lucide-react";

export default function DevDashboard() {
  const login = useStore((state) => state.login);
  const logout = useStore((state) => state.logout);
  const [, setLocation] = useLocation();

  const handleRoleSwitch = (pin: string, route: string) => {
    logout();
    login(pin);
    setLocation(route);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 p-8 font-mono">
      <header className="mb-8 flex justify-between items-center border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-3xl font-black text-green-400 flex items-center gap-3">
            <Database className="h-8 w-8" />
            DEV_GOD_MODE
          </h1>
          <p className="text-slate-400 mt-1">Rapid Role Switching & State Inspection</p>
        </div>
        <Button variant="outline" onClick={() => setLocation("/")} className="border-slate-700 hover:bg-slate-800 text-slate-300">
          <LogOut className="mr-2 h-4 w-4" /> Exit to Login
        </Button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Admin Role */}
        <Card className="bg-slate-900 border-slate-800 hover:border-blue-500 transition-colors cursor-pointer group" onClick={() => handleRoleSwitch('1234', '/admin')}>
          <CardHeader>
            <CardTitle className="text-blue-400 flex items-center gap-2 group-hover:text-blue-300">
              <Shield className="h-5 w-5" /> Admin / Manager
            </CardTitle>
            <CardDescription className="text-slate-500">Full system access, roster building, grid view</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-xs bg-slate-950 p-2 rounded border border-slate-800 text-slate-400">
              PIN: 1234
            </div>
          </CardContent>
        </Card>

        {/* Supervisor Role */}
        <Card className="bg-slate-900 border-slate-800 hover:border-amber-500 transition-colors cursor-pointer group" onClick={() => handleRoleSwitch('5678', '/supervisor')}>
          <CardHeader>
            <CardTitle className="text-amber-400 flex items-center gap-2 group-hover:text-amber-300">
              <UserCog className="h-5 w-5" /> Supervisor
            </CardTitle>
            <CardDescription className="text-slate-500">Stand management, inventory counts, compliance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-xs bg-slate-950 p-2 rounded border border-slate-800 text-slate-400">
              PIN: 5678
            </div>
          </CardContent>
        </Card>

        {/* IT Role */}
        <Card className="bg-slate-900 border-slate-800 hover:border-cyan-500 transition-colors cursor-pointer group" onClick={() => handleRoleSwitch('9999', '/it')}>
          <CardHeader>
            <CardTitle className="text-cyan-400 flex items-center gap-2 group-hover:text-cyan-300">
              <Monitor className="h-5 w-5" /> IT Support
            </CardTitle>
            <CardDescription className="text-slate-500">Asset tracking, ticket management, system status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-xs bg-slate-950 p-2 rounded border border-slate-800 text-slate-400">
              PIN: 9999
            </div>
          </CardContent>
        </Card>

        {/* Worker Role (Placeholder) */}
        <Card className="bg-slate-900 border-slate-800 opacity-50">
          <CardHeader>
            <CardTitle className="text-slate-400 flex items-center gap-2">
              <LayoutDashboard className="h-5 w-5" /> Worker (N/A)
            </CardTitle>
            <CardDescription className="text-slate-600">Standard worker view (Not yet implemented)</CardDescription>
          </CardHeader>
        </Card>
      </div>

      <div className="mt-8 p-6 bg-slate-900 rounded-lg border border-slate-800">
        <h3 className="text-lg font-bold text-slate-200 mb-4 flex items-center gap-2">
          <RefreshCw className="h-5 w-5 text-green-500" />
          Session Utilities
        </h3>
        <div className="flex gap-4">
          <Button variant="secondary" onClick={() => window.location.reload()}>
            Force Refresh App
          </Button>
          <Button variant="destructive" onClick={() => { localStorage.clear(); window.location.reload(); }}>
            Clear Local Storage & Reset
          </Button>
        </div>
      </div>
    </div>
  );
}