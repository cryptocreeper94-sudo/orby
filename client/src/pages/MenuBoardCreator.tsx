import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { MenuBoardEditor } from '@/components/MenuBoardEditor';
import { ChevronLeft, Plus, LayoutGrid, Trash2, Edit2, Copy, Download, Calendar } from 'lucide-react';
import { useLocation } from 'wouter';

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => setLocation('/manager')} data-testid="back-to-manager">
              <ChevronLeft className="h-4 w-4 mr-1" /> Back to Dashboard
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <LayoutGrid className="h-6 w-6 text-blue-600" />
                Menu Board Creator
              </h1>
              <p className="text-gray-500 text-sm">Create and manage digital menu displays</p>
            </div>
          </div>
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700" data-testid="create-menu-board">
                <Plus className="h-4 w-4 mr-1" /> New Menu Board
              </Button>
            </DialogTrigger>
            <DialogContent>
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
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
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

        {/* Menu Boards Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : menuBoards.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <LayoutGrid className="h-12 w-12 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-600 mb-2">No Menu Boards Yet</h3>
              <p className="text-gray-400 text-center mb-4">
                Create your first menu board to display on your digital screens
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)} data-testid="create-first-board">
                <Plus className="h-4 w-4 mr-1" /> Create Your First Menu Board
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {menuBoards.map((board: MenuBoard) => (
              <Card 
                key={board.id} 
                className="hover:shadow-lg transition-shadow cursor-pointer group"
                data-testid={`menu-board-card-${board.id}`}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{board.name}</CardTitle>
                      {board.description && (
                        <CardDescription className="mt-1">{board.description}</CardDescription>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm('Delete this menu board?')) {
                          deleteBoardMutation.mutate(board.id);
                        }
                      }}
                      data-testid={`delete-board-${board.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div 
                    className="aspect-video bg-gray-800 rounded-lg mb-3 flex items-center justify-center"
                    onClick={() => loadBoard(board)}
                  >
                    <LayoutGrid className="h-8 w-8 text-gray-500" />
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(board.updatedAt || board.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => loadBoard(board)}
                      data-testid={`edit-board-${board.id}`}
                    >
                      <Edit2 className="h-3 w-3 mr-1" /> Edit
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Tips Section */}
        <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-100">
          <h3 className="font-medium text-blue-800 mb-2">Tips for Creating Great Menus</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Use high contrast colors for better readability from a distance</li>
            <li>• Keep text large - aim for 32px or larger for menu items</li>
            <li>• Use the "Export All" button to download slides for your USB drive</li>
            <li>• Create multiple slides to rotate through different categories</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
