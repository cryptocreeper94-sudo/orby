import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  ZoomIn, ZoomOut, RotateCcw, Pencil, Eraser, Move, 
  MapPin, Navigation, X, Grid3X3, Users, ChevronDown
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ScrollArea } from '@/components/ui/scroll-area';
import stadiumMap from '@/assets/stadium-map.jpg';

type Tool = 'pan' | 'draw' | 'erase' | 'pin' | 'section';

interface MapPin {
  id: string;
  x: number;
  y: number;
  label: string;
}

export interface StadiumSection {
  id: string;
  name: string;
  zone: string;
  sectionLevel: string;
  floorLevel: string;
}

export interface PlacedSection {
  id: string;
  x: number;
  y: number;
  sectionId: string;
  name: string;
  zone: string;
  color: string;
  supervisorId?: string;
  supervisorName?: string;
}

interface Supervisor {
  id: string;
  name: string;
}

export const STADIUM_ZONES = {
  LOWER_EAST: { name: 'Level 2 East (100s)', color: '#3b82f6', sectionLevel: '100', floorLevel: '2' },
  LOWER_WEST: { name: 'Level 2 West (100s)', color: '#10b981', sectionLevel: '100', floorLevel: '2' },
  LOWER_NORTH: { name: 'Level 2 North (100s)', color: '#f59e0b', sectionLevel: '100', floorLevel: '2' },
  LOWER_SOUTH: { name: 'Level 2 South (100s)', color: '#ef4444', sectionLevel: '100', floorLevel: '2' },
  CLUB_EAST: { name: 'Club Level East (200s)', color: '#8b5cf6', sectionLevel: '200', floorLevel: 'Club' },
  CLUB_WEST: { name: 'Club Level West (200s)', color: '#ec4899', sectionLevel: '200', floorLevel: 'Club' },
  UPPER_EAST: { name: 'Level 7 East (300s)', color: '#06b6d4', sectionLevel: '300', floorLevel: '7' },
  UPPER_WEST: { name: 'Level 7 West (300s)', color: '#84cc16', sectionLevel: '300', floorLevel: '7' },
  UPPER_NORTH: { name: 'Level 7 North (300s)', color: '#f97316', sectionLevel: '300', floorLevel: '7' },
  UPPER_SOUTH: { name: 'Level 7 South (300s)', color: '#14b8a6', sectionLevel: '300', floorLevel: '7' },
  SUITES: { name: 'Suite Level', color: '#a855f7', sectionLevel: 'Suite', floorLevel: 'Suite' },
  FIELD_LEVEL: { name: 'Field Level', color: '#eab308', sectionLevel: 'Field', floorLevel: 'Field' },
};

export const STADIUM_SECTIONS: StadiumSection[] = [
  // Level 2 East - 100s sections (Floor Level 2)
  { id: '101', name: '101', zone: 'LOWER_EAST', sectionLevel: '100', floorLevel: '2' },
  { id: '102', name: '102', zone: 'LOWER_EAST', sectionLevel: '100', floorLevel: '2' },
  { id: '103', name: '103', zone: 'LOWER_EAST', sectionLevel: '100', floorLevel: '2' },
  { id: '104', name: '104', zone: 'LOWER_EAST', sectionLevel: '100', floorLevel: '2' },
  { id: '105', name: '105', zone: 'LOWER_EAST', sectionLevel: '100', floorLevel: '2' },
  { id: '106', name: '106', zone: 'LOWER_EAST', sectionLevel: '100', floorLevel: '2' },
  { id: '107', name: '107', zone: 'LOWER_EAST', sectionLevel: '100', floorLevel: '2' },
  { id: '108', name: '108', zone: 'LOWER_EAST', sectionLevel: '100', floorLevel: '2' },
  { id: '109', name: '109', zone: 'LOWER_EAST', sectionLevel: '100', floorLevel: '2' },
  { id: '110', name: '110', zone: 'LOWER_EAST', sectionLevel: '100', floorLevel: '2' },
  { id: '111', name: '111', zone: 'LOWER_EAST', sectionLevel: '100', floorLevel: '2' },
  { id: '112', name: '112', zone: 'LOWER_EAST', sectionLevel: '100', floorLevel: '2' },
  // Level 2 West - 100s sections (Floor Level 2)
  { id: '113', name: '113', zone: 'LOWER_WEST', sectionLevel: '100', floorLevel: '2' },
  { id: '114', name: '114', zone: 'LOWER_WEST', sectionLevel: '100', floorLevel: '2' },
  { id: '115', name: '115', zone: 'LOWER_WEST', sectionLevel: '100', floorLevel: '2' },
  { id: '116', name: '116', zone: 'LOWER_WEST', sectionLevel: '100', floorLevel: '2' },
  { id: '117', name: '117', zone: 'LOWER_WEST', sectionLevel: '100', floorLevel: '2' },
  { id: '118', name: '118', zone: 'LOWER_WEST', sectionLevel: '100', floorLevel: '2' },
  { id: '119', name: '119', zone: 'LOWER_WEST', sectionLevel: '100', floorLevel: '2' },
  { id: '120', name: '120', zone: 'LOWER_WEST', sectionLevel: '100', floorLevel: '2' },
  { id: '121', name: '121', zone: 'LOWER_WEST', sectionLevel: '100', floorLevel: '2' },
  { id: '122', name: '122', zone: 'LOWER_WEST', sectionLevel: '100', floorLevel: '2' },
  { id: '123', name: '123', zone: 'LOWER_WEST', sectionLevel: '100', floorLevel: '2' },
  { id: '124', name: '124', zone: 'LOWER_WEST', sectionLevel: '100', floorLevel: '2' },
  // Level 2 North - 100s sections (Floor Level 2)
  { id: '125', name: '125', zone: 'LOWER_NORTH', sectionLevel: '100', floorLevel: '2' },
  { id: '126', name: '126', zone: 'LOWER_NORTH', sectionLevel: '100', floorLevel: '2' },
  { id: '127', name: '127', zone: 'LOWER_NORTH', sectionLevel: '100', floorLevel: '2' },
  { id: '128', name: '128', zone: 'LOWER_NORTH', sectionLevel: '100', floorLevel: '2' },
  { id: '129', name: '129', zone: 'LOWER_NORTH', sectionLevel: '100', floorLevel: '2' },
  { id: '130', name: '130', zone: 'LOWER_NORTH', sectionLevel: '100', floorLevel: '2' },
  { id: '131', name: '131', zone: 'LOWER_NORTH', sectionLevel: '100', floorLevel: '2' },
  { id: '132', name: '132', zone: 'LOWER_NORTH', sectionLevel: '100', floorLevel: '2' },
  // Level 2 South - 100s sections (Floor Level 2)
  { id: '133', name: '133', zone: 'LOWER_SOUTH', sectionLevel: '100', floorLevel: '2' },
  { id: '134', name: '134', zone: 'LOWER_SOUTH', sectionLevel: '100', floorLevel: '2' },
  { id: '135', name: '135', zone: 'LOWER_SOUTH', sectionLevel: '100', floorLevel: '2' },
  { id: '136', name: '136', zone: 'LOWER_SOUTH', sectionLevel: '100', floorLevel: '2' },
  { id: '137', name: '137', zone: 'LOWER_SOUTH', sectionLevel: '100', floorLevel: '2' },
  { id: '138', name: '138', zone: 'LOWER_SOUTH', sectionLevel: '100', floorLevel: '2' },
  { id: '139', name: '139', zone: 'LOWER_SOUTH', sectionLevel: '100', floorLevel: '2' },
  { id: '140', name: '140', zone: 'LOWER_SOUTH', sectionLevel: '100', floorLevel: '2' },
  // Club Level East - 200s sections (Club Floor)
  { id: '201', name: '201', zone: 'CLUB_EAST', sectionLevel: '200', floorLevel: 'Club' },
  { id: '202', name: '202', zone: 'CLUB_EAST', sectionLevel: '200', floorLevel: 'Club' },
  { id: '203', name: '203', zone: 'CLUB_EAST', sectionLevel: '200', floorLevel: 'Club' },
  { id: '204', name: '204', zone: 'CLUB_EAST', sectionLevel: '200', floorLevel: 'Club' },
  { id: '205', name: '205', zone: 'CLUB_EAST', sectionLevel: '200', floorLevel: 'Club' },
  { id: '206', name: '206', zone: 'CLUB_EAST', sectionLevel: '200', floorLevel: 'Club' },
  { id: '207', name: '207', zone: 'CLUB_EAST', sectionLevel: '200', floorLevel: 'Club' },
  { id: '208', name: '208', zone: 'CLUB_EAST', sectionLevel: '200', floorLevel: 'Club' },
  { id: '209', name: '209', zone: 'CLUB_EAST', sectionLevel: '200', floorLevel: 'Club' },
  { id: '210', name: '210', zone: 'CLUB_EAST', sectionLevel: '200', floorLevel: 'Club' },
  { id: '211', name: '211', zone: 'CLUB_EAST', sectionLevel: '200', floorLevel: 'Club' },
  { id: '212', name: '212', zone: 'CLUB_EAST', sectionLevel: '200', floorLevel: 'Club' },
  // Club Level West - 200s sections (Club Floor)
  { id: '213', name: '213', zone: 'CLUB_WEST', sectionLevel: '200', floorLevel: 'Club' },
  { id: '214', name: '214', zone: 'CLUB_WEST', sectionLevel: '200', floorLevel: 'Club' },
  { id: '215', name: '215', zone: 'CLUB_WEST', sectionLevel: '200', floorLevel: 'Club' },
  { id: '216', name: '216', zone: 'CLUB_WEST', sectionLevel: '200', floorLevel: 'Club' },
  { id: '217', name: '217', zone: 'CLUB_WEST', sectionLevel: '200', floorLevel: 'Club' },
  { id: '218', name: '218', zone: 'CLUB_WEST', sectionLevel: '200', floorLevel: 'Club' },
  { id: '219', name: '219', zone: 'CLUB_WEST', sectionLevel: '200', floorLevel: 'Club' },
  { id: '220', name: '220', zone: 'CLUB_WEST', sectionLevel: '200', floorLevel: 'Club' },
  { id: '221', name: '221', zone: 'CLUB_WEST', sectionLevel: '200', floorLevel: 'Club' },
  { id: '222', name: '222', zone: 'CLUB_WEST', sectionLevel: '200', floorLevel: 'Club' },
  { id: '223', name: '223', zone: 'CLUB_WEST', sectionLevel: '200', floorLevel: 'Club' },
  { id: '224', name: '224', zone: 'CLUB_WEST', sectionLevel: '200', floorLevel: 'Club' },
  // Level 7 East - 300s sections (Floor Level 7)
  { id: '301', name: '301', zone: 'UPPER_EAST', sectionLevel: '300', floorLevel: '7' },
  { id: '302', name: '302', zone: 'UPPER_EAST', sectionLevel: '300', floorLevel: '7' },
  { id: '303', name: '303', zone: 'UPPER_EAST', sectionLevel: '300', floorLevel: '7' },
  { id: '304', name: '304', zone: 'UPPER_EAST', sectionLevel: '300', floorLevel: '7' },
  { id: '305', name: '305', zone: 'UPPER_EAST', sectionLevel: '300', floorLevel: '7' },
  { id: '306', name: '306', zone: 'UPPER_EAST', sectionLevel: '300', floorLevel: '7' },
  { id: '307', name: '307', zone: 'UPPER_EAST', sectionLevel: '300', floorLevel: '7' },
  { id: '308', name: '308', zone: 'UPPER_EAST', sectionLevel: '300', floorLevel: '7' },
  { id: '309', name: '309', zone: 'UPPER_EAST', sectionLevel: '300', floorLevel: '7' },
  { id: '310', name: '310', zone: 'UPPER_EAST', sectionLevel: '300', floorLevel: '7' },
  { id: '311', name: '311', zone: 'UPPER_EAST', sectionLevel: '300', floorLevel: '7' },
  { id: '312', name: '312', zone: 'UPPER_EAST', sectionLevel: '300', floorLevel: '7' },
  // Level 7 West - 300s sections (Floor Level 7)
  { id: '313', name: '313', zone: 'UPPER_WEST', sectionLevel: '300', floorLevel: '7' },
  { id: '314', name: '314', zone: 'UPPER_WEST', sectionLevel: '300', floorLevel: '7' },
  { id: '315', name: '315', zone: 'UPPER_WEST', sectionLevel: '300', floorLevel: '7' },
  { id: '316', name: '316', zone: 'UPPER_WEST', sectionLevel: '300', floorLevel: '7' },
  { id: '317', name: '317', zone: 'UPPER_WEST', sectionLevel: '300', floorLevel: '7' },
  { id: '318', name: '318', zone: 'UPPER_WEST', sectionLevel: '300', floorLevel: '7' },
  { id: '319', name: '319', zone: 'UPPER_WEST', sectionLevel: '300', floorLevel: '7' },
  { id: '320', name: '320', zone: 'UPPER_WEST', sectionLevel: '300', floorLevel: '7' },
  { id: '321', name: '321', zone: 'UPPER_WEST', sectionLevel: '300', floorLevel: '7' },
  { id: '322', name: '322', zone: 'UPPER_WEST', sectionLevel: '300', floorLevel: '7' },
  { id: '323', name: '323', zone: 'UPPER_WEST', sectionLevel: '300', floorLevel: '7' },
  { id: '324', name: '324', zone: 'UPPER_WEST', sectionLevel: '300', floorLevel: '7' },
  // Level 7 North - 300s sections (Floor Level 7)
  { id: '325', name: '325', zone: 'UPPER_NORTH', sectionLevel: '300', floorLevel: '7' },
  { id: '326', name: '326', zone: 'UPPER_NORTH', sectionLevel: '300', floorLevel: '7' },
  { id: '327', name: '327', zone: 'UPPER_NORTH', sectionLevel: '300', floorLevel: '7' },
  { id: '328', name: '328', zone: 'UPPER_NORTH', sectionLevel: '300', floorLevel: '7' },
  { id: '329', name: '329', zone: 'UPPER_NORTH', sectionLevel: '300', floorLevel: '7' },
  { id: '330', name: '330', zone: 'UPPER_NORTH', sectionLevel: '300', floorLevel: '7' },
  { id: '331', name: '331', zone: 'UPPER_NORTH', sectionLevel: '300', floorLevel: '7' },
  { id: '332', name: '332', zone: 'UPPER_NORTH', sectionLevel: '300', floorLevel: '7' },
  // Level 7 South - 300s sections (Floor Level 7)
  { id: '333', name: '333', zone: 'UPPER_SOUTH', sectionLevel: '300', floorLevel: '7' },
  { id: '334', name: '334', zone: 'UPPER_SOUTH', sectionLevel: '300', floorLevel: '7' },
  { id: '335', name: '335', zone: 'UPPER_SOUTH', sectionLevel: '300', floorLevel: '7' },
  { id: '336', name: '336', zone: 'UPPER_SOUTH', sectionLevel: '300', floorLevel: '7' },
  { id: '337', name: '337', zone: 'UPPER_SOUTH', sectionLevel: '300', floorLevel: '7' },
  { id: '338', name: '338', zone: 'UPPER_SOUTH', sectionLevel: '300', floorLevel: '7' },
  { id: '339', name: '339', zone: 'UPPER_SOUTH', sectionLevel: '300', floorLevel: '7' },
  { id: '340', name: '340', zone: 'UPPER_SOUTH', sectionLevel: '300', floorLevel: '7' },
  // Field Level
  { id: 'F1', name: 'Field 1', zone: 'FIELD_LEVEL', sectionLevel: 'Field', floorLevel: 'Field' },
  { id: 'F2', name: 'Field 2', zone: 'FIELD_LEVEL', sectionLevel: 'Field', floorLevel: 'Field' },
  { id: 'F3', name: 'Field 3', zone: 'FIELD_LEVEL', sectionLevel: 'Field', floorLevel: 'Field' },
  { id: 'F4', name: 'Field 4', zone: 'FIELD_LEVEL', sectionLevel: 'Field', floorLevel: 'Field' },
  // Suite Level
  { id: 'S1', name: 'Suite Level 1', zone: 'SUITES', sectionLevel: 'Suite', floorLevel: 'Suite' },
  { id: 'S2', name: 'Suite Level 2', zone: 'SUITES', sectionLevel: 'Suite', floorLevel: 'Suite' },
  { id: 'S3', name: 'Suite Level 3', zone: 'SUITES', sectionLevel: 'Suite', floorLevel: 'Suite' },
  { id: 'S4', name: 'Suite Level 4', zone: 'SUITES', sectionLevel: 'Suite', floorLevel: 'Suite' },
];

export function getSectionsByZone(zone: string): StadiumSection[] {
  return STADIUM_SECTIONS.filter(s => s.zone === zone);
}

export function getSectionsByFloorLevel(floorLevel: string): StadiumSection[] {
  return STADIUM_SECTIONS.filter(s => s.floorLevel === floorLevel);
}

export function getSectionsBySectionLevel(sectionLevel: string): StadiumSection[] {
  return STADIUM_SECTIONS.filter(s => s.sectionLevel === sectionLevel);
}

interface InteractiveMapProps {
  onClose?: () => void;
  showNavigation?: boolean;
  userLocation?: { lat: number; lng: number } | null;
  isManager?: boolean;
  supervisors?: Supervisor[];
  onSectionAssign?: (section: PlacedSection) => void;
  assignedSections?: PlacedSection[];
}

export function InteractiveMap({ 
  onClose, 
  showNavigation = false, 
  userLocation,
  isManager = false,
  supervisors = [],
  onSectionAssign,
  assignedSections = []
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
  const [sections, setSections] = useState<PlacedSection[]>(assignedSections);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [lastPos, setLastPos] = useState({ x: 0, y: 0 });
  
  const [showSectionDialog, setShowSectionDialog] = useState(false);
  const [pendingSection, setPendingSection] = useState<{ x: number; y: number } | null>(null);
  const [selectedStadiumSection, setSelectedStadiumSection] = useState<string>('');
  const [selectedSupervisor, setSelectedSupervisor] = useState('');
  const [expandedZone, setExpandedZone] = useState<string>('');

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
      setSelectedStadiumSection('');
      setSelectedSupervisor('');
      setExpandedZone('');
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
        <DialogContent className="sm:max-w-lg max-h-[90vh]" data-testid="section-dialog">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Grid3X3 className="h-5 w-5 text-purple-600" />
              Assign Section to Map
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Select Stadium Section</Label>
              <ScrollArea className="h-[250px] border rounded-lg p-2">
                <Accordion type="single" collapsible value={expandedZone} onValueChange={setExpandedZone}>
                  {Object.entries(STADIUM_ZONES).map(([zoneKey, zone]) => {
                    const zoneSections = getSectionsByZone(zoneKey);
                    const assignedInZone = sections.filter(s => s.zone === zoneKey).length;
                    return (
                      <AccordionItem key={zoneKey} value={zoneKey} className="border-b-0">
                        <AccordionTrigger className="py-2 px-2 hover:bg-gray-50 rounded text-sm">
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: zone.color }}
                            />
                            <span>{zone.name}</span>
                            <span className="text-xs text-muted-foreground">
                              ({zoneSections.length} sections)
                            </span>
                            {assignedInZone > 0 && (
                              <span className="text-xs bg-green-100 text-green-700 px-1.5 rounded">
                                {assignedInZone} assigned
                              </span>
                            )}
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="pt-1 pb-2">
                          <div className="grid grid-cols-4 gap-1 px-2">
                            {zoneSections.map(section => {
                              const isAssigned = sections.some(s => s.sectionId === section.id);
                              const isSelected = selectedStadiumSection === section.id;
                              return (
                                <button
                                  key={section.id}
                                  onClick={() => setSelectedStadiumSection(section.id)}
                                  disabled={isAssigned}
                                  className={`
                                    p-2 text-xs font-medium rounded border transition-all
                                    ${isAssigned 
                                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200' 
                                      : isSelected
                                        ? 'border-2 border-purple-500 bg-purple-50 text-purple-700'
                                        : 'hover:bg-gray-50 border-gray-200'
                                    }
                                  `}
                                  data-testid={`section-btn-${section.id}`}
                                >
                                  {section.name}
                                  {isAssigned && <span className="block text-[10px]">✓</span>}
                                </button>
                              );
                            })}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    );
                  })}
                </Accordion>
              </ScrollArea>
              {selectedStadiumSection && (() => {
                const section = STADIUM_SECTIONS.find(s => s.id === selectedStadiumSection);
                return section ? (
                  <div className="p-2 bg-purple-50 rounded-lg border border-purple-200">
                    <div className="text-sm text-purple-700 font-medium">
                      Selected: Section {section.name}
                    </div>
                    <div className="text-xs text-purple-600">
                      Floor Level: {section.floorLevel} | Section Level: {section.sectionLevel}s
                    </div>
                  </div>
                ) : null;
              })()}
            </div>
            <div className="space-y-2">
              <Label htmlFor="supervisor">Assign Supervisor (Optional)</Label>
              <Select value={selectedSupervisor} onValueChange={setSelectedSupervisor}>
                <SelectTrigger data-testid="select-supervisor">
                  <SelectValue placeholder="Select a supervisor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No supervisor</SelectItem>
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
            <Button variant="outline" onClick={() => {
              setShowSectionDialog(false);
              setSelectedStadiumSection('');
              setSelectedSupervisor('');
            }} data-testid="cancel-section">
              Cancel
            </Button>
            <Button 
              onClick={() => {
                if (pendingSection && selectedStadiumSection) {
                  const stadiumSection = STADIUM_SECTIONS.find(s => s.id === selectedStadiumSection);
                  const supervisor = supervisors.find(s => s.id === selectedSupervisor);
                  const zone = stadiumSection ? STADIUM_ZONES[stadiumSection.zone as keyof typeof STADIUM_ZONES] : null;
                  
                  if (stadiumSection && zone) {
                    const newSection: PlacedSection = {
                      id: Date.now().toString(),
                      x: pendingSection.x,
                      y: pendingSection.y,
                      sectionId: stadiumSection.id,
                      name: stadiumSection.name,
                      zone: stadiumSection.zone,
                      color: zone.color,
                      supervisorId: selectedSupervisor || undefined,
                      supervisorName: supervisor?.name
                    };
                    setSections([...sections, newSection]);
                    onSectionAssign?.(newSection);
                    setShowSectionDialog(false);
                    setSelectedStadiumSection('');
                    setSelectedSupervisor('');
                  }
                }
              }}
              disabled={!selectedStadiumSection}
              data-testid="confirm-section"
            >
              <Users className="h-4 w-4 mr-2" />
              Place Section
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
