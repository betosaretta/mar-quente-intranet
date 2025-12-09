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
import { Search, Plus, Pencil, Trash2, Upload, Phone, Mail } from "lucide-react";

export default function ContactsManagement() {
  const [contacts, setContacts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDepartment, setFilterDepartment] = useState("Todos");
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [newContact, setNewContact] = useState({
    name: "",
    position: "",
    department: "Geral",
    phone: "",
    mobile_phone: "",
    email: "",
    extension: "",
    location: "Guarulhos",
    brand: "Corporativo",
    avatar_url: "",
    bio: "",
    is_emergency: false,
    is_active: true
  });
  const [uploading, setUploading] = useState(false);

  const departments = ["RH", "TI", "Financeiro", "Marketing", "Vendas", "Operações", "Diretoria", "Produção", "Criação", "Logística", "Geral"];
  const locations = ["Guarulhos", "Joinville", "Agrolândia", "Lojas", "Escritório"];
  const brands = ["Corporativo", "Dixie", "Gangster", "Overcore", "Todas"];

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    try {
      const data = await base44.entities.Contact.list("-created_date");
      setContacts(data);
    } catch (error) {
      console.error("Erro ao carregar contatos:", error);
    }
  };

  const handleFileUpload = async (file) => {
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setNewContact(prev => ({ ...prev, avatar_url: file_url }));
    } catch (error) {
      console.error("Erro ao fazer upload:", error);
      alert("Erro ao fazer upload da foto");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    try {
      if (editingContact) {
        await base44.entities.Contact.update(editingContact.id, newContact);
      } else {
        await base44.entities.Contact.create(newContact);
      }
      setShowNewDialog(false);
      setEditingContact(null);
      setNewContact({
        name: "",
        position: "",
        department: "Geral",
        phone: "",
        mobile_phone: "",
        email: "",
        extension: "",
        location: "Guarulhos",
        brand: "Corporativo",
        avatar_url: "",
        bio: "",
        is_emergency: false,
        is_active: true
      });
      await loadContacts();
    } catch (error) {
      console.error("Erro ao salvar contato:", error);
      alert("Erro ao salvar");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Tem certeza que deseja excluir este contato?")) return;
    try {
      await base44.entities.Contact.delete(id);
      await loadContacts();
    } catch (error) {
      console.error("Erro ao excluir:", error);
    }
  };

  const handleEdit = (contact) => {
    setEditingContact(contact);
    setNewContact(contact);
    setShowNewDialog(true);
  };

  const filteredContacts = contacts.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         c.position?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         c.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = filterDepartment === "Todos" || c.department === filterDepartment;
    return matchesSearch && matchesDepartment;
  });

  return (
    <div className="space-y-6">
      <div className="glass-card p-6 rounded-2xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold glass-text">Gestão de Contatos</h2>
            <p className="glass-text-muted mt-1">{contacts.length} contatos cadastrados</p>
          </div>
          
          <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
            <DialogTrigger asChild>
              <Button className="glass-button-primary" onClick={() => {
                setEditingContact(null);
                setNewContact({
                  name: "",
                  position: "",
                  department: "Geral",
                  phone: "",
                  mobile_phone: "",
                  email: "",
                  extension: "",
                  location: "Guarulhos",
                  brand: "Corporativo",
                  avatar_url: "",
                  bio: "",
                  is_emergency: false,
                  is_active: true
                });
              }}>
                <Plus className="w-5 h-5 mr-2" />
                Novo Contato
              </Button>
            </DialogTrigger>
            <DialogContent className="glass-modal max-w-3xl p-0 max-h-[90vh] overflow-y-auto">
              <div className="p-8">
                <DialogHeader className="mb-6">
                  <h2 className="modal-title">{editingContact ? 'Editar' : 'Novo'} Contato</h2>
                </DialogHeader>

                <div className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="glass-label">Nome Completo *</Label>
                      <Input
                        value={newContact.name}
                        onChange={(e) => setNewContact(prev => ({ ...prev, name: e.target.value }))}
                        className="glass-input"
                        placeholder="Nome do contato"
                      />
                    </div>

                    <div>
                      <Label className="glass-label">Cargo/Função</Label>
                      <Input
                        value={newContact.position}
                        onChange={(e) => setNewContact(prev => ({ ...prev, position: e.target.value }))}
                        className="glass-input"
                        placeholder="Ex: Gerente de TI"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label className="glass-label">Departamento *</Label>
                      <Select value={newContact.department} onValueChange={(value) => setNewContact(prev => ({ ...prev, department: value }))}>
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
                      <Label className="glass-label">Localidade</Label>
                      <Select value={newContact.location} onValueChange={(value) => setNewContact(prev => ({ ...prev, location: value }))}>
                        <SelectTrigger className="glass-select">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {locations.map(loc => (
                            <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="glass-label">Marca</Label>
                      <Select value={newContact.brand} onValueChange={(value) => setNewContact(prev => ({ ...prev, brand: value }))}>
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

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="glass-label">Telefone *</Label>
                      <Input
                        value={newContact.phone}
                        onChange={(e) => setNewContact(prev => ({ ...prev, phone: e.target.value }))}
                        className="glass-input"
                        placeholder="(11) 3333-3333"
                      />
                    </div>

                    <div>
                      <Label className="glass-label">Celular</Label>
                      <Input
                        value={newContact.mobile_phone}
                        onChange={(e) => setNewContact(prev => ({ ...prev, mobile_phone: e.target.value }))}
                        className="glass-input"
                        placeholder="(11) 99999-9999"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="glass-label">Email</Label>
                      <Input
                        type="email"
                        value={newContact.email}
                        onChange={(e) => setNewContact(prev => ({ ...prev, email: e.target.value }))}
                        className="glass-input"
                        placeholder="contato@marquente.com"
                      />
                    </div>

                    <div>
                      <Label className="glass-label">Ramal</Label>
                      <Input
                        value={newContact.extension}
                        onChange={(e) => setNewContact(prev => ({ ...prev, extension: e.target.value }))}
                        className="glass-input"
                        placeholder="Ex: 2050"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="glass-label">Foto do Contato</Label>
                    <div className="flex gap-2">
                      <Input
                        value={newContact.avatar_url}
                        onChange={(e) => setNewContact(prev => ({ ...prev, avatar_url: e.target.value }))}
                        className="glass-input flex-1"
                        placeholder="Cole a URL ou faça upload"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        className="glass-button"
                        disabled={uploading}
                        onClick={() => document.getElementById('avatar-upload').click()}
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Upload
                      </Button>
                      <input
                        id="avatar-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => e.target.files[0] && handleFileUpload(e.target.files[0])}
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="glass-label">Descrição/Bio</Label>
                    <Textarea
                      value={newContact.bio}
                      onChange={(e) => setNewContact(prev => ({ ...prev, bio: e.target.value }))}
                      className="glass-textarea"
                      rows={3}
                      placeholder="Informações adicionais sobre o contato..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <label className="flex items-center gap-3 p-3 glass-card rounded-lg cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newContact.is_emergency}
                        onChange={(e) => setNewContact(prev => ({ ...prev, is_emergency: e.target.checked }))}
                        className="w-5 h-5"
                      />
                      <span className="font-semibold glass-text">Contato de Emergência</span>
                    </label>

                    <label className="flex items-center gap-3 p-3 glass-card rounded-lg cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newContact.is_active}
                        onChange={(e) => setNewContact(prev => ({ ...prev, is_active: e.target.checked }))}
                        className="w-5 h-5"
                      />
                      <span className="font-semibold glass-text">Contato Ativo</span>
                    </label>
                  </div>
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

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 glass-text-muted" />
            <Input
              placeholder="Buscar por nome, cargo, email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 glass-input"
            />
          </div>
          <Select value={filterDepartment} onValueChange={setFilterDepartment}>
            <SelectTrigger className="glass-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Todos">Todos os Departamentos</SelectItem>
              {departments.map(dept => (
                <SelectItem key={dept} value={dept}>{dept}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="glass-text">Nome</TableHead>
                <TableHead className="glass-text">Cargo</TableHead>
                <TableHead className="glass-text">Departamento</TableHead>
                <TableHead className="glass-text">Contato</TableHead>
                <TableHead className="glass-text">Status</TableHead>
                <TableHead className="glass-text text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredContacts.map(contact => (
                <TableRow key={contact.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {contact.avatar_url && (
                        <img src={contact.avatar_url} alt={contact.name} className="w-10 h-10 rounded-full object-cover" />
                      )}
                      <div>
                        <div className="font-medium glass-text">{contact.name}</div>
                        <div className="text-xs glass-text-muted">{contact.location}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="glass-text">{contact.position || '-'}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{contact.department}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1 text-sm">
                      {contact.phone && (
                        <div className="flex items-center gap-1 glass-text-muted">
                          <Phone className="w-3 h-3" />
                          {contact.phone}
                        </div>
                      )}
                      {contact.email && (
                        <div className="flex items-center gap-1 glass-text-muted">
                          <Mail className="w-3 h-3" />
                          {contact.email}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      {contact.is_active ? (
                        <Badge className="bg-green-100 text-green-800">Ativo</Badge>
                      ) : (
                        <Badge className="bg-gray-100 text-gray-800">Inativo</Badge>
                      )}
                      {contact.is_emergency && (
                        <Badge className="bg-red-100 text-red-800 text-xs">Emergência</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(contact)} className="glass-button">
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(contact.id)} className="glass-button text-red-600">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {filteredContacts.length === 0 && (
          <div className="text-center py-10">
            <Phone className="w-12 h-12 glass-text-muted mx-auto mb-3 opacity-50" />
            <p className="glass-text-muted">Nenhum contato encontrado.</p>
          </div>
        )}
      </div>
    </div>
  );
}