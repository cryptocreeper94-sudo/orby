import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  MessageSquare, Send, UserCircle, LogOut, 
  Clock, CheckCircle2, AlertCircle, Users
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  id: string;
  content: string;
  sentAt: string;
  recipient: string;
  status: 'sent' | 'delivered' | 'read';
}

interface Manager {
  id: string;
  name: string;
  role: string;
  isOnline: boolean;
}

const mockManagers: Manager[] = [
  { id: '1', name: 'Brooke K', role: 'HR Manager', isOnline: true },
  { id: '2', name: 'David', role: 'Operations Manager', isOnline: true },
  { id: '3', name: 'Jay', role: 'Purchasing Manager', isOnline: false },
  { id: '4', name: 'Chef Deb', role: 'Culinary Manager', isOnline: true },
  { id: '5', name: 'Darby', role: 'Bar Manager', isOnline: false },
  { id: '6', name: 'Shelia', role: 'Operations Supervisor', isOnline: true },
];

const mockMessages: Message[] = [
  { id: '1', content: 'Customer complaint at Section 112 - needs manager assistance', sentAt: '2 mins ago', recipient: 'HR Manager', status: 'read' },
  { id: '2', content: 'Guest left personal items at concession stand', sentAt: '15 mins ago', recipient: 'Operations Manager', status: 'delivered' },
];

export default function CheckingAssistantDashboard() {
  const [, setLocation] = useLocation();
  const [selectedManager, setSelectedManager] = useState<Manager | null>(null);
  const [messageContent, setMessageContent] = useState('');
  const [messages, setMessages] = useState<Message[]>(mockMessages);
  const [isSending, setIsSending] = useState(false);

  const handleSendMessage = async () => {
    if (!messageContent.trim() || !selectedManager) return;
    
    setIsSending(true);
    
    const newMessage: Message = {
      id: Date.now().toString(),
      content: messageContent,
      sentAt: 'Just now',
      recipient: selectedManager.role,
      status: 'sent'
    };
    
    setMessages([newMessage, ...messages]);
    setMessageContent('');
    setSelectedManager(null);
    
    setTimeout(() => setIsSending(false), 500);
  };

  const handleLogout = () => {
    setLocation('/');
  };

  const getStatusIcon = (status: Message['status']) => {
    switch (status) {
      case 'sent': return <Clock className="h-3 w-3 text-slate-400" />;
      case 'delivered': return <CheckCircle2 className="h-3 w-3 text-blue-400" />;
      case 'read': return <CheckCircle2 className="h-3 w-3 text-emerald-400" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <header className="bg-slate-800/80 backdrop-blur-lg border-b border-slate-700/50 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
              <MessageSquare className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Checking Assistant</h1>
              <p className="text-xs text-slate-400">Customer Service Communications</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="text-slate-400 hover:text-white"
            data-testid="button-logout"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        <Card className="bg-slate-800/50 border-cyan-500/20 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-white flex items-center gap-2">
              <Users className="h-5 w-5 text-cyan-400" />
              Contact a Manager
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {mockManagers.map((manager) => (
                <motion.button
                  key={manager.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedManager(manager)}
                  className={`p-3 rounded-xl border transition-all text-left ${
                    selectedManager?.id === manager.id
                      ? 'bg-cyan-500/20 border-cyan-500/50'
                      : 'bg-slate-700/30 border-slate-600/30 hover:border-slate-500/50'
                  }`}
                  data-testid={`manager-${manager.id}`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <UserCircle className={`h-4 w-4 ${manager.isOnline ? 'text-emerald-400' : 'text-slate-500'}`} />
                    <span className="text-sm font-medium text-white truncate">{manager.name}</span>
                  </div>
                  <p className="text-xs text-slate-400 truncate">{manager.role}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <span className={`w-1.5 h-1.5 rounded-full ${manager.isOnline ? 'bg-emerald-400' : 'bg-slate-500'}`} />
                    <span className="text-[10px] text-slate-500">{manager.isOnline ? 'Online' : 'Offline'}</span>
                  </div>
                </motion.button>
              ))}
            </div>

            <AnimatePresence>
              {selectedManager && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-3"
                >
                  <div className="flex items-center gap-2 text-sm text-cyan-400">
                    <Send className="h-4 w-4" />
                    <span>Message to {selectedManager.name} ({selectedManager.role})</span>
                  </div>
                  <Textarea
                    placeholder="Describe the situation or customer issue..."
                    value={messageContent}
                    onChange={(e) => setMessageContent(e.target.value)}
                    className="min-h-[100px] bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500"
                    data-testid="message-input"
                  />
                  <div className="flex gap-2">
                    <Button
                      onClick={handleSendMessage}
                      disabled={!messageContent.trim() || isSending}
                      className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500"
                      data-testid="button-send"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Send Message
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setSelectedManager(null)}
                      className="border-slate-600 text-slate-300 hover:bg-slate-700"
                      data-testid="button-cancel"
                    >
                      Cancel
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-white flex items-center gap-2">
              <Clock className="h-5 w-5 text-slate-400" />
              Recent Messages
            </CardTitle>
          </CardHeader>
          <CardContent>
            {messages.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>No messages yet</p>
                <p className="text-sm">Select a manager above to send a message</p>
              </div>
            ) : (
              <div className="space-y-3">
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 bg-slate-700/30 rounded-xl border border-slate-600/30"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <Badge variant="outline" className="bg-cyan-500/10 text-cyan-400 border-cyan-500/30">
                        To: {message.recipient}
                      </Badge>
                      <div className="flex items-center gap-1 text-xs text-slate-500">
                        {getStatusIcon(message.status)}
                        <span>{message.sentAt}</span>
                      </div>
                    </div>
                    <p className="text-sm text-slate-300">{message.content}</p>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border-cyan-500/20">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-cyan-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-medium text-white mb-1">Quick Tips</h3>
                <ul className="text-xs text-slate-400 space-y-1">
                  <li>• Contact HR for employee-related issues</li>
                  <li>• Contact Operations for facility concerns</li>
                  <li>• Include specific location (section/stand) in your message</li>
                  <li>• For emergencies, contact the nearest supervisor directly</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
