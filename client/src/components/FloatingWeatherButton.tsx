import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Loader2, X, Wind, Droplets, Eye, Thermometer, Sunrise, Sunset, ChevronRight } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

import sunnyIcon from "@assets/generated_images/sunny_day_floating_icon.png";
import cloudyDayIcon from "@assets/generated_images/cloudy_day_floating_icon.png";
import rainyDayIcon from "@assets/generated_images/rainy_day_floating_icon.png";
import stormyDayIcon from "@assets/generated_images/stormy_day_floating_icon.png";
import snowyDayIcon from "@assets/generated_images/snowy_day_floating_icon.png";
import foggyDayIcon from "@assets/generated_images/foggy_day_floating_icon.png";
import partlyCloudyDayIcon from "@assets/generated_images/partly_cloudy_day_icon.png";
import clearNightIcon from "@assets/generated_images/clear_night_moon_icon.png";
import partlyCloudyNightIcon from "@assets/generated_images/partly_cloudy_night_icon.png";
import cloudyNightIcon from "@assets/generated_images/cloudy_overcast_night_icon.png";
import rainyNightIcon from "@assets/generated_images/rainy_night_icon.png";
import stormyNightIcon from "@assets/generated_images/stormy_lightning_night_icon.png";
import snowyNightIcon from "@assets/generated_images/snowy_night_icon.png";
import foggyNightIcon from "@assets/generated_images/foggy_misty_night_icon.png";

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

function getWeatherGlow(desc: string, isNight: boolean): string {
  const d = desc.toLowerCase();
  if (d.includes('thunder') || d.includes('storm')) {
    return isNight 
      ? 'shadow-[0_0_30px_rgba(139,92,246,0.8),0_0_60px_rgba(139,92,246,0.5)]' 
      : 'shadow-[0_0_30px_rgba(147,51,234,0.7),0_0_60px_rgba(147,51,234,0.4)]';
  }
  if (d.includes('rain') || d.includes('drizzle') || d.includes('shower')) {
    return isNight 
      ? 'shadow-[0_0_30px_rgba(99,102,241,0.7),0_0_60px_rgba(99,102,241,0.4)]' 
      : 'shadow-[0_0_30px_rgba(59,130,246,0.7),0_0_60px_rgba(59,130,246,0.4)]';
  }
  if (d.includes('snow') || d.includes('sleet') || d.includes('ice')) {
    return isNight 
      ? 'shadow-[0_0_30px_rgba(203,213,225,0.8),0_0_60px_rgba(203,213,225,0.5)]' 
      : 'shadow-[0_0_30px_rgba(226,232,240,0.7),0_0_60px_rgba(226,232,240,0.4)]';
  }
  if (d.includes('cloud') || d.includes('overcast')) {
    return isNight 
      ? 'shadow-[0_0_30px_rgba(100,116,139,0.6),0_0_60px_rgba(100,116,139,0.3)]' 
      : 'shadow-[0_0_30px_rgba(148,163,184,0.6),0_0_60px_rgba(148,163,184,0.3)]';
  }
  if (d.includes('fog') || d.includes('mist') || d.includes('haze')) {
    return isNight 
      ? 'shadow-[0_0_30px_rgba(71,85,105,0.6),0_0_60px_rgba(71,85,105,0.3)]' 
      : 'shadow-[0_0_30px_rgba(100,116,139,0.6),0_0_60px_rgba(100,116,139,0.3)]';
  }
  if (d.includes('clear') || d.includes('sunny') || d.includes('mainly')) {
    return isNight 
      ? 'shadow-[0_0_30px_rgba(129,140,248,0.7),0_0_60px_rgba(129,140,248,0.4)]' 
      : 'shadow-[0_0_30px_rgba(250,204,21,0.8),0_0_60px_rgba(250,204,21,0.5)]';
  }
  return isNight 
    ? 'shadow-[0_0_30px_rgba(99,102,241,0.6),0_0_60px_rgba(99,102,241,0.3)]' 
    : 'shadow-[0_0_30px_rgba(6,182,212,0.6),0_0_60px_rgba(6,182,212,0.3)]';
}

function getGlowGradient(desc: string, isNight: boolean): string {
  const d = desc.toLowerCase();
  if (d.includes('thunder') || d.includes('storm')) {
    return isNight ? 'from-violet-600/40 to-purple-900/30' : 'from-purple-500/30 to-purple-700/20';
  }
  if (d.includes('rain') || d.includes('drizzle') || d.includes('shower')) {
    return isNight ? 'from-indigo-600/40 to-blue-900/30' : 'from-blue-500/30 to-blue-700/20';
  }
  if (d.includes('snow') || d.includes('sleet') || d.includes('ice')) {
    return isNight ? 'from-slate-400/40 to-slate-700/30' : 'from-slate-300/30 to-slate-500/20';
  }
  if (d.includes('cloud') || d.includes('overcast')) {
    return isNight ? 'from-slate-600/40 to-slate-800/30' : 'from-slate-400/30 to-slate-600/20';
  }
  if (d.includes('fog') || d.includes('mist') || d.includes('haze')) {
    return isNight ? 'from-slate-500/30 to-slate-700/20' : 'from-gray-400/30 to-gray-600/20';
  }
  if (d.includes('clear') || d.includes('sunny') || d.includes('mainly')) {
    return isNight ? 'from-indigo-500/40 to-violet-800/30' : 'from-yellow-400/40 to-orange-500/20';
  }
  return isNight ? 'from-indigo-500/30 to-violet-700/20' : 'from-cyan-500/30 to-cyan-700/20';
}

function getWeatherIcon(desc: string, isNight: boolean): string {
  const d = desc.toLowerCase();
  
  if (isNight) {
    if (d.includes('thunder') || d.includes('storm')) return stormyNightIcon;
    if (d.includes('rain') || d.includes('drizzle') || d.includes('shower')) return rainyNightIcon;
    if (d.includes('snow') || d.includes('sleet') || d.includes('ice')) return snowyNightIcon;
    if (d.includes('fog') || d.includes('mist') || d.includes('haze')) return foggyNightIcon;
    if (d.includes('overcast')) return cloudyNightIcon;
    if (d.includes('cloud') || d.includes('partly')) return partlyCloudyNightIcon;
    return clearNightIcon;
  }
  
  if (d.includes('thunder') || d.includes('storm')) return stormyDayIcon;
  if (d.includes('rain') || d.includes('drizzle') || d.includes('shower')) return rainyDayIcon;
  if (d.includes('snow') || d.includes('sleet') || d.includes('ice')) return snowyDayIcon;
  if (d.includes('fog') || d.includes('mist') || d.includes('haze')) return foggyDayIcon;
  if (d.includes('overcast')) return cloudyDayIcon;
  if (d.includes('cloud') || d.includes('partly')) return partlyCloudyDayIcon;
  return sunnyIcon;
}

export default function FloatingWeatherButton() {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const { data: weather, isLoading, error } = useQuery<WeatherData>({
    queryKey: ["/api/weather/coords", NISSAN_STADIUM.lat, NISSAN_STADIUM.lon],
    queryFn: async () => {
      const res = await fetch(`/api/weather/coords/${NISSAN_STADIUM.lat}/${NISSAN_STADIUM.lon}`);
      if (!res.ok) throw new Error('Weather fetch failed');
      return res.json();
    },
    staleTime: 10 * 60 * 1000,
    refetchInterval: 30 * 60 * 1000,
    retry: 2,
  });

  const isNight = weather?.current?.isNight ?? false;
  const description = weather?.current?.description ?? 'Clear sky';
  const glowClass = useMemo(() => weather ? getWeatherGlow(description, isNight) : '', [weather, description, isNight]);
  const gradientClass = useMemo(() => weather ? getGlowGradient(description, isNight) : 'from-cyan-500/30 to-cyan-700/20', [weather, description, isNight]);
  const currentIcon = useMemo(() => getWeatherIcon(description, isNight), [description, isNight]);

  if (error) return null;

  return (
    <>
      <motion.button
        onClick={() => setIsExpanded(true)}
        className="fixed bottom-20 right-4 z-50 cursor-pointer"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.5 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        data-testid="button-weather-toggle"
      >
        {isLoading ? (
          <Loader2 className="w-12 h-12 animate-spin text-cyan-400" />
        ) : (
          <div className="relative w-20 h-20">
            <motion.img
              src={currentIcon}
              alt="Weather"
              className="w-20 h-20 object-contain drop-shadow-[0_0_10px_rgba(6,182,212,0.6)]"
              animate={{
                y: [0, -3, 0],
                rotate: isNight ? [0, 1, -1, 0] : [0, 2, -2, 0],
              }}
              transition={{
                duration: isNight ? 6 : 4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
            {weather && (
              <span className={`absolute bottom-0 left-1/2 -translate-x-1/2 text-base font-bold drop-shadow-[0_0_6px_rgba(0,0,0,1)] ${isNight ? 'text-indigo-100' : 'text-white'}`}>
                {weather.current.temp}°
              </span>
            )}
          </div>
        )}
      </motion.button>

      <AnimatePresence>
        {isExpanded && weather && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center p-4"
            onClick={() => setIsExpanded(false)}
          >
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className={`w-full max-w-md bg-gradient-to-br ${
                isNight ? 'from-slate-900 via-indigo-950 to-slate-900' : 'from-slate-900 via-cyan-950 to-slate-900'
              } rounded-3xl border border-white/10 overflow-hidden ${glowClass}`}
            >
              <div className="relative p-6 pb-4">
                <button
                  onClick={() => setIsExpanded(false)}
                  className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                  data-testid="button-close-weather"
                >
                  <X className="w-4 h-4 text-white/70" />
                </button>

                <div className="flex items-start gap-4">
                  <motion.img
                    src={currentIcon}
                    alt={description}
                    className="w-24 h-24 object-contain drop-shadow-2xl"
                    animate={{
                      y: [0, -5, 0],
                      scale: [1, 1.02, 1],
                    }}
                    transition={{
                      duration: 4,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />
                  <div className="flex-1">
                    <div className="text-5xl font-bold text-white tracking-tight">
                      {weather.current.temp}°
                    </div>
                    <div className="text-lg text-white/80 mt-1">{description}</div>
                    <div className="text-sm text-white/50">
                      Feels like {weather.current.feelsLike}°
                    </div>
                    <div className="text-xs text-cyan-400/70 mt-1">
                      Nissan Stadium
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-3 mt-6">
                  <div className="flex flex-col items-center p-2 rounded-xl bg-white/5">
                    <Wind className="w-4 h-4 text-cyan-400 mb-1" />
                    <span className="text-xs text-white/50">Wind</span>
                    <span className="text-sm font-medium text-white">{weather.current.windSpeed} mph</span>
                    <span className="text-[10px] text-white/40">{weather.current.windDirection}</span>
                  </div>
                  <div className="flex flex-col items-center p-2 rounded-xl bg-white/5">
                    <Droplets className="w-4 h-4 text-blue-400 mb-1" />
                    <span className="text-xs text-white/50">Humidity</span>
                    <span className="text-sm font-medium text-white">{weather.current.humidity}%</span>
                  </div>
                  <div className="flex flex-col items-center p-2 rounded-xl bg-white/5">
                    <Eye className="w-4 h-4 text-white/60 mb-1" />
                    <span className="text-xs text-white/50">Visibility</span>
                    <span className="text-sm font-medium text-white">{weather.current.visibility} mi</span>
                  </div>
                  <div className="flex flex-col items-center p-2 rounded-xl bg-white/5">
                    <Thermometer className="w-4 h-4 text-orange-400 mb-1" />
                    <span className="text-xs text-white/50">UV Index</span>
                    <span className="text-sm font-medium text-white">{weather.current.uvIndex}</span>
                  </div>
                </div>
              </div>

              <div className="px-6 pb-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-medium text-white/60 uppercase tracking-wider">Today</span>
                  <ChevronRight className="w-3 h-3 text-white/40" />
                </div>
                <ScrollArea className="w-full">
                  <div className="flex gap-2 pb-2">
                    {weather.hourly.slice(0, 12).map((hour, i) => (
                      <div
                        key={i}
                        className="flex flex-col items-center min-w-[52px] p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                      >
                        <span className="text-[10px] text-white/50">{hour.time}</span>
                        <span className="text-lg my-1">{hour.icon}</span>
                        <span className="text-sm font-medium text-white">{hour.temp}°</span>
                        {hour.precipitation > 0 && (
                          <span className="text-[10px] text-blue-400">{hour.precipitation}%</span>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>

              <div className="px-6 pb-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-medium text-white/60 uppercase tracking-wider">7-Day Forecast</span>
                  <ChevronRight className="w-3 h-3 text-white/40" />
                </div>
                <div className="space-y-2">
                  {weather.daily.slice(0, 5).map((day, i) => (
                    <div
                      key={i}
                      className={`flex items-center justify-between p-3 rounded-xl ${
                        i === 0 ? 'bg-cyan-500/20 border border-cyan-500/30' : 'bg-white/5'
                      }`}
                    >
                      <span className={`w-12 text-sm font-medium ${i === 0 ? 'text-cyan-300' : 'text-white/70'}`}>
                        {i === 0 ? 'Today' : day.date}
                      </span>
                      <span className="text-lg">{day.icon}</span>
                      <div className="flex items-center gap-1">
                        {day.precipitation > 0 && (
                          <span className="text-xs text-blue-400 mr-2">
                            <Droplets className="w-3 h-3 inline mr-0.5" />
                            {day.precipitation}%
                          </span>
                        )}
                        <span className="text-sm font-semibold text-white">{day.tempHigh}°</span>
                        <span className="text-white/30">/</span>
                        <span className="text-sm text-white/50">{day.tempLow}°</span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-white/40">
                        <span><Sunrise className="w-3 h-3 inline" /> {day.sunrise}</span>
                        <span><Sunset className="w-3 h-3 inline" /> {day.sunset}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
