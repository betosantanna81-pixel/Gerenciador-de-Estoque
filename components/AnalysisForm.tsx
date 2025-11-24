
import React, { useState, useEffect, useMemo } from 'react';
import { InventoryItem, ProductAnalysis } from '../types';
import { Save, Search } from 'lucide-react';

interface AnalysisFormProps {
  items: InventoryItem[];
  currentAnalyses: ProductAnalysis[];
  onSave: (analysis: ProductAnalysis) => void;
}

const AnalysisForm: React.FC<AnalysisFormProps> = ({ items, currentAnalyses, onSave }) => {
  // Get unique batches from entries
  const availableBatches = useMemo(() => {
    const unique = new Map<string, InventoryItem>();
    items.forEach(item => {
      // Only consider entries that have a valid batch ID
      if (item.entryDate && item.batchId) {
        if (!unique.has(item.batchId)) {
          unique.set(item.batchId, item);
        }
      }
    });
    return Array.from(unique.values()).sort((a, b) => a.batchId.localeCompare(b.batchId));
  }, [items]);

  const [selectedBatchId, setSelectedBatchId] = useState('');
  
  const [formData, setFormData] = useState<ProductAnalysis>({
    batchId: '',
    productCode: '',
    cu: 0,
    zn: 0,
    mn: 0,
    b: 0,
    pb: 0,
    cd: 0,
    h2o: 0,
    mesh35: 0,
    ret: 0
  });

  useEffect(() => {
    if (selectedBatchId) {
      // Find existing analysis by batchId
      const existing = currentAnalyses.find(a => a.batchId === selectedBatchId);
      
      // Find batch details to populate productCode if new
      const batchItem = availableBatches.find(b => b.batchId === selectedBatchId);
      
      if (existing) {
        setFormData(existing);
      } else {
        setFormData({
            batchId: selectedBatchId,
            productCode: batchItem?.productCode || '',
            cu: 0, zn: 0, mn: 0, b: 0, pb: 0, cd: 0, h2o: 0, mesh35: 0, ret: 0
        });
      }
    }
  }, [selectedBatchId, currentAnalyses, availableBatches]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBatchId) return;
    
    onSave({ ...formData, batchId: selectedBatchId });
    alert('Análise salva com sucesso!');
  };

  const inputClass = "w-full p-2 border border-yellow-300 rounded focus:ring-2 focus:ring-yellow-500 outline-none text-gray-800 bg-yellow-50";

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-green-900 mb-6 flex items-center gap-2">
        <Search size={24} />
        Registro de Análises Químicas
      </h2>
      
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <form onSubmit={handleSubmit}>
          
          <div className="mb-6">
            <label className="block text-sm font-bold text-gray-700 mb-2">Selecione o Produto (Lote)</label>
            <select 
              className="w-full p-3 border border-yellow-300 rounded-lg bg-yellow-50 focus:ring-2 focus:ring-yellow-500 outline-none text-gray-800"
              value={selectedBatchId}
              onChange={(e) => setSelectedBatchId(e.target.value)}
              required
            >
              <option value="">-- Selecione o Lote --</option>
              {availableBatches.map((item) => (
                <option key={item.batchId} value={item.batchId}>
                   {item.batchId} | {item.supplier} | {item.productName}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-400 mt-1 ml-1">Formato: Lote | Fornecedor | Produto</p>
          </div>

          {selectedBatchId && (
            <>
              <div className="p-4 border border-yellow-200 rounded-xl bg-yellow-50/50 mb-6">
                 <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  {[
                    { label: "Cu (%)", name: "cu" },
                    { label: "Zn (%)", name: "zn" },
                    { label: "Mn (%)", name: "mn" },
                    { label: "B (%)", name: "b" },
                    { label: "Pb (%)", name: "pb" },
                    { label: "Cd (ppm)", name: "cd" },
                    { label: "H2O (%)", name: "h2o" },
                    { label: "#35 (%)", name: "mesh35" },
                    { label: "Ret. (%)", name: "ret" },
                  ].map(field => (
                    <div key={field.name}>
                      <label className="block text-xs font-bold text-gray-600 mb-1">{field.label}</label>
                      <input 
                        type="number" 
                        step="0.001" 
                        name={field.name}
                        value={(formData as any)[field.name]}
                        onChange={handleChange}
                        className={inputClass}
                      />
                    </div>
                  ))}
                 </div>
              </div>

              <button 
                type="submit" 
                className="w-full bg-yellow-400 hover:bg-yellow-500 text-yellow-950 font-bold py-3 rounded-lg flex items-center justify-center gap-2 shadow-md transition-colors"
              >
                <Save size={18} />
                Salvar Análise
              </button>
            </>
          )}

          {!selectedBatchId && (
            <div className="text-center py-10 text-gray-400 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                Selecione um lote acima para lançar os resultados da análise.
            </div>
          )}

        </form>
      </div>
    </div>
  );
};

export default AnalysisForm;
