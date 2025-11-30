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
    if (currentUser) {
      if (currentUser.role === 'Admin') setLocation("/admin");
      else if (currentUser.role === 'IT') setLocation("/it");
      else setLocation("/supervisor");
    }
  }, [currentUser, setLocation]);

  function onSubmit(values: z.infer<typeof loginSchema>) {
    const success = login(values.pin);
    if (!success) {
      form.setError("pin", { message: "Invalid PIN" });
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-900 p-4">
      <Card className="w-full max-w-md border-none shadow-xl">
        <CardHeader className="space-y-1 flex flex-col items-center text-center pb-2">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <LayoutDashboard className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">StadiumOps</CardTitle>
          <CardDescription>Enter your 4-digit PIN to access the system</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                        className="text-center text-2xl tracking-[1em] h-14 font-mono" 
                        maxLength={4}
                        {...field} 
                        data-testid="input-pin"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full h-12 text-lg font-medium" data-testid="button-login">
                <ShieldCheck className="mr-2 h-5 w-5" /> 
                Verify Identity
              </Button>
              
              <div className="mt-6 text-center">
                 <p className="text-xs text-muted-foreground">Demo PINs: Admin: 1234 | Supervisor: 5678 | IT: 9999</p>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
