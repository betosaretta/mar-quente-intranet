import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { AnonymousComplaint } from "@/entities/AnonymousComplaint";
import {
  Shield,
  AlertTriangle,
  Lock,
  CheckCircle,
  Search,
  Eye,
  Clock
} from "lucide-react";
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
} from "@/components/ui/dialog";

export default function AnonymousComplaintPage() {
  // Renamed 'complaint' to 'newComplaint' for the modal form
  const [newComplaint, setNewComplaint] = useState({
    title: "",
    description: "",
    category: "",
    location: "Não informado",
    incident_date: "",
    attachment_url: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [protocolNumber, setProtocolNumber] = useState("");
  const [uploadingFile, setUploadingFile] = useState(false);
  // New state for controlling the modal
  const [showNewComplaintDialog, setShowNewComplaintDialog] = useState(false);
  
  // Estados para acompanhamento
  const [showTrackDialog, setShowTrackDialog] = useState(false);
  const [trackProtocol, setTrackProtocol] = useState("");
  const [trackingComplaint, setTrackingComplaint] = useState(null);
  const [trackingError, setTrackingError] = useState("");

  const categories = [
    "Assédio Moral",
    "Assédio Sexual",
    "Discriminação",
    "Má Conduta",
    "Fraude",
    "Segurança do Trabalho",
    "Outro"
  ];

  const locations = [
    "Não informado",
    "Guarulhos",
    "Joinville",
    "Agrolândia",
    "Lojas",
    "Escritório"
  ];

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingFile(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      // Update newComplaint state for the file URL
      setNewComplaint(prev => ({ ...prev, attachment_url: file_url }));
    } catch (error) {
      console.error("Erro ao fazer upload:", error);
      alert("Erro ao enviar arquivo. Tente novamente.");
    } finally {
      setUploadingFile(false);
    }
  };

  const generateProtocol = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000);
    return `CAC-${year}${month}${day}-${random}`;
  };

  // Renamed to handleSubmitComplaint as it's triggered by onClick, not form onSubmit
  const handleSubmitComplaint = async () => {
    if (!newComplaint.title.trim() || !newComplaint.description.trim() || !newComplaint.category) {
      alert("Por favor, preencha todos os campos obrigatórios.");
      return;
    }

    setIsSubmitting(true);

    try {
      const protocol = generateProtocol();

      await AnonymousComplaint.create({
        ...newComplaint, // Use newComplaint data
        protocol_number: protocol,
        status: "Nova",
        timeline: [{
          date: new Date().toISOString(),
          action: "Denúncia Registrada",
          description: "Denúncia anônima registrada no sistema"
        }]
      });

      setProtocolNumber(protocol);
      setSubmitted(true);
      // Close the modal upon successful submission
      setShowNewComplaintDialog(false);
      // Reset the form after submission
      setNewComplaint({
        title: "",
        description: "",
        category: "",
        location: "Não informado",
        incident_date: "",
        attachment_url: ""
      });
    } catch (error) {
      console.error("Erro ao enviar denúncia:", error);
      alert("Erro ao enviar denúncia. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTrackComplaint = async () => {
    if (!trackProtocol.trim()) {
      setTrackingError("Digite um número de protocolo");
      return;
    }

    try {
      const complaints = await base44.entities.AnonymousComplaint.filter({ 
        protocol_number: trackProtocol.trim() 
      });

      if (complaints.length === 0) {
        setTrackingError("Protocolo não encontrado. Verifique o número e tente novamente.");
        setTrackingComplaint(null);
      } else {
        setTrackingComplaint(complaints[0]);
        setTrackingError("");
      }
    } catch (error) {
      console.error("Erro ao buscar protocolo:", error);
      setTrackingError("Erro ao buscar protocolo. Tente novamente.");
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case "Nova": return "bg-blue-100 text-blue-800";
      case "Em Análise": return "bg-yellow-100 text-yellow-800";
      case "Em Investigação": return "bg-orange-100 text-orange-800";
      case "Resolvida": return "bg-green-100 text-green-800";
      case "Arquivada": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  if (submitted) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="glass-card p-12 rounded-3xl text-center">
          <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-white" />
          </div>
          
          <h2 className="text-3xl font-bold glass-text mb-4">Denúncia Enviada com Sucesso!</h2>
          
          <div className="glass-card p-6 rounded-xl mb-6 bg-blue-50/30">
            <p className="glass-text-muted mb-2">Número de Protocolo:</p>
            <p className="text-3xl font-bold text-blue-600">{protocolNumber}</p>
          </div>

          <p className="glass-text-muted mb-6 text-lg">
            Guarde este número de protocolo para acompanhar o andamento da sua denúncia.
            Sua identidade permanece completamente anônima.
          </p>

          <div className="flex flex-col md:flex-row gap-3 justify-center">
            <Button onClick={() => setSubmitted(false)} className="glass-button-primary">
              Enviar Nova Denúncia
            </Button>
            <Button 
              onClick={() => {
                setTrackProtocol(protocolNumber);
                setShowTrackDialog(true);
                setSubmitted(false);
              }} 
              className="glass-button-secondary"
            >
              <Eye className="w-4 h-4 mr-2" />
              Acompanhar Status
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="glass-card p-8 rounded-3xl">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold glass-text">Canal de Denúncia Anônima - CAC</h1>
            <p className="glass-text-muted text-lg">Canal de Ética e Compliance da Mar Quente</p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4 mt-6">
          <div className="glass-card p-4 rounded-xl text-center">
            <Lock className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <div className="font-bold glass-text">100% Anônimo</div>
            <div className="text-xs glass-text-muted mt-1">Sua identidade não será revelada</div>
          </div>
          <div className="glass-card p-4 rounded-xl text-center">
            <Shield className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <div className="font-bold glass-text">Confidencial</div>
            <div className="text-xs glass-text-muted mt-1">Informações protegidas</div>
          </div>
          <div className="glass-card p-4 rounded-xl text-center">
            <CheckCircle className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <div className="font-bold glass-text">Sem Retaliação</div>
            <div className="text-xs glass-text-muted mt-1">Proteção garantida</div>
          </div>
        </div>
      </div>

      {/* Informações Importantes */}
      <div className="info-box">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
          <div>
            <div className="info-box-title">Informações Importantes</div>
            <ul className="info-box-text space-y-2 mt-2">
              <li>• Seu anonimato é garantido. Não coletamos informações de identificação.</li>
              <li>• Seja específico e forneça o máximo de detalhes possível sobre o incidente.</li>
              <li>• Você receberá um número de protocolo para acompanhamento.</li>
              <li>• Todas as denúncias são tratadas com seriedade e confidencialidade.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Botões de ação */}
      <div className="grid md:grid-cols-2 gap-4">
        <Dialog open={showNewComplaintDialog} onOpenChange={setShowNewComplaintDialog}>
        <DialogTrigger asChild>
          {/* This div acts as the trigger for the dialog */}
          <div className="text-center py-12 glass-card rounded-2xl cursor-pointer hover:shadow-xl transition-shadow duration-300">
            <Shield className="w-14 h-14 md:w-16 md:h-16 glass-text-muted mx-auto mb-4 opacity-50" />
            <h3 className="text-lg md:text-xl font-semibold glass-text mb-2">Nenhuma denúncia ainda</h3>
            <p className="glass-text-muted mb-4 text-sm md:text-base px-4">
              Use o canal de denúncia para relatar situações inadequadas de forma segura e anônima
            </p>
            <Button className="glass-button-primary">
              <Shield className="w-4 h-4 mr-2" />
              Enviar Denúncia
            </Button>
          </div>
        </DialogTrigger>
        <DialogContent className="glass-modal max-w-2xl p-0">
          <div className="p-8">
            {/* Header Mobile Fixo */}
            <div className="modal-header-mobile md:hidden">
              <h2 className="modal-title">Denúncia Anônima</h2>
              <p className="modal-description">Sua identidade será protegida</p>
            </div>

            {/* Header Desktop */}
            <DialogHeader className="mb-6 hidden md:block">
              <h2 className="modal-title">Enviar Denúncia Anônima</h2>
              <p className="modal-description">Sua identidade será completamente protegida</p>
            </DialogHeader>

            <div className="space-y-5">
              <div className="info-box bg-green-50 border-2 border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="w-5 h-5 text-green-600" />
                  <span className="font-bold text-green-900">100% Anônimo e Confidencial</span>
                </div>
                <p className="text-green-800 font-medium">
                  Sua denúncia não será vinculada ao seu nome. Apenas você terá acesso ao número de protocolo para acompanhamento.
                </p>
              </div>

              <div>
                <Label htmlFor="title" className="glass-label">Título da Denúncia <span className="text-red-500">*</span></Label>
                <Input
                  id="title"
                  placeholder="Resuma brevemente o que aconteceu"
                  value={newComplaint.title}
                  onChange={(e) => setNewComplaint(prev => ({ ...prev, title: e.target.value }))}
                  className="glass-input"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category" className="glass-label">Categoria <span className="text-red-500">*</span></Label>
                  <Select
                    value={newComplaint.category}
                    onValueChange={(value) => setNewComplaint(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger className="glass-select">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(category => (
                        <SelectItem key={category} value={category}>{category}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="location" className="glass-label">Local</Label>
                  <Select
                    value={newComplaint.location}
                    onValueChange={(value) => setNewComplaint(prev => ({ ...prev, location: value }))}
                  >
                    <SelectTrigger className="glass-select">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {locations.map(location => (
                        <SelectItem key={location} value={location}>{location}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="incident_date" className="glass-label">Data do Incidente (Aproximada)</Label>
                <Input
                  id="incident_date"
                  type="date"
                  value={newComplaint.incident_date}
                  onChange={(e) => setNewComplaint(prev => ({ ...prev, incident_date: e.target.value }))}
                  className="glass-input"
                />
              </div>

              <div>
                <Label htmlFor="description" className="glass-label">Descrição Detalhada <span className="text-red-500">*</span></Label>
                <Textarea
                  id="description"
                  placeholder="Descreva o que aconteceu com o máximo de detalhes possível..."
                  value={newComplaint.description}
                  onChange={(e) => setNewComplaint(prev => ({ ...prev, description: e.target.value }))}
                  className="glass-textarea"
                  rows={6}
                />
                <p className="helper-text mt-2">
                  ℹ️ Quanto mais detalhes você fornecer, melhor poderemos investigar
                </p>
              </div>

              <div>
                <Label htmlFor="attachment" className="glass-label">Anexo (Opcional)</Label>
                <Input
                  id="attachment"
                  type="file"
                  onChange={handleFileUpload}
                  className="glass-input"
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                />
                {newComplaint.attachment_url && (
                  <p className="text-sm text-green-600 font-semibold mt-2">✓ Arquivo anexado</p>
                )}
              </div>
            </div>

            {/* Footer Mobile Fixo */}
            <div className="modal-footer-mobile md:hidden">
              <div className="flex flex-col gap-3">
                <Button
                  onClick={handleSubmitComplaint}
                  disabled={!newComplaint.title.trim() || !newComplaint.description.trim() || !newComplaint.category || isSubmitting || uploadingFile}
                  className="glass-button-primary mobile-button"
                >
                  {isSubmitting ? 'Enviando...' : 'Enviar Denúncia Anônima'}
                </Button>
                <Button 
                  variant="ghost" 
                  onClick={() => {
                    setShowNewComplaintDialog(false);
                    // Reset form fields when cancelling
                    setNewComplaint({
                      title: "",
                      description: "",
                      category: "",
                      location: "Não informado",
                      incident_date: "",
                      attachment_url: ""
                    });
                  }} 
                  className="glass-button-secondary mobile-button"
                >
                  Cancelar
                </Button>
              </div>
            </div>

            {/* Footer Desktop */}
            <div className="hidden md:flex justify-end gap-3 pt-6 mt-6 border-t border-gray-200">
              <Button variant="ghost" onClick={() => {
                setShowNewComplaintDialog(false);
                // Reset form fields when cancelling
                setNewComplaint({
                  title: "",
                  description: "",
                  category: "",
                  location: "Não informado",
                  incident_date: "",
                  attachment_url: ""
                });
              }} className="glass-button-secondary">
                Cancelar
              </Button>
              <Button
                onClick={handleSubmitComplaint}
                disabled={!newComplaint.title.trim() || !newComplaint.description.trim() || !newComplaint.category || isSubmitting || uploadingFile}
                className="glass-button-primary"
              >
                {isSubmitting ? 'Enviando...' : 'Enviar Denúncia Anônima'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Botão Acompanhar Denúncia */}
      <Dialog open={showTrackDialog} onOpenChange={setShowTrackDialog}>
        <DialogTrigger asChild>
          <div className="text-center py-12 glass-card rounded-2xl cursor-pointer hover:shadow-xl transition-shadow duration-300">
            <Search className="w-14 h-14 md:w-16 md:h-16 glass-text-muted mx-auto mb-4 opacity-50" />
            <h3 className="text-lg md:text-xl font-semibold glass-text mb-2">Acompanhar Denúncia</h3>
            <p className="glass-text-muted mb-4 text-sm md:text-base px-4">
              Use o número de protocolo para verificar o status da sua denúncia
            </p>
            <Button className="glass-button-secondary">
              <Eye className="w-4 h-4 mr-2" />
              Consultar Protocolo
            </Button>
          </div>
        </DialogTrigger>
        <DialogContent className="glass-modal max-w-3xl p-0 max-h-[90vh] overflow-y-auto">
          <div className="p-8">
            <DialogHeader className="mb-6">
              <h2 className="modal-title">Acompanhar Denúncia</h2>
              <p className="modal-description">Digite o número do protocolo para verificar o status</p>
            </DialogHeader>

            <div className="space-y-5">
              <div className="flex gap-3">
                <Input
                  placeholder="Ex: CAC-20250124-1234"
                  value={trackProtocol}
                  onChange={(e) => {
                    setTrackProtocol(e.target.value);
                    setTrackingError("");
                  }}
                  className="glass-input flex-1"
                />
                <Button onClick={handleTrackComplaint} className="glass-button-primary">
                  <Search className="w-4 h-4 mr-2" />
                  Buscar
                </Button>
              </div>

              {trackingError && (
                <div className="p-4 bg-red-50 border-2 border-red-200 rounded-xl">
                  <p className="text-red-800 font-semibold">{trackingError}</p>
                </div>
              )}

              {trackingComplaint && (
                <div className="space-y-5">
                  {/* Status Atual */}
                  <div className="glass-card p-6 rounded-xl bg-blue-50/50">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-gray-900 text-lg">Status Atual</h3>
                      <span className={`px-4 py-2 rounded-full text-sm font-bold ${getStatusColor(trackingComplaint.status)}`}>
                        {trackingComplaint.status}
                      </span>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Protocolo:</span>
                        <span className="font-bold text-gray-900 ml-2">{trackingComplaint.protocol_number}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Categoria:</span>
                        <span className="font-bold text-gray-900 ml-2">{trackingComplaint.category}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Data:</span>
                        <span className="font-bold text-gray-900 ml-2">
                          {new Date(trackingComplaint.created_date).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Local:</span>
                        <span className="font-bold text-gray-900 ml-2">{trackingComplaint.location}</span>
                      </div>
                    </div>
                  </div>

                  {/* Timeline */}
                  {trackingComplaint.timeline && trackingComplaint.timeline.length > 0 && (
                    <div className="glass-card p-6 rounded-xl">
                      <h3 className="font-bold text-gray-900 text-lg mb-4 flex items-center gap-2">
                        <Clock className="w-5 h-5 text-blue-600" />
                        Linha do Tempo
                      </h3>
                      <div className="space-y-4">
                        {trackingComplaint.timeline.map((event, index) => (
                          <div key={index} className="flex gap-4">
                            <div className="flex flex-col items-center">
                              <div className="w-3 h-3 rounded-full bg-blue-600"></div>
                              {index < trackingComplaint.timeline.length - 1 && (
                                <div className="w-0.5 h-full bg-blue-200 mt-2"></div>
                              )}
                            </div>
                            <div className="flex-1 pb-6">
                              <div className="font-bold text-gray-900">{event.action}</div>
                              <div className="text-sm text-gray-600 mt-1">
                                {new Date(event.date).toLocaleDateString('pt-BR', { 
                                  day: '2-digit', 
                                  month: 'long', 
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </div>
                              {event.description && (
                                <div className="text-sm text-gray-700 mt-2">{event.description}</div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Resolução (se houver) */}
                  {trackingComplaint.resolution_summary && (
                    <div className="glass-card p-6 rounded-xl bg-green-50/50 border-2 border-green-200">
                      <h3 className="font-bold text-green-900 text-lg mb-3 flex items-center gap-2">
                        <CheckCircle className="w-5 h-5" />
                        Resolução
                      </h3>
                      <p className="text-green-800 font-medium leading-relaxed">
                        {trackingComplaint.resolution_summary}
                      </p>
                    </div>
                  )}

                  <div className="info-box bg-blue-50">
                    <p className="info-box-text">
                      ℹ️ Sua identidade permanece anônima durante todo o processo. 
                      As atualizações são registradas conforme o andamento da investigação.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-6 mt-6 border-t border-gray-200">
              <Button 
                onClick={() => {
                  setShowTrackDialog(false);
                  setTrackProtocol("");
                  setTrackingComplaint(null);
                  setTrackingError("");
                }}
                className="glass-button-primary"
              >
                Fechar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
}