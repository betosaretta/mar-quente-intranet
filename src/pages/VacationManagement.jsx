import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { User } from "@/entities/User";
import {
  Calendar,
  Plus,
  CheckCircle,
  Search,
  Eye,
  DollarSign
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
import { format, differenceInDays, addDays, addYears } from "date-fns";

export default function VacationManagement() {
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [vacations, setVacations] = useState([]);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [selectedVacation, setSelectedVacation] = useState(null);
  const [filterStatus, setFilterStatus] = useState("Todas");
  const [filterAlert, setFilterAlert] = useState("Todos");
  const [searchTerm, setSearchTerm] = useState("");

  const [newVacation, setNewVacation] = useState({
    employee_email: "",
    vacation_start_date: "",
    vacation_end_date: "",
    total_days: 30,
    acquisition_period_start: "",
    acquisition_period_end: "",
    advance_payment: false,
    advance_days: 0,
    sell_days: 0,
    manager_comments: ""
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [currentUser, allUsers, vacationData] = await Promise.all([
        User.me(),
        base44.entities.User.list(),
        base44.entities.VacationRequest.list("-created_date")
      ]);

      setUser(currentUser);
      setUsers(allUsers);

      // Calcular alertas
      const vacationsWithAlerts = vacationData.map(v => {
        if (v.status === 'Concluída') return v;
        
        const periodEnd = new Date(v.acquisition_period_end);
        const limit = addYears(periodEnd, 1);
        const daysUntil = differenceInDays(limit, new Date());

        return {
          ...v,
          days_until_limit: daysUntil,
          alert_level: daysUntil <= 30 ? 'urgent' : daysUntil <= 90 ? 'warning' : 'normal'
        };
      });

      setVacations(vacationsWithAlerts);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    }
  };

  const handleCreateVacation = async () => {
    try {
      const employee = users.find(u => u.email === newVacation.employee_email);
      
      await base44.entities.VacationRequest.create({
        ...newVacation,
        employee_name: employee?.full_name || newVacation.employee_email,
        department: employee?.department,
        position: employee?.position,
        manager_email: user.email,
        status: "Pendente"
      });

      setShowNewDialog(false);
      setNewVacation({
        employee_email: "",
        vacation_start_date: "",
        vacation_end_date: "",
        total_days: 30,
        acquisition_period_start: "",
        acquisition_period_end: "",
        advance_payment: false,
        advance_days: 0,
        sell_days: 0,
        manager_comments: ""
      });
      await loadData();
    } catch (error) {
      console.error("Erro ao criar férias:", error);
      alert("Erro ao criar solicitação de férias");
    }
  };

  const handleApprove = async (vacation, approvalType) => {
    try {
      const updateData = approvalType === 'manager' 
        ? { 
            status: "Aprovada pelo Gestor",
            manager_approval_date: new Date().toISOString()
          }
        : {
            status: "Aprovada pelo RH",
            hr_approval_date: new Date().toISOString()
          };

      await base44.entities.VacationRequest.update(vacation.id, updateData);
      await loadData();
    } catch (error) {
      console.error("Erro ao aprovar:", error);
    }
  };

  const handleReject = async (vacation, reason) => {
    try {
      await base44.entities.VacationRequest.update(vacation.id, {
        status: "Rejeitada",
        rejection_reason: reason
      });
      await loadData();
    } catch (error) {
      console.error("Erro ao rejeitar:", error);
    }
  };

  const calculateDates = (startDate) => {
    if (!startDate) return;
    
    const start = new Date(startDate);
    const days = parseInt(newVacation.total_days) - parseInt(newVacation.sell_days || 0);
    const end = addDays(start, days - 1);
    
    setNewVacation(prev => ({
      ...prev,
      vacation_end_date: format(end, 'yyyy-MM-dd')
    }));
  };

  const filteredVacations = vacations.filter(v => {
    const statusMatch = filterStatus === "Todas" || v.status === filterStatus;
    const alertMatch = filterAlert === "Todos" || v.alert_level === filterAlert;
    const searchMatch = !searchTerm || 
      v.employee_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.department?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return statusMatch && alertMatch && searchMatch;
  });

  const getAlertBadge = (alertLevel, daysUntil) => {
    if (alertLevel === 'urgent') {
      return <Badge className="bg-red-500 text-white animate-pulse">🚨 URGENTE - {daysUntil} dias</Badge>;
    }
    if (alertLevel === 'warning') {
      return <Badge className="bg-yellow-500 text-white">⚠️ Atenção - {daysUntil} dias</Badge>;
    }
    return null;
  };

  const stats = {
    pending: vacations.filter(v => v.status === 'Pendente').length,
    urgent: vacations.filter(v => v.alert_level === 'urgent').length,
    approved: vacations.filter(v => v.status?.includes('Aprovada')).length,
    total: vacations.length
  };

  const isManager = user && (user.role === 'admin' || user.department === 'RH' || user.team_members?.length > 0);

  return (
    <div className="space-y-6">
      {/* Header com Alertas */}
      <div className="glass-card p-6 rounded-2xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold glass-text flex items-center gap-3">
              <Calendar className="w-7 h-7 text-blue-600" />
              Gestão de Férias
            </h1>
            <p className="glass-text-muted mt-1">Sistema completo de controle de férias</p>
          </div>
          {isManager && (
            <Button onClick={() => setShowNewDialog(true)} className="glass-button-primary">
              <Plus className="w-5 h-5 mr-2" />
              Nova Solicitação
            </Button>
          )}
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="glass p-4 rounded-xl text-center">
            <div className="text-3xl font-bold text-red-600">{stats.urgent}</div>
            <div className="text-sm glass-text-muted mt-1 font-semibold">Urgentes</div>
          </div>
          <div className="glass p-4 rounded-xl text-center">
            <div className="text-3xl font-bold text-yellow-600">{stats.pending}</div>
            <div className="text-sm glass-text-muted mt-1 font-semibold">Pendentes</div>
          </div>
          <div className="glass p-4 rounded-xl text-center">
            <div className="text-3xl font-bold text-green-600">{stats.approved}</div>
            <div className="text-sm glass-text-muted mt-1 font-semibold">Aprovadas</div>
          </div>
          <div className="glass p-4 rounded-xl text-center">
            <div className="text-3xl font-bold text-blue-600">{stats.total}</div>
            <div className="text-sm glass-text-muted mt-1 font-semibold">Total</div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="glass-card p-4 rounded-2xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 glass-text-muted" />
            <Input
              placeholder="Buscar colaborador..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 glass-input"
            />
          </div>

          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="glass-select">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Todas">Todas</SelectItem>
              <SelectItem value="Pendente">Pendente</SelectItem>
              <SelectItem value="Aprovada pelo Gestor">Aprovada pelo Gestor</SelectItem>
              <SelectItem value="Aprovada pelo RH">Aprovada pelo RH</SelectItem>
              <SelectItem value="Rejeitada">Rejeitada</SelectItem>
              <SelectItem value="Concluída">Concluída</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterAlert} onValueChange={setFilterAlert}>
            <SelectTrigger className="glass-select">
              <SelectValue placeholder="Alertas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Todos">Todos os Alertas</SelectItem>
              <SelectItem value="urgent">🚨 Urgentes</SelectItem>
              <SelectItem value="warning">⚠️ Atenção</SelectItem>
              <SelectItem value="normal">✅ Normal</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Lista de Férias */}
      <div className="space-y-4">
        {filteredVacations.map(vacation => (
          <div key={vacation.id} className="glass-card p-5 rounded-2xl">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-bold text-gray-900 text-lg">{vacation.employee_name}</h3>
                  {getAlertBadge(vacation.alert_level, vacation.days_until_limit)}
                </div>
                <p className="text-sm text-gray-600">{vacation.position} • {vacation.department}</p>
              </div>
              <Badge className={
                vacation.status === 'Aprovada pelo RH' ? 'bg-green-500 text-white' :
                vacation.status === 'Aprovada pelo Gestor' ? 'bg-blue-500 text-white' :
                vacation.status === 'Rejeitada' ? 'bg-red-500 text-white' :
                'bg-yellow-500 text-white'
              }>
                {vacation.status}
              </Badge>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              <div className="glass p-3 rounded-lg">
                <div className="text-xs text-gray-600 mb-1">Início</div>
                <div className="font-bold text-gray-900">{format(new Date(vacation.vacation_start_date), "dd/MM/yyyy")}</div>
              </div>
              <div className="glass p-3 rounded-lg">
                <div className="text-xs text-gray-600 mb-1">Fim</div>
                <div className="font-bold text-gray-900">{format(new Date(vacation.vacation_end_date), "dd/MM/yyyy")}</div>
              </div>
              <div className="glass p-3 rounded-lg">
                <div className="text-xs text-gray-600 mb-1">Total de Dias</div>
                <div className="font-bold text-gray-900">{vacation.total_days} dias</div>
              </div>
              {vacation.sell_days > 0 && (
                <div className="glass p-3 rounded-lg bg-green-50">
                  <div className="text-xs text-green-700 mb-1">Abono</div>
                  <div className="font-bold text-green-900">{vacation.sell_days} dias</div>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => {
                  setSelectedVacation(vacation);
                  setShowDetailDialog(true);
                }}
                size="sm"
                className="glass-button"
              >
                <Eye className="w-4 h-4 mr-2" />
                Detalhes
              </Button>

              {vacation.status === 'Pendente' && user?.email === vacation.manager_email && (
                <Button
                  onClick={() => handleApprove(vacation, 'manager')}
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Aprovar
                </Button>
              )}

              {vacation.status === 'Aprovada pelo Gestor' && (user?.department === 'RH' || user?.role === 'admin') && (
                <Button
                  onClick={() => handleApprove(vacation, 'rh')}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Aprovar RH
                </Button>
              )}
            </div>
          </div>
        ))}

        {filteredVacations.length === 0 && (
          <div className="text-center py-12 glass-card rounded-2xl">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhuma solicitação encontrada</h3>
            <p className="text-gray-600">
              {isManager ? "Clique em 'Nova Solicitação' para começar" : "Aguarde solicitações de férias"}
            </p>
          </div>
        )}
      </div>

      {/* Dialog: Nova Solicitação */}
      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent className="glass-modal max-w-3xl p-0 max-h-[90vh] overflow-y-auto">
          <div className="p-8">
            <DialogHeader className="mb-6">
              <h2 className="modal-title">Nova Solicitação de Férias</h2>
              <p className="modal-description">Preencha os dados do colaborador</p>
            </DialogHeader>

            <div className="space-y-5">
              <div>
                <Label className="glass-label">Colaborador</Label>
                <Select
                  value={newVacation.employee_email}
                  onValueChange={(value) => {
                    const employee = users.find(u => u.email === value);
                    setNewVacation(prev => ({
                      ...prev,
                      employee_email: value,
                      acquisition_period_start: employee?.admission_date || ''
                    }));
                  }}
                >
                  <SelectTrigger className="glass-select">
                    <SelectValue placeholder="Selecione o colaborador..." />
                  </SelectTrigger>
                  <SelectContent>
                    {users
                      .filter(u => user.role === 'admin' || user.department === 'RH' || user.team_members?.includes(u.email))
                      .map(u => (
                        <SelectItem key={u.id} value={u.email}>
                          {u.full_name} - {u.position}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="glass-label">Período Aquisitivo - Início</Label>
                  <Input
                    type="date"
                    value={newVacation.acquisition_period_start}
                    onChange={(e) => {
                      const start = new Date(e.target.value);
                      const end = addYears(start, 1);
                      setNewVacation(prev => ({
                        ...prev,
                        acquisition_period_start: e.target.value,
                        acquisition_period_end: format(addDays(end, -1), 'yyyy-MM-dd')
                      }));
                    }}
                    className="glass-input"
                  />
                </div>
                <div>
                  <Label className="glass-label">Período Aquisitivo - Fim</Label>
                  <Input
                    type="date"
                    value={newVacation.acquisition_period_end}
                    onChange={(e) => setNewVacation(prev => ({ ...prev, acquisition_period_end: e.target.value }))}
                    className="glass-input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="glass-label">Início das Férias</Label>
                  <Input
                    type="date"
                    value={newVacation.vacation_start_date}
                    onChange={(e) => {
                      setNewVacation(prev => ({ ...prev, vacation_start_date: e.target.value }));
                      calculateDates(e.target.value);
                    }}
                    className="glass-input"
                  />
                </div>
                <div>
                  <Label className="glass-label">Fim das Férias</Label>
                  <Input
                    type="date"
                    value={newVacation.vacation_end_date}
                    className="glass-input bg-gray-100"
                    disabled
                  />
                  <p className="helper-text">Calculado automaticamente</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="glass-label">Total de Dias de Férias</Label>
                  <Input
                    type="number"
                    min="1"
                    max="30"
                    value={newVacation.total_days}
                    onChange={(e) => {
                      setNewVacation(prev => ({ ...prev, total_days: parseInt(e.target.value) }));
                      calculateDates(newVacation.vacation_start_date);
                    }}
                    className="glass-input"
                  />
                </div>
                <div>
                  <Label className="glass-label">Vender Dias (Abono Pecuniário)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="10"
                    value={newVacation.sell_days}
                    onChange={(e) => {
                      setNewVacation(prev => ({ ...prev, sell_days: parseInt(e.target.value) }));
                      calculateDates(newVacation.vacation_start_date);
                    }}
                    className="glass-input"
                  />
                  <p className="helper-text">Máximo 10 dias (1/3 das férias)</p>
                </div>
              </div>

              <div className="glass-card p-4 rounded-xl">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newVacation.advance_payment}
                    onChange={(e) => setNewVacation(prev => ({ ...prev, advance_payment: e.target.checked }))}
                    className="w-5 h-5"
                  />
                  <div>
                    <div className="font-bold text-gray-900">Solicitar Adiantamento de 13º</div>
                    <p className="text-sm text-gray-600">50% do 13º salário</p>
                  </div>
                </label>
              </div>

              <div>
                <Label className="glass-label">Observações do Gestor</Label>
                <Textarea
                  value={newVacation.manager_comments}
                  onChange={(e) => setNewVacation(prev => ({ ...prev, manager_comments: e.target.value }))}
                  className="glass-textarea"
                  rows={3}
                  placeholder="Observações adicionais..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-gray-200">
              <Button variant="ghost" onClick={() => setShowNewDialog(false)} className="glass-button-secondary">
                Cancelar
              </Button>
              <Button
                onClick={handleCreateVacation}
                disabled={!newVacation.employee_email || !newVacation.vacation_start_date}
                className="glass-button-primary"
              >
                Criar Solicitação
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog: Detalhes */}
      {selectedVacation && (
        <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
          <DialogContent className="glass-modal max-w-2xl p-0 max-h-[90vh] overflow-y-auto">
            <div className="p-8">
              <DialogHeader className="mb-6">
                <h2 className="modal-title">Detalhes da Solicitação</h2>
              </DialogHeader>

              <div className="space-y-5">
                <div className="glass-card p-5 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                  <h3 className="text-xl font-bold mb-2">{selectedVacation.employee_name}</h3>
                  <p className="opacity-90">{selectedVacation.position} • {selectedVacation.department}</p>
                  {selectedVacation.alert_level !== 'normal' && (
                    <div className="mt-3 bg-white/20 rounded-lg p-3">
                      <div className="font-bold">⚠️ Limite em {selectedVacation.days_until_limit} dias!</div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="glass-card p-4 rounded-xl">
                    <div className="text-xs text-gray-600 mb-1">Início</div>
                    <div className="font-bold text-gray-900">{format(new Date(selectedVacation.vacation_start_date), "dd/MM/yyyy")}</div>
                  </div>
                  <div className="glass-card p-4 rounded-xl">
                    <div className="text-xs text-gray-600 mb-1">Fim</div>
                    <div className="font-bold text-gray-900">{format(new Date(selectedVacation.vacation_end_date), "dd/MM/yyyy")}</div>
                  </div>
                  <div className="glass-card p-4 rounded-xl">
                    <div className="text-xs text-gray-600 mb-1">Dias de Férias</div>
                    <div className="font-bold text-gray-900">{selectedVacation.total_days} dias</div>
                  </div>
                  {selectedVacation.sell_days > 0 && (
                    <div className="glass-card p-4 rounded-xl bg-green-50">
                      <div className="text-xs text-green-700 mb-1">Abono</div>
                      <div className="font-bold text-green-900">{selectedVacation.sell_days} dias</div>
                    </div>
                  )}
                </div>

                {selectedVacation.advance_payment && (
                  <div className="glass-card p-4 rounded-xl bg-blue-50 border border-blue-200">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-blue-600" />
                      <span className="font-bold text-blue-900">Adiantamento de 13º solicitado</span>
                    </div>
                  </div>
                )}

                {selectedVacation.manager_comments && (
                  <div className="glass-card p-4 rounded-xl">
                    <div className="font-bold text-gray-900 mb-2">Observações do Gestor</div>
                    <p className="text-gray-700">{selectedVacation.manager_comments}</p>
                  </div>
                )}

                {selectedVacation.hr_comments && (
                  <div className="glass-card p-4 rounded-xl">
                    <div className="font-bold text-gray-900 mb-2">Observações do RH</div>
                    <p className="text-gray-700">{selectedVacation.hr_comments}</p>
                  </div>
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