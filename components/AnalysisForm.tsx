
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
    cu_ar: 0, zn_ar: 0,
    cu_hcl: 0, zn_hcl: 0, mn: 0, b: 0,
    cu_2: 0, zn_2: 0, mn_2: 0, b_2: 0,
    pb: 0, fe: 0, cd: 0,
    h2o: 0, mesh35: 0, ret: 0
  });

  useEffect(() => {
    if (selectedBatchId) {
      // Find existing analysis by batchId
      const existing = currentAnalyses.find(a => a.batchId === selectedBatchId);
      
      // Find batch details to populate productCode if new
      const batchItem = availableBatches.find(b => b.batchId === selectedBatchId);
      
      if (existing) {
        setFormData({
            ...existing,
            // Ensure all new fields have defaults if loading old record
            cu_ar: (existing as any).cu_ar || 0,
            zn_ar: (existing as any).zn_ar || 0,
            cu_hcl: (existing as any).cu_hcl || 0,
            zn_hcl: (existing as any).zn_hcl || 0,
            cu_2: (existing as any).cu_2 || 0,
            zn_2: (existing as any).zn_2 || 0,
            mn_2: (existing as any).mn_2 || 0,
            b_2: (existing as any).b_2 || 0,
        });
      } else {
        setFormData({
            batchId: selectedBatchId,
            productCode: batchItem?.productCode || '',
            cu_ar: 0, zn_ar: 0,
            cu_hcl: 0, zn_hcl: 0, mn: 0, b: 0,
            cu_2: 0, zn_2: 0, mn_2: 0, b_2: 0,
            pb: 0, fe: 0, cd: 0,
            h2o: 0, mesh35: 0, ret: 0
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

  const inputClass = "w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 outline-none text-gray-800 text-sm";
  const groupLabelClass = "block text-xs font-bold uppercase tracking-wider mb-3 pb-1 border-b-2";

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h2 className="text-2xl font-bold text-green-900 mb-6 flex items-center gap-2">
        <Search size={24} />
        Registro de Análises Químicas
      </h2>
      
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <form onSubmit={handleSubmit}>
          
          <div className="mb-8">
            <label className="block text-sm font-bold text-gray-700 mb-2">Selecione o Produto (Lote)</label>
            <select 
              className="w-full p-3 border border-green-300 rounded-lg bg-green-50 focus:ring-2 focus:ring-green-500 outline-none text-gray-800"
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
          </div>

          {selectedBatchId && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
                 
                 {/* Agua Regia */}
                 <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                    <label className={`${groupLabelClass} text-orange-800 border-orange-200`}>Água Régia</label>
                    <div className="space-y-3">
                        <div>
                            <label className="block text-xs font-bold text-gray-600 mb-1">Cu (%) AR</label>
                            <input type="number" step="0.001" name="cu_ar" value={formData.cu_ar} onChange={handleChange} className={inputClass} />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-600 mb-1">Zn (%) AR</label>
                            <input type="number" step="0.001" name="zn_ar" value={formData.zn_ar} onChange={handleChange} className={inputClass} />
                        </div>
                    </div>
                 </div>

                 {/* HCL */}
                 <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                    <label className={`${groupLabelClass} text-yellow-800 border-yellow-200`}>HCL</label>
                    <div className="space-y-3">
                        <div>
                            <label className="block text-xs font-bold text-gray-600 mb-1">Cu (%) HCL</label>
                            <input type="number" step="0.001" name="cu_hcl" value={formData.cu_hcl} onChange={handleChange} className={inputClass} />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-600 mb-1">Zn (%) HCL</label>
                            <input type="number" step="0.001" name="zn_hcl" value={formData.zn_hcl} onChange={handleChange} className={inputClass} />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-600 mb-1">Mn (%)</label>
                            <input type="number" step="0.001" name="mn" value={formData.mn} onChange={handleChange} className={inputClass} />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-600 mb-1">B (%)</label>
                            <input type="number" step="0.001" name="b" value={formData.b} onChange={handleChange} className={inputClass} />
                        </div>
                    </div>
                 </div>

                 {/* 2 Extrator */}
                 <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <label className={`${groupLabelClass} text-blue-800 border-blue-200`}>2º Extrator</label>
                    <div className="space-y-3">
                        <div>
                            <label className="block text-xs font-bold text-gray-600 mb-1">Cu (%) 2</label>
                            <input type="number" step="0.001" name="cu_2" value={formData.cu_2} onChange={handleChange} className={inputClass} />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-600 mb-1">Zn (%) 2</label>
                            <input type="number" step="0.001" name="zn_2" value={formData.zn_2} onChange={handleChange} className={inputClass} />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-600 mb-1">Mn (%) 2</label>
                            <input type="number" step="0.001" name="mn_2" value={formData.mn_2} onChange={handleChange} className={inputClass} />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-600 mb-1">B (%) 2</label>
                            <input type="number" step="0.001" name="b_2" value={formData.b_2} onChange={handleChange} className={inputClass} />
                        </div>
                    </div>
                 </div>

                 {/* Contaminantes */}
                 <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                    <label className={`${groupLabelClass} text-red-800 border-red-200`}>Contaminantes</label>
                    <div className="space-y-3">
                        <div>
                            <label className="block text-xs font-bold text-gray-600 mb-1">Pb (%)</label>
                            <input type="number" step="0.001" name="pb" value={formData.pb} onChange={handleChange} className={inputClass} />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-600 mb-1">Fe (%)</label>
                            <input type="number" step="0.001" name="fe" value={formData.fe} onChange={handleChange} className={inputClass} />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-600 mb-1">Cd (ppm)</label>
                            <input type="number" step="0.001" name="cd" value={formData.cd} onChange={handleChange} className={inputClass} />
                        </div>
                    </div>
                 </div>

                 {/* Outros */}
                 <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                    <label className={`${groupLabelClass} text-purple-800 border-purple-200`}>Outros</label>
                    <div className="space-y-3">
                        <div>
                            <label className="block text-xs font-bold text-gray-600 mb-1">H2O (%)</label>
                            <input type="number" step="0.001" name="h2o" value={formData.h2o} onChange={handleChange} className={inputClass} />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-600 mb-1">#35 (%)</label>
                            <input type="number" step="0.001" name="mesh35" value={formData.mesh35} onChange={handleChange} className={inputClass} />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-600 mb-1">Ret. (%)</label>
                            <input type="number" step="0.001" name="ret" value={formData.ret} onChange={handleChange} className={inputClass} />
                        </div>
                    </div>
                 </div>

              </div>

              <button 
                type="submit" 
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 shadow-md transition-colors uppercase tracking-wide"
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
