import React, { useState, useEffect } from "react";
import { Suggestion } from "@/entities/Suggestion";
import { User } from "@/entities/User";
import { 
  Award, 
  Plus, 
  Coins, 
  Search,
  CheckCircle,
  Clock,
  XCircle,
  Star,
  Trophy,
  Target,
  Gift,
  Zap,
  Crown,
  Loader2,
  X // Added X icon for closing dialog
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
  DialogTrigger,
  DialogClose // Added DialogClose for custom close button
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Suggestions() {
  const [suggestions, setSuggestions] = useState([]);
  const [filteredSuggestions, setFilteredSuggestions] = useState([]);
  const [user, setUser] = useState(null);
  const [showNewSuggestionDialog, setShowNewSuggestionDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todas");
  const [selectedStatus, setSelectedStatus] = useState("Todos");
  const [newSuggestion, setNewSuggestion] = useState({
    title: "",
    description: "",
    category: ""
  });

  const categories = ["Todas", "Melhoria", "Problema", "Nova Funcionalidade", "Processo", "Ambiente", "Benefícios", "Outros"];
  const statuses = ["Todos", "Nova", "Em Análise", "Aprovada", "Implementada", "Rejeitada"];

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    let filtered = suggestions;

    if (searchTerm) {
      filtered = filtered.filter(suggestion => 
        suggestion.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        suggestion.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory !== "Todas") {
      filtered = filtered.filter(suggestion => suggestion.category === selectedCategory);
    }

    if (selectedStatus !== "Todos") {
      filtered = filtered.filter(suggestion => suggestion.status === selectedStatus);
    }

    setFilteredSuggestions(filtered);
  }, [suggestions, searchTerm, selectedCategory, selectedStatus]);

  const loadData = async () => {
    try {
      const currentUser = await User.me();
      setUser(currentUser);
      
      const suggestionsData = await Suggestion.filter({ created_by: currentUser.email }, '-created_date');
      setSuggestions(suggestionsData);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    }
  };

  const handleSubmitSuggestion = async () => {
    if (!newSuggestion.title.trim() || !newSuggestion.description.trim() || !newSuggestion.category) {
      return;
    }

    try {
      await Suggestion.create(newSuggestion);
      setNewSuggestion({
        title: "",
        description: "",
        category: ""
      });
      setShowNewSuggestionDialog(false);
      await loadData();
    } catch (error) {
      console.error("Erro ao criar sugestão:", error);
    }
  };

  const getStatusClasses = (status) => {
    switch (status) {
      case 'Implementada': return { bg: 'bg-green-500/10', text: 'text-green-700', border: 'border-green-500/20', icon: 'bg-green-500' };
      case 'Aprovada': return { bg: 'bg-blue-500/10', text: 'text-blue-700', border: 'border-blue-500/20', icon: 'bg-blue-500' };
      case 'Em Análise': return { bg: 'bg-yellow-500/10', text: 'text-yellow-700', border: 'border-yellow-500/20', icon: 'bg-yellow-500' };
      case 'Rejeitada': return { bg: 'bg-red-500/10', text: 'text-red-700', border: 'border-red-500/20', icon: 'bg-red-500' };
      case 'Nova': return { bg: 'bg-purple-500/10', text: 'text-purple-700', border: 'border-purple-500/20', icon: 'bg-purple-500' };
      default: return { bg: 'bg-slate-500/10', text: 'text-slate-700', border: 'border-slate-500/20', icon: 'bg-slate-500' };
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Implementada': return CheckCircle;
      case 'Aprovada': return Star;
      case 'Em Análise': return Loader2;
      case 'Rejeitada': return XCircle;
      case 'Nova': return Award;
      default: return Award;
    }
  };

  const getPointsForStatus = (status) => {
    switch (status) {
      case 'Implementada': return 100;
      case 'Aprovada': return 50;
      case 'Em Análise': return 20;
      case 'Nova': return 10;
      default: return 0;
    }
  };

  const getBonusForStatus = (status) => {
    switch (status) {
      case 'Implementada': return 'Voucher R$ 200 + Dia de folga';
      case 'Aprovada': return 'Voucher R$ 100 + Certificado';
      case 'Em Análise': return 'Badge de Participação';
      case 'Nova': return 'Pontos de Engajamento';
      default: return '';
    }
  };

  const totalPointsEarned = suggestions.reduce((total, suggestion) => {
    return total + (suggestion.points_awarded || getPointsForStatus(suggestion.status));
  }, 0);

  return (
    <div className="space-y-6">
      {/* Gamificação Header */}
      <div className="glass-card p-8 rounded-3xl bg-gradient-to-r from-purple-50/20 to-pink-50/20">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-center md:text-left">
            <h2 className="text-2xl md:text-3xl font-bold glass-text mb-2">
              💡 Caixa de Melhorias Gamificada
            </h2>
            <p className="glass-text-muted">
              Suas sugestões transformam a Mar Quente! Ganhe moedas e prêmios reais.
            </p>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center glass-card mb-2">
                <Coins className="w-8 h-8 text-white" />
              </div>
              <div className="text-2xl font-bold glass-text">{totalPointsEarned}</div>
              <div className="glass-text-muted">Moedas Ganhas</div>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 mx-auto bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center glass-card mb-2">
                <Trophy className="w-8 h-8 text-white" />
              </div>
              <div className="text-2xl font-bold glass-text">{suggestions.filter(s => s.status === 'Implementada').length}</div>
              <div className="glass-text-muted">Implementadas</div>
            </div>
          </div>
        </div>
      </div>

      {/* Sistema de Recompensas */}
      <div className="grid md:grid-cols-4 gap-4">
        <div className="glass-card p-4 rounded-xl text-center">
          <div className="w-10 h-10 mx-auto bg-purple-500 rounded-lg flex items-center justify-center mb-2">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div className="font-semibold glass-text">Nova Sugestão</div>
          <div className="text-lg font-bold text-purple-600">10 moedas</div>
          <div className="glass-text-muted text-xs mt-1">Badge de Participação</div>
        </div>
        <div className="glass-card p-4 rounded-xl text-center">
          <div className="w-10 h-10 mx-auto bg-yellow-500 rounded-lg flex items-center justify-center mb-2">
            <Clock className="w-5 h-5 text-white" />
          </div>
          <div className="font-semibold glass-text">Em Análise</div>
          <div className="text-lg font-bold text-yellow-600">+10 moedas</div>
          <div className="glass-text-muted text-xs mt-1">Badge de Destaque</div>
        </div>
        <div className="glass-card p-4 rounded-xl text-center">
          <div className="w-10 h-10 mx-auto bg-blue-500 rounded-lg flex items-center justify-center mb-2">
            <Star className="w-5 h-5 text-white" />
          </div>
          <div className="font-semibold glass-text">Aprovada</div>
          <div className="text-lg font-bold text-blue-600">+30 moedas</div>
          <div className="glass-text-muted text-xs mt-1">Voucher R$ 100</div>
        </div>
        <div className="glass-card p-4 rounded-xl text-center">
          <div className="w-10 h-10 mx-auto bg-green-500 rounded-lg flex items-center justify-center mb-2">
            <Gift className="w-5 h-5 text-white" />
          </div>
          <div className="font-semibold glass-text">Implementada</div>
          <div className="text-lg font-bold text-green-600">+50 moedas</div>
          <div className="glass-text-muted text-xs mt-1">Voucher R$ 200 + Folga</div>
        </div>
      </div>

      {/* Controles */}
      <div className="glass-card p-6 rounded-2xl">
        <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
          <div className="grid md:grid-cols-3 gap-4 flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 glass-text-muted" />
              <Input
                placeholder="Buscar sugestões..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 glass-input"
              />
            </div>
            
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
          </div>

          {/* Modal de Nova Sugestão - MOBILE OPTIMIZED */}
          <Dialog open={showNewSuggestionDialog} onOpenChange={setShowNewSuggestionDialog}>
            <DialogTrigger asChild>
              <Button className="glass-button-primary flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Enviar Sugestão
              </Button>
            </DialogTrigger>
            {/* Modified DialogContent for full-screen on mobile, regular on desktop */}
            <DialogContent className="glass-modal max-w-2xl p-0 max-h-[90vh] overflow-y-auto md:top-[50%] md:left-[50%] md:translate-x-[-50%] md:translate-y-[-50%]">
              {/* Mobile Header - fixed at top */}
              <div className="md:hidden sticky top-0 z-10 bg-background/95 backdrop-blur-sm p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold glass-text">Nova Sugestão de Melhoria</h2>
                  <DialogClose asChild>
                    <Button variant="ghost" size="icon" className="text-gray-500 hover:text-gray-700">
                      <X className="h-5 w-5" />
                    </Button>
                  </DialogClose>
                </div>
                <p className="text-sm glass-text-muted">Sua ideia pode transformar a empresa!</p>
              </div>

              {/* Desktop Header - standard behavior */}
              <DialogHeader className="mb-6 hidden md:block p-8 pb-0">
                <h2 className="modal-title">Nova Sugestão de Melhoria</h2>
                <p className="modal-description">Sua ideia pode transformar a empresa e você ganha recompensas!</p>
              </DialogHeader>

              {/* Scrollable Content Area */}
              <div className="flex-1 overflow-y-auto p-8 pt-4 md:pt-8">
                <div className="space-y-5">
                  <div className="info-box bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Coins className="w-5 h-5 text-blue-600" />
                      <span className="font-bold text-blue-900">Recompensas Garantidas:</span>
                    </div>
                    <ul className="text-blue-800 space-y-1 font-medium">
                      <li>• 10 moedas por enviar</li>
                      <li>• Até R$ 200 + folga se implementada</li>
                      <li>• Badge e reconhecimento público</li>
                    </ul>
                  </div>

                  <div>
                    <Label htmlFor="title" className="glass-label">Título da Sugestão</Label>
                    <Input
                      id="title"
                      placeholder="Ex: Melhorar processo de empacotamento"
                      value={newSuggestion.title}
                      onChange={(e) => setNewSuggestion(prev => ({ ...prev, title: e.target.value }))}
                      className="glass-input"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="category" className="glass-label">Área de Melhoria</Label>
                    <Select 
                      value={newSuggestion.category} 
                      onValueChange={(value) => setNewSuggestion(prev => ({ ...prev, category: value }))}
                    >
                      <SelectTrigger className="glass-select">
                        <SelectValue placeholder="Escolha a área" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.slice(1).map(category => (
                          <SelectItem key={category} value={category}>{category}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="description" className="glass-label">Descrição Detalhada</Label>
                    <Textarea
                      id="description"
                      placeholder="Descreva sua ideia, o problema que resolve e os benefícios esperados..."
                      value={newSuggestion.description}
                      onChange={(e) => setNewSuggestion(prev => ({ ...prev, description: e.target.value }))}
                      className="glass-textarea"
                      rows={5}
                    />
                    <p className="glass-text-muted mt-2">
                      💡 Dica: Seja específico sobre como implementar sua sugestão
                    </p>
                  </div>
                </div>
              </div>

              {/* Mobile Footer - fixed at bottom */}
              <div className="md:hidden sticky bottom-0 z-10 bg-background/95 backdrop-blur-sm p-4 border-t border-gray-200">
                <div className="flex flex-col gap-3">
                  <Button 
                    onClick={handleSubmitSuggestion}
                    disabled={!newSuggestion.title.trim() || !newSuggestion.description.trim() || !newSuggestion.category}
                    className="glass-button-primary w-full"
                  >
                    <Coins className="w-5 h-5 mr-2" />
                    Enviar e Ganhar Moedas
                  </Button>
                  <Button 
                    variant="ghost" 
                    onClick={() => setShowNewSuggestionDialog(false)} 
                    className="glass-button-secondary w-full"
                  >
                    Cancelar
                  </Button>
                </div>
              </div>

              {/* Desktop Footer - standard behavior */}
              <div className="hidden md:flex justify-end gap-3 p-8 pt-0 mt-6 border-t border-gray-200">
                <Button variant="ghost" onClick={() => setShowNewSuggestionDialog(false)} className="glass-button-secondary">
                  Cancelar
                </Button>
                <Button 
                  onClick={handleSubmitSuggestion}
                  disabled={!newSuggestion.title.trim() || !newSuggestion.description.trim() || !newSuggestion.category}
                  className="glass-button-primary"
                >
                  <Coins className="w-5 h-5 mr-2" />
                  Enviar e Ganhar Moedas
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Lista de Sugestões */}
      <div className="space-y-4">
        {filteredSuggestions.length > 0 ? (
          filteredSuggestions.map((suggestion) => {
            const statusClasses = getStatusClasses(suggestion.status);
            const StatusIcon = getStatusIcon(suggestion.status);
            const points = suggestion.points_awarded || getPointsForStatus(suggestion.status);
            const bonus = getBonusForStatus(suggestion.status);
            
            return (
              <div key={suggestion.id} className="glass-card p-4 md:p-6 rounded-2xl">
                <div className="flex items-start gap-3 md:gap-4">
                  <div className={`w-10 h-10 md:w-12 md:h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${statusClasses.icon} text-white`}>
                    <StatusIcon className={`w-5 h-5 md:w-6 md:h-6 ${suggestion.status === 'Em Análise' ? 'animate-spin' : ''}`} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-3 md:gap-4 mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold glass-text mb-2 text-sm md:text-base">{suggestion.title}</h3>
                        <div className="flex flex-wrap items-center gap-2">
                           <Badge className={`${statusClasses.bg} ${statusClasses.text} ${statusClasses.border} font-semibold text-xs`}>
                            {suggestion.status}
                          </Badge>
                          <Badge variant="outline" className="font-medium glass-text text-xs">
                            {suggestion.category}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="flex flex-col gap-2 flex-shrink-0">
                        <div className="flex items-center gap-2 bg-amber-100 text-amber-800 px-3 py-1 rounded-full font-semibold text-sm">
                          <Coins className="w-4 h-4" />
                          <span>{points} moedas</span>
                        </div>
                        {bonus && (
                          <div className="flex items-center justify-end gap-1.5 text-xs text-purple-600 font-semibold">
                            <Crown className="w-3 h-3" />
                            <span className="truncate">{bonus}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <p className="glass-text mb-4 leading-relaxed text-sm md:text-base">
                      {suggestion.description}
                    </p>

                    {suggestion.feedback && (
                      <div className="glass-card p-3 md:p-4 rounded-lg mb-4 bg-blue-500/5">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-6 h-6 rounded-full bg-blue-500 flex-shrink-0 flex items-center justify-center">
                            <Award className="w-3 h-3 text-white" />
                          </div>
                          <span className="font-semibold text-blue-800 text-sm">Feedback da Gestão:</span>
                        </div>
                        <p className="text-blue-800/80 text-sm">{suggestion.feedback}</p>
                      </div>
                    )}

                    <div className="flex flex-wrap items-center justify-between glass-text-muted pt-3 md:pt-4 border-t border-white/10 gap-2">
                      <div className="flex items-center gap-3 md:gap-4">
                        <span className="text-xs">Enviado em {format(new Date(suggestion.created_date), "dd/MM/yyyy", { locale: ptBR })}</span>
                        {suggestion.implementation_date && (
                          <span className="flex items-center gap-1.5 text-green-600 text-xs font-semibold">
                            <CheckCircle className="w-3 h-3" />
                            Implementado
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-12 glass-card rounded-2xl">
            <Target className="w-14 h-14 md:w-16 md:h-16 glass-text-muted mx-auto mb-4 opacity-50" />
            <h3 className="text-lg md:text-xl font-semibold glass-text mb-2">Sua primeira melhoria!</h3>
            <p className="glass-text-muted mb-4 text-sm md:text-base px-4">
              {searchTerm || selectedCategory !== "Todas" || selectedStatus !== "Todos" 
                ? "Tente ajustar os filtros"
                : "Comece a ganhar moedas enviando melhorias!"
              }
            </p>
            <Button onClick={() => setShowNewSuggestionDialog(true)} className="glass-button-primary">
              <Gift className="w-4 h-4 mr-2" />
              Enviar Sugestão
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}