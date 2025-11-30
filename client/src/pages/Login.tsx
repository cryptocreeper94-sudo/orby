import { useEffect } from "react";
import { useLocation } from "wouter";
import { useStore } from "@/lib/mockData";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 transition-colors duration-300">
      <div className="flex-1 flex items-center justify-center w-full max-w-md">
        <Card className="w-full border-none shadow-2xl bg-card/80 backdrop-blur-sm">
          <CardHeader className="space-y-1 flex flex-col items-center text-center pb-2">
            <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 shadow-inner">
              <LayoutDashboard className="w-10 h-10 text-primary drop-shadow-md" />
            </div>
            <CardTitle className="text-3xl font-black tracking-tight text-primary">StadiumOps</CardTitle>
            <CardDescription className="text-base">Enter your 4-digit PIN to access the system</CardDescription>
          </CardHeader>
          <CardContent>
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
                          className="text-center text-3xl tracking-[1em] h-16 font-mono border-2 focus-visible:ring-offset-2 shadow-inner bg-slate-50 dark:bg-slate-900" 
                          maxLength={4}
                          {...field} 
                          data-testid="input-pin"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full h-14 text-lg font-bold btn-3d btn-glow uppercase tracking-wide" data-testid="button-login">
                  <ShieldCheck className="mr-2 h-5 w-5" /> 
                  Verify Identity
                </Button>
                
                <div className="mt-6 text-center space-y-2">
                   <p className="text-xs text-muted-foreground font-medium bg-slate-100 dark:bg-slate-800 py-2 px-3 rounded-lg">Demo PINs: NPO: 1111 | Stand Lead: 2222 | Supervisor: 3333 | Mgmt: 4444</p>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <footer className="w-full max-w-md text-center py-6 space-y-2">
        <div className="text-xs text-muted-foreground font-medium">
          Powered by <span className="font-bold text-primary">DarkWave Studios, LLC</span>
        </div>
        <div className="text-[10px] text-slate-400">
          Copyright © 2025 All Rights Reserved
        </div>
        <div className="pt-2">
          <Button variant="link" size="sm" className="text-xs text-slate-300 h-auto p-0 hover:text-primary" onClick={() => {
             form.setValue("pin", "0424");
             // Optional: automatically submit or let them click
          }}>
            Developer Access
          </Button>
        </div>
      </footer>
    </div>
  );
}
