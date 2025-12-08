import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Navigation, MapPin, ArrowRight, Building2, 
  ChevronRight, Footprints, Clock, AlertCircle,
  ArrowUp, DoorOpen, X
} from 'lucide-react';
import { STADIUM_SECTIONS, STADIUM_ZONES, StadiumSection } from './InteractiveMap';

interface WalkingDirectionsProps {
  userLocation?: { lat: number; lng: number } | null;
  onClose?: () => void;
  defaultDestination?: string;
}

interface DirectionStep {
  instruction: string;
  detail?: string;
  icon: 'walk' | 'elevator' | 'stairs' | 'door' | 'destination' | 'turn';
  distance?: string;
  floorChange?: boolean;
}

interface Elevator {
  id: string;
  name: string;
  location: string;
  floors: string[];
  nearestSections: string[];
}

const STADIUM_ELEVATORS: Elevator[] = [
  { 
    id: 'E1', 
    name: 'East Elevator Bank A', 
    location: 'Near Gate 1', 
    floors: ['2', '7', 'Club', 'Suite'],
    nearestSections: ['101', '102', '103', '104', '105', '301', '302', '303', '304', '305']
  },
  { 
    id: 'E2', 
    name: 'East Elevator Bank B', 
    location: 'Near Gate 3', 
    floors: ['2', '7', 'Club', 'Suite'],
    nearestSections: ['106', '107', '108', '109', '110', '306', '307', '308', '309', '310']
  },
  { 
    id: 'E3', 
    name: 'East Elevator Bank C', 
    location: 'Near Gate 5', 
    floors: ['2', '7', 'Club', 'Suite'],
    nearestSections: ['111', '112', '311', '312']
  },
  { 
    id: 'E4', 
    name: 'West Elevator Bank A', 
    location: 'Near Gate 2', 
    floors: ['2', '7', 'Club', 'Suite'],
    nearestSections: ['113', '114', '115', '116', '117', '313', '314', '315', '316', '317']
  },
  { 
    id: 'E5', 
    name: 'West Elevator Bank B', 
    location: 'Near Gate 4', 
    floors: ['2', '7', 'Club', 'Suite'],
    nearestSections: ['118', '119', '120', '121', '122', '318', '319', '320', '321', '322']
  },
  { 
    id: 'E6', 
    name: 'West Elevator Bank C', 
    location: 'Near Gate 6', 
    floors: ['2', '7', 'Club', 'Suite'],
    nearestSections: ['123', '124', '323', '324']
  },
  { 
    id: 'E7', 
    name: 'North Elevator Bank', 
    location: 'Near North Plaza', 
    floors: ['2', '7', 'Club'],
    nearestSections: ['125', '126', '127', '128', '129', '130', '131', '132', '325', '326', '327', '328', '329', '330', '331', '332']
  },
  { 
    id: 'E8', 
    name: 'South Elevator Bank', 
    location: 'Near South Plaza', 
    floors: ['2', '7', 'Club'],
    nearestSections: ['133', '134', '135', '136', '137', '138', '139', '140', '333', '334', '335', '336', '337', '338', '339', '340']
  },
];

function getFloorFromSectionId(sectionId: string): string {
  const section = STADIUM_SECTIONS.find(s => s.id === sectionId);
  return section?.floorLevel || '2';
}

const STADIUM_GATES = [
  { id: 'G1', name: 'Gate 1', location: 'East Side', floor: '2', nearestSections: ['101', '102', '103'] },
  { id: 'G2', name: 'Gate 2', location: 'West Side', floor: '2', nearestSections: ['113', '114', '115'] },
  { id: 'G3', name: 'Gate 3', location: 'East Side', floor: '2', nearestSections: ['106', '107', '108'] },
  { id: 'G4', name: 'Gate 4', location: 'West Side', floor: '2', nearestSections: ['118', '119', '120'] },
  { id: 'G5', name: 'Gate 5', location: 'East Side', floor: '2', nearestSections: ['110', '111', '112'] },
  { id: 'G6', name: 'Gate 6', location: 'West Side', floor: '2', nearestSections: ['122', '123', '124'] },
  { id: 'GN', name: 'North Gate', location: 'North Plaza', floor: '2', nearestSections: ['125', '126', '127', '128'] },
  { id: 'GS', name: 'South Gate', location: 'South Plaza', floor: '2', nearestSections: ['133', '134', '135', '136'] },
];

function findNearestElevator(sectionId: string): Elevator {
  const elevator = STADIUM_ELEVATORS.find(e => e.nearestSections.includes(sectionId));
  return elevator || STADIUM_ELEVATORS[0];
}

function getFloorFromSection(section: StadiumSection): string {
  return section.floorLevel;
}

function generateDirections(destination: StadiumSection, currentFloor: string = '2'): DirectionStep[] {
  const steps: DirectionStep[] = [];
  const destFloor = getFloorFromSection(destination);
  const zone = STADIUM_ZONES[destination.zone as keyof typeof STADIUM_ZONES];
  
  steps.push({
    instruction: 'Start from your current location',
    detail: `You are currently on Level ${currentFloor}`,
    icon: 'walk'
  });

  if (destFloor !== currentFloor) {
    const nearestElevator = findNearestElevator(destination.id);
    
    steps.push({
      instruction: `Head to ${nearestElevator.name}`,
      detail: `Located ${nearestElevator.location}`,
      icon: 'walk',
      distance: '~150 ft'
    });

    steps.push({
      instruction: 'Take the elevator',
      detail: destFloor === '7' 
        ? 'Press Level 7 for the 300s sections' 
        : destFloor === 'Club' 
          ? 'Press Club Level for 200s sections'
          : `Press ${destFloor} for your destination`,
      icon: 'elevator',
      floorChange: true
    });

    steps.push({
      instruction: `Exit elevator on Level ${destFloor}`,
      detail: destFloor === '7' 
        ? 'Welcome to the 300s level (Upper Deck)' 
        : destFloor === 'Club'
          ? 'Welcome to Club Level'
          : `You are now on Level ${destFloor}`,
      icon: 'door'
    });
  }

  const sectionNumber = parseInt(destination.id);
  let direction = '';
  
  if (destination.zone.includes('EAST')) {
    direction = 'right (East side)';
  } else if (destination.zone.includes('WEST')) {
    direction = 'left (West side)';
  } else if (destination.zone.includes('NORTH')) {
    direction = 'toward the North end';
  } else if (destination.zone.includes('SOUTH')) {
    direction = 'toward the South end';
  }

  if (direction) {
    steps.push({
      instruction: `Turn ${direction}`,
      detail: 'Follow the concourse signs',
      icon: 'turn',
      distance: '~100 ft'
    });
  }

  steps.push({
    instruction: `Continue along the concourse`,
    detail: `Look for Section ${destination.name} markers`,
    icon: 'walk',
    distance: '~200 ft'
  });

  steps.push({
    instruction: `Arrive at Section ${destination.name}`,
    detail: `${zone?.name || destination.zone} - Level ${destFloor}`,
    icon: 'destination'
  });

  return steps;
}

function getEstimatedTime(steps: DirectionStep[]): string {
  const hasElevator = steps.some(s => s.icon === 'elevator');
  const baseTime = steps.length * 0.5;
  const elevatorTime = hasElevator ? 2 : 0;
  const total = Math.ceil(baseTime + elevatorTime);
  return `${total}-${total + 2} min`;
}

export function WalkingDirections({ userLocation, onClose, defaultDestination }: WalkingDirectionsProps) {
  const [selectedSection, setSelectedSection] = useState<string>(defaultDestination || '');
  const [directions, setDirections] = useState<DirectionStep[]>([]);
  const [currentFloor, setCurrentFloor] = useState<string>('2');
  const [isNavigating, setIsNavigating] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const groupedSections = {
    'Level 2 - 100s (Lower)': STADIUM_SECTIONS.filter(s => s.floorLevel === '2'),
    'Club Level - 200s': STADIUM_SECTIONS.filter(s => s.floorLevel === 'Club'),
    'Level 7 - 300s (Upper)': STADIUM_SECTIONS.filter(s => s.floorLevel === '7'),
    'Field Level': STADIUM_SECTIONS.filter(s => s.floorLevel === 'Field'),
    'Suite Level': STADIUM_SECTIONS.filter(s => s.floorLevel === 'Suite'),
  };

  useEffect(() => {
    if (selectedSection) {
      const section = STADIUM_SECTIONS.find(s => s.id === selectedSection);
      if (section) {
        const steps = generateDirections(section, currentFloor);
        setDirections(steps);
      }
    }
  }, [selectedSection, currentFloor]);

  const handleStartNavigation = () => {
    if (directions.length > 0) {
      setIsNavigating(true);
      setCurrentStep(0);
    }
  };

  const handleNextStep = () => {
    if (currentStep < directions.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const getStepIcon = (icon: string) => {
    switch (icon) {
      case 'walk': return <Footprints className="h-5 w-5 text-blue-400" />;
      case 'elevator': return <ArrowUp className="h-5 w-5 text-purple-600" />;
      case 'stairs': return <ArrowUp className="h-5 w-5 text-orange-600" />;
      case 'door': return <DoorOpen className="h-5 w-5 text-green-600" />;
      case 'destination': return <MapPin className="h-5 w-5 text-red-600" />;
      case 'turn': return <ChevronRight className="h-5 w-5 text-amber-600" />;
      default: return <Navigation className="h-5 w-5 text-slate-600" />;
    }
  };

  const selectedSectionData = STADIUM_SECTIONS.find(s => s.id === selectedSection);
  const needsElevator = selectedSectionData && selectedSectionData.floorLevel !== currentFloor;

  return (
    <Card className="h-full flex flex-col bg-slate-900/90 border-white/10" data-testid="walking-directions">
      <CardHeader className="pb-2 flex-shrink-0 border-b border-white/5">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2 text-white">
            <Navigation className="h-5 w-5 text-cyan-400" />
            Walking Directions
          </CardTitle>
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose} data-testid="close-directions" aria-label="Close directions" className="text-slate-400 hover:text-white hover:bg-white/10">
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-hidden flex flex-col gap-4">
        {!isNavigating ? (
          <>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium mb-1 block">Your Current Floor</label>
                <Select value={currentFloor} onValueChange={setCurrentFloor}>
                  <SelectTrigger data-testid="select-current-floor">
                    <SelectValue placeholder="Select your floor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2">Level 2 (Main/100s)</SelectItem>
                    <SelectItem value="Club">Club Level (200s)</SelectItem>
                    <SelectItem value="7">Level 7 (300s/Upper)</SelectItem>
                    <SelectItem value="Field">Field Level</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Destination Section</label>
                <Select value={selectedSection} onValueChange={setSelectedSection}>
                  <SelectTrigger data-testid="select-destination">
                    <SelectValue placeholder="Select destination section" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(groupedSections).map(([groupName, sections]) => (
                      sections.length > 0 && (
                        <div key={groupName}>
                          <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-slate-800">
                            {groupName}
                          </div>
                          {sections.map(section => (
                            <SelectItem key={section.id} value={section.id}>
                              Section {section.name}
                            </SelectItem>
                          ))}
                        </div>
                      )
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {selectedSection && needsElevator && (
              <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                <div className="flex items-start gap-2">
                  <ArrowUp className="h-5 w-5 text-purple-400 mt-0.5" />
                  <div>
                    <p className="font-medium text-purple-300">Elevator Required</p>
                    <p className="text-sm text-purple-400">
                      Section {selectedSectionData?.name} is on Level {selectedSectionData?.floorLevel}
                      {selectedSectionData?.floorLevel === '7' && ' (300s Upper Deck)'}
                      {selectedSectionData?.floorLevel === 'Club' && ' (Club Level)'}
                      . You'll need to take an elevator.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {directions.length > 0 && (
              <>
                <div className="flex items-center justify-between p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-blue-400" />
                    <span className="text-sm font-medium text-blue-300">
                      Est. Time: {getEstimatedTime(directions)}
                    </span>
                  </div>
                  <Badge variant="outline" className="bg-slate-800/50">
                    {directions.length} steps
                  </Badge>
                </div>

                <ScrollArea className="flex-1">
                  <div className="space-y-3 pr-4">
                    {directions.map((step, index) => (
                      <div 
                        key={index}
                        className={`flex items-start gap-3 p-3 rounded-lg border ${
                          step.floorChange ? 'bg-purple-500/10 border-purple-500/30' : 'bg-slate-800/50 border-slate-700'
                        }`}
                      >
                        <div className={`p-2 rounded-full ${
                          step.floorChange ? 'bg-purple-500/20' : 'bg-slate-700'
                        }`}>
                          {getStepIcon(step.icon)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-sm">{step.instruction}</p>
                            {step.distance && (
                              <span className="text-xs text-muted-foreground">{step.distance}</span>
                            )}
                          </div>
                          {step.detail && (
                            <p className="text-xs text-muted-foreground mt-0.5">{step.detail}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>

                <Button 
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  onClick={handleStartNavigation}
                  data-testid="start-navigation"
                >
                  <Navigation className="h-4 w-4 mr-2" />
                  Start Navigation
                </Button>
              </>
            )}
          </>
        ) : (
          <div className="flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <Badge variant="outline">
                Step {currentStep + 1} of {directions.length}
              </Badge>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setIsNavigating(false)}
              >
                Exit
              </Button>
            </div>

            <div className={`flex-1 flex flex-col items-center justify-center p-6 rounded-xl ${
              directions[currentStep]?.floorChange 
                ? 'bg-purple-500/10 border-2 border-purple-500/30' 
                : 'bg-blue-500/10 border-2 border-blue-500/30'
            }`}>
              <div className={`p-4 rounded-full mb-4 ${
                directions[currentStep]?.floorChange ? 'bg-purple-500/20' : 'bg-blue-500/20'
              }`}>
                {getStepIcon(directions[currentStep]?.icon || 'walk')}
              </div>
              
              <h3 className="text-xl font-bold text-center mb-2">
                {directions[currentStep]?.instruction}
              </h3>
              
              {directions[currentStep]?.detail && (
                <p className="text-muted-foreground text-center mb-4">
                  {directions[currentStep].detail}
                </p>
              )}

              {directions[currentStep]?.distance && (
                <Badge className="bg-slate-800/50 text-slate-300">
                  {directions[currentStep].distance}
                </Badge>
              )}
            </div>

            <div className="flex gap-2 mt-4">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={handlePrevStep}
                disabled={currentStep === 0}
              >
                Previous
              </Button>
              <Button 
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                onClick={handleNextStep}
                disabled={currentStep === directions.length - 1}
              >
                {currentStep === directions.length - 1 ? 'Done' : 'Next Step'}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
