import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { User } from "@/entities/User";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import {
  Users,
  Plus,
  Phone,
  Mail,
  DollarSign,
  FileText,
  MapPin,
  Briefcase,
  GraduationCap
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

export default function RecruitmentKanban() {
  const [user, setUser] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [uploadingResume, setUploadingResume] = useState(false);

  const [newCandidate, setNewCandidate] = useState({
    candidate_name: "",
    email: "",
    phone: "",
    position_applied: "",
    department: "",
    location: "",
    cpf: "",
    birth_date: "",
    education_level: "",
    salary_expectation: "",
    availability_date: "",
    experience: "",
    resume_url: "",
    priority: "Normal"
  });

  const columns = [
    { id: "Triagem", title: "Triagem", color: "bg-slate-500" },
    { id: "Análise Curricular", title: "Análise Curricular", color: "bg-blue-500" },
    { id: "Entrevista RH", title: "Entrevista RH", color: "bg-purple-500" },
    { id: "Entrevista Gestor", title: "Entrevista Gestor", color: "bg-indigo-500" },
    { id: "Teste Prático", title: "Teste Prático", color: "bg-yellow-500" },
    { id: "Proposta", title: "Proposta", color: "bg-orange-500" },
    { id: "Admissão", title: "Admissão", color: "bg-green-500" },
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [currentUser, candidatesData] = await Promise.all([
        User.me(),
        base44.entities.Recruitment.list("-created_date")
      ]);

      setUser(currentUser);
      setCandidates(candidatesData.filter(c => c.status !== 'Reprovado' && c.status !== 'Desistiu'));
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    }
  };

  const handleDragEnd = async (result) => {
    if (!result.destination) return;

    const candidateId = result.draggableId;
    const newStatus = result.destination.droppableId;

    try {
      await base44.entities.Recruitment.update(candidateId, { status: newStatus });
      await loadData();
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
    }
  };

  const handleCreateCandidate = async () => {
    try {
      await base44.entities.Recruitment.create({
        ...newCandidate,
        status: "Triagem",
        assigned_to: user.email
      });

      setShowNewDialog(false);
      setNewCandidate({
        candidate_name: "",
        email: "",
        phone: "",
        position_applied: "",
        department: "",
        location: "",
        cpf: "",
        birth_date: "",
        education_level: "",
        salary_expectation: "",
        availability_date: "",
        experience: "",
        resume_url: "",
        priority: "Normal"
      });
      await loadData();
    } catch (error) {
      console.error("Erro ao criar candidato:", error);
      alert("Erro ao adicionar candidato");
    }
  };

  const handleResumeUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingResume(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setNewCandidate(prev => ({ ...prev, resume_url: file_url }));
    } catch (error) {
      console.error("Erro ao fazer upload:", error);
      alert("Erro ao enviar currículo");
    } finally {
      setUploadingResume(false);
    }
  };

  const getCandidatesByStatus = (status) => {
    return candidates.filter(c => c.status === status);
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'Urgente': return 'border-red-500';
      case 'Alta': return 'border-orange-500';
      case 'Normal': return 'border-blue-500';
      default: return 'border-gray-300';
    }
  };

  const stats = {
    total: candidates.length,
    triagem: candidates.filter(c => c.status === 'Triagem').length,
    entrevistas: candidates.filter(c => c.status === 'Entrevista RH' || c.status === 'Entrevista Gestor').length,
    admissao: candidates.filter(c => c.status === 'Admissão').length
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-card p-6 rounded-2xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold glass-text flex items-center gap-3">
              <Users className="w-7 h-7 text-blue-600" />
              Kanban de Recrutamento
            </h1>
            <p className="glass-text-muted mt-1">Acompanhe o processo de contratação</p>
          </div>
          <Button onClick={() => setShowNewDialog(true)} className="glass-button-primary">
            <Plus className="w-5 h-5 mr-2" />
            Novo Candidato
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="glass p-4 rounded-xl text-center">
            <div className="text-3xl font-bold text-blue-600">{stats.total}</div>
            <div className="text-sm glass-text-muted mt-1 font-semibold">Total</div>
          </div>
          <div className="glass p-4 rounded-xl text-center">
            <div className="text-3xl font-bold text-slate-600">{stats.triagem}</div>
            <div className="text-sm glass-text-muted mt-1 font-semibold">Em Triagem</div>
          </div>
          <div className="glass p-4 rounded-xl text-center">
            <div className="text-3xl font-bold text-purple-600">{stats.entrevistas}</div>
            <div className="text-sm glass-text-muted mt-1 font-semibold">Entrevistas</div>
          </div>
          <div className="glass p-4 rounded-xl text-center">
            <div className="text-3xl font-bold text-green-600">{stats.admissao}</div>
            <div className="text-sm glass-text-muted mt-1 font-semibold">Para Admitir</div>
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {columns.map(column => (
            <div key={column.id} className="flex-shrink-0 w-80">
              <div className={`${column.color} text-white p-4 rounded-t-2xl`}>
                <h3 className="font-bold text-sm flex items-center justify-between">
                  {column.title}
                  <Badge className="bg-white/20 text-white">
                    {getCandidatesByStatus(column.id).length}
                  </Badge>
                </h3>
              </div>

              <Droppable droppableId={column.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`glass-card rounded-b-2xl rounded-t-none p-3 min-h-[500px] ${
                      snapshot.isDraggingOver ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="space-y-3">
                      {getCandidatesByStatus(column.id).map((candidate, index) => (
                        <Draggable key={candidate.id} draggableId={candidate.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`glass-card p-4 rounded-xl cursor-pointer hover:shadow-lg transition-all border-l-4 ${getPriorityColor(candidate.priority)} ${
                                snapshot.isDragging ? 'shadow-2xl rotate-2' : ''
                              }`}
                              onClick={() => {
                                setSelectedCandidate(candidate);
                                setShowDetailDialog(true);
                              }}
                            >
                              <div className="mb-3">
                                <h4 className="font-bold text-gray-900 mb-1">{candidate.candidate_name}</h4>
                                <p className="text-xs text-gray-600">{candidate.position_applied}</p>
                              </div>

                              <div className="space-y-2 text-xs">
                                <div className="flex items-center gap-2 text-gray-700">
                                  <Phone className="w-3 h-3" />
                                  <span>{candidate.phone}</span>
                                </div>
                                {candidate.email && (
                                  <div className="flex items-center gap-2 text-gray-700">
                                    <Mail className="w-3 h-3" />
                                    <span className="truncate">{candidate.email}</span>
                                  </div>
                                )}
                                {candidate.location && (
                                  <div className="flex items-center gap-2 text-gray-700">
                                    <MapPin className="w-3 h-3" />
                                    <span>{candidate.location}</span>
                                  </div>
                                )}
                              </div>

                              <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200">
                                <Badge variant="outline" className="text-xs">
                                  {candidate.department}
                                </Badge>
                                {candidate.priority === 'Urgente' && (
                                  <Badge className="bg-red-500 text-white text-xs">🔥</Badge>
                                )}
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                    </div>
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>

      {/* Dialog: Novo Candidato */}
      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent className="glass-modal max-w-3xl p-0 max-h-[90vh] overflow-y-auto">
          <div className="p-8">
            <DialogHeader className="mb-6">
              <h2 className="modal-title">Cadastro de Candidato</h2>
              <p className="modal-description">Preencha os dados do candidato</p>
            </DialogHeader>

            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="glass-label">Nome Completo *</Label>
                  <Input
                    value={newCandidate.candidate_name}
                    onChange={(e) => setNewCandidate(prev => ({ ...prev, candidate_name: e.target.value }))}
                    className="glass-input"
                  />
                </div>
                <div>
                  <Label className="glass-label">Telefone *</Label>
                  <Input
                    value={newCandidate.phone}
                    onChange={(e) => setNewCandidate(prev => ({ ...prev, phone: e.target.value }))}
                    className="glass-input"
                    placeholder="(11) 99999-9999"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="glass-label">Email</Label>
                  <Input
                    type="email"
                    value={newCandidate.email}
                    onChange={(e) => setNewCandidate(prev => ({ ...prev, email: e.target.value }))}
                    className="glass-input"
                  />
                </div>
                <div>
                  <Label className="glass-label">CPF</Label>
                  <Input
                    value={newCandidate.cpf}
                    onChange={(e) => setNewCandidate(prev => ({ ...prev, cpf: e.target.value }))}
                    className="glass-input"
                    placeholder="000.000.000-00"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="glass-label">Cargo Pretendido *</Label>
                  <Input
                    value={newCandidate.position_applied}
                    onChange={(e) => setNewCandidate(prev => ({ ...prev, position_applied: e.target.value }))}
                    className="glass-input"
                  />
                </div>
                <div>
                  <Label className="glass-label">Departamento</Label>
                  <Select
                    value={newCandidate.department}
                    onValueChange={(value) => setNewCandidate(prev => ({ ...prev, department: value }))}
                  >
                    <SelectTrigger className="glass-select">
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {["RH", "TI", "Financeiro", "Marketing", "Vendas", "Operações", "Produção", "Criação", "Logística"].map(d => (
                        <SelectItem key={d} value={d}>{d}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="glass-label">Localidade</Label>
                  <Select
                    value={newCandidate.location}
                    onValueChange={(value) => setNewCandidate(prev => ({ ...prev, location: value }))}
                  >
                    <SelectTrigger className="glass-select">
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {["Guarulhos", "Joinville", "Agrolândia", "Lojas", "Escritório"].map(l => (
                        <SelectItem key={l} value={l}>{l}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="glass-label">Escolaridade</Label>
                  <Select
                    value={newCandidate.education_level}
                    onValueChange={(value) => setNewCandidate(prev => ({ ...prev, education_level: value }))}
                  >
                    <SelectTrigger className="glass-select">
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {["Ensino Fundamental", "Ensino Médio", "Ensino Superior", "Pós-graduação"].map(e => (
                        <SelectItem key={e} value={e}>{e}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="glass-label">Pretensão Salarial (R$)</Label>
                  <Input
                    type="number"
                    value={newCandidate.salary_expectation}
                    onChange={(e) => setNewCandidate(prev => ({ ...prev, salary_expectation: e.target.value }))}
                    className="glass-input"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label className="glass-label">Disponibilidade</Label>
                  <Input
                    type="date"
                    value={newCandidate.availability_date}
                    onChange={(e) => setNewCandidate(prev => ({ ...prev, availability_date: e.target.value }))}
                    className="glass-input"
                  />
                </div>
              </div>

              <div>
                <Label className="glass-label">Prioridade</Label>
                <Select
                  value={newCandidate.priority}
                  onValueChange={(value) => setNewCandidate(prev => ({ ...prev, priority: value }))}
                >
                  <SelectTrigger className="glass-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["Baixa", "Normal", "Alta", "Urgente"].map(p => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="glass-label">Experiência</Label>
                <Textarea
                  value={newCandidate.experience}
                  onChange={(e) => setNewCandidate(prev => ({ ...prev, experience: e.target.value }))}
                  className="glass-textarea"
                  rows={3}
                  placeholder="Descreva a experiência profissional relevante..."
                />
              </div>

              <div>
                <Label className="glass-label">Currículo (PDF)</Label>
                <Input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleResumeUpload}
                  className="glass-input"
                  disabled={uploadingResume}
                />
                {uploadingResume && <p className="helper-text">Enviando...</p>}
                {newCandidate.resume_url && <p className="helper-text text-green-600">✓ Currículo anexado</p>}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-gray-200">
              <Button variant="ghost" onClick={() => setShowNewDialog(false)} className="glass-button-secondary">
                Cancelar
              </Button>
              <Button
                onClick={handleCreateCandidate}
                disabled={!newCandidate.candidate_name || !newCandidate.phone || !newCandidate.position_applied}
                className="glass-button-primary"
              >
                Adicionar Candidato
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog: Detalhes */}
      {selectedCandidate && (
        <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
          <DialogContent className="glass-modal max-w-2xl p-0 max-h-[90vh] overflow-y-auto">
            <div className="p-8">
              <DialogHeader className="mb-6">
                <h2 className="modal-title">{selectedCandidate.candidate_name}</h2>
                <p className="modal-description">{selectedCandidate.position_applied}</p>
              </DialogHeader>

              <div className="space-y-5">
                <div className="glass-card p-5 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm opacity-90">Status Atual</div>
                      <div className="text-2xl font-bold">{selectedCandidate.status}</div>
                    </div>
                    {selectedCandidate.priority === 'Urgente' && (
                      <Badge className="bg-red-500 text-white text-lg px-4 py-2">🔥 URGENTE</Badge>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="glass-card p-4 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <Phone className="w-4 h-4 text-blue-600" />
                      <span className="text-xs text-gray-600">Telefone</span>
                    </div>
                    <div className="font-bold text-gray-900">{selectedCandidate.phone}</div>
                  </div>

                  {selectedCandidate.email && (
                    <div className="glass-card p-4 rounded-xl">
                      <div className="flex items-center gap-2 mb-2">
                        <Mail className="w-4 h-4 text-blue-600" />
                        <span className="text-xs text-gray-600">Email</span>
                      </div>
                      <div className="font-bold text-gray-900 text-sm truncate">{selectedCandidate.email}</div>
                    </div>
                  )}

                  {selectedCandidate.location && (
                    <div className="glass-card p-4 rounded-xl">
                      <div className="flex items-center gap-2 mb-2">
                        <MapPin className="w-4 h-4 text-blue-600" />
                        <span className="text-xs text-gray-600">Localidade</span>
                      </div>
                      <div className="font-bold text-gray-900">{selectedCandidate.location}</div>
                    </div>
                  )}

                  {selectedCandidate.department && (
                    <div className="glass-card p-4 rounded-xl">
                      <div className="flex items-center gap-2 mb-2">
                        <Briefcase className="w-4 h-4 text-blue-600" />
                        <span className="text-xs text-gray-600">Departamento</span>
                      </div>
                      <div className="font-bold text-gray-900">{selectedCandidate.department}</div>
                    </div>
                  )}

                  {selectedCandidate.education_level && (
                    <div className="glass-card p-4 rounded-xl">
                      <div className="flex items-center gap-2 mb-2">
                        <GraduationCap className="w-4 h-4 text-blue-600" />
                        <span className="text-xs text-gray-600">Escolaridade</span>
                      </div>
                      <div className="font-bold text-gray-900">{selectedCandidate.education_level}</div>
                    </div>
                  )}

                  {selectedCandidate.salary_expectation && (
                    <div className="glass-card p-4 rounded-xl">
                      <div className="flex items-center gap-2 mb-2">
                        <DollarSign className="w-4 h-4 text-blue-600" />
                        <span className="text-xs text-gray-600">Pretensão</span>
                      </div>
                      <div className="font-bold text-gray-900">R$ {parseFloat(selectedCandidate.salary_expectation).toFixed(2)}</div>
                    </div>
                  )}
                </div>

                {selectedCandidate.experience && (
                  <div className="glass-card p-5 rounded-xl">
                    <h3 className="font-bold text-gray-900 mb-2">Experiência</h3>
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{selectedCandidate.experience}</p>
                  </div>
                )}

                {selectedCandidate.interview_notes && (
                  <div className="glass-card p-5 rounded-xl bg-purple-50">
                    <h3 className="font-bold text-purple-900 mb-2">Anotações das Entrevistas</h3>
                    <p className="text-purple-800 leading-relaxed whitespace-pre-wrap">{selectedCandidate.interview_notes}</p>
                  </div>
                )}

                {selectedCandidate.resume_url && (
                  <a href={selectedCandidate.resume_url} target="_blank" rel="noopener noreferrer">
                    <Button className="w-full glass-button-primary">
                      <FileText className="w-5 h-5 mr-2" />
                      Visualizar Currículo
                    </Button>
                  </a>
                )}
              </div>

              <div className="flex justify-end pt-6 mt-6 border-t border-gray-200">
                <Button onClick={() => setShowDetailDialog(false)} className="glass-button-primary">
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