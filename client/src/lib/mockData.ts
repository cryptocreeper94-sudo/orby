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
  section: string; // e.g., "7 East", "2 West"
  supervisorId?: string;
  status: 'Open' | 'Closed' | 'Needs Power' | 'Spare' | 'Hot Spot';
  countSheet?: Record<string, CountEntry>;
  staffing?: Record<string, number | string>; // Map of POS/Position to Staff Count/Name
}

export interface User {
  id: string;
  name: string;
  role: 'Admin' | 'Supervisor' | 'Worker' | 'IT';
  pin: string;
  isOnline?: boolean;
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  content: string;
  timestamp: string;
  type: 'Global' | 'Urgent' | 'Request';
}

// Mock Data
export const SECTIONS = ["7 East", "2 East", "7 West", "2 West", "South Plaza"];

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
  { id: '1', name: 'Admin User', role: 'Admin', pin: '1234', isOnline: true },
  { id: '2', name: 'Sup. Sarah', role: 'Supervisor', pin: '5678', isOnline: true },
  { id: '3', name: 'Sup. Mike', role: 'Supervisor', pin: '9012', isOnline: false },
  { id: '4', name: 'IT Support', role: 'IT', pin: '9999', isOnline: true },
];

// Replicating the complex grid structure from the images
export const MOCK_STANDS: Stand[] = [
  // 2 East
  { id: '102S', name: '102S - Moosehead', section: '2 East', supervisorId: '2', status: 'Open', staffing: { '126': 2, '122': 1 } },
  { id: '103', name: '103 - Jack Bar North', section: '2 East', supervisorId: '2', status: 'Open', staffing: { '128': 1 } },
  { id: '104L', name: '104L - Cocktails', section: '2 East', supervisorId: '2', status: 'Hot Spot', staffing: { '123': 'Hot 3' } },
  { id: '105V', name: '105V - Vending MSM', section: '2 East', supervisorId: '2', status: 'Closed', staffing: { '10': 0 } },
  
  // 7 East
  { id: '305V', name: '305V - Vending MSM', section: '7 East', supervisorId: '3', status: 'Open', staffing: { '255': 3 } },
  { id: '309L', name: '309L - Titos', section: '7 East', supervisorId: '3', status: 'Open', staffing: { '259': 2 } },
  { id: '310F', name: '310F - Walking Taco', section: '7 East', supervisorId: '3', status: 'Needs Power', staffing: { '260': 2 } },
  
  // 7 West
  { id: '329B', name: '329B - Mango Cart', section: '7 West', supervisorId: '3', status: 'Open', staffing: { '291': 2 } },
  { id: '330G', name: '330G - 615 Market', section: '7 West', supervisorId: '3', status: 'Open', staffing: { '293': 2 } },
  { id: '331S', name: '331S - Jet', section: '7 West', supervisorId: '3', status: 'Open', staffing: { '295': 2 } },
  { id: '332S', name: '332S - Ice Crown', section: '7 West', supervisorId: '3', status: 'Open', staffing: { '296': 2 } },

  // 2 West
  { id: 'OA001', name: 'OA001 - Titan Up Tailgate', section: '2 West', supervisorId: '2', status: 'Closed', staffing: { '198': 12 } },
  { id: 'OA004', name: 'OA004 - Daddys Dogs', section: '2 West', supervisorId: '2', status: 'Open', staffing: { '195': 2, '196': 2 } },
];

export const INITIAL_MESSAGES: Message[] = [
  { id: '1', senderId: '2', senderName: 'Sup. Sarah', senderRole: 'Supervisor', content: 'Need a runner for ice at Stand 102S', timestamp: '10:30 AM', type: 'Request' },
  { id: '2', senderId: '4', senderName: 'IT Support', senderRole: 'IT', content: 'POS updates completed for Section 7 East', timestamp: '10:15 AM', type: 'Global' },
];

// Store
interface AppState {
  currentUser: User | null;
  login: (pin: string) => boolean;
  logout: () => void;
  stands: Stand[];
  messages: Message[];
  addMessage: (msg: Omit<Message, 'id' | 'timestamp' | 'senderName' | 'senderRole'>) => void;
  updateStandStatus: (id: string, status: Stand['status']) => void;
  updateCount: (standId: string, itemId: string, field: keyof CountEntry, value: number) => void;
}

export const useStore = create<AppState>((set, get) => ({
  currentUser: null,
  stands: MOCK_STANDS,
  messages: INITIAL_MESSAGES,
  login: (pin) => {
    const user = MOCK_USERS.find(u => u.pin === pin);
    if (user) {
      set({ currentUser: user });
      return true;
    }
    return false;
  },
  logout: () => set({ currentUser: null }),
  addMessage: (msg) => {
    const user = get().currentUser;
    if (!user) return;
    
    const newMessage: Message = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      senderName: user.name,
      senderRole: user.role,
      ...msg
    };
    
    set(state => ({ messages: [newMessage, ...state.messages] }));
  },
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

      const item = stand.countSheet[itemId];
      item.sold = (item.startCount + item.adds) - item.endCount - item.spoilage;

      return { stands };
    })
}));
