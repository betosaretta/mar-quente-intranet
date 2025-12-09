import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
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
} from "@/components/ui/dialog";
import { Search, Send, User, Phone, Mail } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function HRRequestsManagement() {
  const [requests, setRequests] = useState([]);
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("Todos");
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showResponseDialog, setShowResponseDialog] = useState(false);
  const [response, setResponse] = useState("");
  const [newStatus, setNewStatus] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [requestsData, usersData] = await Promise.all([
        base44.entities.HRRequest.list("-created_date"),
        base44.entities.User.list()
      ]);
      setRequests(requestsData);
      setUsers(usersData);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    }
  };

  const getUserInfo = (email) => {
    return users.find(u => u.email === email) || { full_name: email, phone: '-', position: '-' };
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
      await loadData();
    } catch (error) {
      console.error("Erro ao salvar resposta:", error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Aprovado': return 'bg-green-100 text-green-800';
      case 'Rejeitado': return 'bg-red-100 text-red-800';
      case 'Em Análise': return 'bg-yellow-100 text-yellow-800';
      case 'Concluído': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredRequests = requests.filter(r => {
    const userInfo = getUserInfo(r.created_by);
    const matchesSearch = r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         r.created_by.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         userInfo.full_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "Todos" || r.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="glass-card p-6 rounded-2xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold glass-text">Gestão de Solicitações RH</h2>
            <p className="glass-text-muted mt-1">{requests.length} solicitações totais</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 glass-text-muted" />
            <Input
              placeholder="Buscar solicitações..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 glass-input"
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="glass-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Todos">Todos os Status</SelectItem>
              <SelectItem value="Pendente">Pendente</SelectItem>
              <SelectItem value="Em Análise">Em Análise</SelectItem>
              <SelectItem value="Aprovado">Aprovado</SelectItem>
              <SelectItem value="Rejeitado">Rejeitado</SelectItem>
              <SelectItem value="Concluído">Concluído</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-4">
          {filteredRequests.map(request => {
            const userInfo = getUserInfo(request.created_by);
            return (
              <div key={request.id} className="glass-card p-5 rounded-xl">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="font-bold glass-text">{request.title}</h3>
                      <Badge className={getStatusColor(request.status)}>{request.status}</Badge>
                      <Badge variant="outline">{request.category}</Badge>
                      {request.priority && request.priority !== 'Normal' && (
                        <Badge variant="outline" className="text-xs">{request.priority}</Badge>
                      )}
                    </div>

                    {/* Informações do Solicitante */}
                    <div className="glass-card p-4 rounded-lg bg-blue-50/30 border-2 border-blue-200/50 mb-3">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-blue-600" />
                          <div>
                            <div className="text-xs text-blue-600 font-semibold">Solicitante</div>
                            <div className="font-bold text-blue-900">{userInfo.full_name}</div>
                            {userInfo.position && <div className="text-xs text-blue-700">{userInfo.position}</div>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-blue-600" />
                          <div>
                            <div className="text-xs text-blue-600 font-semibold">Telefone</div>
                            <div className="font-bold text-blue-900">{userInfo.phone || userInfo.mobile_phone || '-'}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-blue-600" />
                          <div>
                            <div className="text-xs text-blue-600 font-semibold">Email</div>
                            <div className="font-bold text-blue-900 text-sm truncate">{request.created_by}</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <p className="glass-text-muted text-sm mb-2 leading-relaxed">{request.description}</p>
                    
                    <div className="flex items-center gap-4 glass-text-muted text-xs">
                      <span>{format(new Date(request.created_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
                    </div>
                  </div>
                  <Button onClick={() => handleRespond(request)} className="glass-button-primary">
                    <Send className="w-4 h-4 mr-2" />
                    Responder
                  </Button>
                </div>
                {request.response && (
                  <div className="mt-3 p-3 bg-green-50 rounded-lg border-2 border-green-200">
                    <div className="font-semibold text-green-900 text-sm mb-1">✓ Resposta do RH:</div>
                    <p className="text-green-800 text-sm">{request.response}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {filteredRequests.length === 0 && (
          <div className="text-center py-12 glass-card rounded-2xl">
            <Search className="w-12 h-12 glass-text-muted mx-auto mb-3 opacity-50" />
            <p className="glass-text-muted">Nenhuma solicitação encontrada.</p>
          </div>
        )}
      </div>

      <Dialog open={showResponseDialog} onOpenChange={setShowResponseDialog}>
        <DialogContent className="glass-modal max-w-2xl p-0">
          <div className="p-8">
            <DialogHeader className="mb-6">
              <h2 className="modal-title">Responder Solicitação</h2>
              {selectedRequest && (
                <>
                  <p className="modal-description">{selectedRequest.title}</p>
                  <div className="glass-card p-3 rounded-lg bg-blue-50 mt-3">
                    <div className="text-sm font-bold text-blue-900">
                      Solicitante: {getUserInfo(selectedRequest.created_by).full_name}
                    </div>
                    <div className="text-xs text-blue-700">
                      {getUserInfo(selectedRequest.created_by).position}
                    </div>
                  </div>
                </>
              )}
            </DialogHeader>

            <div className="space-y-5">
              <div>
                <Label className="glass-label">Novo Status</Label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger className="glass-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pendente">Pendente</SelectItem>
                    <SelectItem value="Em Análise">Em Análise</SelectItem>
                    <SelectItem value="Aprovado">Aprovado</SelectItem>
                    <SelectItem value="Rejeitado">Rejeitado</SelectItem>
                    <SelectItem value="Concluído">Concluído</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="glass-label">Resposta/Feedback</Label>
                <Textarea
                  value={response}
                  onChange={(e) => setResponse(e.target.value)}
                  className="glass-textarea"
                  rows={5}
                  placeholder="Escreva sua resposta..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-gray-200">
              <Button variant="ghost" onClick={() => setShowResponseDialog(false)} className="glass-button-secondary">
                Cancelar
              </Button>
              <Button onClick={handleSaveResponse} className="glass-button-primary">
                Salvar Resposta
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}