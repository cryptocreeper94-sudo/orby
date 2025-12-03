import { useQuery } from "@tanstack/react-query";
import type { DashboardConfig } from "@shared/schema";

interface UseDashboardConfigResult {
  config: DashboardConfig | null;
  isLoading: boolean;
  showWidget: (key: WidgetKey) => boolean;
  alertLevel: "normal" | "priority-only" | "silent";
  dataScope: "all" | "assigned";
  showSensitiveMetrics: boolean;
  layoutPreset: "ops-lite" | "standard" | "full-command";
}

type WidgetKey = 
  | "showEmergencyFeed" 
  | "showDeliveries" 
  | "showCompliance" 
  | "showAiChat" 
  | "showWeather" 
  | "showMap" 
  | "showMessaging" 
  | "showInventory";

async function fetchDashboardConfig(role: string): Promise<DashboardConfig | null> {
  try {
    const response = await fetch(`/api/dashboard-configs/${role}`);
    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error("Failed to fetch dashboard config");
    }
    const data = await response.json();
    return data || null;
  } catch {
    return null;
  }
}

export function useDashboardConfig(role: string): UseDashboardConfigResult {
  const { data: config, isLoading } = useQuery<DashboardConfig | null>({
    queryKey: ["/api/dashboard-configs", role],
    queryFn: () => fetchDashboardConfig(role),
    staleTime: 30000,
    refetchInterval: 60000,
  });

  const showWidget = (key: WidgetKey): boolean => {
    if (!config) return true;
    const value = config[key];
    return value === true || value === undefined;
  };

  return {
    config: config || null,
    isLoading,
    showWidget,
    alertLevel: (config?.alertLevel as "normal" | "priority-only" | "silent") || "normal",
    dataScope: (config?.dataScope as "all" | "assigned") || "assigned",
    showSensitiveMetrics: config?.showSensitiveMetrics ?? false,
    layoutPreset: (config?.layoutPreset as "ops-lite" | "standard" | "full-command") || "standard",
  };
}
