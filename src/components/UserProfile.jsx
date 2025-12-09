
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
} from "@/components/ui/dialog";
import { Camera, Loader2, Mail, Phone, X } from "lucide-react";

export default function UserProfile({ user, isOpen, onClose, onUpdate }) {
  const [editMode, setEditMode] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [userData, setUserData] = useState(user || {});

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await base44.auth.updateMe({ avatar_url: file_url });
      setUserData(prev => ({ ...prev, avatar_url: file_url }));
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error("Erro ao fazer upload da foto:", error);
      alert("Erro ao fazer upload da foto");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const dataToUpdate = {
        bio: userData.bio,
        phone: userData.phone,
        mobile_phone: userData.mobile_phone,
        personal_email: userData.personal_email
      };
      await base44.auth.updateMe(dataToUpdate);
      setEditMode(false);
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error("Erro ao salvar dados:", error);
      alert("Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="glass-modal max-w-2xl p-0 max-h-[90vh] overflow-y-auto">
        <div className="p-8">
          {/* Mobile Header */}
          <div className="flex items-center justify-between mb-6 md:hidden">
            <h2 className="modal-title">Meu Perfil</h2>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Desktop Header */}
          <DialogHeader className="mb-6 hidden md:block">
            <h2 className="modal-title">Meu Perfil</h2>
            <p className="modal-description">Visualize e edite suas informações</p>
          </DialogHeader>

          <div className="space-y-6">
            {/* Foto de Perfil */}
            <div className="flex flex-col items-center">
              <div className="relative">
                <Avatar className="w-24 h-24 md:w-32 md:h-32 border-4 border-white/30 shadow-lg">
                  <AvatarImage src={userData.avatar_url} />
                  <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white text-3xl md:text-4xl font-bold">
                    {userData.full_name?.charAt(0) || userData.email?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                
                <label
                  htmlFor="photo-upload"
                  className="absolute bottom-0 right-0 w-10 h-10 md:w-12 md:h-12 bg-gradient-to-r from-blue-600 to-blue-500 rounded-full flex items-center justify-center cursor-pointer shadow-lg hover:shadow-xl transition-all hover:scale-105"
                >
                  {uploading ? (
                    <Loader2 className="w-5 h-5 md:w-6 md:h-6 text-white animate-spin" />
                  ) : (
                    <Camera className="w-5 h-5 md:w-6 md:h-6 text-white" />
                  )}
                </label>
                <input
                  id="photo-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoUpload}
                  disabled={uploading}
                />
              </div>
              
              <h3 className="mt-4 text-xl md:text-2xl font-bold text-gray-900">{userData.full_name}</h3>
              {userData.position && (
                <p className="text-gray-600 font-semibold">{userData.position}</p>
              )}
            </div>

            {/* Formulário de Edição */}
            {editMode ? (
              <div className="space-y-4">
                <div>
                  <Label className="glass-label">Bio</Label>
                  <Textarea
                    value={userData.bio || ''}
                    onChange={(e) => setUserData(prev => ({ ...prev, bio: e.target.value }))}
                    className="glass-textarea"
                    rows={3}
                    placeholder="Conte um pouco sobre você..."
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label className="glass-label">Telefone Corporativo</Label>
                    <Input
                      value={userData.phone || ''}
                      onChange={(e) => setUserData(prev => ({ ...prev, phone: e.target.value }))}
                      className="glass-input"
                      placeholder="(11) 3333-3333"
                    />
                  </div>

                  <div>
                    <Label className="glass-label">Celular</Label>
                    <Input
                      value={userData.mobile_phone || ''}
                      onChange={(e) => setUserData(prev => ({ ...prev, mobile_phone: e.target.value }))}
                      className="glass-input"
                      placeholder="(11) 99999-9999"
                    />
                  </div>
                </div>

                <div>
                  <Label className="glass-label">Email Pessoal</Label>
                  <Input
                    type="email"
                    value={userData.personal_email || ''}
                    onChange={(e) => setUserData(prev => ({ ...prev, personal_email: e.target.value }))}
                    className="glass-input"
                    placeholder="email@pessoal.com"
                  />
                </div>

                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setEditMode(false);
                      setUserData(user);
                    }}
                    className="glass-button-secondary flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="glass-button-primary flex-1"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      'Salvar Alterações'
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="glass-card p-4 rounded-xl">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="font-bold text-gray-900">Sobre Mim</span>
                  </div>
                  <p className="text-gray-700 leading-relaxed">
                    {userData.bio || 'Nenhuma informação adicionada ainda.'}
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="glass-card p-4 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <Mail className="w-4 h-4 text-blue-600" />
                      <span className="font-bold text-gray-900">Email</span>
                    </div>
                    <p className="text-gray-700 font-semibold break-all">{userData.email}</p>
                  </div>

                  <div className="glass-card p-4 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <Phone className="w-4 h-4 text-green-600" />
                      <span className="font-bold text-gray-900">Telefone</span>
                    </div>
                    <p className="text-gray-700 font-semibold">{userData.phone || '-'}</p>
                  </div>
                </div>

                <Button
                  onClick={() => setEditMode(true)}
                  className="glass-button-primary w-full"
                >
                  Editar Perfil
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
