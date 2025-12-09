
import React, { useState, useEffect } from "react";
import { User } from "@/entities/User";
import { Announcement } from "@/entities/Announcement";
import { HRRequest } from "@/entities/HRRequest";
import { Suggestion } from "@/entities/Suggestion";
import { Idea } from "@/entities/Idea";
import {
  TrendingUp,
  MessageSquare,
  Award,
  FileText,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    totalUsers: 0,
    recentAnnouncements: 0,
    pendingHRRequests: 0,
    totalSuggestions: 0,
    totalIdeas: 0
  });
  const [recentItems, setRecentItems] = useState({
    announcements: [],
    suggestions: [],
    ideas: [],
    hrRequests: []
  });
  // topUsers state and its logic are removed as the ranking section is no longer displayed.

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const currentUser = await User.me();
      setUser(currentUser);

      const [users, announcements, hrRequests, suggestions, ideas] = await Promise.all([
        User.list(), // Still needed for totalUsers count
        Announcement.list('-created_date', 5),
        HRRequest.filter({ created_by: currentUser.email }, '-created_date', 5),
        Suggestion.list('-created_date', 3),
        Idea.list('-created_date', 3)
      ]);

      setStats({
        totalUsers: users.length,
        recentAnnouncements: announcements.length,
        pendingHRRequests: hrRequests.filter(req => req.status === 'Pendente' || req.status === 'Em Análise').length,
        totalSuggestions: suggestions.length,
        totalIdeas: ideas.length
      });

      setRecentItems({
        announcements,
        suggestions,
        ideas,
        hrRequests
      });

      // Removed topUsers filtering and sorting logic as the component no longer displays the ranking.

    } catch (error) {
      console.error("Erro ao carregar dashboard:", error);
    }
  };

  const StatCard = ({ title, value, icon: Icon, gradient, trend, description }) => (
    <div className="glass-card p-6 rounded-2xl">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="glass-text-muted text-sm font-medium mb-1">{title}</p>
          <p className="text-3xl font-bold glass-text">{value}</p>
          {trend && (
            <div className="flex items-center mt-2">
              <TrendingUp className="w-4 h-4 mr-1 text-green-600" />
              <span className="text-green-600 font-semibold text-sm">{trend}</span>
            </div>
          )}
          {description && (
            <p className="text-sm glass-text-muted mt-1">{description}</p>
          )}
        </div>
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${gradient} shadow-lg flex-shrink-0`}>
          <Icon className="w-7 h-7 text-white" />
        </div>
      </div>
    </div>
  );

  const QuickActionCard = ({ title, description, icon: Icon, gradient, to }) => (
    <Link to={to}>
      <div className="glass-card p-6 rounded-2xl h-full cursor-pointer group hover:scale-105 transition-all duration-200">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${gradient} shadow-lg`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <h3 className="font-bold glass-text mb-2 text-lg">{title}</h3>
        <p className="glass-text-muted text-sm">{description}</p>
      </div>
    </Link>
  );

  return (
    <div className="space-y-8">
      {/* Boas-vindas */}
      {user && (
        <div className="glass-card p-6 md:p-8 rounded-3xl">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-start md:items-center gap-4 md:gap-5 w-full md:w-auto">
              <Avatar className="w-16 h-16 md:w-20 md:h-20 shadow-lg border-2 border-white/30 flex-shrink-0">
                <AvatarImage src={user.avatar_url} />
                <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xl md:text-2xl font-bold">
                  {user.full_name?.charAt(0) || user.email?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl md:text-4xl font-bold glass-text truncate">
                  Olá, {user.full_name?.split(' ')[0] || user.email.split('@')[0]}! 👋
                </h1>
                {(user.position || user.department) && (
                  <p className="glass-text-muted mt-1 text-sm md:text-lg truncate">
                    {[user.position, user.department].filter(Boolean).join(' • ')}
                  </p>
                )}
              </div>
            </div>
            <div className="text-left md:text-right w-full md:w-auto">
              <p className="glass-text-muted text-sm">Hoje é</p>
              <p className="text-lg md:text-xl font-semibold glass-text">
                {format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR })}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Estatísticas - REMOVIDO "Colaboradores" e "Ideias Ativas" */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <StatCard
          title="Comunicados"
          value={stats.recentAnnouncements}
          icon={MessageSquare}
          gradient="bg-gradient-to-r from-green-500 to-green-600"
          description="Novos esta semana"
        />
        <StatCard
          title="Minhas Solicitações"
          value={stats.pendingHRRequests}
          icon={FileText}
          gradient="bg-gradient-to-r from-orange-500 to-orange-600"
          description="Pendentes de análise"
        />
      </div>

      {/* Ações Rápidas */}
      <div>
        <h2 className="text-2xl font-bold glass-text mb-6">Ações Rápidas</h2>
        <div className="grid md:grid-cols-2 gap-5">
          <QuickActionCard
            title="Nova Solicitação RH"
            description="Solicite férias, declarações e mais"
            icon={FileText}
            gradient="bg-gradient-to-r from-blue-500 to-blue-600"
            to={createPageUrl("HRRequests")}
          />
          <QuickActionCard
            title="Enviar Melhoria"
            description="Sugira melhorias e ganhe pontos"
            icon={Award}
            gradient="bg-gradient-to-r from-green-500 to-green-600"
            to={createPageUrl("Suggestions")}
          />
        </div>
      </div>

      {/* Atividades Recentes */}
      <div className="grid lg:grid-cols-2 gap-6 md:gap-8">
        {/* Comunicados Recentes */}
        <div>
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <h2 className="text-xl md:text-2xl font-bold glass-text">Comunicados Recentes</h2>
            <Link to={createPageUrl("Announcements")}>
              <Button variant="ghost" size="sm" className="glass-button text-sm">
                Ver todos
              </Button>
            </Link>
          </div>
          <div className="glass-card p-4 md:p-6 rounded-2xl space-y-4 md:space-y-5">
            {recentItems.announcements.length > 0 ? (
              recentItems.announcements.map((announcement) => (
                <div key={announcement.id} className="border-l-4 border-blue-500 pl-3 md:pl-4 py-2">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold glass-text text-sm md:text-base line-clamp-2 flex-1">{announcement.title}</h3>
                      <Badge variant="secondary" className="text-xs flex-shrink-0">
                        {announcement.category}
                      </Badge>
                    </div>
                    <p className="glass-text-muted text-xs md:text-sm line-clamp-2">{announcement.content}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs glass-text-muted">
                        {format(new Date(announcement.created_date), "dd/MM", { locale: ptBR })}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 md:py-10">
                <MessageSquare className="w-12 h-12 md:w-14 md:h-14 glass-text-muted mx-auto mb-3 opacity-50" />
                <p className="glass-text-muted text-sm">Nenhum comunicado recente</p>
              </div>
            )}
          </div>
        </div>

        {/* Minhas Solicitações */}
        <div>
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <h2 className="text-xl md:text-2xl font-bold glass-text">Minhas Solicitações</h2>
            <Link to={createPageUrl("HRRequests")}>
              <Button variant="ghost" size="sm" className="glass-button text-sm">
                Ver todas
              </Button>
            </Link>
          </div>
          <div className="glass-card p-4 md:p-6 rounded-2xl space-y-4 md:space-y-5">
            {recentItems.hrRequests.length > 0 ? (
              recentItems.hrRequests.map((request) => (
                <div key={request.id} className="flex items-start gap-3">
                  <div className={`w-3 h-3 rounded-full mt-2 flex-shrink-0 ${
                    request.status === 'Aprovado' ? 'bg-green-500' :
                    request.status === 'Rejeitado' ? 'bg-red-500' :
                    request.status === 'Em Análise' ? 'bg-yellow-500' :
                    'bg-gray-400'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold glass-text text-sm md:text-base truncate">{request.title}</h3>
                    <p className="glass-text-muted mt-1 text-xs md:text-sm line-clamp-2">{request.description}</p>
                    <div className="flex items-center gap-2 md:gap-3 mt-2">
                      <Badge variant="outline" className="text-xs">
                        {request.status}
                      </Badge>
                      <span className="text-xs glass-text-muted">
                        {format(new Date(request.created_date), "dd/MM", { locale: ptBR })}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 md:py-10">
                <FileText className="w-12 h-12 md:w-14 md:h-14 glass-text-muted mx-auto mb-3 opacity-50" />
                <p className="glass-text-muted text-sm">Nenhuma solicitação recente</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
