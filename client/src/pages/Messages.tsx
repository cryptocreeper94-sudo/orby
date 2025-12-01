import { useStore } from "@/lib/mockData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { 
  Send, ArrowLeft, User as UserIcon, Shield, Briefcase, Monitor, Warehouse, ChefHat,
  Phone, RefreshCw, AlertCircle, PhoneCall, Clock
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  const [selectedDepartment, setSelectedDepartment] = useState<string>("");
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex flex-col">
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
        <div className="font-bold text-lg flex-1 text-slate-200">Team Communication</div>
        
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
                  <p className="text-center text-slate-400 py-4">
                    No department contacts configured
                  </p>
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}
        
        <div className="flex -space-x-2 overflow-hidden">
           {users.filter(u => u.isOnline).map(u => (
             <div key={u.id} className="relative inline-block border-2 border-white dark:border-slate-900 rounded-full" title={`${u.name} (${u.role})`}>
                <Avatar className="h-8 w-8">
                  <AvatarFallback className={`text-[10px] font-bold ${getRoleColor(u.role)}`}>
                    {u.name.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="absolute bottom-0 right-0 block h-2 w-2 rounded-full bg-green-500 ring-1 ring-white dark:ring-slate-900" />
             </div>
           ))}
        </div>
      </header>

      {unansweredMessages.length > 0 && canQuickCall && (
        <div className="px-4 py-2 bg-amber-500/10 border-b border-amber-500/30">
          <div className="flex items-center gap-2 text-amber-400 text-sm mb-2">
            <AlertCircle className="h-4 w-4" />
            <span className="font-medium">Unanswered Requests</span>
          </div>
          {unansweredMessages.slice(0, 2).map((msg) => {
            const contact = msg.targetDepartment 
              ? departmentContacts.find(c => c.department === msg.targetDepartment) 
              : null;
            
            return (
              <div key={msg.id} className="flex items-center justify-between p-2 rounded bg-slate-800/50 mb-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-300 truncate">{msg.content}</p>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Clock className="h-3 w-3" />
                    <span>{msg.elapsedMinutes} min ago</span>
                    {msg.targetDepartment && (
                      <Badge variant="outline" className="text-[10px] px-1">
                        {msg.targetDepartment}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 ml-2">
                  {contact && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="text-green-400 border-green-400/30 hover:bg-green-500/20 h-8"
                      onClick={() => handleQuickCall(contact.phoneNumber)}
                      data-testid={`button-call-unanswered-${msg.id}`}
                    >
                      <Phone className="h-3 w-3 mr-1" />
                      Call
                    </Button>
                  )}
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="text-cyan-400 border-cyan-400/30 hover:bg-cyan-500/20 h-8"
                    onClick={() => handleResend(msg.id)}
                    data-testid={`button-resend-${msg.id}`}
                  >
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Resend
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <main className="flex-1 flex flex-col max-w-3xl mx-auto w-full h-[calc(100vh-3.5rem)]">
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4 pb-4">
            {messages.map((msg) => {
              const isMe = msg.senderId === currentUser?.id;
              const sender = users.find(u => u.id === msg.senderId);
              const senderName = sender?.name || 'Unknown';
              const senderRole = sender?.role || 'Worker';
              return (
                <div key={msg.id} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : ''}`} data-testid={`message-${msg.id}`}>
                  <Avatar className="h-8 w-8 mt-1">
                    <AvatarFallback className={`text-[10px] font-bold ${getRoleColor(senderRole)}`}>
                      {senderName.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className={`flex flex-col max-w-[80%] ${isMe ? 'items-end' : 'items-start'}`}>
                    <div className="flex items-center gap-2 mb-1">
                       <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{senderName}</span>
                       <Badge variant="outline" className={`h-4 px-1 text-[9px] gap-1 ${getRoleColor(senderRole)}`}>
                          {getRoleIcon(senderRole)}
                          {senderRole}
                       </Badge>
                       <span className="text-[10px] text-muted-foreground">{msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                    </div>
                    <div className={`p-3 rounded-2xl text-sm ${
                      isMe 
                        ? 'bg-primary text-primary-foreground rounded-tr-none' 
                        : 'bg-slate-800/80 border border-slate-700 shadow-sm rounded-tl-none text-slate-200'
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>

        <div className="p-4 bg-slate-950/95 backdrop-blur-sm border-t border-cyan-500/20 mt-auto">
          <form onSubmit={handleSend} className="flex gap-2">
            <Input 
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..." 
              className="flex-1 bg-slate-800/80 border-slate-700"
              data-testid="input-message"
            />
            <Button type="submit" size="icon" disabled={!newMessage.trim()} data-testid="button-send">
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </main>
    </div>
  );
}
