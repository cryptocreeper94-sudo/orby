import { useState } from "react";
import { useLocation } from "wouter";
import { useStore } from "@/lib/mockData";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ShieldCheck, KeyRound, AlertCircle, Loader2 } from "lucide-react";
import { INITIAL_PINS } from "@shared/schema";
import { motion } from "framer-motion";
import {
  AnimatedBackground,
  GlassCard,
  GlassCardHeader,
  GlassCardContent,
  GlowButton
} from "@/components/ui/premium";

const setPinSchema = z.object({
  newPin: z.string().length(4, "PIN must be 4 digits").regex(/^\d{4}$/, "PIN must be 4 digits"),
  confirmPin: z.string().length(4, "PIN must be 4 digits"),
}).refine((data) => data.newPin === data.confirmPin, {
  message: "PINs don't match",
  path: ["confirmPin"],
});

export default function SetPinPage() {
  const [, setLocation] = useLocation();
  const currentUser = useStore((state) => state.currentUser);
  const logout = useStore((state) => state.logout);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof setPinSchema>>({
    resolver: zodResolver(setPinSchema),
    defaultValues: {
      newPin: "",
      confirmPin: "",
    },
  });

  if (!currentUser) {
    setLocation("/");
    return null;
  }

  const initialPin = INITIAL_PINS[currentUser.role] || '0000';
  const userId = currentUser.id;

  async function onSubmit(values: z.infer<typeof setPinSchema>) {
    setError(null);
    
    if (values.newPin === initialPin) {
      setError("New PIN cannot be the same as your initial PIN");
      return;
    }
    
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/users/reset-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userId,
          newPin: values.newPin
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to set PIN');
      }

      logout();
      setLocation("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to set PIN');
    } finally {
      setIsSubmitting(false);
    }
  }

  const getRoleTitle = () => {
    switch (currentUser.role) {
      case 'NPOWorker': return 'NPO Worker';
      case 'StandLead': return 'Stand Lead';
      case 'StandSupervisor': return 'Supervisor';
      case 'ManagementCore': return 'Management';
      case 'ManagementAssistant': return 'Management Assistant';
      default: return currentUser.role;
    }
  };

  return (
    <AnimatedBackground>
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <GlassCard gradient glow>
            <GlassCardHeader className="text-center pb-2">
              <motion.div 
                className="w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-500 to-teal-500 mx-auto mb-4 flex items-center justify-center shadow-lg shadow-cyan-500/30"
                initial={{ scale: 0 }}
                animate={{ scale: 1, rotate: [0, -5, 5, 0] }}
                transition={{ delay: 0.2 }}
              >
                <KeyRound className="h-10 w-10 text-white drop-shadow-md" />
              </motion.div>
              <h2 className="text-2xl font-bold text-white">Set Your Personal PIN</h2>
              <p className="text-sm text-slate-400 mt-2">Welcome, {currentUser.name}!</p>
              <p className="text-xs text-slate-500 mt-1">
                As a {getRoleTitle()}, you need to set your own 4-digit PIN to continue.
              </p>
            </GlassCardHeader>
            
            <GlassCardContent>
              <div className="flex items-start gap-2 p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/30 mb-6">
                <AlertCircle className="h-5 w-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-cyan-300">
                  <strong>First-time login:</strong> Your initial PIN ({initialPin}) must be changed for security.
                </div>
              </div>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                  <FormField
                    control={form.control}
                    name="newPin"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-300">New PIN</FormLabel>
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
                        <FormMessage className="text-red-400" />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="confirmPin"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-300">Confirm PIN</FormLabel>
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
                        <FormMessage className="text-red-400" />
                      </FormItem>
                    )}
                  />

                  {error && (
                    <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 p-3 rounded-lg" data-testid="text-error">
                      {error}
                    </div>
                  )}

                  <div className="pt-2">
                    <GlowButton
                      type="submit"
                      variant="cyan"
                      disabled={isSubmitting}
                      className="w-full h-14 text-lg"
                      data-testid="button-set-pin"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin" />
                          Setting PIN...
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="h-5 w-5" />
                          Set My PIN
                        </>
                      )}
                    </GlowButton>
                  </div>
                </form>
              </Form>

              <p className="text-xs text-center text-slate-500 mt-6">
                You will need to log in again with your new PIN after setting it.
              </p>
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
