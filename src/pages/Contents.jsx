import React, { useState, useEffect } from "react";
import { Content } from "@/entities/Content";
import { User } from "@/entities/User";
import { 
  FileText, 
  Image, 
  Star,
  Eye,
  BookOpen,
  Video,
  ExternalLink,
  AlertCircle
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Contents() {
  const [contents, setContents] = useState([]);
  const [filteredContents, setFilteredContents] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todas");
  const [selectedType, setSelectedType] = useState("Todos");
  const [selectedBrand, setSelectedBrand] = useState("Todas");
  const [user, setUser] = useState(null);

  const categories = ["Todas", "Normas da Fábrica", "Segurança no Trabalho", "Primeiros Socorros", "Liderança", "Inteligência Artificial", "Inteligência Emocional", "Desenvolvimento Humano", "Clube do Livro", "FAQ", "Empresa", "Terceiros", "Política", "Manual"];
  const types = ["Todos", "Curso", "Documento", "Vídeo", "Link", "Imagem", "PDF", "Apresentação"];
  const brands = ["Todas", "Corporativo", "Dixie", "Gangster", "Overcore"];

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    let filtered = contents;

    if (user) {
        // Filtrar por nível de acesso
        filtered = filtered.filter(content => {
            // Verificar departamento e marca
            const deptMatch = content.department === "Todos" || content.department === user.department;
            const brandMatch = content.brand === "Todas" || content.brand === user.brand;
            
            if (!deptMatch || !brandMatch) return false;

            // Verificar nível de acesso
            const accessLevel = content.access_level || "Todos";
            
            if (accessLevel === "Todos") return true;
            if (accessLevel === "Apenas Admin") return user.role === 'admin';
            if (accessLevel === "Admin e RH") return user.role === 'admin' || user.department === 'RH';
            if (accessLevel === "Admin, RH e Líderes") {
                return user.role === 'admin' || 
                       user.department === 'RH' || 
                       (user.team_members && user.team_members.length > 0);
            }
            if (accessLevel === "Personalizado") {
                // Verificar se o usuário está na lista de permitidos
                if (content.allowed_users && content.allowed_users.includes(user.email)) return true;
                // Verificar se o cargo do usuário está permitido
                if (content.allowed_positions && content.allowed_positions.includes(user.position)) return true;
                return false;
            }
            
            return true;
        });
    }

    if (searchTerm) {
      filtered = filtered.filter(content => 
        content.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        content.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        content.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (selectedCategory !== "Todas") {
      filtered = filtered.filter(content => content.category === selectedCategory);
    }

    if (selectedType !== "Todos") {
      filtered = filtered.filter(content => content.content_type === selectedType);
    }
    
    if (selectedBrand !== "Todas") {
        filtered = filtered.filter(content => content.brand === "Todas" || content.brand === selectedBrand);
    }

    setFilteredContents(filtered);
  }, [contents, searchTerm, selectedCategory, selectedType, selectedBrand, user]);

  const loadData = async () => {
    try {
      const [contentData, currentUser] = await Promise.all([
        Content.list('-created_date'),
        User.me()
      ]);
      setContents(contentData);
      setUser(currentUser);
    } catch (error) {
      console.error("Erro ao carregar conteúdos:", error);
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'Vídeo': return Video;
      case 'Link': return ExternalLink;
      case 'Imagem': return Image;
      case 'PDF': return FileText;
      case 'Apresentação': return BookOpen;
      case 'Documento': return FileText;
      case 'Curso': return BookOpen;
      default: return FileText;
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'Vídeo': return 'bg-red-500/80';
      case 'Link': return 'bg-blue-500/80';
      case 'Imagem': return 'bg-green-500/80';
      case 'PDF': return 'bg-orange-500/80';
      case 'Apresentação': return 'bg-purple-500/80';
      case 'Documento': return 'bg-slate-500/80';
      case 'Curso': return 'bg-indigo-500/80';
      default: return 'bg-slate-500/80';
    }
  };

  const ContentCard = ({ content }) => {
    const TypeIcon = getTypeIcon(content.content_type);
    
    return (
        <div className="glass-card rounded-2xl overflow-hidden group flex flex-col hover:shadow-xl transition-all">
            <div className="relative">
                <img 
                    src={content.thumbnail_url || "https://images.unsplash.com/photo-1588345921523-c2dcdb7f1dcd?w=400&h=250&fit=crop"} 
                    alt={content.title}
                    className="w-full h-40 object-cover"
                />
                <div className={`absolute top-3 right-3 px-3 py-1.5 rounded-full text-white text-xs font-bold flex items-center gap-1.5 ${getTypeColor(content.content_type)} shadow-lg`}>
                    <TypeIcon className="w-3.5 h-3.5" />
                    <span>{content.content_type}</span>
                </div>
                 {content.is_featured && (
                    <div className="absolute top-3 left-3 px-3 py-1.5 rounded-full text-white text-xs font-bold flex items-center gap-1.5 bg-yellow-500/90 shadow-lg">
                        <Star className="w-3.5 h-3.5" />
                        <span>Destaque</span>
                    </div>
                )}
            </div>
            <div className="p-5 flex-grow flex flex-col bg-white/95">
                <Badge variant="secondary" className="mb-3 self-start text-xs font-bold bg-blue-100 text-blue-900">{content.category}</Badge>
                <h3 className="font-bold text-gray-900 text-base mb-2 leading-tight">{content.title}</h3>
                <p className="text-sm text-gray-700 leading-relaxed mb-4 line-clamp-2 font-medium">{content.description}</p>
                
                <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-200">
                    <div className="flex items-center text-sm text-gray-600 gap-3">
                        <div className="flex items-center gap-1.5">
                            <Eye className="w-4 h-4" />
                            <span className="font-semibold">{content.views || 0}</span>
                        </div>
                        {content.is_mandatory && (
                            <div className="flex items-center gap-1.5 text-red-700 font-bold">
                                <AlertCircle className="w-4 h-4" />
                                <span>Obrigatório</span>
                            </div>
                        )}
                    </div>
                    <Button size="sm" className="glass-button-primary font-bold text-xs px-4">Ver</Button>
                </div>
            </div>
        </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <div className="glass-card p-4 md:p-6 rounded-2xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 md:gap-4">
          <div className="md:col-span-1">
            <Input
              placeholder="Buscar conteúdo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="glass-input bg-white"
            />
          </div>
          
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="glass-select bg-white">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              {categories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger className="glass-select bg-white">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              {types.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
            </SelectContent>
          </Select>
          
           <Select value={selectedBrand} onValueChange={setSelectedBrand}>
            <SelectTrigger className="glass-select bg-white">
              <SelectValue placeholder="Marca" />
            </SelectTrigger>
            <SelectContent>
              {brands.map(brand => <SelectItem key={brand} value={brand}>{brand}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Lista de Conteúdos */}
      <div>
        {filteredContents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {filteredContents.map(content => <ContentCard key={content.id} content={content} />)}
          </div>
        ) : (
          <div className="text-center py-12 glass-card rounded-2xl">
            <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhum conteúdo encontrado</h3>
            <p className="text-gray-600 text-sm font-medium">Tente ajustar seus filtros para encontrar o que procura.</p>
          </div>
        )}
      </div>
    </div>
  );
}