import { useState, useEffect } from "react";
import { useStore } from "@/lib/mockData";
import { motion } from "framer-motion";
import { User, MessageSquare, ChevronRight, Users } from "lucide-react";
import { GlassCard, GlassCardContent, GlassCardHeader } from "@/components/ui/premium";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";

type TeamLead = {
  id: string;
  name: string;
  role: string;
  department?: string;
  isOnline?: boolean;
};

type DepartmentContact = {
  id: string;
  name: string;
  title: string;
  isTeamLead?: boolean;
};

const DEPARTMENT_TEAM_LEADS: Record<string, DepartmentContact | null> = {
  Warehouse: { id: 'sharrod', name: 'Sharrod', title: 'Warehouse Team Lead', isTeamLead: true },
  Kitchen: null,
  Operations: null,
  Bar: null,
  IT: null,
  HR: null,
};

const DEPARTMENT_MANAGERS: Record<string, DepartmentContact[]> = {
  Warehouse: [
    { id: 'aj', name: 'AJ', title: 'Warehouse Manager' },
    { id: 'jay', name: 'Jay', title: 'Purchasing Manager' },
  ],
  Kitchen: [
    { id: 'bobby', name: 'Bobby', title: 'Kitchen Manager' },
    { id: 'deb', name: 'Chef Deb', title: 'Culinary Manager' },
  ],
  Operations: [
    { id: 'shelia', name: 'Shelia', title: 'Operations Manager' },
  ],
  Bar: [
    { id: 'darby', name: 'Darby', title: 'Bar Manager' },
  ],
  IT: [
    { id: 'david', name: 'David', title: 'IT & Ops Manager' },
  ],
  HR: [
    { id: 'brooke-k', name: 'Brooke K', title: 'HR Manager' },
  ],
};

export function TeamLeadCard({ department }: { department?: string }) {
  const currentUser = useStore((state) => state.currentUser);
  const [, setLocation] = useLocation();
  const [teamLead, setTeamLead] = useState<TeamLead | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTeamLead() {
      if (!currentUser?.teamLeadId) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/users/${currentUser.teamLeadId}`);
        if (response.ok) {
          const lead = await response.json();
          setTeamLead(lead);
        }
      } catch (error) {
        console.error('Failed to fetch team lead:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchTeamLead();
  }, [currentUser?.teamLeadId]);

  const dept = department || (currentUser?.department as string);
  const managers = dept ? DEPARTMENT_MANAGERS[dept] : [];
  const defaultTeamLead = dept ? DEPARTMENT_TEAM_LEADS[dept] : null;
  const displayLead = teamLead || (defaultTeamLead ? {
    id: defaultTeamLead.id,
    name: defaultTeamLead.name,
    role: 'TeamLead',
    department: dept,
    isOnline: false
  } : null);

  return (
    <GlassCard data-testid="card-team-lead">
      <GlassCardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-cyan-500/20">
            <Users className="h-4 w-4 text-cyan-400" />
          </div>
          <span className="font-bold text-sm text-slate-200">Your Team</span>
        </div>
      </GlassCardHeader>
      <GlassCardContent className="space-y-4 pt-0">
        {loading ? (
          <div className="flex items-center justify-center py-4">
            <div className="w-5 h-5 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" />
          </div>
        ) : displayLead ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 bg-cyan-500/10 rounded-xl border border-cyan-500/20"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                  <User className="h-5 w-5 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-200">{displayLead.name}</span>
                    <Badge className="text-[10px] bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                      Team Lead
                    </Badge>
                  </div>
                  <span className="text-xs text-slate-400">{defaultTeamLead?.title || displayLead.department}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {displayLead.isOnline && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-cyan-400 hover:bg-cyan-500/10"
                  onClick={() => setLocation('/messages')}
                  data-testid="button-message-team-lead"
                >
                  <MessageSquare className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        ) : (
          <div className="text-center py-4">
            <p className="text-sm text-slate-500">No team lead assigned</p>
            <p className="text-xs text-slate-600 mt-1">Contact your manager directly</p>
          </div>
        )}

        {managers.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Department Managers
            </h4>
            {managers.map((manager, idx) => (
              <motion.div
                key={manager.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="flex items-center justify-between p-2 bg-white/5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                onClick={() => setLocation('/messages')}
                data-testid={`manager-${manager.id}`}
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center">
                    <User className="h-4 w-4 text-slate-400" />
                  </div>
                  <div>
                    <span className="text-sm text-slate-200">{manager.name}</span>
                    <span className="text-xs text-slate-500 block">{manager.title}</span>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-500" />
              </motion.div>
            ))}
          </div>
        )}
      </GlassCardContent>
    </GlassCard>
  );
}
