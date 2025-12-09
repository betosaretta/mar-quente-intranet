
import React, { useState, useEffect } from "react";
import { Announcement } from "@/entities/Announcement";
import { Comment } from "@/entities/Comment";
import { User } from "@/entities/User";
import {
  MessageSquare,
  Heart,
  Share,
  Pin,
  Calendar,
  Search,
  AlertCircle,
  Users,
  Eye,
  Sparkles, // Added Sparkles icon for the new banner
  User as UserIcon, // Added
  ThumbsUp, // Added
  Bell, // Added
  TrendingUp, // Added
  Cake, // Added
  Megaphone, // Added
  FileText, // Added
  ExternalLink // Added
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
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Announcements() {
  const [announcements, setAnnouncements] = useState([]);
  const [filteredAnnouncements, setFilteredAnnouncements] = useState([]);
  const [user, setUser] = useState(null); // Renamed from currentUser to user to match existing usage in comments section
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [selectedPriority, setSelectedPriority] = useState("Todas");
  const [showComments, setShowComments] = useState({});
  const [newComment, setNewComment] = useState({});
  const [comments, setComments] = useState({});

  const categories = ["Todos", "Geral", "RH", "TI", "Eventos", "Benefícios", "Política", "Urgente", "Diretoria", "Liderança", "Boletim de Produção", "Aniversariantes", "Fala, Gestor"];
  const priorities = ["Todas", "Baixa", "Normal", "Alta", "Urgente"];

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    let filtered = announcements;

    if (searchTerm) {
      filtered = filtered.filter(announcement =>
        announcement.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        announcement.content.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory !== "Todos") {
      filtered = filtered.filter(announcement => announcement.category === selectedCategory);
    }

    if (selectedPriority !== "Todas") {
      filtered = filtered.filter(announcement => announcement.priority === selectedPriority);
    }

    filtered.sort((a, b) => {
      if (a.is_pinned && !b.is_pinned) return -1;
      if (!a.is_pinned && b.is_pinned) return 1;
      return new Date(b.created_date) - new Date(a.created_date);
    });

    setFilteredAnnouncements(filtered);
  }, [announcements, searchTerm, selectedCategory, selectedPriority]);

  const loadData = async () => {
    try {
      const currentUser = await User.me();
      setUser(currentUser);

      const announcementData = await Announcement.list('-created_date');
      setAnnouncements(announcementData);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    }
  };

  const toggleComments = async (announcementId) => {
    if (!showComments[announcementId]) {
      try {
        const announcementComments = await Comment.filter({
          entity_type: "Announcement",
          entity_id: announcementId
        }, '-created_date');

        setComments(prev => ({
          ...prev,
          [announcementId]: announcementComments
        }));
      } catch (error) {
        console.error("Erro ao carregar comentários:", error);
      }
    }

    setShowComments(prev => ({
      ...prev,
      [announcementId]: !prev[announcementId]
    }));
  };

  const handleAddComment = async (announcementId) => {
    if (!newComment[announcementId]?.trim()) return;

    try {
      await Comment.create({
        content: newComment[announcementId],
        entity_type: "Announcement",
        entity_id: announcementId
      });

      setNewComment(prev => ({
        ...prev,
        [announcementId]: ""
      }));

      const announcementComments = await Comment.filter({
        entity_type: "Announcement",
        entity_id: announcementId
      }, '-created_date');

      setComments(prev => ({
        ...prev,
        [announcementId]: announcementComments
      }));
    } catch (error) {
      console.error("Erro ao adicionar comentário:", error);
    }
  };

  const getPriorityClasses = (priority) => {
    switch (priority) {
      case 'Urgente': return { bg: 'bg-red-500/10', text: 'text-red-700', border: 'border-red-500/20' };
      case 'Alta': return { bg: 'bg-orange-500/10', text: 'text-orange-700', border: 'border-orange-500/20' };
      case 'Normal': return { bg: 'bg-blue-500/10', text: 'text-blue-700', border: 'border-blue-500/20' };
      case 'Baixa': return { bg: 'bg-slate-500/10', text: 'text-slate-700', border: 'border-slate-500/20' };
      default: return { bg: 'bg-slate-500/10', text: 'text-slate-700', border: 'border-slate-500/20' };
    }
  };

  // Helper function for CategoryIcon and background
  const getCategoryIcon = (category) => {
    switch (category) {
      case "Geral": return Megaphone;
      case "RH": return Users;
      case "TI": return TrendingUp; // Or something tech-related
      case "Eventos": return Calendar;
      case "Benefícios": return Heart;
      case "Política": return FileText;
      case "Urgente": return AlertCircle;
      case "Diretoria": return Bell; // Or another leadership icon
      case "Liderança": return Users;
      case "Boletim de Produção": return ThumbsUp; // Or another relevant icon
      case "Aniversariantes": return Cake;
      case "Fala, Gestor": return UserIcon;
      default: return Megaphone;
    }
  };

  const getIconBackground = (category) => {
    switch (category) {
      case "Geral": return "bg-blue-500";
      case "RH": return "bg-purple-500";
      case "TI": return "bg-green-500";
      case "Eventos": return "bg-red-500";
      case "Benefícios": return "bg-pink-500";
      case "Política": return "bg-indigo-500";
      case "Urgente": return "bg-orange-500";
      case "Diretoria": return "bg-teal-500";
      case "Liderança": return "bg-cyan-500";
      case "Boletim de Produção": return "bg-lime-500";
      case "Aniversariantes": return "bg-rose-500";
      case "Fala, Gestor": return "bg-amber-500";
      default: return "bg-gray-500";
    }
  };

  // NEW: getEmbedUrl function
  const getEmbedUrl = (videoUrl) => {
    if (!videoUrl) return null;

    // YouTube
    if (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')) {
      const videoId = videoUrl.includes('youtu.be')
        ? videoUrl.split('/').pop()
        : new URL(videoUrl).searchParams.get('v');
      return `https://www.youtube.com/embed/${videoId}`;
    }

    // Vimeo
    if (videoUrl.includes('vimeo.com')) {
      const videoId = videoUrl.split('/').pop();
      return `https://player.vimeo.com/video/${videoId}`;
    }

    // Direct link to video file (can be embedded but might not have controls)
    // For a more robust solution, might check file extension or mime type
    return videoUrl;
  };

  // NEW: AnnouncementCard component
  const AnnouncementCard = ({ announcement, currentUser, comments, showComments, toggleComments, newComment, setNewComment, handleAddComment }) => {
    const CategoryIcon = getCategoryIcon(announcement.category); // Get the component itself

    // Helper to get priority badge color directly for the new Card layout
    const getPriorityBadgeClass = (priority) => {
      switch (priority) {
        case 'Urgente': return 'bg-red-500 text-white';
        case 'Alta': return 'bg-orange-500 text-white';
        case 'Normal': return 'bg-blue-500 text-white';
        case 'Baixa': return 'bg-slate-500 text-white';
        default: return 'bg-gray-500 text-white';
      }
    };

    return (
      <div className={`glass-card rounded-2xl overflow-hidden ${announcement.is_pinned ? 'border-2 border-yellow-400 shadow-xl' : ''}`}>
        {announcement.is_pinned && (
          <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 px-4 py-2 flex items-center gap-2">
            <Pin className="w-4 h-4 text-yellow-900" />
            <span className="text-yellow-900 font-bold text-sm">Comunicado Fixado</span>
          </div>
        )}

        {/* The main content area of the card */}
        <div className="p-6 bg-white/95">
          <div className="flex items-start gap-4 mb-4">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${getIconBackground(announcement.category)} shadow-lg flex-shrink-0`}>
              <CategoryIcon className="w-8 h-8 text-white" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <Badge variant="secondary" className="font-bold">{announcement.category}</Badge>
                <Badge className={getPriorityBadgeClass(announcement.priority)}>{announcement.priority}</Badge>
                {announcement.department_target !== "Todos" && (
                  <Badge variant="outline" className="text-xs">{announcement.department_target}</Badge>
                )}
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">{announcement.title}</h3>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {format(new Date(announcement.created_date), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                </span>
                <span className="flex items-center gap-1">
                  <UserIcon className="w-4 h-4" />
                  {announcement.created_by}
                </span>
              </div>
            </div>
          </div>

          <p className="text-gray-700 text-base leading-relaxed mb-4 whitespace-pre-wrap">
            {announcement.content}
          </p>

          {/* NOVO: Exibir Imagem */}
          {announcement.image_url && (
            <div className="mb-4 rounded-xl overflow-hidden">
              <img
                src={announcement.image_url}
                alt={announcement.title}
                className="w-full max-h-96 object-cover"
              />
            </div>
          )}

          {/* NOVO: Exibir Vídeo */}
          {announcement.video_url && (
            <div className="mb-4 rounded-xl overflow-hidden">
              {getEmbedUrl(announcement.video_url) && (
                <div className="aspect-video">
                  <iframe
                    src={getEmbedUrl(announcement.video_url)}
                    className="w-full h-full"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title={`Video for ${announcement.title}`}
                  />
                </div>
              )}
            </div>
          )}

          {/* NOVO: Exibir PDF */}
          {announcement.pdf_url && (
            <div className="mb-4">
              <a
                href={announcement.pdf_url}
                target="_blank"
                rel="noopener noreferrer"
                className="glass-card p-4 rounded-xl flex items-center gap-3 hover:bg-blue-50 transition-colors"
              >
                <div className="w-12 h-12 rounded-lg bg-red-500 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <div className="font-bold text-gray-900">Documento anexado</div>
                  <div className="text-sm text-gray-600">Clique para abrir o PDF</div>
                </div>
                <ExternalLink className="w-5 h-5 text-blue-600" />
              </a>
            </div>
          )}

          {/* Data de expiração - Original content */}
          {announcement.expires_at && new Date(announcement.expires_at) > new Date() && (
            <div className="mb-4 p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
              <div className="flex items-center gap-2 text-yellow-700">
                <AlertCircle className="w-4 h-4" />
                <span className="font-medium">
                  Válido até: {format(new Date(announcement.expires_at), "dd/MM/yyyy", { locale: ptBR })}
                </span>
              </div>
            </div>
          )}

          {/* Ações */}
          <div className="flex items-center justify-between pt-4 border-t border-white/10">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="glass-button flex items-center gap-2"
                onClick={() => toggleComments(announcement.id)}
              >
                <MessageSquare className="w-4 h-4" />
                <span className="font-semibold">{comments[announcement.id]?.length || 0}</span>
              </Button>

              <Button variant="ghost" size="sm" className="glass-button flex items-center gap-2">
                <Heart className="w-4 h-4" />
                <span className="font-semibold">0</span>
              </Button>

              <Button variant="ghost" size="icon" className="glass-button">
                <Share className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex items-center gap-2 glass-text-muted">
              <Eye className="w-4 h-4" />
              <span>0 visualizações</span>
            </div>
          </div>

          {/* Comentários */}
          {showComments[announcement.id] && (
            <div className="mt-6 pt-4 border-t border-white/10">
              <div className="space-y-4">
                {/* Adicionar comentário */}
                <div className="flex items-start gap-3">
                  <Avatar className="w-9 h-9">
                    <AvatarImage src={currentUser?.avatar_url} />
                    <AvatarFallback className="bg-gradient-to-r from-blue-400 to-purple-500 text-white font-semibold">
                      {currentUser?.full_name?.charAt(0) || currentUser?.email?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <Textarea
                      placeholder="Escreva um comentário..."
                      value={newComment[announcement.id] || ""}
                      onChange={(e) => setNewComment(prev => ({
                        ...prev,
                        [announcement.id]: e.target.value
                      }))}
                      className="glass-textarea"
                      rows={2}
                    />
                    <div className="flex justify-end mt-2">
                      <Button
                        size="sm"
                        onClick={() => handleAddComment(announcement.id)}
                        disabled={!newComment[announcement.id]?.trim()}
                        className="glass-button-primary"
                      >
                        Comentar
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Lista de comentários */}
                {comments[announcement.id]?.map((comment) => (
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
                          <span className="text-sm glass-text-muted">
                            • {format(new Date(comment.created_date), "dd/MM HH:mm", { locale: ptBR })}
                          </span>
                        </div>
                        <p className="glass-text">{comment.content}</p>
                      </div>
                      <div className="flex items-center gap-2 mt-1 ml-3">
                        <Button variant="ghost" size="sm" className="h-6 px-2 text-sm glass-text-muted">
                          <Heart className="w-3 h-3 mr-1" />
                          {comment.likes || 0}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Banner sobre Nova Cultura */}
      <div className="glass-card p-8 rounded-3xl bg-gradient-to-r from-blue-50/20 to-purple-50/20 border-2 border-white/30">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold glass-text mb-2">
              🌟 Nova Cultura da Mar Quente
            </h2>
            <p className="glass-text-muted text-lg leading-relaxed">
              Bem-vindo à nossa nova plataforma de comunicação interna! Aqui você encontra todos os comunicados importantes,
              atualizações sobre a empresa, boletins de produção e muito mais. Estamos construindo uma cultura de transparência,
              colaboração e reconhecimento. Acompanhe as novidades e faça parte desta transformação! 🚀
            </p>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="glass-card p-6 rounded-2xl">
        <div className="grid md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 glass-text-muted" />
              <Input
                placeholder="Buscar comunicados..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 glass-input"
              />
            </div>
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

          <Select value={selectedPriority} onValueChange={setSelectedPriority}>
            <SelectTrigger className="glass-select">
              <SelectValue placeholder="Prioridade" />
            </SelectTrigger>
            <SelectContent>
              {priorities.map(priority => (
                <SelectItem key={priority} value={priority}>{priority}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Lista de Comunicados */}
      <div className="space-y-6">
        {filteredAnnouncements.length > 0 ? (
          filteredAnnouncements.map((announcement) => (
            <AnnouncementCard
              key={announcement.id}
              announcement={announcement}
              currentUser={user} // Pass the main user state
              comments={comments}
              showComments={showComments}
              toggleComments={toggleComments}
              newComment={newComment}
              setNewComment={setNewComment}
              handleAddComment={handleAddComment}
            />
          ))
        ) : (
          <div className="text-center py-12 glass-card rounded-2xl">
            <MessageSquare className="w-16 h-16 glass-text-muted mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-semibold glass-text mb-2">Nenhum comunicado encontrado</h3>
            <p className="glass-text-muted">
              {searchTerm || selectedCategory !== "Todos" || selectedPriority !== "Todas"
                ? "Tente ajustar os filtros para encontrar comunicados"
                : "Ainda não há comunicados publicados"
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
