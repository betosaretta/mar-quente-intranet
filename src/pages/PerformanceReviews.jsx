import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { User } from "@/entities/User";
import {
  ClipboardCheck,
  Plus,
  Star,
  TrendingUp,
  Users,
  Award,
  Eye,
  CheckCircle,
  BarChart3,
  ThumbsUp,
  ThumbsDown,
  Target,
  Lightbulb
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function PerformanceReviews() {
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [showNewReviewDialog, setShowNewReviewDialog] = useState(false);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [selectedReview, setSelectedReview] = useState(null);
  const [filterStatus, setFilterStatus] = useState("Todas");
  const [filterType, setFilterType] = useState("Todos");
  const [showDashboard, setShowDashboard] = useState(false);

  const [newReview, setNewReview] = useState({
    evaluation_type: "",
    evaluated_user_email: "",
    period: "Jan à Mar",
    year: new Date().getFullYear(),
    quarter: "1º",
    scores: {},
    highlights: "",
    improvements: "",
    ideas_presented: "",
    pdi: "",
    positive_surprise: "",
    negative_surprise: "",
    suggested_changes: ""
  });

  const evaluationTypes = [
    { value: "Liderados ADM", label: "Avaliação de Liderados - Administrativo", icon: ClipboardCheck },
    { value: "Liderados Lojas", label: "Avaliação de Liderados - Lojas", icon: Users },
    { value: "Liderados Operação", label: "Avaliação de Liderados - Operação", icon: TrendingUp },
    { value: "Avaliação de Gestor", label: "Avaliação de Gestor", icon: Star }
  ];

  // Critérios para cada tipo de avaliação
  const criteriaByType = {
    "Liderados ADM": [
      { id: "qualidade", label: "Qualidade", weight: 1 },
      { id: "produtividade", label: "Produtividade", weight: 1 },
      { id: "criatividade", label: "Criatividade", weight: 1 },
      { id: "compromisso", label: "Compromisso", weight: 1 },
      { id: "cha", label: "CHA (Conhecimento, Habilidade, Atitude)", weight: 1 },
      { id: "comportamento_interpessoal", label: "Comportamento Interpessoal", weight: 1 },
      { id: "postura", label: "Comportamento/Postura", weight: 1 },
      { id: "comprometimento", label: "Comportamento/Comprometimento", weight: 1 },
      { id: "absenteismo", label: "Absenteísmo", weight: 1 },
      { id: "normas_empresa", label: "Normas da Empresa", weight: 1 }
    ],
    "Liderados Lojas": [
      { id: "comunicacao_venda", label: "Comunicação (Venda)", weight: 1 },
      { id: "comunicacao_pos_venda", label: "Comunicação (Pós Venda)", weight: 1 },
      { id: "criatividade", label: "Criatividade", weight: 1 },
      { id: "compromisso", label: "Compromisso", weight: 1 },
      { id: "cha", label: "CHA", weight: 2 },
      { id: "comportamento_interpessoal", label: "Comportamento Interpessoal", weight: 0.5 },
      { id: "postura", label: "Comportamento/Postura", weight: 0.5 },
      { id: "comprometimento", label: "Comportamento/Comprometimento", weight: 0.5 },
      { id: "absenteismo", label: "Absenteísmo", weight: 2 },
      { id: "normas_empresa", label: "Normas da Empresa", weight: 0.5 }
    ],
    "Liderados Operação": [
      { id: "comprometimento", label: "Comprometimento", weight: 2 },
      { id: "postura", label: "Postura", weight: 2 },
      { id: "produtividade", label: "Produtividade", weight: 2 },
      { id: "trabalho_equipe", label: "Trabalho em Equipe", weight: 2 },
      { id: "pontualidade", label: "Pontualidade", weight: 2 }
    ],
    "Avaliação de Gestor": [
      { id: "define_problemas", label: "Define e entende problemas", weight: 1 },
      { id: "toma_decisoes", label: "Toma e Apoia Decisões", weight: 1 },
      { id: "ouve_pessoas", label: "Ouve as pessoas", weight: 1 },
      { id: "respeito", label: "Respeito", weight: 1 },
      { id: "ambiente_trabalho", label: "Ambiente de Trabalho", weight: 1 },
      { id: "relacoes_colaborativas", label: "Constrói relações colaborativas", weight: 1 },
      { id: "administra_conflitos", label: "Administra os Conflitos", weight: 1 },
      { id: "direcionamento", label: "Direcionamento e Desenvolvimento", weight: 1 },
      { id: "flexivel_mudancas", label: "Flexível a Mudanças", weight: 1 },
      { id: "metas_produtividade", label: "Metas, Produtividade e Distribuição de Tarefas", weight: 1 }
    ]
  };

  // Opções de nota
  const gradeOptions = [
    { value: "A", label: "A - Excelente/Muito Bom", points: 10, color: "bg-green-500" },
    { value: "B", label: "B - Padrão/Satisfatório", points: 8, color: "bg-blue-500" },
    { value: "C", label: "C - Médio/Regular", points: 6, color: "bg-yellow-500" },
    { value: "D", label: "D - Abaixo/Reavaliação", points: 3, color: "bg-red-500" }
  ];

  const operationGradeOptions = [
    { value: "2", label: "Satisfatório", points: 2, color: "bg-green-500" },
    { value: "1", label: "Regular", points: 1, color: "bg-yellow-500" },
    { value: "0.5", label: "Insatisfatório", points: 0.5, color: "bg-red-500" }
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [currentUser, allUsers, reviewsData] = await Promise.all([
        User.me(),
        base44.entities.User.list(),
        base44.entities.PerformanceReview.list("-created_date")
      ]);

      setUser(currentUser);
      setUsers(allUsers);

      // Filtrar avaliações baseado no usuário
      let userReviews = reviewsData;

      // Se NÃO for admin e NÃO for RH, mostrar apenas:
      // 1. Avaliações que o usuário FEZ (é o avaliador)
      // 2. Avaliações que o usuário RECEBEU (é o avaliado)
      if (currentUser.role !== 'admin' && currentUser.department !== 'RH') {
        userReviews = reviewsData.filter(r =>
          r.evaluated_user_email === currentUser.email ||
          r.evaluator_email === currentUser.email
        );
      }

      setReviews(userReviews);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    }
  };

  const calculateTotalScore = (scores, evaluationType) => {
    const criteria = criteriaByType[evaluationType];
    if (!criteria) return 0;

    let total = 0;
    let isOperacao = evaluationType === "Liderados Operação";

    criteria.forEach(criterion => {
      const grade = scores[criterion.id];
      if (grade) {
        if (isOperacao) {
          total += parseFloat(grade);
        } else {
          const option = gradeOptions.find(g => g.value === grade);
          if (option) {
            total += option.points * (criterion.weight || 1);
          }
        }
      }
    });

    return total;
  };

  const getClassification = (score, evaluationType) => {
    if (evaluationType === "Liderados Operação") {
      if (score >= 8.0) return "Excelente";
      if (score >= 5.5) return "Padrão";
      if (score >= 3.5) return "Médio";
      return "Insatisfatório";
    } else {
      if (score >= 8.01) return "Muito Bom";
      if (score >= 6.51) return "Satisfatório";
      if (score >= 5.01) return "Regular";
      return "Insatisfatório";
    }
  };

  const handleCreateReview = async () => {
    try {
      const totalScore = calculateTotalScore(newReview.scores, newReview.evaluation_type);
      const classification = getClassification(totalScore, newReview.evaluation_type);

      const evaluatedUser = users.find(u => u.email === newReview.evaluated_user_email);

      const reviewData = {
        ...newReview,
        evaluator_email: user.email,
        total_score: totalScore,
        classification: classification,
        status: "Pendente",
        department: evaluatedUser?.department || "",
        position: evaluatedUser?.position || ""
      };

      await base44.entities.PerformanceReview.create(reviewData);

      setShowNewReviewDialog(false);
      setNewReview({
        evaluation_type: "",
        evaluated_user_email: "",
        period: "Jan à Mar",
        year: new Date().getFullYear(),
        quarter: "1º",
        scores: {},
        highlights: "",
        improvements: "",
        ideas_presented: "",
        pdi: "",
        positive_surprise: "",
        negative_surprise: "",
        suggested_changes: ""
      });

      await loadData();
    } catch (error) {
      console.error("Erro ao criar avaliação:", error);
      alert("Erro ao criar avaliação");
    }
  };

  const handleScoreChange = (criterionId, value) => {
    setNewReview(prev => ({
      ...prev,
      scores: {
        ...prev.scores,
        [criterionId]: value
      }
    }));
  };

  const getStatusColor = (status) => {
    switch(status) {
      case "Concluída": return "bg-green-100 text-green-800";
      case "Feedback Enviado": return "bg-blue-100 text-blue-800";
      default: return "bg-yellow-100 text-yellow-800";
    }
  };

  const getClassificationColor = (classification) => {
    switch(classification) {
      case "Excelente":
      case "Muito Bom":
        return "bg-green-500";
      case "Padrão":
      case "Satisfatório":
        return "bg-blue-500";
      case "Médio":
      case "Regular":
        return "bg-yellow-500";
      default:
        return "bg-red-500";
    }
  };

  const filteredReviews = reviews.filter(review => {
    const statusMatch = filterStatus === "Todas" || review.status === filterStatus;
    const typeMatch = filterType === "Todos" || review.evaluation_type === filterType;
    return statusMatch && typeMatch;
  });

  const canCreateReview = user && (
    user.role === 'admin' ||
    user.department === 'RH' ||
    (user.team_members && user.team_members.length > 0)
  );

  // Calcular insights sobre avaliações de gestores
  const getManagerInsights = () => {
    const managerReviews = reviews.filter(r => r.evaluation_type === "Avaliação de Gestor");
    
    if (managerReviews.length === 0) {
      return null;
    }

    // Agrupar pontuações por critério
    const criteriaScores = {};
    const criteria = criteriaByType["Avaliação de Gestor"];
    
    criteria.forEach(criterion => {
      criteriaScores[criterion.id] = {
        label: criterion.label,
        scores: [],
        average: 0
      };
    });

    managerReviews.forEach(review => {
      Object.entries(review.scores).forEach(([criterionId, grade]) => {
        if (criteriaScores[criterionId]) {
          const option = gradeOptions.find(g => g.value === grade);
          if (option) {
            criteriaScores[criterionId].scores.push(option.points);
          }
        }
      });
    });

    // Calcular médias
    Object.keys(criteriaScores).forEach(key => {
      const scores = criteriaScores[key].scores;
      if (scores.length > 0) {
        criteriaScores[key].average = scores.reduce((a, b) => a + b, 0) / scores.length;
      }
    });

    // Ordenar por média
    const sortedCriteria = Object.entries(criteriaScores)
      .map(([id, data]) => ({ id, ...data }))
      .filter(c => c.scores.length > 0)
      .sort((a, b) => b.average - a.average);

    const topStrengths = sortedCriteria.slice(0, 3);
    const areasToImprove = sortedCriteria.slice(-3).reverse();

    return {
      totalReviews: managerReviews.length,
      averageScore: managerReviews.reduce((sum, r) => sum + r.total_score, 0) / managerReviews.length,
      topStrengths,
      areasToImprove,
      allCriteria: sortedCriteria
    };
  };

  const managerInsights = getManagerInsights();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-card p-6 rounded-2xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold glass-text flex items-center gap-3">
              <ClipboardCheck className="w-7 h-7 text-blue-600" />
              Avaliações de Desempenho
            </h1>
            <p className="glass-text-muted mt-1 text-lg">Sistema de avaliação 360°</p>
          </div>
          <div className="flex gap-3">
            {managerInsights && (
              <Button onClick={() => setShowDashboard(true)} className="glass-button-secondary">
                <BarChart3 className="w-5 h-5 mr-2" />
                <span className="hidden md:inline">Insights de Gestores</span>
                <span className="md:hidden">Insights</span>
              </Button>
            )}
            {canCreateReview && (
              <Button onClick={() => setShowNewReviewDialog(true)} className="glass-button-primary">
                <Plus className="w-5 h-5 mr-2" />
                <span className="hidden md:inline">Nova Avaliação</span>
                <span className="md:hidden">Nova</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card p-5 rounded-xl text-center">
          <div className="text-3xl font-bold text-blue-600">{reviews.length}</div>
          <div className="text-sm glass-text-muted mt-1 font-semibold">Total</div>
        </div>
        <div className="glass-card p-5 rounded-xl text-center">
          <div className="text-3xl font-bold text-yellow-600">
            {reviews.filter(r => r.status === "Pendente").length}
          </div>
          <div className="text-sm glass-text-muted mt-1 font-semibold">Pendentes</div>
        </div>
        <div className="glass-card p-5 rounded-xl text-center">
          <div className="text-3xl font-bold text-green-600">
            {reviews.filter(r => r.status === "Concluída").length}
          </div>
          <div className="text-sm glass-text-muted mt-1 font-semibold">Concluídas</div>
        </div>
        <div className="glass-card p-5 rounded-xl text-center">
          <div className="text-3xl font-bold text-purple-600">
            {reviews.filter(r => r.classification === "Muito Bom" || r.classification === "Excelente").length}
          </div>
          <div className="text-sm glass-text-muted mt-1 font-semibold">Excelentes</div>
        </div>
      </div>

      {/* Filtros */}
      <div className="glass-card p-4 rounded-2xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="glass-select">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Todas">Todas</SelectItem>
              <SelectItem value="Pendente">Pendente</SelectItem>
              <SelectItem value="Concluída">Concluída</SelectItem>
              <SelectItem value="Feedback Enviado">Feedback Enviado</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="glass-select">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Todos">Todos os Tipos</SelectItem>
              <SelectItem value="Liderados ADM">Liderados ADM</SelectItem>
              <SelectItem value="Liderados Lojas">Liderados Lojas</SelectItem>
              <SelectItem value="Liderados Operação">Liderados Operação</SelectItem>
              <SelectItem value="Avaliação de Gestor">Avaliação de Gestor</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Lista de Avaliações */}
      <div className="space-y-4">
        {filteredReviews.length > 0 ? (
          filteredReviews.map(review => {
            const evaluatedUser = users.find(u => u.email === review.evaluated_user_email);
            const evaluator = users.find(u => u.email === review.evaluator_email);

            return (
              <div key={review.id} className="glass-card p-5 rounded-2xl hover:shadow-xl transition-all">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-2xl ${getClassificationColor(review.classification)}`}>
                        {review.total_score.toFixed(1)}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-900 text-lg">
                          {evaluatedUser?.full_name || review.evaluated_user_email}
                        </h3>
                        <p className="text-sm text-gray-600">{review.position} • {review.department}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={getClassificationColor(review.classification) + " text-white"}>
                            {review.classification}
                          </Badge>
                          <Badge variant="outline">{review.evaluation_type}</Badge>
                          <Badge className={getStatusColor(review.status)}>
                            {review.status}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div>
                        <span className="text-gray-600">Período:</span>
                        <span className="font-semibold text-gray-900 ml-2">{review.period}/{review.year}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Trimestre:</span>
                        <span className="font-semibold text-gray-900 ml-2">{review.quarter}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Avaliador:</span>
                        <span className="font-semibold text-gray-900 ml-2">{evaluator?.full_name || review.evaluator_email}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Data:</span>
                        <span className="font-semibold text-gray-900 ml-2">
                          {format(new Date(review.created_date), "dd/MM/yy", { locale: ptBR })}
                        </span>
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={() => {
                      setSelectedReview(review);
                      setShowReviewDialog(true);
                    }}
                    size="sm"
                    className="glass-button-primary"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Ver Detalhes
                  </Button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-12 glass-card rounded-2xl">
            <ClipboardCheck className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhuma avaliação encontrada</h3>
            <p className="text-gray-600">
              {canCreateReview
                ? "Clique em 'Nova Avaliação' para começar"
                : "Aguarde uma avaliação do seu gestor"}
            </p>
          </div>
        )}
      </div>

      {/* Dialog: Nova Avaliação */}
      <Dialog open={showNewReviewDialog} onOpenChange={setShowNewReviewDialog}>
        <DialogContent className="glass-modal max-w-4xl p-0 max-h-[90vh] overflow-y-auto">
          <div className="p-8">
            <DialogHeader className="mb-6">
              <h2 className="modal-title">Nova Avaliação de Desempenho</h2>
              <p className="modal-description">Preencha todos os critérios com atenção e imparcialidade</p>
            </DialogHeader>

            <div className="space-y-6">
              {/* Seleção de Tipo e Colaborador */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="glass-label">Tipo de Avaliação</Label>
                  <Select
                    value={newReview.evaluation_type}
                    onValueChange={(value) => setNewReview(prev => ({ ...prev, evaluation_type: value, scores: {} }))}
                  >
                    <SelectTrigger className="glass-select">
                      <SelectValue placeholder="Selecione o tipo..." />
                    </SelectTrigger>
                    <SelectContent>
                      {evaluationTypes.map(type => (
                        <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="glass-label">Colaborador/Gestor Avaliado</Label>
                  <Select
                    value={newReview.evaluated_user_email}
                    onValueChange={(value) => setNewReview(prev => ({ ...prev, evaluated_user_email: value }))}
                  >
                    <SelectTrigger className="glass-select">
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {users
                        .filter(u => {
                          if (user.role === 'admin' || user.department === 'RH') return true;
                          return user.team_members?.includes(u.email);
                        })
                        .map(u => (
                          <SelectItem key={u.id} value={u.email}>
                            {u.full_name} - {u.position}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="glass-label">Período</Label>
                  <Select
                    value={newReview.period}
                    onValueChange={(value) => setNewReview(prev => ({ ...prev, period: value }))}
                  >
                    <SelectTrigger className="glass-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Jan à Mar">Jan à Mar</SelectItem>
                      <SelectItem value="Abr à Jun">Abr à Jun</SelectItem>
                      <SelectItem value="Jul à Set">Jul à Set</SelectItem>
                      <SelectItem value="Out à Dez">Out à Dez</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="glass-label">Trimestre</Label>
                  <Select
                    value={newReview.quarter}
                    onValueChange={(value) => setNewReview(prev => ({ ...prev, quarter: value }))}
                  >
                    <SelectTrigger className="glass-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1º">1º Trimestre</SelectItem>
                      <SelectItem value="2º">2º Trimestre</SelectItem>
                      <SelectItem value="3º">3º Trimestre</SelectItem>
                      <SelectItem value="4º">4º Trimestre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Critérios de Avaliação - MELHORADO */}
              {newReview.evaluation_type && (
                <div className="glass-card p-6 rounded-xl bg-blue-50/50">
                  <h3 className="font-bold text-gray-900 text-lg mb-4">Critérios de Avaliação</h3>

                  <div className="space-y-4">
                    {criteriaByType[newReview.evaluation_type].map((criterion, index) => (
                      <div key={criterion.id} className="glass-card p-5 rounded-lg bg-white">
                        <div className="mb-4">
                          <div className="flex items-start gap-3 mb-3">
                            <span className="font-bold text-gray-900 text-lg flex-shrink-0">{index + 1}.</span>
                            <div className="flex-1">
                              <span className="font-bold text-gray-900 text-base block">{criterion.label}</span>
                              {criterion.weight !== 1 && (
                                <Badge variant="outline" className="text-xs mt-1">
                                  Peso: {criterion.weight}
                                </Badge>
                              )}
                            </div>
                          </div>

                          {/* NOVO: Select melhorado com cards clicáveis */}
                          <div className="space-y-2">
                            {(newReview.evaluation_type === "Liderados Operação" ? operationGradeOptions : gradeOptions).map(option => (
                              <button
                                key={option.value}
                                type="button"
                                onClick={() => handleScoreChange(criterion.id, option.value)}
                                className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                                  newReview.scores[criterion.id] === option.value
                                    ? 'border-blue-600 bg-blue-50 shadow-md'
                                    : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                                    newReview.scores[criterion.id] === option.value
                                      ? 'bg-blue-600'
                                      : 'border-2 border-gray-300'
                                  }`}>
                                    {newReview.scores[criterion.id] === option.value && (
                                      <div className="w-3 h-3 bg-white rounded-full" />
                                    )}
                                  </div>
                                  <div className={`w-4 h-4 rounded ${option.color} flex-shrink-0`} />
                                  <div className="flex-1 min-w-0">
                                    <span className={`font-bold block ${
                                      newReview.scores[criterion.id] === option.value
                                        ? 'text-blue-900'
                                        : 'text-gray-900'
                                    }`}>
                                      {option.label}
                                    </span>
                                    <span className="text-xs text-gray-600 block mt-1">
                                      {option.points} ponto{option.points !== 1 ? 's' : ''}
                                    </span>
                                  </div>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Score Preview */}
                  {Object.keys(newReview.scores).length > 0 && (
                    <div className="mt-6 p-4 glass-card rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm opacity-90">Pontuação Total</div>
                          <div className="text-3xl font-bold">
                            {calculateTotalScore(newReview.scores, newReview.evaluation_type).toFixed(2)}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm opacity-90">Classificação</div>
                          <div className="text-2xl font-bold">
                            {getClassification(calculateTotalScore(newReview.scores, newReview.evaluation_type), newReview.evaluation_type)}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Campos Textuais */}
              {newReview.evaluation_type && newReview.evaluation_type !== "Avaliação de Gestor" && (
                <>
                  <div>
                    <Label className="glass-label">3 Pontos em Destaque</Label>
                    <Textarea
                      value={newReview.highlights}
                      onChange={(e) => setNewReview(prev => ({ ...prev, highlights: e.target.value }))}
                      className="glass-textarea"
                      rows={3}
                      placeholder="Cite exemplos concretos..."
                    />
                  </div>

                  <div>
                    <Label className="glass-label">3 Pontos a Serem Trabalhados</Label>
                    <Textarea
                      value={newReview.improvements}
                      onChange={(e) => setNewReview(prev => ({ ...prev, improvements: e.target.value }))}
                      className="glass-textarea"
                      rows={3}
                      placeholder="Cite exemplos concretos..."
                    />
                  </div>

                  <div>
                    <Label className="glass-label">Ideias Apresentadas</Label>
                    <Textarea
                      value={newReview.ideas_presented}
                      onChange={(e) => setNewReview(prev => ({ ...prev, ideas_presented: e.target.value }))}
                      className="glass-textarea"
                      rows={2}
                      placeholder="O colaborador apresentou alguma ideia que fez mudança significativa?"
                    />
                  </div>

                  <div>
                    <Label className="glass-label">Plano de Desenvolvimento Individual (PDI)</Label>
                    <Textarea
                      value={newReview.pdi}
                      onChange={(e) => setNewReview(prev => ({ ...prev, pdi: e.target.value }))}
                      className="glass-textarea"
                      rows={3}
                      placeholder="Ex: Cursos, leitura de artigos, livros, vídeos, treinamentos..."
                    />
                  </div>
                </>
              )}

              {/* Campos específicos para Avaliação de Gestor */}
              {newReview.evaluation_type === "Avaliação de Gestor" && (
                <>
                  <div>
                    <Label className="glass-label">Se você fosse o líder, quais seriam as mudanças?</Label>
                    <Textarea
                      value={newReview.suggested_changes}
                      onChange={(e) => setNewReview(prev => ({ ...prev, suggested_changes: e.target.value }))}
                      className="glass-textarea"
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label className="glass-label">Fato que surpreendeu positivamente</Label>
                    <Textarea
                      value={newReview.positive_surprise}
                      onChange={(e) => setNewReview(prev => ({ ...prev, positive_surprise: e.target.value }))}
                      className="glass-textarea"
                      rows={2}
                    />
                  </div>

                  <div>
                    <Label className="glass-label">Fato que surpreendeu negativamente</Label>
                    <Textarea
                      value={newReview.negative_surprise}
                      onChange={(e) => setNewReview(prev => ({ ...prev, negative_surprise: e.target.value }))}
                      className="glass-textarea"
                      rows={2}
                    />
                  </div>
                </>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-gray-200">
              <Button variant="ghost" onClick={() => setShowNewReviewDialog(false)} className="glass-button-secondary">
                Cancelar
              </Button>
              <Button
                onClick={handleCreateReview}
                className="glass-button-primary"
                disabled={!newReview.evaluation_type || !newReview.evaluated_user_email || Object.keys(newReview.scores).length === 0}
              >
                <CheckCircle className="w-5 h-5 mr-2" />
                <span className="hidden md:inline">Finalizar Avaliação</span>
                <span className="md:hidden">Finalizar</span>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dashboard de Insights dos Gestores */}
      {managerInsights && (
        <Dialog open={showDashboard} onOpenChange={setShowDashboard}>
          <DialogContent className="glass-modal max-w-5xl p-0 max-h-[90vh] overflow-y-auto">
            <div className="p-8">
              <DialogHeader className="mb-6">
                <h2 className="modal-title">Dashboard de Avaliação dos Gestores</h2>
                <p className="modal-description">Análise detalhada das avaliações de liderança</p>
              </DialogHeader>

              <div className="space-y-6">
                {/* Estatísticas Gerais */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="glass-card p-6 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                    <div className="flex items-center justify-between mb-2">
                      <Target className="w-8 h-8 opacity-80" />
                      <div className="text-4xl font-bold">{managerInsights.totalReviews}</div>
                    </div>
                    <div className="text-sm opacity-90">Avaliações de Gestores</div>
                  </div>

                  <div className="glass-card p-6 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 text-white">
                    <div className="flex items-center justify-between mb-2">
                      <Star className="w-8 h-8 opacity-80" />
                      <div className="text-4xl font-bold">{managerInsights.averageScore.toFixed(1)}</div>
                    </div>
                    <div className="text-sm opacity-90">Média Geral de Pontuação</div>
                  </div>

                  <div className="glass-card p-6 rounded-xl bg-gradient-to-br from-green-500 to-green-600 text-white">
                    <div className="flex items-center justify-between mb-2">
                      <Award className="w-8 h-8 opacity-80" />
                      <div className="text-4xl font-bold">
                        {reviews.filter(r => r.evaluation_type === "Avaliação de Gestor" && (r.classification === "Muito Bom" || r.classification === "Excelente")).length}
                      </div>
                    </div>
                    <div className="text-sm opacity-90">Gestores com Excelência</div>
                  </div>
                </div>

                {/* Principais Forças */}
                <div className="glass-card p-6 rounded-xl">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-green-500 flex items-center justify-center">
                      <ThumbsUp className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-lg">Principais Forças da Liderança</h3>
                      <p className="text-sm text-gray-600">Critérios com melhor avaliação</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    {managerInsights.topStrengths.map((criterion, index) => (
                      <div key={criterion.id} className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                          <span className="font-bold text-green-700">{index + 1}</span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-semibold text-gray-900">{criterion.label}</span>
                            <span className="text-sm font-bold text-green-600">{criterion.average.toFixed(1)}/10</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full transition-all"
                              style={{ width: `${(criterion.average / 10) * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Áreas de Melhoria */}
                <div className="glass-card p-6 rounded-xl">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-orange-500 flex items-center justify-center">
                      <ThumbsDown className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-lg">Oportunidades de Melhoria</h3>
                      <p className="text-sm text-gray-600">Critérios que precisam de atenção</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    {managerInsights.areasToImprove.map((criterion, index) => (
                      <div key={criterion.id} className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
                          <span className="font-bold text-orange-700">{index + 1}</span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-semibold text-gray-900">{criterion.label}</span>
                            <span className="text-sm font-bold text-orange-600">{criterion.average.toFixed(1)}/10</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-gradient-to-r from-orange-500 to-orange-600 h-2 rounded-full transition-all"
                              style={{ width: `${(criterion.average / 10) * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Visão Completa de Todos os Critérios */}
                <div className="glass-card p-6 rounded-xl">
                  <h3 className="font-bold text-gray-900 text-lg mb-4">Visão Completa - Todos os Critérios</h3>
                  <div className="space-y-2">
                    {managerInsights.allCriteria.map((criterion) => (
                      <div key={criterion.id} className="flex items-center gap-3 p-3 glass rounded-lg hover:bg-gray-50 transition-all">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-semibold text-gray-900 text-sm">{criterion.label}</span>
                            <span className="text-sm font-bold text-gray-700">{criterion.average.toFixed(1)}/10</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1.5">
                            <div 
                              className={`h-1.5 rounded-full transition-all ${
                                criterion.average >= 8 ? 'bg-gradient-to-r from-green-500 to-green-600' :
                                criterion.average >= 6.5 ? 'bg-gradient-to-r from-blue-500 to-blue-600' :
                                criterion.average >= 5 ? 'bg-gradient-to-r from-yellow-500 to-yellow-600' :
                                'bg-gradient-to-r from-red-500 to-red-600'
                              }`}
                              style={{ width: `${(criterion.average / 10) * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recomendações */}
                <div className="glass-card p-6 rounded-xl bg-blue-50/50">
                  <h3 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
                    <Lightbulb className="w-5 h-5" />
                    Recomendações Estratégicas
                  </h3>
                  <ul className="space-y-2 text-sm text-blue-800">
                    <li className="flex items-start gap-2">
                      <span className="font-bold mt-0.5">•</span>
                      <span>Considere criar programas de desenvolvimento focados nas áreas de melhoria identificadas</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-bold mt-0.5">•</span>
                      <span>Reconheça e replique as práticas dos gestores bem avaliados nos critérios de força</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-bold mt-0.5">•</span>
                      <span>Implemente sessões de mentoria entre gestores de alta performance e aqueles em desenvolvimento</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-bold mt-0.5">•</span>
                      <span>Estabeleça PDIs (Planos de Desenvolvimento Individual) específicos para cada área de melhoria</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="flex justify-end pt-6 mt-6 border-t border-gray-200">
                <Button onClick={() => setShowDashboard(false)} className="glass-button-primary">
                  Fechar Dashboard
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Dialog: Ver Detalhes */}
      {selectedReview && (
        <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
          <DialogContent className="glass-modal max-w-3xl p-0 max-h-[90vh] overflow-y-auto">
            <div className="p-8">
              <DialogHeader className="mb-6">
                <h2 className="modal-title">Detalhes da Avaliação</h2>
              </DialogHeader>

              <div className="space-y-6">
                {/* Resumo */}
                <div className="glass-card p-6 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm opacity-90 mb-1">Avaliado</div>
                      <div className="text-2xl font-bold">
                        {users.find(u => u.email === selectedReview.evaluated_user_email)?.full_name}
                      </div>
                      <div className="text-sm opacity-90 mt-2">{selectedReview.position} • {selectedReview.department}</div>
                    </div>
                    <div className="text-right">
                      <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center mb-2">
                        <span className="text-3xl font-bold">{selectedReview.total_score.toFixed(1)}</span>
                      </div>
                      <div className="text-lg font-bold">{selectedReview.classification}</div>
                    </div>
                  </div>
                </div>

                {/* Notas por Critério */}
                <div className="glass-card p-6 rounded-xl">
                  <h3 className="font-bold text-gray-900 text-lg mb-4">Avaliação por Critério</h3>
                  <div className="space-y-3">
                    {criteriaByType[selectedReview.evaluation_type]?.map(criterion => {
                      const score = selectedReview.scores[criterion.id];
                      const isOperacao = selectedReview.evaluation_type === "Liderados Operação";
                      const option = isOperacao
                        ? operationGradeOptions.find(g => g.value === score)
                        : gradeOptions.find(g => g.value === score);

                      return (
                        <div key={criterion.id} className="flex items-center justify-between p-3 glass rounded-lg">
                          <span className="font-semibold text-gray-900">{criterion.label}</span>
                          {option && (
                            <div className="flex items-center gap-2">
                              <div className={`w-3 h-3 rounded-full ${option.color}`} />
                              <span className="font-bold text-gray-900">{option.label.split(" - ")[0]}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Comentários */}
                {selectedReview.highlights && (
                  <div className="glass-card p-6 rounded-xl">
                    <h3 className="font-bold text-gray-900 mb-2">Pontos em Destaque</h3>
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{selectedReview.highlights}</p>
                  </div>
                )}

                {selectedReview.improvements && (
                  <div className="glass-card p-6 rounded-xl">
                    <h3 className="font-bold text-gray-900 mb-2">Pontos a Trabalhar</h3>
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{selectedReview.improvements}</p>
                  </div>
                )}

                {selectedReview.pdi && (
                  <div className="glass-card p-6 rounded-xl bg-purple-50/50">
                    <h3 className="font-bold text-purple-900 mb-2">📚 Plano de Desenvolvimento (PDI)</h3>
                    <p className="text-purple-800 leading-relaxed whitespace-pre-wrap">{selectedReview.pdi}</p>
                  </div>
                )}

                {selectedReview.employee_feedback && (
                  <div className="glass-card p-6 rounded-xl bg-green-50/50">
                    <h3 className="font-bold text-green-900 mb-2">💬 Feedback do Colaborador</h3>
                    <p className="text-green-800 leading-relaxed whitespace-pre-wrap">{selectedReview.employee_feedback}</p>
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-6 mt-6 border-t border-gray-200">
                <Button onClick={() => setShowReviewDialog(false)} className="glass-button-primary">
                  Fechar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}