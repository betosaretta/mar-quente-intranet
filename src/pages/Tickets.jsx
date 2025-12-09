import React, { useState, useEffect } from "react";
import { Ticket } from "@/entities/Ticket";
import { User } from "@/entities/User";
import { 
  Ticket as TicketIcon, 
  Plus, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Search,
  Loader2,
  XCircle,
  MessageSquare
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTrigger,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";


export default function Tickets() {
  const [tickets, setTickets] = useState([]);
  const [myTickets, setMyTickets] = useState([]);
  const [assignedToMe, setAssignedToMe] = useState([]);
  const [users, setUsers] = useState([]);
  const [user, setUser] = useState(null);
  const [showNewTicketDialog, setShowNewTicketDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("Todos");
  const [selectedCategory, setSelectedCategory] = useState("Todas");
  const [newTicket, setNewTicket] = useState({
    title: "",
    description: "",
    category: "",
    priority: "Normal",
    department_target: "",
    assigned_to: "",
    due_date: ""
  });

  const categories = ["Todas", "Suporte TI", "Manutenção", "RH", "Financeiro", "Logística", "Produção", "Criação", "Marketing", "Outros"];
  const statuses = ["Todos", "Aberto", "Em Andamento", "Aguardando", "Resolvido", "Fechado"];
  const priorities = ["Baixa", "Normal", "Alta", "Urgente"];
  const departments = ["RH", "TI", "Financeiro", "Marketing", "Vendas", "Operações", "Diretoria", "Produção", "Criação", "Logística"];

  useEffect(() => {
    loadData();
  }, []);
  
  useEffect(() => {
    if (!user) return;
    
    let filteredMyTickets = tickets.filter(t => t.created_by === user.email);
    let filteredAssignedToMe = tickets.filter(t => t.assigned_to === user.email);
    
    if (searchTerm) {
        const lowerSearch = searchTerm.toLowerCase();
        const searchFilter = t => t.title.toLowerCase().includes(lowerSearch) || t.description.toLowerCase().includes(lowerSearch);
        filteredMyTickets = filteredMyTickets.filter(searchFilter);
        filteredAssignedToMe = filteredAssignedToMe.filter(searchFilter);
    }
    if (selectedStatus !== "Todos") {
        const statusFilter = t => t.status === selectedStatus;
        filteredMyTickets = filteredMyTickets.filter(statusFilter);
        filteredAssignedToMe = filteredAssignedToMe.filter(statusFilter);
    }
    if (selectedCategory !== "Todas") {
        const categoryFilter = t => t.category === selectedCategory;
        filteredMyTickets = filteredMyTickets.filter(categoryFilter);
        filteredAssignedToMe = filteredAssignedToMe.filter(categoryFilter);
    }

    setMyTickets(filteredMyTickets);
    setAssignedToMe(filteredAssignedToMe);
  }, [tickets, user, searchTerm, selectedStatus, selectedCategory]);

  const loadData = async () => {
    try {
      const [currentUser, usersData, ticketsData] = await Promise.all([
        User.me(),
        User.list(),
        Ticket.list('-created_date')
      ]);
      setUser(currentUser);
      setUsers(usersData);
      setTickets(ticketsData);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    }
  };

  const handleSubmitTicket = async () => {
    if (!newTicket.title.trim() || !newTicket.description.trim() || !newTicket.category || !newTicket.department_target) {
      return;
    }

    try {
      await Ticket.create(newTicket);
      setNewTicket({
        title: "",
        description: "",
        category: "",
        priority: "Normal",
        department_target: "",
        assigned_to: "",
        due_date: ""
      });
      setShowNewTicketDialog(false);
      await loadData();
    } catch (error) {
      console.error("Erro ao criar chamado:", error);
    }
  };
  
  const getAssignableUsers = () => {
    if (!newTicket.department_target) return [];
    return users.filter(u => u.department === newTicket.department_target && u.can_receive_tickets);
  }

  const getStatusClasses = (status) => {
    switch (status) {
      case 'Resolvido':
      case 'Fechado':
        return { bg: 'bg-green-500/10', text: 'text-green-700', border: 'border-green-500/20', icon: 'text-green-500' };
      case 'Em Andamento':
        return { bg: 'bg-blue-500/10', text: 'text-blue-700', border: 'border-blue-500/20', icon: 'text-blue-500' };
      case 'Aguardando':
        return { bg: 'bg-yellow-500/10', text: 'text-yellow-700', border: 'border-yellow-500/20', icon: 'text-yellow-500' };
      case 'Aberto':
        return { bg: 'bg-orange-500/10', text: 'text-orange-700', border: 'border-orange-500/20', icon: 'text-orange-500' };
      default:
        return { bg: 'bg-slate-500/10', text: 'text-slate-700', border: 'border-slate-500/20', icon: 'text-slate-500' };
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Resolvido': return CheckCircle;
      case 'Fechado': return XCircle;
      case 'Em Andamento': return Loader2;
      case 'Aguardando': return Clock;
      case 'Aberto': return AlertCircle;
      default: return TicketIcon;
    }
  };
  
  const getPriorityBorder = (priority) => {
    switch (priority) {
      case 'Urgente': return 'border-red-500';
      case 'Alta': return 'border-orange-500';
      case 'Normal': return 'border-blue-500';
      case 'Baixa': return 'border-slate-400';
      default: return 'border-slate-400';
    }
  };

  const TicketCard = ({ ticket }) => {
    const statusClasses = getStatusClasses(ticket.status);
    const StatusIcon = getStatusIcon(ticket.status);
    const creator = users.find(u => u.email === ticket.created_by);
    const assignee = users.find(u => u.email === ticket.assigned_to);

    return (
        <div className={`glass-card p-5 rounded-2xl border-l-4 ${getPriorityBorder(ticket.priority)}`}>
            <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                <div className="flex-1">
                    <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex-1 min-w-0">
                            <h3 className="font-bold glass-text mb-1">{ticket.title}</h3>
                            <div className="flex flex-wrap items-center gap-2">
                                <Badge className={`${statusClasses.bg} ${statusClasses.text} ${statusClasses.border} font-semibold`}>
                                    <StatusIcon className={`w-3 h-3 mr-1.5 ${ticket.status === 'Em Andamento' ? 'animate-spin' : ''}`} />
                                    {ticket.status}
                                </Badge>
                                <Badge variant="outline" className="font-medium glass-text">{ticket.category}</Badge>
                                <Badge variant="secondary" className="font-medium glass-text">{ticket.priority}</Badge>
                            </div>
                        </div>
                        <div className="glass-text-muted text-right">
                            <div>Criado em</div>
                            <div>{format(new Date(ticket.created_date), "dd/MM/yy 'às' HH:mm", { locale: ptBR })}</div>
                        </div>
                    </div>

                    <p className="glass-text mb-4 leading-relaxed">{ticket.description}</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center gap-2">
                            <Avatar className="w-8 h-8">
                                <AvatarImage src={creator?.avatar_url} />
                                <AvatarFallback className="font-semibold bg-gradient-to-r from-blue-400 to-purple-500 text-white">
                                  {creator?.full_name?.charAt(0)}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <div className="glass-text-muted text-xs">Criado por</div>
                                <div className="font-semibold glass-text">{creator?.full_name}</div>
                            </div>
                        </div>
                        {assignee && (
                            <div className="flex items-center gap-2">
                                <Avatar className="w-8 h-8">
                                    <AvatarImage src={assignee?.avatar_url} />
                                    <AvatarFallback className="font-semibold bg-gradient-to-r from-green-400 to-blue-500 text-white">
                                      {assignee?.full_name?.charAt(0)}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <div className="glass-text-muted text-xs">Atribuído a</div>
                                    <div className="font-semibold glass-text">{assignee?.full_name}</div>
                                </div>
                            </div>
                        )}
                    </div>

                    {ticket.response && (
                        <div className="glass-card p-4 rounded-lg mt-4 bg-blue-500/5">
                            <div className="flex items-center gap-2 mb-2">
                                <MessageSquare className="w-4 h-4 text-blue-600 flex-shrink-0" />
                                <span className="font-semibold text-blue-800">Última Resposta:</span>
                            </div>
                            <p className="text-blue-800/80">{ticket.response}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
  };
  
  const TicketList = ({ tickets, emptyMessage }) => {
    if (tickets.length === 0) {
        return (
            <div className="text-center py-12 glass-card rounded-2xl">
                <TicketIcon className="w-16 h-16 glass-text-muted mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold glass-text mb-2">{emptyMessage.title}</h3>
                <p className="glass-text-muted">{emptyMessage.description}</p>
            </div>
        );
    }
    return <div className="space-y-4">{tickets.map(ticket => <TicketCard key={ticket.id} ticket={ticket} />)}</div>
  }

  return (
    <div className="space-y-6">
      {/* Controles */}
      <div className="glass-card p-6 rounded-2xl">
        <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
          <div className="grid md:grid-cols-3 gap-4 flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 glass-text-muted" />
              <Input
                placeholder="Buscar por título ou descrição..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 glass-input"
              />
            </div>
            
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="glass-select">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>{statuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>

            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="glass-select">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>{categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </div>

          <Dialog open={showNewTicketDialog} onOpenChange={setShowNewTicketDialog}>
            <DialogTrigger asChild>
              <Button className="glass-button-primary flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Abrir Chamado
              </Button>
            </DialogTrigger>
            <DialogContent className="glass-modal max-w-2xl p-0">
              <div className="p-8">
                <DialogHeader className="mb-6">
                  <h2 className="modal-title">Novo Chamado Técnico</h2>
                  <p className="modal-description">Descreva o problema para que possamos ajudar</p>
                </DialogHeader>
                <div className="space-y-5">
                  <div>
                    <Label htmlFor="title" className="glass-label">Título do Chamado</Label>
                    <Input 
                      id="title" 
                      placeholder="Ex: Computador não liga" 
                      value={newTicket.title} 
                      onChange={e => setNewTicket(p => ({...p, title: e.target.value}))} 
                      className="glass-input" 
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="category" className="glass-label">Categoria</Label>
                      <Select value={newTicket.category} onValueChange={v => setNewTicket(p => ({...p, category: v}))}>
                        <SelectTrigger className="glass-select">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.slice(1).map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="priority" className="glass-label">Prioridade</Label>
                      <Select value={newTicket.priority} onValueChange={v => setNewTicket(p => ({...p, priority: v}))}>
                        <SelectTrigger className="glass-select">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {priorities.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                      <div>
                          <Label htmlFor="department_target" className="glass-label">Departamento</Label>
                          <Select value={newTicket.department_target} onValueChange={v => setNewTicket(p => ({...p, department_target: v, assigned_to: ''}))}>
                          <SelectTrigger className="glass-select">
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            {departments.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                          </SelectContent>
                          </Select>
                      </div>
                      <div>
                          <Label htmlFor="assigned_to" className="glass-label">Atribuir a (Opcional)</Label>
                          <Select value={newTicket.assigned_to} onValueChange={v => setNewTicket(p => ({...p, assigned_to: v}))} disabled={!newTicket.department_target}>
                          <SelectTrigger className="glass-select">
                            <SelectValue placeholder="Atribuição automática" />
                          </SelectTrigger>
                          <SelectContent>
                            {getAssignableUsers().map(u => <SelectItem key={u.id} value={u.email}>{u.full_name}</SelectItem>)}
                          </SelectContent>
                          </Select>
                      </div>
                  </div>

                  <div>
                    <Label htmlFor="description" className="glass-label">Descrição do Problema</Label>
                    <Textarea 
                      id="description" 
                      placeholder="Descreva o problema em detalhes..." 
                      value={newTicket.description} 
                      onChange={e => setNewTicket(p => ({...p, description: e.target.value}))} 
                      className="glass-textarea" 
                      rows={5} 
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
                    <Button variant="ghost" onClick={() => setShowNewTicketDialog(false)} className="glass-button-secondary">
                      Cancelar
                    </Button>
                    <Button 
                      onClick={handleSubmitTicket} 
                      disabled={!newTicket.title || !newTicket.description || !newTicket.category || !newTicket.department_target} 
                      className="glass-button-primary"
                    >
                      Enviar Chamado
                    </Button>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="my-tickets" className="space-y-6">
        <TabsList className="glass-card p-1 w-full md:w-auto">
          <TabsTrigger value="my-tickets" className="glass-button data-[state=active]:glass-button-active w-full">
            Meus Chamados ({myTickets.length})
          </TabsTrigger>
          <TabsTrigger value="assigned-to-me" className="glass-button data-[state=active]:glass-button-active w-full">
            Atribuídos a Mim ({assignedToMe.length})
          </TabsTrigger>
        </TabsList>
        <TabsContent value="my-tickets">
            <TicketList 
                tickets={myTickets}
                emptyMessage={{title: "Você não abriu nenhum chamado", description: "Use o botão 'Abrir Chamado' para criar um novo."}}
            />
        </TabsContent>
        <TabsContent value="assigned-to-me">
            <TicketList
                tickets={assignedToMe}
                emptyMessage={{title: "Nenhum chamado atribuído a você", description: "Quando um chamado for direcionado a você, ele aparecerá aqui."}}
            />
        </TabsContent>
      </Tabs>
    </div>
  );
}