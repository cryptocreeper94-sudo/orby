import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import * as api from './api';
import type { User, Stand, Item, Message, NPO, StaffingGroup, SupervisorDoc } from '@shared/schema';

// Legacy types for compatibility
export interface CountEntry {
  itemId: string;
  startCount: number;
  adds: number;
  endCount: number;
  spoilage: number;
  sold: number;
}

// Re-export types
export type { User, Stand, Item, Message, NPO, StaffingGroup, SupervisorDoc };

// Constants
export const SECTIONS = ["2 East", "2 West", "7 East", "7 West"];

// Feature flags for tenant-based content visibility
export interface TenantFeatures {
  showCommercialFeatures: boolean;
  showSalesContent: boolean;
  showInvestorContent: boolean;
  showSubscriptionContent: boolean;
  tenantType: 'business' | 'franchise' | 'beta';
  tenantName: string;
}

// Default to Nissan Stadium beta tenant features (no commercial content)
const DEFAULT_TENANT_FEATURES: TenantFeatures = {
  showCommercialFeatures: false,
  showSalesContent: false,
  showInvestorContent: false,
  showSubscriptionContent: false,
  tenantType: 'beta',
  tenantName: 'Nissan Stadium'
};

// Store
interface AppState {
  currentUser: User | null;
  users: User[];
  stands: Stand[];
  items: Item[];
  messages: Message[];
  npos: NPO[];
  staffingGroups: StaffingGroup[];
  supervisorDocs: SupervisorDoc[];
  isLoading: boolean;
  error: string | null;
  tenantFeatures: TenantFeatures;

  // Auth
  login: (pin: string) => Promise<boolean>;
  logout: () => void;

  // Data fetching
  fetchUsers: () => Promise<void>;
  fetchStands: () => Promise<void>;
  fetchItems: () => Promise<void>;
  fetchMessages: () => Promise<void>;
  fetchNpos: () => Promise<void>;
  fetchStaffingGroups: () => Promise<void>;
  fetchSupervisorDocs: () => Promise<void>;
  fetchAll: () => Promise<void>;

  // Mutations
  updateStandStatus: (id: string, status: Stand['status']) => Promise<void>;
  addMessage: (msg: { content: string; type: 'Global' | 'Urgent' | 'Request' }) => Promise<void>;
  createStaffingGroup: (group: { name: string; supervisorId?: string; standIds?: string[]; npoId?: string; eventDate?: string }) => Promise<void>;

  // Legacy compatibility for count sheet (local state)
  countSheets: Record<string, Record<string, CountEntry>>;
  updateCount: (standId: string, itemId: string, field: keyof CountEntry, value: number) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      currentUser: null,
      users: [],
      stands: [],
      items: [],
      messages: [],
      npos: [],
      staffingGroups: [],
      supervisorDocs: [],
      countSheets: {},
      isLoading: false,
      error: null,
      tenantFeatures: DEFAULT_TENANT_FEATURES,

      login: async (pin: string) => {
        try {
          set({ isLoading: true, error: null });
          const { user } = await api.loginWithPin(pin);
          set({ currentUser: user, isLoading: false });
          // Set session persistence for page navigation
          const PERSISTENCE_KEY = 'orby_session_persistence';
          const PERSISTENCE_EXPIRY_KEY = 'orby_session_expiry';
          const SESSION_DURATION = 8 * 60 * 60 * 1000; // 8 hours
          localStorage.setItem(PERSISTENCE_KEY, 'true');
          localStorage.setItem(PERSISTENCE_EXPIRY_KEY, String(Date.now() + SESSION_DURATION));
          // Fetch all data after login
          await get().fetchAll();
          return true;
        } catch (error) {
          set({ isLoading: false, error: (error as Error).message });
          return false;
        }
      },

      logout: () => {
        const user = get().currentUser;
        if (user) {
          api.logout(user.id).catch(console.error);
        }
        localStorage.removeItem('orby_session_persistence');
        localStorage.removeItem('orby_session_expiry');
        set({ currentUser: null });
      },

      fetchUsers: async () => {
        try {
          const users = await api.getUsers();
          set({ users });
        } catch (error) {
          console.error("Failed to fetch users:", error);
        }
      },

      fetchStands: async () => {
        try {
          const stands = await api.getStands();
          set({ stands });
        } catch (error) {
          console.error("Failed to fetch stands:", error);
        }
      },

      fetchItems: async () => {
        try {
          const items = await api.getItems();
          set({ items });
        } catch (error) {
          console.error("Failed to fetch items:", error);
        }
      },

      fetchMessages: async () => {
        try {
          const messages = await api.getMessages();
          set({ messages });
        } catch (error) {
          console.error("Failed to fetch messages:", error);
        }
      },

      fetchNpos: async () => {
        try {
          const npos = await api.getNpos();
          set({ npos });
        } catch (error) {
          console.error("Failed to fetch NPOs:", error);
        }
      },

      fetchStaffingGroups: async () => {
        try {
          const staffingGroups = await api.getStaffingGroups();
          set({ staffingGroups });
        } catch (error) {
          console.error("Failed to fetch staffing groups:", error);
        }
      },

      fetchSupervisorDocs: async () => {
        try {
          const supervisorDocs = await api.getSupervisorDocs();
          set({ supervisorDocs });
        } catch (error) {
          console.error("Failed to fetch supervisor docs:", error);
        }
      },

      fetchAll: async () => {
        set({ isLoading: true });
        await Promise.all([
          get().fetchUsers(),
          get().fetchStands(),
          get().fetchItems(),
          get().fetchMessages(),
          get().fetchNpos(),
          get().fetchStaffingGroups(),
          get().fetchSupervisorDocs(),
        ]);
        set({ isLoading: false });
      },

      updateStandStatus: async (id: string, status: Stand['status']) => {
        try {
          await api.updateStandStatus(id, status);
          set(state => ({
            stands: state.stands.map(s => s.id === id ? { ...s, status } : s)
          }));
        } catch (error) {
          console.error("Failed to update stand status:", error);
        }
      },

      addMessage: async (msg) => {
        const user = get().currentUser;
        if (!user) return;
        try {
          const message = await api.createMessage({
            senderId: user.id,
            content: msg.content,
            type: msg.type,
          });
          set(state => ({ messages: [message, ...state.messages] }));
        } catch (error) {
          console.error("Failed to send message:", error);
        }
      },

      createStaffingGroup: async (group) => {
        try {
          const newGroup = await api.createStaffingGroup(group);
          set(state => ({ staffingGroups: [...state.staffingGroups, newGroup] }));
        } catch (error) {
          console.error("Failed to create staffing group:", error);
        }
      },

      // Legacy count sheet (kept local for now - could be migrated to API)
      updateCount: (standId: string, itemId: string, field: keyof CountEntry, value: number) => {
        set(state => {
          const countSheets = { ...state.countSheets };
          if (!countSheets[standId]) countSheets[standId] = {};
          if (!countSheets[standId][itemId]) {
            countSheets[standId][itemId] = { itemId, startCount: 0, adds: 0, endCount: 0, spoilage: 0, sold: 0 };
          }
          countSheets[standId][itemId] = {
            ...countSheets[standId][itemId],
            [field]: value,
          };
          // Calculate sold
          const item = countSheets[standId][itemId];
          item.sold = (item.startCount + item.adds) - item.endCount - item.spoilage;
          return { countSheets };
        });
      },
    }),
    {
      name: 'stadiumops-storage',
      partialize: (state) => ({
        currentUser: state.currentUser,
        countSheets: state.countSheets,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.currentUser) {
          const PERSISTENCE_KEY = 'orby_session_persistence';
          const PERSISTENCE_EXPIRY_KEY = 'orby_session_expiry';
          const hasPersistence = localStorage.getItem(PERSISTENCE_KEY) === 'true';
          const expiry = localStorage.getItem(PERSISTENCE_EXPIRY_KEY);
          
          if (hasPersistence && expiry) {
            const expiryTime = parseInt(expiry, 10);
            if (!isNaN(expiryTime) && Date.now() < expiryTime) {
              return;
            }
          }
          
          if (!hasPersistence) {
            state.currentUser = null;
            localStorage.removeItem(PERSISTENCE_KEY);
            localStorage.removeItem(PERSISTENCE_EXPIRY_KEY);
          }
        }
      },
    }
  )
);

// Legacy exports for backward compatibility
export const ITEMS: Item[] = [];
export const SUPERVISOR_PACK_DOCS: SupervisorDoc[] = [];
