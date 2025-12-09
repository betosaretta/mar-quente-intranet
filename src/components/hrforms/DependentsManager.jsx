import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, XCircle } from "lucide-react";

export default function DependentsManager({ value, onChange, title = "Inclusão de Dependentes" }) {
  const [dependents, setDependents] = useState(value || []);

  useEffect(() => {
    setDependents(value || []);
  }, [value]);

  const addDependent = () => {
    const newDeps = [...dependents, { name: '', relationship: '', birth_date: '', cpf: '' }];
    setDependents(newDeps);
    onChange(newDeps);
  };

  const removeDependent = (index) => {
    const newDeps = dependents.filter((_, i) => i !== index);
    setDependents(newDeps);
    onChange(newDeps);
  };

  const updateDependent = (index, field, value) => {
    const newDeps = [...dependents];
    newDeps[index][field] = value;
    setDependents(newDeps);
    onChange(newDeps);
  };

  return (
    <div className="glass-card p-5 rounded-xl">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-gray-900">{title}</h3>
        <Button type="button" onClick={addDependent} className="glass-button-primary text-sm">
          <Plus className="w-4 h-4 mr-2" />
          Adicionar Dependente
        </Button>
      </div>

      {dependents.length === 0 ? (
        <p className="text-center text-gray-600 py-6">Nenhum dependente adicionado</p>
      ) : (
        <div className="space-y-4">
          {dependents.map((dep, index) => (
            <div key={index} className="glass p-4 rounded-xl border-2 border-gray-200">
              <div className="flex justify-between mb-3">
                <span className="font-bold text-gray-900">Dependente {index + 1}</span>
                <Button type="button" variant="ghost" size="sm" onClick={() => removeDependent(index)} className="text-red-600">
                  <XCircle className="w-4 h-4" />
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label className="text-gray-900 text-xs font-bold">Nome</Label>
                  <Input
                    value={dep.name}
                    onChange={(e) => updateDependent(index, 'name', e.target.value)}
                    className="glass-input mt-1"
                  />
                </div>
                <div>
                  <Label className="text-gray-900 text-xs font-bold">Grau de Dependência</Label>
                  <Select value={dep.relationship} onValueChange={(value) => updateDependent(index, 'relationship', value)}>
                    <SelectTrigger className="glass-select mt-1">
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Cônjuge">Cônjuge</SelectItem>
                      <SelectItem value="Filho(a)">Filho(a)</SelectItem>
                      <SelectItem value="Pai/Mãe">Pai/Mãe</SelectItem>
                      <SelectItem value="Outro">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-gray-900 text-xs font-bold">Data de Nascimento</Label>
                  <Input
                    type="date"
                    value={dep.birth_date}
                    onChange={(e) => updateDependent(index, 'birth_date', e.target.value)}
                    className="glass-input mt-1"
                  />
                </div>
                <div>
                  <Label className="text-gray-900 text-xs font-bold">CPF</Label>
                  <Input
                    value={dep.cpf}
                    onChange={(e) => updateDependent(index, 'cpf', e.target.value)}
                    className="glass-input mt-1"
                    placeholder="000.000.000-00"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}