
import React, { useMemo, useState } from 'react';
import { InventoryItem } from '../types';
import { Search, DollarSign, Filter, XCircle } from 'lucide-react';

interface LaborBillingTableProps {
  items: InventoryItem[]; // Should only be M.O. items
}

const LaborBillingTable: React.FC<LaborBillingTableProps> = ({ items }) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Filter for exits only (Billing implies charging out)
  const billingItems = useMemo(() => {
    return items.filter(item => {
      const isExit = !!item.exitDate && !item.entryDate;
      const matchesSearch = 
        item.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.batchId.toLowerCase().includes(searchTerm.toLowerCase());
      
      return isExit && matchesSearch;
    }).sort((a,b) => new Date(b.exitDate).getTime() - new Date(a.exitDate).getTime());
  }, [items, searchTerm]);

  const totalBilled = useMemo(() => billingItems.reduce((acc, i) => acc + (i.quantity * i.unitCost), 0), [billingItems]);

  return (
    <div className="p-8 h-screen flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-blue-900 flex items-center gap-2">
            <DollarSign size={28} />
            Cobrança de M.O. (Saídas)
        </h2>
      </div>

      <div className="bg-white rounded-xl shadow-lg border border-gray-200 flex-1 flex flex-col overflow-hidden">
        
        {/* Controls */}
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex flex-col md:flex-row gap-4 items-center">
            <div className="flex-1 w-full md:w-auto flex items-center gap-3 bg-white p-2 rounded-lg border border-gray-200 px-4">
              <Search className="text-gray-400" size={20} />
              <input 
                type="text" 
                placeholder="Buscar por cliente, serviço ou lote..." 
                className="bg-transparent outline-none flex-1 text-gray-700 placeholder-gray-400"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex items-center gap-2 bg-blue-100 px-4 py-2 rounded-lg border border-blue-200">
               <span className="text-xs font-bold text-blue-800 uppercase">Total Cobrado:</span>
               <span className="font-mono text-lg font-bold text-blue-900">
                  {totalBilled.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
               </span>
            </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead className="bg-blue-900 text-white sticky top-0 z-10">
              <tr>
                <th className="p-4 font-semibold text-xs uppercase tracking-wider">Data Saída</th>
                <th className="p-4 font-semibold text-xs uppercase tracking-wider">Lote M.O.</th>
                <th className="p-4 font-semibold text-xs uppercase tracking-wider">Serviço</th>
                <th className="p-4 font-semibold text-xs uppercase tracking-wider">Cliente</th>
                <th className="p-4 font-semibold text-xs uppercase tracking-wider text-center">Qtd (Hrs/Un)</th>
                <th className="p-4 font-semibold text-xs uppercase tracking-wider text-right">Valor Unit.</th>
                <th className="p-4 font-semibold text-xs uppercase tracking-wider text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {billingItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-400">Nenhum registro de cobrança (saída de M.O.) encontrado.</td>
                </tr>
              ) : (
                billingItems.map((item) => (
                    <tr key={item.id} className="hover:bg-blue-50 transition-colors">
                      <td className="p-4 text-sm text-gray-600">{new Date(item.exitDate).toLocaleDateString('pt-BR')}</td>
                      <td className="p-4 text-sm font-mono text-gray-500">{item.batchId}</td>
                      <td className="p-4 text-sm font-bold text-gray-800">{item.productName}</td>
                      <td className="p-4 text-sm text-gray-700">{item.supplier}</td>
                      <td className="p-4 text-sm text-center font-bold bg-blue-50/50 text-blue-800">{item.quantity}</td>
                      <td className="p-4 text-sm text-right text-gray-600">
                         {item.unitCost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </td>
                      <td className="p-4 text-sm text-right font-bold text-gray-800">
                         {(item.quantity * item.unitCost).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </td>
                    </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default LaborBillingTable;
