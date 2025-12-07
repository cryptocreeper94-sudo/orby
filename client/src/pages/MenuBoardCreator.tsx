import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { MenuBoardEditor } from '@/components/MenuBoardEditor';
import { ChevronLeft, Plus, LayoutGrid, Trash2, Edit2, Copy, Download, Calendar, FileText, Settings, Info } from 'lucide-react';
import { useLocation } from 'wouter';
import { LayoutShell, BentoCard, CarouselRail, AccordionStack } from '@/components/ui/bento';

interface MenuBoard {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  isTemplate: boolean;
}

interface SlideData {
  id: string;
  title: string;
  backgroundColor: string;
  backgroundImage?: string;
  elements: any[];
}

export default function MenuBoardCreator() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [selectedBoard, setSelectedBoard] = useState<MenuBoard | null>(null);
  const [newBoardName, setNewBoardName] = useState('');
  const [newBoardDesc, setNewBoardDesc] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [slides, setSlides] = useState<SlideData[]>([]);

  const { data: menuBoards = [], isLoading } = useQuery({
    queryKey: ['/api/menu-boards'],
    queryFn: async () => {
      const res = await fetch('/api/menu-boards');
      if (!res.ok) throw new Error('Failed to fetch menu boards');
      return res.json();
    }
  });

  const createBoardMutation = useMutation({
    mutationFn: async (data: { name: string; description?: string }) => {
      const res = await fetch('/api/menu-boards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error('Failed to create menu board');
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/menu-boards'] });
      setSelectedBoard(data);
      setSlides([{ id: '1', title: 'Slide 1', backgroundColor: '#1a1a2e', elements: [] }]);
      setIsEditing(true);
      setIsCreateDialogOpen(false);
      setNewBoardName('');
      setNewBoardDesc('');
      toast({ title: 'Menu board created!' });
    }
  });

  const deleteBoardMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/menu-boards/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete menu board');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/menu-boards'] });
      toast({ title: 'Menu board deleted' });
    }
  });

  const saveBoardMutation = useMutation({
    mutationFn: async ({ id, slides }: { id: string; slides: SlideData[] }) => {
      const res = await fetch(`/api/menu-boards/${id}/slides`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slides })
      });
      if (!res.ok) throw new Error('Failed to save slides');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/menu-boards'] });
      toast({ title: 'Menu board saved!' });
    }
  });

  const loadBoard = async (board: MenuBoard) => {
    try {
      const res = await fetch(`/api/menu-boards/${board.id}/slides`);
      if (!res.ok) throw new Error('Failed to load slides');
      const data = await res.json();
      setSelectedBoard(board);
      setSlides(data.length > 0 ? data : [{ id: '1', title: 'Slide 1', backgroundColor: '#1a1a2e', elements: [] }]);
      setIsEditing(true);
    } catch (error) {
      toast({ title: 'Error loading menu board', variant: 'destructive' });
    }
  };

  const handleSave = (newSlides: SlideData[]) => {
    if (selectedBoard) {
      saveBoardMutation.mutate({ id: selectedBoard.id, slides: newSlides });
    }
  };

  const handleBack = () => {
    if (isEditing) {
      setIsEditing(false);
      setSelectedBoard(null);
      setSlides([]);
    } else {
      setLocation('/manager');
    }
  };

  if (isEditing && selectedBoard) {
    return (
      <MenuBoardEditor
        boardId={selectedBoard.id}
        boardName={selectedBoard.name}
        initialSlides={slides}
        onSave={handleSave}
        onBack={handleBack}
      />
    );
  }

  const metricsItems = [
    <div key="total" className="flex flex-col items-center p-3 bg-slate-800/60 rounded-lg min-w-[100px]" data-testid="metric-total-boards">
      <LayoutGrid className="h-5 w-5 text-cyan-400 mb-1" />
      <span className="text-xl font-bold text-white">{menuBoards.length}</span>
      <span className="text-[10px] text-white/50">Total Boards</span>
    </div>,
    <div key="templates" className="flex flex-col items-center p-3 bg-slate-800/60 rounded-lg min-w-[100px]" data-testid="metric-templates">
      <FileText className="h-5 w-5 text-purple-400 mb-1" />
      <span className="text-xl font-bold text-white">{menuBoards.filter((b: MenuBoard) => b.isTemplate).length}</span>
      <span className="text-[10px] text-white/50">Templates</span>
    </div>,
    <div key="recent" className="flex flex-col items-center p-3 bg-slate-800/60 rounded-lg min-w-[100px]" data-testid="metric-recent">
      <Calendar className="h-5 w-5 text-emerald-400 mb-1" />
      <span className="text-xl font-bold text-white">
        {menuBoards.filter((b: MenuBoard) => {
          const updated = new Date(b.updatedAt || b.createdAt);
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          return updated > weekAgo;
        }).length}
      </span>
      <span className="text-[10px] text-white/50">Updated This Week</span>
    </div>,
  ];

  const boardCarouselItems = menuBoards.map((board: MenuBoard) => (
    <div 
      key={board.id}
      className="flex flex-col p-3 bg-slate-800/60 rounded-lg min-w-[200px] max-w-[200px] border border-white/10 hover:border-cyan-400/50 transition-colors cursor-pointer group"
      onClick={() => loadBoard(board)}
      data-testid={`menu-board-card-${board.id}`}
    >
      <div className="aspect-video bg-slate-700 rounded-lg mb-2 flex items-center justify-center">
        <LayoutGrid className="h-6 w-6 text-slate-500" />
      </div>
      <div className="flex-1">
        <h3 className="text-sm font-medium text-white truncate" data-testid={`board-name-${board.id}`}>{board.name}</h3>
        {board.description && (
          <p className="text-[10px] text-white/50 truncate">{board.description}</p>
        )}
      </div>
      <div className="flex items-center justify-between mt-2">
        <span className="text-[10px] text-white/40">
          {new Date(board.updatedAt || board.createdAt).toLocaleDateString()}
        </span>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6 text-white/60 hover:text-cyan-400"
            onClick={(e) => {
              e.stopPropagation();
              loadBoard(board);
            }}
            data-testid={`edit-board-${board.id}`}
          >
            <Edit2 className="h-3 w-3" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6 text-white/60 hover:text-red-400"
            onClick={(e) => {
              e.stopPropagation();
              if (confirm('Delete this menu board?')) {
                deleteBoardMutation.mutate(board.id);
              }
            }}
            data-testid={`delete-board-${board.id}`}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  ));

  const settingsAccordionItems = [
    {
      title: 'Tips for Creating Great Menus',
      content: (
        <ul className="space-y-1 text-sm" data-testid="tips-content">
          <li>• Use high contrast colors for better readability from a distance</li>
          <li>• Keep text large - aim for 32px or larger for menu items</li>
          <li>• Use the "Export All" button to download slides for your USB drive</li>
          <li>• Create multiple slides to rotate through different categories</li>
        </ul>
      )
    },
    {
      title: 'Quick Actions',
      content: (
        <div className="flex flex-wrap gap-2" data-testid="quick-actions-content">
          <Button
            size="sm"
            variant="outline"
            className="border-white/20 text-slate-300"
            onClick={() => setIsCreateDialogOpen(true)}
            data-testid="quick-create-board"
          >
            <Plus className="h-3 w-3 mr-1" /> New Board
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950" data-testid="menu-board-creator-page">
      <div className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur-xl border-b border-white/10 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => setLocation('/manager')} data-testid="back-to-manager" className="text-slate-300 hover:text-slate-100">
              <ChevronLeft className="h-4 w-4 mr-1" /> Back
            </Button>
            <div>
              <h1 className="text-lg font-bold text-slate-200 flex items-center gap-2" data-testid="text-page-title">
                <LayoutGrid className="h-5 w-5 text-cyan-400" />
                Menu Board Creator
              </h1>
              <p className="text-xs text-slate-400">Create and manage digital menu displays</p>
            </div>
          </div>
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-cyan-600 hover:bg-cyan-700" data-testid="create-menu-board">
                <Plus className="h-4 w-4 mr-1" /> New Board
              </Button>
            </DialogTrigger>
            <DialogContent data-testid="dialog-create-board">
              <DialogHeader>
                <DialogTitle>Create New Menu Board</DialogTitle>
                <DialogDescription>
                  Give your menu board a name and optional description
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="boardName">Name</Label>
                  <Input
                    id="boardName"
                    value={newBoardName}
                    onChange={(e) => setNewBoardName(e.target.value)}
                    placeholder="e.g., Main Concourse Menu"
                    data-testid="new-board-name"
                  />
                </div>
                <div>
                  <Label htmlFor="boardDesc">Description (optional)</Label>
                  <Input
                    id="boardDesc"
                    value={newBoardDesc}
                    onChange={(e) => setNewBoardDesc(e.target.value)}
                    placeholder="e.g., Hot dogs, nachos, and drinks"
                    data-testid="new-board-desc"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)} data-testid="cancel-create-board">
                  Cancel
                </Button>
                <Button
                  onClick={() => createBoardMutation.mutate({ name: newBoardName, description: newBoardDesc })}
                  disabled={!newBoardName.trim() || createBoardMutation.isPending}
                  data-testid="confirm-create-board"
                >
                  Create
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="p-3">
        <LayoutShell className="gap-3">
          <BentoCard span={12} className="p-2" title="Menu Board Metrics" data-testid="bento-card-metrics">
            <CarouselRail items={metricsItems} data-testid="carousel-metrics" />
          </BentoCard>

          <BentoCard span={12} className="p-2" title="Your Menu Boards" data-testid="bento-card-boards">
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-cyan-400" />
              </div>
            ) : menuBoards.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8" data-testid="empty-boards-state">
                <LayoutGrid className="h-10 w-10 text-slate-500 mb-3" />
                <h3 className="text-sm font-medium text-slate-300 mb-1">No Menu Boards Yet</h3>
                <p className="text-xs text-slate-400 text-center mb-3">
                  Create your first menu board to display on your digital screens
                </p>
                <Button onClick={() => setIsCreateDialogOpen(true)} data-testid="create-first-board" className="bg-cyan-600 hover:bg-cyan-700">
                  <Plus className="h-4 w-4 mr-1" /> Create Your First Board
                </Button>
              </div>
            ) : (
              <CarouselRail items={boardCarouselItems} data-testid="carousel-boards" />
            )}
          </BentoCard>

          <BentoCard span={12} className="p-2" title="Settings & Tips" data-testid="bento-card-settings">
            <AccordionStack 
              items={settingsAccordionItems} 
              defaultOpen={[0]} 
              data-testid="accordion-settings"
            />
          </BentoCard>
        </LayoutShell>
      </div>
    </div>
  );
}
