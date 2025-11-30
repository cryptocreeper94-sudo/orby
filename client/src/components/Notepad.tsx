import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { StickyNote, Save, Trash2, Clock } from 'lucide-react';

interface NotepadProps {
  storageKey?: string;
  title?: string;
  className?: string;
}

export function Notepad({ 
  storageKey = 'stadium-notepad', 
  title = 'Quick Notes',
  className = ''
}: NotepadProps) {
  const [notes, setNotes] = useState('');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setNotes(parsed.content || '');
        if (parsed.savedAt) {
          setLastSaved(new Date(parsed.savedAt));
        }
      } catch {
        setNotes(saved);
      }
    }
  }, [storageKey]);

  const handleSave = () => {
    setIsSaving(true);
    const now = new Date();
    localStorage.setItem(storageKey, JSON.stringify({
      content: notes,
      savedAt: now.toISOString()
    }));
    setLastSaved(now);
    setTimeout(() => setIsSaving(false), 500);
  };

  const handleClear = () => {
    if (confirm('Clear all notes?')) {
      setNotes('');
      localStorage.removeItem(storageKey);
      setLastSaved(null);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <Card className={`${className}`} data-testid="notepad">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <StickyNote className="h-4 w-4 text-yellow-500" />
            {title}
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={handleClear}
              className="h-7 px-2 text-red-500 hover:text-red-700"
              data-testid="clear-notes"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
            <Button 
              size="sm" 
              variant={isSaving ? 'default' : 'outline'}
              onClick={handleSave}
              className="h-7 px-2"
              data-testid="save-notes"
            >
              <Save className="h-3 w-3 mr-1" />
              {isSaving ? 'Saved!' : 'Save'}
            </Button>
          </div>
        </div>
        {lastSaved && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            Last saved: {formatTime(lastSaved)}
          </div>
        )}
      </CardHeader>
      <CardContent className="pt-0">
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Type your notes here... (auto-saved to this device)"
          className="min-h-[120px] resize-none text-sm"
          data-testid="notepad-textarea"
        />
      </CardContent>
    </Card>
  );
}
