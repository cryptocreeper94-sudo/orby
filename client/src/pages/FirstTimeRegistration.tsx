import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { 
  UserPlus, 
  KeyRound, 
  MapPin, 
  AlertTriangle, 
  CheckCircle2, 
  Loader2,
  Building2,
  Shield
} from 'lucide-react';
import { 
  useGeolocation, 
  isWithinGeofence,
  STADIUM_LOCATION,
  GEOFENCE_RADIUS_FEET 
} from '@/components/LocationAcknowledgement';
import { toast } from 'sonner';
import {
  AnimatedBackground,
  GlassCard,
  GlassCardHeader,
  GlassCardContent,
  GlowButton
} from '@/components/ui/premium';

const DEPARTMENTS = [
  { id: 'Warehouse', label: 'Warehouse', description: 'Inventory, deliveries, stock management' },
  { id: 'Kitchen', label: 'Kitchen', description: 'Food prep, culinary operations' },
  { id: 'Bar', label: 'Bar', description: 'Beverage service, bartending' },
  { id: 'Operations', label: 'Operations', description: 'General operations support' },
  { id: 'IT', label: 'IT', description: 'Technology support' },
  { id: 'HR', label: 'HR', description: 'Human resources' },
];

const registrationSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  department: z.string().min(1, 'Please select a department'),
  newPin: z.string().length(4, 'PIN must be 4 digits').regex(/^\d{4}$/, 'PIN must be 4 digits'),
  confirmPin: z.string().length(4, 'PIN must be 4 digits'),
}).refine((data) => data.newPin === data.confirmPin, {
  message: "PINs don't match",
  path: ['confirmPin'],
}).refine((data) => data.newPin !== '9999', {
  message: "Cannot use the registration PIN as your personal PIN",
  path: ['newPin'],
});

export default function FirstTimeRegistration() {
  const [, setLocation] = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState<'geofence' | 'form' | 'success'>('geofence');
  const [geofenceChecked, setGeofenceChecked] = useState(false);
  
  const { location: gpsLocation, error: gpsError, isLoading: gpsLoading, requestLocation } = useGeolocation();

  const form = useForm<z.infer<typeof registrationSchema>>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      name: '',
      department: '',
      newPin: '',
      confirmPin: '',
    },
  });

  useEffect(() => {
    if (gpsLocation && !geofenceChecked) {
      const isInside = isWithinGeofence(
        gpsLocation.coords.latitude,
        gpsLocation.coords.longitude,
        STADIUM_LOCATION.lat,
        STADIUM_LOCATION.lng,
        GEOFENCE_RADIUS_FEET
      );
      
      if (isInside) {
        setStep('form');
        setGeofenceChecked(true);
      } else {
        toast.error('You must be at Nissan Stadium to register');
        setTimeout(() => setLocation('/'), 2000);
      }
    }
  }, [gpsLocation, geofenceChecked, setLocation]);

  async function onSubmit(values: z.infer<typeof registrationSchema>) {
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/auth/register-staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: values.name,
          department: values.department,
          pin: values.newPin,
          gpsCoords: gpsLocation ? {
            lat: gpsLocation.coords.latitude,
            lng: gpsLocation.coords.longitude,
            accuracy: gpsLocation.coords.accuracy,
            timestamp: gpsLocation.timestamp
          } : null
        }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Registration failed');
      }
      
      setStep('success');
      toast.success('Registration successful! Please log in with your new PIN.');
      
      setTimeout(() => {
        setLocation('/');
      }, 3000);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Registration failed');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AnimatedBackground>
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <AnimatePresence mode="wait">
          {step === 'geofence' && (
            <motion.div
              key="geofence"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full max-w-md"
            >
              <GlassCard gradient glow className="text-center">
                <GlassCardContent className="py-12">
                  <motion.div 
                    className="w-24 h-24 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 mx-auto mb-6 flex items-center justify-center"
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                  >
                    <MapPin className="h-12 w-12 text-cyan-400" />
                  </motion.div>
                  
                  <h2 className="text-2xl font-bold text-white mb-3">Location Check</h2>
                  <p className="text-slate-400 mb-6">
                    First-time registration requires you to be at Nissan Stadium.
                  </p>
                  
                  {gpsLoading ? (
                    <div className="flex items-center justify-center gap-3 text-cyan-400">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Checking your location...</span>
                    </div>
                  ) : gpsError ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-center gap-2 text-amber-400">
                        <AlertTriangle className="h-5 w-5" />
                        <span>Could not access location</span>
                      </div>
                      <GlowButton onClick={requestLocation} variant="cyan" data-testid="button-enable-location">
                        <MapPin className="h-4 w-4" />
                        Enable Location Access
                      </GlowButton>
                    </div>
                  ) : !gpsLocation ? (
                    <GlowButton onClick={requestLocation} variant="cyan" data-testid="button-verify-location">
                      <MapPin className="h-4 w-4" />
                      Verify My Location
                    </GlowButton>
                  ) : null}
                  
                  <p className="text-xs text-slate-500 mt-8">
                    Your location is only used to verify you're on-site and is not stored.
                  </p>
                </GlassCardContent>
              </GlassCard>
            </motion.div>
          )}

          {step === 'form' && (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full max-w-md"
            >
              <GlassCard gradient glow>
                <GlassCardHeader className="text-center pb-2">
                  <motion.div 
                    className="w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 mx-auto mb-4 flex items-center justify-center shadow-lg shadow-cyan-500/30"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1, rotate: [0, -5, 5, 0] }}
                    transition={{ delay: 0.2 }}
                  >
                    <UserPlus className="h-10 w-10 text-white" />
                  </motion.div>
                  <h2 className="text-2xl font-bold text-white">Welcome to Orby</h2>
                  <p className="text-sm text-slate-400 mt-2">Create your account to get started</p>
                </GlassCardHeader>
                
                <GlassCardContent>
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 mb-6">
                    <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0" />
                    <span className="text-sm text-emerald-300">Location verified - Nissan Stadium</span>
                  </div>
                  
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-slate-300">Your Name</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Enter your full name"
                                className="bg-slate-800/50 border-white/10 text-white placeholder:text-slate-500"
                                data-testid="input-name"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage className="text-red-400" />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="department"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-slate-300">Department</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger 
                                  className="bg-slate-800/50 border-white/10 text-white"
                                  data-testid="select-department"
                                >
                                  <SelectValue placeholder="Select your department" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {DEPARTMENTS.map((dept) => (
                                  <SelectItem key={dept.id} value={dept.id}>
                                    <div className="flex items-center gap-2">
                                      <Building2 className="h-4 w-4 text-cyan-400" />
                                      <span>{dept.label}</span>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage className="text-red-400" />
                          </FormItem>
                        )}
                      />

                      <div className="pt-2">
                        <div className="flex items-center gap-2 mb-4">
                          <KeyRound className="h-4 w-4 text-cyan-400" />
                          <span className="text-sm text-slate-300 font-medium">Create Your Personal PIN</span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="newPin"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-slate-400 text-xs">New PIN</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="password"
                                    placeholder="••••"
                                    className="text-center text-2xl tracking-[0.5em] h-14 font-mono bg-slate-800/50 border-white/10 text-white"
                                    maxLength={4}
                                    data-testid="input-new-pin"
                                    {...field} 
                                  />
                                </FormControl>
                                <FormMessage className="text-red-400 text-xs" />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="confirmPin"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-slate-400 text-xs">Confirm PIN</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="password"
                                    placeholder="••••"
                                    className="text-center text-2xl tracking-[0.5em] h-14 font-mono bg-slate-800/50 border-white/10 text-white"
                                    maxLength={4}
                                    data-testid="input-confirm-pin"
                                    {...field} 
                                  />
                                </FormControl>
                                <FormMessage className="text-red-400 text-xs" />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>

                      <div className="pt-4">
                        <GlowButton
                          type="submit"
                          variant="cyan"
                          disabled={isSubmitting}
                          className="w-full h-14 text-lg"
                          data-testid="button-register"
                        >
                          {isSubmitting ? (
                            <>
                              <Loader2 className="h-5 w-5 animate-spin" />
                              Creating Account...
                            </>
                          ) : (
                            <>
                              <Shield className="h-5 w-5" />
                              Create My Account
                            </>
                          )}
                        </GlowButton>
                      </div>
                    </form>
                  </Form>

                  <Button
                    variant="ghost"
                    onClick={() => setLocation('/')}
                    className="w-full mt-4 text-slate-500 hover:text-slate-300"
                    data-testid="button-back-to-login"
                  >
                    Back to Login
                  </Button>
                </GlassCardContent>
              </GlassCard>
            </motion.div>
          )}

          {step === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-md"
            >
              <GlassCard gradient glow className="text-center">
                <GlassCardContent className="py-12">
                  <motion.div 
                    className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 mx-auto mb-6 flex items-center justify-center shadow-lg shadow-emerald-500/30"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', bounce: 0.5 }}
                  >
                    <CheckCircle2 className="h-12 w-12 text-white" />
                  </motion.div>
                  
                  <h2 className="text-2xl font-bold text-white mb-3">Welcome Aboard!</h2>
                  <p className="text-slate-400 mb-6">
                    Your account has been created successfully. Redirecting to login...
                  </p>
                  
                  <div className="flex items-center justify-center gap-2 text-emerald-400">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Redirecting...</span>
                  </div>
                </GlassCardContent>
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>

        <footer className="mt-8 text-center">
          <div className="text-xs text-slate-600">
            Powered by <span className="font-bold text-cyan-500">DarkWave Studios, LLC</span>
          </div>
        </footer>
      </div>
    </AnimatedBackground>
  );
}
