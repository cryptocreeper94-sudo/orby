import { useStore } from "@/lib/mockData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LogOut, Package, Users, ClipboardCheck, FileBarChart, Menu, MessageSquare } from "lucide-react";
import { useLocation, Link } from "wouter";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StaffingGrid } from "@/components/StaffingGrid";

export default function AdminDashboard() {
  const logout = useStore((state) => state.logout);
  const [, setLocation] = useLocation();
  const stands = useStore((state) => state.stands);

  const handleLogout = () => {
    logout();
    setLocation("/");
  };

  const stats = [
    { label: "Open Stands", value: stands.filter(s => s.status === 'Open').length, icon: Package, color: "text-green-600" },
    { label: "Staff Active", value: 42, icon: Users, color: "text-blue-600" },
    { label: "Pending Audits", value: 3, icon: ClipboardCheck, color: "text-orange-600" },
    { label: "Total Revenue", value: "$12,450", icon: FileBarChart, color: "text-purple-600" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20">
      {/* Mobile Header */}
      <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 shadow-sm sm:shadow-none">
        <Sheet>
          <SheetTrigger asChild>
            <Button size="icon" variant="outline" className="sm:hidden">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="sm:max-w-xs">
            <nav className="grid gap-6 text-lg font-medium">
              <div className="flex items-center gap-2 text-lg font-semibold">
                <Package className="h-6 w-6" />
                <span className="sr-only">StadiumOps</span>
              </div>
              <a href="#" className="flex items-center gap-4 px-2.5 text-foreground hover:text-foreground">
                <LayoutDashboard className="h-5 w-5" />
                Dashboard
              </a>
              <a href="#" className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground">
                <Users className="h-5 w-5" />
                Roster
              </a>
              <Link href="/messages" className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground">
                <MessageSquare className="h-5 w-5" />
                Messages
              </Link>
            </nav>
          </SheetContent>
        </Sheet>
        <div className="flex-1 font-semibold text-lg flex items-center justify-between">
          Admin Control
          <Link href="/messages">
             <Button variant="ghost" size="icon" className="sm:hidden text-muted-foreground">
               <MessageSquare className="h-5 w-5" />
             </Button>
          </Link>
        </div>
        <Button variant="ghost" size="icon" onClick={handleLogout} className="text-muted-foreground">
          <LogOut className="h-5 w-5" />
        </Button>
      </header>

      <main className="p-4 sm:px-6 sm:py-0 space-y-6 max-w-6xl mx-auto mt-4">
        
        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {stats.map((stat, i) => (
            <Card key={i} className="overflow-hidden border-none shadow-sm">
              <CardContent className="p-4 flex flex-col items-center justify-center text-center space-y-2">
                <stat.icon className={`h-8 w-8 ${stat.color} opacity-80`} />
                <div className="text-2xl font-bold tracking-tighter">{stat.value}</div>
                <div className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">{stat.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="grid" className="w-full">
          <TabsList className="w-full justify-start border-b rounded-none bg-transparent h-auto p-0 mb-4 space-x-6">
            <TabsTrigger 
              value="grid" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2 font-bold"
            >
              Staffing Grid
            </TabsTrigger>
            <TabsTrigger 
              value="list" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2 font-bold"
            >
              List View
            </TabsTrigger>
             <TabsTrigger 
              value="reports" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2 font-bold"
            >
              Reports
            </TabsTrigger>
          </TabsList>

          <TabsContent value="grid">
            <StaffingGrid />
          </TabsContent>

          <TabsContent value="list">
            <Card className="border-none shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-semibold">Live Stand Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-2">
                  {stands.map(stand => (
                    <div key={stand.id} className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 rounded-lg border shadow-sm">
                      <div className="flex flex-col">
                        <span className="font-bold text-sm">{stand.name}</span>
                        <span className="text-xs text-muted-foreground">Supervisor: {stand.supervisorId ? 'Assigned' : 'Unassigned'}</span>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${stand.status === 'Open' ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-red-100 text-red-700 border border-red-200'}`}>
                        {stand.status}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports">
             <div className="grid grid-cols-2 gap-4">
               <Link href="/roster-builder">
                  <Button variant="outline" className="w-full h-24 flex flex-col items-center justify-center gap-2 border-2 border-dashed border-slate-300 hover:border-primary hover:bg-slate-50 cursor-pointer">
                    <Users className="h-6 w-6" />
                    Roster & Group Builder
                  </Button>
               </Link>
               <Button variant="outline" className="h-24 flex flex-col items-center justify-center gap-2 border-2 border-dashed border-slate-300 hover:border-primary hover:bg-slate-50">
                  <FileBarChart className="h-6 w-6" />
                  Export Inventory CSV
               </Button>
            </div>
          </TabsContent>
        </Tabs>

      </main>
    </div>
  );
}

import { LayoutDashboard } from "lucide-react";
