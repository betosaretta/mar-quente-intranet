
import React, { useState, useEffect } from "react";
import { MonthlyNews } from "@/entities/MonthlyNews";
import { User } from "@/entities/User";
import {
  Newspaper,
  Calendar,
  Eye,
  Search,
  Download // Added Download import
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function MQNews() {
  const [news, setNews] = useState([]);
  const [filteredNews, setFilteredNews] = useState([]);
  const [selectedNews, setSelectedNews] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedYear, setSelectedYear] = useState("Todos");
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    let filtered = news.filter(item => item.is_published);

    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.summary?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.content.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedYear !== "Todos") {
      filtered = filtered.filter(item => {
        const year = new Date(item.month_year).getFullYear().toString();
        return year === selectedYear;
      });
    }

    filtered.sort((a, b) => new Date(b.month_year) - new Date(a.month_year));
    setFilteredNews(filtered);
  }, [news, searchTerm, selectedYear]);

  const loadData = async () => {
    try {
      const currentUser = await User.me();
      setUser(currentUser);

      const newsData = await MonthlyNews.list('-month_year');
      setNews(newsData);
    } catch (error) {
      console.error("Erro ao carregar notícias:", error);
    }
  };

  const getAvailableYears = () => {
    const years = news.map(item => new Date(item.month_year).getFullYear());
    return ["Todos", ...new Set(years)].sort((a, b) => b - a);
  };

  const handleOpenNews = (newsItem) => { // Renamed from handleViewNews
    setSelectedNews(newsItem);
    setShowDetailDialog(true);
  };

  return (
    <div className="space-y-6">
      {/* Header com informações */}
      <div className="glass-card p-8 rounded-3xl">
        <div className="flex items-center gap-5 mb-4"> {/* Changed gap-4 to gap-5 */}
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
            <Newspaper className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold glass-text">MQ News</h1>
            <p className="glass-text-muted text-lg">Noticiário oficial da Mar Quente</p> {/* Updated text */}
          </div>
        </div>
        
        <div className="grid md:grid-cols-3 gap-4 mt-6">
          <div className="glass-card p-4 rounded-xl text-center">
            <div className="text-2xl font-bold glass-text">{filteredNews.length}</div>
            <div className="glass-text-muted text-sm">Edições Disponíveis</div>
          </div>
          <div className="glass-card p-4 rounded-xl text-center">
            <div className="text-2xl font-bold glass-text">
              {news.filter(item => {
                const itemDate = new Date(item.month_year);
                const now = new Date();
                return itemDate.getMonth() === now.getMonth() && itemDate.getFullYear() === now.getFullYear();
              }).length}
            </div>
            <div className="glass-text-muted text-sm">Edição deste Mês</div>
          </div>
          <div className="glass-card p-4 rounded-xl text-center">
            <div className="text-2xl font-bold glass-text">{getAvailableYears().length - 1}</div>
            <div className="glass-text-muted text-sm">Anos de Histórico</div>
          </div>
        </div>
      </div>

      {/* Controles de Busca e Filtros */}
      <div className="glass-card p-6 rounded-2xl">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 glass-text-muted" />
            <Input
              placeholder="Buscar notícias..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 glass-input"
            />
          </div>

          <div className="flex gap-2">
            {getAvailableYears().map(year => (
              <Button
                key={year}
                variant={selectedYear === year ? "default" : "outline"}
                onClick={() => setSelectedYear(year)}
                className={selectedYear === year ? "glass-button-primary" : "glass-button"}
              >
                {year}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Lista de Edições */} {/* Updated title */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredNews.length > 0 ? (
          filteredNews.map((newsItem) => (
            <div key={newsItem.id} className="glass-card rounded-2xl overflow-hidden hover:scale-105 transition-all">
              <div className="relative">
                <img 
                  src={newsItem.image_url || "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&auto=format&fit=crop"} 
                  alt={newsItem.title}
                  className="w-full h-48 object-cover"
                />
                {newsItem.is_published && (
                  <Badge className="absolute top-3 right-3 bg-green-500 text-white">
                    Publicado
                  </Badge>
                )}
              </div>

              <div className="p-5"> {/* Changed p-6 to p-5 */}
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="w-4 h-4 glass-text-muted" /> {/* Changed text-blue-600 to glass-text-muted */}
                  <span className="glass-text-muted text-sm font-semibold"> {/* Changed glass-text to glass-text-muted */}
                    {format(new Date(newsItem.month_year), "MMMM 'de' yyyy", { locale: ptBR })}
                  </span>
                </div>

                <h3 className="text-xl font-bold glass-text mb-2">{newsItem.title}</h3> {/* Removed line-clamp-2 */}
                <p className="glass-text-muted text-sm line-clamp-3">{newsItem.summary}</p>

                {newsItem.tags && newsItem.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3"> {/* Changed mb-4 to mt-3 */}
                    {newsItem.tags.slice(0, 3).map((tag, index) => (
                      <Badge key={index} variant="outline" className="glass-text text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}

                <div className="flex gap-2 mt-4">
                  <Button
                    onClick={() => handleOpenNews(newsItem)}
                    className="flex-1 glass-button-primary"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Ler Edição
                  </Button>
                  
                  {newsItem.pdf_url && (
                    <Button
                      asChild
                      variant="outline"
                      className="glass-button"
                    >
                      <a href={newsItem.pdf_url} target="_blank" rel="noopener noreferrer" download>
                        <Download className="w-4 h-4" />
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-12 glass-card rounded-2xl">
            <Newspaper className="w-16 h-16 glass-text-muted mx-auto mb-4 opacity-50" /> {/* Changed w-20 h-20 to w-16 h-16 */}
            <h3 className="text-xl font-semibold glass-text mb-2">Nenhuma edição encontrada</h3> {/* Updated text and font size */}
            <p className="glass-text-muted">
              {searchTerm || selectedYear !== "Todos" // Corrected selectedMonthFilter to selectedYear
                ? "Tente ajustar os filtros" // Updated text
                : "Ainda não há edições publicadas do MQ News" // Updated text
              }
            </p>
          </div>
        )}
      </div>

      {/* Modal de Detalhes */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="glass-modal max-w-4xl p-0 max-h-[90vh] overflow-hidden">
          {selectedNews && (
            <div className="overflow-y-auto max-h-[90vh]">
              {selectedNews.image_url && (
                <div className="h-64 w-full overflow-hidden">
                  <img 
                    src={selectedNews.image_url} 
                    alt={selectedNews.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              
              <div className="p-8">
                <div className="flex items-center gap-3 mb-4">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  <span className="text-lg font-semibold glass-text">
                    {format(new Date(selectedNews.month_year), "MMMM 'de' yyyy", { locale: ptBR })}
                  </span>
                </div>

                <h2 className="modal-title mb-4">{selectedNews.title}</h2>

                {selectedNews.tags && selectedNews.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-6">
                    {selectedNews.tags.map((tag, index) => (
                      <Badge key={index} variant="outline" className="glass-text">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}

                <div 
                  className="prose prose-lg max-w-none glass-text"
                  style={{ whiteSpace: 'pre-wrap' }}
                  dangerouslySetInnerHTML={{ __html: selectedNews.content }}
                />

                <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
                  <span className="text-sm glass-text-muted">
                    Publicado em {format(new Date(selectedNews.created_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </span>
                  <Button onClick={() => setShowDetailDialog(false)} className="glass-button-secondary">
                    Fechar
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
