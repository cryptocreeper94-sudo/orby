import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import LoginPage from "@/pages/Login";
import SetPinPage from "@/pages/SetPin";
import AdminDashboard from "@/pages/AdminDashboard";
import SupervisorDashboard from "@/pages/SupervisorDashboard";
import ITDashboard from "@/pages/ITDashboard";
import WarehouseDashboard from "@/pages/WarehouseDashboard";
import KitchenDashboard from "@/pages/KitchenDashboard";
import NPODashboard from "@/pages/NPODashboard";
import TempStaffDashboard from "@/pages/TempStaffDashboard";
import StandLeadDashboard from "@/pages/StandLeadDashboard";
import MessagesPage from "@/pages/Messages";
import RosterBuilder from "@/pages/RosterBuilder";
import DevDashboard from "@/pages/DevDashboard";
import ManagerDashboard from "./pages/ManagerDashboard";
import MenuBoardCreator from "@/pages/MenuBoardCreator";
import OpsCommandCenter from "@/pages/OpsCommandCenter";

function Router() {
  return (
    <Switch>
      <Route path="/" component={LoginPage} />
      <Route path="/set-pin" component={SetPinPage} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/supervisor" component={SupervisorDashboard} />
      <Route path="/it" component={ITDashboard} />
      <Route path="/warehouse" component={WarehouseDashboard} />
      <Route path="/kitchen" component={KitchenDashboard} />
      <Route path="/npo" component={NPODashboard} />
      <Route path="/temp" component={TempStaffDashboard} />
      <Route path="/standlead" component={StandLeadDashboard} />
      <Route path="/warehouse-manager" component={ManagerDashboard} />
      <Route path="/kitchen-manager" component={ManagerDashboard} />
      <Route path="/operations" component={ManagerDashboard} />
      <Route path="/manager" component={ManagerDashboard} />
      <Route path="/executive" component={ManagerDashboard} />
      <Route path="/dev" component={DevDashboard} />
      <Route path="/messages" component={MessagesPage} />
      <Route path="/roster-builder" component={RosterBuilder} />
      <Route path="/menu-board-creator" component={MenuBoardCreator} />
      <Route path="/ops-command" component={OpsCommandCenter} />
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
