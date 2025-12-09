import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import {
  Shield,
  Eye,
  FileText,
  Download
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
  DialogTitle,
} from "@/components/ui/dialog";
import { format } from "date-fns";

export default function ComplaintsManagement() {
  const [complaints, setComplaints] = useState([]);
  const [filteredComplaints, setFilteredComplaints] = useState([]);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  const [filterStatus, setFilterStatus] = useState("Todas");
  const [searchTerm, setSearchTerm] = useState("");
  
  const [updateData, setUpdateData] = useState({
    status: "",
    admin_notes: "",
    investigator: "",
    investigation_start_date: "",
    investigation_end_date: "",
    findings: "",
    actions_taken: "",
    resolution_summary: "",
    timeline_action: "",
    timeline_description: ""
  });

  useEffect(() => {
    loadComplaints();
  }, []);

  useEffect(() => {
    let filtered = complaints;

    if (filterStatus !== "Todas") {
      filtered = filtered.filter(c => c.status === filterStatus);
    }

    if (searchTerm) {
      filtered = filtered.filter(c =>
        c.protocol_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.category?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredComplaints(filtered);
  }, [complaints, filterStatus, searchTerm]);

  const loadComplaints = async () => {
    try {
      const data = await base44.entities.AnonymousComplaint.list('-created_date');
      setComplaints(data);
    } catch (error) {
      console.error("Erro ao carregar denúncias:", error);
    }
  };

  const handleUpdateComplaint = async () => {
    if (!updateData.timeline_action) {
      alert("Preencha pelo menos uma ação na linha do tempo");
      return;
    }

    try {
      const newTimeline = [...(selectedComplaint.timeline || []), {
        date: new Date().toISOString(),
        action: updateData.timeline_action,
        description: updateData.timeline_description
      }];

      const updatedData = {
        status: updateData.status || selectedComplaint.status,
        admin_notes: updateData.admin_notes || selectedComplaint.admin_notes,
        investigator: updateData.investigator || selectedComplaint.investigator,
        investigation_start_date: updateData.investigation_start_date || selectedComplaint.investigation_start_date,
        investigation_end_date: updateData.investigation_end_date || selectedComplaint.investigation_end_date,
        findings: updateData.findings || selectedComplaint.findings,
        actions_taken: updateData.actions_taken || selectedComplaint.actions_taken,
        resolution_summary: updateData.resolution_summary || selectedComplaint.resolution_summary,
        timeline: newTimeline
      };

      await base44.entities.AnonymousComplaint.update(selectedComplaint.id, updatedData);
      
      setShowUpdateDialog(false);
      setUpdateData({
        status: "",
        admin_notes: "",
        investigator: "",
        investigation_start_date: "",
        investigation_end_date: "",
        findings: "",
        actions_taken: "",
        resolution_summary: "",
        timeline_action: "",
        timeline_description: ""
      });
      await loadComplaints();
    } catch (error) {
      console.error("Erro ao atualizar denúncia:", error);
      alert("Erro ao atualizar denúncia");
    }
  };

  const generateReport = () => {
    const csv = [
      ["Protocolo", "Data", "Categoria", "Status", "Investigador", "Resolução"].join(","),
      ...filteredComplaints.map(c => [
        c.protocol_number,
        format(new Date(c.created_date), "dd/MM/yyyy"),
        c.category,
        c.status,
        c.investigator || "-",
        c.resolution_summary ? "Sim" : "Não"
      ].join(","))
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `relatorio-denuncias-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
  };

  const getStatusColor = (status) => {
    switch(status) {
      case "Nova": return "bg-blue-100 text-blue-800";
      case "Em Análise": return "bg-yellow-100 text-yellow-800";
      case "Em Investigação": return "bg-orange-100 text-orange-800";
      case "Resolvida": return "bg-green-100 text-green-800";
      case "Arquivada": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const stats = {
    total: complaints.length,
    novas: complaints.filter(c => c.status === "Nova").length,
    investigacao: complaints.filter(c => c.status === "Em Investigação").length,
    resolvidas: complaints.filter(c => c.status === "Resolvida").length
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestão de Denúncias Anônimas</h2>
          <p className="text-gray-600 mt-1">Canal de Ética e Compliance</p>
        </div>
        <Button onClick={generateReport} className="glass-button-primary">
          <Download className="w-4 h-4 mr-2" />
          Gerar Relatório
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card p-5 rounded-xl">
          <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
          <div className="text-sm text-gray-600 mt-1 font-semibold">Total de Denúncias</div>
        </div>
        <div className="glass-card p-5 rounded-xl">
          <div className="text-3xl font-bold text-blue-600">{stats.novas}</div>
          <div className="text-sm text-gray-600 mt-1 font-semibold">Novas</div>
        </div>
        <div className="glass-card p-5 rounded-xl">
          <div className="text-3xl font-bold text-orange-600">{stats.investigacao}</div>
          <div className="text-sm text-gray-600 mt-1 font-semibold">Em Investigação</div>
        </div>
        <div className="glass-card p-5 rounded-xl">
          <div className="text-3xl font-bold text-green-600">{stats.resolvidas}</div>
          <div className="text-sm text-gray-600 mt-1 font-semibold">Resolvidas</div>
        </div>
      </div>

      {/* Filtros */}
      <div className="glass-card p-4 rounded-xl">
        <div className="grid md:grid-cols-2 gap-4">
          <Input
            placeholder="Buscar por protocolo, título ou categoria..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="glass-input"
          />
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="glass-select">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Todas">Todas</SelectItem>
              <SelectItem value="Nova">Nova</SelectItem>
              <SelectItem value="Em Análise">Em Análise</SelectItem>
              <SelectItem value="Em Investigação">Em Investigação</SelectItem>
              <SelectItem value="Resolvida">Resolvida</SelectItem>
              <SelectItem value="Arquivada">Arquivada</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Lista de Denúncias */}
      <div className="space-y-4">
        {filteredComplaints.map(complaint => (
          <div key={complaint.id} className="glass-card p-5 rounded-xl hover:shadow-lg transition-all">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <Shield className="w-5 h-5 text-red-600" />
                  <h3 className="font-bold text-gray-900 text-lg">{complaint.title}</h3>
                  <Badge className={getStatusColor(complaint.status)}>
                    {complaint.status}
                  </Badge>
                </div>
                
                <div className="grid md:grid-cols-4 gap-3 text-sm mt-3">
                  <div>
                    <span className="text-gray-600">Protocolo:</span>
                    <span className="font-bold text-blue-600 ml-2">{complaint.protocol_number}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Categoria:</span>
                    <span className="font-semibold text-gray-900 ml-2">{complaint.category}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Data:</span>
                    <span className="font-semibold text-gray-900 ml-2">
                      {format(new Date(complaint.created_date), "dd/MM/yyyy")}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Local:</span>
                    <span className="font-semibold text-gray-900 ml-2">{complaint.location}</span>
                  </div>
                </div>

                {complaint.investigator && (
                  <div className="mt-3 text-sm">
                    <span className="text-gray-600">Investigador:</span>
                    <span className="font-semibold text-gray-900 ml-2">{complaint.investigator}</span>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <Button
                  onClick={() => {
                    setSelectedComplaint(complaint);
                    setShowDetailDialog(true);
                  }}
                  size="sm"
                  className="glass-button-secondary"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Ver
                </Button>
                <Button
                  onClick={() => {
                    setSelectedComplaint(complaint);
                    setUpdateData({
                      status: complaint.status,
                      admin_notes: complaint.admin_notes || "",
                      investigator: complaint.investigator || "",
                      investigation_start_date: complaint.investigation_start_date || "",
                      investigation_end_date: complaint.investigation_end_date || "",
                      findings: complaint.findings || "",
                      actions_taken: complaint.actions_taken || "",
                      resolution_summary: complaint.resolution_summary || "",
                      timeline_action: "",
                      timeline_description: ""
                    });
                    setShowUpdateDialog(true);
                  }}
                  size="sm"
                  className="glass-button-primary"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Atualizar
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Dialog: Detalhes */}
      {selectedComplaint && (
        <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
          <DialogContent className="glass-modal max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Detalhes da Denúncia - {selectedComplaint.protocol_number}</DialogTitle>
            </DialogHeader>

            <div className="space-y-5 p-6">
              <div className="glass-card p-5 rounded-xl">
                <h3 className="font-bold text-gray-900 mb-3">{selectedComplaint.title}</h3>
                <p className="text-gray-700 leading-relaxed">{selectedComplaint.description}</p>
              </div>

              {selectedComplaint.timeline && selectedComplaint.timeline.length > 0 && (
                <div className="glass-card p-5 rounded-xl">
                  <h3 className="font-bold text-gray-900 mb-4">Linha do Tempo</h3>
                  <div className="space-y-4">
                    {selectedComplaint.timeline.map((event, index) => (
                      <div key={index} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className="w-3 h-3 rounded-full bg-blue-600"></div>
                          {index < selectedComplaint.timeline.length - 1 && (
                            <div className="w-0.5 h-full bg-blue-200 mt-2"></div>
                          )}
                        </div>
                        <div className="flex-1 pb-4">
                          <div className="font-bold text-gray-900">{event.action}</div>
                          <div className="text-sm text-gray-600 mt-1">
                            {format(new Date(event.date), "dd/MM/yyyy HH:mm")}
                          </div>
                          {event.description && (
                            <div className="text-sm text-gray-700 mt-2">{event.description}</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedComplaint.resolution_summary && (
                <div className="glass-card p-5 rounded-xl bg-green-50 border-2 border-green-200">
                  <h3 className="font-bold text-green-900 mb-2">Resolução</h3>
                  <p className="text-green-800">{selectedComplaint.resolution_summary}</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Dialog: Atualizar */}
      {selectedComplaint && (
        <Dialog open={showUpdateDialog} onOpenChange={setShowUpdateDialog}>
          <DialogContent className="glass-modal max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Atualizar Denúncia - {selectedComplaint.protocol_number}</DialogTitle>
            </DialogHeader>

            <div className="space-y-5 p-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label className="glass-label">Status</Label>
                  <Select
                    value={updateData.status}
                    onValueChange={(value) => setUpdateData(prev => ({ ...prev, status: value }))}
                  >
                    <SelectTrigger className="glass-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Nova">Nova</SelectItem>
                      <SelectItem value="Em Análise">Em Análise</SelectItem>
                      <SelectItem value="Em Investigação">Em Investigação</SelectItem>
                      <SelectItem value="Resolvida">Resolvida</SelectItem>
                      <SelectItem value="Arquivada">Arquivada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="glass-label">Investigador Responsável</Label>
                  <Input
                    value={updateData.investigator}
                    onChange={(e) => setUpdateData(prev => ({ ...prev, investigator: e.target.value }))}
                    className="glass-input"
                  />
                </div>
              </div>

              <div>
                <Label className="glass-label">Nova Ação na Linha do Tempo *</Label>
                <Input
                  value={updateData.timeline_action}
                  onChange={(e) => setUpdateData(prev => ({ ...prev, timeline_action: e.target.value }))}
                  className="glass-input"
                  placeholder="Ex: Iniciada investigação, Entrevistas realizadas, etc."
                />
              </div>

              <div>
                <Label className="glass-label">Descrição da Ação</Label>
                <Textarea
                  value={updateData.timeline_description}
                  onChange={(e) => setUpdateData(prev => ({ ...prev, timeline_description: e.target.value }))}
                  className="glass-textarea"
                  rows={3}
                  placeholder="Detalhes sobre a ação realizada..."
                />
              </div>

              <div>
                <Label className="glass-label">Conclusões da Investigação</Label>
                <Textarea
                  value={updateData.findings}
                  onChange={(e) => setUpdateData(prev => ({ ...prev, findings: e.target.value }))}
                  className="glass-textarea"
                  rows={4}
                />
              </div>

              <div>
                <Label className="glass-label">Ações Tomadas / Medidas Disciplinares</Label>
                <Textarea
                  value={updateData.actions_taken}
                  onChange={(e) => setUpdateData(prev => ({ ...prev, actions_taken: e.target.value }))}
                  className="glass-textarea"
                  rows={3}
                />
              </div>

              <div>
                <Label className="glass-label">Resumo da Resolução</Label>
                <Textarea
                  value={updateData.resolution_summary}
                  onChange={(e) => setUpdateData(prev => ({ ...prev, resolution_summary: e.target.value }))}
                  className="glass-textarea"
                  rows={3}
                  placeholder="Este texto será visível ao denunciante no acompanhamento"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <Button
                  variant="ghost"
                  onClick={() => setShowUpdateDialog(false)}
                  className="glass-button-secondary"
                >
                  Cancelar
                </Button>
                <Button onClick={handleUpdateComplaint} className="glass-button-primary">
                  Salvar Atualização
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}