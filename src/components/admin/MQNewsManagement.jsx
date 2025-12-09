import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Upload, Calendar, FileText } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function MQNewsManagement() {
  const [newsItems, setNewsItems] = useState([]);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [editingNews, setEditingNews] = useState(null);
  const [newNews, setNewNews] = useState({
    title: "",
    month_year: "",
    content: "",
    summary: "",
    image_url: "",
    pdf_url: "",
    is_published: false
  });
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadNews();
  }, []);

  const loadNews = async () => {
    try {
      const data = await base44.entities.MonthlyNews.list("-created_date");
      setNewsItems(data);
    } catch (error) {
      console.error("Erro ao carregar notícias:", error);
    }
  };

  const handleFileUpload = async (file, type) => {
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      if (type === 'pdf') {
        setNewNews(prev => ({ ...prev, pdf_url: file_url }));
      } else {
        setNewNews(prev => ({ ...prev, image_url: file_url }));
      }
    } catch (error) {
      console.error("Erro ao fazer upload:", error);
      alert("Erro ao fazer upload");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    try {
      if (editingNews) {
        await base44.entities.MonthlyNews.update(editingNews.id, newNews);
      } else {
        await base44.entities.MonthlyNews.create(newNews);
      }
      setShowNewDialog(false);
      setEditingNews(null);
      setNewNews({
        title: "",
        month_year: "",
        content: "",
        summary: "",
        image_url: "",
        pdf_url: "",
        is_published: false
      });
      await loadNews();
    } catch (error) {
      console.error("Erro ao salvar:", error);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Tem certeza que deseja excluir esta edição?")) return;
    try {
      await base44.entities.MonthlyNews.delete(id);
      await loadNews();
    } catch (error) {
      console.error("Erro ao excluir:", error);
    }
  };

  const handleEdit = (news) => {
    setEditingNews(news);
    setNewNews(news);
    setShowNewDialog(true);
  };

  return (
    <div className="space-y-6">
      <div className="glass-card p-6 rounded-2xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold glass-text">Gestão MQ News</h2>
            <p className="glass-text-muted mt-1">{newsItems.length} edições publicadas</p>
          </div>
          
          <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
            <DialogTrigger asChild>
              <Button className="glass-button-primary" onClick={() => {
                setEditingNews(null);
                setNewNews({
                  title: "",
                  month_year: "",
                  content: "",
                  summary: "",
                  image_url: "",
                  pdf_url: "",
                  is_published: false
                });
              }}>
                <Plus className="w-5 h-5 mr-2" />
                Nova Edição
              </Button>
            </DialogTrigger>
            <DialogContent className="glass-modal max-w-3xl p-0 max-h-[90vh] overflow-y-auto">
              <div className="p-8">
                <DialogHeader className="mb-6">
                  <h2 className="modal-title">{editingNews ? 'Editar' : 'Nova'} Edição</h2>
                </DialogHeader>

                <div className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="glass-label">Título da Edição</Label>
                      <Input
                        value={newNews.title}
                        onChange={(e) => setNewNews(prev => ({ ...prev, title: e.target.value }))}
                        className="glass-input"
                        placeholder="MQ News - Janeiro 2025"
                      />
                    </div>
                    <div>
                      <Label className="glass-label">Mês/Ano</Label>
                      <Input
                        type="date"
                        value={newNews.month_year}
                        onChange={(e) => setNewNews(prev => ({ ...prev, month_year: e.target.value }))}
                        className="glass-input"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="glass-label">Resumo</Label>
                    <Textarea
                      value={newNews.summary}
                      onChange={(e) => setNewNews(prev => ({ ...prev, summary: e.target.value }))}
                      className="glass-textarea"
                      rows={2}
                      placeholder="Resumo breve para visualização"
                    />
                  </div>

                  <div>
                    <Label className="glass-label">Conteúdo Completo</Label>
                    <Textarea
                      value={newNews.content}
                      onChange={(e) => setNewNews(prev => ({ ...prev, content: e.target.value }))}
                      className="glass-textarea"
                      rows={6}
                    />
                  </div>

                  <div>
                    <Label className="glass-label">Imagem de Capa</Label>
                    <div className="flex gap-2">
                      <Input
                        value={newNews.image_url}
                        onChange={(e) => setNewNews(prev => ({ ...prev, image_url: e.target.value }))}
                        className="glass-input flex-1"
                        placeholder="Cole a URL ou faça upload"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        className="glass-button"
                        disabled={uploading}
                        onClick={() => document.getElementById('news-image-upload').click()}
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Upload
                      </Button>
                      <input
                        id="news-image-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => e.target.files[0] && handleFileUpload(e.target.files[0], 'image')}
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="glass-label">PDF Completo</Label>
                    <div className="flex gap-2">
                      <Input
                        value={newNews.pdf_url}
                        onChange={(e) => setNewNews(prev => ({ ...prev, pdf_url: e.target.value }))}
                        className="glass-input flex-1"
                        placeholder="Cole a URL ou faça upload do PDF"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        className="glass-button"
                        disabled={uploading}
                        onClick={() => document.getElementById('news-pdf-upload').click()}
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Upload PDF
                      </Button>
                      <input
                        id="news-pdf-upload"
                        type="file"
                        accept="application/pdf"
                        className="hidden"
                        onChange={(e) => e.target.files[0] && handleFileUpload(e.target.files[0], 'pdf')}
                      />
                    </div>
                  </div>

                  <label className="flex items-center gap-3 p-3 glass-card rounded-lg cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newNews.is_published}
                      onChange={(e) => setNewNews(prev => ({ ...prev, is_published: e.target.checked }))}
                      className="w-5 h-5"
                    />
                    <span className="font-semibold glass-text">Publicar agora</span>
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

        <div className="grid gap-4">
          {newsItems.map(news => (
            <div key={news.id} className="glass-card p-5 rounded-xl">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-bold glass-text text-lg">{news.title}</h3>
                    {news.is_published ? (
                      <Badge className="bg-green-100 text-green-800">Publicado</Badge>
                    ) : (
                      <Badge className="bg-gray-100 text-gray-800">Rascunho</Badge>
                    )}
                  </div>
                  <p className="glass-text-muted text-sm mb-3">{news.summary}</p>
                  <div className="flex items-center gap-4 glass-text-muted text-sm">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {format(new Date(news.month_year), "MMMM yyyy", { locale: ptBR })}
                    </span>
                    {news.pdf_url && (
                      <span className="flex items-center gap-1 text-blue-600 font-semibold">
                        <FileText className="w-4 h-4" />
                        PDF disponível
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(news)} className="glass-button">
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(news.id)} className="glass-button text-red-600">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}