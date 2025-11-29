
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
    // Group by Batch ID
    const grouped: Record<string, {
      batchId: string;
      productName: string;
      productCode: string;
      totalQuantity: number;
      unitCost: number;
      observations: string;
      supplier: string;
    }> = {};

    items.forEach(item => {
      const key = item.batchId || `UNKNOWN-${item.productCode}`;
      
      if (!grouped[key]) {
        grouped[key] = {
          batchId: item.batchId || '-',
          productName: item.productName,
          productCode: item.productCode,
          totalQuantity: 0,
          unitCost: 0,
          observations: '',
          supplier: '',
        };
      }

      const isEntry = !!item.entryDate;
      const isExit = !!item.exitDate && !item.entryDate;

      if (isEntry) {
        grouped[key].totalQuantity += item.quantity;
        grouped[key].unitCost = item.unitCost;
        grouped[key].supplier = item.supplier;
        if (item.observations) {
            grouped[key].observations = item.observations;
        }
      } else if (isExit) {
        grouped[key].totalQuantity -= item.quantity;
      }
    });

    return Object.values(grouped)
      .filter(group => group.totalQuantity > 0.0001)
      .map(group => {
         const estimatedValue = group.totalQuantity * group.unitCost;
         const analysis = analyses.find(a => a.batchId === group.batchId) || analyses.find(a => !a.batchId && a.productCode === group.productCode);
         
         const safeAnalysis = analysis 
            ? { ...analysis }
            : { cu_ar:0, zn_ar:0, cu_hcl:0, zn_hcl:0, mn:0, b:0, cu_2:0, zn_2:0, mn_2:0, b_2:0, pb:0, fe:0, cd:0, h2o:0, mesh35:0, ret:0 };

         return {
           ...group,
           totalValue: estimatedValue,
           analysis: safeAnalysis
         };
      }).sort((a, b) => a.productName.localeCompare(b.productName));

  }, [items, analyses]);

  // Filters
  const uniqueSuppliers = useMemo(() => 
    Array.from(new Set(stockData.map(i => i.supplier))).filter(Boolean).sort(), 
  [stockData]);

  const uniqueProducts = useMemo(() => 
    Array.from(new Set(stockData.map(i => i.productName))).filter(Boolean).sort(), 
  [stockData]);

  const filteredStock = stockData.filter(item => {
    const matchesSearch = 
      searchTerm === '' ||
      item.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.productCode.includes(searchTerm) ||
      item.batchId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.supplier.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesFilter = true;
    if (filterType === 'supplier' && filterValue) {
      matchesFilter = item.supplier === filterValue;
    } else if (filterType === 'product' && filterValue) {
      matchesFilter = item.productName === filterValue;
    }

    return matchesSearch && matchesFilter;
  });

  const totalStockQuantity = useMemo(() => 
    filteredStock.reduce((acc, item) => acc + item.totalQuantity, 0),
  [filteredStock]);

  const totalStockValue = useMemo(() => 
    filteredStock.reduce((acc, item) => acc + item.totalValue, 0),
  [filteredStock]);

  const handleFilterTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilterType(e.target.value as any);
    setFilterValue('');
  };

  const clearFilters = () => {
    setFilterType('none');
    setFilterValue('');
    setSearchTerm('');
  };

  const handlePrint = () => {
    window.print();
  };

  // Helper to format
  const fmt = (val: number | undefined | null, isPpm = false) => {
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
          .fixed.left-0, .no-print {
            display: none !important;
          }
          main {
            margin-left: 0 !important;
            padding: 0 !important;
            width: 100% !important;
          }
          .shadow-lg { box-shadow: none !important; }
          .border { border: none !important; }
          .rounded-xl, .rounded-lg { border-radius: 0 !important; }
          .h-screen { height: auto !important; }
          .overflow-hidden { overflow: visible !important; }
          .overflow-x-auto { overflow: visible !important; }
          table {
            width: 100% !important;
            border-collapse: collapse;
            font-size: 9px; 
          }
          thead th {
            color: white !important;
            border: 1px solid #000;
            padding: 4px !important;
            text-align: center;
          }
          tbody td {
            border: 1px solid #ccc;
            padding: 2px !important;
            text-align: center;
          }
          tbody td.text-left { text-align: left; }
          tbody td.text-right { text-align: right; }
          tbody tr:nth-child(even) { background-color: #f0fdf4 !important; }
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
        <div className="p-4 border-b border-gray-200 flex flex-col gap-4 bg-white no-print">
          
          <div className="flex flex-col md:flex-row items-center gap-4">
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

          <div className="flex flex-col md:flex-row items-center gap-6 pt-1">
             <div className="flex items-center gap-2 text-sm bg-green-50 px-4 py-2 rounded-lg border border-green-100 shadow-sm w-full md:w-auto">
                <span className="text-gray-500 uppercase font-bold text-xs">Quantidade Total:</span>
                <span className="font-mono font-bold text-green-700 text-lg">
                  {totalStockQuantity.toLocaleString('pt-BR', { minimumFractionDigits: 3 })} Kg
                </span>
             </div>
             <div className="flex items-center gap-2 text-sm bg-green-50 px-4 py-2 rounded-lg border border-green-100 shadow-sm w-full md:w-auto">
                <span className="text-gray-500 uppercase font-bold text-xs">Valor Total:</span>
                <span className="font-mono font-bold text-green-700 text-lg">
                  {totalStockValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
             </div>
          </div>

        </div>

        {/* Table Header */}
        <div className="overflow-x-auto flex-1 print:overflow-visible">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead className="text-white sticky top-0 z-10 print:static text-[10px] md:text-xs">
              {/* Group Headers */}
              <tr>
                <th colSpan={6} className="bg-green-800 p-2 border border-green-900 text-center uppercase tracking-widest font-bold">INFORMAÇÕES GERAIS</th>
                <th colSpan={2} className="bg-orange-500 p-2 border border-orange-600 text-center uppercase tracking-widest font-bold">Água Régia</th>
                <th colSpan={4} className="bg-yellow-500 p-2 border border-yellow-600 text-center text-yellow-900 uppercase tracking-widest font-bold">HCL</th>
                <th colSpan={4} className="bg-blue-300 p-2 border border-blue-400 text-center text-blue-900 uppercase tracking-widest font-bold">2º Extrator</th>
                <th colSpan={3} className="bg-red-600 p-2 border border-red-700 text-center uppercase tracking-widest font-bold">Contaminantes</th>
                <th colSpan={3} className="bg-purple-300 p-2 border border-purple-400 text-center text-purple-900 uppercase tracking-widest font-bold">Outros</th>
                <th className="bg-gray-700 p-2 border border-gray-800 text-center"></th>
              </tr>
              {/* Column Headers */}
              <tr className="bg-emerald-900">
                <th className="p-2 font-semibold border-r border-emerald-800">Lote</th>
                <th className="p-2 font-semibold border-r border-emerald-800">Produto</th>
                <th className="p-2 font-semibold border-r border-emerald-800">Código</th>
                <th className="p-2 font-semibold border-r border-emerald-800">Fornecedor</th>
                <th className="p-2 font-semibold text-center border-r border-emerald-800">Saldo (Kg)</th>
                <th className="p-2 font-semibold text-right border-r border-emerald-800">V. Estimado</th>
                
                {/* Agua Regia */}
                <th className="p-2 font-semibold text-center bg-orange-600 border-r border-orange-700">Cu (%) AR</th>
                <th className="p-2 font-semibold text-center bg-orange-600 border-r border-orange-700">Zn (%) AR</th>

                {/* HCL */}
                <th className="p-2 font-semibold text-center bg-yellow-600 border-r border-yellow-700">Cu (%) HCL</th>
                <th className="p-2 font-semibold text-center bg-yellow-600 border-r border-yellow-700">Zn (%) HCL</th>
                <th className="p-2 font-semibold text-center bg-yellow-600 border-r border-yellow-700">Mn (%)</th>
                <th className="p-2 font-semibold text-center bg-yellow-600 border-r border-yellow-700">B (%)</th>

                {/* 2 Extrator */}
                <th className="p-2 font-semibold text-center bg-blue-400 border-r border-blue-500">Cu (%) 2</th>
                <th className="p-2 font-semibold text-center bg-blue-400 border-r border-blue-500">Zn (%) 2</th>
                <th className="p-2 font-semibold text-center bg-blue-400 border-r border-blue-500">Mn (%) 2</th>
                <th className="p-2 font-semibold text-center bg-blue-400 border-r border-blue-500">B (%) 2</th>

                {/* Contaminantes */}
                <th className="p-2 font-semibold text-center bg-red-700 border-r border-red-800">Pb (%)</th>
                <th className="p-2 font-semibold text-center bg-red-700 border-r border-red-800">Fe (%)</th>
                <th className="p-2 font-semibold text-center bg-red-700 border-r border-red-800">Cd (ppm)</th>

                {/* Outros */}
                <th className="p-2 font-semibold text-center bg-purple-400 border-r border-purple-500">H2O (%)</th>
                <th className="p-2 font-semibold text-center bg-purple-400 border-r border-purple-500">#35 (%)</th>
                <th className="p-2 font-semibold text-center bg-purple-400 border-r border-purple-500">Ret. (%)</th>

                <th className="p-2 font-semibold text-center">Obs.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-[11px]">
              {filteredStock.length === 0 ? (
                <tr>
                  <td colSpan={23} className="p-8 text-center text-gray-400">Nenhum produto em estoque correspondente.</td>
                </tr>
              ) : (
                filteredStock.map((item) => (
                  <tr key={item.batchId} className="hover:bg-green-50 transition-colors group">
                    <td className="p-2 font-mono font-bold text-green-700 border-r border-gray-100">{item.batchId}</td>
                    <td className="p-2 font-bold text-gray-800 border-r border-gray-100">{item.productName}</td>
                    <td className="p-2 font-mono text-gray-500 border-r border-gray-100">{item.productCode}</td>
                    <td className="p-2 text-gray-600 border-r border-gray-100">{item.supplier}</td>
                    <td className="p-2 text-center border-r border-gray-100">
                        <span className={`px-1.5 py-0.5 rounded font-bold ${item.totalQuantity > 0 ? 'text-green-800 bg-green-50' : 'text-red-800'}`}>
                           {item.totalQuantity.toLocaleString('pt-BR', { minimumFractionDigits: 3, maximumFractionDigits: 3 })}
                        </span>
                    </td>
                    <td className="p-2 text-right font-medium text-gray-700 border-r border-gray-100">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.totalValue)}
                    </td>
                    
                    {/* AR */}
                    <td className="p-2 text-center border-r border-gray-100">{fmt(item.analysis.cu_ar)}</td>
                    <td className="p-2 text-center border-r border-gray-100">{fmt(item.analysis.zn_ar)}</td>

                    {/* HCL */}
                    <td className="p-2 text-center border-r border-gray-100">{fmt(item.analysis.cu_hcl)}</td>
                    <td className="p-2 text-center border-r border-gray-100">{fmt(item.analysis.zn_hcl)}</td>
                    <td className="p-2 text-center border-r border-gray-100">{fmt(item.analysis.mn)}</td>
                    <td className="p-2 text-center border-r border-gray-100">{fmt(item.analysis.b)}</td>

                    {/* 2 Extrator */}
                    <td className="p-2 text-center border-r border-gray-100">{fmt(item.analysis.cu_2)}</td>
                    <td className="p-2 text-center border-r border-gray-100">{fmt(item.analysis.zn_2)}</td>
                    <td className="p-2 text-center border-r border-gray-100">{fmt(item.analysis.mn_2)}</td>
                    <td className="p-2 text-center border-r border-gray-100">{fmt(item.analysis.b_2)}</td>

                    {/* Contam */}
                    <td className="p-2 text-center border-r border-gray-100">{fmt(item.analysis.pb)}</td>
                    <td className="p-2 text-center border-r border-gray-100">{fmt(item.analysis.fe)}</td>
                    <td className="p-2 text-center border-r border-gray-100">{fmt(item.analysis.cd, true)}</td>

                    {/* Outros */}
                    <td className="p-2 text-center border-r border-gray-100">{fmt(item.analysis.h2o)}</td>
                    <td className="p-2 text-center border-r border-gray-100">{fmt(item.analysis.mesh35)}</td>
                    <td className="p-2 text-center border-r border-gray-100">{fmt(item.analysis.ret)}</td>

                    <td className="p-2 text-center">
                      {item.observations && (
                        <button 
                          onClick={() => setObsModal({ isOpen: true, text: item.observations, title: `Obs: ${item.productName} (${item.batchId})` })}
                          className="text-blue-500 hover:text-blue-700 hover:bg-blue-100 p-1 rounded-full transition-colors no-print"
                          title="Ver Observações"
                        >
                          <MessageSquareText size={14} />
                        </button>
                      )}
                    </td>
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
