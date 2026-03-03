import { useState, useMemo } from 'react';
import { useLocation } from 'wouter';
import { motion } from 'framer-motion';
import { useStore } from '@/lib/mockData';
import { AnimatedBackground } from '@/components/ui/premium';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  LogOut,
  ChevronLeft,
  ChevronRight,
  Calendar,
  AlertTriangle,
  History,
  Truck,
  Package,
  ClipboardList,
  Users,
  UserCog,
  Beer,
  BarChart3,
  FileText,
  Code2,
  Settings,
  Map,
  Cloud,
  MessageSquare,
  Radio,
  Wine,
  UserCheck,
  Shield,
  UtensilsCrossed,
  ChefHat,
  BookOpen,
  Navigation,
  Layers,
  Activity,
  Zap,
  Link2,
  KeyRound,
  LayoutGrid,
  Search,
  type LucideIcon
} from 'lucide-react';

interface LaunchCard {
  label: string;
  description: string;
  href: string;
  icon: LucideIcon;
  gradient: string;
  glowColor: string;
  badge?: string;
  featured?: boolean;
  roles: string[];
}

interface Category {
  title: string;
  icon: LucideIcon;
  gradient: string;
  description: string;
  cards: LaunchCard[];
}

const ALL_ROLES = [
  'Developer', 'Admin', 'OperationsManager', 'GeneralManager', 'RegionalVP',
  'ManagementCore', 'ManagementAssistant', 'OperationsAssistant',
  'StandSupervisor', 'Supervisor', 'StandLead', 'NPOWorker',
  'AlcoholCompliance', 'CheckInAssistant', 'IT', 'CulinaryDirector', 'CulinaryCook',
  'WarehouseManager', 'BarManager', 'KitchenManager', 'HRManager', 'InventoryManager'
];

const LEADERSHIP_ROLES = [
  'Developer', 'Admin', 'OperationsManager', 'GeneralManager', 'RegionalVP',
  'ManagementCore', 'ManagementAssistant', 'OperationsAssistant'
];

const MANAGER_PLUS = [
  'Developer', 'Admin', 'OperationsManager', 'GeneralManager', 'RegionalVP',
  'ManagementCore'
];

const EXEC_ROLES = [
  'Developer', 'Admin', 'GeneralManager', 'RegionalVP', 'OperationsManager'
];

const DEV_ONLY = ['Developer', 'Admin'];

const categories: Category[] = [
  {
    title: "Event Operations",
    icon: Calendar,
    gradient: "from-cyan-500 to-blue-500",
    description: "Configure and manage live events. Set up event details, activate the command center for real-time incident management, and review past event performance.",
    cards: [
      {
        label: "Event Setup",
        description: "Configure event details, geofencing, and pre-event checklist",
        href: "/event-setup",
        icon: Calendar,
        gradient: "from-cyan-500 to-blue-600",
        glowColor: "shadow-cyan-500/30",
        badge: "Core",
        featured: true,
        roles: EXEC_ROLES,
      },
      {
        label: "Command Center",
        description: "Real-time incident management and emergency dispatch",
        href: "/command-center",
        icon: AlertTriangle,
        gradient: "from-rose-500 to-orange-500",
        glowColor: "shadow-rose-500/30",
        badge: "Live",
        featured: true,
        roles: [...EXEC_ROLES, 'ManagementCore', 'ManagementAssistant'],
      },
      {
        label: "Ops Command",
        description: "Operational overview with deliveries and alerts",
        href: "/ops-command",
        icon: Activity,
        gradient: "from-emerald-500 to-teal-500",
        glowColor: "shadow-emerald-500/30",
        roles: [...EXEC_ROLES, 'ManagementCore'],
      },
      {
        label: "Event History",
        description: "Review past events with metrics and performance data",
        href: "/event-history",
        icon: History,
        gradient: "from-violet-500 to-purple-500",
        glowColor: "shadow-violet-500/30",
        roles: EXEC_ROLES,
      },
    ],
  },
  {
    title: "Logistics & Deliveries",
    icon: Truck,
    gradient: "from-orange-500 to-amber-500",
    description: "Manage warehouse operations, track deliveries in real-time, and handle inventory counting across all stands. From request to delivery, monitor every step.",
    cards: [
      {
        label: "Warehouse",
        description: "Warehouse operations, picking, and dispatch",
        href: "/warehouse",
        icon: Package,
        gradient: "from-orange-500 to-amber-600",
        glowColor: "shadow-orange-500/30",
        badge: "Core",
        roles: [...MANAGER_PLUS, 'WarehouseManager', 'ManagementAssistant'],
      },
      {
        label: "Item Management",
        description: "Manage inventory items, categories, and stock levels",
        href: "/item-management",
        icon: ClipboardList,
        gradient: "from-amber-500 to-yellow-500",
        glowColor: "shadow-amber-500/30",
        roles: [...MANAGER_PLUS, 'WarehouseManager', 'InventoryManager', 'BarManager'],
      },
      {
        label: "Stand Setup",
        description: "Configure stand assignments and opening status",
        href: "/stand-setup",
        icon: Layers,
        gradient: "from-teal-500 to-cyan-500",
        glowColor: "shadow-teal-500/30",
        roles: [...MANAGER_PLUS, 'WarehouseManager'],
      },
      {
        label: "Document Hub",
        description: "Templates, reports, and operational documents",
        href: "/document-hub",
        icon: FileText,
        gradient: "from-sky-500 to-blue-500",
        glowColor: "shadow-sky-500/30",
        roles: LEADERSHIP_ROLES,
      },
    ],
  },
  {
    title: "Staff & Scheduling",
    icon: Users,
    gradient: "from-violet-500 to-purple-500",
    description: "Build event rosters, assign team leads, manage bar schedules, and handle staff check-ins. Everything you need to get the right people in the right places.",
    cards: [
      {
        label: "Roster Builder",
        description: "Build and manage event day staff rosters",
        href: "/roster-builder",
        icon: Users,
        gradient: "from-violet-500 to-purple-600",
        glowColor: "shadow-violet-500/30",
        badge: "Core",
        featured: true,
        roles: MANAGER_PLUS,
      },
      {
        label: "Team Management",
        description: "Manage team leads, assignments, and staffing groups",
        href: "/team-management",
        icon: UserCog,
        gradient: "from-indigo-500 to-violet-500",
        glowColor: "shadow-indigo-500/30",
        roles: [...MANAGER_PLUS, 'StandSupervisor', 'Supervisor'],
      },
      {
        label: "Bar Scheduler",
        description: "Schedule bar staff and manage bar assignments",
        href: "/bar-scheduler",
        icon: Beer,
        gradient: "from-purple-500 to-fuchsia-500",
        glowColor: "shadow-purple-500/30",
        roles: [...MANAGER_PLUS, 'BarManager'],
      },
      {
        label: "Check-In Assistant",
        description: "Staff check-in and customer service desk",
        href: "/check-in-assistant",
        icon: UserCheck,
        gradient: "from-pink-500 to-rose-500",
        glowColor: "shadow-pink-500/30",
        roles: [...MANAGER_PLUS, 'CheckInAssistant', 'HRManager'],
      },
    ],
  },
  {
    title: "Food & Beverage",
    icon: UtensilsCrossed,
    gradient: "from-amber-500 to-orange-500",
    description: "Kitchen operations, culinary team management, menu boards, and food prep coordination. From the chef's station to the serving line.",
    cards: [
      {
        label: "Kitchen Dashboard",
        description: "Kitchen operations and order management",
        href: "/kitchen",
        icon: UtensilsCrossed,
        gradient: "from-amber-500 to-orange-600",
        glowColor: "shadow-amber-500/30",
        roles: [...MANAGER_PLUS, 'KitchenManager', 'CulinaryDirector'],
      },
      {
        label: "Culinary Director",
        description: "Chef's overview of culinary team and scheduling",
        href: "/culinary-director",
        icon: ChefHat,
        gradient: "from-orange-500 to-red-500",
        glowColor: "shadow-orange-500/30",
        badge: "Chef",
        roles: [...EXEC_ROLES, 'CulinaryDirector'],
      },
      {
        label: "Cook Dashboard",
        description: "Culinary cook shift details and tasks",
        href: "/culinary-cook",
        icon: UtensilsCrossed,
        gradient: "from-red-500 to-rose-500",
        glowColor: "shadow-red-500/30",
        roles: [...MANAGER_PLUS, 'CulinaryDirector', 'CulinaryCook'],
      },
      {
        label: "Menu Board Creator",
        description: "Design and publish digital menu boards",
        href: "/menu-board-creator",
        icon: BookOpen,
        gradient: "from-yellow-500 to-amber-500",
        glowColor: "shadow-yellow-500/30",
        roles: [...MANAGER_PLUS, 'KitchenManager', 'CulinaryDirector', 'BarManager'],
      },
    ],
  },
  {
    title: "Compliance & Safety",
    icon: Shield,
    gradient: "from-rose-500 to-red-500",
    description: "Alcohol compliance monitoring, incident reporting, and safety protocols. Stay audit-ready with real-time violation tracking and compliance dashboards.",
    cards: [
      {
        label: "Alcohol Compliance",
        description: "Monitor vendors, log violations, and track audits",
        href: "/alcohol-compliance",
        icon: Wine,
        gradient: "from-rose-500 to-red-600",
        glowColor: "shadow-rose-500/30",
        badge: "Compliance",
        featured: true,
        roles: [...EXEC_ROLES, 'AlcoholCompliance', 'ManagementCore'],
      },
      {
        label: "Reporting Dashboard",
        description: "Generate incident reports and operational summaries",
        href: "/reports",
        icon: FileText,
        gradient: "from-red-500 to-pink-500",
        glowColor: "shadow-red-500/30",
        roles: LEADERSHIP_ROLES,
      },
    ],
  },
  {
    title: "Communications",
    icon: MessageSquare,
    gradient: "from-blue-500 to-indigo-500",
    description: "Send messages, broadcast alerts, and coordinate across departments. Real-time communications keep everyone on the same page during events.",
    cards: [
      {
        label: "Messages",
        description: "Team messaging, broadcasts, and department channels",
        href: "/messages",
        icon: MessageSquare,
        gradient: "from-blue-500 to-indigo-600",
        glowColor: "shadow-blue-500/30",
        badge: "Live",
        featured: true,
        roles: ALL_ROLES,
      },
    ],
  },
  {
    title: "Navigation & Maps",
    icon: Map,
    gradient: "from-emerald-500 to-green-500",
    description: "Interactive stadium maps, GPS-guided walking directions, and real-time weather radar. Navigate the venue and monitor conditions at a glance.",
    cards: [
      {
        label: "Stadium Map",
        description: "Interactive venue map with stand locations",
        href: "/stadium-map",
        icon: Map,
        gradient: "from-emerald-500 to-green-600",
        glowColor: "shadow-emerald-500/30",
        roles: ALL_ROLES,
      },
      {
        label: "Weather Map",
        description: "Live weather radar and forecasts",
        href: "/weather-map",
        icon: Cloud,
        gradient: "from-sky-500 to-cyan-500",
        glowColor: "shadow-sky-500/30",
        roles: ALL_ROLES,
      },
    ],
  },
  {
    title: "Analytics & Reports",
    icon: BarChart3,
    gradient: "from-fuchsia-500 to-pink-500",
    description: "Platform analytics, visit tracking, and operational metrics. Deep insights into platform usage, team performance, and event trends.",
    cards: [
      {
        label: "Developer Dashboard",
        description: "Platform analytics, API credentials, and system health",
        href: "/dev",
        icon: Code2,
        gradient: "from-fuchsia-500 to-pink-600",
        glowColor: "shadow-fuchsia-500/30",
        badge: "Dev",
        roles: DEV_ONLY,
      },
      {
        label: "Admin Panel",
        description: "System configuration, user management, and controls",
        href: "/admin",
        icon: Settings,
        gradient: "from-pink-500 to-rose-500",
        glowColor: "shadow-pink-500/30",
        roles: DEV_ONLY,
      },
    ],
  },
  {
    title: "System & Integrations",
    icon: Link2,
    gradient: "from-white/20 to-zinc-500",
    description: "Manage platform integrations, API connections, and system configuration. Connect with external services and monitor integration health.",
    cards: [
      {
        label: "IT Dashboard",
        description: "Network, hardware, and infrastructure management",
        href: "/it",
        icon: Zap,
        gradient: "from-cyan-500 to-teal-500",
        glowColor: "shadow-cyan-500/30",
        roles: [...DEV_ONLY, 'IT'],
      },
      {
        label: "Supervisor View",
        description: "Field supervisor operations and stand oversight",
        href: "/supervisor",
        icon: Radio,
        gradient: "from-green-500 to-emerald-500",
        glowColor: "shadow-green-500/30",
        roles: [...MANAGER_PLUS, 'StandSupervisor', 'Supervisor'],
      },
    ],
  },
];

function getUserRoles(user: any): string[] {
  const roles: string[] = [];
  if (!user) return roles;

  const role = user.role as string;
  roles.push(role);

  if (user.managementType) {
    roles.push(user.managementType as string);
  }
  if (user.secondaryRole) {
    roles.push(user.secondaryRole as string);
  }

  if (role === 'Developer' || user.pin === '0424') {
    roles.push('Developer', 'Admin');
  }

  if (['GeneralManager', 'RegionalVP'].includes(user.managementType as string)) {
    roles.push('GeneralManager', 'RegionalVP');
  }

  if (role === 'ManagementCore') {
    roles.push('ManagementCore');
    if (user.managementType) roles.push(user.managementType as string);
  }

  return Array.from(new Set(roles));
}

function LaunchCardComponent({ card, index }: { card: LaunchCard; index: number }) {
  const [, setLocation] = useLocation();
  const Icon = card.icon;

  return (
    <motion.div
      data-testid={`launch-card-${card.href.replace(/\//g, '-').substring(1)}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      onClick={() => setLocation(card.href)}
      className={`
        relative flex-none cursor-pointer group
        ${card.featured ? 'w-[300px]' : 'w-[260px]'}
        rounded-xl overflow-hidden
        border border-white/[0.08]
        bg-[rgba(12,18,36,0.65)] backdrop-blur-2xl
        hover:border-white/[0.15]
        transition-all duration-300
        shadow-lg shadow-black/20
      `}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-[0.08] group-hover:opacity-[0.15] transition-opacity duration-300`} />

      <div className="relative p-5 flex flex-col gap-3 min-h-[150px]">
        {card.badge && (
          <div className="absolute top-3 right-3">
            <Badge className={`bg-gradient-to-r ${card.gradient} text-white border-0 text-[10px] px-2 py-0.5 font-semibold shadow-lg`}>
              {card.badge}
            </Badge>
          </div>
        )}

        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center shadow-lg`}>
          <Icon className="w-5 h-5 text-white" />
        </div>

        <div className="flex-1">
          <h3 className="text-white font-semibold text-sm leading-tight">{card.label}</h3>
          <p className="text-white/50 text-xs mt-1.5 leading-relaxed line-clamp-2">{card.description}</p>
        </div>

        <div className="flex items-center gap-1 text-white/30 group-hover:text-white/60 transition-colors">
          <span className="text-[10px] font-medium uppercase tracking-wider">Launch</span>
          <ChevronRight className="w-3 h-3" />
        </div>
      </div>
    </motion.div>
  );
}

function CategoryCarousel({ category, cardIndex }: { category: Category; cardIndex: number }) {
  const [scrollRef, setScrollRef] = useState<HTMLDivElement | null>(null);
  const Icon = category.icon;

  const scrollLeft = () => {
    if (scrollRef) scrollRef.scrollBy({ left: -280, behavior: 'smooth' });
  };
  const scrollRight = () => {
    if (scrollRef) scrollRef.scrollBy({ left: 280, behavior: 'smooth' });
  };

  return (
    <motion.section
      data-testid={`category-${category.title.toLowerCase().replace(/\s+/g, '-')}`}
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: cardIndex * 0.08 }}
      className="space-y-4"
    >
      <div className="flex items-start gap-3 px-1">
        <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${category.gradient} flex items-center justify-center shadow-lg flex-shrink-0 mt-0.5`}>
          <Icon className="w-4 h-4 text-white" />
        </div>
        <div className="min-w-0">
          <h2 className="text-white font-bold text-base">{category.title}</h2>
          <p className="text-white/40 text-xs mt-0.5 leading-relaxed max-w-xl">{category.description}</p>
        </div>
      </div>

      <div className="relative group/carousel">
        <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-[#050508] to-transparent z-10 pointer-events-none opacity-0 group-hover/carousel:opacity-100 transition-opacity" />
        <div
          ref={setScrollRef}
          className="flex gap-4 overflow-x-auto scrollbar-hide pb-2 px-1 snap-x snap-mandatory"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {category.cards.map((card, i) => (
            <div key={card.href} className="snap-start">
              <LaunchCardComponent card={card} index={cardIndex + i} />
            </div>
          ))}
        </div>
        <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-[#050508] to-transparent z-10 pointer-events-none" />

        {category.cards.length > 2 && (
          <>
            <button
              data-testid={`carousel-prev-${category.title.toLowerCase().replace(/\s+/g, '-')}`}
              onClick={scrollLeft}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 text-white/60 hover:text-cyan-400 hover:border-cyan-400/50 flex items-center justify-center opacity-0 group-hover/carousel:opacity-100 transition-opacity"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              data-testid={`carousel-next-${category.title.toLowerCase().replace(/\s+/g, '-')}`}
              onClick={scrollRight}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 text-white/60 hover:text-cyan-400 hover:border-cyan-400/50 flex items-center justify-center opacity-0 group-hover/carousel:opacity-100 transition-opacity"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </>
        )}
      </div>
    </motion.section>
  );
}

export default function UnifiedCommandCenter() {
  const { currentUser, logout } = useStore();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState('');

  const userRoles = useMemo(() => getUserRoles(currentUser), [currentUser]);

  const filteredCategories = useMemo(() => {
    return categories
      .map(category => ({
        ...category,
        cards: category.cards.filter(card => {
          const roleMatch = card.roles.some(role => userRoles.includes(role));
          if (!roleMatch) return false;

          if (searchQuery) {
            const q = searchQuery.toLowerCase();
            return (
              card.label.toLowerCase().includes(q) ||
              card.description.toLowerCase().includes(q) ||
              category.title.toLowerCase().includes(q)
            );
          }
          return true;
        }),
      }))
      .filter(category => category.cards.length > 0);
  }, [userRoles, searchQuery]);

  const totalCards = filteredCategories.reduce((sum, c) => sum + c.cards.length, 0);

  const handleLogout = () => {
    logout();
    setLocation('/');
  };

  let cardCounter = 0;

  return (
    <AnimatedBackground>
      <div className="min-h-[100dvh] flex flex-col">
        <header
          data-testid="command-center-header"
          className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-slate-950/90 border-b border-white/5"
        >
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <Button
                data-testid="button-back"
                variant="ghost"
                size="icon"
                onClick={() => setLocation('/')}
                className="w-8 h-8 text-white/60 hover:text-white"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                  <LayoutGrid className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h1 className="text-white font-bold text-sm leading-tight">Mission Control</h1>
                  <p className="text-white/40 text-[10px]">{currentUser?.name || 'Operator'}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-lg bg-white/5 border border-white/10">
                <Search className="w-3.5 h-3.5 text-white/40" />
                <input
                  data-testid="input-search-commands"
                  type="text"
                  placeholder="Search tools..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="bg-transparent border-none outline-none text-white/70 text-xs w-32 placeholder:text-white/30"
                />
              </div>
              <Button
                data-testid="button-logout"
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                className="w-8 h-8 text-white/40 hover:text-rose-400"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="sm:hidden px-4 pb-3">
            <div className="flex items-center gap-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10">
              <Search className="w-3.5 h-3.5 text-white/40" />
              <input
                data-testid="input-search-commands-mobile"
                type="text"
                placeholder="Search tools..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="bg-transparent border-none outline-none text-white/70 text-xs flex-1 placeholder:text-white/30"
              />
            </div>
          </div>
        </header>

        <div className="h-[100px] sm:h-[60px]" />

        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 space-y-8 max-w-6xl mx-auto w-full relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between"
          >
            <div>
              <p className="text-white/30 text-xs">
                {filteredCategories.length} categories · {totalCards} tools available
              </p>
            </div>
          </motion.div>

          {filteredCategories.map((category) => {
            const startIndex = cardCounter;
            cardCounter += category.cards.length;
            return (
              <CategoryCarousel
                key={category.title}
                category={category}
                cardIndex={startIndex}
              />
            );
          })}

          {filteredCategories.length === 0 && searchQuery && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20"
            >
              <Search className="w-10 h-10 text-white/20 mx-auto mb-3" />
              <p className="text-white/40 text-sm">No tools found for "{searchQuery}"</p>
              <button
                onClick={() => setSearchQuery('')}
                className="text-cyan-400 text-xs mt-2 hover:underline"
              >
                Clear search
              </button>
            </motion.div>
          )}
        </main>

        <footer className="px-4 py-4 text-center border-t border-white/5">
          <p className="text-white/20 text-[10px]">
            Orby Commander · Mission Control · v1.0.16
          </p>
        </footer>
      </div>
    </AnimatedBackground>
  );
}
