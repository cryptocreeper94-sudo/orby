import { useEffect } from "react";
import { useLocation } from "wouter";
import { useStore } from "@/lib/mockData";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ShieldCheck } from "lucide-react";

const loginSchema = z.object({
  pin: z.string().length(4, "PIN must be 4 digits"),
});

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const login = useStore((state) => state.login);
  const currentUser = useStore((state) => state.currentUser);

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      pin: "",
    },
  });

  useEffect(() => {
    const devBypass = localStorage.getItem("orby_dev_bypass");
    if (devBypass === "true") {
      login("0424");
      setLocation("/dev");
      return;
    }

    if (currentUser) {
      if (currentUser.requiresPinReset) {
        setLocation("/set-pin");
        return;
      }

      if (currentUser.name === 'Developer' || currentUser.pin === '0424') setLocation("/dev");
      else if (currentUser.role === 'Admin') setLocation("/admin");
      else if (currentUser.role === 'IT') setLocation("/it");
      else if (currentUser.role === 'NPOWorker') setLocation("/npo");
      else if (currentUser.role === 'StandLead') setLocation("/standlead");
      else if (currentUser.role === 'StandSupervisor') setLocation("/supervisor");
      else if (currentUser.role === 'ManagementCore' || currentUser.role === 'ManagementAssistant') setLocation("/manager");
      else setLocation("/supervisor");
    }
  }, [currentUser, setLocation, login]);

  async function onSubmit(values: z.infer<typeof loginSchema>) {
    const success = await login(values.pin);
    if (!success) {
      form.setError("pin", { message: "Invalid PIN" });
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-cyan-900 to-slate-800 p-4">
      <div className="flex-1 flex items-center justify-center w-full max-w-md">
        <div className="w-full p-6 rounded-3xl glass-card premium-card">
          {/* Header with Orby Mascot */}
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-40 h-40 mb-6 relative flex items-center justify-center">
              <div className="absolute inset-0 bg-cyan-400/25 rounded-full blur-2xl animate-pulse" />
              <img 
                src="/orby-mascot.png" 
                alt="Orby" 
                className="relative w-36 h-36 object-contain drop-shadow-[0_0_25px_rgba(6,182,212,0.7)]"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  const fallback = e.currentTarget.parentElement?.querySelector('.fallback-icon');
                  if (fallback) fallback.classList.remove('hidden');
                }}
              />
              <div className="hidden fallback-icon absolute w-20 h-20 bg-cyan-500/20 rounded-full flex items-center justify-center border border-cyan-400/30">
                <span className="text-4xl">🪐</span>
              </div>
            </div>
            <h1 className="text-4xl font-black tracking-tight text-white">Orby</h1>
            <p className="text-cyan-200/80 mt-2 text-sm">Operations Communication Platform</p>
            <p className="text-cyan-200/60 mt-1 text-xs">Enter your 4-digit PIN to access</p>
          </div>

          {/* Form */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="pin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="sr-only">PIN</FormLabel>
                    <FormControl>
                      <Input 
                        type="password" 
                        placeholder="0000" 
                        className="text-center text-3xl tracking-[1em] h-16 font-mono border-2 border-white/20 bg-white/10 text-white placeholder:text-white/40 focus:border-cyan-400 focus:ring-cyan-400/50 focus-visible:ring-offset-0" 
                        maxLength={4}
                        {...field} 
                        data-testid="input-pin"
                      />
                    </FormControl>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />
              <Button 
                type="submit" 
                variant="glow"
                className="w-full h-14 text-lg font-bold uppercase tracking-wide btn-sparkle animate-pulse-glow" 
                data-testid="button-login"
              >
                <ShieldCheck className="mr-2 h-5 w-5" /> 
                Verify Identity
              </Button>
              
              <div className="mt-4 text-center">
                <p className="text-[10px] text-cyan-200/50 font-medium">
                  Demo: 1111 · 2222 · 3333 · 4444
                </p>
              </div>
            </form>
          </Form>
        </div>
      </div>

      {/* Footer */}
      <footer className="w-full max-w-md text-center py-6 space-y-2">
        <div className="text-xs text-cyan-200/60 font-medium">
          <span className="font-bold text-cyan-400">Orby</span> by Orbit
        </div>
        <div className="text-[10px] text-cyan-200/40">
          Powered by DarkWave Studios, LLC • © 2025
        </div>
        <div className="pt-2">
          <Button 
            variant="link" 
            size="sm" 
            className="text-xs text-cyan-300/50 h-auto p-0 hover:text-cyan-400" 
            onClick={() => {
              form.setValue("pin", "0424");
            }}
          >
            Developer Access
          </Button>
        </div>
      </footer>
    </div>
  );
}
