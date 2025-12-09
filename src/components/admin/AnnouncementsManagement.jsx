
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Trash2, Calendar, Upload, Image, Play, FileText } from "lucide-react"; // Added Upload, Image, Play, FileText
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function AnnouncementsManagement() {
  const [announcements, setAnnouncements] = useState([]);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: "",
    content: "",
    category: "Geral",
    priority: "Normal",
    department_target: "Todos",
    image_url: "",
    video_url: "",
    pdf_url: "", // NEW: Add PDF support
    is_pinned: false
  });
  const [uploading, setUploading] = useState(false); // NEW: Add uploading state

  const categories = ["Geral", "RH", "TI", "Eventos", "Urgente", "Diretoria", "Liderança", "Boletim de Produção"];
  const departments = ["Todos", "RH", "TI", "Financeiro", "Marketing", "Vendas", "Operações", "Diretoria", "Produção"];

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const loadAnnouncements = async () => {
    try {
      const data = await base44.entities.Announcement.list("-created_date");
      setAnnouncements(data);
    } catch (error) {
      console.error("Erro ao carregar comunicados:", error);
    }
  };

  const handleFileUpload = async (file, type) => {
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      if (type === 'image') {
        setNewAnnouncement(prev => ({ ...prev, image_url: file_url }));
      } else if (type === 'pdf') {
        setNewAnnouncement(prev => ({ ...prev, pdf_url: file_url }));
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
      await base44.entities.Announcement.create(newAnnouncement);
      setShowNewDialog(false);
      setNewAnnouncement({
        title: "",
        content: "",
        category: "Geral",
        priority: "Normal",
        department_target: "Todos",
        image_url: "",
        video_url: "",
        pdf_url: "", // Reset pdf_url
        is_pinned: false
      });
      await loadAnnouncements();
    } catch (error) {
      console.error("Erro ao salvar:", error);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Tem certeza que deseja excluir este comunicado?")) return;
    try {
      await base44.entities.Announcement.delete(id);
      await loadAnnouncements();
    } catch (error) {
      console.error("Erro ao excluir:", error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="glass-card p-6 rounded-2xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold glass-text">Gestão do Mural</h2>
            <p className="glass-text-muted mt-1">{announcements.length} comunicados publicados</p>
          </div>
          
          <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
            <DialogTrigger asChild>
              <Button className="glass-button-primary">
                <Plus className="w-5 h-5 mr-2" />
                Novo Comunicado
              </Button>
            </DialogTrigger>
            <DialogContent className="glass-modal max-w-3xl p-0 max-h-[90vh] overflow-y-auto">
              <div className="p-8">
                <DialogHeader className="mb-6">
                  <h2 className="modal-title">Novo Comunicado</h2>
                </DialogHeader>

                <div className="space-y-5">
                  <div>
                    <Label className="glass-label">Título</Label>
                    <Input
                      value={newAnnouncement.title}
                      onChange={(e) => setNewAnnouncement(prev => ({ ...prev, title: e.target.value }))}
                      className="glass-input"
                    />
                  </div>

                  <div>
                    <Label className="glass-label">Conteúdo</Label>
                    <Textarea
                      value={newAnnouncement.content}
                      onChange={(e) => setNewAnnouncement(prev => ({ ...prev, content: e.target.value }))}
                      className="glass-textarea"
                      rows={6}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label className="glass-label">Categoria</Label>
                      <Select value={newAnnouncement.category} onValueChange={(value) => setNewAnnouncement(prev => ({ ...prev, category: value }))}>
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
                    <div>
                      <Label className="glass-label">Prioridade</Label>
                      <Select value={newAnnouncement.priority} onValueChange={(value) => setNewAnnouncement(prev => ({ ...prev, priority: value }))}>
                        <SelectTrigger className="glass-select">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Baixa">Baixa</SelectItem>
                          <SelectItem value="Normal">Normal</SelectItem>
                          <SelectItem value="Alta">Alta</SelectItem>
                          <SelectItem value="Urgente">Urgente</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="glass-label">Departamento</Label>
                      <Select value={newAnnouncement.department_target} onValueChange={(value) => setNewAnnouncement(prev => ({ ...prev, department_target: value }))}>
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
                  </div>

                  {/* NOVO: Seção de Mídia */}
                  <div className="glass-card p-5 rounded-xl bg-blue-50/30">
                    <h3 className="font-bold text-gray-900 mb-4">📎 Anexar Mídia (Opcional)</h3>
                    
                    {/* Imagem */}
                    <div className="mb-4">
                      <Label className="glass-label">🖼️ Imagem</Label>
                      <div className="flex gap-2">
                        <Input
                          value={newAnnouncement.image_url}
                          onChange={(e) => setNewAnnouncement(prev => ({ ...prev, image_url: e.target.value }))}
                          className="glass-input flex-1"
                          placeholder="Cole a URL ou faça upload da imagem"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          className="glass-button"
                          disabled={uploading}
                          onClick={() => document.getElementById('announcement-image-upload').click()}
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          Upload
                        </Button>
                        <input
                          id="announcement-image-upload"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => e.target.files[0] && handleFileUpload(e.target.files[0], 'image')}
                        />
                      </div>
                    </div>

                    {/* Vídeo */}
                    <div className="mb-4">
                      <Label className="glass-label">🎥 Link do Vídeo</Label>
                      <Input
                        value={newAnnouncement.video_url}
                        onChange={(e) => setNewAnnouncement(prev => ({ ...prev, video_url: e.target.value }))}
                        className="glass-input"
                        placeholder="Cole o link do YouTube, Vimeo, etc."
                      />
                      <p className="text-xs text-gray-600 mt-1">
                        💡 Suporta YouTube, Vimeo e links diretos de vídeo
                      </p>
                    </div>

                    {/* PDF */}
                    <div>
                      <Label className="glass-label">📄 Documento PDF</Label>
                      <div className="flex gap-2">
                        <Input
                          value={newAnnouncement.pdf_url}
                          onChange={(e) => setNewAnnouncement(prev => ({ ...prev, pdf_url: e.target.value }))}
                          className="glass-input flex-1"
                          placeholder="Cole a URL ou faça upload do PDF"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          className="glass-button"
                          disabled={uploading}
                          onClick={() => document.getElementById('announcement-pdf-upload').click()}
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          Upload PDF
                        </Button>
                        <input
                          id="announcement-pdf-upload"
                          type="file"
                          accept="application/pdf"
                          className="hidden"
                          onChange={(e) => e.target.files[0] && handleFileUpload(e.target.files[0], 'pdf')}
                        />
                      </div>
                    </div>
                  </div>

                  <label className="flex items-center gap-3 p-3 glass-card rounded-lg cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newAnnouncement.is_pinned}
                      onChange={(e) => setNewAnnouncement(prev => ({ ...prev, is_pinned: e.target.checked }))}
                      className="w-5 h-5"
                    />
                    <span className="font-semibold glass-text">Fixar no topo</span>
                  </label>
                </div>

                <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-gray-200">
                  <Button variant="ghost" onClick={() => setShowNewDialog(false)} className="glass-button-secondary">
                    Cancelar
                  </Button>
                  <Button onClick={handleSave} className="glass-button-primary" disabled={uploading}>
                    {uploading ? 'Fazendo upload...' : 'Publicar'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4">
          {announcements.map(announcement => (
            <div key={announcement.id} className="glass-card p-5 rounded-xl">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-bold glass-text">{announcement.title}</h3>
                    <Badge variant="outline">{announcement.category}</Badge>
                    <Badge className="bg-blue-100 text-blue-800">{announcement.priority}</Badge>
                    {announcement.is_pinned && <Badge className="bg-yellow-100 text-yellow-800">Fixado</Badge>}
                  </div>
                  <p className="glass-text-muted text-sm mb-2 line-clamp-2">{announcement.content}</p>
                  
                  {/* NEW: Mostrar ícones de mídia anexada */}
                  <div className="flex items-center gap-3 mb-2">
                    {announcement.image_url && (
                      <Badge variant="outline" className="text-xs">
                        <Image className="w-3 h-3 mr-1" />
                        Imagem
                      </Badge>
                    )}
                    {announcement.video_url && (
                      <Badge variant="outline" className="text-xs">
                        <Play className="w-3 h-3 mr-1" />
                        Vídeo
                      </Badge>
                    )}
                    {announcement.pdf_url && (
                      <Badge variant="outline" className="text-xs">
                        <FileText className="w-3 h-3 mr-1" />
                        PDF
                      </Badge>
                    )}
                  </div>

                  <span className="glass-text-muted text-xs flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {format(new Date(announcement.created_date), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                  </span>
                </div>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(announcement.id)} className="glass-button text-red-600">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
