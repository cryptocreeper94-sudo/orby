import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Types
export interface Item {
  id: string;
  name: string;
  price: number;
  category: 'Beverage' | 'Food' | 'Merch';
}

export interface CountEntry {
  itemId: string;
  startCount: number;
  adds: number;
  endCount: number;
  spoilage: number;
  sold: number; // Calculated
}

export interface Stand {
  id: string;
  name: string;
  supervisorId?: string;
  status: 'Open' | 'Closed';
  countSheet?: Record<string, CountEntry>;
}

export interface User {
  id: string;
  name: string;
  role: 'Admin' | 'Supervisor' | 'Worker' | 'IT';
  pin: string;
}

export interface Event {
  id: string;
  name: string;
  date: string;
}

// Mock Data
export const ITEMS: Item[] = [
  { id: '1', name: 'Bud Light 16oz', price: 12.00, category: 'Beverage' },
  { id: '2', name: 'Miller Lite 16oz', price: 12.00, category: 'Beverage' },
  { id: '3', name: 'Coca Cola 20oz', price: 6.00, category: 'Beverage' },
  { id: '4', name: 'Water 20oz', price: 5.00, category: 'Beverage' },
  { id: '5', name: 'Hot Dog', price: 8.00, category: 'Food' },
  { id: '6', name: 'Nachos', price: 9.00, category: 'Food' },
  { id: '7', name: 'Pretzel', price: 7.00, category: 'Food' },
];

export const MOCK_USERS: User[] = [
  { id: '1', name: 'Admin User', role: 'Admin', pin: '1234' },
  { id: '2', name: 'Sup. Sarah', role: 'Supervisor', pin: '5678' },
  { id: '3', name: 'Sup. Mike', role: 'Supervisor', pin: '9012' },
  { id: '4', name: 'IT Support', role: 'IT', pin: '9999' },
];

export const MOCK_STANDS: Stand[] = [
  { id: '101', name: 'Stand 101 (Beer)', supervisorId: '2', status: 'Open' },
  { id: '102', name: 'Stand 102 (Food)', supervisorId: '2', status: 'Open' },
  { id: '103', name: 'Stand 103 (Mixed)', supervisorId: '2', status: 'Closed' },
  { id: '201', name: 'Stand 201 (Beer)', supervisorId: '3', status: 'Open' },
  { id: '202', name: 'Stand 202 (Food)', supervisorId: '3', status: 'Open' },
];

// Store
interface AppState {
  currentUser: User | null;
  login: (pin: string) => boolean;
  logout: () => void;
  stands: Stand[];
  updateStandStatus: (id: string, status: 'Open' | 'Closed') => void;
  updateCount: (standId: string, itemId: string, field: keyof CountEntry, value: number) => void;
}

export const useStore = create<AppState>((set, get) => ({
  currentUser: null,
  stands: MOCK_STANDS,
  login: (pin) => {
    const user = MOCK_USERS.find(u => u.pin === pin);
    if (user) {
      set({ currentUser: user });
      return true;
    }
    return false;
  },
  logout: () => set({ currentUser: null }),
  updateStandStatus: (id, status) => 
    set(state => ({
      stands: state.stands.map(s => s.id === id ? { ...s, status } : s)
    })),
  updateCount: (standId, itemId, field, value) =>
    set(state => {
      const stands = [...state.stands];
      const stand = stands.find(s => s.id === standId);
      if (!stand) return { stands };

      if (!stand.countSheet) stand.countSheet = {};
      if (!stand.countSheet[itemId]) {
        stand.countSheet[itemId] = { itemId, startCount: 0, adds: 0, endCount: 0, spoilage: 0, sold: 0 };
      }

      stand.countSheet[itemId] = {
        ...stand.countSheet[itemId],
        [field]: value
      };

      // Recalculate sold
      const item = stand.countSheet[itemId];
      item.sold = (item.startCount + item.adds) - item.endCount - item.spoilage;

      return { stands };
    })
}));
