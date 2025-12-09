
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
} from "@/components/ui/dialog";
import { Search, Plus, Pencil, Trash2, Upload } from "lucide-react";

export default function ContentManagement() {
  const [contents, setContents] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [editingContent, setEditingContent] = useState(null);
  const [newContent, setNewContent] = useState({
    title: "",
    description: "",
    content_type: "Curso",
    category: "",
    department: "Todos",
    brand: "Todas",
    is_mandatory: false,
    file_url: "",
    canva_link: "", // New field
    quiz_id: "",     // New field
    thumbnail_url: ""
  });
  const [uploading, setUploading] = useState(false);
  const [quizzes, setQuizzes] = useState([]); // New state for quizzes

  const categories = ["Normas da Fábrica", "Segurança no Trabalho", "Primeiros Socorros", "Liderança", "Inteligência Artificial", "Inteligência Emocional", "Desenvolvimento Humano", "Clube do Livro"];
  const contentTypes = ["Curso", "Documento", "Vídeo", "Link", "PDF", "Apresentação"];
  const departments = ["Todos", "RH", "TI", "Financeiro", "Marketing", "Vendas", "Operações", "Diretoria", "Produção", "Criação", "Logística"];
  const brands = ["Todas", "Corporativo", "Dixie", "Gangster", "Overcore"];

  useEffect(() => {
    loadContents();
    loadQuizzes(); // Load quizzes for selection
  }, []);

  const loadContents = async () => {
    try {
      const data = await base44.entities.Content.list("-created_date");
      setContents(data);
    } catch (error) {
      console.error("Erro ao carregar conteúdos:", error);
    }
  };

  const loadQuizzes = async () => {
    try {
      const data = await base44.entities.CustomForm.filter({ form_type: "Quiz", status: "Ativo" });
      setQuizzes(data);
    } catch (error) {
      console.error("Erro ao carregar quizzes:", error);
    }
  };

  const handleFileUpload = async (file, type) => {
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      if (type === 'file') {
        setNewContent(prev => ({ ...prev, file_url }));
      } else {
        setNewContent(prev => ({ ...prev, thumbnail_url: file_url }));
      }
    } catch (error) {
      console.error("Erro ao fazer upload:", error);
      alert("Erro ao fazer upload do arquivo");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    try {
      if (editingContent) {
        await base44.entities.Content.update(editingContent.id, newContent);
      } else {
        await base44.entities.Content.create(newContent);
      }
      setShowNewDialog(false);
      setEditingContent(null);
      setNewContent({
        title: "",
        description: "",
        content_type: "Curso",
        category: "",
        department: "Todos",
        brand: "Todas",
        is_mandatory: false,
        file_url: "",
        canva_link: "", // Reset new field
        quiz_id: "",     // Reset new field
        thumbnail_url: ""
      });
      await loadContents();
    } catch (error) {
      console.error("Erro ao salvar conteúdo:", error);
      alert("Erro ao salvar");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Tem certeza que deseja excluir este conteúdo?")) return;
    try {
      await base44.entities.Content.delete(id);
      await loadContents();
    } catch (error) {
      console.error("Erro ao excluir:", error);
    }
  };

  const handleEdit = (content) => {
    setEditingContent(content);
    // Ensure canva_link and quiz_id are initialized if they don't exist on older content objects
    setNewContent({
      ...content,
      canva_link: content.canva_link || "",
      quiz_id: content.quiz_id || ""
    });
    setShowNewDialog(true);
  };

  const filteredContents = contents.filter(c =>
    c.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="glass-card p-6 rounded-2xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold glass-text">Gestão de Conteúdos e Cursos</h2>
            <p className="glass-text-muted mt-1">{contents.length} conteúdos cadastrados</p>
          </div>
          
          <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
            <DialogTrigger asChild>
              <Button className="glass-button-primary" onClick={() => {
                setEditingContent(null);
                setNewContent({
                  title: "",
                  description: "",
                  content_type: "Curso",
                  category: "",
                  department: "Todos",
                  brand: "Todas",
                  is_mandatory: false,
                  file_url: "",
                  canva_link: "", // Initialize new field
                  quiz_id: "",     // Initialize new field
                  thumbnail_url: ""
                });
              }}>
                <Plus className="w-5 h-5 mr-2" />
                Novo Conteúdo
              </Button>
            </DialogTrigger>
            <DialogContent className="glass-modal max-w-3xl p-0 max-h-[90vh] overflow-y-auto">
              <div className="p-8">
                <DialogHeader className="mb-6">
                  <h2 className="modal-title">{editingContent ? 'Editar' : 'Novo'} Conteúdo</h2>
                </DialogHeader>

                <div className="space-y-5">
                  <div>
                    <Label className="glass-label">Título</Label>
                    <Input
                      value={newContent.title}
                      onChange={(e) => setNewContent(prev => ({ ...prev, title: e.target.value }))}
                      className="glass-input"
                    />
                  </div>

                  <div>
                    <Label className="glass-label">Descrição</Label>
                    <Textarea
                      value={newContent.description}
                      onChange={(e) => setNewContent(prev => ({ ...prev, description: e.target.value }))}
                      className="glass-textarea"
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="glass-label">Tipo de Conteúdo</Label>
                      <Select value={newContent.content_type} onValueChange={(value) => setNewContent(prev => ({ ...prev, content_type: value }))}>
                        <SelectTrigger className="glass-select">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {contentTypes.map(type => (
                            <SelectItem key={type} value={type}>{type}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="glass-label">Categoria</Label>
                      <Select value={newContent.category} onValueChange={(value) => setNewContent(prev => ({ ...prev, category: value }))}>
                        <SelectTrigger className="glass-select">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map(cat => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="glass-label">Departamento</Label>
                      <Select value={newContent.department} onValueChange={(value) => setNewContent(prev => ({ ...prev, department: value }))}>
                        <SelectTrigger className="glass-select">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {departments.map(dept => (
                            <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="glass-label">Marca</Label>
                      <Select value={newContent.brand} onValueChange={(value) => setNewContent(prev => ({ ...prev, brand: value }))}>
                        <SelectTrigger className="glass-select">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {brands.map(brand => (
                            <SelectItem key={brand} value={brand}>{brand}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* NOVO: Link do Canva */}
                  <div>
                    <Label className="glass-label">🎨 Link do Canva (Conteúdo do Curso)</Label>
                    <Input
                      value={newContent.canva_link}
                      onChange={(e) => setNewContent(prev => ({ ...prev, canva_link: e.target.value }))}
                      className="glass-input"
                      placeholder="https://www.canva.com/design/..."
                    />
                    <p className="text-sm text-gray-600 font-semibold mt-1">
                      💡 Cole o link de compartilhamento do seu design no Canva
                    </p>
                  </div>

                  {/* NOVO: Vincular Quiz */}
                  <div>
                    <Label className="glass-label">🏆 Quiz Vinculado (Opcional)</Label>
                    <Select value={newContent.quiz_id || ""} onValueChange={(value) => setNewContent(prev => ({ ...prev, quiz_id: value }))}>
                      <SelectTrigger className="glass-select">
                        <SelectValue placeholder="Selecione um quiz..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={null}>Nenhum quiz</SelectItem> {/* Changed to empty string for consistent reset */}
                        {quizzes.map(quiz => (
                          <SelectItem key={quiz.id} value={quiz.id}>
                            {quiz.title} ({quiz.total_points || 0} pts)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-gray-600 font-semibold mt-1">
                      💡 O colaborador verá o conteúdo e depois poderá fazer o quiz para ganhar pontos
                    </p>
                  </div>

                  <div>
                    <Label className="glass-label">URL do Arquivo/Link</Label>
                    <div className="flex gap-2">
                      <Input
                        value={newContent.file_url}
                        onChange={(e) => setNewContent(prev => ({ ...prev, file_url: e.target.value }))}
                        className="glass-input flex-1"
                        placeholder="Cole a URL ou faça upload"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        className="glass-button"
                        disabled={uploading}
                        onClick={() => document.getElementById('file-upload').click()}
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Upload
                      </Button>
                      <input
                        id="file-upload"
                        type="file"
                        className="hidden"
                        onChange={(e) => e.target.files[0] && handleFileUpload(e.target.files[0], 'file')}
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="glass-label">URL da Thumbnail</Label>
                    <div className="flex gap-2">
                      <Input
                        value={newContent.thumbnail_url}
                        onChange={(e) => setNewContent(prev => ({ ...prev, thumbnail_url: e.target.value }))}
                        className="glass-input flex-1"
                        placeholder="Cole a URL ou faça upload"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        className="glass-button"
                        disabled={uploading}
                        onClick={() => document.getElementById('thumb-upload').click()}
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Upload
                      </Button>
                      <input
                        id="thumb-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => e.target.files[0] && handleFileUpload(e.target.files[0], 'thumb')}
                      />
                    </div>
                  </div>

                  <label className="flex items-center gap-3 p-3 glass-card rounded-lg cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newContent.is_mandatory}
                      onChange={(e) => setNewContent(prev => ({ ...prev, is_mandatory: e.target.checked }))}
                      className="w-5 h-5"
                    />
                    <span className="font-semibold glass-text">Conteúdo Obrigatório</span>
                  </label>
                </div>

                <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-gray-200">
                  <Button variant="ghost" onClick={() => setShowNewDialog(false)} className="glass-button-secondary">
                    Cancelar
                  </Button>
                  <Button onClick={handleSave} className="glass-button-primary" disabled={uploading}>
                    {uploading ? 'Uploading...' : 'Salvar'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 glass-text-muted" />
            <Input
              placeholder="Buscar conteúdos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 glass-input"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="glass-text">Título</TableHead>
                <TableHead className="glass-text">Tipo</TableHead>
                <TableHead className="glass-text">Categoria</TableHead>
                <TableHead className="glass-text">Departamento</TableHead>
                <TableHead className="glass-text">Status</TableHead>
                <TableHead className="glass-text text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredContents.map(content => (
                <TableRow key={content.id}>
                  <TableCell className="glass-text font-medium">{content.title}</TableCell>
                  <TableCell className="glass-text">{content.content_type}</TableCell>
                  <TableCell className="glass-text">{content.category}</TableCell>
                  <TableCell className="glass-text">{content.department}</TableCell>
                  <TableCell>
                    {content.is_mandatory && (
                      <Badge className="bg-red-100 text-red-800">Obrigatório</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(content)} className="glass-button">
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(content.id)} className="glass-button text-red-600">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
