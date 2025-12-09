
import React, { useState, useEffect } from "react";
import { Idea } from "@/entities/Idea";
import { Comment } from "@/entities/Comment";
import { User } from "@/entities/User";
import { 
  Lightbulb, 
  MessageSquare, 
  Plus, 
  Search,
  CheckCircle,
  Rocket,
  Star,
  ThumbsUp,
  XCircle,
  Loader2
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { DialogTrigger } from "@radix-ui/react-dialog"; // Explicitly import DialogTrigger
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Ideas() {
  const [ideas, setIdeas] = useState([]);
  const [filteredIdeas, setFilteredIdeas] = useState([]);
  const [user, setUser] = useState(null);
  const [showNewIdeaDialog, setShowNewIdeaDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todas");
  const [selectedStatus, setSelectedStatus] = useState("Todos");
  const [showComments, setShowComments] = useState({});
  const [newComment, setNewComment] = useState({});
  const [comments, setComments] = useState({});
  const [newIdea, setNewIdea] = useState({
    title: "",
    description: "",
    category: "",
    department: "Todos",
    impact_level: "",
    implementation_complexity: ""
  });

  const categories = ["Todas", "Processo", "Produto", "Tecnologia", "Cultura", "Benefícios", "Ambiente", "Clima", "Outros"];
  const statuses = ["Todos", "Nova", "Em Análise", "Aprovada", "Em Desenvolvimento", "Implementada", "Rejeitada"];
  const departments = ["Todos", "RH", "TI", "Financeiro", "Marketing", "Vendas", "Operações", "Diretoria", "Produção", "Criação", "Logística"];
  const impactLevels = ["Baixo", "Médio", "Alto"];
  const complexityLevels = ["Simples", "Moderado", "Complexo"];

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    let filtered = ideas;

    if (searchTerm) {
      filtered = filtered.filter(idea => 
        idea.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        idea.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory !== "Todas") {
      filtered = filtered.filter(idea => idea.category === selectedCategory);
    }

    if (selectedStatus !== "Todos") {
      filtered = filtered.filter(idea => idea.status === selectedStatus);
    }

    // Ordenar por curtidas primeiro, depois por data
    filtered.sort((a, b) => {
      if ((b.likes || 0) !== (a.likes || 0)) {
        return (b.likes || 0) - (a.likes || 0);
      }
      return new Date(b.created_date) - new Date(a.created_date);
    });

    setFilteredIdeas(filtered);
  }, [ideas, searchTerm, selectedCategory, selectedStatus]);

  const loadData = async () => {
    try {
      const currentUser = await User.me();
      setUser(currentUser);
      
      const ideasData = await Idea.list('-created_date');
      setIdeas(ideasData);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    }
  };

  const handleSubmitIdea = async () => {
    if (!newIdea.title.trim() || !newIdea.description.trim() || !newIdea.category) {
      return;
    }

    try {
      await Idea.create(newIdea);
      setNewIdea({
        title: "",
        description: "",
        category: "",
        department: "Todos",
        impact_level: "",
        implementation_complexity: ""
      });
      setShowNewIdeaDialog(false);
      await loadData();
    } catch (error) {
      console.error("Erro ao criar ideia:", error);
    }
  };

  const handleLikeIdea = async (idea) => {
    try {
      await Idea.update(idea.id, { likes: (idea.likes || 0) + 1 });
      await loadData();
    } catch (error) {
      console.error("Erro ao curtir ideia:", error);
    }
  };

  const toggleComments = async (ideaId) => {
    if (!showComments[ideaId]) {
      try {
        const ideaComments = await Comment.filter({
          entity_type: "Idea",
          entity_id: ideaId
        }, '-created_date');
        
        setComments(prev => ({
          ...prev,
          [ideaId]: ideaComments
        }));
      } catch (error) {
        console.error("Erro ao carregar comentários:", error);
      }
    }
    
    setShowComments(prev => ({
      ...prev,
      [ideaId]: !prev[ideaId]
    }));
  };

  const handleAddComment = async (ideaId) => {
    if (!newComment[ideaId]?.trim()) return;

    try {
      await Comment.create({
        content: newComment[ideaId],
        entity_type: "Idea",
        entity_id: ideaId
      });

      setNewComment(prev => ({
        ...prev,
        [ideaId]: ""
      }));

      const ideaComments = await Comment.filter({
        entity_type: "Idea",
        entity_id: ideaId
      }, '-created_date');
      
      setComments(prev => ({
        ...prev,
        [ideaId]: ideaComments
      }));
    } catch (error) {
      console.error("Erro ao adicionar comentário:", error);
    }
  };

  const getStatusClasses = (status) => {
    switch (status) {
        case 'Implementada': return { bg: 'bg-green-500/10', text: 'text-green-700', border: 'border-green-500/20', icon: 'bg-green-500' };
        case 'Em Desenvolvimento': return { bg: 'bg-blue-500/10', text: 'text-blue-700', border: 'border-blue-500/20', icon: 'bg-blue-500' };
        case 'Aprovada': return { bg: 'bg-purple-500/10', text: 'text-purple-700', border: 'border-purple-500/20', icon: 'bg-purple-500' };
        case 'Em Análise': return { bg: 'bg-yellow-500/10', text: 'text-yellow-700', border: 'border-yellow-500/20', icon: 'bg-yellow-500' };
        case 'Rejeitada': return { bg: 'bg-red-500/10', text: 'text-red-700', border: 'border-red-500/20', icon: 'bg-red-500' };
        case 'Nova': return { bg: 'bg-slate-500/10', text: 'text-slate-700', border: 'border-slate-500/20', icon: 'bg-slate-500' };
        default: return { bg: 'bg-slate-500/10', text: 'text-slate-700', border: 'border-slate-500/20', icon: 'bg-slate-500' };
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Implementada': return CheckCircle;
      case 'Em Desenvolvimento': return Rocket;
      case 'Aprovada': return Star;
      case 'Em Análise': return Loader2;
      case 'Rejeitada': return XCircle;
      case 'Nova': return Lightbulb;
      default: return Lightbulb;
    }
  };

  const getImpactBorder = (impact) => {
    switch (impact) {
      case 'Alto': return 'border-red-500';
      case 'Médio': return 'border-yellow-500';
      case 'Baixo': return 'border-green-500';
      default: return 'border-slate-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* Estatísticas */}
      <div className="grid md:grid-cols-4 gap-4">
        <div className="glass-card p-5 rounded-xl text-center">
          <div className="text-2xl font-bold glass-text">{ideas.length}</div>
          <div className="glass-text-muted text-sm mt-1">Total de Ideias</div>
        </div>
        <div className="glass-card p-5 rounded-xl text-center">
          <div className="text-2xl font-bold text-yellow-600">
            {ideas.filter(i => i.status === 'Nova' || i.status === 'Em Análise').length}
          </div>
          <div className="glass-text-muted text-sm mt-1">Em Análise</div>
        </div>
        <div className="glass-card p-5 rounded-xl text-center">
          <div className="text-2xl font-bold text-green-600">
            {ideas.filter(i => i.status === 'Implementada').length}
          </div>
          <div className="glass-text-muted text-sm mt-1">Implementadas</div>
        </div>
        <div className="glass-card p-5 rounded-xl text-center">
          <div className="text-2xl font-bold text-purple-600">
            {ideas.reduce((sum, idea) => sum + (idea.likes || 0), 0)}
          </div>
          <div className="glass-text-muted text-sm mt-1">Total de Votos</div>
        </div>
      </div>

      {/* Controles */}
      <div className="glass-card p-6 rounded-2xl">
        <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
          <div className="grid md:grid-cols-3 gap-4 flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 glass-text-muted" />
              <Input
                placeholder="Buscar ideias..."
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

          <Dialog open={showNewIdeaDialog} onOpenChange={setShowNewIdeaDialog}>
            <DialogTrigger asChild>
              <Button className="glass-button-primary flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Compartilhar Ideia
              </Button>
            </DialogTrigger>
            <DialogContent className="glass-modal max-w-2xl p-0">
              <div className="p-8">
                <DialogHeader className="mb-6">
                  <h2 className="modal-title">Nova Ideia Inovadora</h2>
                  <p className="modal-description">Compartilhe sua visão para melhorar a empresa</p>
                </DialogHeader>
                <div className="space-y-5">
                  <div>
                    <Label htmlFor="title" className="glass-label">Título da Ideia</Label>
                    <Input
                      id="title"
                      placeholder="Seja direto e inspirador..."
                      value={newIdea.title}
                      onChange={(e) => setNewIdea(prev => ({ ...prev, title: e.target.value }))}
                      className="glass-input"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="category" className="glass-label">Categoria</Label>
                    <Select 
                      value={newIdea.category} 
                      onValueChange={(value) => setNewIdea(prev => ({ ...prev, category: value }))}
                    >
                      <SelectTrigger className="glass-select">
                        <SelectValue placeholder="Selecione uma categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.slice(1).map(category => (
                          <SelectItem key={category} value={category}>{category}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="impact" className="glass-label">Impacto Esperado</Label>
                      <Select 
                        value={newIdea.impact_level} 
                        onValueChange={(value) => setNewIdea(prev => ({ ...prev, impact_level: value }))}
                      >
                        <SelectTrigger className="glass-select">
                          <SelectValue placeholder="Impacto" />
                        </SelectTrigger>
                        <SelectContent>
                          {impactLevels.map(level => (
                            <SelectItem key={level} value={level}>{level}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="complexity" className="glass-label">Complexidade</Label>
                      <Select 
                        value={newIdea.implementation_complexity} 
                        onValueChange={(value) => setNewIdea(prev => ({ ...prev, implementation_complexity: value }))}
                      >
                        <SelectTrigger className="glass-select">
                          <SelectValue placeholder="Complexidade" />
                        </SelectTrigger>
                        <SelectContent>
                          {complexityLevels.map(level => (
                            <SelectItem key={level} value={level}>{level}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="description" className="glass-label">Descrição Completa</Label>
                    <Textarea
                      id="description"
                      placeholder="Descreva sua ideia, o problema que resolve e os benefícios esperados..."
                      value={newIdea.description}
                      onChange={(e) => setNewIdea(prev => ({ ...prev, description: e.target.value }))}
                      className="glass-textarea"
                      rows={5}
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
                    <Button variant="ghost" onClick={() => setShowNewIdeaDialog(false)} className="glass-button-secondary">
                      Cancelar
                    </Button>
                    <Button 
                      onClick={handleSubmitIdea}
                      disabled={!newIdea.title.trim() || !newIdea.description.trim() || !newIdea.category}
                      className="glass-button-primary"
                    >
                      Compartilhar Ideia
                    </Button>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Lista de Ideias */}
      <div className="space-y-6">
        {filteredIdeas.length > 0 ? (
          filteredIdeas.map((idea) => {
            const statusClasses = getStatusClasses(idea.status);
            const StatusIcon = getStatusIcon(idea.status);
            
            return (
              <div key={idea.id} className={`glass-card p-6 rounded-2xl border-l-4 ${getImpactBorder(idea.impact_level)}`}>
                <div className="flex items-start gap-4">
                    <Avatar className="w-10 h-10 border-2 border-white/20">
                        <AvatarFallback className="font-semibold bg-gradient-to-r from-purple-400 to-pink-500 text-white">
                            {idea.created_by?.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                    </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                        <div>
                            <h3 className="font-bold glass-text">{idea.title}</h3>
                            <div className="glass-text-muted mt-1">
                                Por <strong>{idea.created_by}</strong> • {format(new Date(idea.created_date), "dd/MM/yyyy", { locale: ptBR })}
                            </div>
                        </div>
                        <Badge className={`${statusClasses.bg} ${statusClasses.text} ${statusClasses.border} font-semibold`}>
                          <StatusIcon className={`w-3 h-3 mr-1.5 ${idea.status === 'Em Análise' ? 'animate-spin' : ''}`} />
                          {idea.status}
                        </Badge>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 my-3">
                      <Badge variant="outline" className="font-medium glass-text">
                        {idea.category}
                      </Badge>
                      {idea.impact_level && (
                        <Badge variant="secondary" className="font-medium glass-text">
                          Impacto {idea.impact_level}
                        </Badge>
                      )}
                      {idea.implementation_complexity && (
                        <Badge variant="outline" className="font-medium glass-text">
                          {idea.implementation_complexity}
                        </Badge>
                      )}
                    </div>

                    <p className="glass-text mb-4 leading-relaxed">
                      {idea.description}
                    </p>

                    <div className="flex items-center justify-between pt-4 border-t border-white/10">
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="glass-button flex items-center gap-2"
                          onClick={() => handleLikeIdea(idea)}
                        >
                          <ThumbsUp className="w-4 h-4" />
                          <span className="font-semibold">{idea.likes || 0}</span>
                        </Button>
                        
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="glass-button flex items-center gap-2"
                          onClick={() => toggleComments(idea.id)}
                        >
                          <MessageSquare className="w-4 h-4" />
                          <span className="font-semibold">{comments[idea.id]?.length || 0}</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Comentários */}
                {showComments[idea.id] && (
                  <div className="mt-6 pt-4 border-t border-white/10 ml-14">
                    <div className="space-y-4">
                      {/* Adicionar comentário */}
                      <div className="flex items-start gap-3">
                        <Avatar className="w-9 h-9">
                          <AvatarImage src={user?.avatar_url} />
                          <AvatarFallback className="bg-gradient-to-r from-blue-400 to-purple-500 text-white font-semibold">
                            {user?.full_name?.charAt(0) || user?.email?.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <Textarea
                            placeholder="Compartilhe sua opinião..."
                            value={newComment[idea.id] || ""}
                            onChange={(e) => setNewComment(prev => ({
                              ...prev,
                              [idea.id]: e.target.value
                            }))}
                            className="glass-textarea"
                            rows={2}
                          />
                          <div className="flex justify-end mt-2">
                            <Button
                              size="sm"
                              onClick={() => handleAddComment(idea.id)}
                              disabled={!newComment[idea.id]?.trim()}
                              className="glass-button-primary"
                            >
                              Comentar
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* Lista de comentários */}
                      {comments[idea.id]?.map((comment) => (
                        <div key={comment.id} className="flex items-start gap-3">
                          <Avatar className="w-8 h-8">
                            <AvatarFallback className="bg-gradient-to-r from-green-400 to-blue-500 text-white font-semibold">
                               {comment.created_by?.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="glass-card p-3 rounded-lg">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-bold glass-text">
                                  {comment.created_by}
                                </span>
                                <span className="glass-text-muted">
                                  • {format(new Date(comment.created_date), "dd/MM HH:mm", { locale: ptBR })}
                                </span>
                              </div>
                              <p className="glass-text">{comment.content}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="text-center py-12 glass-card rounded-2xl">
            <Lightbulb className="w-16 h-16 glass-text-muted mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold glass-text mb-2">Nenhuma ideia encontrada</h3>
            <p className="glass-text-muted mb-4">
              {searchTerm || selectedCategory !== "Todas" || selectedStatus !== "Todos" 
                ? "Tente ajustar os filtros para encontrar ideias"
                : "Seja o primeiro a compartilhar uma ideia!"
              }
            </p>
            <Button onClick={() => setShowNewIdeaDialog(true)} className="glass-button-primary">
              <Plus className="w-4 h-4 mr-2" />
              Compartilhar Primeira Ideia
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
