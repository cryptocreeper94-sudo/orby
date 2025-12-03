import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ModeProvider, useMode } from "@/lib/ModeContext";
import { OnboardingProvider } from "@/lib/OnboardingContext";
import { SandboxBanner } from "@/components/SandboxBanner";
import { SandboxWelcome } from "@/components/SandboxWelcome";
import { OnboardingOverlay, OnboardingHelpButton } from "@/components/OnboardingOverlay";
import { FeatureSlideshow } from "@/components/FeatureSlideshow";
import { FloatingHelpButton } from "@/components/OrbyHelp";
import FloatingWeatherButton from "@/components/FloatingWeatherButton";
import { VersionBadge } from "@/components/VersionBadge";
import NotFound from "@/pages/not-found";
import LoginPage from "@/pages/Login";
import SetPinPage from "@/pages/SetPin";
import FirstTimeRegistration from "@/pages/FirstTimeRegistration";
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
import CommandCenter from "@/pages/CommandCenter";
import ReportingDashboard from "@/pages/ReportingDashboard";
import AlcoholComplianceDashboard from "@/pages/AlcoholComplianceDashboard";
import CheckInAssistantDashboard from "@/pages/CheckInAssistantDashboard";
import TeamManagement from "@/pages/TeamManagement";
import BarScheduler from "@/pages/BarScheduler";
import ItemManagement from "@/pages/ItemManagement";
import StandSetup from "@/pages/StandSetup";
import EventCountSession from "@/pages/EventCountSession";
import DocumentHub from "@/pages/DocumentHub";
import orbyCommanderImg from "@assets/generated_images/orby_commander_nobg.png";

function SandboxContentWrapper({ children }: { children: React.ReactNode }) {
  const { isSandbox } = useMode();
  return (
    <div className={`relative z-10 ${isSandbox ? 'pt-10' : ''}`}>
      {children}
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={LoginPage} />
      <Route path="/set-pin" component={SetPinPage} />
      <Route path="/register" component={FirstTimeRegistration} />
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
      <Route path="/command-center" component={CommandCenter} />
      <Route path="/reports" component={ReportingDashboard} />
      <Route path="/alcohol-compliance" component={AlcoholComplianceDashboard} />
      <Route path="/check-in-assistant" component={CheckInAssistantDashboard} />
      <Route path="/team-management" component={TeamManagement} />
      <Route path="/bar-scheduler" component={BarScheduler} />
      <Route path="/item-management" component={ItemManagement} />
      <Route path="/stand-setup" component={StandSetup} />
      <Route path="/count-session/:standId/:eventDate" component={EventCountSession} />
      <Route path="/document-hub" component={DocumentHub} />
      <Route component={NotFound} />
    </Switch>
  );
}

function TwinklingStars() {
  const stars = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    size: Math.random() * 2 + 0.5,
    delay: `${Math.random() * 4}s`,
    duration: `${Math.random() * 2 + 2}s`,
    opacity: Math.random() * 0.4 + 0.1
  }));

  return (
    <>
      {stars.map(star => (
        <div
          key={star.id}
          className="absolute rounded-full bg-cyan-200 animate-pulse"
          style={{
            left: star.left,
            top: star.top,
            width: `${star.size}px`,
            height: `${star.size}px`,
            animationDelay: star.delay,
            animationDuration: star.duration,
            opacity: star.opacity
          }}
        />
      ))}
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ModeProvider>
        <OnboardingProvider>
          <TooltipProvider>
            <SandboxBanner />
            <SandboxWelcome />
            <OnboardingOverlay />
            <FeatureSlideshow />
            <OnboardingHelpButton />
            <FloatingHelpButton />
            <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
              <TwinklingStars />
              <div className="absolute inset-0 flex items-center justify-center">
                <img 
                  src={orbyCommanderImg} 
                  alt="" 
                  className="w-[65vmin] h-[65vmin] object-contain opacity-[0.06] select-none drop-shadow-[0_0_30px_rgba(6,182,212,0.15)]"
                  aria-hidden="true"
                />
              </div>
            </div>
            <SandboxContentWrapper>
              <Toaster />
              <Router />
              <FloatingWeatherButton />
              <VersionBadge />
            </SandboxContentWrapper>
          </TooltipProvider>
        </OnboardingProvider>
      </ModeProvider>
    </QueryClientProvider>
  );
}

export default App;
