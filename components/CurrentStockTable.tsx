
import React, { useMemo, useState } from 'react';
import { InventoryItem, ProductAnalysis } from '../types';
import { Search, PackageCheck, MessageSquareText, X } from 'lucide-react';

interface CurrentStockTableProps {
  items: InventoryItem[];
  analyses: ProductAnalysis[];
}

const CurrentStockTable: React.FC<CurrentStockTableProps> = ({ items, analyses }) => {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [obsModal, setObsModal] = useState<{isOpen: boolean; text: string; title: string}>({
    isOpen: false,
    text: '',
    title: ''
  });

  const stockData = useMemo(() => {
    // Group by Batch ID instead of Product Code to allow specific batch tracking
    const grouped: Record<string, {
      batchId: string;
      productName: string;
      productCode: string;
      totalQuantity: number;
      unitCost: number;
      observations: string;
    }> = {};

    items.forEach(item => {
      // Use batchId as key. If missing (legacy data), fallback to productCode or a generic placeholder
      const key = item.batchId || `UNKNOWN-${item.productCode}`;
      
      if (!grouped[key]) {
        grouped[key] = {
          batchId: item.batchId || '-',
          productName: item.productName,
          productCode: item.productCode,
          totalQuantity: 0,
          unitCost: 0,
          observations: '',
        };
      }

      const isEntry = !!item.entryDate;
      const isExit = !!item.exitDate && !item.entryDate;

      if (isEntry) {
        grouped[key].totalQuantity += item.quantity;
        grouped[key].unitCost = item.unitCost; // Entry defines the cost
        // Capture observation from the entry movement
        if (item.observations) {
            grouped[key].observations = item.observations;
        }
      } else if (isExit) {
        grouped[key].totalQuantity -= item.quantity;
      }
    });

    return Object.values(grouped)
      .filter(group => group.totalQuantity > 0.0001) // Filter out zero or negative stock (floating point tolerance)
      .map(group => {
         // Calculate Estimated Value: Current Qty * Unit Cost from Entry
         const estimatedValue = group.totalQuantity * group.unitCost;

         // Find analysis based on Batch ID first, fallback to Product Code if necessary (or just Batch ID as per requirement)
         // Supporting legacy productCode based analysis if batchId match fails might be good, but prompt implies specific batch analysis.
         // Let's prioritize batchId.
         const analysis = analyses.find(a => a.batchId === group.batchId) || analyses.find(a => !a.batchId && a.productCode === group.productCode);

         return {
           ...group,
           totalValue: estimatedValue,
           analysis: analysis || { cu:0, zn:0, mn:0, b:0, pb:0, cd:0, h2o:0, mesh35:0, ret:0 }
         };
      }).sort((a, b) => a.productName.localeCompare(b.productName));

  }, [items, analyses]);

  const filteredStock = stockData.filter(item => 
    item.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.productCode.includes(searchTerm) ||
    item.batchId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Helper to format percentage/ppm
  const fmt = (val: number, isPpm = false) => {
    if (val === undefined || val === null) return '-';
    return isPpm ? `${val}` : `${val}%`;
  };

  return (
    <div className="p-8 h-screen flex flex-col relative">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-green-900 flex items-center gap-3">
          <PackageCheck size={28} />
          Estoque Atual
        </h2>
      </div>

      <div className="bg-white rounded-xl shadow-lg border border-gray-200 flex-1 flex flex-col overflow-hidden">
        {/* Search Bar */}
        <div className="p-4 border-b border-gray-200 flex items-center gap-3 bg-white">
          <Search className="text-gray-400" />
          <input 
            type="text" 
            placeholder="Buscar por produto, código ou lote..." 
            className="bg-green-50 outline-none flex-1 text-gray-700 p-2 rounded border border-green-100 placeholder-gray-400"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Table Header */}
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead className="bg-emerald-800 text-white sticky top-0 z-10">
              <tr>
                <th className="p-3 font-semibold text-xs uppercase tracking-wider">Cód.</th>
                <th className="p-3 font-semibold text-xs uppercase tracking-wider">Lote</th>
                <th className="p-3 font-semibold text-xs uppercase tracking-wider">Produto</th>
                <th className="p-3 font-semibold text-xs uppercase tracking-wider text-center">Saldo (Kg)</th>
                <th className="p-3 font-semibold text-xs uppercase tracking-wider text-right">V. Estimado</th>
                
                {/* Analysis Columns */}
                <th className="p-3 font-semibold text-xs uppercase tracking-wider text-center bg-emerald-900 border-l border-emerald-700">Cu (%)</th>
                <th className="p-3 font-semibold text-xs uppercase tracking-wider text-center bg-emerald-900">Zn (%)</th>
                <th className="p-3 font-semibold text-xs uppercase tracking-wider text-center bg-emerald-900">Mn (%)</th>
                <th className="p-3 font-semibold text-xs uppercase tracking-wider text-center bg-emerald-900">B (%)</th>
                <th className="p-3 font-semibold text-xs uppercase tracking-wider text-center bg-emerald-900">Pb (%)</th>
                <th className="p-3 font-semibold text-xs uppercase tracking-wider text-center bg-emerald-900">Cd (ppm)</th>
                <th className="p-3 font-semibold text-xs uppercase tracking-wider text-center bg-emerald-900">H2O (%)</th>
                <th className="p-3 font-semibold text-xs uppercase tracking-wider text-center bg-emerald-900">#35 (%)</th>
                <th className="p-3 font-semibold text-xs uppercase tracking-wider text-center bg-emerald-900">Ret. (%)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredStock.length === 0 ? (
                <tr>
                  <td colSpan={14} className="p-8 text-center text-gray-400">Nenhum produto em estoque.</td>
                </tr>
              ) : (
                filteredStock.map((item) => (
                  <tr key={item.batchId} className="hover:bg-green-50 transition-colors group">
                    <td className="p-3 text-sm font-mono text-gray-500">{item.productCode}</td>
                    <td className="p-3 text-sm font-mono font-bold text-green-700">{item.batchId}</td>
                    <td className="p-3 text-sm text-gray-800 font-bold flex items-center gap-2">
                      {item.productName}
                      {item.observations && (
                        <button 
                          onClick={() => setObsModal({ isOpen: true, text: item.observations, title: `Obs: ${item.productName} (${item.batchId})` })}
                          className="text-blue-500 hover:text-blue-700 hover:bg-blue-100 p-1 rounded-full transition-colors"
                          title="Ver Observações"
                        >
                          <MessageSquareText size={16} />
                        </button>
                      )}
                    </td>
                    <td className="p-3 text-center">
                        <span className={`px-2 py-1 rounded text-sm font-bold ${item.totalQuantity > 0 ? 'text-green-800' : 'text-red-800'}`}>
                           {item.totalQuantity.toLocaleString('pt-BR', { minimumFractionDigits: 3, maximumFractionDigits: 3 })}
                        </span>
                    </td>
                    <td className="p-3 text-sm text-right font-medium text-gray-700">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.totalValue)}
                    </td>
                    
                    {/* Analysis Data */}
                    <td className="p-3 text-xs text-center border-l border-gray-100">{fmt(item.analysis.cu)}</td>
                    <td className="p-3 text-xs text-center">{fmt(item.analysis.zn)}</td>
                    <td className="p-3 text-xs text-center">{fmt(item.analysis.mn)}</td>
                    <td className="p-3 text-xs text-center">{fmt(item.analysis.b)}</td>
                    <td className="p-3 text-xs text-center">{fmt(item.analysis.pb)}</td>
                    <td className="p-3 text-xs text-center">{fmt(item.analysis.cd, true)}</td>
                    <td className="p-3 text-xs text-center">{fmt(item.analysis.h2o)}</td>
                    <td className="p-3 text-xs text-center">{fmt(item.analysis.mesh35)}</td>
                    <td className="p-3 text-xs text-center">{fmt(item.analysis.ret)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Observation Modal */}
      {obsModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-green-900 p-4 text-white flex justify-between items-center">
               <h3 className="font-bold text-sm uppercase tracking-wide">{obsModal.title}</h3>
               <button onClick={() => setObsModal(prev => ({...prev, isOpen: false}))} className="text-white/70 hover:text-white transition">
                  <X size={20} />
               </button>
            </div>
            <div className="p-6">
               <p className="text-gray-700 whitespace-pre-wrap leading-relaxed bg-gray-50 p-4 rounded-lg border border-gray-100 text-sm">
                  {obsModal.text}
               </p>
               <div className="mt-6 flex justify-end">
                 <button 
                    onClick={() => setObsModal(prev => ({...prev, isOpen: false}))}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-lg transition"
                 >
                    Fechar
                 </button>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CurrentStockTable;
