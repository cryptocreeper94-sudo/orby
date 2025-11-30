import { useStore } from "@/lib/mockData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Send, ArrowLeft, User as UserIcon, Shield, Briefcase, Monitor } from "lucide-react";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";

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

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUser) return;
    
    addMessage({
      senderId: currentUser.id,
      content: newMessage,
      type: 'Request' // Default to request for now
    });
    setNewMessage("");
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'Admin': return <Shield className="h-3 w-3" />;
      case 'Supervisor': return <UserIcon className="h-3 w-3" />;
      case 'IT': return <Monitor className="h-3 w-3" />;
      default: return <Briefcase className="h-3 w-3" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'Admin': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'IT': return 'bg-cyan-100 text-cyan-700 border-cyan-200';
      case 'Supervisor': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
      <header className="sticky top-0 z-10 bg-white dark:bg-slate-900 border-b px-4 h-14 flex items-center gap-3 shadow-sm shrink-0">
        <Button variant="ghost" size="icon" onClick={() => window.history.back()} className="-ml-2">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="font-bold text-lg flex-1">Team Communication</div>
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

      <main className="flex-1 flex flex-col max-w-3xl mx-auto w-full h-[calc(100vh-3.5rem)]">
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4 pb-4">
            {messages.map((msg) => {
              const isMe = msg.senderId === currentUser?.id;
              const sender = users.find(u => u.id === msg.senderId);
              const senderName = sender?.name || 'Unknown';
              const senderRole = sender?.role || 'Worker';
              return (
                <div key={msg.id} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : ''}`}>
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
                        : 'bg-white dark:bg-slate-800 border shadow-sm rounded-tl-none'
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>

        <div className="p-4 bg-white dark:bg-slate-900 border-t mt-auto">
          <form onSubmit={handleSend} className="flex gap-2">
            <Input 
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..." 
              className="flex-1"
            />
            <Button type="submit" size="icon" disabled={!newMessage.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </main>
    </div>
  );
}
