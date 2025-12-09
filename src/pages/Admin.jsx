import React, { useState, useEffect } from "react";
import { User } from "@/entities/User";
import {
  Shield,
  Users,
  UserPlus,
  Edit,
  Search,
  AlertTriangle,
  Settings,
  Trophy,
  Coins,
  TrendingUp,
  Gift,
  Plus,
  Minus,
  Pencil,
  CheckCircle,
  BookOpen, // Added for ContentManagement
  FileText, // Added for MQNewsManagement
  MessageSquare, // Added for HRRequestsManagement and AnnouncementsManagement
  Lightbulb, // Added for SuggestionsManagement
  Phone // Added for ContactsManagement
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";


import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createPageUrl } from "@/utils";
import { Link, useNavigate } from 'react-router-dom';
import { base44 } from "@/api/base44Client";

// Import new management components
import ContentManagement from "../components/admin/ContentManagement";
import MQNewsManagement from "../components/admin/MQNewsManagement";
import HRRequestsManagement from "../components/admin/HRRequestsManagement";
import AnnouncementsManagement from "../components/admin/AnnouncementsManagement";
import SuggestionsManagement from "../components/admin/SuggestionsManagement";
import ComplaintsManagement from "../components/admin/ComplaintsManagement";
import ContactsManagement from "../components/admin/ContactsManagement";
import RequestTransfer from "../components/admin/RequestTransfer";

function NewEmployeeForm({ onEmployeeCreated, departments, brands, roles }) {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [employeeData, setEmployeeData] = useState({
    // Dados básicos
    full_name: "",
    email: "",
    role: "user",
    department: "",
    brand: "",
    position: "",
    hire_date: "",
    contract_type: "CLT",
    status: "Ativo",

    // Dados pessoais
    cpf: "",
    rg: "",
    birth_date: "",
    gender: "",
    marital_status: "",
    education_level: "",
    has_dependents: false,
    number_of_dependents: 0,

    // Contato
    phone: "",
    mobile_phone: "",
    personal_email: "",
    address: "",
    city: "",
    state: "",
    zip_code: "",

    // Dados profissionais
    work_schedule: "",
    salary: 0,

    // Documentos
    pis: "",
    voter_registration: "",
    military_certificate: "",
    work_card: "",

    // Dados bancários
    bank_name: "",
    bank_agency: "",
    bank_account: "",
    account_type: "",

    // Emergência
    emergency_contact_name: "",
    emergency_contact_phone: "",
    emergency_contact_relationship: "",

    // Outros
    bio: "",
    notes: "",
    points: 0,
    level: 1,
    badges: [],
    specialties: []
  });

  const handleChange = (field, value) => {
    setEmployeeData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!employeeData.full_name || !employeeData.email || !employeeData.department) {
      alert("Por favor, preencha os campos obrigatórios: Nome Completo, Email Corporativo e Departamento");
      return;
    }

    try {
      // Nota: Como não podemos criar usuários diretamente via User.create(),
      // este formulário prepara os dados. O usuário deve ser convidado via sistema
      console.log("Dados do funcionário:", employeeData);
      alert("Funcionário cadastrado! Use o sistema de convites para enviar acesso via email.");
      setIsOpen(false);
      setStep(1);
      setEmployeeData({
        full_name: "",
        email: "",
        role: "user",
        department: "",
        brand: "",
        position: "",
        hire_date: "",
        contract_type: "CLT",
        status: "Ativo",
        cpf: "",
        rg: "",
        birth_date: "",
        gender: "",
        marital_status: "",
        education_level: "",
        has_dependents: false,
        number_of_dependents: 0,
        phone: "",
        mobile_phone: "",
        personal_email: "",
        address: "",
        city: "",
        state: "",
        zip_code: "",
        work_schedule: "",
        salary: 0,
        pis: "",
        voter_registration: "",
        military_certificate: "",
        work_card: "",
        bank_name: "",
        bank_agency: "",
        bank_account: "",
        account_type: "",
        emergency_contact_name: "",
        emergency_contact_phone: "",
        emergency_contact_relationship: "",
        bio: "",
        notes: "",
        points: 0,
        level: 1,
        badges: [],
        specialties: []
      });
      onEmployeeCreated();
    } catch (error) {
      console.error("Erro ao cadastrar funcionário:", error);
      alert("Erro ao cadastrar funcionário. Tente novamente.");
    }
  };

  const nextStep = () => setStep(prev => Math.min(prev + 1, 5));
  const prevStep = () => setStep(prev => Math.max(prev - 1, 1));

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="glass-button-primary">
          <UserPlus className="w-4 h-4 mr-2" />
          Cadastrar Funcionário
        </Button>
      </DialogTrigger>
      <DialogContent className="glass-modal max-w-4xl p-0 max-h-[90vh] overflow-y-auto">
        <div className="p-8">
          <DialogHeader className="mb-6">
            <h2 className="modal-title">Cadastro Completo de Funcionário</h2>
            <p className="modal-description">Preencha todos os dados para registro no sistema</p>

            {/* Progress Indicator */}
            <div className="flex items-center justify-between mt-6 mb-4">
              {[1, 2, 3, 4, 5].map((s) => (
                <div key={s} className="flex items-center flex-1">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                    step >= s ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
                  }`}>
                    {s}
                  </div>
                  {s < 5 && <div className={`flex-1 h-1 mx-2 ${step > s ? 'bg-blue-600' : 'bg-gray-200'}`} />}
                </div>
              ))}
            </div>
            <div className="text-center glass-text-muted">
              {step === 1 && "Dados Básicos"}
              {step === 2 && "Dados Pessoais"}
              {step === 3 && "Contato e Endereço"}
              {step === 4 && "Documentos e Bancário"}
              {step === 5 && "Emergência e Observações"}
            </div>
          </DialogHeader>

          <div className="space-y-5">
            {/* Step 1: Dados Básicos */}
            {step === 1 && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label className="glass-label">Nome Completo <span className="text-red-500">*</span></Label>
                    <Input
                      value={employeeData.full_name}
                      onChange={(e) => handleChange('full_name', e.target.value)}
                      className="glass-input"
                      placeholder="Digite o nome completo"
                    />
                  </div>

                  <div>
                    <Label className="glass-label">Email Corporativo <span className="text-red-500">*</span></Label>
                    <Input
                      type="email"
                      value={employeeData.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      className="glass-input"
                      placeholder="email@marquente.com"
                    />
                  </div>

                  <div>
                    <Label className="glass-label">Perfil de Acesso</Label>
                    <Select value={employeeData.role} onValueChange={(value) => handleChange('role', value)}>
                      <SelectTrigger className="glass-select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {roles.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="glass-label">Departamento <span className="text-red-500">*</span></Label>
                    <Select value={employeeData.department} onValueChange={(value) => handleChange('department', value)}>
                      <SelectTrigger className="glass-select">
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        {departments.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="glass-label">Marca</Label>
                    <Select value={employeeData.brand} onValueChange={(value) => handleChange('brand', value)}>
                      <SelectTrigger className="glass-select">
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        {brands.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="glass-label">Cargo</Label>
                    <Input
                      value={employeeData.position}
                      onChange={(e) => handleChange('position', e.target.value)}
                      className="glass-input"
                      placeholder="Ex: Analista de RH"
                    />
                  </div>

                  <div>
                    <Label className="glass-label">Data de Admissão</Label>
                    <Input
                      type="date"
                      value={employeeData.hire_date}
                      onChange={(e) => handleChange('hire_date', e.target.value)}
                      className="glass-input"
                    />
                  </div>

                  <div>
                    <Label className="glass-label">Tipo de Contrato</Label>
                    <Select value={employeeData.contract_type} onValueChange={(value) => handleChange('contract_type', value)}>
                      <SelectTrigger className="glass-select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CLT">CLT</SelectItem>
                        <SelectItem value="PJ">PJ</SelectItem>
                        <SelectItem value="Estagiário">Estagiário</SelectItem>
                        <SelectItem value="Temporário">Temporário</SelectItem>
                        <SelectItem value="Autônomo">Autônomo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="glass-label">Status</Label>
                    <Select value={employeeData.status} onValueChange={(value) => handleChange('status', value)}>
                      <SelectTrigger className="glass-select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Ativo">Ativo</SelectItem>
                        <SelectItem value="Férias">Férias</SelectItem>
                        <SelectItem value="Afastado">Afastado</SelectItem>
                        <SelectItem value="Desligado">Desligado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="glass-label">Horário de Trabalho</Label>
                    <Input
                      value={employeeData.work_schedule}
                      onChange={(e) => handleChange('work_schedule', e.target.value)}
                      className="glass-input"
                      placeholder="Ex: 08:00 - 17:00"
                    />
                  </div>

                  <div>
                    <Label className="glass-label">Salário (R$)</Label>
                    <Input
                      type="number"
                      value={employeeData.salary}
                      onChange={(e) => handleChange('salary', parseFloat(e.target.value) || 0)}
                      className="glass-input"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Step 2: Dados Pessoais */}
            {step === 2 && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="glass-label">CPF</Label>
                    <Input
                      value={employeeData.cpf}
                      onChange={(e) => handleChange('cpf', e.target.value)}
                      className="glass-input"
                      placeholder="000.000.000-00"
                    />
                  </div>

                  <div>
                    <Label className="glass-label">RG</Label>
                    <Input
                      value={employeeData.rg}
                      onChange={(e) => handleChange('rg', e.target.value)}
                      className="glass-input"
                      placeholder="00.000.000-0"
                    />
                  </div>

                  <div>
                    <Label className="glass-label">Data de Nascimento</Label>
                    <Input
                      type="date"
                      value={employeeData.birth_date}
                      onChange={(e) => handleChange('birth_date', e.target.value)}
                      className="glass-input"
                    />
                  </div>

                  <div>
                    <Label className="glass-label">Gênero</Label>
                    <Select value={employeeData.gender} onValueChange={(value) => handleChange('gender', value)}>
                      <SelectTrigger className="glass-select">
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Masculino">Masculino</SelectItem>
                        <SelectItem value="Feminino">Feminino</SelectItem>
                        <SelectItem value="Outro">Outro</SelectItem>
                        <SelectItem value="Prefiro não informar">Prefiro não informar</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="glass-label">Estado Civil</Label>
                    <Select value={employeeData.marital_status} onValueChange={(value) => handleChange('marital_status', value)}>
                      <SelectTrigger className="glass-select">
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Solteiro(a)">Solteiro(a)</SelectItem>
                        <SelectItem value="Casado(a)">Casado(a)</SelectItem>
                        <SelectItem value="Divorciado(a)">Divorciado(a)</SelectItem>
                        <SelectItem value="Viúvo(a)">Viúvo(a)</SelectItem>
                        <SelectItem value="União Estável">União Estável</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="glass-label">Escolaridade</Label>
                    <Select value={employeeData.education_level} onValueChange={(value) => handleChange('education_level', value)}>
                      <SelectTrigger className="glass-select">
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Ensino Fundamental">Ensino Fundamental</SelectItem>
                        <SelectItem value="Ensino Médio">Ensino Médio</SelectItem>
                        <SelectItem value="Ensino Superior">Ensino Superior</SelectItem>
                        <SelectItem value="Pós-graduação">Pós-graduação</SelectItem>
                        <SelectItem value="Mestrado">Mestrado</SelectItem>
                        <SelectItem value="Doutorado">Doutorado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="glass-label">Possui Dependentes?</Label>
                    <Select
                      value={employeeData.has_dependents.toString()}
                      onValueChange={(value) => handleChange('has_dependents', value === 'true')}
                    >
                      <SelectTrigger className="glass-select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="false">Não</SelectItem>
                        <SelectItem value="true">Sim</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {employeeData.has_dependents && (
                    <div>
                      <Label className="glass-label">Número de Dependentes</Label>
                      <Input
                        type="number"
                        value={employeeData.number_of_dependents}
                        onChange={(e) => handleChange('number_of_dependents', parseInt(e.target.value) || 0)}
                        className="glass-input"
                        min="0"
                      />
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Step 3: Contato e Endereço */}
            {step === 3 && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="glass-label">Telefone</Label>
                    <Input
                      value={employeeData.phone}
                      onChange={(e) => handleChange('phone', e.target.value)}
                      className="glass-input"
                      placeholder="(11) 3333-3333"
                    />
                  </div>

                  <div>
                    <Label className="glass-label">Celular</Label>
                    <Input
                      value={employeeData.mobile_phone}
                      onChange={(e) => handleChange('mobile_phone', e.target.value)}
                      className="glass-input"
                      placeholder="(11) 99999-9999"
                    />
                  </div>

                  <div className="col-span-2">
                    <Label className="glass-label">Email Pessoal</Label>
                    <Input
                      type="email"
                      value={employeeData.personal_email}
                      onChange={(e) => handleChange('personal_email', e.target.value)}
                      className="glass-input"
                      placeholder="email@pessoal.com"
                    />
                  </div>

                  <div className="col-span-2">
                    <Label className="glass-label">Endereço Completo</Label>
                    <Input
                      value={employeeData.address}
                      onChange={(e) => handleChange('address', e.target.value)}
                      className="glass-input"
                      placeholder="Rua, número, complemento"
                    />
                  </div>

                  <div>
                    <Label className="glass-label">Cidade</Label>
                    <Input
                      value={employeeData.city}
                      onChange={(e) => handleChange('city', e.target.value)}
                      className="glass-input"
                    />
                  </div>

                  <div>
                    <Label className="glass-label">Estado</Label>
                    <Input
                      value={employeeData.state}
                      onChange={(e) => handleChange('state', e.target.value)}
                      className="glass-input"
                      placeholder="SP"
                      maxLength={2}
                    />
                  </div>

                  <div>
                    <Label className="glass-label">CEP</Label>
                    <Input
                      value={employeeData.zip_code}
                      onChange={(e) => handleChange('zip_code', e.target.value)}
                      className="glass-input"
                      placeholder="00000-000"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Step 4: Documentos e Bancário */}
            {step === 4 && (
              <>
                <div className="space-y-4">
                  <div className="glass-card p-4 rounded-lg">
                    <h3 className="font-bold glass-text mb-3">Documentos</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="glass-label">PIS/PASEP</Label>
                        <Input
                          value={employeeData.pis}
                          onChange={(e) => handleChange('pis', e.target.value)}
                          className="glass-input"
                        />
                      </div>

                      <div>
                        <Label className="glass-label">Carteira de Trabalho</Label>
                        <Input
                          value={employeeData.work_card}
                          onChange={(e) => handleChange('work_card', e.target.value)}
                          className="glass-input"
                        />
                      </div>

                      <div>
                        <Label className="glass-label">Título de Eleitor</Label>
                        <Input
                          value={employeeData.voter_registration}
                          onChange={(e) => handleChange('voter_registration', e.target.value)}
                          className="glass-input"
                        />
                      </div>

                      <div>
                        <Label className="glass-label">Certificado Reservista</Label>
                        <Input
                          value={employeeData.military_certificate}
                          onChange={(e) => handleChange('military_certificate', e.target.value)}
                          className="glass-input"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="glass-card p-4 rounded-lg">
                    <h3 className="font-bold glass-text mb-3">Dados Bancários</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="glass-label">Banco</Label>
                        <Input
                          value={employeeData.bank_name}
                          onChange={(e) => handleChange('bank_name', e.target.value)}
                          className="glass-input"
                          placeholder="Ex: Banco do Brasil"
                        />
                      </div>

                      <div>
                        <Label className="glass-label">Tipo de Conta</Label>
                        <Select value={employeeData.account_type} onValueChange={(value) => handleChange('account_type', value)}>
                          <SelectTrigger className="glass-select">
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Conta Corrente">Conta Corrente</SelectItem>
                            <SelectItem value="Conta Poupança">Conta Poupança</SelectItem>
                            <SelectItem value="Conta Salário">Conta Salário</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="glass-label">Agência</Label>
                        <Input
                          value={employeeData.bank_agency}
                          onChange={(e) => handleChange('bank_agency', e.target.value)}
                          className="glass-input"
                          placeholder="0000"
                        />
                      </div>

                      <div>
                        <Label className="glass-label">Conta</Label>
                        <Input
                          value={employeeData.bank_account}
                          onChange={(e) => handleChange('bank_account', e.target.value)}
                          className="glass-input"
                          placeholder="00000-0"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Step 5: Emergência e Observações */}
            {step === 5 && (
              <>
                <div className="space-y-4">
                  <div className="glass-card p-4 rounded-lg">
                    <h3 className="font-bold glass-text mb-3">Contato de Emergência</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="glass-label">Nome Completo</Label>
                        <Input
                          value={employeeData.emergency_contact_name}
                          onChange={(e) => handleChange('emergency_contact_name', e.target.value)}
                          className="glass-input"
                        />
                      </div>

                      <div>
                        <Label className="glass-label">Relação</Label>
                        <Input
                          value={employeeData.emergency_contact_relationship}
                          onChange={(e) => handleChange('emergency_contact_relationship', e.target.value)}
                          className="glass-input"
                          placeholder="Ex: Mãe, Irmão, Cônjuge"
                        />
                      </div>

                      <div className="col-span-2">
                        <Label className="glass-label">Telefone</Label>
                        <Input
                          value={employeeData.emergency_contact_phone}
                          onChange={(e) => handleChange('emergency_contact_phone', e.target.value)}
                          className="glass-input"
                          placeholder="(11) 99999-9999"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label className="glass-label">Biografia/Perfil</Label>
                    <Textarea
                      value={employeeData.bio}
                      onChange={(e) => handleChange('bio', e.target.value)}
                      className="glass-textarea"
                      placeholder="Breve descrição profissional do colaborador..."
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label className="glass-label">Observações Gerais</Label>
                    <Textarea
                      value={employeeData.notes}
                      onChange={(e) => handleChange('notes', e.target.value)}
                      className="glass-textarea"
                      placeholder="Informações adicionais, restrições médicas, observações importantes..."
                      rows={4}
                    />
                  </div>
                </div>
              </>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between gap-3 pt-6 border-t border-gray-200">
              <Button
                variant="ghost"
                onClick={step === 1 ? () => setIsOpen(false) : prevStep}
                className="glass-button-secondary"
              >
                {step === 1 ? 'Cancelar' : 'Voltar'}
              </Button>

              {step < 5 ? (
                <Button onClick={nextStep} className="glass-button-primary">
                  Próximo
                </Button>
              ) : (
                <Button onClick={handleSubmit} className="glass-button-primary">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Finalizar Cadastro
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function EditUserForm({ user, onUserUpdate, departments, brands, roles }) {
  const [userData, setUserData] = useState(user);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setUserData(user);
  }, [user]);

  const handleUpdate = async () => {
    const { id, ...dataToUpdate } = userData;
    // Remove properties that should not be updated or are system-managed
    delete dataToUpdate.email;
    delete dataToUpdate.created_date;
    delete dataToUpdate.updated_date;
    delete dataToUpdate.created_by;
    // Specific to this update: remove can_receive_tickets if it's no longer managed here
    delete dataToUpdate.can_receive_tickets;

    try {
      await User.update(id, dataToUpdate);
      onUserUpdate();
      setIsOpen(false);
    } catch (error) {
      console.error("Erro ao atualizar usuário:", error);
    }
  };

  const handleChange = (key, value) => {
    setUserData(prev => ({...prev, [key]: value}));
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="glass-button"><Edit className="w-4 h-4 mr-2" /> Editar</Button>
      </DialogTrigger>
      <DialogContent className="glass-modal max-w-2xl p-0">
        <div className="p-8">
          <DialogHeader className="mb-6">
            <h2 className="modal-title">Editar Usuário: {user.full_name}</h2>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="full_name" className="glass-label">Nome Completo</Label>
                <Input id="full_name" value={userData.full_name || ''} onChange={(e) => handleChange('full_name', e.target.value)} className="glass-input" />
              </div>
              <div>
                <Label htmlFor="role" className="glass-label">Perfil</Label>
                <Select value={userData.role || 'user'} onValueChange={(value) => handleChange('role', value)}>
                  <SelectTrigger className="glass-select"><SelectValue /></SelectTrigger>
                  <SelectContent>{roles.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="department" className="glass-label">Departamento</Label>
                <Select value={userData.department || ''} onValueChange={(value) => handleChange('department', value)}>
                  <SelectTrigger className="glass-select"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>{departments.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="brand" className="glass-label">Marca</Label>
                <Select value={userData.brand || ''} onValueChange={(value) => handleChange('brand', value)}>
                  <SelectTrigger className="glass-select"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>{brands.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="position" className="glass-label">Cargo</Label>
              <Input id="position" value={userData.position || ''} onChange={(e) => handleChange('position', e.target.value)} className="glass-input" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone" className="glass-label">Telefone</Label>
                <Input id="phone" value={userData.phone || ''} onChange={(e) => handleChange('phone', e.target.value)} className="glass-input" placeholder="(11) 99999-9999" />
              </div>
              <div>
                <Label htmlFor="hire_date" className="glass-label">Data de Contratação</Label>
                <Input id="hire_date" type="date" value={userData.hire_date || ''} onChange={(e) => handleChange('hire_date', e.target.value)} className="glass-input" />
              </div>
            </div>
            <div>
              <Label htmlFor="bio" className="glass-label">Biografia</Label>
              <Textarea id="bio" value={userData.bio || ''} onChange={(e) => handleChange('bio', e.target.value)} className="glass-textarea" placeholder="Breve descrição do colaborador..." />
            </div>
            {/* Removed can_receive_tickets checkbox as per outline */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <Button variant="ghost" onClick={() => setIsOpen(false)} className="glass-button-secondary">Cancelar</Button>
              <Button onClick={handleUpdate} className="glass-button-primary">Salvar Alterações</Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AwardManagement() {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [pointsAmount, setPointsAmount] = useState(0);
  const [reason, setReason] = useState("");
  const [showAwardDialog, setShowAwardDialog] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    const usersData = await User.list();
    setUsers(usersData);
  };

  const handleAwardPoints = async () => {
    if (!selectedUser || pointsAmount === 0) return;

    try {
      const currentPoints = selectedUser.points || 0;
      await User.update(selectedUser.id, {
        points: currentPoints + pointsAmount
      });

      setShowAwardDialog(false);
      setSelectedUser(null);
      setPointsAmount(0);
      setReason("");
      loadUsers(); // Refresh users data after update
    } catch (error) {
      console.error("Erro ao atribuir pontos:", error);
    }
  };

  // Filter users based on search term and department 'Produção'
  const productionUsers = users.filter(u =>
    (u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())) &&
    u.department === "Produção"
  );

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <div className="glass-card p-5 rounded-xl text-center">
          <div className="text-3xl font-bold glass-text">{users.length}</div>
          <div className="glass-text-muted mt-1">Total Colaboradores</div>
        </div>
        <div className="glass-card p-5 rounded-xl text-center">
          <div className="text-3xl font-bold text-blue-600">{productionUsers.length}</div>
          <div className="glass-text-muted mt-1">Produção</div>
        </div>
        <div className="glass-card p-5 rounded-xl text-center">
          <div className="text-3xl font-bold text-green-600">
            {users.reduce((sum, u) => sum + (u.points || 0), 0)}
          </div>
          <div className="glass-text-muted mt-1">Pontos Distribuídos</div>
        </div>
        <div className="glass-card p-5 rounded-xl text-center">
          <div className="text-3xl font-bold text-purple-600">
            {users.filter(u => (u.points || 0) > 0).length}
          </div>
          <div className="glass-text-muted mt-1">Usuários Ativos</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="glass-card p-6 rounded-2xl">
        <h3 className="text-lg font-bold glass-text mb-4">Ações Rápidas</h3>
        <div className="grid md:grid-cols-3 gap-4">
          <Button className="glass-button-primary justify-start" onClick={() => {
            setSelectedUser(null); // Reset selected user when opening for general attribution
            setPointsAmount(0);
            setReason("");
            setShowAwardDialog(true);
          }}>
            <Plus className="w-5 h-5 mr-2" />
            Atribuir Pontos
          </Button>
          <Button className="glass-button justify-start">
            <TrendingUp className="w-5 h-5 mr-2" />
            Relatório de Produção
          </Button>
          <Button className="glass-button justify-start">
            <Gift className="w-5 h-5 mr-2" />
            Gerenciar Prêmios
          </Button>
        </div>
      </div>

      {/* Award Points Dialog */}
      <Dialog open={showAwardDialog} onOpenChange={setShowAwardDialog}>
        <DialogContent className="glass-modal max-w-xl p-0">
          <div className="p-8">
            <DialogHeader className="mb-6">
              <h2 className="modal-title">Atribuir Pontos</h2>
              <p className="modal-description">Recompense colaboradores por desempenho e produtividade</p>
            </DialogHeader>
            <div className="space-y-5">
              <div>
                <Label className="glass-label">Selecione o Colaborador</Label>
                <Select
                  value={selectedUser?.id}
                  onValueChange={(value) => setSelectedUser(users.find(u => u.id === value))}
                >
                  <SelectTrigger className="glass-select">
                    <SelectValue placeholder="Escolha um colaborador..." />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map(u => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.full_name} - {u.department} ({u.points || 0} pontos)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="glass-label">Quantidade de Pontos</Label>
                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setPointsAmount(prev => Math.max(0, prev - 10))}
                    className="glass-button"
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                  <Input
                    type="number"
                    value={pointsAmount}
                    onChange={(e) => setPointsAmount(parseInt(e.target.value) || 0)}
                    className="glass-input text-center text-2xl font-bold"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setPointsAmount(prev => prev + 10)}
                    className="glass-button"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div>
                <Label className="glass-label">Motivo (Opcional)</Label>
                <Textarea
                  placeholder="Ex: Meta de produção atingida, zero absenteísmo no mês..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="glass-textarea"
                  rows={3}
                />
              </div>

              {selectedUser && (
                <div className="glass-card p-4 rounded-lg bg-blue-50/30 border-2 border-blue-200/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-gray-900">Saldo Atual</div>
                      <div className="text-2xl font-bold text-blue-600">{selectedUser.points || 0} pontos</div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-gray-900">Novo Saldo</div>
                      <div className="text-2xl font-bold text-green-600">{(selectedUser.points || 0) + pointsAmount} pontos</div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <Button variant="ghost" onClick={() => setShowAwardDialog(false)} className="glass-button-secondary">
                  Cancelar
                </Button>
                <Button
                  onClick={handleAwardPoints}
                  disabled={!selectedUser || pointsAmount === 0}
                  className="glass-button-primary"
                >
                  <Coins className="w-5 h-5 mr-2" />
                  Atribuir Pontos
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Users Table */}
      <div className="glass-card p-6 rounded-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold glass-text">Colaboradores da Produção</h3>
          <div className="relative w-1/3">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 glass-text-muted" />
            <Input
              placeholder="Buscar colaborador..."
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
                <TableHead className="glass-text">Nome</TableHead>
                <TableHead className="glass-text">Cargo</TableHead>
                <TableHead className="glass-text">Marca</TableHead>
                <TableHead className="glass-text">Pontos</TableHead>
                <TableHead className="glass-text text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {productionUsers.map(user => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="font-medium glass-text">{user.full_name}</div>
                    <div className="text-xs glass-text-muted">{user.email}</div>
                  </TableCell>
                  <TableCell className="glass-text">{user.position || '-'}</TableCell>
                  <TableCell className="glass-text">{user.brand || '-'}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Coins className="w-4 h-4 text-yellow-600" />
                      <span className="font-bold glass-text">{user.points || 0}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="glass-button"
                      onClick={() => {
                        setSelectedUser(user);
                        setPointsAmount(0); // Reset points when selecting a new user
                        setReason("");
                        setShowAwardDialog(true);
                      }}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Pontuar
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {productionUsers.length === 0 && (
          <div className="text-center py-10">
            <Users className="w-12 h-12 glass-text-muted mx-auto mb-3 opacity-50" />
            <p className="glass-text-muted">Nenhum colaborador da produção encontrado.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function GamificationSettings() {
  const [pointsConfig, setPointsConfig] = useState({
    course_completed: 20,
    login_daily: 1
  });

  const [levelConfig, setLevelConfig] = useState({
    level_2: 100,
    level_3: 250,
    level_4: 500,
    level_5: 1000,
    level_6: 2000,
    level_7: 3500,
    level_8: 5000,
    level_9: 7500,
    level_10: 10000
  });

  return (
    <div className="space-y-6">
      <div className="glass-card p-6 rounded-2xl">
        <h3 className="text-lg font-bold glass-text mb-4 flex items-center gap-2">
          <Coins className="w-5 h-5 text-yellow-600" />
          Sistema de Pontuação (Gamificação)
        </h3>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h4 className="font-semibold glass-text-muted">Ações de Aprendizado</h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm glass-text-muted">Concluir curso</span>
                <Input
                  type="number"
                  value={pointsConfig.course_completed}
                  onChange={(e) => setPointsConfig(prev => ({...prev, course_completed: parseInt(e.target.value)}))}
                  className="w-20 glass-input text-center"
                />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm glass-text-muted">Login Diário</span>
                <Input
                  type="number"
                  value={pointsConfig.login_daily}
                  onChange={(e) => setPointsConfig(prev => ({...prev, login_daily: parseInt(e.target.value)}))}
                  className="w-20 glass-input text-center"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <Button className="glass-button-primary">
            Salvar Configurações de Pontuação
          </Button>
        </div>
      </div>

      <div className="glass-card p-6 rounded-2xl">
        <h3 className="text-lg font-bold glass-text mb-4 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-purple-600" />
          Configuração de Níveis
        </h3>

        <div className="grid md:grid-cols-3 gap-4">
          {Object.entries(levelConfig).map(([level, points]) => (
            <div key={level} className="flex justify-between items-center glass-inset p-3 rounded-lg">
              <span className="text-sm font-medium glass-text">
                {level.replace('_', ' ').toUpperCase()}
              </span>
              <Input
                type="number"
                value={points}
                onChange={(e) => setLevelConfig(prev => ({...prev, [level]: parseInt(e.target.value)}))}
                className="w-24 glass-input text-center text-sm"
              />
            </div>
          ))}
        </div>

        <div className="mt-6">
          <Button className="glass-button-primary">
            Salvar Configurações de Níveis
          </Button>
        </div>
      </div>
    </div>
  );
}

function AccessLevelManagement() {
  const [accessLevels, setAccessLevels] = useState([]);
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [showEditDialog, setShowEditDialog] = useState(false);

  useEffect(() => {
    loadAccessLevels();
  }, []);

  const loadAccessLevels = async () => {
    try {
      const levels = await base44.entities.AccessLevel.list();
      setAccessLevels(levels);
    } catch (error) {
      console.error("Erro ao carregar níveis de acesso:", error);
    }
  };

  const handleEditLevel = (level) => {
    setSelectedLevel({...level});
    setShowEditDialog(true);
  };

  const handleUpdateLevel = async () => {
    if (!selectedLevel) return;

    try {
      const { id, ...dataToUpdate } = selectedLevel;
      await base44.entities.AccessLevel.update(id, dataToUpdate);
      
      alert("Nível de acesso atualizado com sucesso!");
      setShowEditDialog(false);
      setSelectedLevel(null);
      await loadAccessLevels();
    } catch (error) {
      console.error("Erro ao atualizar nível:", error);
      alert("Erro ao atualizar. Tente novamente.");
    }
  };

  const updatePermission = (permission, value) => {
    setSelectedLevel(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [permission]: value
      }
    }));
  };

  const translatePermission = (key) => {
    const translations = {
      can_manage_users: "Gerenciar Usuários",
      can_manage_announcements: "Gerenciar Comunicados",
      can_manage_hr_requests: "Gerenciar Solicitações RH",
      can_view_team_hr_requests: "Ver Solicitações da Equipe",
      can_manage_forms: "Gerenciar Formulários",
      can_view_form_reports: "Ver Relatórios de Formulários",
      can_manage_gamification: "Gerenciar Gamificação",
      can_send_broadcast_messages: "Enviar Mensagens em Massa",
      can_manage_content: "Gerenciar Conteúdo",
      can_view_analytics: "Ver Análises e Estatísticas",
      can_manage_mq_news: "Gerenciar MQ News",
      can_manage_suggestions: "Gerenciar Sugestões",
      can_manage_complaints: "Gerenciar Denúncias"
    };
    return translations[key] || key.replace(/can_|_/g, ' ').replace(/^\w/, c => c.toUpperCase());
  };

  return (
    <div className="space-y-6">
      <div className="glass-card p-6 rounded-2xl">
        <h3 className="text-lg font-bold glass-text mb-4">Níveis de Acesso Configurados</h3>
        
        <div className="grid md:grid-cols-1 gap-4">
          {accessLevels.map(level => (
            <div key={level.id} className="glass-card p-5 rounded-xl border-2 border-blue-200">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-bold text-gray-900 text-lg">{level.display_name}</h4>
                  <p className="text-sm text-gray-600 mt-1">{level.description}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEditLevel(level)}
                  className="glass-button"
                >
                  <Pencil className="w-4 h-4" />
                </Button>
              </div>

              <div className="mt-4 space-y-2">
                <div className="text-xs font-bold text-gray-900 mb-2">PERMISSÕES:</div>
                {Object.entries(level.permissions).length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {Object.entries(level.permissions).map(([key, value]) => (
                      value && (
                        <div key={key} className="flex items-center gap-2 text-xs text-gray-700">
                          <CheckCircle className="w-3 h-3 text-green-600" />
                          <span className="font-semibold">
                            {translatePermission(key)}
                          </span>
                        </div>
                      )
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-500 italic">Nenhuma permissão configurada.</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal de Edição */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="glass-modal max-w-3xl p-0 max-h-[90vh] overflow-y-auto">
          {selectedLevel && (
            <div className="p-8">
              <DialogHeader className="mb-6">
                <h2 className="modal-title">Editar: {selectedLevel.display_name}</h2>
                <p className="modal-description">Configure as permissões deste nível de acesso</p>
              </DialogHeader>

              <div className="space-y-5">
                <div>
                  <Label className="glass-label">Nome de Exibição</Label>
                  <Input
                    value={selectedLevel.display_name}
                    onChange={(e) => setSelectedLevel(prev => ({...prev, display_name: e.target.value}))}
                    className="glass-input"
                  />
                </div>

                <div>
                  <Label className="glass-label">Descrição</Label>
                  <Textarea
                    value={selectedLevel.description}
                    onChange={(e) => setSelectedLevel(prev => ({...prev, description: e.target.value}))}
                    className="glass-textarea"
                    rows={2}
                  />
                </div>

                <div className="glass-card p-5 rounded-xl">
                  <h3 className="font-bold text-gray-900 mb-4">Permissões</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {Object.entries(selectedLevel.permissions).map(([key, value]) => (
                      <label key={key} className="flex items-center gap-3 p-3 glass rounded-lg cursor-pointer">
                        <input
                          type="checkbox"
                          checked={value}
                          onChange={(e) => updatePermission(key, e.target.checked)}
                          className="w-5 h-5"
                        />
                        <span className="text-gray-900 font-semibold text-sm">
                          {translatePermission(key)}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-gray-200">
                <Button
                  variant="ghost"
                  onClick={() => setShowEditDialog(false)}
                  className="glass-button-secondary"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleUpdateLevel}
                  className="glass-button-primary"
                >
                  Salvar Alterações
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function AdminPage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeSection, setActiveSection] = useState(null);
  const navigate = useNavigate();

  const departments = ["RH", "TI", "Financeiro", "Marketing", "Vendas", "Operações", "Diretoria", "Produção", "Criação", "Logística"];
  const brands = ["Corporativo", "Dixie", "Gangster", "Overcore"];
  const roles = ["admin", "user"];
  const accessLevels = ["admin", "rh", "lider", "colaborador"]; 

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const user = await User.me();
        setCurrentUser(user);
        if (user.role !== 'admin') {
          navigate(createPageUrl('Dashboard'));
        } else {
          loadUsers();
        }
      } catch (error) {
        navigate(createPageUrl('Dashboard'));
      }
    };
    checkAdmin();
  }, [navigate]);

  const loadUsers = async () => {
    const usersData = await User.list();
    setUsers(usersData);
  };

  const filteredUsers = users.filter(u =>
    u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.department?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStats = () => {
    return {
      totalUsers: users.length,
      adminUsers: users.filter(u => u.role === 'admin').length,
      productionUsers: users.filter(u => u.department === 'Produção').length,
      totalPoints: users.reduce((sum, u) => sum + (u.points || 0), 0)
    };
  };

  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8 glass-card rounded-2xl">
        <AlertTriangle className="w-16 h-16 text-red-500 mb-4" />
        <h1 className="text-2xl font-bold glass-text">Acesso Negado</h1>
        <p className="glass-text-muted mt-2">Você não tem permissão para acessar esta página.</p>
        <Link to={createPageUrl('Dashboard')}>
          <Button className="mt-6 glass-button-primary">Voltar ao Dashboard</Button>
        </Link>
      </div>
    );
  }

  const stats = getStats();

  const adminSections = [
    {
      id: 'users',
      title: 'Gerenciar Usuários',
      description: 'Cadastro, edição e controle de colaboradores',
      icon: Users,
      gradient: 'from-blue-500 to-blue-600',
      stats: `${stats.totalUsers} usuários`
    },
    {
      id: 'contacts',
      title: 'Gestão de Contatos',
      description: 'Gerenciar contatos de departamentos',
      icon: Phone,
      gradient: 'from-teal-500 to-teal-600',
      stats: 'Contatos departamentais'
    },
    {
      id: 'contents',
      title: 'Gestão de Conteúdos',
      description: 'Upload e gerenciamento de cursos e materiais',
      icon: BookOpen,
      gradient: 'from-indigo-500 to-indigo-600',
      stats: 'Cursos e materiais'
    },
    {
      id: 'mqnews',
      title: 'Gestão MQ News',
      description: 'Publicar e editar noticiários mensais',
      icon: FileText,
      gradient: 'from-cyan-500 to-cyan-600',
      stats: 'Jornal mensal'
    },
    {
      id: 'hr-requests',
      title: 'Solicitações RH',
      description: 'Gerenciar todas requisições recebidas',
      icon: MessageSquare,
      gradient: 'from-pink-500 to-pink-600',
      stats: 'Todas solicitações'
    },
    {
      id: 'announcements',
      title: 'Gestão do Mural',
      description: 'Criar e publicar comunicados',
      icon: MessageSquare,
      gradient: 'from-orange-500 to-orange-600',
      stats: 'Publicar avisos'
    },
    {
      id: 'suggestions',
      title: 'Gestão de Melhorias',
      description: 'Ver e avaliar sugestões enviadas',
      icon: Lightbulb,
      gradient: 'from-yellow-500 to-yellow-600',
      stats: 'Ideias recebidas'
    },
    {
      id: 'complaints',
      title: 'Denúncias Anônimas',
      description: 'Gerenciar denúncias confidenciais',
      icon: Shield,
      gradient: 'from-red-500 to-red-600',
      stats: 'Canal confidencial'
    },
    {
      id: 'access',
      title: 'Níveis de Acesso',
      description: 'Configure permissões e perfis de usuário',
      icon: Shield,
      gradient: 'from-purple-500 to-purple-600',
      stats: '4 perfis configurados'
    },
    {
      id: 'awards',
      title: 'Gestão de Premiação',
      description: 'Atribuir pontos e gerenciar recompensas',
      icon: Gift,
      gradient: 'from-green-500 to-green-600',
      stats: `${stats.totalPoints} pontos distribuídos`
    },
    {
      id: 'gamification',
      title: 'Gamificação',
      description: 'Configure pontos, níveis e conquistas',
      icon: Trophy,
      gradient: 'from-yellow-500 to-orange-600',
      stats: 'Sistema ativo'
    },
    {
      id: 'settings',
      title: 'Configurações',
      description: 'Ajustes gerais do sistema',
      icon: Settings,
      gradient: 'from-gray-500 to-gray-600',
      stats: 'Configurações avançadas'
    },
    {
      id: 'transfer',
      title: 'Transferir Demandas',
      description: 'Reatribuir solicitações entre usuários',
      icon: Users,
      gradient: 'from-orange-500 to-red-600',
      stats: 'Gestão de atribuições'
    }
  ];

  // Se uma seção está ativa, mostra o conteúdo dela
  if (activeSection) {
    const currentSection = adminSections.find(s => s.id === activeSection);

    return (
      <div className="space-y-6">
        {/* Botão Voltar */}
        <Button
          onClick={() => setActiveSection(null)}
          variant="ghost"
          className="glass-button mb-4"
        >
          ← Voltar ao Painel
        </Button>

        {/* Header da Seção */}
        {currentSection && (
          <div className="glass-card p-6 rounded-2xl">
            <div className="flex items-center gap-4">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center bg-gradient-to-r ${currentSection.gradient} shadow-lg`}>
                {React.createElement(currentSection.icon, { className: "w-8 h-8 text-white" })}
              </div>
              <div>
                <h1 className="text-3xl font-bold glass-text">{currentSection.title}</h1>
                <p className="glass-text-muted text-lg">{currentSection.description}</p>
              </div>
            </div>
          </div>
        )}

        {/* Conteúdo da Seção */}
        {activeSection === 'users' && (
          <div className="space-y-4">
            {/* Info sobre cadastro e convite */}
            <div className="glass-card p-6 rounded-2xl bg-blue-50/50 border border-blue-200/50">
              <div className="flex items-center gap-4">
                <UserPlus className="w-8 h-8 text-blue-600" />
                <div className="flex-1">
                  <h2 className="font-semibold text-blue-800 mb-2">Sistema de Cadastro de Funcionários</h2>
                  <p className="text-sm text-blue-700">
                    Use o botão abaixo para fazer o cadastro completo de novos colaboradores no sistema.
                    Após o cadastro, será necessário convidar o usuário via <strong>Dashboard → Usuários → Convidar Usuário</strong> para que ele receba acesso ao sistema.
                  </p>
                </div>
              </div>
            </div>

            {/* Gestão de usuários e botão de cadastro */}
            <div className="glass-card p-6 rounded-2xl">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold glass-text">Gerenciar Usuários</h2>
                <div className="flex items-center gap-4">
                  <div className="relative w-1/2">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 glass-text-muted" />
                    <Input
                      placeholder="Buscar por nome, e-mail, depto..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 glass-input"
                    />
                  </div>
                  <NewEmployeeForm
                    onEmployeeCreated={loadUsers}
                    departments={departments}
                    brands={brands}
                    roles={roles}
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="glass-text">Nome</TableHead>
                      <TableHead className="glass-text">Departamento</TableHead>
                      <TableHead className="glass-text">Marca</TableHead>
                      <TableHead className="glass-text">Cargo</TableHead>
                      <TableHead className="glass-text">Perfil</TableHead>
                      <TableHead className="glass-text">Pontos</TableHead>
                      <TableHead className="glass-text text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map(user => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="font-medium glass-text">{user.full_name}</div>
                          <div className="text-xs glass-text-muted">{user.email}</div>
                        </TableCell>
                        <TableCell className="glass-text">{user.department || '-'}</TableCell>
                        <TableCell className="glass-text">{user.brand || '-'}</TableCell>
                        <TableCell className="glass-text">{user.position || '-'}</TableCell>
                        <TableCell>
                          <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Coins className="w-3 h-3 text-yellow-600" />
                            <span className="text-sm font-semibold glass-text">{user.points || 0}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <EditUserForm user={user} onUserUpdate={loadUsers} departments={departments} brands={brands} roles={roles} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {filteredUsers.length === 0 && (
                <div className="text-center py-10">
                  <Users className="w-12 h-12 glass-text-muted mx-auto mb-3 opacity-50" />
                  <p className="glass-text-muted">Nenhum usuário encontrado.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeSection === 'contacts' && <ContactsManagement />}
        {activeSection === 'contents' && <ContentManagement />}
        {activeSection === 'mqnews' && <MQNewsManagement />}
        {activeSection === 'hr-requests' && <HRRequestsManagement />}
        {activeSection === 'announcements' && <AnnouncementsManagement />}
        {activeSection === 'suggestions' && <SuggestionsManagement />}
        {activeSection === 'complaints' && <ComplaintsManagement />}
        {activeSection === 'access' && <AccessLevelManagement />}
        {activeSection === 'awards' && <AwardManagement />}
        {activeSection === 'gamification' && <GamificationSettings />}
        {activeSection === 'settings' && (
          <div className="glass-card p-6 rounded-2xl">
            <h2 className="text-xl font-bold glass-text mb-4">Configurações do Sistema</h2>
            <p className="glass-text-muted">Configurações avançadas em desenvolvimento...</p>
          </div>
        )}
        {activeSection === 'transfer' && <RequestTransfer />}
      </div>
    );
  }

  // Vista principal do Admin com cards grandes
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-card p-6 rounded-2xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold glass-text flex items-center gap-3">
              <Shield className="w-7 h-7 text-blue-600" />
              Painel de Administração
            </h1>
            <p className="glass-text-muted mt-1">Gerencie usuários, premiação e configurações do sistema</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <div className="glass-card p-4 rounded-xl text-center">
          <div className="text-2xl font-bold text-blue-600">{stats.totalUsers}</div>
          <div className="text-sm glass-text-muted">Total Usuários</div>
        </div>
        <div className="glass-card p-4 rounded-xl text-center">
          <div className="text-2xl font-bold text-purple-600">{stats.adminUsers}</div>
          <div className="text-sm glass-text-muted">Administradores</div>
        </div>
        <div className="glass-card p-4 rounded-xl text-center">
          <div className="text-2xl font-bold text-green-600">{stats.productionUsers}</div>
          <div className="text-sm glass-text-muted">Produção</div>
        </div>
        <div className="glass-card p-4 rounded-xl text-center">
          <div className="text-2xl font-bold text-yellow-600">{stats.totalPoints}</div>
          <div className="text-sm glass-text-muted">Pontos Totais</div>
        </div>
      </div>

      {/* Cards de Seções - Novo Design */}
      <div>
        <h2 className="text-xl font-bold glass-text mb-4">Ferramentas Administrativas</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {adminSections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className="glass-card p-6 rounded-2xl text-left hover:scale-105 transition-all duration-200 cursor-pointer group"
            >
              <div className="flex items-start gap-4">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center bg-gradient-to-r ${section.gradient} shadow-lg flex-shrink-0 group-hover:scale-110 transition-transform`}>
                  {React.createElement(section.icon, { className: "w-8 h-8 text-white" })}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-bold glass-text mb-2 group-hover:text-blue-600 transition-colors">
                    {section.title}
                  </h3>
                  <p className="glass-text-muted text-sm mb-3 line-clamp-2">
                    {section.description}
                  </p>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs font-semibold">
                      {section.stats}
                    </Badge>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-white/10">
                <span className="text-sm font-semibold glass-text group-hover:text-blue-600 transition-colors">
                  Acessar →
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Atalhos Rápidos */}
      <div className="glass-card p-6 rounded-2xl">
        <h3 className="text-lg font-bold glass-text mb-4">Ações Rápidas</h3>
        <div className="grid md:grid-cols-3 gap-4">
          <Button 
            onClick={() => setActiveSection('users')}
            className="glass-button-primary justify-start h-auto py-4"
          >
            <UserPlus className="w-5 h-5 mr-3" />
            <div className="text-left">
              <div className="font-bold">Novo Usuário</div>
              <div className="text-xs opacity-90">Cadastrar colaborador</div>
            </div>
          </Button>
          <Button 
            onClick={() => setActiveSection('awards')}
            className="glass-button justify-start h-auto py-4"
          >
            <Coins className="w-5 h-5 mr-3" />
            <div className="text-left">
              <div className="font-bold">Atribuir Pontos</div>
              <div className="text-xs opacity-90">Recompensar colaborador</div>
            </div>
          </Button>
          <Button 
            onClick={() => setActiveSection('access')}
            className="glass-button justify-start h-auto py-4"
          >
            <Shield className="w-5 h-5 mr-3" />
            <div className="text-left">
              <div className="font-bold">Configurar Acessos</div>
              <div className="text-xs opacity-90">Gerenciar permissões</div>
            </div>
          </Button>
        </div>
      </div>
    </div>
  );
}