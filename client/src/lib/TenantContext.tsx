import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type TenantId = 'demo' | 'nissan_beta';

interface TenantConfig {
  id: TenantId;
  name: string;
  displayName: string;
  isDemo: boolean;
  venueName: string;
  primaryColor: string;
  features: {
    showSalesContent: boolean;
    allowEventCreation: boolean;
    showPricing: boolean;
    liveOperationsEnabled: boolean;
  };
}

const TENANT_CONFIGS: Record<TenantId, TenantConfig> = {
  demo: {
    id: 'demo',
    name: 'demo',
    displayName: 'Orby Demo',
    isDemo: true,
    venueName: 'Demo Venue',
    primaryColor: '#06B6D4',
    features: {
      showSalesContent: true,
      allowEventCreation: false,
      showPricing: true,
      liveOperationsEnabled: false,
    },
  },
  nissan_beta: {
    id: 'nissan_beta',
    name: 'nissan_beta',
    displayName: 'Nissan Stadium',
    isDemo: false,
    venueName: 'Nissan Stadium',
    primaryColor: '#06B6D4',
    features: {
      showSalesContent: false,
      allowEventCreation: true,
      showPricing: false,
      liveOperationsEnabled: true,
    },
  },
};

interface TenantContextType {
  tenant: TenantConfig;
  tenantId: TenantId;
  isDemo: boolean;
  isProduction: boolean;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

function detectTenantFromDomain(): TenantId {
  const hostname = window.location.hostname.toLowerCase();
  
  if (hostname.includes('orbycommander.com') || 
      hostname.includes('nissan') ||
      hostname.includes('localhost') ||
      hostname.includes('.replit.dev') ||
      hostname.includes('.replit.app')) {
    return 'nissan_beta';
  }
  
  if (hostname.includes('getorby.io') || 
      hostname.includes('demo')) {
    return 'demo';
  }
  
  return 'nissan_beta';
}

export function TenantProvider({ children }: { children: ReactNode }) {
  const [tenantId, setTenantId] = useState<TenantId>(() => detectTenantFromDomain());
  
  useEffect(() => {
    const detected = detectTenantFromDomain();
    setTenantId(detected);
    
    document.documentElement.setAttribute('data-tenant', detected);
    
    console.log(`[Tenant] Detected tenant: ${detected} from ${window.location.hostname}`);
  }, []);

  const tenant = TENANT_CONFIGS[tenantId];

  const value: TenantContextType = {
    tenant,
    tenantId,
    isDemo: tenant.isDemo,
    isProduction: !tenant.isDemo,
  };

  return (
    <TenantContext.Provider value={value}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
}

export function useTenantId(): TenantId {
  const { tenantId } = useTenant();
  return tenantId;
}

export function useIsDemo(): boolean {
  const { isDemo } = useTenant();
  return isDemo;
}

export { TENANT_CONFIGS };
