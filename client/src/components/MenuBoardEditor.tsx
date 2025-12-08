import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Plus, Trash2, Type, DollarSign, Image, Minus, 
  Download, Save, ChevronLeft, ChevronRight, Copy,
  AlignLeft, AlignCenter, AlignRight, Bold, Eye, Palette,
  GripVertical, Maximize2, LayoutGrid
} from 'lucide-react';
import type { MenuElement } from '@shared/schema';

interface SlideData {
  id: string;
  title: string;
  backgroundColor: string;
  backgroundImage?: string;
  elements: MenuElement[];
}

interface MenuBoardEditorProps {
  boardId?: string;
  boardName: string;
  initialSlides?: SlideData[];
  onSave: (slides: SlideData[]) => void;
  onBack: () => void;
}

const COLORS = [
  '#1a1a2e', '#16213e', '#0f3460', '#533483', 
  '#e94560', '#f39c12', '#27ae60', '#2980b9',
  '#8e44ad', '#c0392b', '#1abc9c', '#34495e',
  '#2c3e50', '#7f8c8d', '#ecf0f1', '#ffffff'
];

const TEMPLATES = [
  { 
    name: 'Classic Dark', 
    bg: '#1a1a2e', 
    textColor: '#ffffff',
    accentColor: '#f39c12'
  },
  { 
    name: 'Stadium Blue', 
    bg: '#0f3460', 
    textColor: '#ffffff',
    accentColor: '#1abc9c'
  },
  { 
    name: 'Modern Red', 
    bg: '#c0392b', 
    textColor: '#ffffff',
    accentColor: '#f39c12'
  },
  { 
    name: 'Clean White', 
    bg: '#ffffff', 
    textColor: '#2c3e50',
    accentColor: '#e94560'
  },
  { 
    name: 'Concession Gold', 
    bg: '#2c3e50', 
    textColor: '#f39c12',
    accentColor: '#ffffff'
  },
];

const generateId = () => Math.random().toString(36).substring(2, 11);

export function MenuBoardEditor({ boardId, boardName, initialSlides, onSave, onBack }: MenuBoardEditorProps) {
  const [slides, setSlides] = useState<SlideData[]>(initialSlides || [
    {
      id: generateId(),
      title: 'Slide 1',
      backgroundColor: '#1a1a2e',
      elements: []
    }
  ]);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [previewSlideIndex, setPreviewSlideIndex] = useState(0);
  const slideRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const currentSlide = slides[currentSlideIndex];
  const selectedElement = currentSlide?.elements.find(el => el.id === selectedElementId);

  const updateSlide = (updates: Partial<SlideData>) => {
    setSlides(prev => prev.map((slide, i) => 
      i === currentSlideIndex ? { ...slide, ...updates } : slide
    ));
  };

  const addSlide = () => {
    const newSlide: SlideData = {
      id: generateId(),
      title: `Slide ${slides.length + 1}`,
      backgroundColor: currentSlide?.backgroundColor || '#1a1a2e',
      elements: []
    };
    setSlides([...slides, newSlide]);
    setCurrentSlideIndex(slides.length);
  };

  const duplicateSlide = () => {
    const duplicated: SlideData = {
      ...currentSlide,
      id: generateId(),
      title: `${currentSlide.title} (Copy)`,
      elements: currentSlide.elements.map(el => ({ ...el, id: generateId() }))
    };
    setSlides([...slides.slice(0, currentSlideIndex + 1), duplicated, ...slides.slice(currentSlideIndex + 1)]);
    setCurrentSlideIndex(currentSlideIndex + 1);
  };

  const deleteSlide = () => {
    if (slides.length === 1) return;
    setSlides(slides.filter((_, i) => i !== currentSlideIndex));
    setCurrentSlideIndex(Math.max(0, currentSlideIndex - 1));
  };

  const addElement = (type: MenuElement['type']) => {
    const newElement: MenuElement = {
      id: generateId(),
      type,
      x: 50,
      y: 50,
      width: type === 'divider' ? 400 : 200,
      height: type === 'divider' ? 4 : 50,
      content: type === 'text' ? 'New Text' : type === 'price' ? '$0.00' : '',
      fontSize: type === 'text' ? 32 : 28,
      fontWeight: 'bold',
      color: '#ffffff',
      textAlign: 'center'
    };
    updateSlide({ elements: [...currentSlide.elements, newElement] });
    setSelectedElementId(newElement.id);
  };

  const updateElement = (elementId: string, updates: Partial<MenuElement>) => {
    updateSlide({
      elements: currentSlide.elements.map(el =>
        el.id === elementId ? { ...el, ...updates } : el
      )
    });
  };

  const deleteElement = (elementId: string) => {
    updateSlide({
      elements: currentSlide.elements.filter(el => el.id !== elementId)
    });
    setSelectedElementId(null);
  };

  const handleMouseDown = (e: React.MouseEvent, elementId: string) => {
    if (isPreviewMode) return;
    e.stopPropagation();
    setSelectedElementId(elementId);
    const element = currentSlide.elements.find(el => el.id === elementId);
    if (element && slideRef.current) {
      const rect = slideRef.current.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left - element.x,
        y: e.clientY - rect.top - element.y
      });
      setIsDragging(true);
    }
  };

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !selectedElementId || !slideRef.current) return;
    const rect = slideRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width - 100, e.clientX - rect.left - dragOffset.x));
    const y = Math.max(0, Math.min(rect.height - 30, e.clientY - rect.top - dragOffset.y));
    updateElement(selectedElementId, { x, y });
  }, [isDragging, selectedElementId, dragOffset]);

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const applyTemplate = (template: typeof TEMPLATES[0]) => {
    updateSlide({ backgroundColor: template.bg });
    updateSlide({
      elements: currentSlide.elements.map(el => ({
        ...el,
        color: el.type === 'price' ? template.accentColor : template.textColor
      }))
    });
  };

  const exportSlideAsImage = async (slideIndex: number) => {
    const slide = slides[slideIndex];
    const canvas = document.createElement('canvas');
    canvas.width = 1920;
    canvas.height = 1080;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = slide.backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (const element of slide.elements) {
      const scaleX = 1920 / 640;
      const scaleY = 1080 / 360;
      const x = element.x * scaleX;
      const y = element.y * scaleY;
      const fontSize = (element.fontSize || 24) * scaleX;

      ctx.fillStyle = element.color || '#ffffff';
      ctx.font = `${element.fontWeight || 'bold'} ${fontSize}px Arial`;
      ctx.textAlign = element.textAlign || 'center';
      
      if (element.type === 'divider') {
        ctx.fillRect(x, y, element.width * scaleX, element.height * scaleY);
      } else if (element.content) {
        const textX = element.textAlign === 'left' ? x : 
                      element.textAlign === 'right' ? x + (element.width * scaleX) : 
                      x + (element.width * scaleX) / 2;
        ctx.fillText(element.content, textX, y + fontSize);
      }
    }

    const link = document.createElement('a');
    link.download = `${boardName}-slide-${slideIndex + 1}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const exportAllSlides = async () => {
    for (let i = 0; i < slides.length; i++) {
      await exportSlideAsImage(i);
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  };

  if (isPreviewMode) {
    const previewSlide = slides[previewSlideIndex];
    return (
      <div className="fixed inset-0 bg-black z-50 flex flex-col">
        <div 
          className="flex-1 relative overflow-hidden"
          style={{ backgroundColor: previewSlide.backgroundColor }}
        >
          {previewSlide.elements.map((element) => (
            <div
              key={element.id}
              className="absolute"
              style={{
                left: `${(element.x / 640) * 100}%`,
                top: `${(element.y / 360) * 100}%`,
                width: `${(element.width / 640) * 100}%`,
                height: element.type === 'divider' ? element.height : 'auto',
                backgroundColor: element.type === 'divider' ? element.color : 'transparent',
                color: element.color,
                fontSize: `${(element.fontSize || 24) * 2}px`,
                fontWeight: element.fontWeight,
                textAlign: element.textAlign,
              }}
            >
              {element.type !== 'divider' && element.content}
            </div>
          ))}
        </div>
        <div className="bg-gray-900 p-4 flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => setPreviewSlideIndex(Math.max(0, previewSlideIndex - 1))}
            disabled={previewSlideIndex === 0}
            data-testid="preview-prev"
          >
            <ChevronLeft className="h-4 w-4" /> Previous
          </Button>
          <div className="text-white">
            Slide {previewSlideIndex + 1} of {slides.length}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setPreviewSlideIndex(Math.min(slides.length - 1, previewSlideIndex + 1))}
              disabled={previewSlideIndex === slides.length - 1}
              data-testid="preview-next"
            >
              Next <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="destructive"
              onClick={() => setIsPreviewMode(false)}
              data-testid="exit-preview"
            >
              Exit Preview
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-slate-900">
      {/* Toolbar */}
      <div className="bg-slate-800 border-b border-slate-700 p-3 flex items-center gap-3 flex-wrap">
        <Button variant="ghost" size="sm" onClick={onBack} data-testid="menu-editor-back">
          <ChevronLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        <div className="h-6 w-px bg-slate-600" />
        <span className="font-semibold text-slate-300">{boardName}</span>
        <div className="flex-1" />
        
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setIsPreviewMode(true)}
          data-testid="preview-mode"
        >
          <Eye className="h-4 w-4 mr-1" /> Preview
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => exportSlideAsImage(currentSlideIndex)}
          data-testid="export-slide"
        >
          <Download className="h-4 w-4 mr-1" /> Export Slide
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={exportAllSlides}
          data-testid="export-all"
        >
          <Download className="h-4 w-4 mr-1" /> Export All
        </Button>
        <Button 
          variant="default" 
          size="sm" 
          onClick={() => onSave(slides)}
          className="bg-blue-600 hover:bg-blue-700"
          data-testid="save-board"
        >
          <Save className="h-4 w-4 mr-1" /> Save
        </Button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Slides */}
        <div className="w-48 bg-gray-800 p-3 flex flex-col gap-2 overflow-auto">
          <div className="text-white text-sm font-semibold mb-2">Slides</div>
          <ScrollArea className="flex-1">
            {slides.map((slide, index) => (
              <div
                key={slide.id}
                className={`relative p-2 mb-2 rounded cursor-pointer border-2 transition-all ${
                  index === currentSlideIndex 
                    ? 'border-blue-500' 
                    : 'border-transparent hover:border-gray-600'
                }`}
                onClick={() => {
                  setCurrentSlideIndex(index);
                  setSelectedElementId(null);
                }}
                data-testid={`slide-thumb-${index}`}
              >
                <div 
                  className="aspect-video rounded overflow-hidden"
                  style={{ backgroundColor: slide.backgroundColor }}
                >
                  <div className="text-[6px] text-white p-1 truncate">
                    {slide.title}
                  </div>
                </div>
                <div className="text-gray-400 text-xs mt-1 truncate">
                  {slide.title}
                </div>
              </div>
            ))}
          </ScrollArea>
          <div className="flex gap-1 mt-2">
            <Button 
              size="sm" 
              variant="secondary" 
              className="flex-1"
              onClick={addSlide}
              data-testid="add-slide"
            >
              <Plus className="h-3 w-3" />
            </Button>
            <Button 
              size="sm" 
              variant="secondary" 
              className="flex-1"
              onClick={duplicateSlide}
              data-testid="duplicate-slide"
            >
              <Copy className="h-3 w-3" />
            </Button>
            <Button 
              size="sm" 
              variant="destructive" 
              className="flex-1"
              onClick={deleteSlide}
              disabled={slides.length === 1}
              data-testid="delete-slide"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Center - Canvas */}
        <div className="flex-1 p-6 flex flex-col items-center justify-center overflow-auto">
          <div 
            ref={slideRef}
            className="relative shadow-2xl rounded-lg overflow-hidden cursor-crosshair"
            style={{ 
              width: 640, 
              height: 360,
              backgroundColor: currentSlide?.backgroundColor || '#1a1a2e'
            }}
            onClick={() => setSelectedElementId(null)}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            data-testid="slide-canvas"
          >
            {currentSlide?.elements.map((element) => (
              <div
                key={element.id}
                className={`absolute cursor-move select-none ${
                  selectedElementId === element.id 
                    ? 'ring-2 ring-blue-500 ring-offset-1' 
                    : 'hover:ring-1 hover:ring-blue-300'
                }`}
                style={{
                  left: element.x,
                  top: element.y,
                  width: element.width,
                  height: element.type === 'divider' ? element.height : 'auto',
                  backgroundColor: element.type === 'divider' ? element.color : 'transparent',
                  color: element.color,
                  fontSize: element.fontSize,
                  fontWeight: element.fontWeight,
                  textAlign: element.textAlign,
                  padding: element.type === 'divider' ? 0 : '4px 8px',
                }}
                onMouseDown={(e) => handleMouseDown(e, element.id)}
                data-testid={`element-${element.id}`}
              >
                {element.type !== 'divider' && element.content}
              </div>
            ))}
          </div>
          
          {/* Add Element Buttons */}
          <div className="mt-4 flex gap-2">
            <Button 
              variant="secondary" 
              size="sm"
              onClick={() => addElement('text')}
              data-testid="add-text"
            >
              <Type className="h-4 w-4 mr-1" /> Add Text
            </Button>
            <Button 
              variant="secondary" 
              size="sm"
              onClick={() => addElement('price')}
              data-testid="add-price"
            >
              <DollarSign className="h-4 w-4 mr-1" /> Add Price
            </Button>
            <Button 
              variant="secondary" 
              size="sm"
              onClick={() => addElement('divider')}
              data-testid="add-divider"
            >
              <Minus className="h-4 w-4 mr-1" /> Add Line
            </Button>
          </div>
        </div>

        {/* Right Panel - Properties */}
        <div className="w-72 bg-slate-800 border-l border-slate-700 p-4 overflow-auto">
          <Tabs defaultValue="slide" className="w-full">
            <TabsList className="w-full">
              <TabsTrigger value="slide" className="flex-1">Slide</TabsTrigger>
              <TabsTrigger value="element" className="flex-1" disabled={!selectedElement}>
                Element
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="slide" className="space-y-4">
              <div>
                <Label className="text-sm">Slide Title</Label>
                <Input
                  value={currentSlide?.title || ''}
                  onChange={(e) => updateSlide({ title: e.target.value })}
                  placeholder="Slide title"
                  data-testid="slide-title-input"
                />
              </div>
              
              <div>
                <Label className="text-sm">Background Color</Label>
                <div className="grid grid-cols-4 gap-2 mt-2">
                  {COLORS.map((color) => (
                    <button
                      key={color}
                      className={`w-8 h-8 rounded border-2 ${
                        currentSlide?.backgroundColor === color 
                          ? 'border-blue-500 ring-2 ring-blue-500/30' 
                          : 'border-slate-600'
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => updateSlide({ backgroundColor: color })}
                      data-testid={`bg-color-${color}`}
                    />
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-sm">Quick Templates</Label>
                <div className="space-y-2 mt-2">
                  {TEMPLATES.map((template) => (
                    <button
                      key={template.name}
                      className="w-full p-2 rounded border border-slate-600 text-left text-sm hover:bg-slate-700 flex items-center gap-2"
                      onClick={() => applyTemplate(template)}
                      data-testid={`template-${template.name}`}
                    >
                      <div 
                        className="w-6 h-6 rounded"
                        style={{ backgroundColor: template.bg }}
                      />
                      <span>{template.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="element" className="space-y-4">
              {selectedElement && (
                <>
                  <div>
                    <Label className="text-sm">Content</Label>
                    <Input
                      value={selectedElement.content || ''}
                      onChange={(e) => updateElement(selectedElement.id, { content: e.target.value })}
                      placeholder="Enter text..."
                      disabled={selectedElement.type === 'divider'}
                      data-testid="element-content-input"
                    />
                  </div>

                  <div>
                    <Label className="text-sm">Font Size: {selectedElement.fontSize}px</Label>
                    <Slider
                      value={[selectedElement.fontSize || 24]}
                      min={12}
                      max={72}
                      step={2}
                      onValueChange={([v]) => updateElement(selectedElement.id, { fontSize: v })}
                      className="mt-2"
                      data-testid="font-size-slider"
                    />
                  </div>

                  <div>
                    <Label className="text-sm">Font Weight</Label>
                    <Select
                      value={selectedElement.fontWeight || 'normal'}
                      onValueChange={(v) => updateElement(selectedElement.id, { fontWeight: v })}
                    >
                      <SelectTrigger data-testid="font-weight-select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="bold">Bold</SelectItem>
                        <SelectItem value="lighter">Light</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-sm">Text Align</Label>
                    <div className="flex gap-1 mt-2">
                      <Button
                        variant={selectedElement.textAlign === 'left' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => updateElement(selectedElement.id, { textAlign: 'left' })}
                        data-testid="align-left"
                      >
                        <AlignLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant={selectedElement.textAlign === 'center' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => updateElement(selectedElement.id, { textAlign: 'center' })}
                        data-testid="align-center"
                      >
                        <AlignCenter className="h-4 w-4" />
                      </Button>
                      <Button
                        variant={selectedElement.textAlign === 'right' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => updateElement(selectedElement.id, { textAlign: 'right' })}
                        data-testid="align-right"
                      >
                        <AlignRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm">Color</Label>
                    <div className="grid grid-cols-4 gap-2 mt-2">
                      {COLORS.map((color) => (
                        <button
                          key={color}
                          className={`w-8 h-8 rounded border-2 ${
                            selectedElement.color === color 
                              ? 'border-blue-500 ring-2 ring-blue-500/30' 
                              : 'border-slate-600'
                          }`}
                          style={{ backgroundColor: color }}
                          onClick={() => updateElement(selectedElement.id, { color })}
                          data-testid={`text-color-${color}`}
                        />
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm">Width: {selectedElement.width}px</Label>
                    <Slider
                      value={[selectedElement.width]}
                      min={50}
                      max={600}
                      step={10}
                      onValueChange={([v]) => updateElement(selectedElement.id, { width: v })}
                      className="mt-2"
                      data-testid="element-width-slider"
                    />
                  </div>

                  {selectedElement.type === 'divider' && (
                    <div>
                      <Label className="text-sm">Height: {selectedElement.height}px</Label>
                      <Slider
                        value={[selectedElement.height]}
                        min={2}
                        max={20}
                        step={1}
                        onValueChange={([v]) => updateElement(selectedElement.id, { height: v })}
                        className="mt-2"
                        data-testid="element-height-slider"
                      />
                    </div>
                  )}

                  <Button
                    variant="destructive"
                    size="sm"
                    className="w-full"
                    onClick={() => deleteElement(selectedElement.id)}
                    data-testid="delete-element"
                  >
                    <Trash2 className="h-4 w-4 mr-1" /> Delete Element
                  </Button>
                </>
              )}
              {!selectedElement && (
                <div className="text-gray-500 text-sm text-center py-8">
                  Select an element to edit its properties
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
