import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { User } from "@/entities/User";
import { createPageUrl } from "@/utils";
import { useNavigate, Link } from 'react-router-dom';
import {
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  Send,
  Phone,
  User as UserIcon,
  XCircle,
  Search,
  Loader2,
  Calendar,
  Building,
  MapPin,
  LayoutList,
  LayoutGrid,
  Shield,
  BookOpen,
  TrendingUp,
  TrendingDown,
  Users,
  Settings,
  BarChart3,
  Target,
  AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

export default function HRDashboard() {
  const [currentUser, setCurrentUser] = useState(null);
  const [requests, setRequests] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showResponseDialog, setShowResponseDialog] = useState(false);
  const [response, setResponse] = useState("");
  const [newStatus, setNewStatus] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("Todas");
  const [filterPriority, setFilterPriority] = useState("Todas");
  const [viewMode, setViewMode] = useState("list"); // "list" ou "kanban"
  const navigate = useNavigate();
  
  // Estados para métricas adicionais
  const [contents, setContents] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [showMetrics, setShowMetrics] = useState(true);

  const categories = [
    "Todas",
    "Férias",
    "Vale Transporte",
    "Vale Refeição",
    "Declaração",
    "Benefícios",
    "Treinamento",
    "Avaliação Experiência 45 dias",
    "Avaliação Experiência 90 dias",
    "Alteração Cargo/Salário",
    "Entrevista Gestor",
    "Solicitação Desligamento",
    "Solicitação Vaga",
    "Outros"
  ];

  const priorities = ["Todas", "Baixa", "Normal", "Alta", "Urgente"];

  const kanbanColumns = [
    { id: 'Pendente', title: 'Pendentes', color: 'from-orange-500 to-orange-600' },
    { id: 'Em Análise', title: 'Em Análise', color: 'from-yellow-500 to-yellow-600' },
    { id: 'Aprovado', title: 'Aprovadas', color: 'from-green-500 to-green-600' },
    { id: 'Concluído', title: 'Concluídas', color: 'from-blue-500 to-blue-600' },
    { id: 'Rejeitado', title: 'Rejeitadas', color: 'from-red-500 to-red-600' }
  ];

  useEffect(() => {
    checkAccess();
  }, [navigate]);

  const checkAccess = async () => {
    try {
      const user = await User.me();
      setCurrentUser(user);
      
      if (user.department !== 'RH' && user.role !== 'admin') {
        navigate(createPageUrl('Dashboard'));
        return;
      }
      
      loadData();
    } catch (error) {
      navigate(createPageUrl('Dashboard'));
    }
  };

  const loadData = async () => {
    try {
      const [requestsData, usersData, contentsData, complaintsData] = await Promise.all([
        base44.entities.HRRequest.list("-created_date"),
        base44.entities.User.list(),
        base44.entities.Content.list(),
        base44.entities.AnonymousComplaint.list()
      ]);
      
      setRequests(requestsData);
      setUsers(usersData);
      setContents(contentsData);
      setComplaints(complaintsData);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    }
  };

  const getUserInfo = (email) => {
    return users.find(u => u.email === email) || { 
      full_name: email, 
      phone: '-', 
      mobile_phone: '-',
      position: '-',
      department: '-',
      location: '-'
    };
  };

  const handleRespond = (request) => {
    setSelectedRequest(request);
    setResponse(request.response || "");
    setNewStatus(request.status);
    setShowResponseDialog(true);
  };

  const handleSaveResponse = async () => {
    try {
      await base44.entities.HRRequest.update(selectedRequest.id, {
        response,
        status: newStatus
      });
      setShowResponseDialog(false);
      setResponse("");
      setNewStatus("");
      setSelectedRequest(null);
      await loadData();
    } catch (error) {
      console.error("Erro ao salvar resposta:", error);
    }
  };

  const handleDragEnd = async (result) => {
    const { source, destination, draggableId } = result;

    if (!destination) return;
    if (source.droppableId === destination.droppableId) return;

    const newStatus = destination.droppableId;
    const requestId = draggableId;

    try {
      await base44.entities.HRRequest.update(requestId, { status: newStatus });
      await loadData();
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Aprovado': return 'bg-green-100 text-green-800 border-green-300';
      case 'Rejeitado': return 'bg-red-100 text-red-800 border-red-300';
      case 'Em Análise': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'Concluído': return 'bg-blue-100 text-blue-800 border-blue-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Aprovado': return CheckCircle;
      case 'Rejeitado': return XCircle;
      case 'Em Análise': return Loader2;
      case 'Concluído': return CheckCircle;
      default: return Clock;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'Urgente': return 'bg-red-100 text-red-800';
      case 'Alta': return 'bg-orange-100 text-orange-800';
      case 'Normal': return 'bg-blue-100 text-blue-800';
      case 'Baixa': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!currentUser || (currentUser.department !== 'RH' && currentUser.role !== 'admin')) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8 glass-card rounded-2xl">
        <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
        <h1 className="text-2xl font-bold glass-text">Acesso Restrito</h1>
        <p className="glass-text-muted mt-2">Apenas membros do RH podem acessar esta página.</p>
      </div>
    );
  }

  const pendingRequests = requests.filter(r => r.status === 'Pendente');
  const inAnalysisRequests = requests.filter(r => r.status === 'Em Análise');
  const approvedRequests = requests.filter(r => r.status === 'Aprovado');
  const completedRequests = requests.filter(r => r.status === 'Concluído');
  const rejectedRequests = requests.filter(r => r.status === 'Rejeitado');

  const filteredRequests = requests.filter(request => {
    const userInfo = getUserInfo(request.created_by);
    const matchesSearch = !searchTerm || 
      request.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      userInfo.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.created_by.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = filterCategory === "Todas" || request.category === filterCategory;
    const matchesPriority = filterPriority === "Todas" || request.priority === filterPriority;
    
    return matchesSearch && matchesCategory && matchesPriority;
  });

  const RequestCard = ({ request, isCompact = false }) => {
    const userInfo = getUserInfo(request.created_by);
    const StatusIcon = getStatusIcon(request.status);
    const statusColor = getStatusColor(request.status);

    if (isCompact) {
      // Versão compacta para Kanban
      return (
        <div className="glass-card p-4 rounded-xl hover:shadow-lg transition-all bg-white border-l-4 border-blue-500 cursor-pointer">
          <div className="flex items-start gap-2 mb-3">
            <Avatar className="w-10 h-10 border-2 border-white shadow-md flex-shrink-0">
              <AvatarImage src={userInfo.avatar_url} />
              <AvatarFallback className="bg-gradient-to-r from-blue-400 to-purple-500 text-white font-bold text-sm">
                {userInfo.full_name?.charAt(0) || '?'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-gray-900 text-sm line-clamp-2 mb-1">{request.title}</h3>
              <p className="text-xs text-gray-600 font-semibold">{userInfo.full_name}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 mb-2">
            <Badge variant="outline" className="text-xs font-medium">{request.category}</Badge>
            {request.priority && request.priority !== 'Normal' && (
              <Badge className={`${getPriorityColor(request.priority)} text-xs`}>
                {request.priority}
              </Badge>
            )}
          </div>

          <p className="text-xs text-gray-700 line-clamp-2 mb-3">{request.description}</p>

          <div className="flex items-center justify-between pt-2 border-t border-gray-200">
            <span className="text-xs text-gray-500 font-medium">
              {format(new Date(request.created_date), "dd/MM", { locale: ptBR })}
            </span>
            <Button
              onClick={(e) => {
                e.stopPropagation();
                handleRespond(request);
              }}
              size="sm"
              className="glass-button-primary text-xs px-3 h-7"
            >
              <Send className="w-3 h-3 mr-1" />
              Responder
            </Button>
          </div>
        </div>
      );
    }

    // Versão completa para Lista
    return (
      <div className="glass-card p-5 rounded-2xl hover:shadow-xl transition-all border-l-4 border-blue-500">
        {/* Informações do Solicitante - DESTAQUE */}
        <div className="glass-card p-4 rounded-xl bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 mb-4">
          <div className="flex items-start gap-3">
            <Avatar className="w-14 h-14 border-2 border-white shadow-lg flex-shrink-0">
              <AvatarImage src={userInfo.avatar_url} />
              <AvatarFallback className="bg-gradient-to-r from-blue-400 to-purple-500 text-white font-bold">
                {userInfo.full_name?.charAt(0) || '?'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0 grid md:grid-cols-3 gap-3">
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <UserIcon className="w-4 h-4 text-blue-600" />
                  <span className="text-xs text-blue-600 font-bold">SOLICITANTE</span>
                </div>
                <p className="font-bold text-gray-900 truncate">{userInfo.full_name}</p>
                <p className="text-xs text-gray-700">{userInfo.position}</p>
              </div>
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <Building className="w-4 h-4 text-purple-600" />
                  <span className="text-xs text-purple-600 font-bold">DEPARTAMENTO</span>
                </div>
                <p className="font-bold text-gray-900">{userInfo.department}</p>
                <p className="text-xs text-gray-700 flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {userInfo.location}
                </p>
              </div>
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <Phone className="w-4 h-4 text-green-600" />
                  <span className="text-xs text-green-600 font-bold">CONTATO</span>
                </div>
                <p className="font-bold text-gray-900 text-sm">{userInfo.phone || userInfo.mobile_phone || '-'}</p>
                <p className="text-xs text-gray-700 truncate">{request.created_by}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Detalhes da Solicitação */}
        <div className="mb-4">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex-1">
              <h3 className="text-lg font-bold glass-text mb-2">{request.title}</h3>
              <div className="flex flex-wrap items-center gap-2">
                <Badge className={`${statusColor} font-bold`}>
                  <StatusIcon className={`w-3.5 h-3.5 mr-1.5 ${request.status === 'Em Análise' ? 'animate-spin' : ''}`} />
                  {request.status}
                </Badge>
                <Badge variant="outline" className="font-medium glass-text">
                  {request.category}
                </Badge>
                {request.priority && request.priority !== 'Normal' && (
                  <Badge className={getPriorityColor(request.priority)}>
                    {request.priority}
                  </Badge>
                )}
              </div>
            </div>
            <Button
              onClick={() => handleRespond(request)}
              className="glass-button-primary flex-shrink-0"
              size="sm"
            >
              <Send className="w-4 h-4 mr-2" />
              Responder
            </Button>
          </div>

          <p className="glass-text-muted text-sm leading-relaxed mb-3 whitespace-pre-wrap">
            {request.description}
          </p>

          {request.response && (
            <div className="glass-card p-4 rounded-xl bg-green-50 border-2 border-green-200 mb-3">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="font-bold text-green-900">Resposta Enviada:</span>
              </div>
              <p className="text-green-800 text-sm font-medium leading-relaxed">{request.response}</p>
            </div>
          )}

          <div className="flex items-center justify-between pt-3 border-t border-gray-200">
            <div className="flex items-center gap-1.5 glass-text-muted text-xs">
              <Calendar className="w-3.5 h-3.5" />
              <span className="font-semibold">
                {format(new Date(request.created_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </span>
            </div>
            {request.due_date && (
              <div className="flex items-center gap-1.5 text-orange-600 text-xs font-bold">
                <Clock className="w-3.5 h-3.5" />
                <span>Prazo: {format(new Date(request.due_date), "dd/MM/yy", { locale: ptBR })}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Calcular métricas
  const mandatoryContents = contents.filter(c => c.is_mandatory);
  const totalMandatory = mandatoryContents.length;
  const totalUsers = users.length;
  
  const completionByDept = {};
  users.forEach(user => {
    const dept = user.department || 'Sem Departamento';
    if (!completionByDept[dept]) {
      completionByDept[dept] = { total: 0, completed: 0 };
    }
    completionByDept[dept].total++;
    
    mandatoryContents.forEach(content => {
      if (content.completed_by && content.completed_by.includes(user.email)) {
        completionByDept[dept].completed++;
      }
    });
  });

  const lowAdoptionCourses = mandatoryContents
    .map(c => ({
      ...c,
      completionRate: ((c.completed_by?.length || 0) / totalUsers) * 100
    }))
    .filter(c => c.completionRate < 50)
    .sort((a, b) => a.completionRate - b.completionRate)
    .slice(0, 5);

  const complaintsByCategory = {};
  complaints.forEach(c => {
    complaintsByCategory[c.category] = (complaintsByCategory[c.category] || 0) + 1;
  });

  const complaintsByStatus = {};
  complaints.forEach(c => {
    complaintsByStatus[c.status] = (complaintsByStatus[c.status] || 0) + 1;
  });

  return (
    <div className="space-y-6">
      {/* Header com Toggle de Métricas */}
      <div className="glass-card p-6 md:p-8 rounded-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
              <BarChart3 className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold glass-text">Dashboard RH</h1>
              <p className="glass-text-muted mt-1 text-lg">Painel de Controle e Métricas</p>
            </div>
          </div>
          <Button
            onClick={() => setShowMetrics(!showMetrics)}
            className="glass-button-secondary"
          >
            {showMetrics ? 'Ocultar Métricas' : 'Mostrar Métricas'}
          </Button>
        </div>
      </div>

      {/* NOVO: Painel de Métricas */}
      {showMetrics && (
        <div className="space-y-6">
          {/* 1. Visão Geral de Solicitações */}
          <div className="glass-card p-6 rounded-2xl">
            <h2 className="text-xl font-bold glass-text mb-4 flex items-center gap-2">
              <FileText className="w-6 h-6 text-blue-600" />
              Solicitações de RH - Visão Geral
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center p-4 glass rounded-xl bg-orange-50">
                <div className="text-3xl font-bold text-orange-600">{pendingRequests.length}</div>
                <div className="text-sm font-semibold text-orange-800 mt-1">Pendentes</div>
              </div>
              <div className="text-center p-4 glass rounded-xl bg-yellow-50">
                <div className="text-3xl font-bold text-yellow-600">{inAnalysisRequests.length}</div>
                <div className="text-sm font-semibold text-yellow-800 mt-1">Em Análise</div>
              </div>
              <div className="text-center p-4 glass rounded-xl bg-green-50">
                <div className="text-3xl font-bold text-green-600">{approvedRequests.length}</div>
                <div className="text-sm font-semibold text-green-800 mt-1">Aprovadas</div>
              </div>
              <div className="text-center p-4 glass rounded-xl bg-red-50">
                <div className="text-3xl font-bold text-red-600">{rejectedRequests.length}</div>
                <div className="text-sm font-semibold text-red-800 mt-1">Rejeitadas</div>
              </div>
              <div className="text-center p-4 glass rounded-xl bg-blue-50">
                <div className="text-3xl font-bold text-blue-600">{completedRequests.length}</div>
                <div className="text-sm font-semibold text-blue-800 mt-1">Concluídas</div>
              </div>
            </div>
          </div>

          {/* 2. Estatísticas de Treinamentos Obrigatórios */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="glass-card p-6 rounded-2xl">
              <h2 className="text-xl font-bold glass-text mb-4 flex items-center gap-2">
                <BookOpen className="w-6 h-6 text-purple-600" />
                Treinamentos Obrigatórios
              </h2>
              
              <div className="mb-5 p-4 glass rounded-xl bg-purple-50">
                <div className="text-4xl font-bold text-purple-600">{totalMandatory}</div>
                <div className="text-sm font-semibold text-purple-800 mt-1">Cursos Obrigatórios Ativos</div>
              </div>

              <h3 className="font-bold text-gray-900 mb-3 text-sm">Conclusão por Departamento</h3>
              <div className="space-y-3">
                {Object.entries(completionByDept).map(([dept, stats]) => {
                  const percentage = (stats.completed / (stats.total * totalMandatory)) * 100;
                  return (
                    <div key={dept}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-semibold text-gray-900">{dept}</span>
                        <span className="text-sm font-bold text-blue-600">{percentage.toFixed(0)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            percentage >= 75 ? 'bg-green-500' :
                            percentage >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="glass-card p-6 rounded-2xl">
              <h2 className="text-xl font-bold glass-text mb-4 flex items-center gap-2">
                <TrendingDown className="w-6 h-6 text-orange-600" />
                Cursos com Baixa Adesão
              </h2>
              
              {lowAdoptionCourses.length > 0 ? (
                <div className="space-y-4">
                  {lowAdoptionCourses.map(course => (
                    <div key={course.id} className="glass p-4 rounded-xl border-2 border-orange-200">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <h4 className="font-bold text-gray-900 text-sm flex-1 line-clamp-2">{course.title}</h4>
                        <Badge className="bg-orange-100 text-orange-800 flex-shrink-0">
                          {course.completionRate.toFixed(0)}%
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <span>{course.completed_by?.length || 0} de {totalUsers} concluíram</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                        <div
                          className="bg-orange-500 h-1.5 rounded-full"
                          style={{ width: `${course.completionRate}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Target className="w-12 h-12 text-green-500 mx-auto mb-3" />
                  <p className="text-green-700 font-semibold">Ótimo trabalho!</p>
                  <p className="text-sm text-gray-600 mt-1">Todos os cursos têm boa adesão</p>
                </div>
              )}
            </div>
          </div>

          {/* 3. Resumo de Denúncias Anônimas */}
          <div className="glass-card p-6 rounded-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold glass-text flex items-center gap-2">
                <Shield className="w-6 h-6 text-red-600" />
                Denúncias Anônimas - Resumo
              </h2>
              <Link to={createPageUrl("Admin")}>
                <Button className="glass-button-secondary text-sm">
                  Gerenciar Denúncias
                </Button>
              </Link>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-bold text-gray-900 mb-3 text-sm">Por Status de Investigação</h3>
                <div className="space-y-2">
                  {Object.entries(complaintsByStatus).map(([status, count]) => (
                    <div key={status} className="flex items-center justify-between p-3 glass rounded-lg">
                      <span className="text-sm font-semibold text-gray-900">{status}</span>
                      <Badge className={
                        status === 'Resolvida' ? 'bg-green-100 text-green-800' :
                        status === 'Em Investigação' ? 'bg-orange-100 text-orange-800' :
                        status === 'Nova' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }>
                        {count}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-bold text-gray-900 mb-3 text-sm">Por Categoria</h3>
                <div className="space-y-2">
                  {Object.entries(complaintsByCategory).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([category, count]) => (
                    <div key={category} className="flex items-center justify-between p-3 glass rounded-lg">
                      <span className="text-sm font-semibold text-gray-900">{category}</span>
                      <Badge variant="outline">{count}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-4 p-4 glass rounded-xl bg-red-50 border-2 border-red-200">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <span className="font-bold text-red-900">
                  {complaints.filter(c => c.status === 'Nova' || c.status === 'Em Análise').length} denúncias aguardando ação
                </span>
              </div>
            </div>
          </div>

          {/* 4. Acesso Rápido - Gestão */}
          <div className="glass-card p-6 rounded-2xl">
            <h2 className="text-xl font-bold glass-text mb-4 flex items-center gap-2">
              <Settings className="w-6 h-6 text-indigo-600" />
              Acesso Rápido - Gerenciamento
            </h2>

            <div className="grid md:grid-cols-3 gap-4">
              <Link to={createPageUrl("Admin")}>
                <div className="glass-card p-5 rounded-xl hover:scale-105 transition-all cursor-pointer bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200">
                  <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center mb-3">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-1">Usuários e Permissões</h3>
                  <p className="text-sm text-gray-700">Gerenciar acessos e papéis</p>
                  <div className="mt-3 text-2xl font-bold text-blue-600">{users.length}</div>
                </div>
              </Link>

              <Link to={createPageUrl("Admin")}>
                <div className="glass-card p-5 rounded-xl hover:scale-105 transition-all cursor-pointer bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200">
                  <div className="w-12 h-12 rounded-xl bg-purple-600 flex items-center justify-center mb-3">
                    <BookOpen className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-1">Conteúdos e Cursos</h3>
                  <p className="text-sm text-gray-700">Gerenciar material de treinamento</p>
                  <div className="mt-3 text-2xl font-bold text-purple-600">{contents.length}</div>
                </div>
              </Link>

              <Link to={createPageUrl("Admin")}>
                <div className="glass-card p-5 rounded-xl hover:scale-105 transition-all cursor-pointer bg-gradient-to-br from-red-50 to-orange-50 border-2 border-red-200">
                  <div className="w-12 h-12 rounded-xl bg-red-600 flex items-center justify-center mb-3">
                    <Shield className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-1">Denúncias e Compliance</h3>
                  <p className="text-sm text-gray-700">Canal de ética e investigações</p>
                  <div className="mt-3 text-2xl font-bold text-red-600">{complaints.length}</div>
                </div>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Divisor */}
      {showMetrics && (
        <div className="glass-card p-6 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-600">
          <h2 className="text-2xl font-bold text-white text-center">Solicitações de RH</h2>
        </div>
      )}

      {/* Stats Cards - UMA ÚNICA COR AZUL */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4">
        <div className="glass-card p-4 md:p-5 rounded-xl text-center bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-2 border-blue-500/30">
          <div className="flex items-center justify-center mb-2">
            <Clock className="w-5 h-5 md:w-6 md:h-6 text-blue-600" />
          </div>
          <div className="text-2xl md:text-3xl font-bold text-blue-600">{pendingRequests.length}</div>
          <div className="text-blue-800 mt-1 font-bold text-xs md:text-sm">Pendentes</div>
        </div>

        <div className="glass-card p-4 md:p-5 rounded-xl text-center bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-2 border-blue-500/30">
          <div className="flex items-center justify-center mb-2">
            <Loader2 className="w-5 h-5 md:w-6 md:h-6 text-blue-600" />
          </div>
          <div className="text-2xl md:text-3xl font-bold text-blue-600">{inAnalysisRequests.length}</div>
          <div className="text-blue-800 mt-1 font-bold text-xs md:text-sm">Em Análise</div>
        </div>

        <div className="glass-card p-4 md:p-5 rounded-xl text-center bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-2 border-blue-500/30">
          <div className="flex items-center justify-center mb-2">
            <CheckCircle className="w-5 h-5 md:w-6 md:h-6 text-blue-600" />
          </div>
          <div className="text-2xl md:text-3xl font-bold text-blue-600">{approvedRequests.length}</div>
          <div className="text-blue-800 mt-1 font-bold text-xs md:text-sm">Aprovadas</div>
        </div>

        <div className="glass-card p-4 md:p-5 rounded-xl text-center bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-2 border-blue-500/30">
          <div className="flex items-center justify-center mb-2">
            <CheckCircle className="w-5 h-5 md:w-6 md:h-6 text-blue-600" />
          </div>
          <div className="text-2xl md:text-3xl font-bold text-blue-600">{completedRequests.length}</div>
          <div className="text-blue-800 mt-1 font-bold text-xs md:text-sm">Concluídas</div>
        </div>

        <div className="glass-card p-4 md:p-5 rounded-xl text-center bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-2 border-blue-500/30">
          <div className="flex items-center justify-center mb-2">
            <FileText className="w-5 h-5 md:w-6 md:h-6 text-blue-600" />
          </div>
          <div className="text-2xl md:text-3xl font-bold text-blue-600">{requests.length}</div>
          <div className="text-blue-800 mt-1 font-bold text-xs md:text-sm">Total</div>
        </div>
      </div>

      {/* Filtros e Toggle de Visualização */}
      <div className="glass-card p-4 md:p-6 rounded-2xl">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 glass-text-muted" />
              <Input
                placeholder="Buscar por nome, solicitação..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 glass-input"
              />
            </div>

            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="glass-select">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterPriority} onValueChange={setFilterPriority}>
              <SelectTrigger className="glass-select">
                <SelectValue placeholder="Prioridade" />
              </SelectTrigger>
              <SelectContent>
                {priorities.map(priority => (
                  <SelectItem key={priority} value={priority}>{priority}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Toggle Visualização */}
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              onClick={() => setViewMode('list')}
              className={viewMode === 'list' ? 'glass-button-primary' : 'glass-button'}
            >
              <LayoutList className="w-4 h-4 mr-2" />
              Lista
            </Button>
            <Button
              variant={viewMode === 'kanban' ? 'default' : 'outline'}
              onClick={() => setViewMode('kanban')}
              className={viewMode === 'kanban' ? 'glass-button-primary' : 'glass-button'}
            >
              <LayoutGrid className="w-4 h-4 mr-2" />
              Kanban
            </Button>
          </div>
        </div>
      </div>

      {/* Visualização em Lista */}
      {viewMode === 'list' && (
        <div className="space-y-4">
          {filteredRequests.length > 0 ? (
            filteredRequests.map(request => (
              <RequestCard key={request.id} request={request} />
            ))
          ) : (
            <div className="text-center py-12 glass-card rounded-2xl">
              <CheckCircle className="w-16 h-16 text-blue-500 mx-auto mb-4 opacity-50" />
              <p className="glass-text font-bold text-lg">Nenhuma solicitação encontrada</p>
              <p className="glass-text-muted mt-2">Ajuste os filtros para encontrar solicitações.</p>
            </div>
          )}
        </div>
      )}

      {/* Visualização em Kanban */}
      {viewMode === 'kanban' && (
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 overflow-x-auto">
            {kanbanColumns.map(column => {
              const columnRequests = filteredRequests.filter(r => r.status === column.id);
              
              return (
                <div key={column.id} className="flex-shrink-0 min-w-[280px]">
                  <div className={`glass-card p-3 rounded-xl mb-3 bg-gradient-to-r ${column.color}`}>
                    <h3 className="font-bold text-white text-sm flex items-center justify-between">
                      <span>{column.title}</span>
                      <Badge className="bg-white/30 text-white border-none font-bold">
                        {columnRequests.length}
                      </Badge>
                    </h3>
                  </div>

                  <Droppable droppableId={column.id}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`space-y-3 min-h-[400px] p-2 rounded-xl transition-colors ${
                          snapshot.isDraggingOver ? 'bg-blue-50/30' : ''
                        }`}
                      >
                        {columnRequests.map((request, index) => (
                          <Draggable
                            key={request.id}
                            draggableId={request.id}
                            index={index}
                          >
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={snapshot.isDragging ? 'opacity-50' : ''}
                              >
                                <RequestCard request={request} isCompact={true} />
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                        
                        {columnRequests.length === 0 && (
                          <div className="text-center py-8 glass-card rounded-xl opacity-50">
                            <FileText className="w-10 h-10 glass-text-muted mx-auto mb-2" />
                            <p className="glass-text-muted text-sm">Nenhuma solicitação</p>
                          </div>
                        )}
                      </div>
                    )}
                  </Droppable>
                </div>
              );
            })}
          </div>
        </DragDropContext>
      )}

      {/* Modal de Resposta */}
      <Dialog open={showResponseDialog} onOpenChange={setShowResponseDialog}>
        <DialogContent className="glass-modal max-w-3xl p-0">
          <div className="p-6 md:p-8">
            <DialogHeader className="mb-6">
              <h2 className="modal-title">Responder Solicitação</h2>
              {selectedRequest && (
                <>
                  <p className="modal-description mb-4">{selectedRequest.title}</p>
                  
                  <div className="glass-card p-4 rounded-xl bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200">
                    <div className="flex items-center gap-4">
                      <Avatar className="w-12 h-12 border-2 border-white shadow-lg">
                        <AvatarImage src={getUserInfo(selectedRequest.created_by).avatar_url} />
                        <AvatarFallback className="bg-gradient-to-r from-blue-400 to-purple-500 text-white font-bold">
                          {getUserInfo(selectedRequest.created_by).full_name?.charAt(0) || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-2">
                        <div>
                          <div className="text-xs text-blue-600 font-bold">SOLICITANTE</div>
                          <div className="text-sm font-bold text-gray-900">{getUserInfo(selectedRequest.created_by).full_name}</div>
                          <div className="text-xs text-gray-700">{getUserInfo(selectedRequest.created_by).position}</div>
                        </div>
                        <div>
                          <div className="text-xs text-blue-600 font-bold">CONTATO</div>
                          <div className="text-sm font-bold text-gray-900">
                            {getUserInfo(selectedRequest.created_by).phone || getUserInfo(selectedRequest.created_by).mobile_phone || '-'}
                          </div>
                          <div className="text-xs text-gray-700">{getUserInfo(selectedRequest.created_by).department}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="glass-card p-4 rounded-xl mt-4 bg-gray-50">
                    <div className="text-xs font-bold text-gray-600 mb-2">DESCRIÇÃO DA SOLICITAÇÃO</div>
                    <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                      {selectedRequest.description}
                    </p>
                  </div>
                </>
              )}
            </DialogHeader>

            <div className="space-y-5">
              <div>
                <Label className="glass-label">Novo Status da Solicitação</Label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger className="glass-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pendente">⏳ Pendente</SelectItem>
                    <SelectItem value="Em Análise">🔍 Em Análise</SelectItem>
                    <SelectItem value="Aprovado">✅ Aprovado</SelectItem>
                    <SelectItem value="Rejeitado">❌ Rejeitado</SelectItem>
                    <SelectItem value="Concluído">✔️ Concluído</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="glass-label">Resposta ao Colaborador</Label>
                <Textarea
                  value={response}
                  onChange={(e) => setResponse(e.target.value)}
                  className="glass-textarea"
                  rows={6}
                  placeholder="Escreva uma resposta clara e objetiva para o colaborador..."
                />
                <p className="helper-text mt-2">
                  💡 Seja claro e objetivo. O colaborador receberá esta resposta na página de RH.
                </p>
              </div>
            </div>

            <div className="flex flex-col md:flex-row justify-end gap-3 pt-6 mt-6 border-t border-gray-200">
              <Button 
                variant="ghost" 
                onClick={() => setShowResponseDialog(false)} 
                className="glass-button-secondary"
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleSaveResponse} 
                className="glass-button-primary"
                disabled={!newStatus || !response.trim()}
              >
                <Send className="w-4 h-4 mr-2" />
                Salvar e Enviar Resposta
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}