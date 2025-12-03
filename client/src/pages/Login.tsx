import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useStore } from "@/lib/mockData";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ShieldCheck, FlaskConical, Radio } from "lucide-react";
import { useMode } from "@/lib/ModeContext";
import { ModeGate } from "@/components/ModeGate";
import { CompactModeIndicator } from "@/components/GlobalModeBar";

const loginSchema = z.object({
  pin: z.string().length(4, "PIN must be 4 digits"),
});

const MODE_SELECTED_KEY = 'orby_mode_selected';

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const login = useStore((state) => state.login);
  const currentUser = useStore((state) => state.currentUser);
  const { enterSandbox, isSandbox } = useMode();
  const [modeSelected, setModeSelected] = useState(() => {
    return sessionStorage.getItem(MODE_SELECTED_KEY) === 'true';
  });

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

      const role = currentUser.role as string;
      const department = currentUser.department as string | undefined;
      
      if (currentUser.name === 'Developer' || currentUser.pin === '0424') setLocation("/dev");
      else if (role === 'OperationsManager' || role === 'GeneralManager' || role === 'RegionalVP') setLocation("/command-center");
      else if (role === 'Admin') setLocation("/admin");
      else if (role === 'IT') setLocation("/it");
      else if (role === 'StandLead') setLocation("/standlead");
      else if (role === 'StandSupervisor' || role === 'Supervisor') setLocation("/supervisor");
      else if (role === 'AlcoholCompliance') setLocation("/alcohol-compliance");
      else if (role === 'CheckInAssistant') setLocation("/check-in-assistant");
      else if (role === 'ManagementCore' || role === 'ManagementAssistant' || role === 'OperationsAssistant') setLocation("/manager");
      // For workers (NPOWorker), route by department if set
      else if (role === 'NPOWorker' || role === 'NPO') {
        if (department === 'Warehouse') setLocation("/warehouse");
        else if (department === 'Kitchen') setLocation("/kitchen");
        else if (department === 'Bar') setLocation("/npo"); // Bar workers use NPO dashboard until bar-specific is built
        else if (department === 'Operations') setLocation("/operations"); // Operations workers
        else if (department === 'IT') setLocation("/it");
        else if (department === 'HR') setLocation("/manager"); // HR assistants go to manager view
        else setLocation("/npo"); // Default NPO dashboard for unassigned
      }
      else if (role === 'Warehouse' || role === 'WarehouseManager' || role === 'WarehouseWorker') setLocation("/warehouse");
      else if (role === 'Kitchen' || role === 'KitchenManager' || role === 'KitchenWorker') setLocation("/kitchen");
      else setLocation("/supervisor");
    }
  }, [currentUser, setLocation, login]);

  async function onSubmit(values: z.infer<typeof loginSchema>) {
    if (values.pin === '9999') {
      setLocation('/register');
      return;
    }
    
    const success = await login(values.pin);
    if (!success) {
      form.setError("pin", { message: "Invalid PIN" });
    }
  }

  const handleModeSelected = () => {
    setModeSelected(true);
    sessionStorage.setItem(MODE_SELECTED_KEY, 'true');
  };

  if (!modeSelected) {
    return <ModeGate onModeSelected={handleModeSelected} />;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-cyan-900 to-slate-800 p-4">
      <div className="absolute top-4 left-4 right-4 flex justify-between items-center">
        <CompactModeIndicator />
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            sessionStorage.removeItem(MODE_SELECTED_KEY);
            setModeSelected(false);
          }}
          className="text-cyan-300/70 hover:text-cyan-300 hover:bg-cyan-500/10 text-xs"
          data-testid="button-change-mode"
        >
          Change Mode
        </Button>
      </div>
      <div className="flex-1 flex items-center justify-center w-full max-w-md">
        <div className="w-full p-6 rounded-3xl glass-card premium-card">
          {/* Header with Orby Mascot */}
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-64 h-64 mb-4 relative flex items-center justify-center">
              {/* Starfield background */}
              <div className="absolute inset-0 overflow-hidden rounded-full">
                {/* Twinkling stars */}
                <div className="star absolute w-1 h-1 bg-white rounded-full top-[15%] left-[20%] animate-twinkle" style={{animationDelay: '0s'}} />
                <div className="star absolute w-0.5 h-0.5 bg-cyan-200 rounded-full top-[25%] left-[75%] animate-twinkle" style={{animationDelay: '0.5s'}} />
                <div className="star absolute w-1.5 h-1.5 bg-white rounded-full top-[10%] left-[50%] animate-twinkle" style={{animationDelay: '1s'}} />
                <div className="star absolute w-0.5 h-0.5 bg-cyan-300 rounded-full top-[40%] left-[10%] animate-twinkle" style={{animationDelay: '1.5s'}} />
                <div className="star absolute w-1 h-1 bg-white rounded-full top-[70%] left-[85%] animate-twinkle" style={{animationDelay: '0.3s'}} />
                <div className="star absolute w-0.5 h-0.5 bg-white rounded-full top-[80%] left-[25%] animate-twinkle" style={{animationDelay: '0.8s'}} />
                <div className="star absolute w-1 h-1 bg-cyan-200 rounded-full top-[55%] left-[90%] animate-twinkle" style={{animationDelay: '1.2s'}} />
                <div className="star absolute w-0.5 h-0.5 bg-white rounded-full top-[85%] left-[60%] animate-twinkle" style={{animationDelay: '0.7s'}} />
                <div className="star absolute w-1.5 h-1.5 bg-cyan-100 rounded-full top-[20%] left-[5%] animate-twinkle" style={{animationDelay: '1.8s'}} />
                <div className="star absolute w-0.5 h-0.5 bg-white rounded-full top-[45%] left-[95%] animate-twinkle" style={{animationDelay: '0.2s'}} />
                <div className="star absolute w-1 h-1 bg-white rounded-full top-[5%] left-[35%] animate-twinkle" style={{animationDelay: '1.4s'}} />
                <div className="star absolute w-0.5 h-0.5 bg-cyan-200 rounded-full top-[90%] left-[45%] animate-twinkle" style={{animationDelay: '0.6s'}} />
                <div className="star absolute w-1 h-1 bg-white rounded-full top-[65%] left-[15%] animate-twinkle" style={{animationDelay: '1.1s'}} />
                <div className="star absolute w-1.5 h-1.5 bg-white rounded-full top-[35%] left-[80%] animate-twinkle" style={{animationDelay: '0.4s'}} />
                <div className="star absolute w-0.5 h-0.5 bg-cyan-300 rounded-full top-[75%] left-[5%] animate-twinkle" style={{animationDelay: '1.6s'}} />
              </div>
              {/* Glowing aura */}
              <div className="absolute inset-0 bg-cyan-400/25 rounded-full blur-3xl animate-pulse" />
              <div className="absolute inset-4 bg-cyan-500/15 rounded-full blur-2xl animate-pulse" style={{animationDelay: '0.5s'}} />
              {/* Orby mascot */}
              <img 
                src="/orby-mascot.png" 
                alt="Orby" 
                className="relative w-52 h-52 object-contain drop-shadow-[0_0_35px_rgba(6,182,212,0.8)] z-10"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  const fallback = e.currentTarget.parentElement?.querySelector('.fallback-icon');
                  if (fallback) fallback.classList.remove('hidden');
                }}
              />
              <div className="hidden fallback-icon absolute w-20 h-20 bg-cyan-500/20 rounded-full flex items-center justify-center border border-cyan-400/30 z-10">
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
              
              <div className="mt-6 pt-4 border-t border-white/10">
                <Button 
                  type="button"
                  variant="outline"
                  className="w-full h-10 border-cyan-500/50 bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20 hover:border-cyan-400"
                  onClick={() => {
                    form.setValue("pin", "0424");
                    setTimeout(() => form.handleSubmit(onSubmit)(), 100);
                  }}
                  data-testid="button-dev-login"
                >
                  <ShieldCheck className="mr-2 h-4 w-4" />
                  Quick Dev Access
                </Button>
              </div>
              
              <div className="mt-4 text-center">
                <p className="text-[10px] text-cyan-200/50 font-medium">
                  Demo: 1111 · 2222 · 3333 · 4444 · 5555 · 6666
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
      </footer>
    </div>
  );
}
