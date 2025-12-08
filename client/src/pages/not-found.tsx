import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Home, Compass } from "lucide-react";
import {
  AnimatedBackground,
  GlassCard,
  GlassCardContent,
  GlowButton
} from "@/components/ui/premium";

export default function NotFound() {
  const [, setLocation] = useLocation();

  return (
    <AnimatedBackground>
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <GlassCard gradient glow className="text-center">
            <GlassCardContent className="py-12">
              <motion.div 
                className="w-24 h-24 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 mx-auto mb-6 flex items-center justify-center"
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
              >
                <Compass className="h-12 w-12 text-cyan-400" />
              </motion.div>
              
              <motion.h1 
                className="text-7xl font-black bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent mb-4"
                initial={{ scale: 0.5 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", bounce: 0.5 }}
              >
                404
              </motion.h1>
              
              <h2 className="text-2xl font-bold text-white mb-3" data-testid="text-page-not-found">
                Page Not Found
              </h2>
              
              <p className="text-slate-400 mb-8">
                Looks like you've ventured into uncharted territory. The page you're looking for doesn't exist or has been moved.
              </p>

              <GlowButton
                onClick={() => setLocation("/")}
                variant="cyan"
                className="px-8"
                data-testid="button-back-home"
              >
                <Home className="h-5 w-5" />
                Back to Home
              </GlowButton>
            </GlassCardContent>
          </GlassCard>
        </motion.div>

        <footer className="mt-8 text-center">
          <div className="text-xs text-slate-600">
            Powered by <span className="font-bold text-cyan-500">DarkWave Studios, LLC</span>
          </div>
        </footer>
      </div>
    </AnimatedBackground>
  );
}
