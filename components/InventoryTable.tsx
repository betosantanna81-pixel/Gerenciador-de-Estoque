
import React, { useMemo, useState } from 'react';
import { InventoryItem } from '../types';
import { Trash2, Search, Filter, XCircle } from 'lucide-react';

interface InventoryTableProps {
  items: InventoryItem[];
  onDelete: (id: string) => void;
}

const InventoryTable: React.FC<InventoryTableProps> = ({ items, onDelete }) => {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [filterType, setFilterType] = useState<'none' | 'supplier' | 'product'>('none');
  const [filterValue, setFilterValue] = useState('');

  // Extract unique values for filters
  const uniqueSuppliers = useMemo(() => 
    Array.from(new Set(items.map(i => i.supplier))).filter(Boolean).sort(), 
  [items]);

  const uniqueProducts = useMemo(() => 
    Array.from(new Set(items.map(i => i.productName))).filter(Boolean).sort(), 
  [items]);

  // Filter Logic
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      // 1. Text Search Match
      const matchesSearch = 
        searchTerm === '' ||
        item.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.batchId.includes(searchTerm) ||
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
  }, [items, searchTerm, filterType, filterValue]);

  // Calculate Totals
  const totalQuantity = useMemo(() => 
    filteredItems.reduce((acc, item) => acc + item.quantity, 0), 
  [filteredItems]);

  const totalValue = useMemo(() => 
    filteredItems.reduce((acc, item) => acc + (item.quantity * item.unitCost), 0), 
  [filteredItems]);

  const handleFilterTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilterType(e.target.value as any);
    setFilterValue(''); // Reset value when type changes
  };

  const clearFilters = () => {
    setFilterType('none');
    setFilterValue('');
    setSearchTerm('');
  };

  return (
    <div className="p-8 h-screen flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-green-900">Gerenciamento de Dados</h2>
      </div>

      <div className="bg-white rounded-xl shadow-lg border border-gray-200 flex-1 flex flex-col overflow-hidden">
        
        {/* Controls Section */}
        <div className="p-4 border-b border-gray-200 bg-white flex flex-col gap-4">
          
          <div className="flex flex-col md:flex-row gap-4">
            
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
                <option value="supplier">Por Fornecedor/Cliente</option>
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
            <div className="flex-1 flex items-center gap-3 bg-gray-50 p-2 rounded-lg border border-gray-200 px-4">
              <Search className="text-gray-400" size={20} />
              <input 
                type="text" 
                placeholder="Busca rápida por produto, lote ou fornecedor..." 
                className="bg-transparent outline-none flex-1 text-gray-700 placeholder-gray-400"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

          </div>

          {/* Totals Summary */}
          <div className="flex items-center gap-6 pt-2">
             <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-500 uppercase font-bold text-xs">Registros:</span>
                <span className="font-mono font-bold text-gray-800 bg-gray-100 px-2 py-0.5 rounded">{filteredItems.length}</span>
             </div>
             <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-500 uppercase font-bold text-xs">Quantidade Total:</span>
                <span className="font-mono font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded border border-green-100">
                  {totalQuantity.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
             </div>
             <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-500 uppercase font-bold text-xs">Valor Total:</span>
                <span className="font-mono font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded border border-green-100">
                  {totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
             </div>
          </div>

        </div>

        {/* Table Header */}
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead className="bg-green-900 text-white sticky top-0 z-10">
              <tr>
                <th className="p-4 font-semibold text-xs uppercase tracking-wider">Lote</th>
                <th className="p-4 font-semibold text-xs uppercase tracking-wider">Produto</th>
                <th className="p-4 font-semibold text-xs uppercase tracking-wider">FORNECEDOR/CLIENTE</th>
                <th className="p-4 font-semibold text-xs uppercase tracking-wider">CÓD. F/C</th>
                <th className="p-4 font-semibold text-xs uppercase tracking-wider">Cód. Prod.</th>
                <th className="p-4 font-semibold text-xs uppercase tracking-wider">Data Entrada</th>
                <th className="p-4 font-semibold text-xs uppercase tracking-wider">Data Saída</th>
                <th className="p-4 font-semibold text-xs uppercase tracking-wider text-center">Qtd</th>
                <th className="p-4 font-semibold text-xs uppercase tracking-wider text-right">Subtotal</th>
                <th className="p-4 font-semibold text-xs uppercase tracking-wider text-center">AÇÕES</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-gray-400">Nenhum registro encontrado.</td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  return (
                    <tr key={item.id} className="hover:bg-green-50 transition-colors">
                      <td className="p-4 text-sm font-mono text-xs text-gray-500 bg-gray-50 rounded px-2 w-32">{item.batchId}</td>
                      <td className="p-4 text-sm text-gray-800 font-bold">{item.productName}</td>
                      <td className="p-4 text-sm text-gray-800 font-medium">{item.supplier}</td>
                      <td className="p-4 text-sm text-gray-500 font-mono">{item.supplierCode}</td>
                      <td className="p-4 text-sm text-gray-500 font-mono">{item.productCode}</td>
                      <td className="p-4 text-sm text-gray-600">{item.entryDate ? new Date(item.entryDate).toLocaleDateString('pt-BR') : '-'}</td>
                      <td className="p-4 text-sm text-gray-600">{item.exitDate ? new Date(item.exitDate).toLocaleDateString('pt-BR') : '-'}</td>
                      <td className="p-4 text-sm text-center font-bold bg-green-50/50 text-green-800">{item.quantity}</td>
                      <td className="p-4 text-sm text-right font-medium text-gray-700">
                         {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.quantity * item.unitCost)}
                      </td>
                      <td className="p-4 text-center">
                        <button 
                          onClick={() => onDelete(item.id)}
                          className="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-50 transition-all transform hover:scale-110"
                          title="Excluir"
                        >
                          <Trash2 size={20} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default InventoryTable;
