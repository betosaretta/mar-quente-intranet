import React, { useState, useEffect } from "react";
import { HRRequest } from "@/entities/HRRequest";
import { User } from "@/entities/User";
import { base44 } from "@/api/base44Client";
import DependentsManager from "../components/hrforms/DependentsManager";
import {
  FileText,
  Plus,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Search,
  Eye,
  Loader2,
  Paperclip
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DialogTrigger } from "@radix-ui/react-dialog";

export default function HRRequests() {
  const [requests, setRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [user, setUser] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [showNewRequestDialog, setShowNewRequestDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("Todos");
  const [selectedCategory, setSelectedCategory] = useState("Todas");
  const [uploadingFile, setUploadingFile] = useState(false);
  const [newRequest, setNewRequest] = useState({
    title: "",
    description: "",
    category: "",
    priority: "Normal",
    due_date: "",
    attachment_url: "",
    form_data: {}
  });

  // Filtrar categorias baseado no nível de acesso
  const isLeader = user && (user.role === 'admin' || user.department === 'RH' || (user.team_members && user.team_members.length > 0));
  
  const allCategories = [
    "Todas",
    "Acidente de Trabalho",
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
    "Solicitação Vaga Temporária",
    "Protocolo Atestado",
    "Protocolo Entrega Documentos",
    "Autorização Hora Extra",
    "Adesão Plano Odontológico",
    "Requisição Uniforme",
    "Solicitação 2ª Via Cartões",
    "Cancelamento Plano Médico",
    "Cancelamento Adiantamento Salarial",
    "Alteração Vale Transporte",
    "Solicitação 2ª Via Crachá",
    "Downgrade Plano Odontológico",
    "Cancelamento Plano Odontológico",
    "Adesão Plano Saúde",
    "Outros"
  ];

  // Remover "Solicitação Desligamento" se não for líder
  const categories = isLeader ? allCategories : allCategories.filter(cat => cat !== "Solicitação Desligamento");

  const statuses = ["Todos", "Pendente", "Em Análise", "Aprovado", "Rejeitado", "Concluído"];
  const priorities = ["Baixa", "Normal", "Alta", "Urgente"];

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    let filtered = requests;

    if (searchTerm) {
      filtered = filtered.filter(request =>
        request.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedStatus !== "Todos") {
      filtered = filtered.filter(request => request.status === selectedStatus);
    }

    if (selectedCategory !== "Todas") {
      filtered = filtered.filter(request => request.category === selectedCategory);
    }

    setFilteredRequests(filtered);
  }, [requests, searchTerm, selectedStatus, selectedCategory]);

  const loadData = async () => {
    try {
      const currentUser = await User.me();
      setUser(currentUser);

      const [requestsData, usersData] = await Promise.all([
        base44.entities.HRRequest.list('-created_date'),
        User.list()
      ]);

      // Filtrar solicitações baseado no nível de acesso
      let visibleRequests = requestsData;

      // Admin e RH veem tudo
      if (currentUser.role === 'admin' || currentUser.department === 'RH') {
        visibleRequests = requestsData;
      }
      // Líderes veem: próprias + da equipe + com visibility_level adequado
      else if (currentUser.team_members && currentUser.team_members.length > 0) {
        visibleRequests = requestsData.filter(req => {
          // Próprias solicitações
          if (req.created_by === currentUser.email) return true;
          
          // Solicitações da equipe
          if (currentUser.team_members.includes(req.created_by)) return true;
          
          // Solicitações com visibilidade para líderes
          if (req.visibility_level === 'lider_rh_admin' || req.visibility_level === 'todos') return true;
          
          return false;
        });
      }
      // Usuários comuns veem apenas as próprias
      else {
        visibleRequests = requestsData.filter(req => req.created_by === currentUser.email);
      }

      setRequests(visibleRequests);
      setAllUsers(usersData);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    }
  };

  const handleCategoryChange = (category) => {
    setNewRequest(prev => ({
      ...prev,
      category: category,
      form_data: {},
      title: getDefaultTitle(category),
      description: "",
      attachment_url: ""
    }));
  };

  const getDefaultTitle = (category) => {
    const titles = {
      "Acidente de Trabalho": "Registro de Acidente de Trabalho - URGENTE",
      "Avaliação Experiência 45 dias": "Avaliação de Experiência - 45 dias",
      "Avaliação Experiência 90 dias": "Avaliação de Experiência - 90 dias",
      "Alteração Cargo/Salário": "Solicitação de Alteração de Cargo/Salário",
      "Entrevista Gestor": "Entrevista do Gestor",
      "Solicitação Desligamento": "Solicitação de Desligamento",
      "Solicitação Vaga": "Solicitação de Vaga",
      "Solicitação Vaga Temporária": "Solicitação de Vaga Temporária",
      "Protocolo Atestado": "Protocolo de Entrega de Atestado",
      "Protocolo Entrega Documentos": "Protocolo de Entrega de Documentos ao RH",
      "Autorização Hora Extra": "Autorização de Hora Extra",
      "Adesão Plano Odontológico": "Adesão ao Seguro Porto Odonto",
      "Requisição Uniforme": "Requisição de Uniforme - Fábrica",
      "Solicitação 2ª Via Cartões": "Solicitação de 2ª Via de Cartões",
      "Cancelamento Plano Médico": "Cancelamento de Convênio Médico",
      "Cancelamento Adiantamento Salarial": "Cancelamento do Adiantamento Salarial",
      "Alteração Vale Transporte": "Alteração de Vale Transporte",
      "Solicitação 2ª Via Crachá": "Solicitação de 2ª Via de Crachá",
      "Downgrade Plano Odontológico": "Downgrade de Convênio Odontológico",
      "Cancelamento Plano Odontológico": "Cancelamento de Convênio Odontológico",
      "Adesão Plano Saúde": "Adesão ao Plano de Saúde Porto Seguro"
    };
    return titles[category] || "";
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingFile(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setNewRequest(prev => ({ ...prev, attachment_url: file_url }));
    } catch (error) {
      console.error("Erro ao fazer upload:", error);
      alert("Erro ao enviar arquivo. Tente novamente.");
    } finally {
      setUploadingFile(false);
    }
  };

  const handleSubmitRequest = async () => {
    if (!newRequest.category) {
      alert("Por favor, selecione uma categoria.");
      return;
    }

    try {
      // Definir nível de visibilidade baseado na categoria
      let visibilityLevel = "proprio"; // Padrão: apenas o criador vê
      let assignedTo = null;
      let priorityLevel = newRequest.priority || "Normal";
      
      // Categorias que líderes e RH podem ver
      const leaderVisibleCategories = [
        "Solicitação Desligamento",
        "Alteração Cargo/Salário",
        "Avaliação Experiência 45 dias",
        "Avaliação Experiência 90 dias",
        "Entrevista Gestor",
        "Autorização Hora Extra"
      ];
      
      // Categorias que todos podem ver
      const publicCategories = [
        "Protocolo Atestado",
        "Protocolo Entrega Documentos",
        "Acidente de Trabalho"
      ];
      
      if (publicCategories.includes(newRequest.category)) {
        visibilityLevel = "todos";
      } else if (leaderVisibleCategories.includes(newRequest.category)) {
        visibilityLevel = "lider_rh_admin";
      }

      // Acidente de Trabalho - atribuir automaticamente para Segurança do Trabalho
      if (newRequest.category === "Acidente de Trabalho") {
        const safetyUsers = allUsers.filter(u => u.department === 'Segurança do Trabalho');
        if (safetyUsers.length > 0) {
          assignedTo = safetyUsers[0].email;
        }
        priorityLevel = "Urgente"; // Forçar prioridade urgente
      }

      const requestData = {
        ...newRequest,
        description: newRequest.description || JSON.stringify(newRequest.form_data, null, 2),
        visibility_level: visibilityLevel,
        assigned_to: assignedTo,
        priority: priorityLevel
      };

      const createdRequest = await HRRequest.create(requestData);

      // Se for solicitação de desligamento, criar tarefa automática para o RH
      if (newRequest.category === "Solicitação Desligamento") {
        const rhUsers = allUsers.filter(u => u.department === 'RH');
        if (rhUsers.length > 0) {
          await base44.entities.Task.create({
            title: `Enviar Pesquisa de Desligamento - ${newRequest.form_data.employee_name || 'Colaborador'}`,
            description: `Enviar formulário de pesquisa de desligamento para o colaborador relacionado à solicitação #${createdRequest.id}`,
            category: "Desligamento",
            status: "Pendente",
            priority: "Alta",
            assigned_to: rhUsers[0].email,
            related_entity_type: "HRRequest",
            related_entity_id: createdRequest.id,
            due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
          });
        }
      }

      setNewRequest({
        title: "",
        description: "",
        category: "",
        priority: "Normal",
        due_date: "",
        attachment_url: "",
        form_data: {}
      });
      setShowNewRequestDialog(false);
      await loadData();
    } catch (error) {
      console.error("Erro ao criar solicitação:", error);
      alert("Erro ao criar solicitação. Tente novamente.");
    }
  };

  const updateFormData = (field, value) => {
    setNewRequest(prev => ({
      ...prev,
      form_data: {
        ...prev.form_data,
        [field]: value
      }
    }));
  };

  const renderFormFields = () => {
    const { category } = newRequest;

    // Formulário: Acidente de Trabalho - URGENTE
    if (category === "Acidente de Trabalho") {
      return (
        <div className="space-y-5">
          <div className="glass-card p-5 rounded-xl border-2 border-red-500 bg-red-50">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-8 h-8 text-red-600" />
              <div>
                <h3 className="font-bold text-red-900 text-lg">⚠️ PROTOCOLO DE EMERGÊNCIA</h3>
                <p className="text-sm text-red-800 font-semibold">Preencha todos os dados com máxima urgência. Esta solicitação será direcionada à Segurança do Trabalho.</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="glass-label">Nome do Acidentado *</Label>
              <Input
                value={newRequest.form_data.victim_name || ''}
                onChange={(e) => updateFormData('victim_name', e.target.value)}
                className="glass-input"
              />
            </div>
            <div>
              <Label className="glass-label">Cargo/Função *</Label>
              <Input
                value={newRequest.form_data.position || ''}
                onChange={(e) => updateFormData('position', e.target.value)}
                className="glass-input"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="glass-label">Data do Acidente *</Label>
              <Input
                type="date"
                value={newRequest.form_data.accident_date || ''}
                onChange={(e) => updateFormData('accident_date', e.target.value)}
                className="glass-input"
              />
            </div>
            <div>
              <Label className="glass-label">Hora do Acidente *</Label>
              <Input
                type="time"
                value={newRequest.form_data.accident_time || ''}
                onChange={(e) => updateFormData('accident_time', e.target.value)}
                className="glass-input"
              />
            </div>
            <div>
              <Label className="glass-label">Local Exato *</Label>
              <Input
                value={newRequest.form_data.location || ''}
                onChange={(e) => updateFormData('location', e.target.value)}
                className="glass-input"
                placeholder="Ex: Setor de produção, linha 3"
              />
            </div>
          </div>

          <div>
            <Label className="glass-label">Tipo de Acidente *</Label>
            <Select
              value={newRequest.form_data.accident_type || ''}
              onValueChange={(value) => updateFormData('accident_type', value)}
            >
              <SelectTrigger className="glass-select">
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Típico">Típico (durante o trabalho)</SelectItem>
                <SelectItem value="Trajeto">Trajeto (ida/volta do trabalho)</SelectItem>
                <SelectItem value="Doença Ocupacional">Doença Ocupacional</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="glass-label">Descrição Detalhada do Acidente *</Label>
            <Textarea
              value={newRequest.form_data.accident_description || ''}
              onChange={(e) => updateFormData('accident_description', e.target.value)}
              className="glass-textarea"
              rows={5}
              placeholder="Descreva como o acidente ocorreu, o que a vítima estava fazendo, quais equipamentos estavam envolvidos..."
            />
          </div>

          <div>
            <Label className="glass-label">Parte do Corpo Afetada *</Label>
            <Select
              value={newRequest.form_data.body_part || ''}
              onValueChange={(value) => updateFormData('body_part', value)}
            >
              <SelectTrigger className="glass-select">
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Cabeça">Cabeça</SelectItem>
                <SelectItem value="Olhos">Olhos</SelectItem>
                <SelectItem value="Ouvidos">Ouvidos</SelectItem>
                <SelectItem value="Pescoço">Pescoço</SelectItem>
                <SelectItem value="Braço">Braço</SelectItem>
                <SelectItem value="Mão">Mão</SelectItem>
                <SelectItem value="Dedos">Dedos</SelectItem>
                <SelectItem value="Tronco">Tronco</SelectItem>
                <SelectItem value="Perna">Perna</SelectItem>
                <SelectItem value="Pé">Pé</SelectItem>
                <SelectItem value="Coluna">Coluna</SelectItem>
                <SelectItem value="Múltiplas partes">Múltiplas partes</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="glass-label">Gravidade do Acidente *</Label>
            <Select
              value={newRequest.form_data.severity || ''}
              onValueChange={(value) => updateFormData('severity', value)}
            >
              <SelectTrigger className="glass-select">
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Leve">Leve (sem afastamento)</SelectItem>
                <SelectItem value="Moderado">Moderado (afastamento até 15 dias)</SelectItem>
                <SelectItem value="Grave">Grave (afastamento acima de 15 dias)</SelectItem>
                <SelectItem value="Fatal">Fatal</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="glass-label">Houve Afastamento? *</Label>
              <Select
                value={newRequest.form_data.had_leave || ''}
                onValueChange={(value) => updateFormData('had_leave', value)}
              >
                <SelectTrigger className="glass-select">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Sim">Sim</SelectItem>
                  <SelectItem value="Não">Não</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {newRequest.form_data.had_leave === 'Sim' && (
              <div>
                <Label className="glass-label">Dias de Afastamento</Label>
                <Input
                  type="number"
                  value={newRequest.form_data.leave_days || ''}
                  onChange={(e) => updateFormData('leave_days', e.target.value)}
                  className="glass-input"
                  placeholder="Ex: 5"
                />
              </div>
            )}
          </div>

          <div>
            <Label className="glass-label">Estava Usando EPI? *</Label>
            <Select
              value={newRequest.form_data.using_epi || ''}
              onValueChange={(value) => updateFormData('using_epi', value)}
            >
              <SelectTrigger className="glass-select">
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Sim, todos necessários">Sim, todos os EPIs necessários</SelectItem>
                <SelectItem value="Parcialmente">Parcialmente</SelectItem>
                <SelectItem value="Não">Não estava usando EPI</SelectItem>
                <SelectItem value="Não aplicável">Não aplicável</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="glass-label">Testemunhas</Label>
            <Textarea
              value={newRequest.form_data.witnesses || ''}
              onChange={(e) => updateFormData('witnesses', e.target.value)}
              className="glass-textarea"
              rows={3}
              placeholder="Nome e cargo das testemunhas que presenciaram o acidente"
            />
          </div>

          <div>
            <Label className="glass-label">Primeiros Socorros Prestados *</Label>
            <Textarea
              value={newRequest.form_data.first_aid || ''}
              onChange={(e) => updateFormData('first_aid', e.target.value)}
              className="glass-textarea"
              rows={3}
              placeholder="Descreva os primeiros socorros prestados, quem prestou, se foi chamada ambulância..."
            />
            </div>

          <div>
            <Label className="glass-label">Gestor Imediato Comunicado *</Label>
            <Input
              value={newRequest.form_data.manager_notified || ''}
              onChange={(e) => updateFormData('manager_notified', e.target.value)}
              className="glass-input"
              placeholder="Nome do gestor que foi comunicado"
            />
          </div>

          <div className="glass-card p-5 rounded-xl border-2 border-orange-500 bg-orange-50">
            <h3 className="font-bold text-orange-900 mb-3">📋 Prazos Legais Obrigatórios</h3>
            <div className="space-y-2 text-sm text-orange-800 font-semibold">
              <p>• CAT (Comunicação de Acidente de Trabalho): até o 1º dia útil após o acidente</p>
              <p>• Investigação completa: até 48 horas após o acidente</p>
              <p>• Relatório final: até 7 dias após o acidente</p>
              <p>• Esta solicitação será PRIORIDADE MÁXIMA para a Segurança do Trabalho</p>
            </div>
          </div>
        </div>
      );
    }

    // Formulário: Avaliação Experiência 45 dias - COMPLETO COM TODOS OS CAMPOS
    if (category === "Avaliação Experiência 45 dias") {
      return (
        <div className="space-y-5">
          {/* Dados do Funcionário */}
          <div className="glass-card p-5 rounded-xl">
            <h3 className="font-bold glass-text mb-4">Dados do Funcionário</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="glass-label">Nome do Funcionário</Label>
                <Input
                  value={newRequest.form_data.employee_name || ''}
                  onChange={(e) => updateFormData('employee_name', e.target.value)}
                  className="glass-input"
                />
              </div>
              <div>
                <Label className="glass-label">Cargo</Label>
                <Input
                  value={newRequest.form_data.position || ''}
                  onChange={(e) => updateFormData('position', e.target.value)}
                  className="glass-input"
                />
              </div>
              <div>
                <Label className="glass-label">Setor</Label>
                <Input
                  value={newRequest.form_data.sector || ''}
                  onChange={(e) => updateFormData('sector', e.target.value)}
                  className="glass-input"
                />
              </div>
              <div>
                <Label className="glass-label">Data de Admissão</Label>
                <Input
                  type="date"
                  value={newRequest.form_data.admission_date || ''}
                  onChange={(e) => updateFormData('admission_date', e.target.value)}
                  className="glass-input"
                />
              </div>
              <div>
                <Label className="glass-label">Venc. 1ª Experiência (45 dias)</Label>
                <Input
                  type="date"
                  value={newRequest.form_data.experience_end_date || ''}
                  onChange={(e) => updateFormData('experience_end_date', e.target.value)}
                  className="glass-input"
                />
              </div>
            </div>
          </div>

          {/* COMPORTAMENTOS */}
          <div className="glass-card p-5 rounded-xl">
            <h3 className="font-bold glass-text mb-4">COMPORTAMENTOS</h3>
            <div className="space-y-3">
              {[
                { id: 'initiative', text: '1. Apresenta iniciativa no desempenho de suas funções' },
                { id: 'posture', text: '2. Tem boa postura' },
                { id: 'relationship', text: '3. Apresenta bom relacionamento com os colegas' },
                { id: 'commitment', text: '4. Demonstra comprometimento com o trabalho' },
                { id: 'punctuality', text: '5. Apresenta pontualidade em relação aos horários' },
                { id: 'orders', text: '6. Cumpre as ordens recebidas' },
                { id: 'critical', text: '7. Possui senso crítico' },
                { id: 'mistakes', text: '8. Admite os erros quando falha' },
                { id: 'motivation', text: '9. Possui motivação para as tarefas diárias' },
                { id: 'flexibility', text: '10. Aceita bem mudanças de planos de trabalho' }
              ].map(item => (
                <div key={item.id} className="flex items-center justify-between p-3 glass rounded-lg">
                  <span className="glass-text text-sm">{item.text}</span>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name={`behavior_${item.id}`}
                        value="Sim"
                        checked={newRequest.form_data[`behavior_${item.id}`] === 'Sim'}
                        onChange={(e) => updateFormData(`behavior_${item.id}`, e.target.value)}
                        className="w-4 h-4"
                      />
                      <span className="glass-text text-sm">Sim</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name={`behavior_${item.id}`}
                        value="Não"
                        checked={newRequest.form_data[`behavior_${item.id}`] === 'Não'}
                        onChange={(e) => updateFormData(`behavior_${item.id}`, e.target.value)}
                        className="w-4 h-4"
                      />
                      <span className="glass-text text-sm">Não</span>
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* APRESENTAÇÃO PESSOAL */}
          <div className="glass-card p-5 rounded-xl">
            <h3 className="font-bold glass-text mb-4">APRESENTAÇÃO PESSOAL</h3>
            <div className="space-y-3">
              {[
                { id: 'adequate', text: '1. Apresenta-se adequadamente ao trabalho' },
                { id: 'organized', text: '2. Mantém limpo e organizado o local de trabalho' }
              ].map(item => (
                <div key={item.id} className="flex items-center justify-between p-3 glass rounded-lg">
                  <span className="glass-text text-sm">{item.text}</span>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name={`presentation_${item.id}`}
                        value="Sim"
                        checked={newRequest.form_data[`presentation_${item.id}`] === 'Sim'}
                        onChange={(e) => updateFormData(`presentation_${item.id}`, e.target.value)}
                        className="w-4 h-4"
                      />
                      <span className="glass-text text-sm">Sim</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name={`presentation_${item.id}`}
                        value="Não"
                        checked={newRequest.form_data[`presentation_${item.id}`] === 'Não'}
                        onChange={(e) => updateFormData(`presentation_${item.id}`, e.target.value)}
                        className="w-4 h-4"
                      />
                      <span className="glass-text text-sm">Não</span>
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* HABILIDADES PROFISSIONAIS */}
          <div className="glass-card p-5 rounded-xl">
            <h3 className="font-bold glass-text mb-4">HABILIDADES PROFISSIONAIS</h3>
            <div className="space-y-3">
              {[
                { id: 'tools', text: '1. Demonstra conhecimento no manuseio das ferramentas de trabalho' },
                { id: 'execution', text: '2. Entende bem as ordens recebidas, executando-as com perfeição' },
                { id: 'planning', text: '3. Planeja as ações diárias de modo a diminuir os processos de retrabalho' },
                { id: 'communication', text: '4. Se faz entender no contato interpessoal (Como é sua comunicação?)' },
                { id: 'service', text: '5. Atende aos clientes de maneira atenciosa' },
                { id: 'learning', text: '6. Busca informações daquilo que desconhece' },
                { id: 'improvement', text: '7. Procura se atualizar de forma a desempenhar melhor suas funções' },
                { id: 'deadlines', text: '8. Cumpre os prazos de execução e entrega dos trabalhos' }
              ].map(item => (
                <div key={item.id} className="flex items-center justify-between p-3 glass rounded-lg">
                  <span className="glass-text text-sm">{item.text}</span>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name={`skills_${item.id}`}
                        value="Sim"
                        checked={newRequest.form_data[`skills_${item.id}`] === 'Sim'}
                        onChange={(e) => updateFormData(`skills_${item.id}`, e.target.value)}
                        className="w-4 h-4"
                      />
                      <span className="glass-text text-sm">Sim</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name={`skills_${item.id}`}
                        value="Não"
                        checked={newRequest.form_data[`skills_${item.id}`] === 'Não'}
                        onChange={(e) => updateFormData(`skills_${item.id}`, e.target.value)}
                        className="w-4 h-4"
                      />
                      <span className="glass-text text-sm">Não</span>
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Resumos */}
          <div>
            <Label className="glass-label">Resumo dos Pontos Fortes</Label>
            <Textarea
              value={newRequest.form_data.strengths || ''}
              onChange={(e) => updateFormData('strengths', e.target.value)}
              className="glass-textarea"
              rows={4}
            />
          </div>

          <div>
            <Label className="glass-label">Resumo dos Pontos Fracos</Label>
            <Textarea
              value={newRequest.form_data.weaknesses || ''}
              onChange={(e) => updateFormData('weaknesses', e.target.value)}
              className="glass-textarea"
              rows={4}
            />
          </div>

          <div>
            <Label className="glass-label">Comentários do Avaliado</Label>
            <Textarea
              value={newRequest.form_data.employee_comments || ''}
              onChange={(e) => updateFormData('employee_comments', e.target.value)}
              className="glass-textarea"
              rows={3}
            />
          </div>

          <div>
            <Label className="glass-label">Parecer de Recursos Humanos</Label>
            <Textarea
              value={newRequest.form_data.hr_opinion || ''}
              onChange={(e) => updateFormData('hr_opinion', e.target.value)}
              className="glass-textarea"
              rows={3}
            />
          </div>

          <div>
            <Label className="glass-label">Decisão RH</Label>
            <Select
              value={newRequest.form_data.decision || ''}
              onValueChange={(value) => updateFormData('decision', value)}
            >
              <SelectTrigger className="glass-select">
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Prorrogar 45 dias">Prorrogar por mais 45 dias do Contrato de Experiência</SelectItem>
                <SelectItem value="Demitir">Demitir nos 45 dias do Contrato de Experiência</SelectItem>
                <SelectItem value="Efetivar">Efetivar o colaborador</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      );
    }

    // Formulário: Avaliação Experiência 90 dias - COMPLETO COM TODOS OS CAMPOS
    if (category === "Avaliação Experiência 90 dias") {
      return (
        <div className="space-y-5">
          {/* Dados do Funcionário */}
          <div className="glass-card p-5 rounded-xl">
            <h3 className="font-bold glass-text mb-4">Dados do Funcionário</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="glass-label">Nome do Funcionário</Label>
                <Input
                  value={newRequest.form_data.employee_name || ''}
                  onChange={(e) => updateFormData('employee_name', e.target.value)}
                  className="glass-input"
                />
              </div>
              <div>
                <Label className="glass-label">Cargo</Label>
                <Input
                  value={newRequest.form_data.position || ''}
                  onChange={(e) => updateFormData('position', e.target.value)}
                  className="glass-input"
                />
              </div>
              <div>
                <Label className="glass-label">Setor</Label>
                <Input
                  value={newRequest.form_data.sector || ''}
                  onChange={(e) => updateFormData('sector', e.target.value)}
                  className="glass-input"
                />
              </div>
              <div>
                <Label className="glass-label">Data de Admissão</Label>
                <Input
                  type="date"
                  value={newRequest.form_data.admission_date || ''}
                  onChange={(e) => updateFormData('admission_date', e.target.value)}
                  className="glass-input"
                />
              </div>
              <div>
                <Label className="glass-label">Venc. 2ª Experiência (90 dias)</Label>
                <Input
                  type="date"
                  value={newRequest.form_data.experience_end_date || ''}
                  onChange={(e) => updateFormData('experience_end_date', e.target.value)}
                  className="glass-input"
                />
              </div>
            </div>
          </div>

          {/* COMPORTAMENTOS */}
          <div className="glass-card p-5 rounded-xl">
            <h3 className="font-bold glass-text mb-4">COMPORTAMENTOS</h3>
            <div className="space-y-3">
              {[
                { id: 'initiative', text: '1. Apresenta iniciativa no desempenho de suas funções' },
                { id: 'posture', text: '2. Tem boa postura' },
                { id: 'relationship', text: '3. Apresenta bom relacionamento com os colegas' },
                { id: 'commitment', text: '4. Demonstra comprometimento com o trabalho' },
                { id: 'punctuality', text: '5. Apresenta pontualidade em relação aos horários' },
                { id: 'orders', text: '6. Cumpre as ordens recebidas' },
                { id: 'critical', text: '7. Possui senso crítico' },
                { id: 'mistakes', text: '8. Admite os erros quando falha' },
                { id: 'motivation', text: '9. Possui motivação para as tarefas diárias' },
                { id: 'flexibility', text: '10. Aceita bem mudanças de planos de trabalho' }
              ].map(item => (
                <div key={item.id} className="flex items-center justify-between p-3 glass rounded-lg">
                  <span className="glass-text text-sm">{item.text}</span>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name={`behavior_${item.id}`}
                        value="Sim"
                        checked={newRequest.form_data[`behavior_${item.id}`] === 'Sim'}
                        onChange={(e) => updateFormData(`behavior_${item.id}`, e.target.value)}
                        className="w-4 h-4"
                      />
                      <span className="glass-text text-sm">Sim</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name={`behavior_${item.id}`}
                        value="Não"
                        checked={newRequest.form_data[`behavior_${item.id}`] === 'Não'}
                        onChange={(e) => updateFormData(`behavior_${item.id}`, e.target.value)}
                        className="w-4 h-4"
                      />
                      <span className="glass-text text-sm">Não</span>
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* APRESENTAÇÃO PESSOAL */}
          <div className="glass-card p-5 rounded-xl">
            <h3 className="font-bold glass-text mb-4">APRESENTAÇÃO PESSOAL</h3>
            <div className="space-y-3">
              {[
                { id: 'adequate', text: '1. Apresenta-se adequadamente ao trabalho' },
                { id: 'organized', text: '2. Mantém limpo e organizado o local de trabalho' }
              ].map(item => (
                <div key={item.id} className="flex items-center justify-between p-3 glass rounded-lg">
                  <span className="glass-text text-sm">{item.text}</span>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name={`presentation_${item.id}`}
                        value="Sim"
                        checked={newRequest.form_data[`presentation_${item.id}`] === 'Sim'}
                        onChange={(e) => updateFormData(`presentation_${item.id}`, e.target.value)}
                        className="w-4 h-4"
                      />
                      <span className="glass-text text-sm">Sim</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name={`presentation_${item.id}`}
                        value="Não"
                        checked={newRequest.form_data[`presentation_${item.id}`] === 'Não'}
                        onChange={(e) => updateFormData(`presentation_${item.id}`, e.target.value)}
                        className="w-4 h-4"
                      />
                      <span className="glass-text text-sm">Não</span>
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* HABILIDADES PROFISSIONAIS */}
          <div className="glass-card p-5 rounded-xl">
            <h3 className="font-bold glass-text mb-4">HABILIDADES PROFISSIONAIS</h3>
            <div className="space-y-3">
              {[
                { id: 'tools', text: '1. Demonstra conhecimento no manuseio das ferramentas de trabalho' },
                { id: 'execution', text: '2. Entende bem as ordens recebidas, executando-as com perfeição' },
                { id: 'planning', text: '3. Planeja as ações diárias de modo a diminuir os processos de retrabalho' },
                { id: 'communication', text: '4. Se faz entender no contato interpessoal (Como é sua comunicação?)' },
                { id: 'service', text: '5. Atende aos clientes de maneira atenciosa' },
                { id: 'learning', text: '6. Busca informações daquilo que desconhece' },
                { id: 'improvement', text: '7. Procura se atualizar de forma a desempenhar melhor suas funções' },
                { id: 'deadlines', text: '8. Cumpre os prazos de execução e entrega dos trabalhos' }
              ].map(item => (
                <div key={item.id} className="flex items-center justify-between p-3 glass rounded-lg">
                  <span className="glass-text text-sm">{item.text}</span>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name={`skills_${item.id}`}
                        value="Sim"
                        checked={newRequest.form_data[`skills_${item.id}`] === 'Sim'}
                        onChange={(e) => updateFormData(`skills_${item.id}`, e.target.value)}
                        className="w-4 h-4"
                      />
                      <span className="glass-text text-sm">Sim</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name={`skills_${item.id}`}
                        value="Não"
                        checked={newRequest.form_data[`skills_${item.id}`] === 'Não'}
                        onChange={(e) => updateFormData(`skills_${item.id}`, e.target.value)}
                        className="w-4 h-4"
                      />
                      <span className="glass-text text-sm">Não</span>
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Resumos */}
          <div>
            <Label className="glass-label">Resumo dos Pontos Fortes</Label>
            <Textarea
              value={newRequest.form_data.strengths || ''}
              onChange={(e) => updateFormData('strengths', e.target.value)}
              className="glass-textarea"
              rows={4}
            />
          </div>

          <div>
            <Label className="glass-label">Resumo dos Pontos Fracos</Label>
            <Textarea
              value={newRequest.form_data.weaknesses || ''}
              onChange={(e) => updateFormData('weaknesses', e.target.value)}
              className="glass-textarea"
              rows={4}
            />
          </div>

          <div>
            <Label className="glass-label">Comentários do Avaliado</Label>
            <Textarea
              value={newRequest.form_data.employee_comments || ''}
              onChange={(e) => updateFormData('employee_comments', e.target.value)}
              className="glass-textarea"
              rows={3}
            />
          </div>

          <div>
            <Label className="glass-label">Parecer de Recursos Humanos</Label>
            <Textarea
              value={newRequest.form_data.hr_opinion || ''}
              onChange={(e) => updateFormData('hr_opinion', e.target.value)}
              className="glass-textarea"
              rows={3}
            />
          </div>

          <div>
            <Label className="glass-label">Decisão RH</Label>
            <Select
              value={newRequest.form_data.decision || ''}
              onValueChange={(value) => updateFormData('decision', value)}
            >
              <SelectTrigger className="glass-select">
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Contrato Indeterminado">Seguir para contrato por tempo indeterminado</SelectItem>
                <SelectItem value="Demitir">Demitir após 90 dias do Contrato de Experiência</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      );
    }

    // Formulário: Alteração Cargo/Salário - COMPLETO
    if (category === "Alteração Cargo/Salário") {
      return (
        <div className="space-y-5">
          <div>
            <Label className="glass-label">Gestor/Líder</Label>
            <Input
              value={newRequest.form_data.manager || ''}
              onChange={(e) => updateFormData('manager', e.target.value)}
              className="glass-input"
            />
          </div>

          <div>
            <Label className="glass-label">Empresa</Label>
            <Input
              value={newRequest.form_data.company || ''}
              onChange={(e) => updateFormData('company', e.target.value)}
              className="glass-input"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="glass-label">Colaborador</Label>
              <Select
                value={newRequest.form_data.employee_email || ''}
                onValueChange={(value) => updateFormData('employee_email', value)}
              >
                <SelectTrigger className="glass-select">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {allUsers.map(u => (
                    <SelectItem key={u.id} value={u.email}>
                      {u.full_name} - {u.position}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="glass-label">Setor Atual</Label>
              <Input
                value={newRequest.form_data.current_sector || ''}
                onChange={(e) => updateFormData('current_sector', e.target.value)}
                className="glass-input"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="glass-label">Cargo Atual</Label>
              <Input
                value={newRequest.form_data.current_position || ''}
                onChange={(e) => updateFormData('current_position', e.target.value)}
                className="glass-input"
              />
            </div>
            {(user?.department === 'RH' || user?.department === 'DP' || user?.role === 'admin') && (
              <div>
                <Label className="glass-label">Salário Atual</Label>
                <Input
                  type="number"
                  value={newRequest.form_data.current_salary || ''}
                  onChange={(e) => updateFormData('current_salary', e.target.value)}
                  className="glass-input"
                  placeholder="R$"
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="glass-label">Novo Cargo</Label>
              <Input
                value={newRequest.form_data.new_position || ''}
                onChange={(e) => updateFormData('new_position', e.target.value)}
                className="glass-input"
              />
            </div>
            {(user?.department === 'RH' || user?.department === 'DP' || user?.role === 'admin') && (
              <div>
                <Label className="glass-label">Novo Salário</Label>
                <Input
                  type="number"
                  value={newRequest.form_data.new_salary || ''}
                  onChange={(e) => updateFormData('new_salary', e.target.value)}
                  className="glass-input"
                  placeholder="R$"
                />
              </div>
            )}
            <div>
              <Label className="glass-label">Novo Setor</Label>
              <Input
                value={newRequest.form_data.new_sector || ''}
                onChange={(e) => updateFormData('new_sector', e.target.value)}
                className="glass-input"
              />
            </div>
          </div>

          <div>
            <Label className="glass-label">Descrição da Função</Label>
            <Textarea
              value={newRequest.form_data.function_description || ''}
              onChange={(e) => updateFormData('function_description', e.target.value)}
              className="glass-textarea"
              rows={4}
              placeholder="Descreva as funções e responsabilidades do novo cargo..."
            />
          </div>

          <div>
            <Label className="glass-label">Avaliação e Justificativa para a Alteração</Label>
            <Textarea
              value={newRequest.form_data.justification || ''}
              onChange={(e) => updateFormData('justification', e.target.value)}
              className="glass-textarea"
              rows={4}
              placeholder="Justifique a necessidade da alteração..."
            />
          </div>

          {/* Treinamentos */}
          <div className="glass-card p-5 rounded-xl">
            <h3 className="font-bold glass-text mb-3">Há necessidade de algum tipo de treinamento?</h3>
            <div className="space-y-3">
              <label className="flex items-center gap-3 p-3 glass rounded-lg">
                <input
                  type="checkbox"
                  checked={newRequest.form_data.training_procedure || false}
                  onChange={(e) => updateFormData('training_procedure', e.target.checked)}
                  className="w-4 h-4"
                />
                <span className="glass-text">Novo Procedimento ou Instrução de Trabalho</span>
              </label>
              <label className="flex items-center gap-3 p-3 glass rounded-lg">
                <input
                  type="checkbox"
                  checked={newRequest.form_data.training_norm || false}
                  onChange={(e) => updateFormData('training_norm', e.target.checked)}
                  className="w-4 h-4"
                />
                <span className="glass-text">Nova Norma ou Mudança na Rotina</span>
              </label>
              <label className="flex items-center gap-3 p-3 glass rounded-lg">
                <input
                  type="checkbox"
                  checked={newRequest.form_data.training_professional || false}
                  onChange={(e) => updateFormData('training_professional', e.target.checked)}
                  className="w-4 h-4"
                />
                <span className="glass-text">Aprimoramento profissional</span>
              </label>
              <div>
                <Label className="glass-label">Outros</Label>
                <Input
                  value={newRequest.form_data.training_other || ''}
                  onChange={(e) => updateFormData('training_other', e.target.value)}
                  className="glass-input"
                  placeholder="Especifique outros treinamentos necessários"
                />
              </div>
            </div>
          </div>

          {/* EPI e Riscos - SEGURANÇA DO TRABALHO */}
          <div className="glass-card p-5 rounded-xl border-2 border-orange-500">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Segurança do Trabalho</h3>
                <p className="text-sm text-gray-600">Preenchimento obrigatório pela Segurança do Trabalho</p>
              </div>
            </div>

            {(user?.department === 'Segurança do Trabalho' || user?.role === 'admin') ? (
              <div className="space-y-4">
                <div>
                  <Label className="glass-label">Há necessidade de algum EPI?</Label>
                  <div className="flex gap-4 mt-2">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="epi_needed"
                        value="Sim"
                        checked={newRequest.form_data.epi_needed === 'Sim'}
                        onChange={(e) => updateFormData('epi_needed', e.target.value)}
                        className="w-4 h-4"
                      />
                      <span className="glass-text">Sim</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="epi_needed"
                        value="Não"
                        checked={newRequest.form_data.epi_needed === 'Não'}
                        onChange={(e) => updateFormData('epi_needed', e.target.value)}
                        className="w-4 h-4"
                      />
                      <span className="glass-text">Não</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="epi_needed"
                        value="Não aplicável"
                        checked={newRequest.form_data.epi_needed === 'Não aplicável'}
                        onChange={(e) => updateFormData('epi_needed', e.target.value)}
                        className="w-4 h-4"
                      />
                      <span className="glass-text">Não aplicável</span>
                    </label>
                  </div>
                  {newRequest.form_data.epi_needed === 'Sim' && (
                    <Input
                      value={newRequest.form_data.epi_description || ''}
                      onChange={(e) => updateFormData('epi_description', e.target.value)}
                      className="glass-input mt-3"
                      placeholder="Qual EPI?"
                    />
                  )}
                </div>

                <div>
                  <Label className="glass-label">Mudança de Riscos Ocupacionais?</Label>
                  <div className="flex gap-4 mt-2">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="risk_change"
                        value="Sim"
                        checked={newRequest.form_data.risk_change === 'Sim'}
                        onChange={(e) => updateFormData('risk_change', e.target.value)}
                        className="w-4 h-4"
                      />
                      <span className="glass-text">Sim</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="risk_change"
                        value="Não"
                        checked={newRequest.form_data.risk_change === 'Não'}
                        onChange={(e) => updateFormData('risk_change', e.target.value)}
                        className="w-4 h-4"
                      />
                      <span className="glass-text">Não</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="risk_change"
                        value="Não aplicável"
                        checked={newRequest.form_data.risk_change === 'Não aplicável'}
                        onChange={(e) => updateFormData('risk_change', e.target.value)}
                        className="w-4 h-4"
                      />
                      <span className="glass-text">Não aplicável</span>
                    </label>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-5 text-center">
                <AlertCircle className="w-12 h-12 text-orange-500 mx-auto mb-3" />
                <p className="font-bold text-orange-900 mb-2">Seção Restrita</p>
                <p className="text-sm text-orange-800">
                  Esta seção será preenchida pela equipe de Segurança do Trabalho após análise.
                </p>
              </div>
            )}
          </div>

          <div>
            <Label className="glass-label">Data Inicial no Novo Cargo</Label>
            <Input
              type="date"
              value={newRequest.form_data.start_date || ''}
              onChange={(e) => updateFormData('start_date', e.target.value)}
              className="glass-input"
            />
          </div>
        </div>
      );
    }

    // Formulário: Entrevista Gestor
    if (category === "Entrevista Gestor") {
      return (
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="glass-label">Candidato</Label>
              <Input
                value={newRequest.form_data.candidate_name || ''}
                onChange={(e) => updateFormData('candidate_name', e.target.value)}
                className="glass-input"
              />
            </div>
            <div>
              <Label className="glass-label">Vaga/Cargo</Label>
              <Input
                value={newRequest.form_data.position || ''}
                onChange={(e) => updateFormData('position', e.target.value)}
                className="glass-input"
              />
            </div>
          </div>

          <div>
            <Label className="glass-label">Setor</Label>
            <Input
              value={newRequest.form_data.sector || ''}
              onChange={(e) => updateFormData('sector', e.target.value)}
              className="glass-input"
            />
          </div>

          <div>
            <Label className="glass-label">Avaliação do Gestor</Label>
            <Textarea
              value={newRequest.form_data.evaluation || ''}
              onChange={(e) => updateFormData('evaluation', e.target.value)}
              className="glass-textarea"
              rows={6}
              placeholder="Descreva sua avaliação sobre o candidato..."
            />
          </div>

          <div>
            <Label className="glass-label">Resultado</Label>
            <Select
              value={newRequest.form_data.result || ''}
              onValueChange={(value) => updateFormData('result', value)}
            >
              <SelectTrigger className="glass-select">
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Aprovado">Aprovado</SelectItem>
                <SelectItem value="Reprovado">Reprovado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      );
    }

    // Formulário: Solicitação Desligamento
    if (category === "Solicitação Desligamento") {
      return (
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="glass-label">Colaborador</Label>
              <Select
                value={newRequest.form_data.employee_email || ''}
                onValueChange={(value) => updateFormData('employee_email', value)}
              >
                <SelectTrigger className="glass-select">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {allUsers.map(u => (
                    <SelectItem key={u.id} value={u.email}>
                      {u.full_name} - {u.position}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="glass-label">Cargo</Label>
              <Input
                value={newRequest.form_data.position || ''}
                onChange={(e) => updateFormData('position', e.target.value)}
                className="glass-input"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="glass-label">Data de Admissão</Label>
              <Input
                type="date"
                value={newRequest.form_data.admission_date || ''}
                onChange={(e) => updateFormData('admission_date', e.target.value)}
                className="glass-input"
              />
            </div>
            <div>
              <Label className="glass-label">Gestor Imediato</Label>
              <Input
                value={newRequest.form_data.manager || ''}
                onChange={(e) => updateFormData('manager', e.target.value)}
                className="glass-input"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="glass-label">Tipo de Aviso</Label>
              <Select
                value={newRequest.form_data.notice_type || ''}
                onValueChange={(value) => updateFormData('notice_type', value)}
              >
                <SelectTrigger className="glass-select">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Indenizado">Indenizado</SelectItem>
                  <SelectItem value="Trabalhado">Trabalhado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="glass-label">Possui Faltas/Atrasos?</Label>
              <Input
                value={newRequest.form_data.absences || ''}
                onChange={(e) => updateFormData('absences', e.target.value)}
                className="glass-input"
                placeholder="Descreva..."
              />
            </div>
          </div>

          <div>
            <Label className="glass-label">Justificar a Demissão</Label>
            <Textarea
              value={newRequest.form_data.justification || ''}
              onChange={(e) => updateFormData('justification', e.target.value)}
              className="glass-textarea"
              rows={6}
            />
          </div>

          <div>
            <Label className="glass-label">Solicitar Substituição?</Label>
            <Select
              value={newRequest.form_data.request_replacement || ''}
              onValueChange={(value) => updateFormData('request_replacement', value)}
            >
              <SelectTrigger className="glass-select">
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Sim">Sim</SelectItem>
                <SelectItem value="Não">Não</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      );
    }

    // Formulário: Solicitação Vaga - COMPLETO COM TODOS OS CAMPOS
    if (category === "Solicitação Vaga") {
      return (
        <div className="space-y-5">
          <div>
            <Label className="glass-label">Setor</Label>
            <Input
              value={newRequest.form_data.sector || ''}
              onChange={(e) => updateFormData('sector', e.target.value)}
              className="glass-input"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="glass-label">Tipo de Vaga</Label>
              <Select
                value={newRequest.form_data.vacancy_type || ''}
                onValueChange={(value) => updateFormData('vacancy_type', value)}
              >
                <SelectTrigger className="glass-select">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Substituição">Substituição</SelectItem>
                  <SelectItem value="Nova Vaga">Nova Vaga</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="glass-label">Gestor</Label>
              <Input
                value={newRequest.form_data.manager || ''}
                onChange={(e) => updateFormData('manager', e.target.value)}
                className="glass-input"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="glass-label">Abertura da Vaga</Label>
              <Input
                type="date"
                value={newRequest.form_data.opening_date || ''}
                onChange={(e) => updateFormData('opening_date', e.target.value)}
                className="glass-input"
              />
            </div>
            <div>
              <Label className="glass-label">Fechamento da Vaga</Label>
              <Input
                type="date"
                value={newRequest.form_data.closing_date || ''}
                onChange={(e) => updateFormData('closing_date', e.target.value)}
                className="glass-input"
              />
            </div>
          </div>

          <div>
            <Label className="glass-label">Grau de Instrução Exigido</Label>
            <div className="grid grid-cols-2 gap-3 mt-2">
              {[
                'Ensino Fundamental Completo',
                'Ensino Médio Completo',
                'Ensino Médio Incompleto',
                'Ensino Superior Completo',
                'Ensino Superior Incompleto',
                'Pós Graduação/Especialização'
              ].map(level => (
                <label key={level} className="flex items-center gap-2 p-2 glass rounded-lg">
                  <input
                    type="radio"
                    name="education_level"
                    value={level}
                    checked={newRequest.form_data.education_level === level}
                    onChange={(e) => updateFormData('education_level', e.target.value)}
                    className="w-4 h-4"
                  />
                  <span className="glass-text text-sm">{level}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="glass-label">Idade Exigida</Label>
              <Input
                value={newRequest.form_data.age_requirement || ''}
                onChange={(e) => updateFormData('age_requirement', e.target.value)}
                className="glass-input"
                placeholder="Ex: 18 a 40 anos"
              />
            </div>
            <div>
              <Label className="glass-label">Remuneração</Label>
              <Input
                type="number"
                value={newRequest.form_data.salary || ''}
                onChange={(e) => updateFormData('salary', e.target.value)}
                className="glass-input"
                placeholder="R$"
              />
            </div>
          </div>

          <div>
            <Label className="glass-label">Carga Horária</Label>
            <Input
              value={newRequest.form_data.workload || ''}
              onChange={(e) => updateFormData('workload', e.target.value)}
              className="glass-input"
              placeholder="Ex: 44h semanais"
            />
          </div>

          <div className="glass-card p-5 rounded-xl">
            <h3 className="font-bold glass-text mb-3">Endereço da Organização</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="glass-label">Endereço</Label>
                <Input
                  value={newRequest.form_data.address || ''}
                  onChange={(e) => updateFormData('address', e.target.value)}
                  className="glass-input"
                />
              </div>
              <div>
                <Label className="glass-label">Nº</Label>
                <Input
                  value={newRequest.form_data.number || ''}
                  onChange={(e) => updateFormData('number', e.target.value)}
                  className="glass-input"
                />
              </div>
              <div>
                <Label className="glass-label">Complemento</Label>
                <Input
                  value={newRequest.form_data.complement || ''}
                  onChange={(e) => updateFormData('complement', e.target.value)}
                  className="glass-input"
                />
              </div>
              <div>
                <Label className="glass-label">Bairro</Label>
                <Input
                  value={newRequest.form_data.neighborhood || ''}
                  onChange={(e) => updateFormData('neighborhood', e.target.value)}
                  className="glass-input"
                />
              </div>
              <div>
                <Label className="glass-label">Cidade</Label>
                <Input
                  value={newRequest.form_data.city || ''}
                  onChange={(e) => updateFormData('city', e.target.value)}
                  className="glass-input"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="glass-label">Restrição ao Sexo</Label>
              <div className="flex gap-4 mt-2">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="gender_restriction"
                    value="Feminino"
                    checked={newRequest.form_data.gender_restriction === 'Feminino'}
                    onChange={(e) => updateFormData('gender_restriction', e.target.value)}
                    className="w-4 h-4"
                  />
                  <span className="glass-text">Fem</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="gender_restriction"
                    value="Masculino"
                    checked={newRequest.form_data.gender_restriction === 'Masculino'}
                    onChange={(e) => updateFormData('gender_restriction', e.target.value)}
                    className="w-4 h-4"
                  />
                  <span className="glass-text">Masc</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="gender_restriction"
                    value="Ambos"
                    checked={newRequest.form_data.gender_restriction === 'Ambos'}
                    onChange={(e) => updateFormData('gender_restriction', e.target.value)}
                    className="w-4 h-4"
                  />
                  <span className="glass-text">Ambos</span>
                </label>
              </div>
            </div>
            <div>
              <Label className="glass-label">Tempo de Experiência</Label>
              <Input
                value={newRequest.form_data.experience_time || ''}
                onChange={(e) => updateFormData('experience_time', e.target.value)}
                className="glass-input"
                placeholder="Ex: 2 anos"
              />
            </div>
          </div>

          <div>
            <Label className="glass-label">Atividades das Funções para o Cargo</Label>
            <Textarea
              value={newRequest.form_data.job_activities || ''}
              onChange={(e) => updateFormData('job_activities', e.target.value)}
              className="glass-textarea"
              rows={6}
              placeholder="Descreva as principais atividades (use √ para listar)..."
            />
          </div>

          {/* Conhecimentos Específicos */}
          <div className="glass-card p-5 rounded-xl">
            <h3 className="font-bold glass-text mb-3">Conhecimentos Específicos</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="glass-label">Técnicos</Label>
                <div className="flex gap-4 mt-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="technical_knowledge"
                      value="Sim"
                      checked={newRequest.form_data.technical_knowledge === 'Sim'}
                      onChange={(e) => updateFormData('technical_knowledge', e.target.value)}
                      className="w-4 h-4"
                    />
                    <span className="glass-text text-sm">Sim</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="technical_knowledge"
                      value="Não"
                      checked={newRequest.form_data.technical_knowledge === 'Não'}
                      onChange={(e) => updateFormData('technical_knowledge', e.target.value)}
                      className="w-4 h-4"
                    />
                    <span className="glass-text text-sm">Não</span>
                  </label>
                </div>
              </div>

              <div>
                <Label className="glass-label">Língua Estrangeira</Label>
                <div className="flex gap-4 mt-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="foreign_language"
                      value="Sim"
                      checked={newRequest.form_data.foreign_language === 'Sim'}
                      onChange={(e) => updateFormData('foreign_language', e.target.value)}
                      className="w-4 h-4"
                    />
                    <span className="glass-text text-sm">Sim</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="foreign_language"
                      value="Não"
                      checked={newRequest.form_data.foreign_language === 'Não'}
                      onChange={(e) => updateFormData('foreign_language', e.target.value)}
                      className="w-4 h-4"
                    />
                    <span className="glass-text text-sm">Não</span>
                  </label>
                </div>
              </div>

              <div>
                <Label className="glass-label">Informática</Label>
                <div className="flex gap-4 mt-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="computer_knowledge"
                      value="Sim"
                      checked={newRequest.form_data.computer_knowledge === 'Sim'}
                      onChange={(e) => updateFormData('computer_knowledge', e.target.value)}
                      className="w-4 h-4"
                    />
                    <span className="glass-text text-sm">Sim</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="computer_knowledge"
                      value="Não"
                      checked={newRequest.form_data.computer_knowledge === 'Não'}
                      onChange={(e) => updateFormData('computer_knowledge', e.target.value)}
                      className="w-4 h-4"
                    />
                    <span className="glass-text text-sm">Não</span>
                  </label>
                </div>
              </div>

              <div>
                <Label className="glass-label">Carteira de Habilitação</Label>
                <div className="flex gap-4 mt-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="drivers_license"
                      value="Sim"
                      checked={newRequest.form_data.drivers_license === 'Sim'}
                      onChange={(e) => updateFormData('drivers_license', e.target.value)}
                      className="w-4 h-4"
                    />
                    <span className="glass-text text-sm">Sim</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="drivers_license"
                      value="Não"
                      checked={newRequest.form_data.drivers_license === 'Não'}
                      onChange={(e) => updateFormData('drivers_license', e.target.value)}
                      className="w-4 h-4"
                    />
                    <span className="glass-text text-sm">Não</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="glass-label">Solicitado por</Label>
              <Input
                value={newRequest.form_data.requested_by || ''}
                onChange={(e) => updateFormData('requested_by', e.target.value)}
                className="glass-input"
              />
            </div>
            <div>
              <Label className="glass-label">Contratação de</Label>
              <Input
                value={newRequest.form_data.hiring_of || ''}
                onChange={(e) => updateFormData('hiring_of', e.target.value)}
                className="glass-input"
              />
            </div>
          </div>
        </div>
      );
    }

    // Formulário: Solicitação Vaga Temporária
    if (category === "Solicitação Vaga Temporária") {
      return (
        <div className="space-y-5">
          <div>
            <Label className="glass-label">Setor</Label>
            <Input
              value={newRequest.form_data.sector || ''}
              onChange={(e) => updateFormData('sector', e.target.value)}
              className="glass-input"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="glass-label">Vaga (Cargo)</Label>
              <Input
                value={newRequest.form_data.position || ''}
                onChange={(e) => updateFormData('position', e.target.value)}
                className="glass-input"
              />
            </div>
            <div>
              <Label className="glass-label">Motivo</Label>
              <Input
                value={newRequest.form_data.reason || ''}
                onChange={(e) => updateFormData('reason', e.target.value)}
                className="glass-input"
                placeholder="Ex: Licença maternidade, férias, afastamento..."
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="glass-label">Gestor</Label>
              <Input
                value={newRequest.form_data.manager || ''}
                onChange={(e) => updateFormData('manager', e.target.value)}
                className="glass-input"
              />
            </div>
            <div>
              <Label className="glass-label">Abertura da Vaga</Label>
              <Input
                type="date"
                value={newRequest.form_data.opening_date || ''}
                onChange={(e) => updateFormData('opening_date', e.target.value)}
                className="glass-input"
              />
            </div>
          </div>

          <div>
            <Label className="glass-label">Grau de Instrução Exigido</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
              {[
                'Ensino Fundamental Completo',
                'Ensino Médio Completo',
                'Ensino Médio Incompleto',
                'Ensino Superior Completo',
                'Ensino Superior Incompleto',
                'Pós Graduação/Especialização'
              ].map(level => (
                <label key={level} className="flex items-center gap-2 p-3 glass rounded-lg">
                  <input
                    type="radio"
                    name="education_level"
                    value={level}
                    checked={newRequest.form_data.education_level === level}
                    onChange={(e) => updateFormData('education_level', e.target.value)}
                    className="w-4 h-4"
                  />
                  <span className="glass-text text-sm">{level}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <Label className="glass-label">Tempo de Duração do Contrato</Label>
            <Input
              value={newRequest.form_data.contract_duration || ''}
              onChange={(e) => updateFormData('contract_duration', e.target.value)}
              className="glass-input"
              placeholder="Ex: 3 meses, 6 meses, 90 dias..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="glass-label">Idade Exigida</Label>
              <Input
                value={newRequest.form_data.age_requirement || ''}
                onChange={(e) => updateFormData('age_requirement', e.target.value)}
                className="glass-input"
                placeholder="Ex: 18 a 40 anos"
              />
            </div>
            <div>
              <Label className="glass-label">Remuneração</Label>
              <Input
                type="number"
                value={newRequest.form_data.salary || ''}
                onChange={(e) => updateFormData('salary', e.target.value)}
                className="glass-input"
                placeholder="R$"
              />
            </div>
          </div>

          <div className="glass-card p-5 rounded-xl">
            <h3 className="font-bold glass-text mb-3">Endereço da Organização</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="glass-label">Endereço</Label>
                <Input
                  value={newRequest.form_data.address || ''}
                  onChange={(e) => updateFormData('address', e.target.value)}
                  className="glass-input"
                />
              </div>
              <div>
                <Label className="glass-label">Nº</Label>
                <Input
                  value={newRequest.form_data.number || ''}
                  onChange={(e) => updateFormData('number', e.target.value)}
                  className="glass-input"
                />
              </div>
              <div>
                <Label className="glass-label">Complemento</Label>
                <Input
                  value={newRequest.form_data.complement || ''}
                  onChange={(e) => updateFormData('complement', e.target.value)}
                  className="glass-input"
                />
              </div>
              <div>
                <Label className="glass-label">Bairro</Label>
                <Input
                  value={newRequest.form_data.neighborhood || ''}
                  onChange={(e) => updateFormData('neighborhood', e.target.value)}
                  className="glass-input"
                />
              </div>
              <div>
                <Label className="glass-label">Cidade</Label>
                <Input
                  value={newRequest.form_data.city || ''}
                  onChange={(e) => updateFormData('city', e.target.value)}
                  className="glass-input"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="glass-label">Preferência de Sexo</Label>
              <div className="flex gap-4 mt-2">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="gender_preference"
                    value="Feminino"
                    checked={newRequest.form_data.gender_preference === 'Feminino'}
                    onChange={(e) => updateFormData('gender_preference', e.target.value)}
                    className="w-4 h-4"
                  />
                  <span className="glass-text">Fem</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="gender_preference"
                    value="Masculino"
                    checked={newRequest.form_data.gender_preference === 'Masculino'}
                    onChange={(e) => updateFormData('gender_preference', e.target.value)}
                    className="w-4 h-4"
                  />
                  <span className="glass-text">Masc</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="gender_preference"
                    value="Indiferente"
                    checked={newRequest.form_data.gender_preference === 'Indiferente'}
                    onChange={(e) => updateFormData('gender_preference', e.target.value)}
                    className="w-4 h-4"
                  />
                  <span className="glass-text">Indiferente</span>
                </label>
              </div>
            </div>
            <div>
              <Label className="glass-label">Tempo de Experiência na Função</Label>
              <Input
                value={newRequest.form_data.experience_time || ''}
                onChange={(e) => updateFormData('experience_time', e.target.value)}
                className="glass-input"
                placeholder="Ex: 1 ano, 6 meses..."
              />
            </div>
          </div>

          {/* Conhecimentos Específicos */}
          <div className="glass-card p-5 rounded-xl">
            <h3 className="font-bold glass-text mb-3">Conhecimentos Específicos</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="glass-label">Técnicos</Label>
                <div className="flex gap-4 mt-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="technical_knowledge"
                      value="Sim"
                      checked={newRequest.form_data.technical_knowledge === 'Sim'}
                      onChange={(e) => updateFormData('technical_knowledge', e.target.value)}
                      className="w-4 h-4"
                    />
                    <span className="glass-text text-sm">Sim</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="technical_knowledge"
                      value="Não"
                      checked={newRequest.form_data.technical_knowledge === 'Não'}
                      onChange={(e) => updateFormData('technical_knowledge', e.target.value)}
                      className="w-4 h-4"
                    />
                    <span className="glass-text text-sm">Não</span>
                  </label>
                </div>
              </div>

              <div>
                <Label className="glass-label">Língua Estrangeira</Label>
                <div className="flex gap-4 mt-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="foreign_language"
                      value="Sim"
                      checked={newRequest.form_data.foreign_language === 'Sim'}
                      onChange={(e) => updateFormData('foreign_language', e.target.value)}
                      className="w-4 h-4"
                    />
                    <span className="glass-text text-sm">Sim</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="foreign_language"
                      value="Não"
                      checked={newRequest.form_data.foreign_language === 'Não'}
                      onChange={(e) => updateFormData('foreign_language', e.target.value)}
                      className="w-4 h-4"
                    />
                    <span className="glass-text text-sm">Não</span>
                  </label>
                </div>
              </div>

              <div>
                <Label className="glass-label">Informática</Label>
                <div className="flex gap-4 mt-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="computer_knowledge"
                      value="Sim"
                      checked={newRequest.form_data.computer_knowledge === 'Sim'}
                      onChange={(e) => updateFormData('computer_knowledge', e.target.value)}
                      className="w-4 h-4"
                    />
                    <span className="glass-text text-sm">Sim</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="computer_knowledge"
                      value="Não"
                      checked={newRequest.form_data.computer_knowledge === 'Não'}
                      onChange={(e) => updateFormData('computer_knowledge', e.target.value)}
                      className="w-4 h-4"
                    />
                    <span className="glass-text text-sm">Não</span>
                  </label>
                </div>
              </div>

              <div>
                <Label className="glass-label">Carteira de Habilitação</Label>
                <div className="flex gap-4 mt-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="drivers_license"
                      value="Sim"
                      checked={newRequest.form_data.drivers_license === 'Sim'}
                      onChange={(e) => updateFormData('drivers_license', e.target.value)}
                      className="w-4 h-4"
                    />
                    <span className="glass-text text-sm">Sim</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="drivers_license"
                      value="Não"
                      checked={newRequest.form_data.drivers_license === 'Não'}
                      onChange={(e) => updateFormData('drivers_license', e.target.value)}
                      className="w-4 h-4"
                    />
                    <span className="glass-text text-sm">Não</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div>
            <Label className="glass-label">Atividades das Funções para o Cargo</Label>
            <Textarea
              value={newRequest.form_data.job_activities || ''}
              onChange={(e) => updateFormData('job_activities', e.target.value)}
              className="glass-textarea"
              rows={6}
              placeholder="* Atividade 1&#10;* Atividade 2&#10;* Atividade 3..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="glass-label">Solicitado por</Label>
              <Input
                value={newRequest.form_data.requested_by || ''}
                onChange={(e) => updateFormData('requested_by', e.target.value)}
                className="glass-input"
              />
            </div>
            <div>
              <Label className="glass-label">Candidato Aprovado</Label>
              <Input
                value={newRequest.form_data.approved_candidate || ''}
                onChange={(e) => updateFormData('approved_candidate', e.target.value)}
                className="glass-input"
                placeholder="Nome do candidato após aprovação"
              />
            </div>
          </div>
        </div>
      );
    }

    // Formulário: Protocolo Atestado
    if (category === "Protocolo Atestado") {
      return (
        <div className="space-y-5">
          <div>
            <Label className="glass-label">Tipo de Protocolo</Label>
            <Select
              value={newRequest.form_data.protocol_type || ''}
              onValueChange={(value) => updateFormData('protocol_type', value)}
            >
              <SelectTrigger className="glass-select">
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Protocolo de Atestado">Protocolo de Atestado</SelectItem>
                <SelectItem value="Protocolo de Horas">Protocolo de Horas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="glass-label">Nome do Colaborador</Label>
              <Input
                value={newRequest.form_data.employee_name || ''}
                onChange={(e) => updateFormData('employee_name', e.target.value)}
                className="glass-input"
              />
            </div>
            <div>
              <Label className="glass-label">Tipo de Documento</Label>
              <Select
                value={newRequest.form_data.document_type || ''}
                onValueChange={(value) => updateFormData('document_type', value)}
              >
                <SelectTrigger className="glass-select">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Atestado">Atestado</SelectItem>
                  <SelectItem value="Declaração">Declaração</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="glass-label">Data do Atestado</Label>
              <Input
                type="date"
                value={newRequest.form_data.document_date || ''}
                onChange={(e) => updateFormData('document_date', e.target.value)}
                className="glass-input"
              />
            </div>
            <div>
              <Label className="glass-label">Recebido Por</Label>
              <Input
                value={newRequest.form_data.received_by || ''}
                onChange={(e) => updateFormData('received_by', e.target.value)}
                className="glass-input"
              />
            </div>
          </div>

          <div>
            <Label className="glass-label">Setor</Label>
            <Input
              value={newRequest.form_data.sector || ''}
              onChange={(e) => updateFormData('sector', e.target.value)}
              className="glass-input"
            />
          </div>

          <div>
            <Label className="glass-label">Observações</Label>
            <Textarea
              value={newRequest.form_data.notes || ''}
              onChange={(e) => updateFormData('notes', e.target.value)}
              className="glass-textarea"
              rows={3}
            />
          </div>
        </div>
      );
    }

    // NOVO: Formulário - Protocolo Entrega Documentos
    if (category === "Protocolo Entrega Documentos") {
      const documents = newRequest.form_data.documents || [];

      const addDocument = () => {
        const newDocs = [...documents, {
          employee_name: '',
          document_type: '',
          delivery_date: '',
          received_by: '',
          confirmed: false
        }];
        updateFormData('documents', newDocs);
      };

      const removeDocument = (index) => {
        const newDocs = documents.filter((_, i) => i !== index);
        updateFormData('documents', newDocs);
      };

      const updateDocument = (index, field, value) => {
        const newDocs = [...documents];
        newDocs[index][field] = value;
        updateFormData('documents', newDocs);
      };

      return (
        <div className="space-y-5">
          <div>
            <Label className="glass-label">Setor</Label>
            <Input
              value={newRequest.form_data.sector || ''}
              onChange={(e) => updateFormData('sector', e.target.value)}
              className="glass-input"
            />
          </div>

          <div className="glass-card p-5 rounded-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold glass-text">Lista de Documentos Entregues</h3>
              <Button
                type="button"
                onClick={addDocument}
                className="glass-button-primary text-sm"
              >
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Documento
              </Button>
            </div>

            {documents.length === 0 ? (
              <div className="text-center py-8 glass rounded-xl">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-50 text-gray-500" />
                <p className="text-gray-600 font-semibold">Nenhum documento adicionado</p>
                <p className="text-gray-500 text-sm mt-1">Clique em "Adicionar Documento" para começar</p>
              </div>
            ) : (
              <div className="space-y-4">
                {documents.map((doc, index) => (
                  <div key={index} className="glass p-4 rounded-xl border-2 border-gray-200">
                    <div className="flex items-start justify-between mb-3">
                      <span className="font-bold text-gray-900 text-sm">Documento {index + 1}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeDocument(index)}
                        className="text-red-600 hover:bg-red-50"
                      >
                        <XCircle className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <Label className="glass-label glass-text text-xs font-bold">Nome do Colaborador</Label>
                        <Input
                          value={doc.employee_name}
                          onChange={(e) => updateDocument(index, 'employee_name', e.target.value)}
                          className="glass-input mt-1"
                          placeholder="Nome completo"
                        />
                      </div>
                      <div>
                        <Label className="glass-label glass-text text-xs font-bold">Tipo de Documento</Label>
                        <Select
                          value={doc.document_type}
                          onValueChange={(value) => updateDocument(index, 'document_type', value)}
                        >
                          <SelectTrigger className="glass-select mt-1">
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="RG">RG</SelectItem>
                            <SelectItem value="CPF">CPF</SelectItem>
                            <SelectItem value="Carteira de Trabalho">Carteira de Trabalho</SelectItem>
                            <SelectItem value="Comprovante de Residência">Comprovante de Residência</SelectItem>
                            <SelectItem value="Título de Eleitor">Título de Eleitor</SelectItem>
                            <SelectItem value="Certificado Militar">Certificado Militar</SelectItem>
                            <SelectItem value="Certidão de Nascimento">Certidão de Nascimento</SelectItem>
                            <SelectItem value="Certidão de Casamento">Certidão de Casamento</SelectItem>
                            <SelectItem value="Diploma/Certificado">Diploma/Certificado</SelectItem>
                            <SelectItem value="ASO - Atestado de Saúde">ASO - Atestado de Saúde Ocupacional</SelectItem>
                            <SelectItem value="Foto 3x4">Foto 3x4</SelectItem>
                            <SelectItem value="PIS/PASEP">PIS/PASEP</SelectItem>
                            <SelectItem value="CNH">CNH</SelectItem>
                            <SelectItem value="Outro">Outro</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="glass-label glass-text text-xs font-bold">Data de Entrega</Label>
                        <Input
                          type="date"
                          value={doc.delivery_date}
                          onChange={(e) => updateDocument(index, 'delivery_date', e.target.value)}
                          className="glass-input mt-1"
                        />
                      </div>
                      <div>
                        <Label className="glass-label glass-text text-xs font-bold">Recebido Por</Label>
                        <Input
                          value={doc.received_by}
                          onChange={(e) => updateDocument(index, 'received_by', e.target.value)}
                          className="glass-input mt-1"
                          placeholder="Nome de quem recebeu"
                        />
                      </div>
                    </div>

                    <div className="mt-3">
                      <label className="flex items-center gap-2 p-2 glass rounded-lg cursor-pointer">
                        <input
                          type="checkbox"
                          checked={doc.confirmed}
                          onChange={(e) => updateDocument(index, 'confirmed', e.target.checked)}
                          className="w-4 h-4"
                        />
                        <span className="glass-text text-sm font-semibold">Confirmo recebimento</span>
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <Label className="glass-label">Observações Gerais</Label>
            <Textarea
              value={newRequest.form_data.general_notes || ''}
              onChange={(e) => updateFormData('general_notes', e.target.value)}
              className="glass-textarea"
              rows={3}
              placeholder="Observações adicionais sobre a entrega dos documentos..."
            />
          </div>

          <div className="glass-card p-4 rounded-xl border border-blue-200 bg-blue-50">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-5 h-5 text-blue-600" />
              <span className="font-bold text-blue-800">Declaração</span>
            </div>
            <p className="text-sm text-blue-700">
              "Declaro que recebi e conferi os documentos acima relacionados e assumo a responsabilidade pela guarda dos mesmos."
            </p>
          </div>
        </div>
      );
    }

    // Formulário: Autorização Hora Extra
    if (category === "Autorização Hora Extra") {
      return (
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="glass-label">Departamento Solicitante</Label>
              <Input
                value={newRequest.form_data.department || ''}
                onChange={(e) => updateFormData('department', e.target.value)}
                className="glass-input"
              />
            </div>
            <div>
              <Label className="glass-label">Gestor Solicitante</Label>
              <Input
                value={newRequest.form_data.manager || ''}
                onChange={(e) => updateFormData('manager', e.target.value)}
                className="glass-input"
              />
            </div>
          </div>

          <div>
            <Label className="glass-label">Motivo da Solicitação</Label>
            <Textarea
              value={newRequest.form_data.reason || ''}
              onChange={(e) => updateFormData('reason', e.target.value)}
              className="glass-textarea"
              rows={3}
            />
          </div>

          <div>
            <Label className="glass-label">Refeição</Label>
            <Select
              value={newRequest.form_data.meal || ''}
              onValueChange={(value) => updateFormData('meal', value)}
            >
              <SelectTrigger className="glass-select">
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Sim">Sim</SelectItem>
                <SelectItem value="Não">Não</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="glass-label">Colaborador</Label>
              <Input
                value={newRequest.form_data.employee_name || ''}
                onChange={(e) => updateFormData('employee_name', e.target.value)}
                className="glass-input"
              />
            </div>
            <div>
              <Label className="glass-label">Data da Hora Extra</Label>
              <Input
                type="date"
                value={newRequest.form_data.overtime_date || ''}
                onChange={(e) => updateFormData('overtime_date', e.target.value)}
                className="glass-input"
              />
            </div>
            <div>
              <Label className="glass-label">Horário</Label>
              <Input
                value={newRequest.form_data.schedule || ''}
                onChange={(e) => updateFormData('schedule', e.target.value)}
                className="glass-input"
                placeholder="Ex: 18h às 22h"
              />
            </div>
          </div>
        </div>
      );
    }

    // NOVO: Adesão Plano Odontológico
    if (category === "Adesão Plano Odontológico") {
      return (
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="glass-label">Nome Completo</Label>
              <Input
                value={newRequest.form_data.employee_name || ''}
                onChange={(e) => updateFormData('employee_name', e.target.value)}
                className="glass-input"
              />
            </div>
            <div>
              <Label className="glass-label">CPF</Label>
              <Input
                value={newRequest.form_data.cpf || ''}
                onChange={(e) => updateFormData('cpf', e.target.value)}
                className="glass-input"
                placeholder="000.000.000-00"
              />
            </div>
          </div>

          <div>
            <Label className="glass-label">Opção de Plano Odontológico</Label>
            <div className="space-y-3 mt-2">
              <label className="flex items-start gap-3 p-4 glass-card rounded-xl cursor-pointer hover:scale-105 transition-all">
                <input
                  type="radio"
                  name="dental_plan"
                  value="Bronze - R$ 12,16"
                  checked={newRequest.form_data.dental_plan === 'Bronze - R$ 12,16'}
                  onChange={(e) => updateFormData('dental_plan', e.target.value)}
                  className="w-5 h-5 mt-1"
                />
                <div>
                  <div className="font-bold text-gray-900 mb-1">PLANO BRONZE - R$ 12,16</div>
                  <div className="text-sm text-gray-700">Diagnóstico, Urgência/Emergência, Endodontia, Prevenção, Cirurgia básica</div>
                </div>
              </label>

              <label className="flex items-start gap-3 p-4 glass-card rounded-xl cursor-pointer hover:scale-105 transition-all">
                <input
                  type="radio"
                  name="dental_plan"
                  value="Prata - R$ 60,19"
                  checked={newRequest.form_data.dental_plan === 'Prata - R$ 60,19'}
                  onChange={(e) => updateFormData('dental_plan', e.target.value)}
                  className="w-5 h-5 mt-1"
                />
                <div>
                  <div className="font-bold text-gray-900 mb-1">PLANO PRATA - R$ 60,19</div>
                  <div className="text-sm text-gray-700">Bronze + Prótese Dentária (coroas) + Ortodontia (aparelhos fixos/removíveis)</div>
                  <div className="text-xs text-gray-600 mt-1">* Carência de 120 dias para ortodontia e prótese</div>
                </div>
              </label>

              <label className="flex items-start gap-3 p-4 glass-card rounded-xl cursor-pointer hover:scale-105 transition-all">
                <input
                  type="radio"
                  name="dental_plan"
                  value="Ouro - R$ 67,46"
                  checked={newRequest.form_data.dental_plan === 'Ouro - R$ 67,46'}
                  onChange={(e) => updateFormData('dental_plan', e.target.value)}
                  className="w-5 h-5 mt-1"
                />
                <div>
                  <div className="font-bold text-gray-900 mb-1">PLANO OURO - R$ 67,46</div>
                  <div className="text-sm text-gray-700">Prata + Prótese Total, Faceta em Cerâmica, Núcleo Metálico, Restauração em Cerâmica</div>
                  <div className="text-xs text-gray-600 mt-1">* Carência de 120 dias para ortodontia e prótese</div>
                </div>
              </label>

              <label className="flex items-start gap-3 p-4 glass-card rounded-xl cursor-pointer hover:scale-105 transition-all border-2 border-gray-300">
                <input
                  type="radio"
                  name="dental_plan"
                  value="Não opto"
                  checked={newRequest.form_data.dental_plan === 'Não opto'}
                  onChange={(e) => updateFormData('dental_plan', e.target.value)}
                  className="w-5 h-5 mt-1"
                />
                <div>
                  <div className="font-bold text-gray-900">NÃO OPTO pelo Convênio Odontológico</div>
                </div>
              </label>
            </div>
          </div>

          <DependentsManager
            value={newRequest.form_data.dependents}
            onChange={(deps) => updateFormData('dependents', deps)}
          />

          <div className="glass-card p-4 rounded-xl border border-blue-200 bg-blue-50">
            <p className="text-sm text-blue-700">
              * Declaro estar ciente que para cancelamento do plano apenas após 2 anos de permanência.<br/>
              * Declaro estar ciente que haverá desconto de pro-rata.
            </p>
          </div>
        </div>
      );
    }

    // NOVO: Requisição de Uniforme
    if (category === "Requisição Uniforme") {
      return (
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="glass-label">Nome Completo</Label>
              <Input
                value={newRequest.form_data.employee_name || ''}
                onChange={(e) => updateFormData('employee_name', e.target.value)}
                className="glass-input"
              />
            </div>
            <div>
              <Label className="glass-label">RG</Label>
              <Input
                value={newRequest.form_data.rg || ''}
                onChange={(e) => updateFormData('rg', e.target.value)}
                className="glass-input"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="glass-label">Tamanho</Label>
              <Select
                value={newRequest.form_data.size || ''}
                onValueChange={(value) => updateFormData('size', value)}
              >
                <SelectTrigger className="glass-select">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PP">PP</SelectItem>
                  <SelectItem value="P">P</SelectItem>
                  <SelectItem value="M">M</SelectItem>
                  <SelectItem value="G">G</SelectItem>
                  <SelectItem value="GG">GG</SelectItem>
                  <SelectItem value="XG">XG</SelectItem>
                  <SelectItem value="EG">EG</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="glass-label">Quantidade de Camisetas</Label>
              <Input
                type="number"
                min="1"
                value={newRequest.form_data.quantity || ''}
                onChange={(e) => updateFormData('quantity', e.target.value)}
                className="glass-input"
              />
            </div>
          </div>

          <div className="glass-card p-4 rounded-xl border border-blue-200 bg-blue-50">
            <p className="text-sm text-blue-700">
              <strong>Declaro que:</strong><br/>
              Declaro que ficando responsável pela conservação, higiene e limpeza dos uniformes.
              No caso de perda ou dano por uso inadequado do uniforme, autorizo a empresa a descontar
              do meu salário o valor da reposição ao custo do dia em que ocorrer a substituição dos mesmos.
              Ocorrendo o meu desligamento da empresa, deverei devolver as camisetas de uniforme em
              perfeito estado, observando o desgaste natural decorrente do uso.
            </p>
          </div>
        </div>
      );
    }

    // NOVO: Solicitação 2ª Via Cartões
    if (category === "Solicitação 2ª Via Cartões") {
      return (
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="glass-label">Unidade</Label>
              <Select
                value={newRequest.form_data.unit || ''}
                onValueChange={(value) => updateFormData('unit', value)}
              >
                <SelectTrigger className="glass-select">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Guarulhos">Guarulhos</SelectItem>
                  <SelectItem value="Escritório">Escritório</SelectItem>
                  <SelectItem value="Lojas">Lojas</SelectItem>
                  <SelectItem value="Agrolândia/Joinville">Agrolândia/Joinville</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="glass-label">CPF</Label>
              <Input
                value={newRequest.form_data.cpf || ''}
                onChange={(e) => updateFormData('cpf', e.target.value)}
                className="glass-input"
                placeholder="000.000.000-00"
              />
            </div>
          </div>

          <div>
            <Label className="glass-label">RG</Label>
            <Input
              value={newRequest.form_data.rg || ''}
              onChange={(e) => updateFormData('rg', e.target.value)}
              className="glass-input"
            />
          </div>

          <div className="glass-card p-5 rounded-xl">
            <h3 className="font-bold text-gray-900 mb-4">Cartões Solicitados</h3>
            <div className="space-y-3">
              <label className="flex items-center justify-between p-3 glass rounded-lg cursor-pointer">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={newRequest.form_data.card_farma || false}
                    onChange={(e) => updateFormData('card_farma', e.target.checked)}
                    className="w-5 h-5"
                  />
                  <span className="text-gray-900 font-semibold">2ª VIA - Farmácia GOLDEN FARMA</span>
                </div>
                <Badge className="bg-blue-100 text-blue-800">R$ 0,00</Badge>
              </label>

              <label className="flex items-center justify-between p-3 glass rounded-lg cursor-pointer">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={newRequest.form_data.card_guarupass || false}
                    onChange={(e) => updateFormData('card_guarupass', e.target.checked)}
                    className="w-5 h-5"
                  />
                  <span className="text-gray-900 font-semibold">2ª Via - Vale Transporte GUARUPASS</span>
                </div>
                <Badge className="bg-blue-100 text-blue-800">R$ 45,98</Badge>
              </label>

              <label className="flex items-center justify-between p-3 glass rounded-lg cursor-pointer">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={newRequest.form_data.card_itaquapasses || false}
                    onChange={(e) => updateFormData('card_itaquapasses', e.target.checked)}
                    className="w-5 h-5"
                  />
                  <span className="text-gray-900 font-semibold">2ª Via - ITAQUAPASSES</span>
                </div>
                <Badge className="bg-blue-100 text-blue-800">R$ 40,00</Badge>
              </label>

              <label className="flex items-center justify-between p-3 glass rounded-lg cursor-pointer">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={newRequest.form_data.card_alelo || false}
                    onChange={(e) => updateFormData('card_alelo', e.target.checked)}
                    className="w-5 h-5"
                  />
                  <span className="text-gray-900 font-semibold">2ª Via - Vale Alimentação Alelo</span>
                </div>
                <Badge className="bg-blue-100 text-blue-800">R$ 12,00</Badge>
              </label>
            </div>
          </div>
        </div>
      );
    }

    // NOVO: Cancelamento Plano Médico
    if (category === "Cancelamento Plano Médico") {
      return (
        <div className="space-y-5">
          <div>
            <Label className="glass-label">Tipo de Cancelamento</Label>
            <Select
              value={newRequest.form_data.cancellation_type || ''}
              onValueChange={(value) => updateFormData('cancellation_type', value)}
            >
              <SelectTrigger className="glass-select">
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Titular">Cancelamento do Titular</SelectItem>
                <SelectItem value="Dependente">Cancelamento apenas Dependente</SelectItem>
                <SelectItem value="Titular e Dependente">Cancelamento Titular e Dependente</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="glass-label">Nome Completo</Label>
              <Input
                value={newRequest.form_data.full_name || ''}
                onChange={(e) => updateFormData('full_name', e.target.value)}
                className="glass-input"
              />
            </div>
            <div>
              <Label className="glass-label">RG</Label>
              <Input
                value={newRequest.form_data.rg || ''}
                onChange={(e) => updateFormData('rg', e.target.value)}
                className="glass-input"
              />
            </div>
          </div>

          <div>
            <Label className="glass-label">CPF</Label>
            <Input
              value={newRequest.form_data.cpf || ''}
              onChange={(e) => updateFormData('cpf', e.target.value)}
              className="glass-input"
              placeholder="000.000.000-00"
            />
          </div>

          {(newRequest.form_data.cancellation_type === 'Dependente' || newRequest.form_data.cancellation_type === 'Titular e Dependente') && (
            <div className="glass-card p-5 rounded-xl">
              <h3 className="font-bold text-gray-900 mb-3">Dados do Dependente</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-900 text-xs font-bold">Nome Completo do Dependente</Label>
                  <Input
                    value={newRequest.form_data.dependent_name || ''}
                    onChange={(e) => updateFormData('dependent_name', e.target.value)}
                    className="glass-input mt-1"
                  />
                </div>
                <div>
                  <Label className="text-gray-900 text-xs font-bold">CPF do Dependente</Label>
                  <Input
                    value={newRequest.form_data.dependent_cpf || ''}
                    onChange={(e) => updateFormData('dependent_cpf', e.target.value)}
                    className="glass-input mt-1"
                    placeholder="000.000.000-00"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="glass-card p-4 rounded-xl border border-red-200 bg-red-50">
            <div className="font-bold text-red-800 mb-2">⚠️ Avisos Importantes</div>
            <p className="text-sm text-red-700">
              1. Uma vez realizado o cancelamento do plano médico, o mesmo NÃO poderá retornar ao plano.<br/>
              2. Após a solicitação de cancelamento, o valor reajustado poderá ser cobrado até 2x ainda em folha de pagamento.<br/>
              3. Estou ciente que ainda terei desconto de coparticipação e mensalidade de acordo com a data vigência do plano, anterior a essa solicitação.
            </p>
          </div>
        </div>
      );
    }

    // NOVO: Cancelamento Adiantamento Salarial
    if (category === "Cancelamento Adiantamento Salarial") {
      return (
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="glass-label">Nome Completo</Label>
              <Input
                value={newRequest.form_data.full_name || ''}
                onChange={(e) => updateFormData('full_name', e.target.value)}
                className="glass-input"
              />
            </div>
            <div>
              <Label className="glass-label">CPF</Label>
              <Input
                value={newRequest.form_data.cpf || ''}
                onChange={(e) => updateFormData('cpf', e.target.value)}
                className="glass-input"
                placeholder="000.000.000-00"
              />
            </div>
          </div>

          <div className="glass-card p-4 rounded-xl border border-blue-200 bg-blue-50">
            <div className="font-bold text-blue-800 mb-2">📋 Declaração de Cancelamento</div>
            <p className="text-sm text-blue-700">
              Venho comunicar que <strong>NÃO desejo mais receber o adiantamento salarial</strong> que ocorre no dia 20 de cada mês.
              <br/><br/>
              <strong>Estou ciente que:</strong><br/>
              • Com essa mudança, não poderei mais voltar com esse valor adiantado<br/>
              • Daqui em diante, o pagamento do salário completo será realizado apenas no <strong>5º dia útil</strong> de cada mês
            </p>
          </div>
        </div>
      );
    }

    // NOVO: Alteração Vale Transporte
    if (category === "Alteração Vale Transporte") {
      return (
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="glass-label">Nome Completo</Label>
              <Input
                value={newRequest.form_data.full_name || ''}
                onChange={(e) => updateFormData('full_name', e.target.value)}
                className="glass-input"
              />
            </div>
            <div>
              <Label className="glass-label">CPF</Label>
              <Input
                value={newRequest.form_data.cpf || ''}
                onChange={(e) => updateFormData('cpf', e.target.value)}
                className="glass-input"
                placeholder="000.000.000-00"
              />
            </div>
          </div>

          <div>
            <Label className="glass-label">Endereço/Bairro</Label>
            <Input
              value={newRequest.form_data.address || ''}
              onChange={(e) => updateFormData('address', e.target.value)}
              className="glass-input"
            />
          </div>

          <div>
            <Label className="glass-label">CEP</Label>
            <Input
              value={newRequest.form_data.cep || ''}
              onChange={(e) => updateFormData('cep', e.target.value)}
              className="glass-input"
              placeholder="00000-000"
            />
          </div>

          <div>
            <Label className="glass-label">Opção de Vale Transporte</Label>
            <div className="flex gap-4 mt-2">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="vt_option"
                  value="Tenho interesse"
                  checked={newRequest.form_data.vt_option === 'Tenho interesse'}
                  onChange={(e) => updateFormData('vt_option', e.target.value)}
                  className="w-5 h-5"
                />
                <span className="text-gray-900 font-semibold">TENHO INTERESSE em utilizar o Vale Transporte</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="vt_option"
                  value="Não tenho interesse"
                  checked={newRequest.form_data.vt_option === 'Não tenho interesse'}
                  onChange={(e) => updateFormData('vt_option', e.target.value)}
                  className="w-5 h-5"
                />
                <span className="text-gray-900 font-semibold">NÃO TENHO INTERESSE</span>
              </label>
            </div>
          </div>

          {newRequest.form_data.vt_option === 'Tenho interesse' && (
            <>
              <div>
                <Label className="glass-label">Nº do Cartão (se já possui)</Label>
                <Input
                  value={newRequest.form_data.card_number || ''}
                  onChange={(e) => updateFormData('card_number', e.target.value)}
                  className="glass-input"
                  placeholder="Número do cartão existente"
                />
              </div>

              {/* IDA */}
              <div className="glass-card p-5 rounded-xl">
                <h3 className="font-bold text-gray-900 mb-4">IDA - Residência / Trabalho</h3>
                <div className="space-y-4">
                  <div>
                    <Label className="text-gray-900 text-xs font-bold">Tipo de Transporte</Label>
                    <Select
                      value={newRequest.form_data.ida_transport_type || ''}
                      onValueChange={(value) => updateFormData('ida_transport_type', value)}
                    >
                      <SelectTrigger className="glass-select mt-1">
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SPTrans - Ônibus">SPTrans - Ônibus</SelectItem>
                        <SelectItem value="SPTrans - Ônibus + Metrô/Trem">SPTrans - Ônibus + Metrô/Trem</SelectItem>
                        <SelectItem value="SPTrans - Trem/Metrô">SPTrans - Trem/Metrô</SelectItem>
                        <SelectItem value="TOP">TOP</SelectItem>
                        <SelectItem value="Fretado">Fretado</SelectItem>
                        <SelectItem value="Pecúnia">Pecúnia</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {newRequest.form_data.ida_transport_type === 'TOP' && (
                    <div>
                      <Label className="text-gray-900 text-xs font-bold">Nº da Linha TOP</Label>
                      <Input
                        value={newRequest.form_data.ida_top_line || ''}
                        onChange={(e) => updateFormData('ida_top_line', e.target.value)}
                        className="glass-input mt-1"
                      />
                    </div>
                  )}

                  <div>
                    <Label className="text-gray-900 text-xs font-bold">Valor Diário IDA</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={newRequest.form_data.ida_value || ''}
                      onChange={(e) => updateFormData('ida_value', e.target.value)}
                      className="glass-input mt-1"
                      placeholder="R$"
                    />
                  </div>
                </div>
              </div>

              {/* VOLTA */}
              <div className="glass-card p-5 rounded-xl">
                <h3 className="font-bold text-gray-900 mb-4">VOLTA - Residência / Trabalho</h3>
                <div className="space-y-4">
                  <div>
                    <Label className="text-gray-900 text-xs font-bold">Tipo de Transporte</Label>
                    <Select
                      value={newRequest.form_data.volta_transport_type || ''}
                      onValueChange={(value) => updateFormData('volta_transport_type', value)}
                    >
                      <SelectTrigger className="glass-select mt-1">
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SPTrans - Ônibus">SPTrans - Ônibus</SelectItem>
                        <SelectItem value="SPTrans - Ônibus + Metrô/Trem">SPTrans - Ônibus + Metrô/Trem</SelectItem>
                        <SelectItem value="SPTrans - Trem/Metrô">SPTrans - Trem/Metrô</SelectItem>
                        <SelectItem value="TOP">TOP</SelectItem>
                        <SelectItem value="Fretado">Fretado</SelectItem>
                        <SelectItem value="Pecúnia">Pecúnia</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {newRequest.form_data.volta_transport_type === 'TOP' && (
                    <div>
                      <Label className="text-gray-900 text-xs font-bold">Nº da Linha TOP</Label>
                      <Input
                        value={newRequest.form_data.volta_top_line || ''}
                        onChange={(e) => updateFormData('volta_top_line', e.target.value)}
                        className="glass-input mt-1"
                      />
                    </div>
                  )}

                  <div>
                    <Label className="text-gray-900 text-xs font-bold">Valor Diário VOLTA</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={newRequest.form_data.volta_value || ''}
                      onChange={(e) => updateFormData('volta_value', e.target.value)}
                      className="glass-input mt-1"
                      placeholder="R$"
                    />
                  </div>
                </div>
              </div>

              <div className="glass-card p-4 rounded-xl border border-blue-200 bg-blue-50">
                <div className="font-bold text-blue-800 mb-2">⚠️ Importante</div>
                <p className="text-sm text-blue-700">
                  • Como beneficiário do Vale Transporte, assumo o compromisso de somente utilizá-lo para deslocamento residência-trabalho<br/>
                  • Autorizo desconto de 6% do salário básico<br/>
                  • A emissão do cartão é de inteira responsabilidade do titular<br/>
                  • <strong>DATA DE CORTE: TODO DIA 15</strong> - Solicitações após esta data serão processadas no próximo período
                </p>
              </div>
            </>
          )}
        </div>
      );
    }

    // NOVO: Solicitação 2ª Via Crachá
    if (category === "Solicitação 2ª Via Crachá") {
      return (
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="glass-label">Nome Completo</Label>
              <Input
                value={newRequest.form_data.full_name || ''}
                onChange={(e) => updateFormData('full_name', e.target.value)}
                className="glass-input"
              />
            </div>
            <div>
              <Label className="glass-label">CPF</Label>
              <Input
                value={newRequest.form_data.cpf || ''}
                onChange={(e) => updateFormData('cpf', e.target.value)}
                className="glass-input"
                placeholder="000.000.000-00"
              />
            </div>
          </div>

          <div className="glass-card p-5 rounded-xl">
            <h3 className="font-bold text-gray-900 mb-4">Itens Solicitados</h3>
            <div className="space-y-3">
              <label className="flex items-center justify-between p-3 glass rounded-lg cursor-pointer">
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="badge_item"
                    value="Cartão - R$ 5,00"
                    checked={newRequest.form_data.badge_item === 'Cartão - R$ 5,00'}
                    onChange={(e) => updateFormData('badge_item', e.target.value)}
                    className="w-5 h-5"
                  />
                  <span className="text-gray-900 font-semibold">Cartão</span>
                </div>
                <Badge className="bg-blue-100 text-blue-800">R$ 5,00</Badge>
              </label>

              <label className="flex items-center justify-between p-3 glass rounded-lg cursor-pointer">
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="badge_item"
                    value="Cordão - R$ 3,00"
                    checked={newRequest.form_data.badge_item === 'Cordão - R$ 3,00'}
                    onChange={(e) => updateFormData('badge_item', e.target.value)}
                    className="w-5 h-5"
                  />
                  <span className="text-gray-900 font-semibold">Cordão</span>
                </div>
                <Badge className="bg-blue-100 text-blue-800">R$ 3,00</Badge>
              </label>

              <label className="flex items-center justify-between p-3 glass rounded-lg cursor-pointer">
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="badge_item"
                    value="Capa - R$ 2,00"
                    checked={newRequest.form_data.badge_item === 'Capa - R$ 2,00'}
                    onChange={(e) => updateFormData('badge_item', e.target.value)}
                    className="w-5 h-5"
                  />
                  <span className="text-gray-900 font-semibold">Capa</span>
                </div>
                <Badge className="bg-blue-100 text-blue-800">R$ 2,00</Badge>
              </label>

              <label className="flex items-center justify-between p-3 glass rounded-lg cursor-pointer">
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="badge_item"
                    value="Completo - R$ 10,00"
                    checked={newRequest.form_data.badge_item === 'Completo - R$ 10,00'}
                    onChange={(e) => updateFormData('badge_item', e.target.value)}
                    className="w-5 h-5"
                  />
                  <span className="text-gray-900 font-semibold">Completo (Cartão + Cordão + Capa)</span>
                </div>
                <Badge className="bg-blue-100 text-blue-800">R$ 10,00</Badge>
              </label>

              <label className="flex items-center justify-between p-3 glass rounded-lg cursor-pointer border-2 border-green-500">
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="badge_item"
                    value="Isento - Roubo/Furto com BO"
                    checked={newRequest.form_data.badge_item === 'Isento - Roubo/Furto com BO'}
                    onChange={(e) => updateFormData('badge_item', e.target.value)}
                    className="w-5 h-5"
                  />
                  <span className="text-gray-900 font-semibold">Isento de desconto (Roubo/Furto com BO)</span>
                </div>
                <Badge className="bg-green-100 text-green-800">R$ 0,00</Badge>
              </label>
            </div>
          </div>

          <div className="glass-card p-4 rounded-xl border border-blue-200 bg-blue-50">
            <p className="text-sm text-blue-700">
              ℹ️ Declaro estar ciente do desconto na próxima folha de pagamento conforme item selecionado.<br/>
              Para isenção, é necessário apresentar Boletim de Ocorrência com menção de crachá.
            </p>
          </div>
        </div>
      );
    }

    // NOVO: Downgrade Plano Odontológico
    if (category === "Downgrade Plano Odontológico") {
      return (
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="glass-label">Nome Completo</Label>
              <Input
                value={newRequest.form_data.full_name || ''}
                onChange={(e) => updateFormData('full_name', e.target.value)}
                className="glass-input"
              />
            </div>
            <div>
              <Label className="glass-label">RG</Label>
              <Input
                value={newRequest.form_data.rg || ''}
                onChange={(e) => updateFormData('rg', e.target.value)}
                className="glass-input"
              />
            </div>
          </div>

          <div>
            <Label className="glass-label">CPF</Label>
            <Input
              value={newRequest.form_data.cpf || ''}
              onChange={(e) => updateFormData('cpf', e.target.value)}
              className="glass-input"
              placeholder="000.000.000-00"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="glass-label">Plano Atual</Label>
              <Select
                value={newRequest.form_data.current_plan || ''}
                onValueChange={(value) => updateFormData('current_plan', value)}
              >
                <SelectTrigger className="glass-select">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Ouro - R$ 67,46">Ouro - R$ 67,46</SelectItem>
                  <SelectItem value="Prata - R$ 60,19">Prata - R$ 60,19</SelectItem>
                  <SelectItem value="Bronze - R$ 12,16">Bronze - R$ 12,16</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="glass-label">Novo Plano</Label>
              <Select
                value={newRequest.form_data.new_plan || ''}
                onValueChange={(value) => updateFormData('new_plan', value)}
              >
                <SelectTrigger className="glass-select">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Prata - R$ 60,19">Prata - R$ 60,19</SelectItem>
                  <SelectItem value="Bronze - R$ 12,16">Bronze - R$ 12,16</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="glass-card p-4 rounded-xl border border-blue-200 bg-blue-50">
            <div className="font-bold text-blue-800 mb-2">⚠️ Avisos</div>
            <p className="text-sm text-blue-700">
              • Estou ciente de que ainda terei desconto de coparticipação e mensalidade de acordo com a data de vigência do plano anterior a esta solicitação<br/>
              • O pedido passará por análise e está sujeito a aprovação ou reprovação<br/>
              • <strong>Solicitações após a data de corte serão realizadas somente no próximo mês</strong><br/>
              • O preenchimento deve ser sem rasuras
            </p>
          </div>
        </div>
      );
    }

    // NOVO: Cancelamento Plano Odontológico
    if (category === "Cancelamento Plano Odontológico") {
      return (
        <div className="space-y-5">
          <div>
            <Label className="glass-label">Tipo de Cancelamento</Label>
            <Select
              value={newRequest.form_data.cancellation_type || ''}
              onValueChange={(value) => updateFormData('cancellation_type', value)}
            >
              <SelectTrigger className="glass-select">
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Titular">Cancelamento do Titular</SelectItem>
                <SelectItem value="Dependente">Cancelamento apenas Dependente</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="glass-label">Nome Completo</Label>
              <Input
                value={newRequest.form_data.full_name || ''}
                onChange={(e) => updateFormData('full_name', e.target.value)}
                className="glass-input"
              />
            </div>
            <div>
              <Label className="glass-label">RG</Label>
              <Input
                value={newRequest.form_data.rg || ''}
                onChange={(e) => updateFormData('rg', e.target.value)}
                className="glass-input"
              />
            </div>
          </div>

          <div>
            <Label className="glass-label">CPF</Label>
            <Input
              value={newRequest.form_data.cpf || ''}
              onChange={(e) => updateFormData('cpf', e.target.value)}
              className="glass-input"
              placeholder="000.000.000-00"
            />
          </div>

          <div>
            <Label className="glass-label">Plano Atual</Label>
            <Select
              value={newRequest.form_data.current_plan || ''}
              onValueChange={(value) => updateFormData('current_plan', value)}
            >
              <SelectTrigger className="glass-select">
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Bronze - R$ 12,16">Bronze - R$ 12,16</SelectItem>
                <SelectItem value="Prata - R$ 60,19">Prata - R$ 60,19</SelectItem>
                <SelectItem value="Ouro - R$ 67,46">Ouro - R$ 67,46</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {newRequest.form_data.cancellation_type === 'Dependente' && (
            <div className="glass-card p-5 rounded-xl">
              <h3 className="font-bold text-gray-900 mb-3">Dados do Dependente</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-900 text-xs font-bold">Nome Completo do Dependente</Label>
                  <Input
                    value={newRequest.form_data.dependent_name || ''}
                    onChange={(e) => updateFormData('dependent_name', e.target.value)}
                    className="glass-input mt-1"
                  />
                </div>
                <div>
                  <Label className="text-gray-900 text-xs font-bold">CPF do Dependente</Label>
                  <Input
                    value={newRequest.form_data.dependent_cpf || ''}
                    onChange={(e) => updateFormData('dependent_cpf', e.target.value)}
                    className="glass-input mt-1"
                    placeholder="000.000.000-00"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="glass-card p-4 rounded-xl border border-red-200 bg-red-50">
            <div className="font-bold text-red-800 mb-2">⚠️ Avisos</div>
            <p className="text-sm text-red-700">
              • Estou ciente que houve o tempo de permanência mínima de <strong>2 anos</strong> conforme previsto em contrato<br/>
              • Ainda terei desconto de mensalidade de acordo com a data vigência do plano, anterior a essa solicitação<br/>
              • De acordo com a resolução da normativa da ANS 561
            </p>
          </div>
        </div>
      );
    }

    // NOVO: Adesão Plano Saúde
    if (category === "Adesão Plano Saúde") {
      return (
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="glass-label">Colaborador(a)</Label>
              <Input
                value={newRequest.form_data.employee_name || ''}
                onChange={(e) => updateFormData('employee_name', e.target.value)}
                className="glass-input"
              />
            </div>
            <div>
              <Label className="glass-label">Unidade</Label>
              <Select
                value={newRequest.form_data.unit || ''}
                onValueChange={(value) => updateFormData('unit', value)}
              >
                <SelectTrigger className="glass-select">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Guarulhos">Guarulhos</SelectItem>
                  <SelectItem value="Joinville">Joinville</SelectItem>
                  <SelectItem value="Agrolândia">Agrolândia</SelectItem>
                  <SelectItem value="Lojas">Lojas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="glass-label">CPF</Label>
              <Input
                value={newRequest.form_data.cpf || ''}
                onChange={(e) => updateFormData('cpf', e.target.value)}
                className="glass-input"
                placeholder="000.000.000-00"
              />
            </div>
            <div>
              <Label className="glass-label">Data de Nascimento</Label>
              <Input
                type="date"
                value={newRequest.form_data.birth_date || ''}
                onChange={(e) => updateFormData('birth_date', e.target.value)}
                className="glass-input"
              />
            </div>
            <div>
              <Label className="glass-label">Telefone</Label>
              <Input
                value={newRequest.form_data.phone || ''}
                onChange={(e) => updateFormData('phone', e.target.value)}
                className="glass-input"
                placeholder="(00) 00000-0000"
              />
            </div>
          </div>

          <div>
            <Label className="glass-label">E-mail</Label>
            <Input
              type="email"
              value={newRequest.form_data.email || ''}
              onChange={(e) => updateFormData('email', e.target.value)}
              className="glass-input"
            />
          </div>

          <div>
            <Label className="glass-label">Opção de Plano</Label>
            <div className="flex gap-4 mt-2 mb-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="health_plan_opt"
                  value="Opto"
                  checked={newRequest.form_data.health_plan_opt === 'Opto'}
                  onChange={(e) => updateFormData('health_plan_opt', e.target.value)}
                  className="w-5 h-5"
                />
                <span className="text-gray-900 font-semibold">OPTO pelo Plano de Saúde</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="health_plan_opt"
                  value="Não opto"
                  checked={newRequest.form_data.health_plan_opt === 'Não opto'}
                  onChange={(e) => updateFormData('health_plan_opt', e.target.value)}
                  className="w-5 h-5"
                />
                <span className="text-gray-900 font-semibold">NÃO OPTO</span>
              </label>
            </div>
          </div>

          {newRequest.form_data.health_plan_opt === 'Opto' && (
            <>
              <div className="glass-card p-5 rounded-xl">
                <h3 className="font-bold text-gray-900 mb-4">Planos e Descontos</h3>
                <div className="space-y-3">
                  <label className="flex items-start gap-3 p-4 glass rounded-lg cursor-pointer hover:scale-105 transition-all">
                    <input
                      type="radio"
                      name="health_plan"
                      value="P200 ENFERMARIA - R$ 219,56"
                      checked={newRequest.form_data.health_plan === 'P200 ENFERMARIA - R$ 219,56'}
                      onChange={(e) => updateFormData('health_plan', e.target.value)}
                      className="w-5 h-5 mt-1"
                    />
                    <div>
                      <div className="font-bold text-gray-900">Plano P200 ENFERMARIA</div>
                      <div className="text-sm text-gray-700">Titular: R$ 219,56 | Dependente: R$ 619,56</div>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 p-4 glass rounded-lg cursor-pointer hover:scale-105 transition-all">
                    <input
                      type="radio"
                      name="health_plan"
                      value="P200 APARTAMENTO - R$ 293,86"
                      checked={newRequest.form_data.health_plan === 'P200 APARTAMENTO - R$ 293,86'}
                      onChange={(e) => updateFormData('health_plan', e.target.value)}
                      className="w-5 h-5 mt-1"
                    />
                    <div>
                      <div className="font-bold text-gray-900">Plano P200 APARTAMENTO</div>
                      <div className="text-sm text-gray-700">Titular: R$ 293,86 | Dependente: R$ 693,86</div>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 p-4 glass rounded-lg cursor-pointer hover:scale-105 transition-all">
                    <input
                      type="radio"
                      name="health_plan"
                      value="P300 ENFERMARIA - R$ 294,29"
                      checked={newRequest.form_data.health_plan === 'P300 ENFERMARIA - R$ 294,29'}
                      onChange={(e) => updateFormData('health_plan', e.target.value)}
                      className="w-5 h-5 mt-1"
                    />
                    <div>
                      <div className="font-bold text-gray-900">Plano P300 ENFERMARIA</div>
                      <div className="text-sm text-gray-700">Titular: R$ 294,29 | Dependente: R$ 694,29</div>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 p-4 glass rounded-lg cursor-pointer hover:scale-105 transition-all">
                    <input
                      type="radio"
                      name="health_plan"
                      value="P300 APARTAMENTO - R$ 380,83"
                      checked={newRequest.form_data.health_plan === 'P300 APARTAMENTO - R$ 380,83'}
                      onChange={(e) => updateFormData('health_plan', e.target.value)}
                      className="w-5 h-5 mt-1"
                    />
                    <div>
                      <div className="font-bold text-gray-900">Plano P300 APARTAMENTO</div>
                      <div className="text-sm text-gray-700">Titular: R$ 380,83 | Dependente: R$ 780,83</div>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 p-4 glass rounded-lg cursor-pointer hover:scale-105 transition-all">
                    <input
                      type="radio"
                      name="health_plan"
                      value="P400 APARTAMENTO - R$ 682,16"
                      checked={newRequest.form_data.health_plan === 'P400 APARTAMENTO - R$ 682,16'}
                      onChange={(e) => updateFormData('health_plan', e.target.value)}
                      className="w-5 h-5 mt-1"
                    />
                    <div>
                      <div className="font-bold text-gray-900">Plano P400 APARTAMENTO</div>
                      <div className="text-sm text-gray-700">Titular: R$ 682,16 | Dependente: R$ 1.082,16</div>
                    </div>
                  </label>
                </div>
              </div>

              <DependentsManager
                value={newRequest.form_data.health_dependents}
                onChange={(deps) => updateFormData('health_dependents', deps)}
                title="Dependentes"
              />

              <div className="glass-card p-4 rounded-xl border border-blue-200 bg-blue-50">
                <div className="font-bold text-blue-800 mb-2">⚠️ Declarações</div>
                <p className="text-sm text-blue-700">
                  • Estou ciente que a empresa não será responsável pelo pagamento da assistência médica para meus dependentes<br/>
                  • Autorizo o desconto em meu holerite por pessoa/dependente<br/>
                  • Ciente que haverá descontos proporcionais na inclusão do plano<br/>
                  • Ciente de descontos referente a coparticipações
                </p>
              </div>
            </>
          )}
        </div>
      );
    }


    // Formulário Padrão para outras categorias
    return (
      <div className="space-y-5">
        <div>
          <Label htmlFor="title" className="glass-label">Título da Solicitação</Label>
          <Input
            id="title"
            placeholder="Ex: Solicitação de declaração"
            value={newRequest.title}
            onChange={(e) => setNewRequest(prev => ({ ...prev, title: e.target.value }))}
            className="glass-input"
          />
        </div>

        <div>
          <Label htmlFor="description" className="glass-label">Descrição Detalhada</Label>
          <Textarea
            id="description"
            placeholder="Descreva sua solicitação em detalhes..."
            value={newRequest.description}
            onChange={(e) => setNewRequest(prev => ({ ...prev, description: e.target.value }))}
            className="glass-textarea"
            rows={4}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="priority" className="glass-label">Prioridade</Label>
            <Select
              value={newRequest.priority}
              onValueChange={(value) => setNewRequest(prev => ({ ...prev, priority: value }))}
            >
              <SelectTrigger className="glass-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {priorities.map(priority => (
                  <SelectItem key={priority} value={priority}>{priority}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="due_date" className="glass-label">Data Limite</Label>
            <Input
              id="due_date"
              type="date"
              value={newRequest.due_date}
              onChange={(e) => setNewRequest(prev => ({ ...prev, due_date: e.target.value }))}
              className="glass-input"
            />
          </div>
        </div>
      </div>
    );
  };

  const getStatusClasses = (status) => {
    switch (status) {
      case 'Aprovado': return { bg: 'bg-green-500/10', text: 'text-green-700', border: 'border-green-500/20', icon: 'text-green-500' };
      case 'Rejeitado': return { bg: 'bg-red-500/10', text: 'text-red-700', border: 'border-red-500/20', icon: 'text-red-500' };
      case 'Em Análise': return { bg: 'bg-yellow-500/10', text: 'text-yellow-700', border: 'border-yellow-500/20', icon: 'text-yellow-500' };
      case 'Concluído': return { bg: 'bg-blue-500/10', text: 'text-blue-700', border: 'border-blue-500/20', icon: 'text-blue-500' };
      case 'Pendente': return { bg: 'bg-slate-500/10', text: 'text-slate-700', border: 'border-slate-500/20', icon: 'text-slate-500' };
      default: return { bg: 'bg-slate-500/10', text: 'text-slate-700', border: 'border-slate-500/20', icon: 'text-slate-500' };
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Aprovado': return CheckCircle;
      case 'Rejeitado': return XCircle;
      case 'Em Análise': return Loader2;
      case 'Concluído': return CheckCircle;
      case 'Pendente': return Clock;
      default: return AlertCircle;
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

  return (
    <div className="space-y-6">
      {/* REMOVIDO: Header com Estatísticas */}

      {/* Controles */}
      <div className="glass-card p-6 rounded-2xl">
        <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
          <div className="grid md:grid-cols-3 gap-4 flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 glass-text-muted" />
              <Input
                placeholder="Buscar solicitações..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 glass-input"
              />
            </div>

            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="glass-select">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {statuses.map(status => (
                  <SelectItem key={status} value={status}>{status}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="glass-select">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Dialog open={showNewRequestDialog} onOpenChange={setShowNewRequestDialog}>
            <DialogTrigger asChild>
              <Button className="glass-button-primary flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Nova Solicitação
              </Button>
            </DialogTrigger>
            <DialogContent className="glass-modal max-w-full md:max-w-3xl h-full w-full md:h-auto top-0 left-0 translate-x-0 translate-y-0 rounded-none md:rounded-xl p-0 flex flex-col max-h-screen">
              {/* Header Mobile Fixo */}
              <div className="px-6 pt-6 pb-4 border-b border-gray-200 dark:border-gray-700 md:hidden bg-card z-10 modal-header-mobile">
                <h2 className="modal-title">Nova Solicitação de RH</h2>
                <p className="modal-description">Escolha o tipo e preencha os dados</p>
              </div>

              {/* Header Desktop */}
              <DialogHeader className="mb-6 hidden md:block px-8 pt-8 pb-0">
                <h2 className="modal-title">Nova Solicitação de RH</h2>
                <p className="modal-description">Escolha o tipo de solicitação e preencha os dados necessários</p>
              </DialogHeader>

              <div className="flex-1 overflow-y-auto px-6 md:px-8 md:pt-0 md:pb-0">
                <div className="space-y-5">
                  <div>
                    <Label htmlFor="category" className="glass-label">Tipo de Solicitação</Label>
                    <Select
                      value={newRequest.category}
                      onValueChange={handleCategoryChange}
                    >
                      <SelectTrigger className="glass-select">
                        <SelectValue placeholder="Selecione o tipo de solicitação" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.slice(1).map(category => (
                          <SelectItem key={category} value={category}>{category}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {newRequest.category && renderFormFields()}

                  {/* Upload de Arquivo - UNIVERSAL PARA TODAS AS SOLICITAÇÕES */}
                  {newRequest.category && (
                    <div>
                      <Label className="glass-label">Anexo (Opcional)</Label>
                      <div className="flex items-center gap-3">
                        <Input
                          type="file"
                          onChange={handleFileUpload}
                          disabled={uploadingFile}
                          className="glass-input"
                        />
                        {uploadingFile && (
                          <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                        )}
                        {newRequest.attachment_url && !uploadingFile && (
                          <Badge className="bg-green-100 text-green-800">
                            <Paperclip className="w-3 h-3 mr-1" />
                            Anexado
                          </Badge>
                        )}
                      </div>
                      <p className="helper-text mt-2">
                        ℹ️ Você pode anexar documentos, fotos ou arquivos relevantes
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer Mobile Fixo */}
              <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 md:hidden bg-card z-10 modal-footer-mobile">
                <div className="flex flex-col gap-3">
                  <Button
                    onClick={handleSubmitRequest}
                    disabled={!newRequest.category}
                    className="glass-button-primary w-full mobile-button"
                  >
                    Enviar Solicitação
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => setShowNewRequestDialog(false)}
                    className="glass-button-secondary w-full mobile-button"
                  >
                    Cancelar
                  </Button>
                </div>
              </div>

              {/* Footer Desktop */}
              <div className="hidden md:flex justify-end gap-3 pt-6 mt-6 border-t border-gray-200 dark:border-gray-700 px-8 pb-8 pt-0">
                <Button variant="ghost" onClick={() => setShowNewRequestDialog(false)} className="glass-button-secondary">
                  Cancelar
                </Button>
                <Button
                  onClick={handleSubmitRequest}
                  disabled={!newRequest.category}
                  className="glass-button-primary"
                >
                  Enviar Solicitação
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Lista de Solicitações - COM STATUS BADGE BEM VISÍVEL */}
      <div className="space-y-4">
        {filteredRequests.length > 0 ? (
          filteredRequests.map((request) => {
            const statusClasses = getStatusClasses(request.status);
            const StatusIcon = getStatusIcon(request.status);

            return (
              <div key={request.id} className={`glass-card p-5 md:p-6 rounded-2xl border-l-4 ${getPriorityBorder(request.priority)} hover:scale-[1.01] transition-all`}>
                <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                  <div className="flex-1">
                    <div className="flex flex-col gap-3 mb-4">
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="text-lg md:text-xl font-bold glass-text flex-1">{request.title}</h3>
                        <div className="glass-text-muted text-right text-sm flex-shrink-0">
                          <div className="font-bold glass-text">Criado em</div>
                          <div>{format(new Date(request.created_date), "dd/MM/yy", { locale: ptBR })}</div>
                        </div>
                      </div>
                      
                      {/* BADGES COM STATUS BEM DESTACADO */}
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge className={`${statusClasses.bg} ${statusClasses.text} border-2 ${statusClasses.border} font-bold text-sm px-4 py-2 shadow-sm`}>
                          <StatusIcon className={`w-4 h-4 mr-2 ${request.status === 'Em Análise' ? 'animate-spin' : ''}`} />
                          {request.status}
                        </Badge>
                        <Badge variant="outline" className="font-semibold glass-text text-sm">
                          {request.category}
                        </Badge>
                        <Badge variant="secondary" className="font-semibold glass-text text-sm">
                          Prioridade: {request.priority}
                        </Badge>
                      </div>
                    </div>

                    <p className="glass-text mb-4 leading-relaxed text-sm md:text-base whitespace-pre-wrap font-medium">
                      {request.description}
                    </p>

                    {request.response && (
                      <div className="glass-card p-4 rounded-lg mb-4 bg-blue-500/10 border border-blue-500/20">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-7 h-7 rounded-full bg-blue-500 flex-shrink-0 flex items-center justify-center">
                            <FileText className="w-4 h-4 text-white" />
                          </div>
                          <span className="font-bold text-blue-800">Resposta do RH:</span>
                        </div>
                        <p className="text-blue-800/90 font-medium">{request.response}</p>
                      </div>
                    )}

                    {request.due_date && (
                      <div className="flex items-center gap-2 glass-text-muted text-sm font-semibold">
                        <Calendar className="w-4 h-4" />
                        <span>Prazo: {format(new Date(request.due_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</span>
                      </div>
                    )}
                  </div>

                  {request.attachment_url && (
                    <div className="lg:w-48 flex-shrink-0">
                      <a href={request.attachment_url} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" size="sm" className="w-full glass-button justify-start">
                          <Eye className="w-4 h-4 mr-2" />
                          Ver Anexo
                        </Button>
                      </a>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-12 glass-card rounded-2xl">
            <FileText className="w-16 h-16 glass-text-muted mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-semibold glass-text mb-2">Nenhuma solicitação encontrada</h3>
            <p className="glass-text-muted mb-4 px-4 font-medium">
              {searchTerm || selectedStatus !== "Todos" || selectedCategory !== "Todas"
                ? "Tente ajustar os filtros"
                : "Você ainda não fez nenhuma solicitação"
              }
            </p>
            <Button onClick={() => setShowNewRequestDialog(true)} className="glass-button-primary">
              <Plus className="w-4 h-4 mr-2" />
              Criar Solicitação
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}