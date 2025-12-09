
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Send,
  Search,
  MessageCircle,
  CheckCheck,
  Plus,
  AlertCircle,
  Paperclip,
  Loader2,
  Users,
  MoreVertical,
  Smile,
  ArrowLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Messaging() {
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [showNewMessageDialog, setShowNewMessageDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [quickReply, setQuickReply] = useState("");
  const [sendingReply, setSendingReply] = useState(false);
  
  const [newMessage, setNewMessage] = useState({
    receiver_emails: [],
    subject: "",
    message_content: "",
    priority: "Normal"
  });

  const queryClient = useQueryClient();
  const messagesEndRef = React.useRef(null);

  useEffect(() => {
    loadData();
  }, []);

  // REMOVIDO: Auto-scroll ao selecionar conversa para evitar scroll indesejado
  // useEffect(() => {
  //   if (selectedConversation && messagesEndRef.current) {
  //     messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
  //   }
  // }, [selectedConversation?.messages]);

  const loadData = async () => {
    try {
      const user = await base44.auth.me();
      setCurrentUser(user);

      const usersData = await base44.entities.User.list();
      setUsers(usersData);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    }
  };

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['messages', currentUser?.email],
    queryFn: async () => {
      if (!currentUser) return [];
      const received = await base44.entities.Message.filter({ receiver_email: currentUser.email }, '-created_date');
      const sent = await base44.entities.Message.filter({ sender_email: currentUser.email }, '-created_date');
      const broadcasts = await base44.entities.Message.filter({ message_type: 'broadcast' }, '-created_date');
      
      const relevantBroadcasts = broadcasts.filter(msg => {
        const deptMatch = !msg.target_departments || msg.target_departments.length === 0 || 
                         msg.target_departments.includes(currentUser.department);
        const locMatch = !msg.target_locations || msg.target_locations.length === 0 || 
                        msg.target_locations.includes(currentUser.location);
        const catMatch = !msg.target_categories || msg.target_categories.length === 0 || 
                        msg.target_categories.includes(currentUser.category);
        return deptMatch && locMatch && catMatch && msg.sender_email !== currentUser.email;
      });

      return [...received, ...sent, ...relevantBroadcasts].sort((a, b) => 
        new Date(b.created_date) - new Date(a.created_date)
      );
    },
    enabled: !!currentUser,
    initialData: []
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (messageData) => {
      const promises = messageData.receiver_emails.map(email => 
        base44.entities.Message.create({
          ...messageData,
          receiver_email: email,
          message_type: 'direct'
        })
      );
      await Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      setShowNewMessageDialog(false);
      setNewMessage({
        receiver_emails: [],
        subject: "",
        message_content: "",
        priority: "Normal"
      });
    }
  });

  const markAsReadMutation = useMutation({
    mutationFn: (messageId) => base44.entities.Message.update(messageId, { read_status: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
    }
  });

  const handleSendMessage = async () => {
    if (newMessage.receiver_emails.length === 0 || !newMessage.message_content) {
      alert("Por favor, selecione pelo menos um destinatário e escreva uma mensagem.");
      return;
    }

    await sendMessageMutation.mutateAsync({
      ...newMessage,
      sender_email: currentUser.email
    });
  };

  const handleQuickReply = async () => {
    if (!quickReply.trim() || sendingReply || !selectedConversation) return;
    
    setSendingReply(true);
    try {
      await sendMessageMutation.mutateAsync({
        sender_email: currentUser.email,
        receiver_emails: [selectedConversation.otherUser.email],
        subject: "",
        message_content: quickReply.trim(),
        priority: "Normal"
      });
      setQuickReply("");
    } catch (error) {
      console.error("Erro ao enviar resposta:", error);
    } finally {
      setSendingReply(false);
    }
  };

  const toggleRecipient = (email) => {
    setNewMessage(prev => ({
      ...prev,
      receiver_emails: prev.receiver_emails.includes(email)
        ? prev.receiver_emails.filter(e => e !== email)
        : [...prev.receiver_emails, email]
    }));
  };

  const getConversations = () => {
    if (!currentUser) return [];
    
    const conversationMap = new Map();
    
    messages.forEach(msg => {
      if (msg.message_type === 'broadcast') {
        if (!conversationMap.has(`broadcast-${msg.id}`)) {
          conversationMap.set(`broadcast-${msg.id}`, {
            id: `broadcast-${msg.id}`,
            type: 'broadcast',
            lastMessage: msg,
            unreadCount: msg.read_status ? 0 : 1,
            messages: [msg]
          });
        }
      } else {
        const otherUserEmail = msg.sender_email === currentUser.email ? msg.receiver_email : msg.sender_email;
        
        if (!conversationMap.has(otherUserEmail)) {
          conversationMap.set(otherUserEmail, {
            id: otherUserEmail,
            type: 'direct',
            otherUser: users.find(u => u.email === otherUserEmail),
            lastMessage: msg,
            unreadCount: 0,
            messages: []
          });
        }
        
        const conversation = conversationMap.get(otherUserEmail);
        conversation.messages.push(msg);
        
        if (!msg.read_status && msg.receiver_email === currentUser.email) {
          conversation.unreadCount++;
        }
        
        if (new Date(msg.created_date) > new Date(conversation.lastMessage.created_date)) {
          conversation.lastMessage = msg;
        }
      }
    });

    return Array.from(conversationMap.values()).sort((a, b) => 
      new Date(b.lastMessage.created_date) - new Date(a.lastMessage.created_date)
    );
  };

  const filteredConversations = getConversations().filter(conv => {
    if (filterType === 'unread' && conv.unreadCount === 0) return false;
    if (filterType === 'broadcast' && conv.type !== 'broadcast') return false;
    if (filterType === 'direct' && conv.type !== 'direct') return false;
    
    if (searchTerm && conv.type === 'direct') {
      const otherUser = conv.otherUser;
      return otherUser?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
             otherUser?.email?.toLowerCase().includes(searchTerm.toLowerCase());
    }
    
    return true;
  });

  const handleSelectConversation = (conversation) => {
    setSelectedConversation(conversation);
    
    conversation.messages.forEach(msg => {
      if (!msg.read_status && msg.receiver_email === currentUser.email) {
        markAsReadMutation.mutate(msg.id);
      }
    });
  };

  const isAdminOrHR = currentUser && (currentUser.role === 'admin' || currentUser.department === 'RH');
  const filteredUsers = users.filter(u => u.email !== currentUser?.email).filter(u => {
    if (!userSearchTerm) return true;
    return u.full_name?.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
           u.email?.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
           u.department?.toLowerCase().includes(userSearchTerm.toLowerCase());
  });

  const unreadCount = messages.filter(m => !m.read_status && m.receiver_email === currentUser?.email).length;

  return (
    <div className="fixed inset-0 md:static md:h-full bg-[#f0f2f5]">
      {/* Container Principal */}
      <div className="h-full flex bg-white shadow-2xl md:rounded-2xl overflow-hidden">
        
        {/* ========== SIDEBAR CONVERSAS ========== */}
        <div className={`${selectedConversation ? 'hidden md:flex' : 'flex'} w-full md:w-[380px] flex-col bg-white border-r border-gray-200 flex-shrink-0`}>
          {/* Header Sidebar */}
          <div className="bg-[#ededed] px-4 py-3 border-b border-gray-300">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xl font-bold text-gray-900">Conversas</h2>
              {isAdminOrHR && (
                <Button
                  onClick={() => setShowNewMessageDialog(true)}
                  size="icon"
                  className="h-10 w-10 rounded-full bg-white hover:bg-gray-100 shadow-sm"
                >
                  <Plus className="w-5 h-5 text-gray-700" />
                </Button>
              )}
            </div>

            {/* Busca */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <Input
                placeholder="Pesquisar conversas"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-9 bg-white border-gray-300 rounded-lg text-sm"
              />
            </div>
          </div>

          {/* Filtros Compactos */}
          <div className="flex gap-2 px-4 py-2 bg-white border-b border-gray-200">
            {[
              { key: 'all', label: 'Todas' },
              { key: 'unread', label: 'Não lidas' },
              { key: 'direct', label: 'Diretas' }
            ].map(type => (
              <button
                key={type.key}
                onClick={() => setFilterType(type.key)}
                className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  filterType === type.key
                    ? 'bg-[#00a884] text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>

          {/* Lista de Conversas - MAXIMIZADO COM SCROLL SUAVE */}
          <div className="flex-1 overflow-y-auto bg-white" style={{ 
            scrollBehavior: 'smooth',
            scrollbarWidth: 'thin',
            scrollbarColor: '#cbd5e1 transparent'
          }}>
            <style>{`
              .conversations-list::-webkit-scrollbar {
                width: 6px;
              }
              .conversations-list::-webkit-scrollbar-track {
                background: transparent;
              }
              .conversations-list::-webkit-scrollbar-thumb {
                background-color: #cbd5e1;
                border-radius: 3px;
              }
              .conversations-list::-webkit-scrollbar-thumb:hover {
                background-color: #94a3b8;
              }
            `}</style>
            {filteredConversations.length > 0 ? (
              <div className="conversations-list">
                {filteredConversations.map(conversation => (
                  <button
                    key={conversation.id}
                    onClick={() => handleSelectConversation(conversation)}
                    className={`w-full px-3 py-2.5 hover:bg-[#f5f6f6] transition-colors text-left border-b border-gray-100 ${
                      selectedConversation?.id === conversation.id ? 'bg-[#f0f2f5]' : ''
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      {conversation.type === 'direct' ? (
                        <div className="relative flex-shrink-0">
                          <Avatar className="w-10 h-10 border-2 border-white shadow-sm">
                            <AvatarImage src={conversation.otherUser?.avatar_url} />
                            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold text-sm">
                              {conversation.otherUser?.full_name?.charAt(0) || conversation.otherUser?.email?.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          {conversation.unreadCount > 0 && (
                            <div className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-[#25d366] rounded-full flex items-center justify-center px-1 border-2 border-white">
                              <span className="text-white text-[10px] font-bold">{conversation.unreadCount}</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                          <Users className="w-5 h-5 text-white" />
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline justify-between mb-0.5 gap-2">
                          <h4 className="font-bold text-gray-900 text-[14px] leading-tight truncate flex-1">
                            {conversation.type === 'direct' 
                              ? (conversation.otherUser?.full_name || conversation.otherUser?.email)
                              : 'Comunicado RH'}
                          </h4>
                          <span className="text-[10px] text-gray-500 font-semibold flex-shrink-0">
                            {format(new Date(conversation.lastMessage.created_date), "HH:mm", { locale: ptBR })}
                          </span>
                        </div>

                        <p className="text-[13px] text-gray-600 mb-1 line-clamp-3 leading-[1.3] font-normal">
                          {conversation.lastMessage.message_content}
                        </p>

                        {conversation.type === 'direct' && conversation.otherUser && (
                          <p className="text-[10px] text-gray-500 font-medium truncate">
                            {[conversation.otherUser.position, conversation.otherUser.department].filter(Boolean).join(' • ')}
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                <MessageCircle className="w-20 h-20 text-gray-300 mb-4" />
                <p className="text-gray-500 font-semibold text-base">Nenhuma conversa</p>
                <p className="text-gray-400 text-sm mt-2">Comece uma nova conversa</p>
              </div>
            )}
          </div>
        </div>

        {/* ========== ÁREA DE CHAT - OTIMIZADA 100% ========== */}
        <div className={`${selectedConversation ? 'flex' : 'hidden md:flex'} flex-1 flex-col bg-[#efeae2] min-w-0`}>
          {selectedConversation ? (
            <>
              {/* Header do Chat - Compacto e Fixo */}
              <div className="bg-[#ededed] px-3 py-2.5 border-b border-gray-300 flex items-center gap-3 flex-shrink-0">
                <button
                  onClick={() => setSelectedConversation(null)}
                  className="md:hidden p-2 hover:bg-gray-200 rounded-full -ml-1"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-700" />
                </button>

                {selectedConversation.type === 'direct' ? (
                  <>
                    <Avatar className="w-9 h-9 flex-shrink-0">
                      <AvatarImage src={selectedConversation.otherUser?.avatar_url} />
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold text-sm">
                        {selectedConversation.otherUser?.full_name?.charAt(0) || selectedConversation.otherUser?.email?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate text-sm">
                        {selectedConversation.otherUser?.full_name || selectedConversation.otherUser?.email}
                      </h3>
                      <p className="text-xs text-gray-600 truncate">
                        {selectedConversation.otherUser?.position}
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center flex-shrink-0">
                      <Users className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 text-sm truncate">Comunicado Geral</h3>
                      <p className="text-xs text-gray-600 truncate">
                        {users.find(u => u.email === selectedConversation.lastMessage.sender_email)?.full_name || 'RH'}
                      </p>
                    </div>
                  </>
                )}

                <div className="flex items-center gap-1 flex-shrink-0">
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-gray-200">
                    <Search className="w-4 h-4 text-gray-600" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-gray-200">
                    <MoreVertical className="w-4 h-4 text-gray-600" />
                  </Button>
                </div>
              </div>

              {/* Área de Mensagens - 100% DO ESPAÇO DISPONÍVEL */}
              <div 
                className="flex-1 overflow-y-auto px-2 md:px-4 py-3"
                style={{
                  backgroundImage: 'url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMgAAADICAYAAACtWK6eAAAACXBIWXMAAAsTAAALEwEAmpYYAAAAAXNSR0IArs4c6QAAAARnQUBAACxjwv8YQUAAAGGSURBVHgB7dQBDQAgDMCwgX/PwZIcUgSdlO0MgKt9OwBfBgKRQCAigUAkEIhIIBAJBCKBQCQQiAQCkUAgEghEAoFIIBAJBCKBQCQQiAQCkUAgEghEAoFIIBAJBCKBQCQQiAQCkUAgEghEAoFIIBAJBCKBQCQQiAQCkUAgEghEAoFIIBAJBCKBQCQQiAQCkUAgEghEAoFIIBAJBCKBQCQQiAQCkUAgEghEAoFIIBAJBCKBQCQQiAQCkUAgEghEAoFIIBAJBCKBQCQQiAQCkUAgEghEAoFIIBAJBCKBQCQQiAQCkUAgEghEAoHoBTr8BX9iLN7TAAAAAElFTkSuQmCC")',
                  backgroundSize: '412.5px 749.25px',
                  backgroundRepeat: 'repeat'
                }}
              >
                <div className="max-w-5xl mx-auto space-y-1.5">
                  {selectedConversation.messages
                    .sort((a, b) => new Date(a.created_date) - new Date(b.created_date))
                    .map((msg, index) => {
                      const isMe = msg.sender_email === currentUser?.email;
                      const sender = users.find(u => u.email === msg.sender_email);
                      const prevMsg = selectedConversation.messages[index - 1];
                      const showDate = !prevMsg || 
                        format(new Date(msg.created_date), 'dd/MM/yyyy') !== 
                        format(new Date(prevMsg.created_date), 'dd/MM/yyyy');

                      return (
                        <div key={msg.id}>
                          {showDate && (
                            <div className="flex items-center justify-center my-2">
                              <div className="bg-white/90 px-2.5 py-1 rounded-md shadow-sm">
                                <span className="text-xs font-medium text-gray-700">
                                  {format(new Date(msg.created_date), "dd 'de' MMMM", { locale: ptBR })}
                                </span>
                              </div>
                            </div>
                          )}

                          <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-0.5`}>
                            <div className={`flex items-end gap-1 max-w-[75%] md:max-w-[65%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                              <div className={`rounded-lg px-3 py-2 shadow-sm ${
                                isMe 
                                  ? 'bg-[#d9fdd3] text-gray-900' 
                                  : 'bg-white text-gray-900'
                              }`}>
                                {msg.subject && (
                                  <h4 className="font-bold mb-1 text-sm">
                                    {msg.subject}
                                  </h4>
                                )}

                                <p className="text-[14.5px] leading-[19px] whitespace-pre-wrap break-words">
                                  {msg.message_content}
                                </p>

                                <div className="flex items-center justify-end gap-1 mt-1">
                                  <span className="text-[11px] text-gray-600">
                                    {format(new Date(msg.created_date), "HH:mm", { locale: ptBR })}
                                  </span>
                                  {isMe && (
                                    <CheckCheck className={`w-4 h-4 ${msg.read_status ? 'text-[#53bdeb]' : 'text-gray-500'}`} />
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              {/* Área de Input - OTIMIZADA, FIXA NO BOTTOM, OCUPA 100% */}
              {selectedConversation.type === 'direct' && isAdminOrHR && (
                <div className="bg-[#f0f2f5] px-2 md:px-3 py-2 border-t border-gray-300 flex-shrink-0">
                  <div className="flex items-end gap-2 max-w-5xl mx-auto">
                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full hover:bg-gray-200 flex-shrink-0">
                      <Smile className="w-5 h-5 text-gray-600" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full hover:bg-gray-200 flex-shrink-0">
                      <Paperclip className="w-5 h-5 text-gray-600" />
                    </Button>
                    
                    <div className="flex-1 min-w-0">
                      <Input
                        placeholder="Escreva uma mensagem"
                        value={quickReply}
                        onChange={(e) => setQuickReply(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleQuickReply();
                          }
                        }}
                        className="bg-white border-0 rounded-lg text-[15px] h-10 w-full"
                        disabled={sendingReply}
                      />
                    </div>

                    <Button 
                      onClick={handleQuickReply}
                      disabled={!quickReply.trim() || sendingReply}
                      size="icon"
                      className="h-9 w-9 rounded-full bg-[#00a884] hover:bg-[#008f6f] flex-shrink-0"
                    >
                      {sendingReply ? (
                        <Loader2 className="w-5 h-5 text-white animate-spin" />
                      ) : (
                        <Send className="w-5 h-5 text-white" />
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {selectedConversation.type === 'direct' && !isAdminOrHR && (
                <div className="bg-[#f0f2f5] px-3 py-2.5 border-t border-gray-300 flex-shrink-0">
                  <div className="flex items-center gap-3 bg-yellow-50 rounded-lg p-3 border border-yellow-200 max-w-5xl mx-auto">
                    <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">Mensagem Recebida</p>
                      <p className="text-xs text-gray-700">
                        Esta é uma mensagem do RH. Para responder, entre em contato diretamente.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="w-64 h-64 mb-8 opacity-10">
                <MessageCircle className="w-full h-full text-gray-400" />
              </div>
              <h3 className="text-2xl font-light text-gray-500 mb-2">Mensagens Mar Quente</h3>
              <p className="text-gray-400 text-center max-w-md">
                Selecione uma conversa para começar
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Dialog Nova Mensagem */}
      {isAdminOrHR && (
        <Dialog open={showNewMessageDialog} onOpenChange={setShowNewMessageDialog}>
          <DialogContent className="glass-modal max-w-3xl">
            <DialogHeader className="mb-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg">
                  <Send className="w-7 h-7 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-2xl font-bold text-gray-900">Nova Mensagem</DialogTitle>
                  <p className="text-sm text-gray-600 mt-1">Envie mensagem para um ou mais colaboradores</p>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-5">
              <div>
                <Label className="text-gray-900 font-bold mb-2 block">
                  Destinatários ({newMessage.receiver_emails.length} selecionados)
                </Label>
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Buscar colaborador..."
                    value={userSearchTerm}
                    onChange={(e) => setUserSearchTerm(e.target.value)}
                    className="pl-10 bg-white border-gray-300"
                  />
                </div>
                
                <div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-4 max-h-60 overflow-y-auto">
                  <div className="space-y-2">
                    {filteredUsers.map(user => (
                      <label key={user.id} className="flex items-center gap-3 p-3 hover:bg-white rounded-lg cursor-pointer transition-all border border-transparent hover:border-blue-200">
                        <Checkbox
                          checked={newMessage.receiver_emails.includes(user.email)}
                          onCheckedChange={() => toggleRecipient(user.email)}
                        />
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={user.avatar_url} />
                          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold">
                            {user.full_name?.charAt(0) || user.email?.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-gray-900 truncate">{user.full_name}</p>
                          <p className="text-xs text-gray-600 truncate">{user.position} • {user.department}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-gray-900 font-bold mb-2 block">Assunto (Opcional)</Label>
                <Input
                  value={newMessage.subject}
                  onChange={(e) => setNewMessage(prev => ({ ...prev, subject: e.target.value }))}
                  className="bg-white border-gray-300"
                  placeholder="Assunto da mensagem"
                />
              </div>

              <div>
                <Label className="text-gray-900 font-bold mb-2 block">Mensagem *</Label>
                <Textarea
                  value={newMessage.message_content}
                  onChange={(e) => setNewMessage(prev => ({ ...prev, message_content: e.target.value }))}
                  className="bg-white border-gray-300 min-h-[150px]"
                  placeholder="Digite sua mensagem..."
                />
              </div>
              
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <Button
                  variant="ghost"
                  onClick={() => setShowNewMessageDialog(false)}
                  className="px-6"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleSendMessage}
                  disabled={sendMessageMutation.isPending || newMessage.receiver_emails.length === 0}
                  className="bg-blue-600 hover:bg-blue-700 px-6"
                >
                  <Send className="w-4 h-4 mr-2" />
                  {sendMessageMutation.isPending ? 'Enviando...' : `Enviar para ${newMessage.receiver_emails.length} pessoa(s)`}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
