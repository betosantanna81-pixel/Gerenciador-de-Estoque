
import React, { useState } from 'react';
import { RegistryEntity } from '../types';
import { Save, Trash2, MapPin, Phone, Mail, Building2, FileText, AlertTriangle, X } from 'lucide-react';

interface EntityRegistryProps {
  type: 'supplier' | 'client';
  data: RegistryEntity[];
  onSave: (entity: RegistryEntity) => void;
  onDelete: (id: string) => void;
}

const EntityRegistry: React.FC<EntityRegistryProps> = ({ type, data, onSave, onDelete }) => {
  const isSupplier = type === 'supplier';
  const title = isSupplier ? 'Cadastro de Fornecedores' : 'Cadastro de Clientes';
  const labelCode = isSupplier ? 'Cód. Fornecedor' : 'Cód. Cliente';
  const labelName = isSupplier ? 'Nome Fornecedor' : 'Nome Cliente';
  
  const [duplicateModal, setDuplicateModal] = useState<{isOpen: boolean; existingEntity: RegistryEntity | null}>({
    isOpen: false,
    existingEntity: null
  });

  const [formData, setFormData] = useState<Omit<RegistryEntity, 'id'>>({
    code: '',
    name: '',
    contact: '',
    cnpj: '',
    ie: '',
    address: {
      state: '',
      city: '',
      neighborhood: '',
      street: '',
      number: '',
      zip: ''
    },
    phone: '',
    email: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...(prev as any)[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      contact: '',
      cnpj: '',
      ie: '',
      address: {
        state: '',
        city: '',
        neighborhood: '',
        street: '',
        number: '',
        zip: ''
      },
      phone: '',
      email: ''
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.code.length !== 3) {
      alert('O código deve ter 3 dígitos.');
      return;
    }
    
    // Check for duplicates
    const existing = data.find(d => d.code === formData.code);
    if (existing) {
        setDuplicateModal({
            isOpen: true,
            existingEntity: existing
        });
        return;
    }

    // New Record
    onSave({
        ...formData,
        id: crypto.randomUUID()
    });
    alert('Registro salvo com sucesso!');
    resetForm();
  };

  const handleOverwrite = () => {
    if (duplicateModal.existingEntity) {
        onSave({
            ...formData,
            id: duplicateModal.existingEntity.id
        });
        alert('Registro atualizado com sucesso!');
        setDuplicateModal({ isOpen: false, existingEntity: null });
        resetForm();
    }
  };

  const inputClass = "w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-emerald-500 outline-none text-gray-800 text-sm bg-white";
  const sectionTitleClass = "text-emerald-800 font-bold text-sm uppercase tracking-wider mb-3 flex items-center gap-2 border-b border-emerald-100 pb-1 mt-2";

  return (
    <div className="p-8 max-w-6xl mx-auto relative">
      <h2 className="text-2xl font-bold text-emerald-900 mb-6 flex items-center gap-2">
        <Building2 size={28} />
        {title}
      </h2>

      {/* Form Section */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-8">
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Basic Info */}
          <div>
            <h3 className={sectionTitleClass}><FileText size={16}/> Dados Principais</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">{labelCode} (3 dígitos)</label>
                <input 
                  type="text" name="code" value={formData.code} onChange={handleChange} 
                  maxLength={3} placeholder="000" className={inputClass} required 
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-gray-600 mb-1">{labelName}</label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} className={inputClass} required />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Contato (Pessoa)</label>
                <input type="text" name="contact" value={formData.contact} onChange={handleChange} className={inputClass} />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
               <div className="md:col-span-2">
                 <label className="block text-xs font-bold text-gray-600 mb-1">CNPJ</label>
                 <input type="text" name="cnpj" value={formData.cnpj} onChange={handleChange} placeholder="00.000.000/0000-00" className={inputClass} />
               </div>
               <div className="md:col-span-2">
                 <label className="block text-xs font-bold text-gray-600 mb-1">Inscrição Estadual</label>
                 <input type="text" name="ie" value={formData.ie} onChange={handleChange} className={inputClass} />
               </div>
            </div>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className={sectionTitleClass}><Phone size={16}/> Contato</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Telefone</label>
                  <input type="text" name="phone" value={formData.phone} onChange={handleChange} className={inputClass} />
               </div>
               <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">E-mail</label>
                  <input type="email" name="email" value={formData.email} onChange={handleChange} className={inputClass} />
               </div>
            </div>
          </div>

          {/* Address Info */}
          <div>
             <h3 className={sectionTitleClass}><MapPin size={16}/> Endereço</h3>
             <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                <div>
                   <label className="block text-xs font-bold text-gray-600 mb-1">CEP</label>
                   <input type="text" name="address.zip" value={formData.address.zip} onChange={handleChange} className={inputClass} />
                </div>
                <div className="md:col-span-4">
                   <label className="block text-xs font-bold text-gray-600 mb-1">Logradouro</label>
                   <input type="text" name="address.street" value={formData.address.street} onChange={handleChange} className={inputClass} />
                </div>
                <div>
                   <label className="block text-xs font-bold text-gray-600 mb-1">Número</label>
                   <input type="text" name="address.number" value={formData.address.number} onChange={handleChange} className={inputClass} />
                </div>
                <div className="md:col-span-2">
                   <label className="block text-xs font-bold text-gray-600 mb-1">Bairro</label>
                   <input type="text" name="address.neighborhood" value={formData.address.neighborhood} onChange={handleChange} className={inputClass} />
                </div>
                <div className="md:col-span-2">
                   <label className="block text-xs font-bold text-gray-600 mb-1">Cidade</label>
                   <input type="text" name="address.city" value={formData.address.city} onChange={handleChange} className={inputClass} />
                </div>
                <div className="md:col-span-2">
                   <label className="block text-xs font-bold text-gray-600 mb-1">Estado</label>
                   <input type="text" name="address.state" value={formData.address.state} onChange={handleChange} maxLength={2} className={inputClass} />
                </div>
             </div>
          </div>

          <div className="pt-4">
            <button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-8 rounded-lg shadow-md flex items-center gap-2 transition-all">
               <Save size={18} />
               Salvar Cadastro
            </button>
          </div>
        </form>
      </div>

      {/* List Section */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
         <div className="bg-gray-50 p-4 border-b border-gray-200">
            <h3 className="font-bold text-gray-700">Registros Salvos</h3>
         </div>
         <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
               <thead className="bg-gray-100 text-gray-600 uppercase text-xs">
                  <tr>
                     <th className="p-4">Cód</th>
                     <th className="p-4">Nome</th>
                     <th className="p-4">CNPJ</th>
                     <th className="p-4">Contato</th>
                     <th className="p-4">Telefone</th>
                     <th className="p-4">Cidade/UF</th>
                     <th className="p-4 text-center">Ações</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-gray-100">
                  {data.length === 0 ? (
                     <tr><td colSpan={7} className="p-4 text-center text-gray-400">Nenhum registro encontrado.</td></tr>
                  ) : (
                     data.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50">
                           <td className="p-4 font-mono font-bold text-emerald-800">{item.code}</td>
                           <td className="p-4 font-medium">{item.name}</td>
                           <td className="p-4 text-gray-500">{item.cnpj || '-'}</td>
                           <td className="p-4 text-gray-500">{item.contact || '-'}</td>
                           <td className="p-4 text-gray-500">{item.phone || '-'}</td>
                           <td className="p-4 text-gray-500">{item.address.city}/{item.address.state}</td>
                           <td className="p-4 text-center">
                              <button onClick={() => onDelete(item.id)} className="text-red-400 hover:text-red-600 p-2"><Trash2 size={16} /></button>
                           </td>
                        </tr>
                     ))
                  )}
               </tbody>
            </table>
         </div>
      </div>

      {/* Duplicate Confirmation Modal */}
      {duplicateModal.isOpen && duplicateModal.existingEntity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
           <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
              <div className="bg-yellow-500 p-4 text-white flex justify-between items-center">
                  <h3 className="font-bold text-lg flex items-center gap-2">
                      <AlertTriangle size={24} className="text-white" />
                      Código Já Existente
                  </h3>
                  <button 
                    onClick={() => setDuplicateModal({isOpen: false, existingEntity: null})}
                    className="text-white/80 hover:text-white transition"
                  >
                    <X size={24} />
                  </button>
              </div>
              <div className="p-6">
                  <p className="text-gray-700 text-sm leading-relaxed mb-4">
                     O {labelCode} <span className="font-bold font-mono">{duplicateModal.existingEntity.code}</span> já está cadastrado para <span className="font-bold">{duplicateModal.existingEntity.name}</span>.
                  </p>
                  <p className="text-gray-600 text-sm mb-6">
                     Gostaria de atualizar (sobrescrever) os dados deste registro existente ou prefere alterar o código do novo cadastro?
                  </p>
                  
                  <div className="flex flex-col gap-3">
                      <button 
                         onClick={handleOverwrite}
                         className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-all shadow-sm"
                      >
                         <Save size={18} />
                         Sim, Sobrescrever Dados
                      </button>
                      <button 
                         onClick={() => setDuplicateModal({isOpen: false, existingEntity: null})}
                         className="w-full bg-white border-2 border-gray-200 hover:border-gray-300 text-gray-700 font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-all"
                      >
                         Não, Alterar Código
                      </button>
                  </div>
              </div>
           </div>
        </div>
      )}

    </div>
  );
};

export default EntityRegistry;
