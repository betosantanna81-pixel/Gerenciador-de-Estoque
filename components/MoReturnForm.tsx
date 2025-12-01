
import React, { useState, useMemo } from 'react';
import { RegistryEntity } from '../types';
import { Save, RefreshCw, AlertCircle, CheckSquare, Square } from 'lucide-react';

interface AvailableBatch {
  batchId: string;
  productName: string;
  productCode: string;
  supplier: string;
  supplierCode: string;
  unitCost: number;
  remainingQuantity: number;
  isService?: boolean;
}

interface MoReturnFormProps {
  availableBatches: AvailableBatch[];
  clients: RegistryEntity[];
  onSave: (date: string, returns: { batchId: string; quantity: number }[]) => void;
}

const MoReturnForm: React.FC<MoReturnFormProps> = ({ availableBatches, clients, onSave }) => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedClientId, setSelectedClientId] = useState('');
  
  // State for selected batches: { batchId: quantity_to_return }
  // If a batchId is in this object, it is selected.
  const [selectedItems, setSelectedItems] = useState<Record<string, number>>({});

  // Filter batches: only M.O. services and matched client
  const clientBatches = useMemo(() => {
    if (!selectedClientId) return [];
    
    // Find client name to match supplier field in batches
    const client = clients.find(c => c.id === selectedClientId);
    if (!client) return [];

    return availableBatches.filter(b => 
      b.isService && 
      b.supplier === client.name // Assuming supplier field holds Client Name for M.O.
    );
  }, [selectedClientId, availableBatches, clients]);

  const toggleSelection = (batch: AvailableBatch) => {
    setSelectedItems(prev => {
      const newState = { ...prev };
      if (newState[batch.batchId] !== undefined) {
        delete newState[batch.batchId];
      } else {
        newState[batch.batchId] = batch.remainingQuantity; // Default to full return
      }
      return newState;
    });
  };

  const handleQuantityChange = (batchId: string, qty: number) => {
    setSelectedItems(prev => ({
      ...prev,
      [batchId]: qty
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const returnsToProcess = Object.entries(selectedItems).map(([batchId, quantity]) => ({
      batchId,
      quantity
    }));

    if (returnsToProcess.length === 0) {
      alert('Selecione pelo menos um item para devolver.');
      return;
    }

    onSave(date, returnsToProcess);
    
    // Reset selection
    setSelectedItems({});
    alert('Devolução registrada com sucesso!');
  };

  const inputClass = "w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-800 bg-white transition-all";

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-blue-900 p-3 rounded-xl text-white">
            <RefreshCw size={24} />
        </div>
        <div>
            <h2 className="text-2xl font-bold text-blue-900">Devolução de M.O.</h2>
            <p className="text-sm text-gray-500">Baixa em massa de materiais de Mão de Obra</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden">
        
        <form onSubmit={handleSubmit} className="p-6">
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Data da Devolução</label>
                <input 
                  type="date" 
                  value={date} 
                  onChange={(e) => setDate(e.target.value)} 
                  className={inputClass} 
                  required 
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Selecione o Cliente</label>
                <select 
                  value={selectedClientId}
                  onChange={(e) => {
                    setSelectedClientId(e.target.value);
                    setSelectedItems({}); // Clear selection on client change
                  }}
                  className={inputClass}
                  required
                >
                  <option value="">-- Selecione na lista --</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.code} - {c.name}</option>
                  ))}
                </select>
              </div>
           </div>

           {selectedClientId && clientBatches.length === 0 && (
             <div className="p-8 text-center bg-gray-50 rounded-lg border border-dashed border-gray-300 text-gray-500">
               Nenhum lote de M.O. disponível para este cliente.
             </div>
           )}

           {clientBatches.length > 0 && (
             <div className="mb-6">
                <h3 className="text-blue-900 font-bold mb-4 flex items-center gap-2">
                   Selecione os Lotes para Baixar
                   <span className="text-xs font-normal text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      {Object.keys(selectedItems).length} selecionado(s)
                   </span>
                </h3>
                
                <div className="overflow-x-auto border border-gray-200 rounded-lg">
                   <table className="w-full text-left text-sm">
                      <thead className="bg-blue-50 text-blue-800 font-bold uppercase text-xs">
                         <tr>
                            <th className="p-4 w-12 text-center">
                               {/* Global checkbox could go here */}
                            </th>
                            <th className="p-4">Lote</th>
                            <th className="p-4">Serviço/Produto</th>
                            <th className="p-4 text-center">Saldo Atual</th>
                            <th className="p-4 w-40 text-center">Qtd. Devolver</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                         {clientBatches.map(batch => {
                            const isSelected = selectedItems[batch.batchId] !== undefined;
                            return (
                               <tr key={batch.batchId} className={`transition-colors ${isSelected ? 'bg-blue-50/50' : 'hover:bg-gray-50'}`}>
                                  <td className="p-4 text-center">
                                     <button 
                                        type="button"
                                        onClick={() => toggleSelection(batch)}
                                        className={`transition-colors ${isSelected ? 'text-blue-600' : 'text-gray-300 hover:text-gray-400'}`}
                                     >
                                        {isSelected ? <CheckSquare size={24} /> : <Square size={24} />}
                                     </button>
                                  </td>
                                  <td className="p-4 font-mono font-bold text-gray-600">{batch.batchId}</td>
                                  <td className="p-4 font-bold text-gray-800">{batch.productName}</td>
                                  <td className="p-4 text-center font-mono">{batch.remainingQuantity}</td>
                                  <td className="p-4">
                                     {isSelected && (
                                        <input 
                                           type="number"
                                           value={selectedItems[batch.batchId]}
                                           onChange={(e) => handleQuantityChange(batch.batchId, parseFloat(e.target.value))}
                                           className="w-full p-2 border border-blue-300 rounded text-center font-bold text-blue-900 focus:ring-2 focus:ring-blue-500 outline-none"
                                           max={batch.remainingQuantity}
                                           min={0}
                                        />
                                     )}
                                  </td>
                               </tr>
                            );
                         })}
                      </tbody>
                   </table>
                </div>
             </div>
           )}

           <div className="pt-4 border-t border-gray-100 flex justify-end">
              <button 
                type="submit" 
                disabled={Object.keys(selectedItems).length === 0}
                className={`px-8 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg transition-all
                   ${Object.keys(selectedItems).length === 0 
                     ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                     : 'bg-blue-600 hover:bg-blue-700 text-white transform hover:scale-105'}
                `}
              >
                 <Save size={20} />
                 CONFIRMAR DEVOLUÇÃO
              </button>
           </div>

        </form>
      </div>
    </div>
  );
};

export default MoReturnForm;
