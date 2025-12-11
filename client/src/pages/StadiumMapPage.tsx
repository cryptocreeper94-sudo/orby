import { useLocation } from "wouter";
import { InteractiveMap } from "@/components/InteractiveMap";
import { AnimatedBackground, PageHeader } from "@/components/ui/premium";
import { GlobalModeBar } from "@/components/GlobalModeBar";
import { Map } from "lucide-react";
import { useStore } from "@/lib/mockData";

export default function StadiumMapPage() {
  const [, navigate] = useLocation();
  const { currentUser, logout } = useStore();

  const handleBack = () => {
    if (currentUser?.role) {
      const roleRoutes: Record<string, string> = {
        'Admin': '/admin',
        'Supervisor': '/supervisor',
        'OperationsManager': '/manager',
        'WarehouseManager': '/warehouse',
        'KitchenManager': '/kitchen',
        'StandLead': '/standlead',
        'NPOLead': '/npo',
        'TempStaff': '/temp',
        'CulinaryDirector': '/culinary-director',
        'CulinaryCook': '/culinary-cook',
        'Developer': '/dev',
      };
      navigate(roleRoutes[currentUser.role] || '/');
    } else {
      navigate('/');
    }
  };

  return (
    <AnimatedBackground>
      <GlobalModeBar />
      <div className="min-h-screen pb-20" data-testid="stadium-map-page">
        <PageHeader
          title="Stadium Map"
          subtitle="Interactive venue navigation"
          icon={<Map className="h-5 w-5" />}
          iconColor="cyan"
          backAction={handleBack}
        />

        <main className="p-3 sm:px-4 max-w-7xl mx-auto">
          <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden min-h-[70vh]">
            <InteractiveMap 
              showNavigation={true}
            />
          </div>
        </main>
      </div>
    </AnimatedBackground>
  );
}
