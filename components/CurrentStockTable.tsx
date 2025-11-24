
import React, { useMemo, useState } from 'react';
import { InventoryItem, ProductAnalysis } from '../types';
import { Search, PackageCheck, MessageSquareText, X, Filter, XCircle, Printer } from 'lucide-react';

interface CurrentStockTableProps {
  items: InventoryItem[];
  analyses: ProductAnalysis[];
}

const CurrentStockTable: React.FC<CurrentStockTableProps> = ({ items, analyses }) => {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [filterType, setFilterType] = useState<'none' | 'supplier' | 'product'>('none');
  const [filterValue, setFilterValue] = useState('');

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
      supplier: string; // Add supplier tracking for filtering
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
          supplier: '', // Initialize empty
        };
      }

      const isEntry = !!item.entryDate;
      const isExit = !!item.exitDate && !item.entryDate;

      if (isEntry) {
        grouped[key].totalQuantity += item.quantity;
        grouped[key].unitCost = item.unitCost; // Entry defines the cost
        grouped[key].supplier = item.supplier; // Capture supplier from entry
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
         const analysis = analyses.find(a => a.batchId === group.batchId) || analyses.find(a => !a.batchId && a.productCode === group.productCode);
         
         // Ensure default includes 'fe'
         const safeAnalysis = analysis 
            ? { ...analysis, fe: (analysis as any).fe || 0 }
            : { cu:0, zn:0, mn:0, b:0, pb:0, fe:0, cd:0, h2o:0, mesh35:0, ret:0 };

         return {
           ...group,
           totalValue: estimatedValue,
           analysis: safeAnalysis
         };
      }).sort((a, b) => a.productName.localeCompare(b.productName));

  }, [items, analyses]);

  // Extract unique values for filters based on current stock
  const uniqueSuppliers = useMemo(() => 
    Array.from(new Set(stockData.map(i => i.supplier))).filter(Boolean).sort(), 
  [stockData]);

  const uniqueProducts = useMemo(() => 
    Array.from(new Set(stockData.map(i => i.productName))).filter(Boolean).sort(), 
  [stockData]);

  const filteredStock = stockData.filter(item => {
    // 1. Text Search Match
    const matchesSearch = 
      searchTerm === '' ||
      item.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.productCode.includes(searchTerm) ||
      item.batchId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.supplier.toLowerCase().includes(searchTerm.toLowerCase());
    
    // 2. Category Filter Match
    let matchesFilter = true;
    if (filterType === 'supplier' && filterValue) {
      matchesFilter = item.supplier === filterValue;
    } else if (filterType === 'product' && filterValue) {
      matchesFilter = item.productName === filterValue;
    }

    return matchesSearch && matchesFilter;
  });

  const handleFilterTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilterType(e.target.value as any);
    setFilterValue(''); // Reset value when type changes
  };

  const clearFilters = () => {
    setFilterType('none');
    setFilterValue('');
    setSearchTerm('');
  };

  const handlePrint = () => {
    window.print();
  };

  // Helper to format percentage/ppm
  const fmt = (val: number | undefined, isPpm = false) => {
    if (val === undefined || val === null) return '-';
    return isPpm ? `${val}` : `${val}%`;
  };

  return (
    <div className="p-8 h-screen flex flex-col relative print:p-0 print:h-auto">
      {/* Print Styles */}
      <style>{`
        @media print {
          @page {
            size: landscape;
            margin: 5mm;
          }
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            background-color: white !important;
          }
          /* Hide Sidebar */
          .fixed.left-0 {
            display: none !important;
          }
          /* Reset Main Content Layout */
          main {
            margin-left: 0 !important;
            padding: 0 !important;
            width: 100% !important;
          }
          /* Hide Non-printable Elements */
          .no-print {
            display: none !important;
          }
          /* Remove Shadows/Borders for clean print */
          .shadow-lg {
            box-shadow: none !important;
          }
          .border {
            border: none !important;
          }
          .rounded-xl, .rounded-lg {
            border-radius: 0 !important;
          }
          /* Adjust Containers */
          .h-screen {
            height: auto !important;
          }
          .overflow-hidden {
            overflow: visible !important;
          }
          .overflow-x-auto {
            overflow: visible !important;
          }
          /* Table Styling */
          table {
            width: 100% !important;
            border-collapse: collapse;
            font-size: 10px;
          }
          thead th {
            background-color: #064e3b !important;
            color: white !important;
            border: 1px solid #000;
            padding: 4px !important;
          }
          tbody td {
            border: 1px solid #ccc;
            padding: 4px !important;
          }
          tbody tr:nth-child(even) {
            background-color: #f0fdf4 !important;
          }
        }
      `}</style>

      <div className="flex justify-between items-center mb-6 print:mb-2">
        <h2 className="text-2xl font-bold text-green-900 flex items-center gap-3">
          <PackageCheck size={28} />
          Estoque Atual
        </h2>

        <button 
          onClick={handlePrint}
          className="no-print flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-6 rounded-lg shadow-md transition-all uppercase text-xs tracking-wider"
        >
          <Printer size={18} />
          Imprimir
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-lg border border-gray-200 flex-1 flex flex-col overflow-hidden print:border-none print:shadow-none print:overflow-visible">
        {/* Controls Bar */}
        <div className="p-4 border-b border-gray-200 flex flex-col md:flex-row items-start md:items-center gap-4 bg-white no-print">
          
          {/* Filter Controls */}
          <div className="flex items-center gap-2 bg-green-50 p-2 rounded-lg border border-green-100">
              <div className="flex items-center gap-2 text-green-800 font-bold px-2">
                <Filter size={18} />
                <span className="text-sm uppercase tracking-wide">Filtrar:</span>
              </div>
              
              <select 
                value={filterType}
                onChange={handleFilterTypeChange}
                className="bg-white border border-green-200 text-gray-700 text-sm rounded-md p-2 outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="none">Todos</option>
                <option value="supplier">Por Fornecedor</option>
                <option value="product">Por Produto</option>
              </select>

              {filterType !== 'none' && (
                <select
                  value={filterValue}
                  onChange={(e) => setFilterValue(e.target.value)}
                  className="bg-white border border-green-200 text-gray-700 text-sm rounded-md p-2 outline-none focus:ring-2 focus:ring-green-500 min-w-[200px]"
                >
                  <option value="">-- Selecione --</option>
                  {filterType === 'supplier' && uniqueSuppliers.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                  {filterType === 'product' && uniqueProducts.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              )}

              {(filterType !== 'none' || searchTerm) && (
                <button 
                  onClick={clearFilters}
                  className="ml-2 text-red-500 hover:text-red-700 hover:bg-red-50 p-1 rounded transition"
                  title="Limpar Filtros"
                >
                  <XCircle size={20} />
                </button>
              )}
            </div>

            {/* Search Bar */}
            <div className="flex-1 w-full md:w-auto flex items-center gap-3 bg-gray-50 p-2 rounded-lg border border-gray-200 px-4">
              <Search className="text-gray-400" size={20} />
              <input 
                type="text" 
                placeholder="Buscar por produto, código, lote ou fornecedor..." 
                className="bg-transparent outline-none flex-1 text-gray-700 placeholder-gray-400"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
        </div>

        {/* Table Header */}
        <div className="overflow-x-auto flex-1 print:overflow-visible">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead className="bg-emerald-800 text-white sticky top-0 z-10 print:static">
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
                <th className="p-3 font-semibold text-xs uppercase tracking-wider text-center bg-emerald-900">Fe (%)</th>
                <th className="p-3 font-semibold text-xs uppercase tracking-wider text-center bg-emerald-900">Cd (ppm)</th>
                <th className="p-3 font-semibold text-xs uppercase tracking-wider text-center bg-emerald-900">H2O (%)</th>
                <th className="p-3 font-semibold text-xs uppercase tracking-wider text-center bg-emerald-900">#35 (%)</th>
                <th className="p-3 font-semibold text-xs uppercase tracking-wider text-center bg-emerald-900">Ret. (%)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredStock.length === 0 ? (
                <tr>
                  <td colSpan={15} className="p-8 text-center text-gray-400">Nenhum produto em estoque correspondente.</td>
                </tr>
              ) : (
                filteredStock.map((item) => (
                  <tr key={item.batchId} className="hover:bg-green-50 transition-colors group">
                    <td className="p-3 text-sm font-mono text-gray-500">{item.productCode}</td>
                    <td className="p-3 text-sm font-mono font-bold text-green-700">{item.batchId}</td>
                    <td className="p-3 text-sm text-gray-800 font-bold flex items-center gap-2">
                      {item.productName}
                      {item.supplier && (
                        <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded border border-gray-200 print:hidden">
                           {item.supplier}
                        </span>
                      )}
                      {item.supplier && (
                         // Visible only on print to ensure supplier name is readable
                         <span className="hidden print:inline text-[10px] text-gray-500 ml-1">({item.supplier})</span>
                      )}
                      {item.observations && (
                        <button 
                          onClick={() => setObsModal({ isOpen: true, text: item.observations, title: `Obs: ${item.productName} (${item.batchId})` })}
                          className="text-blue-500 hover:text-blue-700 hover:bg-blue-100 p-1 rounded-full transition-colors no-print"
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
                    <td className="p-3 text-xs text-center">{fmt(item.analysis.fe)}</td>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 no-print">
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
