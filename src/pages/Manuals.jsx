import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { User } from "@/entities/User";
import { 
  FileText, 
  Download, 
  Search,
  Eye,
  BookOpen,
  File,
  ExternalLink,
  Calendar,
  Building,
  FolderOpen
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
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Manuals() {
  const [contents, setContents] = useState([]);
  const [filteredContents, setFilteredContents] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todas");
  const [selectedType, setSelectedType] = useState("Todos");
  const [selectedDepartment, setSelectedDepartment] = useState("Todos");
  const [user, setUser] = useState(null);

  const categories = [
    "Todas", 
    "Manual", 
    "Normas da Fábrica", 
    "Política", 
    "FAQ", 
    "Empresa", 
    "Terceiros",
    "Segurança no Trabalho",
    "Primeiros Socorros"
  ];
  
  const types = ["Todos", "PDF", "Apresentação", "Documento", "Link"];
  
  const departments = [
    "Todos", 
    "RH", 
    "TI", 
    "Financeiro", 
    "Marketing", 
    "Vendas", 
    "Operações", 
    "Diretoria", 
    "Produção", 
    "Criação", 
    "Logística"
  ];

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    let filtered = contents;

    // Filtrar por usuário
    if (user) {
      filtered = filtered.filter(content => 
        (content.department === "Todos" || content.department === user.department) &&
        (content.brand === "Todas" || content.brand === user.brand)
      );
    }

    // Filtrar por busca
    if (searchTerm) {
      filtered = filtered.filter(content => 
        content.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        content.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        content.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Filtrar por categoria
    if (selectedCategory !== "Todas") {
      filtered = filtered.filter(content => content.category === selectedCategory);
    }

    // Filtrar por tipo
    if (selectedType !== "Todos") {
      filtered = filtered.filter(content => content.content_type === selectedType);
    }

    // Filtrar por departamento
    if (selectedDepartment !== "Todos") {
      filtered = filtered.filter(content => 
        content.department === "Todos" || content.department === selectedDepartment
      );
    }

    setFilteredContents(filtered);
  }, [contents, searchTerm, selectedCategory, selectedType, selectedDepartment, user]);

  const loadData = async () => {
    try {
      const [contentData, currentUser] = await Promise.all([
        base44.entities.Content.list('-created_date'),
        User.me()
      ]);
      
      // Filtrar apenas documentos/manuais relevantes
      const manuals = contentData.filter(c => 
        ["Manual", "Normas da Fábrica", "Política", "FAQ", "Empresa", "Terceiros", "Segurança no Trabalho", "Primeiros Socorros"].includes(c.category) &&
        ["PDF", "Apresentação", "Documento", "Link"].includes(c.content_type)
      );
      
      setContents(manuals);
      setUser(currentUser);
    } catch (error) {
      console.error("Erro ao carregar manuais:", error);
    }
  };

  const handleDownload = (content) => {
    if (content.file_url) {
      window.open(content.file_url, '_blank');
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'PDF': return FileText;
      case 'Link': return ExternalLink;
      case 'Apresentação': return BookOpen;
      case 'Documento': return File;
      default: return FileText;
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'PDF': return 'from-red-500 to-red-600';
      case 'Link': return 'from-blue-500 to-blue-600';
      case 'Apresentação': return 'from-orange-500 to-orange-600';
      case 'Documento': return 'from-gray-500 to-gray-600';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  const ManualCard = ({ content }) => {
    const TypeIcon = getTypeIcon(content.content_type);
    
    return (
      <div className="glass-card rounded-2xl overflow-hidden hover:shadow-xl transition-all">
        <div className="p-6 bg-white/95">
          <div className="flex items-start gap-4 mb-4">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center bg-gradient-to-r ${getTypeColor(content.content_type)} shadow-lg flex-shrink-0`}>
              <TypeIcon className="w-8 h-8 text-white" />
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-gray-900 text-lg mb-2 leading-tight">{content.title}</h3>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <Badge variant="secondary" className="text-xs font-bold bg-blue-100 text-blue-900">
                  {content.category}
                </Badge>
                <Badge variant="outline" className="text-xs font-semibold">
                  {content.content_type}
                </Badge>
                {content.department && content.department !== "Todos" && (
                  <Badge variant="outline" className="text-xs">
                    <Building className="w-3 h-3 mr-1" />
                    {content.department}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {content.description && (
            <p className="text-sm text-gray-700 leading-relaxed mb-4 line-clamp-2 font-medium">
              {content.description}
            </p>
          )}

          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <div className="flex items-center gap-4 text-xs text-gray-600">
              <div className="flex items-center gap-1.5">
                <Eye className="w-4 h-4" />
                <span className="font-semibold">{content.views || 0} views</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                <span className="font-semibold">
                  {format(new Date(content.created_date), "dd/MM/yy", { locale: ptBR })}
                </span>
              </div>
            </div>

            <Button 
              onClick={() => handleDownload(content)} 
              size="sm" 
              className="glass-button-primary font-bold text-xs px-4"
            >
              <Download className="w-3.5 h-3.5 mr-2" />
              {content.content_type === 'Link' ? 'Acessar' : 'Baixar'}
            </Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-card p-6 rounded-2xl">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-purple-500 to-purple-600 flex items-center justify-center shadow-lg">
            <FolderOpen className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold glass-text">Diretório de Manuais</h1>
            <p className="glass-text-muted mt-1 text-lg">Documentos, políticas, normas e procedimentos</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card p-5 rounded-xl text-center">
          <div className="text-3xl font-bold text-purple-600">{filteredContents.length}</div>
          <div className="text-sm glass-text-muted mt-1 font-semibold">Total de Documentos</div>
        </div>
        <div className="glass-card p-5 rounded-xl text-center">
          <div className="text-3xl font-bold text-red-600">
            {filteredContents.filter(c => c.content_type === 'PDF').length}
          </div>
          <div className="text-sm glass-text-muted mt-1 font-semibold">PDFs</div>
        </div>
        <div className="glass-card p-5 rounded-xl text-center">
          <div className="text-3xl font-bold text-orange-600">
            {filteredContents.filter(c => c.content_type === 'Apresentação').length}
          </div>
          <div className="text-sm glass-text-muted mt-1 font-semibold">Apresentações</div>
        </div>
        <div className="glass-card p-5 rounded-xl text-center">
          <div className="text-3xl font-bold text-blue-600">
            {filteredContents.filter(c => c.content_type === 'Link').length}
          </div>
          <div className="text-sm glass-text-muted mt-1 font-semibold">Links</div>
        </div>
      </div>

      {/* Filtros */}
      <div className="glass-card p-4 md:p-6 rounded-2xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 md:gap-4">
          <div className="md:col-span-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 glass-text-muted" />
              <Input
                placeholder="Buscar documento..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 glass-input bg-white"
              />
            </div>
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

          <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
            <SelectTrigger className="glass-select bg-white">
              <SelectValue placeholder="Departamento" />
            </SelectTrigger>
            <SelectContent>
              {departments.map(dept => <SelectItem key={dept} value={dept}>{dept}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Lista de Manuais */}
      <div>
        {filteredContents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {filteredContents.map(content => <ManualCard key={content.id} content={content} />)}
          </div>
        ) : (
          <div className="text-center py-12 glass-card rounded-2xl">
            <FolderOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhum documento encontrado</h3>
            <p className="text-gray-600 text-sm font-medium">Tente ajustar seus filtros para encontrar o que procura.</p>
          </div>
        )}
      </div>
    </div>
  );
}