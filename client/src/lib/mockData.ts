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
  physicalSection: string; // Hardened section number (e.g. "305", "334")
  supervisorId?: string;
  status: 'Open' | 'Closed' | 'Needs Power' | 'Spare' | 'Hot Spot';
  countSheet?: Record<string, CountEntry>;
  staffing?: Record<string, number | string>; // Map of POS/Position to Staff Count/Name
  e700Ids?: string[]; // Array of specific Asset IDs (e.g. ["101", "102"])
  a930Ids?: string[]; // Array of specific Asset IDs (e.g. ["126", "122"])
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

export interface NPO {
  id: string;
  name: string; // e.g. "Boy Scouts Troop 123"
  groupLeader: string; // "John Doe"
  contact: string; // "555-1234"
}

export interface StandGroup {
  id: string;
  name: string; // "Joe's Section" or "Group A"
  supervisorId: string; // "Sup. Mike"
  standIds: string[]; // ["101", "102", "103"]
  npoId?: string; // Assigned NPO
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

export const MOCK_NPOS: NPO[] = [
  { id: '1', name: 'Boy Scouts Troop 42', groupLeader: 'John Smith', contact: '555-0101' },
  { id: '2', name: 'Central High Band', groupLeader: 'Jane Doe', contact: '555-0102' },
  { id: '3', name: 'Rotary Club', groupLeader: 'Bob Wilson', contact: '555-0103' },
];

// Full Stand List based on provided images
export const MOCK_STANDS: Stand[] = [
  // --- 2 EAST ---
  { id: '102S', name: '102S - Moosehead', section: '2 East', physicalSection: '102', supervisorId: '2', status: 'Open', e700Ids: [], a930Ids: ['126', '122'] },
  { id: '103', name: '103 - Jack Bar North', section: '2 East', physicalSection: '103', supervisorId: '2', status: 'Open', e700Ids: ['201'], a930Ids: [] },
  { id: '104L', name: '104L - Cocktails', section: '2 East', physicalSection: '104', supervisorId: '2', status: 'Hot Spot', e700Ids: ['202', '203', '204'], a930Ids: ['130', '131', '132'] },
  { id: '105V', name: '105V - Vending MSM', section: '2 East', physicalSection: '105', supervisorId: '2', status: 'Closed', e700Ids: [], a930Ids: [] },
  { id: '105S', name: '105S - Ice Crown', section: '2 East', physicalSection: '105', supervisorId: '2', status: 'Open', e700Ids: ['205', '206', '207', '208'], a930Ids: [] },
  { id: '106F', name: '106F - Restaurant Partner', section: '2 East', physicalSection: '106', supervisorId: '2', status: 'Open', e700Ids: ['209', '210', '211'], a930Ids: ['133'] },
  { id: '111L', name: '111L - Tito\'s Bar', section: '2 East', physicalSection: '111', supervisorId: '2', status: 'Open', e700Ids: ['212', '213'], a930Ids: ['134', '135'] },
  { id: '114S', name: '114S - Jet', section: '2 East', physicalSection: '114', supervisorId: '2', status: 'Open', e700Ids: ['214', '215', '216', '217'], a930Ids: [] },
  { id: '115S', name: '115S - Totally Nutz', section: '2 East', physicalSection: '115', supervisorId: '2', status: 'Open', e700Ids: ['218'], a930Ids: ['136'] },
  { id: '116G', name: '116G - Twice Daily', section: '2 East', physicalSection: '116', supervisorId: '2', status: 'Open', e700Ids: ['219'], a930Ids: ['137'] },
  { id: '116B', name: '116B - Ultra Grab N Go', section: '2 East', physicalSection: '116', supervisorId: '2', status: 'Open', e700Ids: [], a930Ids: ['138', '139', '140', '141', '142', '143', '144', '145'] },
  { id: '118V', name: '118V - Vending MSM', section: '2 East', physicalSection: '118', supervisorId: '2', status: 'Open', e700Ids: [], a930Ids: ['146'] },
  { id: '120L', name: '120L - Stillhouse', section: '2 East', physicalSection: '120', supervisorId: '2', status: 'Open', e700Ids: ['220', '221', '222', '223'], a930Ids: [] },
  { id: '121', name: '121 - Hattie B\'s', section: '2 East', physicalSection: '121', supervisorId: '2', status: 'Open', e700Ids: ['224', '225', '226'], a930Ids: ['147', '148'] },
  { id: '120W', name: '120W - Wine', section: '2 East', physicalSection: '120', supervisorId: '2', status: 'Open', e700Ids: ['227', '228'], a930Ids: [] },
  { id: '120B', name: '120B - Bud Light Seltzer', section: '2 East', physicalSection: '120', supervisorId: '2', status: 'Open', e700Ids: ['229', '230', '231', '232'], a930Ids: [] },
  { id: '121L', name: '121L - Miller Container Bar', section: '2 East', physicalSection: '121', supervisorId: '2', status: 'Open', e700Ids: ['233', '234', '235'], a930Ids: [] },
  { id: '122S', name: '122S - Ice Crown', section: '2 East', physicalSection: '122', supervisorId: '2', status: 'Open', e700Ids: ['236', '237', '238', '239'], a930Ids: [] },
  { id: '123S', name: '123S - Daddy\'s Dogs', section: '2 East', physicalSection: '123', supervisorId: '2', status: 'Open', e700Ids: ['240', '241', '242', '243'], a930Ids: [] },
  { id: '124B', name: '124B - Bud Light Container', section: '2 East', physicalSection: '124', supervisorId: '2', status: 'Open', e700Ids: ['244', '245'], a930Ids: ['149'] },
  { id: '125S', name: '125S - Ben & Jerry\'s', section: '2 East', physicalSection: '125', supervisorId: '2', status: 'Open', e700Ids: ['246', '247', '248', '249', '250', '251', '252', '253', '254', '255', '256', '257'], a930Ids: [] },

  // --- 2 WEST ---
  { id: 'OA001', name: 'OA001 - Titan Up Tailgate', section: '2 West', physicalSection: 'Plaza', supervisorId: '2', status: 'Closed', e700Ids: [], a930Ids: ['150', '151', '152', '153', '154', '155', '156', '157', '158', '159', '160', '161'] },
  { id: 'OA004', name: 'OA004 - Daddy\'s Dogs', section: '2 West', physicalSection: 'Plaza', supervisorId: '2', status: 'Open', e700Ids: ['258', '259'], a930Ids: ['162', '163'] },
  { id: '126L', name: '126L - Jack BAR South', section: '2 West', physicalSection: '126', supervisorId: '2', status: 'Open', e700Ids: ['260', '261'], a930Ids: ['164'] },
  { id: '124S', name: '124S - Moosehead @ 123', section: '2 West', physicalSection: '124', supervisorId: '2', status: 'Open', e700Ids: ['262'], a930Ids: [] },
  { id: '127L', name: '127L - Ole Smoky Bar - Door9876', section: '2 West', physicalSection: '127', supervisorId: '2', status: 'Open', e700Ids: ['263', '264', '265', '266'], a930Ids: [] },
  { id: '129B', name: '129B - Vizzy', section: '2 West', physicalSection: '129', supervisorId: '2', status: 'Open', e700Ids: ['267'], a930Ids: [] },
  { id: '130S', name: '130S - Totally Nutz', section: '2 West', physicalSection: '130', supervisorId: '2', status: 'Open', e700Ids: ['268'], a930Ids: [] },
  { id: '131S', name: '131S - Jet', section: '2 West', physicalSection: '131', supervisorId: '2', status: 'Open', e700Ids: ['269', '270'], a930Ids: [] },
  { id: '131G', name: '131G - Twice Daily', section: '2 West', physicalSection: '131', supervisorId: '2', status: 'Open', e700Ids: ['271', '272'], a930Ids: [] },
  { id: '136L', name: '136L - Tito\'s Bar', section: '2 West', physicalSection: '136', supervisorId: '2', status: 'Open', e700Ids: ['273', '274', '275', '276'], a930Ids: [] },
  { id: '141F', name: '141F - Burger of the Game', section: '2 West', physicalSection: '141', supervisorId: '2', status: 'Open', e700Ids: ['277', '278', '279', '280'], a930Ids: ['165', '166'] },
  { id: '142B', name: '142B - Draft', section: '2 West', physicalSection: '142', supervisorId: '2', status: 'Open', e700Ids: ['281', '282', '283', '284'], a930Ids: [] },
  { id: '142S', name: '142S - Ben & Jerry\'s', section: '2 West', physicalSection: '142', supervisorId: '2', status: 'Open', e700Ids: ['285', '286', '287', '288'], a930Ids: [] },
  { id: '143B', name: '143B - Miller Grab n GO', section: '2 West', physicalSection: '143', supervisorId: '2', status: 'Open', e700Ids: ['289', '290', '291', '292'], a930Ids: [] },
  { id: '143', name: '143 - Titans Tavern', section: '2 West', physicalSection: '143', supervisorId: '2', status: 'Open', e700Ids: ['293', '294', '295'], a930Ids: ['167'] },
  { id: '145L', name: '145L - Jack Airstream - 0770', section: '2 West', physicalSection: '145', supervisorId: '2', status: 'Open', e700Ids: ['296', '297'], a930Ids: [] },
  { id: '146Z', name: '146Z - 8th Roast', section: '2 West', physicalSection: '146', supervisorId: '2', status: 'Open', e700Ids: ['298', '299'], a930Ids: [] },

  // --- 7 EAST ---
  { id: '305V', name: '305V - Vending MSM', section: '7 East', physicalSection: '305', supervisorId: '3', status: 'Open', e700Ids: [], a930Ids: ['168'] },
  { id: '309L', name: '309L - Titos', section: '7 East', physicalSection: '309', supervisorId: '3', status: 'Open', e700Ids: ['300', '301'], a930Ids: [] },
  { id: '310F', name: '310F - Walking Taco', section: '7 East', physicalSection: '310', supervisorId: '3', status: 'Needs Power', e700Ids: ['302', '303'], a930Ids: [] },
  { id: '312B', name: '312B - Nutrl', section: '7 East', physicalSection: '312', supervisorId: '3', status: 'Open', e700Ids: ['304', '305'], a930Ids: [] },
  { id: '310S', name: '310S - Ice Crown', section: '7 East', physicalSection: '310', supervisorId: '3', status: 'Open', e700Ids: ['306', '307'], a930Ids: [] },
  { id: '312S', name: '312S - Totally Nutz', section: '7 East', physicalSection: '312', supervisorId: '3', status: 'Open', e700Ids: ['308'], a930Ids: [] },
  { id: '311S', name: '311S - Moosehead', section: '7 East', physicalSection: '311', supervisorId: '3', status: 'Open', e700Ids: ['309', '310'], a930Ids: [] },
  { id: '313S', name: '313S - Daddy\'s Dogs', section: '7 East', physicalSection: '313', supervisorId: '3', status: 'Open', e700Ids: ['311', '312'], a930Ids: [] },
  { id: '314B', name: '314B - Stella', section: '7 East', physicalSection: '314', supervisorId: '3', status: 'Open', e700Ids: ['313', '314'], a930Ids: [] },
  { id: '314S', name: '314S - Jet', section: '7 East', physicalSection: '314', supervisorId: '3', status: 'Open', e700Ids: ['315'], a930Ids: [] },
  { id: '315S', name: '315S - Ben & Jerry\'s', section: '7 East', physicalSection: '315', supervisorId: '3', status: 'Open', e700Ids: ['316'], a930Ids: ['169'] },
  { id: '316S', name: '316S - Ice Crown', section: '7 East', physicalSection: '316', supervisorId: '3', status: 'Open', e700Ids: ['317', '318'], a930Ids: [] },
  { id: '316L', name: '316L - Jack', section: '7 East', physicalSection: '316', supervisorId: '3', status: 'Open', e700Ids: ['319', '320'], a930Ids: [] },
  { id: '317G', name: '317G - Mich Ultra', section: '7 East', physicalSection: '317', supervisorId: '3', status: 'Open', e700Ids: ['321', '322'], a930Ids: [] },
  { id: '317S', name: '317S - Jet', section: '7 East', physicalSection: '317', supervisorId: '3', status: 'Open', e700Ids: ['323'], a930Ids: [] },
  { id: '318B', name: '318B - Mango Cart', section: '7 East', physicalSection: '318', supervisorId: '3', status: 'Open', e700Ids: ['324', '325'], a930Ids: [] },

  // --- 7 WEST ---
  { id: '329B', name: '329B - Mango Cart', section: '7 West', physicalSection: '329', supervisorId: '3', status: 'Open', e700Ids: ['326', '327'], a930Ids: [] },
  { id: '330G', name: '330G - 615 Market', section: '7 West', physicalSection: '330', supervisorId: '3', status: 'Open', e700Ids: ['328', '329'], a930Ids: [] },
  { id: '331S', name: '331S - Jet', section: '7 West', physicalSection: '331', supervisorId: '3', status: 'Open', e700Ids: ['330', '331'], a930Ids: [] },
  { id: '332S', name: '332S - Ice Crown', section: '7 West', physicalSection: '332', supervisorId: '3', status: 'Open', e700Ids: ['332', '333'], a930Ids: [] },
  { id: '333B', name: '333B - Mich Ultra', section: '7 West', physicalSection: '333', supervisorId: '3', status: 'Open', e700Ids: ['334', '335'], a930Ids: [] },
  { id: '333S', name: '333S - Jet', section: '7 West', physicalSection: '333', supervisorId: '3', status: 'Open', e700Ids: ['336'], a930Ids: [] },
  { id: '334B', name: '334B - Nutrl', section: '7 West', physicalSection: '334', supervisorId: '3', status: 'Open', e700Ids: ['337', '338'], a930Ids: [] },
  { id: '334S', name: '334S - Daddy\'s Dogs', section: '7 West', physicalSection: '334', supervisorId: '3', status: 'Open', e700Ids: ['339', '340'], a930Ids: [] },
  { id: '330S', name: '330S - Ben & Jerry\'s', section: '7 West', physicalSection: '330', supervisorId: '3', status: 'Open', e700Ids: ['341', '342'], a930Ids: [] },
  { id: '335S', name: '335S - Ice Crown', section: '7 West', physicalSection: '335', supervisorId: '3', status: 'Open', e700Ids: ['343', '344'], a930Ids: [] },
  { id: '336S', name: '336S - Moosehead', section: '7 West', physicalSection: '336', supervisorId: '3', status: 'Open', e700Ids: ['345', '346'], a930Ids: [] },
  { id: '338L', name: '338L - Titos', section: '7 West', physicalSection: '338', supervisorId: '3', status: 'Open', e700Ids: ['347', '348'], a930Ids: [] },
  { id: '337F', name: '337F - Walking Taco', section: '7 West', physicalSection: '337', supervisorId: '3', status: 'Open', e700Ids: ['349', '350'], a930Ids: [] },
  { id: '342V', name: '342V - Vending MSM', section: '7 West', physicalSection: '342', supervisorId: '3', status: 'Open', e700Ids: [], a930Ids: ['170', '171'] },
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
  staffingGroups: StandGroup[];
  npos: NPO[];
  addMessage: (msg: Omit<Message, 'id' | 'timestamp' | 'senderName' | 'senderRole'>) => void;
  updateStandStatus: (id: string, status: Stand['status']) => void;
  updateCount: (standId: string, itemId: string, field: keyof CountEntry, value: number) => void;
  createStaffingGroup: (group: Omit<StandGroup, 'id'>) => void;
}

export const useStore = create<AppState>((set, get) => ({
  currentUser: null,
  stands: MOCK_STANDS,
  messages: INITIAL_MESSAGES,
  npos: MOCK_NPOS,
  staffingGroups: [],
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
    }),
  createStaffingGroup: (group) => 
    set(state => ({
      staffingGroups: [...state.staffingGroups, { ...group, id: Math.random().toString(36).substr(2, 9) }]
    }))
}));
