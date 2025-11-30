import { useState } from "react";
import { useLocation } from "wouter";
import { useStore } from "@/lib/mockData";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ShieldCheck, KeyRound, AlertCircle } from "lucide-react";
import { INITIAL_PINS } from "@shared/schema";

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
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-blue-100 p-4">
      <Card className="w-full max-w-md border-none shadow-2xl bg-white/90 backdrop-blur-sm">
        <CardHeader className="space-y-1 flex flex-col items-center text-center pb-2">
          <div className="w-20 h-20 bg-amber-100 rounded-2xl flex items-center justify-center mb-4 shadow-inner">
            <KeyRound className="w-10 h-10 text-amber-600 drop-shadow-md" />
          </div>
          <CardTitle className="text-2xl font-black tracking-tight text-slate-800">
            Set Your Personal PIN
          </CardTitle>
          <CardDescription className="text-base">
            Welcome, {currentUser.name}!
          </CardDescription>
          <p className="text-sm text-muted-foreground mt-2">
            As a {getRoleTitle()}, you need to set your own 4-digit PIN to continue.
          </p>
        </CardHeader>
        <CardContent>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-6 flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800">
              <strong>First-time login:</strong> Your initial PIN ({initialPin}) must be changed for security.
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="newPin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New PIN</FormLabel>
                    <FormControl>
                      <Input 
                        type="password" 
                        placeholder="••••" 
                        className="text-center text-2xl tracking-[0.5em] h-14 font-mono border-2" 
                        maxLength={4}
                        {...field} 
                        data-testid="input-new-pin"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="confirmPin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm PIN</FormLabel>
                    <FormControl>
                      <Input 
                        type="password" 
                        placeholder="••••" 
                        className="text-center text-2xl tracking-[0.5em] h-14 font-mono border-2" 
                        maxLength={4}
                        {...field} 
                        data-testid="input-confirm-pin"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {error && (
                <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                  {error}
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full h-14 text-lg font-bold btn-3d uppercase tracking-wide"
                disabled={isSubmitting}
                data-testid="button-set-pin"
              >
                <ShieldCheck className="mr-2 h-5 w-5" /> 
                {isSubmitting ? 'Setting PIN...' : 'Set My PIN'}
              </Button>
            </form>
          </Form>

          <p className="text-xs text-center text-muted-foreground mt-6">
            You will need to log in again with your new PIN after setting it.
          </p>
        </CardContent>
      </Card>

      <footer className="w-full max-w-md text-center py-6">
        <div className="text-xs text-slate-500">
          Powered by <span className="font-bold text-blue-600">DarkWave Studios, LLC</span>
        </div>
      </footer>
    </div>
  );
}
