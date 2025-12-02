import { useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, ChevronRight, X, ExternalLink,
  Sparkles, Zap, Shield, BarChart3, Package, Radio, Users
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useOnboarding, onboardingPages } from '@/lib/OnboardingContext';
import { useMode } from '@/lib/ModeContext';

const iconMap: Record<string, React.ReactNode> = {
  '🌐': <Sparkles className="h-8 w-8" />,
  '🛠️': <Zap className="h-8 w-8" />,
  '🚨': <Shield className="h-8 w-8" />,
  '📊': <BarChart3 className="h-8 w-8" />,
  '🎮': <Package className="h-8 w-8" />,
  '🎉': <Radio className="h-8 w-8" />,
};

export function FeatureSlideshow() {
  const [, setLocation] = useLocation();
  const { isSandbox } = useMode();
  const { isSlideshowOpen, closeSlideshow, resetOnboarding } = useOnboarding();
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = onboardingPages.map(page => ({
    id: page.id,
    icon: page.icon,
    title: page.title,
    description: page.description,
    route: isSandbox && page.sandboxRoute ? page.sandboxRoute : page.route,
    features: page.steps.map(s => s.title)
  }));

  const handlePrev = useCallback(() => {
    setCurrentSlide(prev => (prev > 0 ? prev - 1 : slides.length - 1));
  }, [slides.length]);

  const handleNext = useCallback(() => {
    setCurrentSlide(prev => (prev < slides.length - 1 ? prev + 1 : 0));
  }, [slides.length]);

  const handleNavigate = useCallback((route: string) => {
    closeSlideshow();
    setLocation(route);
  }, [closeSlideshow, setLocation]);

  const handleRestartTour = useCallback(() => {
    closeSlideshow();
    resetOnboarding();
  }, [closeSlideshow, resetOnboarding]);

  if (!isSlideshowOpen) return null;

  const slide = slides[currentSlide];

  const modalContent = (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px',
          touchAction: 'none',
        }}
      >
        <div 
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(8px)',
          }}
          onClick={closeSlideshow}
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          style={{
            position: 'relative',
            zIndex: 10,
            width: '100%',
            maxWidth: '380px',
          }}
        >
          <Card className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-cyan-500/30 shadow-2xl shadow-cyan-500/20 overflow-hidden w-full" data-testid="feature-slideshow">
            <div className="absolute top-0 left-0 right-0 h-1 bg-slate-700">
              <motion.div
                className="h-full bg-gradient-to-r from-cyan-400 to-blue-500"
                initial={{ width: 0 }}
                animate={{ width: `${((currentSlide + 1) / slides.length) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>

            <div className="absolute top-4 right-4 z-10">
              <Button
                variant="ghost"
                size="icon"
                onClick={closeSlideshow}
                className="h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-700"
                data-testid="close-slideshow"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <CardContent className="p-0">
              <div className="relative overflow-hidden">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={slide.id}
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    transition={{ duration: 0.2 }}
                    className="p-8 pt-10"
                  >
                    <div className="flex flex-col items-center text-center">
                      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 flex items-center justify-center mb-4">
                        <span className="text-4xl">{slide.icon}</span>
                      </div>
                      
                      <h2 className="text-2xl font-bold text-white mb-2">{slide.title}</h2>
                      <p className="text-slate-400 text-sm mb-6">{slide.description}</p>

                      <div className="w-full space-y-2 mb-6">
                        {slide.features.slice(0, 4).map((feature, idx) => (
                          <motion.div
                            key={feature}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className="flex items-center gap-2 text-sm text-slate-300 bg-slate-800/50 rounded-lg px-3 py-2"
                          >
                            <Sparkles className="h-3 w-3 text-cyan-400 flex-shrink-0" />
                            {feature}
                          </motion.div>
                        ))}
                      </div>

                      {slide.id !== 'complete' && (
                        <Button
                          onClick={() => handleNavigate(slide.route)}
                          className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white"
                          data-testid={`navigate-${slide.id}`}
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Go to {slide.title}
                        </Button>
                      )}
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>

              <div className="flex items-center justify-between p-4 border-t border-slate-700/50">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handlePrev}
                  className="text-slate-400 hover:text-white hover:bg-slate-700"
                  data-testid="slideshow-prev"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>

                <div className="flex gap-1.5">
                  {slides.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentSlide(idx)}
                      className={`h-2 w-2 rounded-full transition-all ${
                        idx === currentSlide 
                          ? 'bg-cyan-400 w-6' 
                          : 'bg-slate-600 hover:bg-slate-500'
                      }`}
                      data-testid={`slide-dot-${idx}`}
                    />
                  ))}
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleNext}
                  className="text-slate-400 hover:text-white hover:bg-slate-700"
                  data-testid="slideshow-next"
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>

              <div className="px-4 pb-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRestartTour}
                  className="w-full border-slate-600 text-slate-400 hover:bg-slate-700 hover:text-white"
                  data-testid="restart-tour"
                >
                  <Users className="h-4 w-4 mr-2" />
                  Restart Guided Tour
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
}
