import { useEffect } from "react";
import { useLocation } from "wouter";
import { useStore } from "@/lib/mockData";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ShieldCheck, LayoutDashboard } from "lucide-react";

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
    // Check for Dev Auto-Bypass
    const devBypass = localStorage.getItem("stadiumops_dev_bypass");
    if (devBypass === "true") {
      login("0424"); // Auto-login as dev
      setLocation("/dev");
      return;
    }

    if (currentUser) {
      // Check if user needs to reset their PIN first
      if (currentUser.requiresPinReset) {
        setLocation("/set-pin");
        return;
      }

      // Route based on role with new hierarchy
      if (currentUser.role === 'Developer') setLocation("/dev");
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
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 p-4">
      <div className="flex-1 flex items-center justify-center w-full max-w-md">
        <div className="w-full p-8 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 shadow-2xl">
          {/* Header */}
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-20 h-20 bg-blue-500/20 rounded-2xl flex items-center justify-center mb-6 border border-blue-400/30">
              <LayoutDashboard className="w-10 h-10 text-blue-400 drop-shadow-md" />
            </div>
            <h1 className="text-3xl font-black tracking-tight text-white">StadiumOps</h1>
            <p className="text-blue-200/80 mt-2">Enter your 4-digit PIN to access the system</p>
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
                        className="text-center text-3xl tracking-[1em] h-16 font-mono border-2 border-white/20 bg-white/10 text-white placeholder:text-white/40 focus:border-blue-400 focus:ring-blue-400/50 focus-visible:ring-offset-0" 
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
                className="w-full h-14 text-lg font-bold uppercase tracking-wide bg-blue-600/80 hover:bg-blue-500 text-white border border-blue-400/30 shadow-lg shadow-blue-500/20" 
                data-testid="button-login"
              >
                <ShieldCheck className="mr-2 h-5 w-5" /> 
                Verify Identity
              </Button>
              
              <div className="mt-6 text-center">
                <p className="text-xs text-blue-200/60 font-medium bg-white/5 py-2 px-3 rounded-lg border border-white/10">
                  Demo PINs: NPO: 1111 | Stand Lead: 2222 | Supervisor: 3333 | Mgmt: 4444
                </p>
              </div>
            </form>
          </Form>
        </div>
      </div>

      {/* Footer */}
      <footer className="w-full max-w-md text-center py-6 space-y-2">
        <div className="text-xs text-blue-200/60 font-medium">
          Powered by <span className="font-bold text-blue-400">DarkWave Studios, LLC</span>
        </div>
        <div className="text-[10px] text-blue-200/40">
          Copyright © 2025 All Rights Reserved
        </div>
        <div className="pt-2">
          <Button 
            variant="link" 
            size="sm" 
            className="text-xs text-blue-300/50 h-auto p-0 hover:text-blue-400" 
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
