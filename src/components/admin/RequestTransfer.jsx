import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { User } from "@/entities/User";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowRight, UserX, Users, CheckCircle, AlertCircle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function RequestTransfer() {
  const [users, setUsers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [fromUser, setFromUser] = useState("");
  const [toUser, setToUser] = useState("");
  const [transferring, setTransferring] = useState(false);
  const [transferResult, setTransferResult] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [allUsers, allRequests] = await Promise.all([
        User.list(),
        base44.entities.HRRequest.list()
      ]);

      setUsers(allUsers);
      setRequests(allRequests);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    }
  };

  const handleTransfer = async () => {
    if (!fromUser || !toUser) {
      alert("Selecione os usuários de origem e destino");
      return;
    }

    setTransferring(true);
    setTransferResult(null);

    try {
      // Buscar todas as solicitações do usuário de origem
      const userRequests = requests.filter(r => r.assigned_to === fromUser);

      // Transferir cada solicitação
      await Promise.all(
        userRequests.map(req => 
          base44.entities.HRRequest.update(req.id, { assigned_to: toUser })
        )
      );

      setTransferResult({
        success: true,
        count: userRequests.length
      });

      await loadData();
      setFromUser("");
      setToUser("");
    } catch (error) {
      console.error("Erro ao transferir:", error);
      setTransferResult({
        success: false,
        error: "Erro ao transferir solicitações"
      });
    } finally {
      setTransferring(false);
    }
  };

  const fromUserRequests = requests.filter(r => r.assigned_to === fromUser);
  const selectedFromUser = users.find(u => u.email === fromUser);
  const selectedToUser = users.find(u => u.email === toUser);

  return (
    <div className="space-y-6">
      <div className="glass-card p-6 rounded-2xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-orange-500 flex items-center justify-center">
            <ArrowRight className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-lg">Transferência de Demandas</h3>
            <p className="text-sm text-gray-600">Reatribuir solicitações entre usuários</p>
          </div>
        </div>

        <div className="space-y-5">
          {/* Seleção de Usuários */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass-card p-5 rounded-xl bg-red-50/50">
              <Label className="glass-label mb-3 flex items-center gap-2">
                <UserX className="w-4 h-4 text-red-600" />
                De (Usuário Saindo)
              </Label>
              <Select value={fromUser} onValueChange={setFromUser}>
                <SelectTrigger className="glass-select">
                  <SelectValue placeholder="Selecione o usuário..." />
                </SelectTrigger>
                <SelectContent>
                  {users.map(u => (
                    <SelectItem key={u.id} value={u.email}>
                      {u.full_name} - {u.department}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedFromUser && (
                <div className="mt-4 p-4 glass rounded-xl">
                  <div className="flex items-center gap-3 mb-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={selectedFromUser.avatar_url} />
                      <AvatarFallback className="bg-gradient-to-br from-red-500 to-red-600 text-white font-bold">
                        {selectedFromUser.full_name?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-bold text-gray-900">{selectedFromUser.full_name}</div>
                      <div className="text-xs text-gray-600">{selectedFromUser.position}</div>
                    </div>
                  </div>
                  <Badge className="bg-red-100 text-red-800 font-bold">
                    {fromUserRequests.length} solicitações atribuídas
                  </Badge>
                </div>
              )}
            </div>

            <div className="glass-card p-5 rounded-xl bg-green-50/50">
              <Label className="glass-label mb-3 flex items-center gap-2">
                <Users className="w-4 h-4 text-green-600" />
                Para (Novo Responsável)
              </Label>
              <Select value={toUser} onValueChange={setToUser}>
                <SelectTrigger className="glass-select">
                  <SelectValue placeholder="Selecione o usuário..." />
                </SelectTrigger>
                <SelectContent>
                  {users.filter(u => u.email !== fromUser).map(u => (
                    <SelectItem key={u.id} value={u.email}>
                      {u.full_name} - {u.department}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedToUser && (
                <div className="mt-4 p-4 glass rounded-xl">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={selectedToUser.avatar_url} />
                      <AvatarFallback className="bg-gradient-to-br from-green-500 to-green-600 text-white font-bold">
                        {selectedToUser.full_name?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-bold text-gray-900">{selectedToUser.full_name}</div>
                      <div className="text-xs text-gray-600">{selectedToUser.position}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Preview da Transferência */}
          {fromUser && toUser && fromUserRequests.length > 0 && (
            <div className="glass-card p-5 rounded-xl border-2 border-blue-500">
              <div className="flex items-center gap-3 mb-4">
                <AlertCircle className="w-6 h-6 text-blue-600" />
                <div>
                  <div className="font-bold text-gray-900">Transferir {fromUserRequests.length} solicitações</div>
                  <div className="text-sm text-gray-600">De {selectedFromUser?.full_name} para {selectedToUser?.full_name}</div>
                </div>
              </div>

              <div className="space-y-2 max-h-40 overflow-y-auto">
                {fromUserRequests.map(req => (
                  <div key={req.id} className="flex items-center justify-between p-3 glass rounded-lg text-sm">
                    <span className="font-semibold text-gray-900">{req.title}</span>
                    <Badge variant="outline">{req.category}</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Resultado */}
          {transferResult && (
            <div className={`glass-card p-5 rounded-xl border-2 ${transferResult.success ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}`}>
              <div className="flex items-center gap-3">
                {transferResult.success ? (
                  <>
                    <CheckCircle className="w-8 h-8 text-green-600" />
                    <div>
                      <div className="font-bold text-green-900">Transferência Concluída!</div>
                      <div className="text-sm text-green-800">{transferResult.count} solicitações transferidas com sucesso</div>
                    </div>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-8 h-8 text-red-600" />
                    <div>
                      <div className="font-bold text-red-900">Erro na Transferência</div>
                      <div className="text-sm text-red-800">{transferResult.error}</div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Botão de Ação */}
          <div className="flex justify-end">
            <Button
              onClick={handleTransfer}
              disabled={!fromUser || !toUser || fromUserRequests.length === 0 || transferring}
              className="glass-button-primary"
            >
              {transferring ? (
                "Transferindo..."
              ) : (
                <>
                  <ArrowRight className="w-5 h-5 mr-2" />
                  Transferir {fromUserRequests.length} Solicitações
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}