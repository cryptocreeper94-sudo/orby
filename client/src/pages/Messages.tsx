import { useStore } from "@/lib/mockData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { 
  Send, ArrowLeft, User as UserIcon, Shield, Briefcase, Monitor, Warehouse, ChefHat,
  Phone, RefreshCw, AlertCircle, PhoneCall, Clock, MessageSquare, Users, Bell, Settings
} from "lucide-react";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import { QUICK_CALL_ROLES } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { LayoutShell, BentoCard, CarouselRail, AccordionStack } from "@/components/ui/bento";
import { cn } from "@/lib/utils";

interface DepartmentContact {
  id: string;
  department: string;
  contactName: string;
  phoneNumber: string;
  alternatePhone?: string;
  isActive: boolean;
}

interface UnansweredMessage {
  id: string;
  content: string;
  sentAt: Date;
  targetDepartment?: string;
  elapsedMinutes: number;
}

export default function MessagesPage() {
  const [, setLocation] = useLocation();
  const messages = useStore((state) => state.messages);
  const users = useStore((state) => state.users);
  const addMessage = useStore((state) => state.addMessage);
  const currentUser = useStore((state) => state.currentUser);
  const fetchAll = useStore((state) => state.fetchAll);

  useEffect(() => {
    if (users.length === 0) {
      fetchAll();
    }
  }, [users.length, fetchAll]);
  
  const [newMessage, setNewMessage] = useState("");
  const [departmentContacts, setDepartmentContacts] = useState<DepartmentContact[]>([]);
  const [isQuickCallOpen, setIsQuickCallOpen] = useState(false);
  const [unansweredMessages, setUnansweredMessages] = useState<UnansweredMessage[]>([]);

  useEffect(() => {
    fetch('/api/department-contacts')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setDepartmentContacts(data);
        }
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    const checkUnanswered = () => {
      const now = new Date();
      const myMessages = messages.filter(m => m.senderId === currentUser?.id && m.type === 'Request');
      
      const unanswered: UnansweredMessage[] = [];
      myMessages.forEach(msg => {
        const sentTime = msg.createdAt ? new Date(msg.createdAt) : new Date();
        const elapsedMinutes = Math.floor((now.getTime() - sentTime.getTime()) / 60000);
        
        if (elapsedMinutes >= 2) {
          const hasReply = messages.some(m => 
            m.senderId !== currentUser?.id && 
            m.createdAt && msg.createdAt &&
            new Date(m.createdAt) > new Date(msg.createdAt)
          );
          
          if (!hasReply) {
            const content = msg.content.toLowerCase();
            let targetDepartment = undefined;
            if (content.includes('warehouse') || content.includes('product') || content.includes('stock')) {
              targetDepartment = 'Warehouse';
            } else if (content.includes('kitchen') || content.includes('food') || content.includes('cook')) {
              targetDepartment = 'Kitchen';
            } else if (content.includes('bar') || content.includes('drink') || content.includes('alcohol')) {
              targetDepartment = 'Bar';
            } else if (content.includes('it') || content.includes('tech') || content.includes('computer') || content.includes('pos')) {
              targetDepartment = 'IT';
            } else if (content.includes('clean') || content.includes('spill') || content.includes('ops') || content.includes('operations')) {
              targetDepartment = 'Operations';
            } else if (content.includes('hr') || content.includes('payroll') || content.includes('schedule')) {
              targetDepartment = 'HR';
            }
            
            unanswered.push({
              id: msg.id,
              content: msg.content,
              sentAt: sentTime,
              targetDepartment,
              elapsedMinutes
            });
          }
        }
      });
      
      setUnansweredMessages(unanswered);
    };
    
    checkUnanswered();
    const interval = setInterval(checkUnanswered, 30000);
    return () => clearInterval(interval);
  }, [messages, currentUser]);

  const canQuickCall = currentUser && QUICK_CALL_ROLES.includes(currentUser.role);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUser) return;
    
    addMessage({
      content: newMessage,
      type: 'Request'
    });
    setNewMessage("");
  };

  const handleQuickCall = (phoneNumber: string) => {
    window.location.href = `tel:${phoneNumber}`;
    setIsQuickCallOpen(false);
  };

  const handleResend = (messageId: string) => {
    const originalMsg = messages.find(m => m.id === messageId);
    if (originalMsg) {
      addMessage({
        content: `[RESENT] ${originalMsg.content}`,
        type: 'Request'
      });
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'Admin': return <Shield className="h-3 w-3" />;
      case 'Supervisor': return <UserIcon className="h-3 w-3" />;
      case 'IT': return <Monitor className="h-3 w-3" />;
      case 'Warehouse': return <Warehouse className="h-3 w-3" />;
      case 'Kitchen': return <ChefHat className="h-3 w-3" />;
      default: return <Briefcase className="h-3 w-3" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'Admin': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'IT': return 'bg-cyan-100 text-cyan-700 border-cyan-200';
      case 'Supervisor': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Warehouse': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'Kitchen': return 'bg-rose-100 text-rose-700 border-rose-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getDepartmentIcon = (dept: string) => {
    switch (dept) {
      case 'Warehouse': return <Warehouse className="h-4 w-4" />;
      case 'Kitchen': return <ChefHat className="h-4 w-4" />;
      case 'Bar': return <Briefcase className="h-4 w-4" />;
      case 'IT': return <Monitor className="h-4 w-4" />;
      case 'Janitorial': return <Briefcase className="h-4 w-4" />;
      default: return <Phone className="h-4 w-4" />;
    }
  };

  const onlineUsers = users.filter(u => u.isOnline);
  const totalMessages = messages.length;
  const myMessages = messages.filter(m => m.senderId === currentUser?.id).length;

  const messageMetrics = [
    { label: "Total Messages", value: totalMessages, icon: <MessageSquare className="h-4 w-4 text-cyan-400" /> },
    { label: "My Messages", value: myMessages, icon: <Send className="h-4 w-4 text-blue-400" /> },
    { label: "Users Online", value: onlineUsers.length, icon: <Users className="h-4 w-4 text-green-400" /> },
    { label: "Unanswered", value: unansweredMessages.length, icon: <AlertCircle className="h-4 w-4 text-amber-400" /> },
  ];

  const settingsItems = [
    {
      title: "Notification Preferences",
      content: (
        <ul className="space-y-1 text-xs">
          <li>• Desktop notifications: Enabled</li>
          <li>• Sound alerts: Enabled</li>
          <li>• Email digest: Daily</li>
          <li>• Priority alerts only: Off</li>
        </ul>
      )
    },
    {
      title: "Quick Call Settings",
      content: (
        <ul className="space-y-1 text-xs">
          <li>• Auto-dial enabled: Yes</li>
          <li>• Show contact names: Yes</li>
          <li>• Preferred department: None</li>
        </ul>
      )
    },
    {
      title: "Message History",
      content: (
        <p className="text-xs">
          Messages are retained for 30 days. Export your message history 
          from the settings menu before archival.
        </p>
      )
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex flex-col" data-testid="messages-page">
      <header className="sticky top-0 z-10 bg-slate-950/95 backdrop-blur-sm border-b border-cyan-500/20 px-4 h-14 flex items-center gap-3 shadow-sm shrink-0">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => window.history.back()} 
          className="-ml-2"
          data-testid="button-back"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="font-bold text-lg flex-1 text-slate-200" data-testid="text-title">Team Communication</div>
        
        {canQuickCall && (
          <Dialog open={isQuickCallOpen} onOpenChange={setIsQuickCallOpen}>
            <DialogTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                className="bg-cyan-500/10 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20"
                data-testid="button-quick-call"
              >
                <Phone className="h-4 w-4 mr-2" />
                Quick Call
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-900 border-cyan-500/30">
              <DialogHeader>
                <DialogTitle className="text-slate-100 flex items-center gap-2">
                  <PhoneCall className="h-5 w-5 text-cyan-400" />
                  Call Department
                </DialogTitle>
                <DialogDescription className="text-slate-400">
                  Select a department to call directly
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3 mt-4">
                {departmentContacts.map((contact) => (
                  <div 
                    key={contact.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-700"
                    data-testid={`contact-${contact.department.toLowerCase()}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-cyan-500/20 text-cyan-400">
                        {getDepartmentIcon(contact.department)}
                      </div>
                      <div>
                        <p className="font-medium text-slate-200">{contact.department}</p>
                        <p className="text-sm text-slate-400">{contact.contactName}</p>
                      </div>
                    </div>
                    <Button 
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => handleQuickCall(contact.phoneNumber)}
                      data-testid={`button-call-${contact.department.toLowerCase()}`}
                    >
                      <Phone className="h-4 w-4 mr-2" />
                      Call
                    </Button>
                  </div>
                ))}
                {departmentContacts.length === 0 && (
                  <p className="text-center text-slate-400 py-4">No department contacts configured</p>
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}
        
        <div className="flex -space-x-2 overflow-hidden">
          {onlineUsers.slice(0, 5).map(u => (
            <div key={u.id} className="relative inline-block border-2 border-slate-900 rounded-full" title={`${u.name} (${u.role})`}>
              <Avatar className="h-8 w-8">
                <AvatarFallback className={`text-[10px] font-bold ${getRoleColor(u.role)}`}>
                  {u.name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="absolute bottom-0 right-0 block h-2 w-2 rounded-full bg-green-500 ring-1 ring-slate-900" />
            </div>
          ))}
          {onlineUsers.length > 5 && (
            <div className="w-8 h-8 rounded-full bg-slate-800 border-2 border-slate-900 flex items-center justify-center text-[10px] text-slate-400">
              +{onlineUsers.length - 5}
            </div>
          )}
        </div>
      </header>

      <main className="flex-1 p-3 max-w-7xl mx-auto w-full">
        <LayoutShell className="gap-3 h-full">
          <BentoCard span={12} title="Message Metrics" data-testid="card-metrics">
            <CarouselRail
              items={messageMetrics.map((metric, idx) => (
                <div key={idx} className="w-32 p-3 bg-slate-800/50 rounded-lg border border-slate-700/50" data-testid={`metric-${metric.label.toLowerCase().replace(/\s+/g, '-')}`}>
                  <div className="flex items-center gap-2 mb-1">
                    {metric.icon}
                  </div>
                  <p className="text-lg font-bold text-white">{metric.value}</p>
                  <p className="text-[10px] text-slate-400">{metric.label}</p>
                </div>
              ))}
              showDots
            />
          </BentoCard>

          {unansweredMessages.length > 0 && canQuickCall && (
            <BentoCard span={12} className="border-amber-500/30 bg-amber-950/20" data-testid="card-unanswered">
              <div className="flex items-center gap-2 text-amber-400 text-sm mb-2">
                <AlertCircle className="h-4 w-4" />
                <span className="font-medium">Unanswered Requests</span>
              </div>
              <CarouselRail
                items={unansweredMessages.map((msg) => {
                  const contact = msg.targetDepartment ? departmentContacts.find(c => c.department === msg.targetDepartment) : null;
                  return (
                    <div key={msg.id} className="w-56 p-2 rounded-lg bg-slate-800/50 border border-slate-700/50" data-testid={`unanswered-${msg.id}`}>
                      <p className="text-xs text-slate-300 truncate mb-1">{msg.content}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-[10px] text-slate-500">
                          <Clock className="h-3 w-3" />
                          <span>{msg.elapsedMinutes}m ago</span>
                          {msg.targetDepartment && (
                            <Badge variant="outline" className="text-[9px] px-1 ml-1">{msg.targetDepartment}</Badge>
                          )}
                        </div>
                        <div className="flex gap-1">
                          {contact && (
                            <Button size="icon" variant="ghost" className="h-6 w-6 text-green-400" onClick={() => handleQuickCall(contact.phoneNumber)} data-testid={`button-call-unanswered-${msg.id}`}>
                              <Phone className="h-3 w-3" />
                            </Button>
                          )}
                          <Button size="icon" variant="ghost" className="h-6 w-6 text-cyan-400" onClick={() => handleResend(msg.id)} data-testid={`button-resend-${msg.id}`}>
                            <RefreshCw className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              />
            </BentoCard>
          )}

          <BentoCard span={8} title="Conversations" rowSpan={2} data-testid="card-conversations">
            <ScrollArea className="h-[350px]">
              <div className="space-y-3 pr-2">
                {messages.map((msg) => {
                  const isMe = msg.senderId === currentUser?.id;
                  const sender = users.find(u => u.id === msg.senderId);
                  const senderName = sender?.name || 'Unknown';
                  const senderRole = sender?.role || 'Worker';
                  return (
                    <div key={msg.id} className={`flex gap-2 ${isMe ? 'flex-row-reverse' : ''}`} data-testid={`message-${msg.id}`}>
                      <Avatar className="h-7 w-7 mt-1 flex-shrink-0">
                        <AvatarFallback className={`text-[9px] font-bold ${getRoleColor(senderRole)}`}>
                          {senderName.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className={`flex flex-col max-w-[75%] ${isMe ? 'items-end' : 'items-start'}`}>
                        <div className="flex items-center gap-1 mb-0.5">
                          <span className="text-[10px] font-medium text-slate-400">{senderName}</span>
                          <Badge variant="outline" className={cn("h-4 px-1 text-[8px] gap-0.5", getRoleColor(senderRole))}>
                            {getRoleIcon(senderRole)}
                            {senderRole}
                          </Badge>
                          <span className="text-[9px] text-slate-600">
                            {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                          </span>
                        </div>
                        <div className={cn(
                          "p-2 rounded-xl text-xs",
                          isMe 
                            ? 'bg-cyan-600 text-white rounded-tr-none' 
                            : 'bg-slate-800/80 border border-slate-700 text-slate-200 rounded-tl-none'
                        )}>
                          {msg.content}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
            <form onSubmit={handleSend} className="flex gap-2 mt-3 pt-3 border-t border-slate-700/50">
              <Input 
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message..." 
                className="flex-1 bg-slate-800/80 border-slate-700 h-9 text-sm"
                data-testid="input-message"
              />
              <Button type="submit" size="icon" disabled={!newMessage.trim()} className="h-9 w-9" data-testid="button-send">
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </BentoCard>

          <BentoCard span={4} title="Contacts" data-testid="card-contacts">
            <div className="grid grid-cols-2 gap-2">
              {departmentContacts.slice(0, 6).map((contact) => (
                <div 
                  key={contact.id}
                  className="p-2 rounded-lg bg-slate-800/50 border border-slate-700/50 hover:border-cyan-400/30 cursor-pointer transition-all"
                  onClick={() => handleQuickCall(contact.phoneNumber)}
                  data-testid={`contact-grid-${contact.department.toLowerCase()}`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div className="p-1.5 rounded bg-cyan-500/20 text-cyan-400">
                      {getDepartmentIcon(contact.department)}
                    </div>
                  </div>
                  <p className="text-xs font-medium text-slate-200 truncate">{contact.department}</p>
                  <p className="text-[10px] text-slate-500 truncate">{contact.contactName}</p>
                </div>
              ))}
              {departmentContacts.length === 0 && (
                <div className="col-span-2 text-center py-4 text-slate-500 text-xs">
                  No contacts configured
                </div>
              )}
            </div>
          </BentoCard>

          <BentoCard span={4} title="Settings" data-testid="card-settings">
            <AccordionStack items={settingsItems} />
          </BentoCard>
        </LayoutShell>
      </main>
    </div>
  );
}
