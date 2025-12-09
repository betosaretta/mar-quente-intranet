import React, { useState, useEffect } from "react";
import { CustomForm } from "@/entities/CustomForm";
import { FormResponse } from "@/entities/FormResponse";
import { User } from "@/entities/User";
import {
  FileText,
  Plus,
  CheckCircle,
  Eye,
  Users,
  Calendar,
  Lightbulb,
  Vote,
  MessageSquare,
  Link2,
  Check,
  BarChart,
  Loader2,
  Pencil, // Added Pencil import
  Trash2, // Added Trash2 import
  Trophy, // Added for quiz
  Award, // Added for quiz
  Target, // Added for quiz
  Zap, // Added for quiz
  XCircle // Added for quiz results
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function CustomForms() {
  const [forms, setForms] = useState([]);
  const [myResponses, setMyResponses] = useState([]);
  const [allResponses, setAllResponses] = useState([]); // New state for all responses
  const [user, setUser] = useState(null);
  const [selectedForm, setSelectedForm] = useState(null);
  const [showFormDialog, setShowFormDialog] = useState(false);
  const [showResultsDialog, setShowResultsDialog] = useState(false);
  const [showTemplatesDialog, setShowTemplatesDialog] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false); // New state for report dialog
  const [showEditDialog, setShowEditDialog] = useState(false); // New state for edit dialog
  const [editingForm, setEditingForm] = useState(null); // New state for form being edited
  const [reportForm, setReportForm] = useState(null); // New state for selected form in report
  const [formAnswers, setFormAnswers] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false); // New state for copy link feedback
  const [isExternalUser, setIsExternalUser] = useState(false); // New state for external user
  const [quizResults, setQuizResults] = useState(null); // New state for quiz results

  useEffect(() => {
    loadData();
    checkPublicFormLink();
  }, []);

  const checkPublicFormLink = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const formToken = urlParams.get('form');
    
    if (formToken) {
      try {
        const publicForms = await CustomForm.filter({ public_token: formToken, allow_external_responses: true });
        
        if (publicForms.length > 0) {
          const publicForm = publicForms[0];
          setSelectedForm(publicForm);
          setIsExternalUser(true);
          setShowFormDialog(true); // Open the dialog for the external form immediately
        }
      } catch (error) {
        console.error("Erro ao carregar formulário público:", error);
      }
    }
  };

  const loadData = async () => {
    try {
      let currentUser = null;
      try {
        currentUser = await User.me();
        setUser(currentUser);
      } catch (e) {
        // Usuário não autenticado - ok para formulários públicos
        setUser(null);
      }

      const formsData = await CustomForm.filter({ status: "Ativo" }, '-created_date');
      
      if (currentUser) {
        // Filtrar formulários pelo target (departamento, localidade, categoria)
        const relevantForms = formsData.filter(form => {
          const deptMatch = !form.target_departments || form.target_departments.length === 0 || 
                           form.target_departments.includes(currentUser.department);
          const locMatch = !form.target_locations || form.target_locations.length === 0 || 
                          form.target_locations.includes(currentUser.location);
          const catMatch = !form.target_categories || form.target_categories.length === 0 || 
                          form.target_categories.includes(currentUser.category);
          return deptMatch && locMatch && catMatch;
        });

        setForms(relevantForms);

        const responsesData = await FormResponse.filter({ respondent_email: currentUser.email });
        setMyResponses(responsesData);

        // Carregar todas as respostas (para admin/RH)
        if (currentUser.role === 'admin' || currentUser.department === 'RH') {
          const allResponsesData = await FormResponse.list();
          setAllResponses(allResponsesData);
        }
      } else {
        setForms([]);
        setMyResponses([]);
        setAllResponses([]); // Also clear all responses for external users
      }
    } catch (error) {
      console.error("Erro ao carregar formulários:", error);
    }
  };

  const hasResponded = (formId) => {
    return myResponses.some(response => response.form_id === formId);
  };

  const handleOpenForm = (form) => {
    setSelectedForm(form);
    setFormAnswers({});
    setShowFormDialog(true);
  };

  const handleAnswerChange = (questionId, value) => {
    setFormAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const handleSubmitForm = async () => {
    if (!selectedForm) return;

    // Validar campos obrigatórios
    const requiredQuestions = selectedForm.questions.filter(q => q.is_required);
    const missingAnswers = requiredQuestions.filter(q => !formAnswers[q.id] || (Array.isArray(formAnswers[q.id]) && formAnswers[q.id].length === 0));
    
    if (missingAnswers.length > 0) {
      alert("Por favor, responda todas as perguntas obrigatórias.");
      return;
    }

    setIsSubmitting(true);

    try {
      let responses;
      let quizScore = 0;
      let totalCorrect = 0;
      let totalQuestions = selectedForm.questions.length;
      let totalPossiblePoints = 0;

      // Check if it's a quiz
      if (selectedForm.form_type === 'Quiz') {
        responses = selectedForm.questions.map(q => {
          const userAnswer = formAnswers[q.id];
          // For multi-select quizzes, answer must be an array, correct_answer can be string or array
          const isCorrect = Array.isArray(q.correct_answer) 
            ? (Array.isArray(userAnswer) && q.correct_answer.every(ans => userAnswer.includes(ans)) && userAnswer.every(ans => q.correct_answer.includes(ans)))
            : (userAnswer === q.correct_answer);

          const pointsEarned = isCorrect ? (q.points || 0) : 0;
          
          if (isCorrect) totalCorrect++;
          quizScore += pointsEarned;
          totalPossiblePoints += (q.points || 0);

          return {
            question_id: q.id,
            answer: userAnswer || null,
            is_correct: isCorrect,
            points_earned: pointsEarned
          };
        });

        // Update user points
        if (user && !isExternalUser && quizScore > 0) {
          // This assumes User.updateMe exists and can update points
          // Make sure your backend API for User.updateMe correctly handles point accumulation
          // For simplicity, this example just adds points to the current user's profile.
          // In a real app, you might want a more robust transaction for points.
          const currentUserWithUpdatedPoints = { ...user, points: (user.points || 0) + quizScore };
          await User.updateMe({ points: currentUserWithUpdatedPoints.points });
          setUser(currentUserWithUpdatedPoints); // Update local user state
        }
      } else {
        responses = selectedForm.questions.map(q => ({
          question_id: q.id,
          answer: formAnswers[q.id] || null
        }));
      }

      const quizPercentage = totalQuestions > 0 ? ((totalCorrect / totalQuestions) * 100).toFixed(1) : 0;
      const passed = selectedForm.passing_score ? quizScore >= selectedForm.passing_score : true;

      const responseData = {
        form_id: selectedForm.id,
        responses: responses,
        respondent_email: (selectedForm.is_anonymous || isExternalUser) ? null : user?.email,
        is_anonymous: selectedForm.is_anonymous || isExternalUser,
        quiz_score: selectedForm.form_type === 'Quiz' ? quizScore : null,
        quiz_percentage: selectedForm.form_type === 'Quiz' ? parseFloat(quizPercentage) : null,
        passed: selectedForm.form_type === 'Quiz' ? passed : null,
        total_correct: selectedForm.form_type === 'Quiz' ? totalCorrect : null,
        total_questions: selectedForm.form_type === 'Quiz' ? totalQuestions : null
      };

      await FormResponse.create(responseData);

      // Show quiz results if it's a quiz
      if (selectedForm.form_type === 'Quiz') {
        setQuizResults({
          score: quizScore,
          totalPoints: totalPossiblePoints,
          percentage: parseFloat(quizPercentage),
          totalCorrect: totalCorrect,
          totalQuestions: totalQuestions,
          passed: passed,
          responses: responses // Store detailed responses for feedback
        });
      } else {
        alert("✅ Resposta enviada com sucesso! Obrigado pela participação.");
      }
      
      setShowFormDialog(false);
      setFormAnswers({});
      
      // Limpar URL se veio de link público
      if (isExternalUser) {
        window.history.replaceState({}, document.title, window.location.pathname);
        setIsExternalUser(false); // Reset external user state
        setSelectedForm(null); // Clear selected form after submission
      }
      
      await loadData(); // Reload data for internal users

      // Only show results dialog for non-quiz forms if show_results is true
      if (selectedForm.show_results && selectedForm.form_type !== 'Quiz') {
        setShowResultsDialog(true);
      }
    } catch (error) {
      console.error("Erro ao enviar formulário:", error);
      alert("Erro ao enviar formulário. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const generatePublicLink = async (formId) => {
    try {
      const form = forms.find(f => f.id === formId);
      if (!form) return;

      // Gerar token único se não existir
      const token = form.public_token || Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      
      await CustomForm.update(formId, {
        allow_external_responses: true,
        public_token: token
      });

      // Assuming the public form can be accessed via a specific route or query parameter
      // For this example, let's assume it's the current page with a 'form' query param.
      // In a real app, you might have a dedicated public form URL, e.g., `/public-form/${token}`
      const publicUrl = `${window.location.origin}${window.location.pathname}?form=${token}`;
      
      // Copiar para clipboard
      await navigator.clipboard.writeText(publicUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000); // Reset copied state after 2 seconds
      
      alert(`✅ Link público copiado!\n\n${publicUrl}\n\nQualquer pessoa com este link poderá responder o formulário, mesmo sem estar logada.`);

      await loadData(); // Reload data to show the updated public_token and allow_external_responses status
    } catch (error) {
      console.error("Erro ao gerar link público:", error);
      alert("Erro ao gerar link. Tente novamente.");
    }
  };

  const handleOpenReport = async (form) => {
    setReportForm(form);
    setShowReportDialog(true);
  };

  const calculateReportData = (form) => {
    const formResponses = allResponses.filter(r => r.form_id === form.id);
    const totalResponses = formResponses.length;
    
    const results = form.questions.map(question => {
      const questionResponses = formResponses
        .map(r => r.responses.find(resp => resp.question_id === question.id))
        .filter(r => r && r.answer != null);

      let analysis = {
        question_text: question.question_text,
        question_type: question.question_type,
        total_responses: questionResponses.length,
        answers: []
      };

      if (question.question_type === 'escala') {
        const values = questionResponses.map(r => parseInt(r.answer)).filter(val => !isNaN(val));
        const sum = values.reduce((a, b) => a + b, 0);
        const avg = values.length > 0 ? (sum / values.length).toFixed(1) : "N/A";
        analysis.average = avg;
        analysis.min = values.length > 0 ? Math.min(...values) : "N/A";
        analysis.max = values.length > 0 ? Math.max(...values) : "N/A";
        analysis.distribution = {};
        values.forEach(v => {
          analysis.distribution[v] = (analysis.distribution[v] || 0) + 1;
        });
      } else if (question.question_type === 'multipla_escolha') {
        const distribution = {};
        questionResponses.forEach(r => {
          if (r.answer) {
            distribution[r.answer] = (distribution[r.answer] || 0) + 1;
          }
        });
        analysis.distribution = distribution;
      } else if (question.question_type === 'caixas_selecao') {
        const distribution = {};
        questionResponses.forEach(r => {
          if (Array.isArray(r.answer)) {
            r.answer.forEach(opt => {
              distribution[opt] = (distribution[opt] || 0) + 1;
            });
          }
        });
        analysis.distribution = distribution;
      } else {
        // Texto, Data, Hora, Email (list all answers)
        analysis.answers = questionResponses.map(r => r.answer);
      }

      return analysis;
    });

    return { totalResponses, results };
  };

  const handleEditForm = (form) => {
    setEditingForm({...form, questions: form.questions ? [...form.questions] : []}); // Deep copy questions array
    setShowEditDialog(true);
  };

  const handleDeleteForm = async (formId) => {
    if (!confirm("Tem certeza que deseja excluir este formulário? Esta ação não pode ser desfeita.")) return;
    
    try {
      await CustomForm.delete(formId);
      alert("Formulário excluído com sucesso!");
      await loadData();
    } catch (error) {
      console.error("Erro ao excluir formulário:", error);
      alert("Erro ao excluir formulário. Tente novamente.");
    }
  };

  const handleUpdateForm = async () => {
    if (!editingForm) return;

    try {
      const { id, ...dataToUpdate } = editingForm;
      await CustomForm.update(id, dataToUpdate);
      
      alert("Formulário atualizado com sucesso!");
      setShowEditDialog(false);
      setEditingForm(null);
      await loadData();
    } catch (error) {
      console.error("Erro ao atualizar formulário:", error);
      alert("Erro ao atualizar formulário. Tente novamente.");
    }
  };

  const addQuestion = () => {
    if (!editingForm) return;
    
    const newQuestion = {
      id: `q_${Date.now()}`,
      question_text: "",
      question_type: "texto_curto",
      is_required: false,
      options: [],
      // Default for quiz questions if type is Quiz
      correct_answer: "", 
      points: 0 
    };
    
    setEditingForm(prev => ({
      ...prev,
      questions: [...(prev.questions || []), newQuestion]
    }));
  };

  const removeQuestion = (questionId) => {
    setEditingForm(prev => ({
      ...prev,
      questions: prev.questions.filter(q => q.id !== questionId)
    }));
  };

  const updateQuestion = (questionId, field, value) => {
    setEditingForm(prev => ({
      ...prev,
      questions: prev.questions.map(q =>
        q.id === questionId ? { ...q, [field]: value } : q
      )
    }));
  };

  // Templates de formulários pré-definidos
  const formTemplates = [
    {
      id: "pesquisa_desligamento",
      name: "Pesquisa de Desligamento",
      description: "Entrevista de desligamento completa e tabulada",
      icon: FileText,
      color: "from-red-500 to-orange-600",
      template: {
        title: "Pesquisa de Desligamento",
        description: "Entrevista de desligamento para compreender os motivos da saída e melhorar processos internos",
        form_type: "Pesquisa",
        is_anonymous: false,
        questions: [
          { id: "employee_name", question_text: "Nome Completo", question_type: "texto_curto", is_required: true },
          { id: "position", question_text: "Cargo", question_type: "texto_curto", is_required: true },
          { id: "department", question_text: "Departamento", question_type: "texto_curto", is_required: true },
          { id: "admission_date", question_text: "Data de Admissão", question_type: "data", is_required: true },
          { id: "termination_date", question_text: "Data de Desligamento", question_type: "data", is_required: true },
          
          { id: "termination_type", question_text: "Tipo de Desligamento", question_type: "multipla_escolha", options: ["Pedido de Demissão", "Demissão sem Justa Causa", "Demissão por Justa Causa", "Acordo Mútuo", "Término de Contrato"], is_required: true },
          
          { id: "main_reason", question_text: "Principal motivo do desligamento", question_type: "multipla_escolha", options: ["Melhor oportunidade", "Salário incompatível", "Falta de reconhecimento", "Ambiente de trabalho", "Relação com liderança", "Falta de crescimento profissional", "Problemas pessoais", "Distância/Localização", "Carga de trabalho excessiva", "Outros"], is_required: true },
          
          { id: "satisfaction_salary", question_text: "Satisfação com a remuneração", question_type: "escala", min_scale: 1, max_scale: 10, is_required: true },
          { id: "satisfaction_benefits", question_text: "Satisfação com os benefícios", question_type: "escala", min_scale: 1, max_scale: 10, is_required: true },
          { id: "satisfaction_environment", question_text: "Satisfação com o ambiente de trabalho", question_type: "escala", min_scale: 1, max_scale: 10, is_required: true },
          { id: "satisfaction_leadership", question_text: "Satisfação com a liderança", question_type: "escala", min_scale: 1, max_scale: 10, is_required: true },
          { id: "satisfaction_growth", question_text: "Oportunidades de crescimento profissional", question_type: "escala", min_scale: 1, max_scale: 10, is_required: true },
          { id: "satisfaction_recognition", question_text: "Reconhecimento e valorização", question_type: "escala", min_scale: 1, max_scale: 10, is_required: true },
          { id: "satisfaction_communication", question_text: "Comunicação interna", question_type: "escala", min_scale: 1, max_scale: 10, is_required: true },
          { id: "satisfaction_training", question_text: "Treinamentos e capacitações", question_type: "escala", min_scale: 1, max_scale: 10, is_required: true },
          
          { id: "recommend_company", question_text: "Você recomendaria a Mar Quente para outras pessoas?", question_type: "multipla_escolha", options: ["Sim, com certeza", "Sim, talvez", "Não", "Depende da área/cargo"], is_required: true },
          
          { id: "return_company", question_text: "Você voltaria a trabalhar na Mar Quente no futuro?", question_type: "multipla_escolha", options: ["Sim, com certeza", "Talvez, dependendo das circunstâncias", "Não"], is_required: true },
          
          { id: "positive_points", question_text: "O que você mais gostou na Mar Quente? (pontos positivos)", question_type: "texto_longo", is_required: true },
          { id: "negative_points", question_text: "O que precisa melhorar na Mar Quente? (pontos negativos)", question_type: "texto_longo", is_required: true },
          
          { id: "suggestions", question_text: "Sugestões de melhoria para a empresa", question_type: "texto_longo", is_required: false },
          
          { id: "leadership_feedback", question_text: "Feedback sobre sua liderança direta", question_type: "texto_longo", is_required: false },
          
          { id: "new_company_info", question_text: "Informações sobre nova empresa (opcional)", question_type: "texto_longo", is_required: false },
          
          { id: "additional_comments", question_text: "Comentários adicionais", question_type: "texto_longo", is_required: false },
        ]
      }
    },
    {
      id: "votacao_cipa",
      name: "Votação CIPA",
      description: "Template para eleição dos membros da CIPA",
      icon: Vote,
      color: "from-green-500 to-emerald-600",
      template: {
        title: "Votação CIPA 2025",
        description: "Eleição dos representantes da CIPA - Comissão Interna de Prevenção de Acidentes",
        form_type: "Votação CIPA",
        is_anonymous: true,
        questions: [
          { id: "voter_department", question_text: "Seu Departamento", question_type: "texto_curto", is_required: true },
          { id: "vote_candidate", question_text: "Vote no seu candidato para representante da CIPA", question_type: "multipla_escolha", options: ["Candidato 1 - João Silva", "Candidato 2 - Maria Santos", "Candidato 3 - Pedro Costa", "Candidato 4 - Ana Oliveira"], is_required: true },
        ]
      }
    },
    {
      id: "pesquisa_clima",
      name: "Pesquisa de Clima Organizacional",
      description: "Avaliação do clima e satisfação dos colaboradores",
      icon: MessageSquare,
      color: "from-purple-500 to-pink-600",
      template: {
        title: "Pesquisa de Clima Organizacional",
        description: "Queremos ouvir sua opinião sobre o ambiente de trabalho",
        form_type: "Pesquisa",
        is_anonymous: true,
        questions: [
          { id: "satisfaction_overall", question_text: "Como você avalia sua satisfação geral com a empresa?", question_type: "escala", min_scale: 1, max_scale: 10, is_required: true },
          { id: "satisfaction_leadership", question_text: "Como você avalia a liderança da sua equipe?", question_type: "escala", min_scale: 1, max_scale: 10, is_required: true },
          { id: "satisfaction_benefits", question_text: "Como você avalia os benefícios oferecidos?", question_type: "escala", min_scale: 1, max_scale: 10, is_required: true },
          { id: "satisfaction_environment", question_text: "Como você avalia o ambiente de trabalho?", question_type: "escala", min_scale: 1, max_scale: 10, is_required: true },
          { id: "satisfaction_communication", question_text: "Como você avalia a comunicação interna?", question_type: "escala", min_scale: 1, max_scale: 10, is_required: true },
          { id: "satisfaction_growth", question_text: "Como você avalia as oportunidades de crescimento?", question_type: "escala", min_scale: 1, max_scale: 10, is_required: true },
          { id: "satisfaction_recognition", question_text: "Como você avalia o reconhecimento pelo seu trabalho?", question_type: "escala", min_scale: 1, max_scale: 10, is_required: true },
          { id: "satisfaction_worklife", question_text: "Como você avalia o equilíbrio trabalho-vida pessoal?", question_type: "escala", min_scale: 1, max_scale: 10, is_required: true },
          { id: "improvements", question_text: "Quais melhorias você sugere para a empresa?", question_type: "texto_longo", is_required: false },
          { id: "strengths", question_text: "O que a Mar Quente faz muito bem?", question_type: "texto_longo", is_required: false },
        ]
      }
    },
    {
      id: "quiz_seguranca",
      name: "Quiz de Segurança",
      description: "Quiz sobre normas de segurança do trabalho com pontuação",
      icon: Trophy,
      color: "from-yellow-500 to-orange-600",
      template: {
        title: "Quiz: Segurança no Trabalho",
        description: "Teste seus conhecimentos sobre segurança e ganhe pontos!",
        form_type: "Quiz",
        is_anonymous: false,
        show_correct_answers: true,
        passing_score: 70, // Percentage
        questions: [
          { 
            id: "q1", 
            question_text: "Qual a cor da sinalização de emergência?", 
            question_type: "multipla_escolha", 
            options: ["Vermelho", "Azul", "Verde", "Amarelo"], 
            correct_answer: "Vermelho",
            points: 10,
            is_required: true 
          },
          { 
            id: "q2", 
            question_text: "O uso de EPI é obrigatório em todas as áreas de risco?", 
            question_type: "multipla_escolha", 
            options: ["Sim", "Não", "Apenas em algumas áreas", "Depende do supervisor"], 
            correct_answer: "Sim",
            points: 10,
            is_required: true 
          },
          { 
            id: "q3", 
            question_text: "Quantos metros deve ter a distância mínima de um extintor de incêndio?", 
            question_type: "multipla_escolha", 
            options: ["10 metros", "15 metros", "20 metros", "25 metros"], 
            correct_answer: "15 metros",
            points: 15,
            is_required: true 
          },
          { 
            id: "q4", 
            question_text: "O que significa a sigla CIPA?", 
            question_type: "multipla_escolha", 
            options: [
              "Comissão Interna de Prevenção de Acidentes", 
              "Comitê Interno de Proteção Ambiental",
              "Comissão Integrada de Processos Administrativos",
              "Centro Interno de Primeiros Atendimentos"
            ], 
            correct_answer: "Comissão Interna de Prevenção de Acidentes",
            points: 15,
            is_required: true 
          }
        ]
      }
    }
  ];

  const handleUseTemplate = async (template) => {
    const now = new Date();
    const endDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 dias padrão

    try {
      await CustomForm.create({
        ...template,
        start_date: now.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        status: "Ativo",
        allow_multiple_responses: false,
        show_results: false,
        created_by: user?.email // Track creator
      });
      
      alert("Formulário criado com sucesso a partir do template!");
      setShowTemplatesDialog(false);
      await loadData();
    } catch (error) {
      console.error("Erro ao criar formulário:", error);
      alert("Erro ao criar formulário. Tente novamente.");
    }
  };

  const getFormTypeIcon = (type) => {
    switch (type) {
      case 'Votação CIPA': return '🗳️';
      case 'Pesquisa': return '📊';
      case 'Enquete': return '📋';
      case 'Avaliação': return '⭐';
      case 'Quiz': return '🧠'; // New icon for Quiz
      default: return '📝';
    }
  };

  const getStatusClasses = (form) => {
    const now = new Date();
    const start = new Date(form.start_date);
    const end = new Date(form.end_date);

    if (hasResponded(form.id)) {
      return { bg: 'bg-green-500/10', text: 'text-green-700', border: 'border-green-500/20', label: 'Respondido' };
    } else if (now < start) {
      return { bg: 'bg-blue-500/10', text: 'text-blue-700', border: 'border-blue-500/20', label: 'Em Breve' };
    } else if (now > end) {
      return { bg: 'bg-slate-500/10', text: 'text-slate-700', border: 'border-slate-500/20', label: 'Encerrado' };
    } else {
      return { bg: 'bg-yellow-500/10', text: 'text-yellow-700', border: 'border-yellow-500/20', label: 'Aberto' };
    }
  };

  const renderQuestion = (question) => {
    switch (question.question_type) {
      case 'texto_curto':
        return (
          <Input
            value={formAnswers[question.id] || ''}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            className="glass-input"
            placeholder="Digite sua resposta"
          />
        );

      case 'texto_longo':
        return (
          <Textarea
            value={formAnswers[question.id] || ''}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            className="glass-textarea"
            placeholder="Digite sua resposta"
            rows={4}
          />
        );

      case 'multipla_escolha':
        return (
          <div className="space-y-2">
            {question.options?.map((option, index) => (
              <label key={index} className="flex items-center gap-3 p-3 glass-card rounded-lg cursor-pointer hover:scale-105 transition-all">
                <input
                  type="radio"
                  name={question.id}
                  value={option}
                  checked={formAnswers[question.id] === option}
                  onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                  className="w-4 h-4"
                />
                <span className="glass-text">{option}</span>
              </label>
            ))}
          </div>
        );

      case 'caixas_selecao':
        return (
          <div className="space-y-2">
            {question.options?.map((option, index) => (
              <label key={index} className="flex items-center gap-3 p-3 glass-card rounded-lg cursor-pointer hover:scale-105 transition-all">
                <input
                  type="checkbox"
                  value={option}
                  checked={(formAnswers[question.id] || []).includes(option)}
                  onChange={(e) => {
                    const currentValues = formAnswers[question.id] || [];
                    if (e.target.checked) {
                      handleAnswerChange(question.id, [...currentValues, option]);
                    } else {
                      handleAnswerChange(question.id, currentValues.filter(v => v !== option));
                    }
                  }}
                  className="w-4 h-4"
                />
                <span className="glass-text">{option}</span>
              </label>
            ))}
          </div>
        );

      case 'escala':
        return (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="glass-text-muted">{question.min_scale || 1}</span>
              <span className="glass-text-muted">{question.max_scale || 10}</span>
            </div>
            <input
              type="range"
              min={question.min_scale || 1}
              max={question.max_scale || 10}
              value={formAnswers[question.id] || question.min_scale || 1}
              onChange={(e) => handleAnswerChange(question.id, parseInt(e.target.value))}
              className="w-full"
            />
            <div className="text-center">
              <span className="text-2xl font-bold glass-text">{formAnswers[question.id] || question.min_scale || 1}</span>
            </div>
          </div>
        );

      case 'data':
        return (
          <Input
            type="date"
            value={formAnswers[question.id] || ''}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            className="glass-input"
          />
        );

      case 'hora':
        return (
          <Input
            type="time"
            value={formAnswers[question.id] || ''}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            className="glass-input"
          />
        );

      case 'email':
        return (
          <Input
            type="email"
            value={formAnswers[question.id] || ''}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            className="glass-input"
            placeholder="seu@email.com"
          />
        );

      default:
        return null;
    }
  };

  const isAdminOrHR = user && (user.role === 'admin' || user.department === 'RH');

  // If it's an external access via public link, render only the form
  if (isExternalUser && selectedForm) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-3xl">
          <div className="glass-card p-6 md:p-8 rounded-3xl">
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg mb-4">
                <FileText className="w-8 h-8 text-white" />
              </div>
              <div className="flex items-center justify-center gap-3 mb-2">
                <span className="text-4xl">{getFormTypeIcon(selectedForm.form_type)}</span>
                <Badge variant="outline" className="glass-text">{selectedForm.form_type}</Badge>
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">{selectedForm.title}</h2>
              <p className="text-gray-700 font-semibold">{selectedForm.description}</p>
              
              {selectedForm.is_anonymous && (
                <div className="info-box mt-4">
                  <div className="info-box-title">✅ Resposta Anônima</div>
                  <p className="info-box-text">Suas respostas serão totalmente anônimas.</p>
                </div>
              )}
            </div>

            <div className="space-y-6">
              {selectedForm.questions?.map((question, index) => (
                <div key={question.id} className="glass-card p-5 rounded-xl">
                  <div className="mb-3">
                    <Label className="glass-label">
                      {index + 1}. {question.question_text}
                      {question.is_required && <span className="text-red-500 ml-1">*</span>}
                    </Label>
                  </div>
                  {renderQuestion(question)}
                </div>
              ))}
            </div>

            <div className="flex flex-col md:flex-row justify-center gap-3 pt-6 mt-6 border-t border-gray-200">
              <Button
                onClick={handleSubmitForm}
                disabled={isSubmitting}
                className="glass-button-primary w-full md:w-auto"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  'Enviar Respostas'
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-card p-6 md:p-8 rounded-3xl">
        <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
          <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0">
            <FileText className="w-6 h-6 md:w-8 md:h-8 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl md:text-3xl font-bold glass-text truncate">Formulários e Pesquisas</h1>
            <p className="glass-text-muted text-sm md:text-lg">Votações CIPA, pesquisas de clima e muito mais</p>
          </div>
          
          {isAdminOrHR && (
            <Button 
              onClick={() => setShowTemplatesDialog(true)}
              className="glass-button-primary w-full md:w-auto"
            >
              <Plus className="w-5 h-5 mr-2" />
              Criar Formulário
            </Button>
          )}
        </div>

        {isAdminOrHR && (
          <div className="info-box mt-4">
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb className="w-5 h-5 text-blue-600 flex-shrink-0" />
              <span className="info-box-title">Área Administrativa</span>
            </div>
            <p className="info-box-text">
              Como RH/Admin, você pode criar formulários customizados, gerar links públicos para respostas externas e ver relatórios completos com tabulação.
            </p>
          </div>
        )}

        {user && ( // Only show stats if user is authenticated
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="glass-card p-4 rounded-xl text-center">
              <div className="text-2xl font-bold glass-text">{forms.length}</div>
              <div className="glass-text-muted text-sm">Formulários Disponíveis</div>
            </div>
            <div className="glass-card p-4 rounded-xl text-center">
              <div className="text-2xl font-bold glass-text">{myResponses.length}</div>
              <div className="glass-text-muted text-sm">Respondidos por Você</div>
            </div>
            <div className="glass-card p-4 rounded-xl text-center">
              <div className="text-2xl font-bold glass-text">
                {forms.filter(f => !hasResponded(f.id)).length}
              </div>
              <div className="glass-text-muted text-sm">Aguardando Resposta</div>
            </div>
          </div>
        )}
      </div>

      {/* Lista de Formulários */}
      {user && ( // Only show form list if user is authenticated
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {forms.map((form) => {
            const statusClasses = getStatusClasses(form);
            const canRespond = !hasResponded(form.id) && new Date() <= new Date(form.end_date) && new Date() >= new Date(form.start_date);
            const formResponses = allResponses.filter(r => r.form_id === form.id); // Filter responses for this specific form
            const isOwner = form.created_by === user?.email;

            return (
              <div key={form.id} className="glass-card p-5 md:p-6 rounded-2xl">
                <div className="flex items-start justify-between mb-4">
                  <div className="text-3xl md:text-4xl">{getFormTypeIcon(form.form_type)}</div>
                  <div className="flex items-center gap-2">
                    <Badge className={`${statusClasses.bg} ${statusClasses.text} ${statusClasses.border} font-semibold text-xs`}>
                      {statusClasses.label}
                    </Badge>
                  </div>
                </div>

                <h3 className="text-lg md:text-xl font-bold glass-text mb-2 line-clamp-2">{form.title}</h3>
                <p className="glass-text-muted text-sm mb-4 line-clamp-2">{form.description}</p>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm glass-text-muted">
                    <Calendar className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">
                      {format(new Date(form.start_date), "dd/MM/yy", { locale: ptBR })} - {format(new Date(form.end_date), "dd/MM/yy", { locale: ptBR })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm glass-text-muted">
                    <FileText className="w-4 h-4 flex-shrink-0" />
                    <span>{form.questions?.length || 0} perguntas</span>
                  </div>
                  {form.is_anonymous && (
                    <div className="flex items-center gap-2 text-sm text-green-600 font-semibold">
                      <CheckCircle className="w-4 h-4 flex-shrink-0" />
                      <span>Anônimo</span>
                    </div>
                  )}
                  {form.allow_external_responses && (
                    <div className="flex items-center gap-2 text-sm text-purple-600 font-semibold">
                      <Link2 className="w-4 h-4 flex-shrink-0" />
                      <span>Link público ativo</span>
                    </div>
                  )}
                  {isAdminOrHR && (
                    <div className="flex items-center gap-2 text-sm text-purple-600 font-semibold">
                      <Users className="w-4 h-4 flex-shrink-0" />
                      <span>{formResponses.length} respostas</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Button
                    onClick={() => handleOpenForm(form)}
                    disabled={!canRespond}
                    className={canRespond ? "w-full glass-button-primary" : "w-full glass-button opacity-50 cursor-not-allowed"}
                  >
                    {hasResponded(form.id) ? (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Já Respondido
                      </>
                    ) : (
                      <>
                        <Eye className="w-4 h-4 mr-2" />
                        Responder
                      </>
                    )}
                  </Button>

                  {isAdminOrHR && (
                    <>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleOpenReport(form)}
                          variant="outline"
                          className="flex-1 glass-button text-xs"
                          disabled={formResponses.length === 0}
                        >
                          <BarChart className="w-3 h-3 mr-1" />
                          Relatório
                        </Button>
                        <Button
                          onClick={() => generatePublicLink(form.id)}
                          variant="outline"
                          className="flex-1 glass-button text-xs"
                        >
                          {copiedLink ? (
                            <>
                              <Check className="w-3 h-3 mr-1" />
                              Copiado!
                            </>
                          ) : (
                            <>
                              <Link2 className="w-3 h-3 mr-1" />
                              Link
                            </>
                          )}
                        </Button>
                      </div>
                      
                      {(isOwner || user?.role === 'admin') && (
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleEditForm(form)}
                            variant="outline"
                            className="flex-1 glass-button text-xs"
                          >
                            <Pencil className="w-3 h-3 mr-1" />
                            Editar
                          </Button>
                          <Button
                            onClick={() => handleDeleteForm(form.id)}
                            variant="outline"
                            className="flex-1 glass-button text-xs text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="w-3 h-3 mr-1" />
                            Excluir
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {user && forms.length === 0 && (
        <div className="text-center py-12 md:py-16 glass-card rounded-2xl">
          <FileText className="w-16 h-16 md:w-20 md:h-20 glass-text-muted mx-auto mb-4 opacity-50" />
          <h3 className="text-xl md:text-2xl font-bold glass-text mb-2">Nenhum formulário disponível</h3>
          <p className="glass-text-muted">Não há formulários ou pesquisas abertas no momento.</p>
        </div>
      )}

      {/* Modal de Templates (Admin/RH) */}
      {isAdminOrHR && (
        <Dialog open={showTemplatesDialog} onOpenChange={setShowTemplatesDialog}>
          <DialogContent className="glass-modal max-w-4xl p-0 max-h-[90vh] overflow-y-auto">
            <div className="p-6 md:p-8">
              <DialogHeader className="mb-6">
                <h2 className="modal-title">Templates de Formulários</h2>
                <p className="modal-description">
                  Escolha um template pronto para criar rapidamente seu formulário
                </p>
              </DialogHeader>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {formTemplates.map((template) => {
                  const Icon = template.icon;
                  return (
                    <div key={template.id} className="glass-card p-5 md:p-6 rounded-2xl hover:scale-105 transition-all">
                      <div className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center bg-gradient-to-r ${template.color} shadow-lg mb-4`}>
                        <Icon className="w-7 h-7 md:w-8 md:h-8 text-white" />
                      </div>
                      <h3 className="text-lg md:text-xl font-bold glass-text mb-2">{template.name}</h3>
                      <p className="glass-text-muted text-sm mb-4 line-clamp-3">{template.description}</p>
                      <Button
                        onClick={() => handleUseTemplate(template.template)}
                        className="w-full glass-button-primary"
                      >
                        Usar Template
                      </Button>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-gray-200">
                <Button
                  variant="ghost"
                  onClick={() => setShowTemplatesDialog(false)}
                  className="glass-button-secondary"
                >
                  Fechar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Modal de Formulário */}
      <Dialog open={showFormDialog && !isExternalUser} onOpenChange={setShowFormDialog}>
        <DialogContent className="glass-modal max-w-3xl p-0 max-h-[90vh] overflow-y-auto">
          {selectedForm && (
            <div className="p-6 md:p-8">
              <DialogHeader className="mb-6 modal-header-mobile">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-3xl md:text-4xl">{getFormTypeIcon(selectedForm.form_type)}</span>
                  <Badge variant="outline" className="glass-text">{selectedForm.form_type}</Badge>
                </div>
                <h2 className="modal-title">{selectedForm.title}</h2>
                <p className="modal-description">{selectedForm.description}</p>
                {selectedForm.is_anonymous && (
                  <div className="info-box mt-4">
                    <div className="info-box-title">✅ Resposta Anônima</div>
                    <p className="info-box-text">Suas respostas serão totalmente anônimas e não serão vinculadas ao seu nome.</p>
                  </div>
                )}
                {selectedForm.form_type === 'Quiz' && (
                  <div className="info-box mt-4">
                    <div className="info-box-title">🏆 Quiz</div>
                    <p className="info-box-text">Responda corretamente para ganhar pontos! Você precisa de {selectedForm.passing_score}% para passar.</p>
                  </div>
                )}
              </DialogHeader>

              <div className="space-y-5 md:space-y-6">
                {selectedForm.questions?.map((question, index) => (
                  <div key={question.id} className="glass-card p-4 md:p-5 rounded-xl">
                    <div className="mb-3">
                      <Label className="glass-label">
                        {index + 1}. {question.question_text}
                        {question.is_required && <span className="text-red-500 ml-1">*</span>}
                        {selectedForm.form_type === 'Quiz' && question.points > 0 && (
                          <span className="ml-2 text-sm font-semibold text-purple-600">({question.points} pontos)</span>
                        )}
                      </Label>
                    </div>
                    {renderQuestion(question)}
                  </div>
                ))}
              </div>

              <div className="flex flex-col md:flex-row justify-end gap-3 pt-6 mt-6 border-t border-gray-200 modal-footer-mobile">
                <Button 
                  variant="ghost" 
                  onClick={() => setShowFormDialog(false)} 
                  className="glass-button-secondary mobile-button w-full md:w-auto"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleSubmitForm}
                  disabled={isSubmitting}
                  className="glass-button-primary mobile-button w-full md:w-auto"
                >
                  {isSubmitting ? 'Enviando...' : 'Enviar Respostas'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* NOVO: Modal de Resultados do Quiz */}
      {quizResults && (
        <Dialog open={!!quizResults} onOpenChange={() => setQuizResults(null)}>
          <DialogContent className="glass-modal max-w-2xl p-0 max-h-[90vh] overflow-y-auto">
            <div className="p-6 md:p-8">
              <div className="text-center mb-6">
                <div className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center mb-4 ${
                  quizResults.passed ? 'bg-gradient-to-r from-green-400 to-emerald-500' : 'bg-gradient-to-r from-orange-400 to-red-500'
                } shadow-lg`}>
                  {quizResults.passed ? (
                    <Trophy className="w-12 h-12 text-white" />
                  ) : (
                    <Target className="w-12 h-12 text-white" />
                  )}
                </div>
                
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  {quizResults.passed ? '🎉 Parabéns!' : '📚 Continue Estudando!'}
                </h2>
                
                <p className="text-lg text-gray-700 font-semibold mb-6">
                  {quizResults.passed 
                    ? `Você passou no quiz e ganhou ${quizResults.score} pontos!` 
                    : `Você não atingiu a pontuação mínima de ${selectedForm?.passing_score}% desta vez. Sua pontuação foi ${quizResults.percentage}%.`}
                </p>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="glass-card p-4 rounded-xl">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Award className="w-5 h-5 text-yellow-600" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{quizResults.score}</div>
                    <div className="text-xs text-gray-600 font-semibold">Pontos Ganhos</div>
                  </div>

                  <div className="glass-card p-4 rounded-xl">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Zap className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{quizResults.totalPoints}</div>
                    <div className="text-xs text-gray-600 font-semibold">Total Possível</div>
                  </div>

                  <div className="glass-card p-4 rounded-xl">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{quizResults.totalCorrect}/{quizResults.totalQuestions}</div>
                    <div className="text-xs text-gray-600 font-semibold">Acertos</div>
                  </div>

                  <div className="glass-card p-4 rounded-xl">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Target className="w-5 h-5 text-purple-600" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{quizResults.percentage}%</div>
                    <div className="text-xs text-gray-600 font-semibold">Aproveitamento</div>
                  </div>
                </div>

                {selectedForm?.show_correct_answers && (
                  <div className="text-left space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
                    <h3 className="font-bold text-gray-900 text-lg mb-3">📝 Respostas:</h3>
                    {selectedForm.questions.map((question, index) => {
                      const response = quizResults.responses.find(r => r.question_id === question.id);
                      return (
                        <div key={question.id} className={`glass-card p-4 rounded-xl ${
                          response?.is_correct ? 'bg-green-50 border-2 border-green-300' : 'bg-red-50 border-2 border-red-300'
                        }`}>
                          <div className="flex items-start gap-2 mb-2">
                            {response?.is_correct ? (
                              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                            ) : (
                              <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                            )}
                            <div className="flex-1">
                              <p className="font-bold text-gray-900 text-sm mb-1">
                                {index + 1}. {question.question_text}
                              </p>
                              <p className="text-sm text-gray-700">
                                <span className="font-semibold">Sua resposta:</span> {Array.isArray(response?.answer) ? response.answer.join(', ') : (response?.answer || 'Não respondida')}
                              </p>
                              {!response?.is_correct && question.correct_answer && (
                                <p className="text-sm text-green-700 mt-1">
                                  <span className="font-semibold">Resposta correta:</span> {Array.isArray(question.correct_answer) ? question.correct_answer.join(', ') : question.correct_answer}
                                </p>
                              )}
                              {question.points > 0 && (
                                <p className={`text-sm font-bold mt-1 ${response?.is_correct ? 'text-green-700' : 'text-red-700'}`}>
                                  {response?.is_correct ? `+${question.points} pontos ✨` : `0 pontos`}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="flex justify-center gap-3 pt-6 border-t border-gray-200">
                <Button
                  onClick={() => setQuizResults(null)}
                  className="glass-button-primary"
                >
                  Fechar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* NOVO: Modal de Relatório */}
      {isAdminOrHR && reportForm && (
        <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
          <DialogContent className="glass-modal max-w-5xl p-0 max-h-[90vh] overflow-y-auto">
            <div className="p-6 md:p-8">
              <DialogHeader className="mb-6">
                <h2 className="modal-title">📊 Relatório: {reportForm.title}</h2>
                <p className="modal-description">
                  Tabulação completa das respostas recebidas
                </p>
              </DialogHeader>

              {(() => {
                const { totalResponses, results } = calculateReportData(reportForm);
                
                return (
                  <div className="space-y-6">
                    {/* Summary */}
                    <div className="glass-card p-5 rounded-xl bg-blue-50/50">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                          <Users className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <div className="text-3xl font-bold text-gray-900">{totalResponses}</div>
                          <div className="text-gray-700 font-semibold">Total de Respostas</div>
                        </div>
                      </div>
                      {reportForm.form_type === 'Quiz' && (
                        <div className="mt-4 info-box">
                          <div className="info-box-title">Pontuações do Quiz</div>
                          <p className="info-box-text">Pontuação mínima para passar: {reportForm.passing_score}%</p>
                          {/* Could add average score, pass rate here if calculated */}
                        </div>
                      )}
                    </div>

                    {/* Questions Results */}
                    {results.map((result, index) => (
                      <div key={index} className="glass-card p-5 rounded-xl">
                        <h3 className="font-bold text-gray-900 mb-4 text-lg">
                          {index + 1}. {result.question_text}
                        </h3>
                        <div className="text-sm text-gray-600 mb-3 font-semibold">
                          {result.total_responses} {result.total_responses === 1 ? 'resposta' : 'respostas'}
                        </div>

                        {result.question_type === 'escala' && (
                          <div className="space-y-4">
                            <div className="grid grid-cols-3 gap-4 text-center">
                              <div className="glass p-3 rounded-lg">
                                <div className="text-sm text-gray-600 font-semibold">Média</div>
                                <div className="text-2xl font-bold text-blue-600">{result.average}</div>
                              </div>
                              <div className="glass p-3 rounded-lg">
                                <div className="text-sm text-gray-600 font-semibold">Mínima</div>
                                <div className="text-2xl font-bold text-red-600">{result.min}</div>
                              </div>
                              <div className="glass p-3 rounded-lg">
                                <div className="text-sm text-gray-600 font-semibold">Máxima</div>
                                <div className="text-2xl font-bold text-green-600">{result.max}</div>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <div className="font-semibold text-gray-900 text-sm mb-2">Distribuição:</div>
                              {Object.entries(result.distribution).sort(([a], [b]) => parseInt(a) - parseInt(b)).map(([value, count]) => {
                                const percentage = result.total_responses > 0 ? ((count / result.total_responses) * 100).toFixed(1) : 0;
                                return (
                                  <div key={value} className="flex items-center gap-3">
                                    <span className="w-8 text-sm font-bold text-gray-900">{value}</span>
                                    <div className="flex-1 h-8 bg-gray-200 rounded-full overflow-hidden">
                                      <div 
                                        className="h-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-end pr-2"
                                        style={{ width: `${percentage}%` }}
                                      >
                                        <span className="text-white text-xs font-bold">{percentage}%</span>
                                      </div>
                                    </div>
                                    <span className="w-12 text-sm font-semibold text-gray-700">{count}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {(result.question_type === 'multipla_escolha' || result.question_type === 'caixas_selecao') && (
                          <div className="space-y-2">
                            {Object.entries(result.distribution).map(([option, count]) => {
                              const percentage = result.total_responses > 0 ? ((count / result.total_responses) * 100).toFixed(1) : 0;
                              return (
                                <div key={option} className="flex items-center gap-3">
                                  <div className="flex-1">
                                    <div className="text-sm font-semibold text-gray-900 mb-1">{option}</div>
                                    <div className="h-6 bg-gray-200 rounded-full overflow-hidden">
                                      <div 
                                        className="h-full bg-gradient-to-r from-green-500 to-teal-600 flex items-center justify-end pr-2"
                                        style={{ width: `${percentage}%` }}
                                      >
                                        <span className="text-white text-xs font-bold">{percentage}%</span>
                                      </div>
                                    </div>
                                  </div>
                                  <span className="w-16 text-sm font-semibold text-gray-700">{count} respostas</span>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {(result.question_type === 'texto_curto' || result.question_type === 'texto_longo' || result.question_type === 'data' || result.question_type === 'hora' || result.question_type === 'email') && (
                          <div className="space-y-3 max-h-64 overflow-y-auto custom-scrollbar">
                            {result.answers.length > 0 ? (
                              result.answers.map((answer, idx) => (
                                <div key={idx} className="glass p-3 rounded-lg">
                                  <p className="text-gray-900 text-sm whitespace-pre-wrap">{answer}</p>
                                </div>
                              ))
                            ) : (
                              <div className="text-gray-500 text-sm italic">Nenhuma resposta de texto.</div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                );
              })()}

              <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-gray-200">
                <Button
                  variant="ghost"
                  onClick={() => setShowReportDialog(false)}
                  className="glass-button-secondary"
                >
                  Fechar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* NOVO: Modal de Edição de Formulário */}
      {isAdminOrHR && editingForm && (
        <Dialog open={showEditDialog} onOnOpenChange={setShowEditDialog}>
          <DialogContent className="glass-modal max-w-4xl p-0 max-h-[90vh] overflow-y-auto">
            <div className="p-6 md:p-8">
              <DialogHeader className="mb-6">
                <h2 className="modal-title">✏️ Editar Formulário</h2>
                <p className="modal-description">Modifique o formulário e suas perguntas</p>
              </DialogHeader>

              <div className="space-y-5">
                <div>
                  <Label className="glass-label">Título do Formulário</Label>
                  <Input
                    value={editingForm.title}
                    onChange={(e) => setEditingForm(prev => ({...prev, title: e.target.value}))}
                    className="glass-input"
                  />
                </div>

                <div>
                  <Label className="glass-label">Descrição</Label>
                  <Textarea
                    value={editingForm.description}
                    onChange={(e) => setEditingForm(prev => ({...prev, description: e.target.value}))}
                    className="glass-textarea"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="glass-label">Data de Início</Label>
                    <Input
                      type="date"
                      value={editingForm.start_date}
                      onChange={(e) => setEditingForm(prev => ({...prev, start_date: e.target.value}))}
                      className="glass-input"
                    />
                  </div>
                  <div>
                    <Label className="glass-label">Data de Término</Label>
                    <Input
                      type="date"
                      value={editingForm.end_date}
                      onChange={(e) => setEditingForm(prev => ({...prev, end_date: e.target.value}))}
                      className="glass-input"
                    />
                  </div>
                </div>

                {editingForm.form_type === 'Quiz' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="glass-label">Pontuação para Aprovação (%)</Label>
                      <Input
                        type="number"
                        value={editingForm.passing_score || ''}
                        onChange={(e) => setEditingForm(prev => ({...prev, passing_score: parseInt(e.target.value)}))}
                        className="glass-input"
                        placeholder="Ex: 70"
                      />
                    </div>
                    <div className="flex items-center">
                      <label className="flex items-center gap-2 p-2 glass rounded-lg cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editingForm.show_correct_answers}
                          onChange={(e) => setEditingForm(prev => ({...prev, show_correct_answers: e.target.checked}))}
                          className="w-4 h-4"
                        />
                        <span className="text-gray-900 text-sm font-semibold">Mostrar respostas corretas após o quiz</span>
                      </label>
                    </div>
                  </div>
                )}

                <div className="glass-card p-5 rounded-xl">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-gray-900">Perguntas ({editingForm.questions?.length || 0})</h3>
                    <Button
                      type="button"
                      onClick={addQuestion}
                      className="glass-button-primary text-sm"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Adicionar Pergunta
                    </Button>
                  </div>

                  <div className="space-y-4">
                    {editingForm.questions?.map((question, index) => (
                      <div key={question.id} className="glass p-4 rounded-xl border-2 border-gray-200">
                        <div className="flex items-start justify-between mb-3">
                          <span className="font-bold text-gray-900">Pergunta {index + 1}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeQuestion(question.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>

                        <div className="space-y-3">
                          <div>
                            <Label className="text-gray-900 text-xs font-bold">Texto da Pergunta</Label>
                            <Input
                              value={question.question_text}
                              onChange={(e) => updateQuestion(question.id, 'question_text', e.target.value)}
                              className="glass-input mt-1"
                              placeholder="Digite a pergunta..."
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label className="text-gray-900 text-xs font-bold">Tipo de Resposta</Label>
                              <Select
                                value={question.question_type}
                                onValueChange={(value) => updateQuestion(question.id, 'question_type', value)}
                              >
                                <SelectTrigger className="glass-select mt-1">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="texto_curto">Texto Curto</SelectItem>
                                  <SelectItem value="texto_longo">Texto Longo</SelectItem>
                                  <SelectItem value="multipla_escolha">Múltipla Escolha</SelectItem>
                                  <SelectItem value="caixas_selecao">Caixas de Seleção</SelectItem>
                                  <SelectItem value="escala">Escala (1-10)</SelectItem>
                                  <SelectItem value="data">Data</SelectItem>
                                  <SelectItem value="hora">Hora</SelectItem>
                                  <SelectItem value="email">Email</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="flex items-end">
                              <label className="flex items-center gap-2 p-2 glass rounded-lg cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={question.is_required}
                                  onChange={(e) => updateQuestion(question.id, 'is_required', e.target.checked)}
                                  className="w-4 h-4"
                                />
                                <span className="text-gray-900 text-sm font-semibold">Obrigatória</span>
                              </label>
                            </div>
                          </div>

                          {(question.question_type === 'multipla_escolha' || question.question_type === 'caixas_selecao') && (
                            <div>
                              <Label className="text-gray-900 text-xs font-bold">Opções (uma por linha)</Label>
                              <Textarea
                                value={(question.options || []).join('\n')}
                                onChange={(e) => updateQuestion(question.id, 'options', e.target.value.split('\n').filter(o => o.trim()))}
                                className="glass-input mt-1"
                                rows={4}
                                placeholder="Opção 1&#10;Opção 2&#10;Opção 3"
                              />
                            </div>
                          )}

                          {question.question_type === 'escala' && (
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <Label className="text-gray-900 text-xs font-bold">Mínimo</Label>
                                <Input
                                  type="number"
                                  value={question.min_scale || 1}
                                  onChange={(e) => updateQuestion(question.id, 'min_scale', parseInt(e.target.value))}
                                  className="glass-input mt-1"
                                />
                              </div>
                              <div>
                                <Label className="text-gray-900 text-xs font-bold">Máximo</Label>
                                <Input
                                  type="number"
                                  value={question.max_scale || 10}
                                  onChange={(e) => updateQuestion(question.id, 'max_scale', parseInt(e.target.value))}
                                  className="glass-input mt-1"
                                />
                              </div>
                            </div>
                          )}

                          {editingForm.form_type === 'Quiz' && (question.question_type === 'multipla_escolha' || question.question_type === 'caixas_selecao' || question.question_type === 'texto_curto') && (
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <Label className="text-gray-900 text-xs font-bold">Resposta Correta</Label>
                                {question.question_type === 'caixas_selecao' ? (
                                  <Textarea
                                    value={(question.correct_answer || []).join('\n')}
                                    onChange={(e) => updateQuestion(question.id, 'correct_answer', e.target.value.split('\n').filter(o => o.trim()))}
                                    className="glass-input mt-1"
                                    rows={2}
                                    placeholder="Uma opção por linha"
                                  />
                                ) : (
                                  <Input
                                    value={question.correct_answer || ''}
                                    onChange={(e) => updateQuestion(question.id, 'correct_answer', e.target.value)}
                                    className="glass-input mt-1"
                                    placeholder="Digite a resposta correta"
                                  />
                                )}
                              </div>
                              <div>
                                <Label className="text-gray-900 text-xs font-bold">Pontos</Label>
                                <Input
                                  type="number"
                                  value={question.points || 0}
                                  onChange={(e) => updateQuestion(question.id, 'points', parseInt(e.target.value))}
                                  className="glass-input mt-1"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}

                    {editingForm.questions?.length === 0 && (
                      <div className="text-center py-8 glass rounded-xl">
                        <FileText className="w-12 h-12 mx-auto mb-3 opacity-50 text-gray-500" />
                        <p className="text-gray-600 font-semibold">Nenhuma pergunta adicionada</p>
                        <p className="text-gray-500 text-sm mt-1">Clique em "Adicionar Pergunta" para começar</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-gray-200">
                <Button
                  variant="ghost"
                  onClick={() => setShowEditDialog(false)}
                  className="glass-button-secondary"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleUpdateForm}
                  className="glass-button-primary"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Salvar Alterações
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}