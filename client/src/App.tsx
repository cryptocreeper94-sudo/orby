import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import LoginPage from "@/pages/Login";
import AdminDashboard from "@/pages/AdminDashboard";
import SupervisorDashboard from "@/pages/SupervisorDashboard";
import ITDashboard from "@/pages/ITDashboard";
import MessagesPage from "@/pages/Messages";
import RosterBuilder from "@/pages/RosterBuilder";
import DevDashboard from "@/pages/DevDashboard";

function Router() {
  return (
    <Switch>
      <Route path="/" component={LoginPage} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/supervisor" component={SupervisorDashboard} />
      <Route path="/it" component={ITDashboard} />
      <Route path="/dev" component={DevDashboard} />
      <Route path="/messages" component={MessagesPage} />
      <Route path="/roster-builder" component={RosterBuilder} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
