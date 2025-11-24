
import React, { useState } from 'react';
import { ProductEntity } from '../types';
import { Save, Trash2, Package, Tag, AlertTriangle, X } from 'lucide-react';

interface ProductRegistryProps {
  data: ProductEntity[];
  onSave: (product: ProductEntity) => void;
  onDelete: (id: string) => void;
}

const ProductRegistry: React.FC<ProductRegistryProps> = ({ data, onSave, onDelete }) => {
  const [duplicateModal, setDuplicateModal] = useState<{isOpen: boolean; existingProduct: ProductEntity | null}>({
    isOpen: false,
    existingProduct: null
  });

  const [formData, setFormData] = useState<Omit<ProductEntity, 'id'>>({
    name: '',
    code: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    // Enforce numeric only for code and max length 3
    if (name === 'code') {
       if (!/^\d*$/.test(value)) return;
       if (value.length > 3) return;
    }
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({ name: '', code: '' });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.code.length !== 3) {
      alert('O código do produto deve ter exatamente 3 dígitos.');
      return;
    }
    if (!formData.name.trim()) {
        alert('O nome do produto é obrigatório.');
        return;
    }

    // Check for duplicate codes
    const existing = data.find(p => p.code === formData.code);
    if (existing) {
        setDuplicateModal({
            isOpen: true,
            existingProduct: existing
        });
        return;
    }
    
    // Create New
    onSave({
        ...formData,
        id: crypto.randomUUID()
    });
    alert('Produto cadastrado com sucesso!');
    resetForm();
  };

  const handleOverwrite = () => {
    if (duplicateModal.existingProduct) {
        onSave({
            ...formData,
            id: duplicateModal.existingProduct.id
        });
        alert('Produto atualizado com sucesso!');
        setDuplicateModal({ isOpen: false, existingProduct: null });
        resetForm();
    }
  };

  const inputClass = "w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-gray-800 transition-all bg-white";

  return (
    <div className="p-8 max-w-5xl mx-auto relative">
      <h2 className="text-2xl font-bold text-emerald-900 mb-6 flex items-center gap-2">
        <Package size={28} />
        Cadastro de Produtos
      </h2>

      {/* Form Section */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 mb-8">
        <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-6 items-end">
          
          <div className="flex-1 w-full">
            <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-1">
                <Tag size={16} /> Nome do Produto
            </label>
            <input 
                type="text" 
                name="name" 
                value={formData.name} 
                onChange={handleChange} 
                className={inputClass} 
                placeholder="Ex: Café Arábica Tipo 6"
                required 
            />
          </div>

          <div className="w-full md:w-48">
            <label className="block text-sm font-bold text-gray-700 mb-2">Cód. Produto</label>
            <input 
                type="text" 
                name="code" 
                value={formData.code} 
                onChange={handleChange} 
                maxLength={3} 
                placeholder="000" 
                className={`${inputClass} font-mono text-center tracking-widest font-bold`} 
                required 
            />
          </div>

          <button 
            type="submit" 
            className="w-full md:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-8 rounded-lg shadow-md flex items-center justify-center gap-2 transition-all h-[50px]"
          >
             <Save size={18} />
             Salvar
          </button>
        </form>
      </div>

      {/* List Section */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
         <div className="bg-emerald-50 p-4 border-b border-emerald-100 flex justify-between items-center">
            <h3 className="font-bold text-emerald-800">Produtos Cadastrados</h3>
            <span className="text-xs bg-white px-2 py-1 rounded border border-emerald-200 text-emerald-600 font-bold">Total: {data.length}</span>
         </div>
         <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
               <thead className="bg-white text-gray-500 uppercase text-xs border-b border-gray-100">
                  <tr>
                     <th className="p-4 w-32">Código</th>
                     <th className="p-4">Nome do Produto</th>
                     <th className="p-4 text-center w-24">Ações</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-gray-100">
                  {data.length === 0 ? (
                     <tr><td colSpan={3} className="p-8 text-center text-gray-400">Nenhum produto cadastrado.</td></tr>
                  ) : (
                     data.sort((a,b) => a.code.localeCompare(b.code)).map((item) => (
                        <tr key={item.id} className="hover:bg-emerald-50/50 transition-colors group">
                           <td className="p-4">
                                <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded font-mono font-bold border border-gray-200">
                                    {item.code}
                                </span>
                           </td>
                           <td className="p-4 font-bold text-gray-700">{item.name}</td>
                           <td className="p-4 text-center">
                              <button 
                                onClick={() => onDelete(item.id)} 
                                className="text-red-300 hover:text-red-500 p-2 rounded-full hover:bg-red-50 transition-colors"
                                title="Excluir Produto"
                              >
                                <Trash2 size={18} />
                              </button>
                           </td>
                        </tr>
                     ))
                  )}
               </tbody>
            </table>
         </div>
      </div>

      {/* Duplicate Confirmation Modal */}
      {duplicateModal.isOpen && duplicateModal.existingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
           <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
              <div className="bg-yellow-500 p-4 text-white flex justify-between items-center">
                  <h3 className="font-bold text-lg flex items-center gap-2">
                      <AlertTriangle size={24} className="text-white" />
                      Produto Já Existente
                  </h3>
                  <button 
                    onClick={() => setDuplicateModal({isOpen: false, existingProduct: null})}
                    className="text-white/80 hover:text-white transition"
                  >
                    <X size={24} />
                  </button>
              </div>
              <div className="p-6">
                  <p className="text-gray-700 text-sm leading-relaxed mb-4">
                     O Produto com código <span className="font-bold font-mono">{duplicateModal.existingProduct.code}</span> já está cadastrado como <span className="font-bold">{duplicateModal.existingProduct.name}</span>.
                  </p>
                  <p className="text-gray-600 text-sm mb-6">
                     Gostaria de atualizar (sobrescrever) este produto existente com os novos dados ou prefere alterar o código do novo cadastro?
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
                         onClick={() => setDuplicateModal({isOpen: false, existingProduct: null})}
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

export default ProductRegistry;
