import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { 
  Users, 
  Phone, 
  Mail, 
  MapPin, 
  Search,
  Star,
  Building
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Contacts() {
  const [contacts, setContacts] = useState([]);
  const [filteredContacts, setFilteredContacts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("Todos");
  const [selectedLocation, setSelectedLocation] = useState("Todas");

  const departments = ["Todos", "RH", "TI", "Financeiro", "Marketing", "Vendas", "Operações", "Diretoria", "Produção", "Criação", "Logística", "Geral"];
  const locations = ["Todas", "Guarulhos", "Joinville", "Agrolândia", "Lojas", "Escritório"];

  useEffect(() => {
    loadContacts();
  }, []);

  useEffect(() => {
    let filtered = contacts.filter(c => c.is_active);

    if (searchTerm) {
      filtered = filtered.filter(contact => 
        contact.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.position?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.department?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedDepartment !== "Todos") {
      filtered = filtered.filter(contact => contact.department === selectedDepartment);
    }

    if (selectedLocation !== "Todas") {
      filtered = filtered.filter(contact => contact.location === selectedLocation);
    }

    setFilteredContacts(filtered);
  }, [contacts, searchTerm, selectedDepartment, selectedLocation]);

  const loadContacts = async () => {
    try {
      const contactsData = await base44.entities.Contact.list("-created_date");
      setContacts(contactsData);
    } catch (error) {
      console.error("Erro ao carregar contatos:", error);
    }
  };

  const getContactsByDepartment = () => {
    const grouped = {};
    filteredContacts.forEach(contact => {
      const dept = contact.department || 'Não definido';
      if (!grouped[dept]) {
        grouped[dept] = [];
      }
      grouped[dept].push(contact);
    });
    return grouped;
  };

  const getEmergencyContacts = () => {
    return filteredContacts.filter(contact => contact.is_emergency);
  };

  const ContactCard = ({ contact }) => (
    <div className="glass-card p-5 rounded-2xl">
      <div className="flex items-start gap-4">
        <Avatar className="w-16 h-16 border-2 border-white/30 shadow-lg flex-shrink-0">
          <AvatarImage src={contact.avatar_url} alt={contact.name} />
          <AvatarFallback className="bg-gradient-to-r from-blue-400 to-purple-500 text-white font-semibold text-lg">
            {contact.name?.charAt(0) || '?'}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-bold glass-text truncate text-lg">
                {contact.name}
              </h3>
              <p className="glass-text-muted truncate">{contact.position}</p>
            </div>
            
            {contact.is_emergency && (
              <Star className="w-5 h-5 text-red-500 flex-shrink-0" />
            )}
          </div>
          
          <div className="flex flex-wrap items-center gap-2 mt-3">
            <Badge variant="outline" className="font-medium glass-text">
              {contact.department}
            </Badge>
            {contact.location && (
              <Badge variant="secondary" className="font-medium glass-text flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {contact.location}
              </Badge>
            )}
            {contact.brand && (
              <Badge className="bg-purple-100 text-purple-800 border-purple-300 font-semibold">
                {contact.brand}
              </Badge>
            )}
          </div>
          
          <div className="flex flex-col gap-2 mt-4">
            {contact.phone && (
              <div className="flex items-center gap-2 text-sm glass-text-muted">
                <Phone className="w-4 h-4" />
                <a href={`tel:${contact.phone}`} className="hover:text-blue-600 font-semibold">
                  {contact.phone}
                  {contact.extension && ` (Ramal ${contact.extension})`}
                </a>
              </div>
            )}
            {contact.mobile_phone && (
              <div className="flex items-center gap-2 text-sm glass-text-muted">
                <Phone className="w-4 h-4" />
                <a href={`tel:${contact.mobile_phone}`} className="hover:text-blue-600 font-semibold">
                  {contact.mobile_phone}
                </a>
              </div>
            )}
            {contact.email && (
              <div className="flex items-center gap-2 text-sm glass-text-muted">
                <Mail className="w-4 h-4" />
                <a href={`mailto:${contact.email}`} className="hover:text-blue-600 font-semibold truncate">
                  {contact.email}
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const DepartmentSection = ({ department, contacts }) => (
    <div className="glass-card p-6 rounded-2xl mb-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
          <Building className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold glass-text">{department}</h2>
          <p className="glass-text-muted">{contacts.length} contatos</p>
        </div>
      </div>
      
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {contacts.map(contact => (
          <ContactCard key={contact.id} contact={contact} />
        ))}
      </div>
    </div>
  );

  const contactsByDepartment = getContactsByDepartment();
  const emergencyContacts = getEmergencyContacts();

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <div className="glass-card p-6 rounded-2xl">
        <div className="grid md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 glass-text-muted" />
              <Input
                placeholder="Buscar contatos por nome, cargo, e-mail..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 glass-input"
              />
            </div>
          </div>
          
          <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
            <SelectTrigger className="glass-select">
              <SelectValue placeholder="Departamento" />
            </SelectTrigger>
            <SelectContent>
              {departments.map(dept => (
                <SelectItem key={dept} value={dept}>{dept}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedLocation} onValueChange={setSelectedLocation}>
            <SelectTrigger className="glass-select">
              <SelectValue placeholder="Localidade" />
            </SelectTrigger>
            <SelectContent>
              {locations.map(loc => (
                <SelectItem key={loc} value={loc}>{loc}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="all" className="space-y-6">
        <TabsList className="glass-card p-1 w-full md:w-auto">
          <TabsTrigger value="all" className="glass-button data-[state=active]:glass-button-active w-full">
            Todos ({filteredContacts.length})
          </TabsTrigger>
          <TabsTrigger value="emergency" className="glass-button data-[state=active]:glass-button-active w-full">
            Emergência ({emergencyContacts.length})
          </TabsTrigger>
          <TabsTrigger value="departments" className="glass-button data-[state=active]:glass-button-active w-full">
            Por Departamento
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredContacts.map(contact => (
              <ContactCard key={contact.id} contact={contact} />
            ))}
          </div>
          {filteredContacts.length === 0 && (
            <div className="text-center py-12 glass-card rounded-2xl">
              <Phone className="w-16 h-16 glass-text-muted mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-semibold glass-text mb-2">
                Nenhum contato encontrado
              </h3>
              <p className="glass-text-muted">
                Ajuste os filtros ou contate o RH para adicionar contatos.
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="emergency">
          <div className="space-y-6">
            <div className="glass-card p-6 rounded-2xl bg-red-500/10">
              <div className="flex items-center gap-3 mb-2">
                <Star className="w-6 h-6 text-red-600" />
                <div>
                  <h2 className="font-bold text-red-800 text-xl">Contatos de Emergência</h2>
                  <p className="text-red-700">
                    Contatos prioritários para situações de emergência.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {emergencyContacts.map(contact => (
                <ContactCard key={contact.id} contact={contact} />
              ))}
            </div>

            {emergencyContacts.length === 0 && (
              <div className="text-center py-12 glass-card rounded-2xl">
                <Star className="w-16 h-16 glass-text-muted mx-auto mb-4 opacity-50" />
                <h3 className="text-xl font-semibold glass-text mb-2">
                  Nenhum contato de emergência cadastrado
                </h3>
                <p className="glass-text-muted">
                  Contate o RH para definir contatos de emergência.
                </p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="departments">
          <div className="space-y-6">
            {Object.keys(contactsByDepartment).length > 0 ? Object.entries(contactsByDepartment).map(([department, contacts]) => (
              <DepartmentSection key={department} department={department} contacts={contacts} />
            )) : (
              <div className="text-center py-12 glass-card rounded-2xl">
                <Users className="w-16 h-16 glass-text-muted mx-auto mb-4 opacity-50" />
                <h3 className="text-xl font-semibold glass-text mb-2">
                  Nenhum contato encontrado
                </h3>
                <p className="glass-text-muted">
                  Ajuste os filtros para encontrar os contatos.
                </p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}