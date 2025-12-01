import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Cloud, CloudRain, CloudSnow, Sun, CloudLightning, Wind, Droplets,
  Thermometer, Eye, Gauge, RefreshCw, AlertTriangle, Clock, Calendar,
  Umbrella, Snowflake, CloudFog, CloudDrizzle, Sunrise, Sunset, Navigation
} from 'lucide-react';

interface WeatherData {
  current: {
    temperature: number;
    apparentTemperature: number;
    humidity: number;
    windSpeed: number;
    windDirection: number;
    windGusts: number;
    precipitation: number;
    weatherCode: number;
    visibility: number;
    pressure: number;
    cloudCover: number;
    uvIndex: number;
    isDay: boolean;
  };
  hourly: {
    time: string[];
    temperature: number[];
    precipitation: number[];
    precipitationProbability: number[];
    weatherCode: number[];
    windSpeed: number[];
  };
  daily: {
    time: string[];
    weatherCode: number[];
    temperatureMax: number[];
    temperatureMin: number[];
    precipitationSum: number[];
    precipitationProbability: number[];
    sunrise: string[];
    sunset: string[];
  };
  alerts?: WeatherAlert[];
}

interface WeatherAlert {
  event: string;
  severity: 'Minor' | 'Moderate' | 'Severe' | 'Extreme';
  headline: string;
  description: string;
  start: string;
  end: string;
}

const NISSAN_STADIUM_COORDS = { lat: 36.1665, lng: -86.7713 };

const WEATHER_CODES: Record<number, { label: string; icon: React.ReactNode; color: string }> = {
  0: { label: 'Clear', icon: <Sun className="h-6 w-6" />, color: 'text-yellow-500' },
  1: { label: 'Mainly Clear', icon: <Sun className="h-6 w-6" />, color: 'text-yellow-400' },
  2: { label: 'Partly Cloudy', icon: <Cloud className="h-6 w-6" />, color: 'text-gray-400' },
  3: { label: 'Overcast', icon: <Cloud className="h-6 w-6" />, color: 'text-gray-500' },
  45: { label: 'Foggy', icon: <CloudFog className="h-6 w-6" />, color: 'text-gray-400' },
  48: { label: 'Rime Fog', icon: <CloudFog className="h-6 w-6" />, color: 'text-gray-300' },
  51: { label: 'Light Drizzle', icon: <CloudDrizzle className="h-6 w-6" />, color: 'text-blue-300' },
  53: { label: 'Drizzle', icon: <CloudDrizzle className="h-6 w-6" />, color: 'text-blue-400' },
  55: { label: 'Heavy Drizzle', icon: <CloudDrizzle className="h-6 w-6" />, color: 'text-blue-500' },
  61: { label: 'Light Rain', icon: <CloudRain className="h-6 w-6" />, color: 'text-blue-400' },
  63: { label: 'Rain', icon: <CloudRain className="h-6 w-6" />, color: 'text-blue-500' },
  65: { label: 'Heavy Rain', icon: <CloudRain className="h-6 w-6" />, color: 'text-blue-600' },
  66: { label: 'Freezing Rain', icon: <CloudRain className="h-6 w-6" />, color: 'text-cyan-400' },
  67: { label: 'Heavy Freezing Rain', icon: <CloudRain className="h-6 w-6" />, color: 'text-cyan-500' },
  71: { label: 'Light Snow', icon: <CloudSnow className="h-6 w-6" />, color: 'text-blue-200' },
  73: { label: 'Snow', icon: <CloudSnow className="h-6 w-6" />, color: 'text-blue-300' },
  75: { label: 'Heavy Snow', icon: <CloudSnow className="h-6 w-6" />, color: 'text-blue-400' },
  77: { label: 'Snow Grains', icon: <Snowflake className="h-6 w-6" />, color: 'text-blue-200' },
  80: { label: 'Light Showers', icon: <CloudRain className="h-6 w-6" />, color: 'text-blue-400' },
  81: { label: 'Showers', icon: <CloudRain className="h-6 w-6" />, color: 'text-blue-500' },
  82: { label: 'Heavy Showers', icon: <CloudRain className="h-6 w-6" />, color: 'text-blue-600' },
  85: { label: 'Light Snow Showers', icon: <CloudSnow className="h-6 w-6" />, color: 'text-blue-300' },
  86: { label: 'Snow Showers', icon: <CloudSnow className="h-6 w-6" />, color: 'text-blue-400' },
  95: { label: 'Thunderstorm', icon: <CloudLightning className="h-6 w-6" />, color: 'text-yellow-400' },
  96: { label: 'Thunderstorm + Hail', icon: <CloudLightning className="h-6 w-6" />, color: 'text-orange-500' },
  99: { label: 'Severe Thunderstorm', icon: <CloudLightning className="h-6 w-6" />, color: 'text-red-500' },
};

function getWeatherInfo(code: number) {
  return WEATHER_CODES[code] || { label: 'Unknown', icon: <Cloud className="h-6 w-6" />, color: 'text-gray-400' };
}

function getWindDirection(degrees: number): string {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(degrees / 22.5) % 16;
  return directions[index];
}

function formatTime(isoString: string): string {
  return new Date(isoString).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function formatDay(isoString: string): string {
  return new Date(isoString).toLocaleDateString('en-US', { weekday: 'short' });
}

interface WeatherWidgetProps {
  compact?: boolean;
  className?: string;
}

export function WeatherWidget({ compact = false, className = '' }: WeatherWidgetProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchWeather = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        latitude: NISSAN_STADIUM_COORDS.lat.toString(),
        longitude: NISSAN_STADIUM_COORDS.lng.toString(),
        current: 'temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,wind_direction_10m,wind_gusts_10m,visibility,surface_pressure,cloud_cover,uv_index,is_day',
        hourly: 'temperature_2m,precipitation,precipitation_probability,weather_code,wind_speed_10m',
        daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,sunrise,sunset',
        temperature_unit: 'fahrenheit',
        wind_speed_unit: 'mph',
        precipitation_unit: 'inch',
        timezone: 'America/Chicago',
        forecast_days: '7'
      });

      const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch weather data');
      }

      const data = await response.json();

      setWeather({
        current: {
          temperature: data.current.temperature_2m,
          apparentTemperature: data.current.apparent_temperature,
          humidity: data.current.relative_humidity_2m,
          windSpeed: data.current.wind_speed_10m,
          windDirection: data.current.wind_direction_10m,
          windGusts: data.current.wind_gusts_10m,
          precipitation: data.current.precipitation,
          weatherCode: data.current.weather_code,
          visibility: data.current.visibility / 1000,
          pressure: data.current.surface_pressure,
          cloudCover: data.current.cloud_cover,
          uvIndex: data.current.uv_index,
          isDay: data.current.is_day === 1
        },
        hourly: {
          time: data.hourly.time,
          temperature: data.hourly.temperature_2m,
          precipitation: data.hourly.precipitation,
          precipitationProbability: data.hourly.precipitation_probability,
          weatherCode: data.hourly.weather_code,
          windSpeed: data.hourly.wind_speed_10m
        },
        daily: {
          time: data.daily.time,
          weatherCode: data.daily.weather_code,
          temperatureMax: data.daily.temperature_2m_max,
          temperatureMin: data.daily.temperature_2m_min,
          precipitationSum: data.daily.precipitation_sum,
          precipitationProbability: data.daily.precipitation_probability_max,
          sunrise: data.daily.sunrise,
          sunset: data.daily.sunset
        }
      });

      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load weather');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWeather();
    const interval = setInterval(fetchWeather, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchWeather]);

  if (loading && !weather) {
    return (
      <Card className={`${className} animate-pulse`}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <RefreshCw className="h-8 w-8 animate-spin text-cyan-500" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error && !weather) {
    return (
      <Card className={`${className} border-red-200`}>
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center h-32 text-red-500">
            <AlertTriangle className="h-8 w-8 mb-2" />
            <p className="text-sm">{error}</p>
            <Button variant="outline" size="sm" onClick={fetchWeather} className="mt-2">
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!weather) return null;

  const currentWeather = getWeatherInfo(weather.current.weatherCode);
  const currentHourIndex = new Date().getHours();
  const next12Hours = weather.hourly.time.slice(currentHourIndex, currentHourIndex + 12);

  if (compact) {
    return (
      <Card className={`${className} bg-gradient-to-br from-cyan-900/30 to-slate-900/50 border-cyan-500/30`} data-testid="weather-widget-compact">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={currentWeather.color}>
                {currentWeather.icon}
              </div>
              <div>
                <div className="text-2xl font-bold text-white">
                  {Math.round(weather.current.temperature)}°F
                </div>
                <div className="text-xs text-cyan-200/70">
                  {currentWeather.label}
                </div>
              </div>
            </div>
            <div className="text-right text-xs text-cyan-200/60">
              <div className="flex items-center gap-1">
                <Wind className="h-3 w-3" />
                {Math.round(weather.current.windSpeed)} mph
              </div>
              <div className="flex items-center gap-1">
                <Droplets className="h-3 w-3" />
                {weather.current.humidity}%
              </div>
              {weather.current.precipitation > 0 && (
                <div className="flex items-center gap-1 text-blue-300">
                  <Umbrella className="h-3 w-3" />
                  {weather.current.precipitation}"
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`${className} bg-gradient-to-br from-slate-900 to-slate-800 border-cyan-500/30 text-white`} data-testid="weather-widget-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-cyan-400">
            <Cloud className="h-5 w-5" />
            Nissan Stadium Weather
          </CardTitle>
          <div className="flex items-center gap-2">
            {lastUpdated && (
              <span className="text-xs text-cyan-200/50">
                Updated {formatTime(lastUpdated.toISOString())}
              </span>
            )}
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={fetchWeather}
              disabled={loading}
              className="h-8 w-8 text-cyan-400 hover:text-cyan-300"
              data-testid="button-refresh-weather"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex items-start justify-between p-4 bg-white/5 rounded-xl">
          <div className="flex items-center gap-4">
            <div className={`${currentWeather.color} p-3 bg-white/10 rounded-xl scale-150`}>
              {currentWeather.icon}
            </div>
            <div>
              <div className="text-5xl font-bold">
                {Math.round(weather.current.temperature)}°
              </div>
              <div className="text-lg text-cyan-200/80">{currentWeather.label}</div>
              <div className="text-sm text-cyan-200/50">
                Feels like {Math.round(weather.current.apparentTemperature)}°
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
            <div className="flex items-center gap-2 text-cyan-200/70">
              <Wind className="h-4 w-4" />
              <span>{Math.round(weather.current.windSpeed)} mph {getWindDirection(weather.current.windDirection)}</span>
            </div>
            <div className="flex items-center gap-2 text-cyan-200/70">
              <Droplets className="h-4 w-4" />
              <span>{weather.current.humidity}% humidity</span>
            </div>
            <div className="flex items-center gap-2 text-cyan-200/70">
              <Navigation className="h-4 w-4" />
              <span>Gusts {Math.round(weather.current.windGusts)} mph</span>
            </div>
            <div className="flex items-center gap-2 text-cyan-200/70">
              <Eye className="h-4 w-4" />
              <span>{weather.current.visibility.toFixed(1)} mi visibility</span>
            </div>
            <div className="flex items-center gap-2 text-cyan-200/70">
              <Gauge className="h-4 w-4" />
              <span>{Math.round(weather.current.pressure)} hPa</span>
            </div>
            <div className="flex items-center gap-2 text-cyan-200/70">
              <Cloud className="h-4 w-4" />
              <span>{weather.current.cloudCover}% clouds</span>
            </div>
          </div>
        </div>

        {weather.current.precipitation > 0 && (
          <div className="flex items-center gap-2 p-3 bg-blue-500/20 rounded-lg border border-blue-500/30">
            <Umbrella className="h-5 w-5 text-blue-400" />
            <span className="text-blue-200">
              Active precipitation: {weather.current.precipitation}" in the last hour
            </span>
          </div>
        )}

        {weather.current.windGusts > 30 && (
          <div className="flex items-center gap-2 p-3 bg-amber-500/20 rounded-lg border border-amber-500/30">
            <AlertTriangle className="h-5 w-5 text-amber-400" />
            <span className="text-amber-200">
              High wind advisory: Gusts up to {Math.round(weather.current.windGusts)} mph
            </span>
          </div>
        )}

        <Tabs defaultValue="hourly" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-white/5">
            <TabsTrigger value="hourly" className="data-[state=active]:bg-cyan-500/30">
              <Clock className="h-4 w-4 mr-2" />
              Hourly
            </TabsTrigger>
            <TabsTrigger value="daily" className="data-[state=active]:bg-cyan-500/30">
              <Calendar className="h-4 w-4 mr-2" />
              7-Day
            </TabsTrigger>
          </TabsList>

          <TabsContent value="hourly" className="mt-4">
            <ScrollArea className="w-full whitespace-nowrap">
              <div className="flex gap-3 pb-2">
                {next12Hours.map((time, i) => {
                  const hourIndex = currentHourIndex + i;
                  const hourWeather = getWeatherInfo(weather.hourly.weatherCode[hourIndex]);
                  const precipProb = weather.hourly.precipitationProbability[hourIndex];
                  return (
                    <div 
                      key={time} 
                      className="flex flex-col items-center p-3 bg-white/5 rounded-lg min-w-[80px]"
                    >
                      <span className="text-xs text-cyan-200/60">{formatTime(time)}</span>
                      <div className={`my-2 ${hourWeather.color}`}>
                        {hourWeather.icon}
                      </div>
                      <span className="font-semibold">
                        {Math.round(weather.hourly.temperature[hourIndex])}°
                      </span>
                      {precipProb > 0 && (
                        <span className="text-xs text-blue-300 flex items-center gap-1 mt-1">
                          <Droplets className="h-3 w-3" />
                          {precipProb}%
                        </span>
                      )}
                      <span className="text-xs text-cyan-200/50 mt-1">
                        {Math.round(weather.hourly.windSpeed[hourIndex])} mph
                      </span>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="daily" className="mt-4">
            <div className="space-y-2">
              {weather.daily.time.map((day, i) => {
                const dayWeather = getWeatherInfo(weather.daily.weatherCode[i]);
                const precipProb = weather.daily.precipitationProbability[i];
                const isToday = i === 0;
                return (
                  <div 
                    key={day}
                    className={`flex items-center justify-between p-3 rounded-lg ${isToday ? 'bg-cyan-500/20 border border-cyan-500/30' : 'bg-white/5'}`}
                  >
                    <div className="flex items-center gap-3 w-24">
                      <span className={`font-medium ${isToday ? 'text-cyan-300' : 'text-cyan-200/80'}`}>
                        {isToday ? 'Today' : formatDay(day)}
                      </span>
                    </div>
                    <div className={`${dayWeather.color} flex items-center gap-2 w-36`}>
                      {dayWeather.icon}
                      <span className="text-sm text-cyan-200/70">{dayWeather.label}</span>
                    </div>
                    {precipProb > 0 && (
                      <div className="flex items-center gap-1 text-blue-300 w-16">
                        <Droplets className="h-4 w-4" />
                        <span className="text-sm">{precipProb}%</span>
                      </div>
                    )}
                    {precipProb === 0 && <div className="w-16" />}
                    <div className="flex items-center gap-2 text-right">
                      <span className="font-semibold">{Math.round(weather.daily.temperatureMax[i])}°</span>
                      <span className="text-cyan-200/50">/</span>
                      <span className="text-cyan-200/60">{Math.round(weather.daily.temperatureMin[i])}°</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-cyan-200/50">
                      <div className="flex items-center gap-1">
                        <Sunrise className="h-3 w-3" />
                        {formatTime(weather.daily.sunrise[i])}
                      </div>
                      <div className="flex items-center gap-1">
                        <Sunset className="h-3 w-3" />
                        {formatTime(weather.daily.sunset[i])}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex items-center justify-between text-xs text-cyan-200/40 pt-2 border-t border-white/10">
          <span>Data from Open-Meteo</span>
          <span>Location: Nissan Stadium, Nashville TN</span>
        </div>
      </CardContent>
    </Card>
  );
}

export function WeatherAlertBanner() {
  const [alerts, setAlerts] = useState<WeatherAlert[]>([]);

  useEffect(() => {
    const checkAlerts = async () => {
      try {
        const response = await fetch(
          `https://api.weather.gov/alerts/active?point=${NISSAN_STADIUM_COORDS.lat},${NISSAN_STADIUM_COORDS.lng}`
        );
        if (response.ok) {
          const data = await response.json();
          if (data.features && data.features.length > 0) {
            setAlerts(data.features.map((f: any) => ({
              event: f.properties.event,
              severity: f.properties.severity,
              headline: f.properties.headline,
              description: f.properties.description,
              start: f.properties.effective,
              end: f.properties.expires
            })));
          }
        }
      } catch (err) {
        console.log('Could not fetch weather alerts');
      }
    };

    checkAlerts();
    const interval = setInterval(checkAlerts, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (alerts.length === 0) return null;

  const severityColors: Record<string, string> = {
    Minor: 'bg-yellow-500/20 border-yellow-500/50 text-yellow-200',
    Moderate: 'bg-orange-500/20 border-orange-500/50 text-orange-200',
    Severe: 'bg-red-500/20 border-red-500/50 text-red-200',
    Extreme: 'bg-red-600/30 border-red-600/50 text-red-100',
  };

  return (
    <div className="space-y-2" data-testid="weather-alerts">
      {alerts.map((alert, i) => (
        <div
          key={i}
          className={`flex items-start gap-3 p-4 rounded-lg border ${severityColors[alert.severity] || severityColors.Moderate}`}
        >
          <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold flex items-center gap-2">
              {alert.event}
              <Badge variant="outline" className="text-xs">
                {alert.severity}
              </Badge>
            </div>
            <p className="text-sm mt-1 opacity-80">{alert.headline}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
