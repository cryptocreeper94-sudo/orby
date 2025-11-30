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
export const SECTIONS = ["2 East", "2 West", "7 East", "7 West"];

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

// Full Stand List based on provided images
export const MOCK_STANDS: Stand[] = [
  // --- 2 EAST ---
  { id: '102S', name: '102S - Moosehead', section: '2 East', supervisorId: '2', status: 'Open' },
  { id: '103', name: '103 - Jack Bar North', section: '2 East', supervisorId: '2', status: 'Open' },
  { id: '104L', name: '104L - Cocktails', section: '2 East', supervisorId: '2', status: 'Hot Spot' },
  { id: '105V', name: '105V - Vending MSM', section: '2 East', supervisorId: '2', status: 'Closed' },
  { id: '105S', name: '105S - Ice Crown', section: '2 East', supervisorId: '2', status: 'Open' },
  { id: '106F', name: '106F - Restaurant Partner', section: '2 East', supervisorId: '2', status: 'Open' },
  { id: '111L', name: '111L - Tito\'s Bar', section: '2 East', supervisorId: '2', status: 'Open' },
  { id: '114S', name: '114S - Jet', section: '2 East', supervisorId: '2', status: 'Open' },
  { id: '115S', name: '115S - Totally Nutz', section: '2 East', supervisorId: '2', status: 'Open' },
  { id: '116G', name: '116G - Twice Daily', section: '2 East', supervisorId: '2', status: 'Open' },
  { id: '116B', name: '116B - Ultra Grab N Go', section: '2 East', supervisorId: '2', status: 'Open' },
  { id: '118V', name: '118V - Vending MSM', section: '2 East', supervisorId: '2', status: 'Open' },
  { id: '120L', name: '120L - Stillhouse', section: '2 East', supervisorId: '2', status: 'Open' },
  { id: '121', name: '121 - Hattie B\'s', section: '2 East', supervisorId: '2', status: 'Open' },
  { id: '120W', name: '120W - Wine', section: '2 East', supervisorId: '2', status: 'Open' },
  { id: '120B', name: '120B - Bud Light Seltzer', section: '2 East', supervisorId: '2', status: 'Open' },
  { id: '121L', name: '121L - Miller Container Bar', section: '2 East', supervisorId: '2', status: 'Open' },
  { id: '122S', name: '122S - Ice Crown', section: '2 East', supervisorId: '2', status: 'Open' },
  { id: '123S', name: '123S - Daddy\'s Dogs', section: '2 East', supervisorId: '2', status: 'Open' },
  { id: '124B', name: '124B - Bud Light Container', section: '2 East', supervisorId: '2', status: 'Open' },
  { id: '125S', name: '125S - Ben & Jerry\'s', section: '2 East', supervisorId: '2', status: 'Open' },

  // --- 2 WEST ---
  { id: 'OA001', name: 'OA001 - Titan Up Tailgate', section: '2 West', supervisorId: '2', status: 'Closed' },
  { id: 'OA004', name: 'OA004 - Daddy\'s Dogs', section: '2 West', supervisorId: '2', status: 'Open' },
  { id: '126L', name: '126L - Jack BAR South', section: '2 West', supervisorId: '2', status: 'Open' },
  { id: '124S', name: '124S - Moosehead @ 123', section: '2 West', supervisorId: '2', status: 'Open' },
  { id: '127L', name: '127L - Ole Smoky Bar - Door9876', section: '2 West', supervisorId: '2', status: 'Open' },
  { id: '129B', name: '129B - Vizzy', section: '2 West', supervisorId: '2', status: 'Open' },
  { id: '130S', name: '130S - Totally Nutz', section: '2 West', supervisorId: '2', status: 'Open' },
  { id: '131S', name: '131S - Jet', section: '2 West', supervisorId: '2', status: 'Open' },
  { id: '131G', name: '131G - Twice Daily', section: '2 West', supervisorId: '2', status: 'Open' },
  { id: '136L', name: '136L - Tito\'s Bar', section: '2 West', supervisorId: '2', status: 'Open' },
  { id: '141F', name: '141F - Burger of the Game', section: '2 West', supervisorId: '2', status: 'Open' },
  { id: '142B', name: '142B - Draft', section: '2 West', supervisorId: '2', status: 'Open' },
  { id: '142S', name: '142S - Ben & Jerry\'s', section: '2 West', supervisorId: '2', status: 'Open' },
  { id: '143B', name: '143B - Miller Grab n GO', section: '2 West', supervisorId: '2', status: 'Open' },
  { id: '143', name: '143 - Titans Tavern', section: '2 West', supervisorId: '2', status: 'Open' },
  { id: '145L', name: '145L - Jack Airstream - 0770', section: '2 West', supervisorId: '2', status: 'Open' },
  { id: '146Z', name: '146Z - 8th Roast', section: '2 West', supervisorId: '2', status: 'Open' },

  // --- 7 EAST ---
  { id: '305V', name: '305V - Vending MSM', section: '7 East', supervisorId: '3', status: 'Open' },
  { id: '309L', name: '309L - Titos', section: '7 East', supervisorId: '3', status: 'Open' },
  { id: '310F', name: '310F - Walking Taco', section: '7 East', supervisorId: '3', status: 'Needs Power' },
  { id: '312B', name: '312B - Nutrl', section: '7 East', supervisorId: '3', status: 'Open' },
  { id: '310S', name: '310S - Ice Crown', section: '7 East', supervisorId: '3', status: 'Open' },
  { id: '312S', name: '312S - Totally Nutz', section: '7 East', supervisorId: '3', status: 'Open' },
  { id: '311S', name: '311S - Moosehead', section: '7 East', supervisorId: '3', status: 'Open' },
  { id: '313S', name: '313S - Daddy\'s Dogs', section: '7 East', supervisorId: '3', status: 'Open' },
  { id: '314B', name: '314B - Stella', section: '7 East', supervisorId: '3', status: 'Open' },
  { id: '314S', name: '314S - Jet', section: '7 East', supervisorId: '3', status: 'Open' },
  { id: '315S', name: '315S - Ben & Jerry\'s', section: '7 East', supervisorId: '3', status: 'Open' },
  { id: '316S', name: '316S - Ice Crown', section: '7 East', supervisorId: '3', status: 'Open' },
  { id: '316L', name: '316L - Jack', section: '7 East', supervisorId: '3', status: 'Open' },
  { id: '317G', name: '317G - Mich Ultra', section: '7 East', supervisorId: '3', status: 'Open' },
  { id: '317S', name: '317S - Jet', section: '7 East', supervisorId: '3', status: 'Open' },
  { id: '318B', name: '318B - Mango Cart', section: '7 East', supervisorId: '3', status: 'Open' },

  // --- 7 WEST ---
  { id: '329B', name: '329B - Mango Cart', section: '7 West', supervisorId: '3', status: 'Open' },
  { id: '330G', name: '330G - 615 Market', section: '7 West', supervisorId: '3', status: 'Open' },
  { id: '331S', name: '331S - Jet', section: '7 West', supervisorId: '3', status: 'Open' },
  { id: '332S', name: '332S - Ice Crown', section: '7 West', supervisorId: '3', status: 'Open' },
  { id: '333B', name: '333B - Mich Ultra', section: '7 West', supervisorId: '3', status: 'Open' },
  { id: '333S', name: '333S - Jet', section: '7 West', supervisorId: '3', status: 'Open' },
  { id: '334B', name: '334B - Nutrl', section: '7 West', supervisorId: '3', status: 'Open' },
  { id: '334S', name: '334S - Daddy\'s Dogs', section: '7 West', supervisorId: '3', status: 'Open' },
  { id: '330S', name: '330S - Ben & Jerry\'s', section: '7 West', supervisorId: '3', status: 'Open' },
  { id: '335S', name: '335S - Ice Crown', section: '7 West', supervisorId: '3', status: 'Open' },
  { id: '336S', name: '336S - Moosehead', section: '7 West', supervisorId: '3', status: 'Open' },
  { id: '338L', name: '338L - Titos', section: '7 West', supervisorId: '3', status: 'Open' },
  { id: '337F', name: '337F - Walking Taco', section: '7 West', supervisorId: '3', status: 'Open' },
  { id: '342V', name: '342V - Vending MSM', section: '7 West', supervisorId: '3', status: 'Open' },
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
