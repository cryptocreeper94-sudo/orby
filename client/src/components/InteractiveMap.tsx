import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  ZoomIn, ZoomOut, RotateCcw, Pencil, Eraser, Move, 
  MapPin, Navigation, X, Grid3X3, Users
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import stadiumMap from '@/assets/stadium-map.jpg';

type Tool = 'pan' | 'draw' | 'erase' | 'pin' | 'section';

interface MapPin {
  id: string;
  x: number;
  y: number;
  label: string;
}

interface Section {
  id: string;
  x: number;
  y: number;
  name: string;
  color: string;
  supervisorId?: string;
  supervisorName?: string;
}

interface Supervisor {
  id: string;
  name: string;
}

interface InteractiveMapProps {
  onClose?: () => void;
  showNavigation?: boolean;
  userLocation?: { lat: number; lng: number } | null;
  isManager?: boolean;
  supervisors?: Supervisor[];
  onSectionAssign?: (section: Section) => void;
}

export function InteractiveMap({ 
  onClose, 
  showNavigation = false, 
  userLocation,
  isManager = false,
  supervisors = [],
  onSectionAssign
}: InteractiveMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [tool, setTool] = useState<Tool>('pan');
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawColor, setDrawColor] = useState('#ff0000');
  const [drawSize, setDrawSize] = useState(3);
  const [paths, setPaths] = useState<{ points: { x: number; y: number }[]; color: string; size: number }[]>([]);
  const [currentPath, setCurrentPath] = useState<{ x: number; y: number }[]>([]);
  const [pins, setPins] = useState<MapPin[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [lastPos, setLastPos] = useState({ x: 0, y: 0 });
  
  const [showSectionDialog, setShowSectionDialog] = useState(false);
  const [pendingSection, setPendingSection] = useState<{ x: number; y: number } | null>(null);
  const [sectionName, setSectionName] = useState('');
  const [selectedSupervisor, setSelectedSupervisor] = useState('');

  const sectionColors = [
    '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', 
    '#ec4899', '#06b6d4', '#84cc16'
  ];

  useEffect(() => {
    const img = new Image();
    img.src = stadiumMap;
    img.onload = () => {
      setImage(img);
    };
  }, []);

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || !image) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(offset.x, offset.y);
    ctx.scale(scale, scale);
    ctx.drawImage(image, 0, 0);

    paths.forEach(path => {
      if (path.points.length < 2) return;
      ctx.beginPath();
      ctx.strokeStyle = path.color;
      ctx.lineWidth = path.size / scale;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.moveTo(path.points[0].x, path.points[0].y);
      path.points.forEach(point => ctx.lineTo(point.x, point.y));
      ctx.stroke();
    });

    if (currentPath.length > 1) {
      ctx.beginPath();
      ctx.strokeStyle = drawColor;
      ctx.lineWidth = drawSize / scale;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.moveTo(currentPath[0].x, currentPath[0].y);
      currentPath.forEach(point => ctx.lineTo(point.x, point.y));
      ctx.stroke();
    }

    pins.forEach(pin => {
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(pin.x, pin.y, 10 / scale, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = `${12 / scale}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(pin.label, pin.x, pin.y + 25 / scale);
    });

    sections.forEach(section => {
      ctx.fillStyle = section.color + 'cc';
      ctx.beginPath();
      ctx.arc(section.x, section.y, 25 / scale, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2 / scale;
      ctx.stroke();
      
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${10 / scale}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(section.name, section.x, section.y);
      
      if (section.supervisorName) {
        ctx.fillStyle = section.color;
        ctx.font = `${9 / scale}px sans-serif`;
        ctx.fillText(section.supervisorName, section.x, section.y + 35 / scale);
      }
    });

    ctx.restore();
  }, [image, scale, offset, paths, currentPath, pins, sections, drawColor, drawSize]);

  useEffect(() => {
    redraw();
  }, [redraw]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const resizeCanvas = () => {
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
      redraw();
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [redraw]);

  const getCanvasPoint = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    return {
      x: (clientX - rect.left - offset.x) / scale,
      y: (clientY - rect.top - offset.y) / scale
    };
  };

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const point = getCanvasPoint(e);
    
    if (tool === 'pan') {
      setIsDragging(true);
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      setLastPos({ x: clientX, y: clientY });
    } else if (tool === 'draw') {
      setIsDrawing(true);
      setCurrentPath([point]);
    } else if (tool === 'pin') {
      const label = prompt('Enter pin label:') || 'Pin';
      setPins([...pins, { id: Date.now().toString(), x: point.x, y: point.y, label }]);
    } else if (tool === 'section') {
      setPendingSection(point);
      setSectionName('');
      setSelectedSupervisor('');
      setShowSectionDialog(true);
    } else if (tool === 'erase') {
      const threshold = 20 / scale;
      setPaths(paths.filter(path => 
        !path.points.some(p => 
          Math.abs(p.x - point.x) < threshold && Math.abs(p.y - point.y) < threshold
        )
      ));
      setPins(pins.filter(pin => 
        Math.abs(pin.x - point.x) > threshold || Math.abs(pin.y - point.y) > threshold
      ));
      setSections(sections.filter(section => 
        Math.abs(section.x - point.x) > threshold || Math.abs(section.y - point.y) > threshold
      ));
    }
  };

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    
    if (isDragging && tool === 'pan') {
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      setOffset({
        x: offset.x + (clientX - lastPos.x),
        y: offset.y + (clientY - lastPos.y)
      });
      setLastPos({ x: clientX, y: clientY });
    } else if (isDrawing && tool === 'draw') {
      const point = getCanvasPoint(e);
      setCurrentPath([...currentPath, point]);
    }
  };

  const handleMouseUp = () => {
    if (isDrawing && currentPath.length > 1) {
      setPaths([...paths, { points: currentPath, color: drawColor, size: drawSize }]);
    }
    setIsDrawing(false);
    setIsDragging(false);
    setCurrentPath([]);
  };

  const handleZoom = (delta: number) => {
    setScale(Math.max(0.5, Math.min(3, scale + delta)));
  };

  const handleReset = () => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
    setPaths([]);
    setPins([]);
  };

  const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#000000', '#ffffff'];

  return (
    <Card className="h-full flex flex-col" data-testid="interactive-map">
      <CardHeader className="pb-2 flex-shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Stadium Map
          </CardTitle>
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose} data-testid="close-map">
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        
        <div className="flex flex-wrap gap-1 mt-2">
          <Button
            size="sm"
            variant={tool === 'pan' ? 'default' : 'outline'}
            onClick={() => setTool('pan')}
            data-testid="tool-pan"
          >
            <Move className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant={tool === 'draw' ? 'default' : 'outline'}
            onClick={() => setTool('draw')}
            data-testid="tool-draw"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant={tool === 'pin' ? 'default' : 'outline'}
            onClick={() => setTool('pin')}
            data-testid="tool-pin"
          >
            <MapPin className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant={tool === 'erase' ? 'default' : 'outline'}
            onClick={() => setTool('erase')}
            data-testid="tool-erase"
          >
            <Eraser className="h-4 w-4" />
          </Button>
          {isManager && (
            <Button
              size="sm"
              variant={tool === 'section' ? 'default' : 'outline'}
              onClick={() => setTool('section')}
              data-testid="tool-section"
              className="bg-purple-100 hover:bg-purple-200 text-purple-700"
            >
              <Grid3X3 className="h-4 w-4 mr-1" />
              Section
            </Button>
          )}
          <div className="border-l mx-1" />
          <Button size="sm" variant="outline" onClick={() => handleZoom(0.2)} data-testid="zoom-in">
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="outline" onClick={() => handleZoom(-0.2)} data-testid="zoom-out">
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="outline" onClick={handleReset} data-testid="reset-map">
            <RotateCcw className="h-4 w-4" />
          </Button>
          {showNavigation && (
            <>
              <div className="border-l mx-1" />
              <Button size="sm" variant="outline" className="text-green-600" data-testid="navigation">
                <Navigation className="h-4 w-4 mr-1" />
                Navigate
              </Button>
            </>
          )}
        </div>

        {tool === 'draw' && (
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs text-muted-foreground">Color:</span>
            <div className="flex gap-1">
              {colors.map(color => (
                <button
                  key={color}
                  className={`w-5 h-5 rounded border-2 ${drawColor === color ? 'border-primary' : 'border-transparent'}`}
                  style={{ backgroundColor: color }}
                  onClick={() => setDrawColor(color)}
                  data-testid={`color-${color}`}
                />
              ))}
            </div>
            <span className="text-xs text-muted-foreground ml-2">Size:</span>
            <input
              type="range"
              min="1"
              max="10"
              value={drawSize}
              onChange={(e) => setDrawSize(Number(e.target.value))}
              className="w-16"
              data-testid="draw-size"
            />
          </div>
        )}
      </CardHeader>

      <CardContent className="flex-1 p-2 overflow-hidden" ref={containerRef}>
        <canvas
          ref={canvasRef}
          className="w-full h-full cursor-crosshair touch-none rounded-lg bg-gray-100"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleMouseDown}
          onTouchMove={handleMouseMove}
          onTouchEnd={handleMouseUp}
          data-testid="map-canvas"
        />
      </CardContent>

      <Dialog open={showSectionDialog} onOpenChange={setShowSectionDialog}>
        <DialogContent className="sm:max-w-md" data-testid="section-dialog">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Grid3X3 className="h-5 w-5 text-purple-600" />
              Assign Section
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="section-name">Section Name</Label>
              <Input
                id="section-name"
                placeholder="e.g., 2 East, 7 West"
                value={sectionName}
                onChange={(e) => setSectionName(e.target.value)}
                data-testid="input-section-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="supervisor">Assign Supervisor</Label>
              <Select value={selectedSupervisor} onValueChange={setSelectedSupervisor}>
                <SelectTrigger data-testid="select-supervisor">
                  <SelectValue placeholder="Select a supervisor" />
                </SelectTrigger>
                <SelectContent>
                  {supervisors.map(sup => (
                    <SelectItem key={sup.id} value={sup.id} data-testid={`supervisor-${sup.id}`}>
                      {sup.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSectionDialog(false)} data-testid="cancel-section">
              Cancel
            </Button>
            <Button 
              onClick={() => {
                if (pendingSection && sectionName) {
                  const supervisor = supervisors.find(s => s.id === selectedSupervisor);
                  const newSection: Section = {
                    id: Date.now().toString(),
                    x: pendingSection.x,
                    y: pendingSection.y,
                    name: sectionName,
                    color: sectionColors[sections.length % sectionColors.length],
                    supervisorId: selectedSupervisor || undefined,
                    supervisorName: supervisor?.name
                  };
                  setSections([...sections, newSection]);
                  onSectionAssign?.(newSection);
                  setShowSectionDialog(false);
                }
              }}
              disabled={!sectionName}
              data-testid="confirm-section"
            >
              <Users className="h-4 w-4 mr-2" />
              Assign Section
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
