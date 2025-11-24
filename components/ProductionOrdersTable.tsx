
import React, { useState } from 'react';
import { ProductionOrder } from '../types';
import { Search, FileText } from 'lucide-react';

interface ProductionOrdersTableProps {
  orders: ProductionOrder[];
}

const ProductionOrdersTable: React.FC<ProductionOrdersTableProps> = ({ orders }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredOrders = orders.filter(order => 
    order.sourceBatchId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.sourceProduct.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.supplier.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); // Newest first

  return (
    <div className="p-8 h-screen flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-emerald-900 flex items-center gap-2">
            <FileText size={28} />
            Ordens de Produção (OPs)
        </h2>
      </div>

      <div className="bg-white rounded-xl shadow-lg border border-gray-200 flex-1 flex flex-col overflow-hidden">
         {/* Search */}
         <div className="p-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center gap-3 bg-white p-2 rounded-lg border border-gray-200 px-4 max-w-md">
              <Search className="text-gray-400" size={20} />
              <input 
                type="text" 
                placeholder="Buscar por Lote Origem, Produto ou Fornecedor..." 
                className="bg-transparent outline-none flex-1 text-gray-700 placeholder-gray-400"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
         </div>

         {/* Table */}
         <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse">
               <thead className="bg-emerald-800 text-white sticky top-0 z-10">
                  <tr>
                     <th className="p-4 font-semibold text-xs uppercase tracking-wider">Data</th>
                     <th className="p-4 font-semibold text-xs uppercase tracking-wider">Lote Origem</th>
                     <th className="p-4 font-semibold text-xs uppercase tracking-wider">Produto Processado</th>
                     <th className="p-4 font-semibold text-xs uppercase tracking-wider text-center">Qtd Proc. (Kg)</th>
                     <th className="p-4 font-semibold text-xs uppercase tracking-wider">Fornecedor</th>
                     <th className="p-4 font-semibold text-xs uppercase tracking-wider">Produtos Gerados</th>
                     <th className="p-4 font-semibold text-xs uppercase tracking-wider text-right">Perca (Kg)</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-gray-100">
                  {filteredOrders.length === 0 ? (
                     <tr><td colSpan={7} className="p-8 text-center text-gray-400">Nenhuma ordem de produção encontrada.</td></tr>
                  ) : (
                     filteredOrders.map(order => (
                        <tr key={order.id} className="hover:bg-emerald-50 transition-colors">
                           <td className="p-4 text-sm text-gray-600">{new Date(order.date).toLocaleDateString('pt-BR')}</td>
                           <td className="p-4 text-sm font-mono font-bold text-gray-500">{order.sourceBatchId}</td>
                           <td className="p-4 text-sm font-bold text-gray-800">{order.sourceProduct}</td>
                           <td className="p-4 text-sm text-center font-bold text-emerald-700 bg-emerald-50/50 rounded">{order.processedQuantity}</td>
                           <td className="p-4 text-sm text-gray-600">{order.supplier}</td>
                           <td className="p-4 text-sm">
                              <div className="flex flex-col gap-1">
                                 {order.outputs.map((out, idx) => (
                                    <span key={idx} className="text-xs bg-gray-100 px-2 py-1 rounded border border-gray-200 text-gray-700">
                                       {out.quantity}kg - {out.productName} ({out.newBatchId})
                                    </span>
                                 ))}
                              </div>
                           </td>
                           <td className="p-4 text-sm text-right font-mono text-orange-600 font-bold">{order.loss.toFixed(2)}</td>
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

export default ProductionOrdersTable;
