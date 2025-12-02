import { useState } from 'react';
import { HelpCircle, X, Sparkles, BookOpen, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

// ═══════════════════════════════════════════════════════════════════════════
// ORBY GLOSSARY - Venue Operations Terminology
// ═══════════════════════════════════════════════════════════════════════════

export const GLOSSARY: Record<string, { term: string; definition: string; example?: string; category: string }> = {
  // Delivery & Requests
  'delivery': {
    term: 'Delivery',
    definition: 'A request for supplies to be brought from Warehouse, Kitchen, or Bar to a stand.',
    example: 'A stand requests 2 cases of Bud Light - that\'s a delivery request.',
    category: 'Operations'
  },
  'eta': {
    term: 'ETA (Estimated Time of Arrival)',
    definition: 'How many minutes until a delivery arrives at your stand.',
    example: 'ETA: 8 min means your order should arrive in about 8 minutes.',
    category: 'Operations'
  },
  'priority': {
    term: 'Priority Level',
    definition: 'How urgent a request is. Normal requests go in queue order. Emergency requests jump to the front.',
    example: 'Running out of hot dog buns during rush = Emergency priority.',
    category: 'Operations'
  },
  'acknowledged': {
    term: 'Acknowledged',
    definition: 'The department has seen your request and will start working on it.',
    example: 'Status changes to "Acknowledged" when Warehouse confirms they got your order.',
    category: 'Status'
  },
  'picking': {
    term: 'Picking',
    definition: 'Someone is actively gathering the items for your order.',
    example: 'When you see "Picking", your items are being pulled from the warehouse.',
    category: 'Status'
  },
  'on-the-way': {
    term: 'On The Way',
    definition: 'Your delivery has left the source and is being brought to your stand.',
    example: 'A runner has your items and is walking to your location.',
    category: 'Status'
  },

  // Roles & People
  'npo': {
    term: 'NPO (Non-Profit Organization)',
    definition: 'Volunteer workers from charitable organizations who staff concession stands during events.',
    example: 'Church groups, school teams, and community orgs often serve as NPOs.',
    category: 'Roles'
  },
  'stand-lead': {
    term: 'Stand Lead',
    definition: 'The person responsible for running a single concession stand during an event.',
    example: 'The Stand Lead manages the register, coordinates with NPO workers, and requests supplies.',
    category: 'Roles'
  },
  'supervisor': {
    term: 'Supervisor',
    definition: 'Oversees multiple stands in a section. Can request from all departments.',
    example: 'A Supervisor might manage 4-6 stands on the 100 level.',
    category: 'Roles'
  },
  'ops-controller': {
    term: 'Ops Controller',
    definition: 'Command-level staff who see all operations and can direct resources anywhere.',
    example: 'Sid and David are Ops Controllers with full visibility.',
    category: 'Roles'
  },

  // Locations & Stands
  'stand': {
    term: 'Stand',
    definition: 'A concession point that sells food, drinks, or merchandise to guests.',
    example: 'Stand 105 might sell hot dogs and beer on the 100 level.',
    category: 'Locations'
  },
  'section': {
    term: 'Section',
    definition: 'A group of stands in the same area, managed by one Supervisor.',
    example: 'Section 2 East includes stands 201-208.',
    category: 'Locations'
  },
  'hot-spot': {
    term: 'Hot Spot',
    definition: 'A stand experiencing high volume or issues that needs extra attention.',
    example: 'If Stand 105 has a 20-minute line, it becomes a Hot Spot.',
    category: 'Status'
  },
  'geofence': {
    term: 'Geofence',
    definition: 'A virtual boundary around the stadium. Your phone detects when you\'re inside it.',
    example: 'You can only check in when you\'re within 100 feet of the stadium.',
    category: 'Technology'
  },

  // Inventory
  'count-session': {
    term: 'Count Session',
    definition: 'A formal inventory count at a specific time (Pre-Event, Post-Event, or Day After).',
    example: 'Pre-Event count happens before doors open to verify starting inventory.',
    category: 'Inventory'
  },
  'variance': {
    term: 'Variance',
    definition: 'The difference between expected inventory and actual count. Can indicate theft, waste, or errors.',
    example: 'If you should have 50 beers but count 45, that\'s a -5 variance.',
    category: 'Inventory'
  },
  'par-level': {
    term: 'Par Level',
    definition: 'The ideal stock quantity for an item at a stand.',
    example: 'Par level of 24 for hot dogs means you should always have 24 on hand.',
    category: 'Inventory'
  },

  // Alcohol Compliance
  'violation': {
    term: 'Violation',
    definition: 'A rule infraction related to alcohol sales (expired ID check, over-serving, etc.).',
    example: 'Selling to someone without checking ID is a violation.',
    category: 'Compliance'
  },
  'vendor': {
    term: 'Vendor',
    definition: 'A person or company licensed to sell alcohol at the venue.',
    example: 'Third-party beer vendors need to follow all compliance rules.',
    category: 'Compliance'
  },

  // Communication
  'broadcast': {
    term: 'Broadcast',
    definition: 'A message sent to all staff or a specific group at once.',
    example: 'Weather alert broadcast goes to everyone: "Lightning delay - hold sales"',
    category: 'Communication'
  },
  'routing': {
    term: 'Message Routing',
    definition: 'Automatically sending messages to the right department based on content.',
    example: 'A request mentioning "POS frozen" routes to IT automatically.',
    category: 'Communication'
  },

  // System
  'sandbox': {
    term: 'Sandbox Mode',
    definition: 'A safe testing environment where actions don\'t affect real data.',
    example: 'Practice creating deliveries in Sandbox without worrying about mistakes.',
    category: 'System'
  },
  'audit-trail': {
    term: 'Audit Trail',
    definition: 'A complete history of all actions, messages, and changes for accountability.',
    example: 'Every delivery request is logged with who, what, when, and status changes.',
    category: 'System'
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// HELP TOOLTIP - Inline keyword help
// ═══════════════════════════════════════════════════════════════════════════

interface HelpTooltipProps {
  keyword: string;
  children?: React.ReactNode;
  className?: string;
}

export function HelpTooltip({ keyword, children, className }: HelpTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const entry = GLOSSARY[keyword.toLowerCase()];

  if (!entry) {
    return <span className={className}>{children || keyword}</span>;
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          "inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300 underline decoration-dotted underline-offset-2 cursor-help transition-colors",
          className
        )}
        data-testid={`help-${keyword}`}
      >
        {children || entry.term}
        <HelpCircle className="h-3 w-3" />
      </button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-cyan-500/30 max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center shadow-lg shadow-cyan-500/30">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-xs text-cyan-400 font-medium">{entry.category}</p>
                <DialogTitle className="text-white">{entry.term}</DialogTitle>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <p className="text-slate-300 leading-relaxed">{entry.definition}</p>
            
            {entry.example && (
              <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Example</p>
                <p className="text-sm text-slate-400 italic">"{entry.example}"</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION HELP BUTTON - (?) button for dashboard sections
// ═══════════════════════════════════════════════════════════════════════════

interface SectionHelpProps {
  title: string;
  description: string;
  tips?: string[];
  keywords?: string[];
}

export function SectionHelp({ title, description, tips, keywords }: SectionHelpProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(true)}
        className="h-6 w-6 text-slate-500 hover:text-cyan-400 hover:bg-cyan-500/10"
        data-testid={`section-help-${title.toLowerCase().replace(/\s+/g, '-')}`}
      >
        <HelpCircle className="h-4 w-4" />
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-cyan-500/30 max-w-lg">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center shadow-lg shadow-cyan-500/30">
                  <BookOpen className="h-7 w-7 text-white" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-slate-900 border-2 border-cyan-500 flex items-center justify-center">
                  <span className="text-xs">🪐</span>
                </div>
              </div>
              <div>
                <p className="text-xs text-cyan-400 font-medium">Orby says...</p>
                <DialogTitle className="text-white text-xl">{title}</DialogTitle>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <p className="text-slate-300 leading-relaxed">{description}</p>

            {tips && tips.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-slate-500 uppercase tracking-wider">Quick Tips</p>
                {tips.map((tip, i) => (
                  <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-slate-800/50 border border-slate-700/50">
                    <ChevronRight className="h-4 w-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-slate-400">{tip}</p>
                  </div>
                ))}
              </div>
            )}

            {keywords && keywords.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-slate-500 uppercase tracking-wider">Related Terms</p>
                <div className="flex flex-wrap gap-2">
                  {keywords.map(kw => {
                    const entry = GLOSSARY[kw];
                    return entry ? (
                      <span
                        key={kw}
                        className="px-2 py-1 text-xs rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                      >
                        {entry.term}
                      </span>
                    ) : null;
                  })}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ORBY GLOSSARY BROWSER - Full glossary modal
// ═══════════════════════════════════════════════════════════════════════════

interface OrbyGlossaryProps {
  isOpen: boolean;
  onClose: () => void;
}

export function OrbyGlossary({ isOpen, onClose }: OrbyGlossaryProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTerm, setSelectedTerm] = useState<string | null>(null);

  const categories = Array.from(new Set(Object.values(GLOSSARY).map(g => g.category)));
  const filteredTerms = selectedCategory 
    ? Object.entries(GLOSSARY).filter(([, v]) => v.category === selectedCategory)
    : Object.entries(GLOSSARY);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-cyan-500/30 max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center shadow-lg shadow-cyan-500/30">
                <BookOpen className="h-7 w-7 text-white" />
              </div>
              <Sparkles className="absolute -top-1 -right-1 h-5 w-5 text-yellow-400 animate-pulse" />
            </div>
            <div>
              <p className="text-xs text-cyan-400 font-medium">Learn with Orby</p>
              <DialogTitle className="text-white text-xl">Operations Glossary</DialogTitle>
            </div>
          </div>
        </DialogHeader>

        <div className="flex gap-2 overflow-x-auto pb-2 mt-4">
          <Button
            variant={selectedCategory === null ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(null)}
            className={selectedCategory === null 
              ? "bg-cyan-500 text-white" 
              : "border-slate-600 text-slate-300"
            }
          >
            All
          </Button>
          {categories.map(cat => (
            <Button
              key={cat}
              variant={selectedCategory === cat ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(cat)}
              className={cn(
                "whitespace-nowrap",
                selectedCategory === cat 
                  ? "bg-cyan-500 text-white" 
                  : "border-slate-600 text-slate-300"
              )}
            >
              {cat}
            </Button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 mt-2">
          <AnimatePresence mode="popLayout">
            {filteredTerms.map(([key, entry]) => (
              <motion.div
                key={key}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <button
                  onClick={() => setSelectedTerm(selectedTerm === key ? null : key)}
                  className={cn(
                    "w-full text-left p-3 rounded-lg border transition-all",
                    selectedTerm === key
                      ? "bg-cyan-500/10 border-cyan-500/50"
                      : "bg-slate-800/50 border-slate-700/50 hover:bg-slate-800"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-200">{entry.term}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-slate-700 text-slate-400">
                        {entry.category}
                      </span>
                    </div>
                    <ChevronRight className={cn(
                      "h-4 w-4 text-slate-400 transition-transform",
                      selectedTerm === key && "rotate-90"
                    )} />
                  </div>
                  
                  <AnimatePresence>
                    {selectedTerm === key && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <p className="text-sm text-slate-400 mt-2">{entry.definition}</p>
                        {entry.example && (
                          <p className="text-xs text-slate-500 mt-2 italic">
                            Example: "{entry.example}"
                          </p>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// FLOATING HELP BUTTON - Global help access
// ═══════════════════════════════════════════════════════════════════════════

export function FloatingHelpButton() {
  const [isGlossaryOpen, setIsGlossaryOpen] = useState(false);

  return (
    <>
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 1, type: 'spring' }}
        className="fixed bottom-6 left-6 z-50"
      >
        <Button
          onClick={() => setIsGlossaryOpen(true)}
          className="h-12 w-12 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 hover:from-violet-400 hover:to-purple-500 shadow-lg shadow-violet-500/30"
          data-testid="floating-help-button"
        >
          <HelpCircle className="h-5 w-5 text-white" />
        </Button>
      </motion.div>

      <OrbyGlossary isOpen={isGlossaryOpen} onClose={() => setIsGlossaryOpen(false)} />
    </>
  );
}
