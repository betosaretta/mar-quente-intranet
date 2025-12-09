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
import { Target, Coins } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function SuggestionsManagement() {
  const [suggestions, setSuggestions] = useState([]);
  const [selectedSuggestion, setSelectedSuggestion] = useState(null);
  const [showResponseDialog, setShowResponseDialog] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [newStatus, setNewStatus] = useState("");
  const [pointsToAward, setPointsToAward] = useState(0);

  useEffect(() => {
    loadSuggestions();
  }, []);

  const loadSuggestions = async () => {
    try {
      const data = await base44.entities.Suggestion.list("-created_date");
      setSuggestions(data);
    } catch (error) {
      console.error("Erro ao carregar sugestões:", error);
    }
  };

  const handleRespond = (suggestion) => {
    setSelectedSuggestion(suggestion);
    setFeedback(suggestion.feedback || "");
    setNewStatus(suggestion.status);
    setPointsToAward(suggestion.points_awarded || 0);
    setShowResponseDialog(true);
  };

  const handleSaveResponse = async () => {
    try {
      await base44.entities.Suggestion.update(selectedSuggestion.id, {
        feedback,
        status: newStatus,
        points_awarded: pointsToAward
      });
      setShowResponseDialog(false);
      await loadSuggestions();
    } catch (error) {
      console.error("Erro ao salvar resposta:", error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Implementada': return 'bg-green-100 text-green-800';
      case 'Aprovada': return 'bg-blue-100 text-blue-800';
      case 'Em Análise': return 'bg-yellow-100 text-yellow-800';
      case 'Rejeitada': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="glass-card p-6 rounded-2xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold glass-text">Gestão de Melhorias</h2>
            <p className="glass-text-muted mt-1">{suggestions.length} sugestões recebidas</p>
          </div>
        </div>

        <div className="grid gap-4">
          {suggestions.map(suggestion => (
            <div key={suggestion.id} className="glass-card p-5 rounded-xl">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-bold glass-text">{suggestion.title}</h3>
                    <Badge className={getStatusColor(suggestion.status)}>{suggestion.status}</Badge>
                    <Badge variant="outline">{suggestion.category}</Badge>
                  </div>
                  <p className="glass-text-muted text-sm mb-2">{suggestion.description}</p>
                  <div className="flex items-center gap-4 glass-text-muted text-xs">
                    <span>Por: <strong>{suggestion.created_by}</strong></span>
                    <span>{format(new Date(suggestion.created_date), "dd/MM/yyyy", { locale: ptBR })}</span>
                    {suggestion.points_awarded > 0 && (
                      <span className="flex items-center gap-1 text-amber-600 font-semibold">
                        <Coins className="w-3 h-3" />
                        {suggestion.points_awarded} moedas
                      </span>
                    )}
                  </div>
                </div>
                <Button onClick={() => handleRespond(suggestion)} className="glass-button-primary">
                  <Target className="w-4 h-4 mr-2" />
                  Avaliar
                </Button>
              </div>
              {suggestion.feedback && (
                <div className="mt-3 p-3 bg-blue-50 rounded-lg border-2 border-blue-200">
                  <div className="font-semibold text-blue-900 text-sm mb-1">Feedback da Gestão:</div>
                  <p className="text-blue-800 text-sm">{suggestion.feedback}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <Dialog open={showResponseDialog} onOpenChange={setShowResponseDialog}>
        <DialogContent className="glass-modal max-w-2xl p-0">
          <div className="p-8">
            <DialogHeader className="mb-6">
              <h2 className="modal-title">Avaliar Sugestão</h2>
              {selectedSuggestion && (
                <p className="modal-description">{selectedSuggestion.title}</p>
              )}
            </DialogHeader>

            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="glass-label">Status</Label>
                  <Select value={newStatus} onValueChange={setNewStatus}>
                    <SelectTrigger className="glass-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Nova">Nova</SelectItem>
                      <SelectItem value="Em Análise">Em Análise</SelectItem>
                      <SelectItem value="Aprovada">Aprovada</SelectItem>
                      <SelectItem value="Implementada">Implementada</SelectItem>
                      <SelectItem value="Rejeitada">Rejeitada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="glass-label">Moedas a Conceder</Label>
                  <Input
                    type="number"
                    value={pointsToAward}
                    onChange={(e) => setPointsToAward(parseInt(e.target.value))}
                    className="glass-input"
                  />
                </div>
              </div>

              <div>
                <Label className="glass-label">Feedback</Label>
                <Textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  className="glass-textarea"
                  rows={5}
                  placeholder="Escreva seu feedback sobre a sugestão..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-gray-200">
              <Button variant="ghost" onClick={() => setShowResponseDialog(false)} className="glass-button-secondary">
                Cancelar
              </Button>
              <Button onClick={handleSaveResponse} className="glass-button-primary">
                Salvar Avaliação
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}