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
import { LayoutShell, BentoCard, CarouselRail, AccordionStack } from '@/components/ui/bento';

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
  const [mapLayer, setMapLayer] = useState<'radar' | 'temp' | 'wind' | 'precip'>('radar');

  const handleClose = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      navigate('/');
    }
  };

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

  const weatherMetrics = weather ? [
    <div key="temp" className="flex flex-col items-center p-3 bg-slate-800/60 rounded-lg min-w-[100px]" data-testid="metric-temp">
      <Thermometer className="h-5 w-5 text-orange-400 mb-1" />
      <span className="text-xl font-bold text-white">{weather.current.temp}°F</span>
      <span className="text-[10px] text-white/50">Temperature</span>
    </div>,
    <div key="feels" className="flex flex-col items-center p-3 bg-slate-800/60 rounded-lg min-w-[100px]" data-testid="metric-feels">
      <Thermometer className="h-5 w-5 text-cyan-400 mb-1" />
      <span className="text-xl font-bold text-white">{weather.current.feelsLike}°F</span>
      <span className="text-[10px] text-white/50">Feels Like</span>
    </div>,
    <div key="wind" className="flex flex-col items-center p-3 bg-slate-800/60 rounded-lg min-w-[100px]" data-testid="metric-wind">
      <Wind className="h-5 w-5 text-slate-400 mb-1" />
      <span className="text-xl font-bold text-white">{weather.current.windSpeed}</span>
      <span className="text-[10px] text-white/50">mph {weather.current.windDirection}</span>
    </div>,
    <div key="humidity" className="flex flex-col items-center p-3 bg-slate-800/60 rounded-lg min-w-[100px]" data-testid="metric-humidity">
      <Droplets className="h-5 w-5 text-blue-400 mb-1" />
      <span className="text-xl font-bold text-white">{weather.current.humidity}%</span>
      <span className="text-[10px] text-white/50">Humidity</span>
    </div>,
    <div key="visibility" className="flex flex-col items-center p-3 bg-slate-800/60 rounded-lg min-w-[100px]" data-testid="metric-visibility">
      <Eye className="h-5 w-5 text-slate-400 mb-1" />
      <span className="text-xl font-bold text-white">{weather.current.visibility}</span>
      <span className="text-[10px] text-white/50">mi Visibility</span>
    </div>,
    <div key="pressure" className="flex flex-col items-center p-3 bg-slate-800/60 rounded-lg min-w-[100px]" data-testid="metric-pressure">
      <Gauge className="h-5 w-5 text-slate-400 mb-1" />
      <span className="text-xl font-bold text-white">{weather.current.pressure}</span>
      <span className="text-[10px] text-white/50">in Pressure</span>
    </div>,
    <div key="clouds" className="flex flex-col items-center p-3 bg-slate-800/60 rounded-lg min-w-[100px]" data-testid="metric-clouds">
      <Cloud className="h-5 w-5 text-slate-400 mb-1" />
      <span className="text-xl font-bold text-white">{weather.current.cloudCover}%</span>
      <span className="text-[10px] text-white/50">Cloud Cover</span>
    </div>,
  ] : [];

  const hourlyItems = weather?.hourly.slice(0, 12).map((hour, i) => (
    <div 
      key={i} 
      className="flex flex-col items-center p-2 bg-slate-800/60 rounded-lg min-w-[60px]"
      data-testid={`hourly-${i}`}
    >
      <span className="text-[10px] text-white/60">{hour.time}</span>
      <span className="text-lg my-1">{hour.icon}</span>
      <span className="text-sm font-bold text-white">{hour.temp}°</span>
      {hour.precipitation > 0 && (
        <span className="text-[10px] text-blue-400">{hour.precipitation}%</span>
      )}
    </div>
  )) || [];

  const forecastAccordionItems = weather?.daily.map((day, i) => ({
    title: `${day.date} - ${day.icon} ${day.tempHigh}°/${day.tempLow}°`,
    content: (
      <div className="space-y-2" data-testid={`forecast-detail-${i}`}>
        <div className="flex items-center justify-between">
          <span className="text-slate-400">Description</span>
          <span className="text-white">{day.description}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-400">Precipitation</span>
          <span className="text-blue-400">{day.precipitation}%</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-400">Sunrise</span>
          <span className="text-orange-400">{day.sunrise}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-400">Sunset</span>
          <span className="text-indigo-400">{day.sunset}</span>
        </div>
      </div>
    )
  })) || [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900" data-testid="weather-map-page">
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
              <h1 className="text-lg font-bold text-white" data-testid="text-page-title">Weather Map</h1>
              <p className="text-xs text-cyan-400">Interactive Radar & Conditions</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => refetch()}
              className="text-white/60 hover:text-white"
              data-testid="button-refresh-weather"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
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
      
      <div className="p-3">
        <LayoutShell className="gap-3">
          {weather && (
            <BentoCard span={12} className="p-2" data-testid="bento-card-current-weather">
              <div className="flex items-center gap-4 mb-2">
                <div className="text-4xl">{getWeatherEmoji(weather.current.description)}</div>
                <div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-cyan-400" />
                    <span className="text-sm font-medium text-white" data-testid="text-location">Nissan Stadium</span>
                  </div>
                  <div className="text-2xl font-bold text-white" data-testid="text-current-temp">{weather.current.temp}°F</div>
                  <div className="text-xs text-white/60" data-testid="text-description">{weather.current.description}</div>
                </div>
              </div>
            </BentoCard>
          )}

          <BentoCard span={12} className="p-2" title="Weather Metrics" data-testid="bento-card-metrics">
            {isLoading ? (
              <div className="flex items-center justify-center h-20">
                <RefreshCw className="h-6 w-6 text-cyan-400 animate-spin" />
              </div>
            ) : weather ? (
              <CarouselRail items={weatherMetrics} data-testid="carousel-metrics" />
            ) : (
              <div className="text-center text-white/50 py-4">No weather data available</div>
            )}
          </BentoCard>

          <BentoCard span={12} rowSpan={2} className="p-0 overflow-hidden" data-testid="bento-card-map">
            <div className="relative h-[400px] lg:h-[500px] w-full bg-slate-900">
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
                <div className="px-3 py-2 flex items-center gap-2 bg-slate-800/80 backdrop-blur-sm rounded-lg border border-white/10">
                  <MapPin className="h-4 w-4 text-cyan-400" />
                  <span className="text-xs text-white">Nissan Stadium</span>
                </div>
              </div>
            </div>
          </BentoCard>

          {weather && weather.hourly.length > 0 && (
            <BentoCard span={12} className="p-2" title="Hourly Forecast" data-testid="bento-card-hourly">
              <CarouselRail items={hourlyItems} data-testid="carousel-hourly" />
            </BentoCard>
          )}

          {weather && weather.daily.length > 0 && (
            <BentoCard span={12} className="p-2" title="7-Day Forecast" data-testid="bento-card-forecast">
              <AccordionStack 
                items={forecastAccordionItems} 
                defaultOpen={[0]} 
                data-testid="accordion-forecast"
              />
            </BentoCard>
          )}
        </LayoutShell>
      </div>
    </div>
  );
}
