import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { 
  ArrowLeft, Wind, Droplets, Thermometer, Eye, 
  Sunrise, Sunset, Cloud, ChevronUp, ChevronDown,
  RefreshCw, MapPin, Gauge, CloudRain, X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GlassCard } from '@/components/ui/premium';
import { ScrollArea } from '@/components/ui/scroll-area';

interface WeatherData {
  location: { city: string; state?: string; country: string; lat: number; lon: number };
  current: { 
    temp: number; 
    feelsLike: number; 
    humidity: number; 
    windSpeed: number; 
    windDirection: string; 
    description: string; 
    icon: string; 
    visibility: number; 
    pressure: number; 
    isNight: boolean;
    cloudCover: number;
    uvIndex: number;
    windGusts: number;
  };
  hourly: Array<{ time: string; temp: number; icon: string; description: string; precipitation: number }>;
  daily: Array<{ date: string; tempHigh: number; tempLow: number; icon: string; description: string; precipitation: number; sunrise: string; sunset: string }>;
}

const NISSAN_STADIUM = { lat: 36.1665, lon: -86.7713 };

export default function WeatherMapPage() {
  const [, navigate] = useLocation();
  const [isLandscape, setIsLandscape] = useState(false);
  const [dataExpanded, setDataExpanded] = useState(true);
  const [mapLayer, setMapLayer] = useState<'radar' | 'temp' | 'wind' | 'precip'>('radar');

  const handleClose = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      navigate('/');
    }
  };

  useEffect(() => {
    const checkOrientation = () => {
      setIsLandscape(window.innerWidth > window.innerHeight && window.innerWidth >= 640);
    };
    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    return () => window.removeEventListener('resize', checkOrientation);
  }, []);

  const { data: weather, isLoading, refetch } = useQuery<WeatherData>({
    queryKey: ['/api/weather/coords', NISSAN_STADIUM.lat, NISSAN_STADIUM.lon],
    queryFn: async () => {
      const res = await fetch(`/api/weather/coords/${NISSAN_STADIUM.lat}/${NISSAN_STADIUM.lon}`);
      if (!res.ok) throw new Error('Failed to fetch weather');
      return res.json();
    },
    refetchInterval: 300000,
    staleTime: 60000,
  });

  const radarTimestamp = Math.floor(Date.now() / 1000);
  const radarUrl = `https://tilecache.rainviewer.com/v2/radar/${radarTimestamp}/256/{z}/{x}/{y}/2/1_1.png`;

  const getWeatherEmoji = (desc: string) => {
    const d = desc.toLowerCase();
    if (d.includes('thunder') || d.includes('storm')) return '⛈️';
    if (d.includes('rain') || d.includes('drizzle')) return '🌧️';
    if (d.includes('snow')) return '❄️';
    if (d.includes('cloud') || d.includes('overcast')) return '☁️';
    if (d.includes('fog') || d.includes('mist')) return '🌫️';
    if (d.includes('clear') || d.includes('sunny')) return '☀️';
    return '🌤️';
  };

  const WeatherDataPanel = () => (
    <div className="h-full flex flex-col bg-gradient-to-b from-slate-900/95 to-slate-800/95 backdrop-blur-xl">
      <div className="p-3 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="h-3 w-3 text-cyan-400" />
            <span className="text-xs font-medium text-white">Nissan Stadium</span>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => refetch()}
            className="text-white/60 hover:text-white h-6 w-6 p-0"
            data-testid="button-refresh-weather"
          >
            <RefreshCw className="h-3 w-3" />
          </Button>
        </div>
        
        {weather && (
          <div className="flex items-center gap-3 mt-2">
            <div className="text-2xl">{getWeatherEmoji(weather.current.description)}</div>
            <div className="flex-1">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-white">{weather.current.temp}°F</span>
                <span className="text-xs text-cyan-400">Feels {weather.current.feelsLike}°</span>
              </div>
              <div className="text-xs text-white/60">{weather.current.description}</div>
            </div>
          </div>
        )}
      </div>
      
      <ScrollArea className="flex-1 p-3">
        {weather && (
          <div className="space-y-3">
            <div className="grid grid-cols-4 gap-2">
              <GlassCard className="p-2 text-center">
                <Wind className="h-3 w-3 text-white/60 mx-auto" />
                <div className="text-sm font-semibold text-white">{weather.current.windSpeed}</div>
                <div className="text-[10px] text-white/40">mph {weather.current.windDirection}</div>
              </GlassCard>
              
              <GlassCard className="p-2 text-center">
                <Droplets className="h-3 w-3 text-blue-400 mx-auto" />
                <div className="text-sm font-semibold text-white">{weather.current.humidity}%</div>
                <div className="text-[10px] text-white/40">Humidity</div>
              </GlassCard>
              
              <GlassCard className="p-2 text-center">
                <Eye className="h-3 w-3 text-white/60 mx-auto" />
                <div className="text-sm font-semibold text-white">{weather.current.visibility}</div>
                <div className="text-[10px] text-white/40">mi Vis</div>
              </GlassCard>
              
              <GlassCard className="p-2 text-center">
                <Gauge className="h-3 w-3 text-white/60 mx-auto" />
                <div className="text-sm font-semibold text-white">{weather.current.pressure}</div>
                <div className="text-[10px] text-white/40">in</div>
              </GlassCard>
            </div>
            
            <div>
              <div className="text-xs font-medium text-white/60 mb-1">Hourly</div>
              <div className="flex gap-1.5 overflow-x-auto pb-1">
                {weather.hourly.slice(0, 8).map((hour, i) => (
                  <GlassCard key={i} className="p-1.5 min-w-[48px] text-center shrink-0">
                    <div className="text-[10px] text-white/60">{hour.time}</div>
                    <div className="text-sm my-0.5">{hour.icon}</div>
                    <div className="text-xs font-medium text-white">{hour.temp}°</div>
                  </GlassCard>
                ))}
              </div>
            </div>
            
            <div>
              <div className="text-xs font-medium text-white/60 mb-1">7-Day</div>
              <div className="space-y-1">
                {weather.daily.slice(0, 4).map((day, i) => (
                  <GlassCard key={i} className="p-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{day.icon}</span>
                      <span className="text-xs font-medium text-white w-8">{day.date}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-white">{day.tempHigh}°</span>
                      <span className="text-[10px] text-white/40">{day.tempLow}°</span>
                    </div>
                  </GlassCard>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {isLoading && (
          <div className="flex items-center justify-center h-32">
            <RefreshCw className="h-6 w-6 text-cyan-400 animate-spin" />
          </div>
        )}
      </ScrollArea>
    </div>
  );

  const WeatherMap = () => (
    <div className="relative h-full w-full bg-slate-900">
      <div className="absolute top-3 left-3 z-10 flex gap-2">
        {(['radar', 'temp', 'precip'] as const).map((layer) => (
          <Button
            key={layer}
            variant={mapLayer === layer ? 'default' : 'outline'}
            size="sm"
            onClick={() => setMapLayer(layer)}
            className={`text-xs ${mapLayer === layer ? 'bg-cyan-500 text-white' : 'bg-slate-800/80 text-white border-white/20'}`}
            data-testid={`button-layer-${layer}`}
          >
            {layer === 'radar' && <CloudRain className="h-3 w-3 mr-1" />}
            {layer === 'temp' && <Thermometer className="h-3 w-3 mr-1" />}
            {layer === 'precip' && <Droplets className="h-3 w-3 mr-1" />}
            {layer.charAt(0).toUpperCase() + layer.slice(1)}
          </Button>
        ))}
      </div>
      
      <iframe
        src={`https://embed.windy.com/embed.html?type=map&location=coordinates&metricRain=in&metricTemp=°F&metricWind=mph&zoom=9&overlay=${mapLayer === 'radar' ? 'radar' : mapLayer === 'temp' ? 'temp' : 'rainAccu'}&product=radar&level=surface&lat=${NISSAN_STADIUM.lat}&lon=${NISSAN_STADIUM.lon}&detailLat=${NISSAN_STADIUM.lat}&detailLon=${NISSAN_STADIUM.lon}&marker=true&message=true`}
        className="w-full h-full border-0"
        title="Weather Radar Map"
        allow="fullscreen"
        data-testid="weather-map-iframe"
      />
      
      <div className="absolute bottom-3 left-3 z-10">
        <GlassCard className="px-3 py-2 flex items-center gap-2">
          <MapPin className="h-4 w-4 text-cyan-400" />
          <span className="text-xs text-white">Nissan Stadium</span>
        </GlassCard>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      <div className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur-xl border-b border-white/10 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleClose}
              className="text-white hover:bg-white/10" 
              data-testid="button-back"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
            <div>
              <h1 className="text-lg font-bold text-white">Weather Map</h1>
              <p className="text-xs text-cyan-400">Interactive Radar & Conditions</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setDataExpanded(!dataExpanded)}
              className="text-white/60 hover:text-white lg:hidden"
              data-testid="button-toggle-data"
            >
              {dataExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={handleClose}
              className="text-white hover:bg-red-500/20 hover:text-red-400 h-8 w-8"
              data-testid="button-close-map"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
      
      {isLandscape ? (
        <div className="flex h-[calc(100vh-60px)]">
          <motion.div 
            className="h-full overflow-hidden border-r border-white/10"
            initial={{ width: '33%' }}
            animate={{ width: dataExpanded ? '33%' : '0%' }}
            transition={{ duration: 0.3 }}
          >
            <WeatherDataPanel />
          </motion.div>
          <div className="flex-1 h-full">
            <WeatherMap />
          </div>
        </div>
      ) : (
        <div className="flex flex-col h-[calc(100vh-60px)]">
          <div className="flex-1 min-h-0">
            <WeatherMap />
          </div>
          <motion.div
            className="border-t border-white/10 overflow-hidden"
            initial={{ height: '50%' }}
            animate={{ height: dataExpanded ? '50%' : '60px' }}
            transition={{ duration: 0.3 }}
          >
            {dataExpanded ? (
              <WeatherDataPanel />
            ) : (
              <button 
                onClick={() => setDataExpanded(true)}
                className="w-full h-full flex items-center justify-center gap-2 text-white/60 hover:text-white bg-slate-900/95"
                data-testid="button-expand-data"
              >
                <ChevronUp className="h-5 w-5" />
                <span className="text-sm">Show Weather Details</span>
              </button>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
}
