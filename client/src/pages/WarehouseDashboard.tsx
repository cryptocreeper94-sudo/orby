import { useStore } from "@/lib/mockData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LogOut, MessageSquare, Package, Warehouse, ArrowRight, AlertTriangle, Map } from "lucide-react";
import { useLocation, Link } from "wouter";
import { useEffect, useState } from "react";
import { Notepad } from "@/components/Notepad";
import { InteractiveMap } from "@/components/InteractiveMap";

export default function WarehouseDashboard() {
  const logout = useStore((state) => state.logout);
  const [, setLocation] = useLocation();
  const currentUser = useStore((state) => state.currentUser);
  const stands = useStore((state) => state.stands);
  const messages = useStore((state) => state.messages);
  const fetchAll = useStore((state) => state.fetchAll);

  useEffect(() => {
    if (stands.length === 0) {
      fetchAll();
    }
  }, [stands.length, fetchAll]);

  const handleLogout = () => {
    logout();
    setLocation("/");
  };

  const recentMessages = messages.slice(0, 5);
  const urgentMessages = messages.filter(m => m.type === 'Urgent');
  const [showMap, setShowMap] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20">
      <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-amber-500 text-white px-4 shadow-md">
        <div className="flex items-center gap-2">
          <Warehouse className="h-6 w-6" />
          <span className="font-bold text-lg">Warehouse</span>
        </div>
        <div className="flex-1" />
        <Link href="/messages">
          <Button variant="ghost" size="icon" className="text-white hover:bg-amber-600 relative">
            <MessageSquare className="h-5 w-5" />
            {urgentMessages.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                {urgentMessages.length}
              </span>
            )}
          </Button>
        </Link>
        <Button variant="ghost" size="icon" onClick={handleLogout} className="text-white hover:bg-amber-600">
          <LogOut className="h-5 w-5" />
        </Button>
      </header>

      <main className="p-4 sm:px-6 space-y-6 max-w-4xl mx-auto mt-4">
        <div className="text-center py-4">
          <h1 className="text-2xl font-black text-slate-800 dark:text-slate-200">Welcome, {currentUser?.name}</h1>
          <p className="text-muted-foreground">Warehouse Operations Dashboard</p>
        </div>

        {urgentMessages.length > 0 && (
          <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold text-red-700 dark:text-red-400 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Urgent Messages ({urgentMessages.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {urgentMessages.slice(0, 3).map(msg => (
                <div key={msg.id} className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-red-200 text-sm">
                  {msg.content}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <Notepad storageKey="warehouse-notes" />

        {showMap && (
          <div className="fixed inset-0 z-50 bg-background">
            <InteractiveMap 
              onClose={() => setShowMap(false)} 
              showNavigation={true}
            />
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <Card className="border-none shadow-md hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setShowMap(true)}>
            <CardContent className="p-6 flex flex-col items-center justify-center text-center space-y-3">
              <div className="p-4 rounded-full bg-blue-100 dark:bg-blue-900/30">
                <Map className="h-8 w-8 text-blue-600" />
              </div>
              <div className="font-bold text-sm">Stadium Map</div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-md hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setLocation('/messages')}>
            <CardContent className="p-6 flex flex-col items-center justify-center text-center space-y-3">
              <div className="p-4 rounded-full bg-amber-100 dark:bg-amber-900/30">
                <MessageSquare className="h-8 w-8 text-amber-600" />
              </div>
              <div className="font-bold text-lg">Messages</div>
              <p className="text-xs text-muted-foreground">Communicate with supervisors</p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md">
            <CardContent className="p-6 flex flex-col items-center justify-center text-center space-y-3">
              <div className="p-4 rounded-full bg-slate-100 dark:bg-slate-800">
                <Package className="h-8 w-8 text-slate-600" />
              </div>
              <div className="font-bold text-lg">Inventory</div>
              <p className="text-xs text-muted-foreground">Coming soon</p>
            </CardContent>
          </Card>
        </div>

        <Card className="border-none shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center justify-between">
              Recent Messages
              <Link href="/messages">
                <Button variant="ghost" size="sm" className="text-xs">
                  View All <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentMessages.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No messages yet</p>
            ) : (
              recentMessages.map(msg => (
                <div key={msg.id} className="p-3 bg-white dark:bg-slate-900 rounded-lg border shadow-sm text-sm">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={msg.type === 'Urgent' ? 'destructive' : 'secondary'} className="text-[10px]">
                      {msg.type}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground">
                      {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    </span>
                  </div>
                  <p className="text-slate-700 dark:text-slate-300">{msg.content}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
