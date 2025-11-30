import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { MapPin, Navigation, Shield, AlertTriangle } from 'lucide-react';

interface LocationAcknowledgementProps {
  onAccept: () => void;
  onDecline?: () => void;
  storageKey?: string;
}

export function LocationAcknowledgement({ 
  onAccept, 
  onDecline,
  storageKey = 'location-acknowledged' 
}: LocationAcknowledgementProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [understood, setUnderstood] = useState(false);

  useEffect(() => {
    const acknowledged = localStorage.getItem(storageKey);
    if (!acknowledged) {
      setIsOpen(true);
    } else {
      onAccept();
    }
  }, [storageKey, onAccept]);

  const handleAccept = () => {
    if (understood) {
      localStorage.setItem(storageKey, 'true');
      setIsOpen(false);
      onAccept();
    }
  };

  const handleDecline = () => {
    setIsOpen(false);
    onDecline?.();
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-lg" data-testid="location-acknowledgement">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <MapPin className="h-6 w-6 text-blue-600" />
            Location Services Required
          </DialogTitle>
          <DialogDescription className="text-base pt-2">
            This app uses your device's GPS location to provide the following features:
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
            <Navigation className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-blue-900">Indoor Navigation</p>
              <p className="text-sm text-blue-700">
                Walking directions to help you find stands, gates, and key locations within the stadium.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
            <Shield className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-green-900">Geofence Verification</p>
              <p className="text-sm text-green-700">
                Confirms you're on-site for attendance tracking and secure login when within 100 feet of the stadium.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg">
            <MapPin className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-purple-900">Real-time Communication</p>
              <p className="text-sm text-purple-700">
                Helps supervisors and managers know your location for faster response to requests.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
            <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-amber-900">Privacy Notice</p>
              <p className="text-sm text-amber-700">
                Your location is only used while the app is open and for stadium operations. 
                Location data is not stored or shared outside the StadiumOps system.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3 pt-2">
            <Checkbox 
              id="understand" 
              checked={understood}
              onCheckedChange={(checked) => setUnderstood(checked === true)}
              data-testid="checkbox-understand"
            />
            <label 
              htmlFor="understand" 
              className="text-sm font-medium leading-none cursor-pointer"
            >
              I understand and agree to allow location access for these features
            </label>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          {onDecline && (
            <Button 
              variant="outline" 
              onClick={handleDecline}
              data-testid="decline-location"
            >
              Decline
            </Button>
          )}
          <Button 
            onClick={handleAccept}
            disabled={!understood}
            className="bg-blue-600 hover:bg-blue-700"
            data-testid="accept-location"
          >
            <MapPin className="h-4 w-4 mr-2" />
            Enable Location
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function useGeolocation() {
  const [location, setLocation] = useState<GeolocationPosition | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    setIsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation(position);
        setError(null);
        setIsLoading(false);
      },
      (err) => {
        setError(err.message);
        setIsLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  };

  const watchLocation = (callback: (position: GeolocationPosition) => void) => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return null;
    }

    return navigator.geolocation.watchPosition(
      (position) => {
        setLocation(position);
        setError(null);
        callback(position);
      },
      (err) => {
        setError(err.message);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000
      }
    );
  };

  return { location, error, isLoading, requestLocation, watchLocation };
}

export function isWithinGeofence(
  userLat: number, 
  userLng: number, 
  targetLat: number, 
  targetLng: number, 
  radiusFeet: number
): boolean {
  const R = 20902231; // Earth's radius in feet
  const dLat = (targetLat - userLat) * Math.PI / 180;
  const dLng = (targetLng - userLng) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(userLat * Math.PI / 180) * Math.cos(targetLat * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return distance <= radiusFeet;
}

// Nissan Stadium coordinates (approximate center)
export const STADIUM_LOCATION = {
  lat: 36.1665,
  lng: -86.7713
};

export const GEOFENCE_RADIUS_FEET = 100;
