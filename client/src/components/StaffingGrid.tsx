import { useStore, SECTIONS, Stand } from "@/lib/mockData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ScanLine, CalendarDays, Upload, Printer } from "lucide-react";

export function StaffingGrid() {
  const stands = useStore((state) => state.stands);

  const getStatusColor = (status: Stand['status']) => {
    switch (status) {
      case 'Closed': return 'bg-red-500/20 text-red-700 dark:text-red-400 border-red-500/50';
      case 'Needs Power': return 'bg-cyan-500/20 text-cyan-700 dark:text-cyan-400 border-cyan-500/50';
      case 'Hot Spot': return 'bg-pink-500/20 text-pink-700 dark:text-pink-400 border-pink-500/50';
      case 'Spare': return 'bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/50';
      default: return 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700';
    }
  };

  // Group stands by section
  const standsBySection = SECTIONS.reduce((acc, section) => {
    acc[section] = stands.filter(s => s.section === section);
    return acc;
  }, {} as Record<string, Stand[]>);

  return (
    <div className="space-y-6">
      {/* Grid Header / Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-900 p-4 rounded-lg border shadow-sm">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-primary" />
            Titans v Jaguars
            <Badge variant="outline" className="ml-2 font-mono">25-11-30</Badge>
          </h2>
          <p className="text-sm text-muted-foreground">Staffing Grid & Stand Status</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Printer className="mr-2 h-4 w-4" />
            Print Grid
          </Button>
          <Button className="bg-primary text-primary-foreground shadow-md hover:bg-primary/90" size="sm">
            <ScanLine className="mr-2 h-4 w-4" />
            Scan Grid Sheet
          </Button>
        </div>
      </div>

      {SECTIONS.map(section => {
        const sectionStands = standsBySection[section];
        if (!sectionStands?.length) return null;

        return (
          <Card key={section} className="border-none shadow-sm overflow-hidden">
            <CardHeader className="bg-amber-400/90 text-amber-950 py-2 px-4">
              <CardTitle className="text-sm font-bold uppercase tracking-wider flex justify-between items-center">
                {section}
                <Badge variant="secondary" className="bg-amber-100 text-amber-900 hover:bg-amber-200 border-none">
                  {sectionStands.length} Stands
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="w-full whitespace-nowrap">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="w-[50px] font-bold text-slate-900 dark:text-slate-100 sticky left-0 bg-white dark:bg-slate-900 z-10">ID</TableHead>
                      <TableHead className="w-[200px] font-bold text-slate-900 dark:text-slate-100 sticky left-[50px] bg-white dark:bg-slate-900 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">Stand Name</TableHead>
                      {/* Mock Columns for POS IDs based on images */}
                      <TableHead className="text-center w-[60px] bg-slate-50 dark:bg-slate-800/50">POS 1</TableHead>
                      <TableHead className="text-center w-[60px] bg-slate-50 dark:bg-slate-800/50">POS 2</TableHead>
                      <TableHead className="text-center w-[60px] bg-slate-50 dark:bg-slate-800/50">POS 3</TableHead>
                      <TableHead className="text-center w-[60px] bg-slate-50 dark:bg-slate-800/50">POS 4</TableHead>
                      <TableHead className="text-center w-[60px] bg-slate-50 dark:bg-slate-800/50">Rear</TableHead>
                      <TableHead className="text-center w-[100px]">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sectionStands.map((stand) => (
                      <TableRow key={stand.id} className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 ${stand.status === 'Closed' ? 'opacity-60 bg-red-50/50 dark:bg-red-900/10' : ''}`}>
                        <TableCell className="font-mono font-medium sticky left-0 bg-white dark:bg-slate-900 z-10 border-r">{stand.id}</TableCell>
                        <TableCell className="font-medium sticky left-[50px] bg-white dark:bg-slate-900 z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                          {stand.name.split(' - ')[1] || stand.name}
                        </TableCell>
                        
                        {/* Render Staffing/POS Data */}
                        {/* This is a simplification. Real app would map distinct POS IDs dynamically */}
                        <TableCell className="text-center border-r border-dashed p-1">
                           <div className="bg-slate-100 dark:bg-slate-800 rounded py-1 text-xs font-mono">2</div>
                        </TableCell>
                        <TableCell className="text-center border-r border-dashed p-1">
                           <div className="bg-slate-100 dark:bg-slate-800 rounded py-1 text-xs font-mono">1</div>
                        </TableCell>
                         <TableCell className="text-center border-r border-dashed p-1">
                           {/* Empty cell example */}
                        </TableCell>
                        <TableCell className="text-center border-r border-dashed p-1">
                           {/* Empty cell example */}
                        </TableCell>
                         <TableCell className="text-center border-r border-dashed p-1">
                           <div className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 rounded py-1 text-[10px] font-bold uppercase">Mgr</div>
                        </TableCell>

                        <TableCell className="text-center p-2">
                          <span className={`inline-flex items-center px-2 py-1 rounded text-[10px] font-bold uppercase border ${getStatusColor(stand.status)}`}>
                            {stand.status}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
