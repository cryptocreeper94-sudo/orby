import { useState, useEffect } from "react";
import { useStore } from "@/lib/mockData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  LogOut, Map, MessageSquare, Navigation, MapPin, 
  CheckCircle2, AlertTriangle, Clock, Users, Building2 
} from "lucide-react";
import { useLocation } from "wouter";
import { Notepad } from "@/components/Notepad";
import { InteractiveMap } from "@/components/InteractiveMap";
import { 
  LocationAcknowledgement, 
  useGeolocation, 
  isWithinGeofence,
  STADIUM_LOCATION,
  GEOFENCE_RADIUS_FEET 
} from "@/components/LocationAcknowledgement";

export default function NPODashboard() {
  const logout = useStore((state) => state.logout);
  const [, setLocation] = useLocation();
  const currentUser = useStore((state) => state.currentUser);
  const [showMap, setShowMap] = useState(false);
  const [locationAccepted, setLocationAccepted] = useState(false);
  const [isOnSite, setIsOnSite] = useState(false);
  const [checkedIn, setCheckedIn] = useState(false);
  const [checkInTime, setCheckInTime] = useState<Date | null>(null);

  const { location, error, isLoading, requestLocation } = useGeolocation();

  useEffect(() => {
    if (locationAccepted) {
      requestLocation();
    }
  }, [locationAccepted]);

  useEffect(() => {
    if (location) {
      const onSite = isWithinGeofence(
        location.coords.latitude,
        location.coords.longitude,
        STADIUM_LOCATION.lat,
        STADIUM_LOCATION.lng,
        GEOFENCE_RADIUS_FEET
      );
      setIsOnSite(onSite);
    }
  }, [location]);

  const handleLogout = () => {
    logout();
    setLocation("/");
  };

  const handleCheckIn = () => {
    if (isOnSite || process.env.NODE_ENV === 'development') {
      setCheckedIn(true);
      setCheckInTime(new Date());
    }
  };

  const assignedSection = {
    name: "Section 105",
    floor: "Level 2",
    stand: "Hot Dogs & Drinks",
    supervisor: "Mike Smith"
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20">
      <LocationAcknowledgement 
        onAccept={() => setLocationAccepted(true)}
        onDecline={() => setLocation("/")}
        storageKey="npo-location-acknowledged"
      />

      <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-indigo-600 text-white px-4 shadow-md">
        <div className="flex items-center gap-2">
          <Users className="h-6 w-6" />
          <span className="font-bold text-lg">NPO Staff</span>
        </div>
        <div className="flex-1" />
        <Button 
          variant="ghost" 
          size="icon" 
          className="text-white hover:bg-indigo-700"
          onClick={() => setShowMap(true)}
        >
          <Map className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon" onClick={handleLogout} className="text-white hover:bg-indigo-700">
          <LogOut className="h-5 w-5" />
        </Button>
      </header>

      {showMap && (
        <div className="fixed inset-0 z-50 bg-background">
          <InteractiveMap 
            onClose={() => setShowMap(false)} 
            showNavigation={true}
            userLocation={location ? { lat: location.coords.latitude, lng: location.coords.longitude } : null}
          />
        </div>
      )}

      <main className="p-4 sm:px-6 space-y-6 max-w-4xl mx-auto mt-4">
        <div className="text-center py-4">
          <h1 className="text-2xl font-black text-slate-800 dark:text-slate-200">
            Welcome, {currentUser?.name || 'NPO Staff'}
          </h1>
          <p className="text-muted-foreground">Non-Profit Organization Dashboard</p>
        </div>

        <Card className={`border-2 ${isOnSite ? 'border-green-500 bg-green-50' : 'border-amber-500 bg-amber-50'}`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className={`h-5 w-5 ${isOnSite ? 'text-green-600' : 'text-amber-600'}`} />
              Location Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                {isLoading ? (
                  <p className="text-sm text-muted-foreground">Checking location...</p>
                ) : error ? (
                  <p className="text-sm text-red-600">{error}</p>
                ) : isOnSite ? (
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <span className="text-green-700 font-medium">You are on-site at the stadium</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-amber-600" />
                    <span className="text-amber-700 font-medium">
                      You are outside the stadium geofence (100ft)
                    </span>
                  </div>
                )}
              </div>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={requestLocation}
                disabled={isLoading}
              >
                <Navigation className="h-4 w-4 mr-1" />
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>

        {!checkedIn ? (
          <Card className="border-2 border-indigo-200 bg-indigo-50">
            <CardContent className="p-6 text-center space-y-4">
              <Clock className="h-12 w-12 text-indigo-600 mx-auto" />
              <div>
                <h3 className="text-lg font-bold text-indigo-900">Ready to Check In?</h3>
                <p className="text-sm text-indigo-700">
                  {isOnSite 
                    ? "You're at the stadium. Tap below to start your shift."
                    : "Please arrive at the stadium to check in (geofence: 100ft radius)."
                  }
                </p>
              </div>
              <Button 
                className="w-full bg-indigo-600 hover:bg-indigo-700"
                disabled={!isOnSite && process.env.NODE_ENV !== 'development'}
                onClick={handleCheckIn}
                data-testid="check-in-btn"
              >
                <CheckCircle2 className="h-5 w-5 mr-2" />
                Check In Now
              </Button>
              {process.env.NODE_ENV === 'development' && !isOnSite && (
                <p className="text-xs text-muted-foreground">(Dev mode: Check-in available regardless of location)</p>
              )}
            </CardContent>
          </Card>
        ) : (
          <>
            <Card className="border-2 border-green-200 bg-green-50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-full">
                      <CheckCircle2 className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <p className="font-bold text-green-900">Checked In</p>
                      <p className="text-sm text-green-700">
                        {checkInTime?.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                  <Badge className="bg-green-600">Active</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-indigo-600" />
                  Your Assignment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <p className="text-xs text-muted-foreground uppercase">Section</p>
                    <p className="font-bold">{assignedSection.name}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <p className="text-xs text-muted-foreground uppercase">Floor</p>
                    <p className="font-bold">{assignedSection.floor}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <p className="text-xs text-muted-foreground uppercase">Stand</p>
                    <p className="font-bold">{assignedSection.stand}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <p className="text-xs text-muted-foreground uppercase">Supervisor</p>
                    <p className="font-bold">{assignedSection.supervisor}</p>
                  </div>
                </div>
                <Button 
                  className="w-full" 
                  variant="outline"
                  onClick={() => setShowMap(true)}
                >
                  <Navigation className="h-4 w-4 mr-2" />
                  Get Walking Directions
                </Button>
              </CardContent>
            </Card>
          </>
        )}

        <div className="grid grid-cols-2 gap-4">
          <Card 
            className="border-none shadow-md hover:shadow-lg transition-shadow cursor-pointer" 
            onClick={() => setShowMap(true)}
          >
            <CardContent className="p-6 flex flex-col items-center justify-center text-center space-y-3">
              <div className="p-4 rounded-full bg-blue-100 dark:bg-blue-900/30">
                <Map className="h-8 w-8 text-blue-600" />
              </div>
              <div className="font-bold text-sm">Stadium Map</div>
            </CardContent>
          </Card>
          <Card 
            className="border-none shadow-md hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => setLocation('/messages')}
          >
            <CardContent className="p-6 flex flex-col items-center justify-center text-center space-y-3">
              <div className="p-4 rounded-full bg-indigo-100 dark:bg-indigo-900/30">
                <MessageSquare className="h-8 w-8 text-indigo-600" />
              </div>
              <div className="font-bold text-sm">Messages</div>
            </CardContent>
          </Card>
        </div>

        <Notepad storageKey="npo-notes" title="My Shift Notes" />
      </main>
    </div>
  );
}
