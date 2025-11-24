import React, { useRef } from 'react';
import { InventoryItem } from '../types';
import { Download, Upload, Trash2, Search } from 'lucide-react';
import * as XLSX from 'xlsx';

interface InventoryTableProps {
  items: InventoryItem[];
  onDelete: (id: string) => void;
  onImport: (items: InventoryItem[]) => void;
}

const InventoryTable: React.FC<InventoryTableProps> = ({ items, onDelete, onImport }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [searchTerm, setSearchTerm] = React.useState('');

  const handleExport = () => {
    // Flatten data for nice Excel format with new requested order
    const dataToExport = items.map(item => ({
      'Lote': item.batchId,
      'Produto': item.productName,
      'Fornecedor': item.supplier,
      'Cód. Fornecedor': item.supplierCode,
      'Cód. Produto': item.productCode,
      'Data Entrada': item.entryDate,
      'Data Saída': item.exitDate,
      'Quantidade': item.quantity,
      'Subtotal': (item.quantity * item.unitCost),
      'Observações': item.observations || '',
      'ID': item.id,
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Estoque");
    XLSX.writeFile(wb, "Controle_Estoque_TerraAgro.xlsx");
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws);
      
      // Map back to our structure
      const mappedItems: InventoryItem[] = data.map((row: any) => ({
        id: row['ID'] || crypto.randomUUID(),
        batchId: row['Lote'] || '',
        productName: row['Produto'] || '',
        productCode: (row['Cód. Produto'] || '').toString().padStart(3, '0'),
        supplier: row['Fornecedor'] || '',
        supplierCode: (row['Cód. Fornecedor'] || '').toString().padStart(3, '0'),
        quantity: Number(row['Quantidade'] || row['Qtd'] || 0),
        unitCost: Number(row['Custo Unit'] || 0), // Note: You might need to add Custo Unit to import if it's missing from new export structure or calculate
        unitPrice: 0, 
        entryDate: row['Data Entrada'] || '',
        exitDate: row['Data Saída'] || '',
        observations: row['Observações'] || ''
      }));

      onImport(mappedItems);
    };
    reader.readAsBinaryString(file);
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const filteredItems = items.filter(item => 
    item.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.batchId.includes(searchTerm) ||
    item.supplier.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 h-screen flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-green-900">Gerenciamento de Dados</h2>
        <div className="flex gap-3">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            className="hidden" 
            accept=".xlsx, .xls"
          />
          <button onClick={handleImportClick} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-md transition">
            <Upload size={18} /> Importar Excel
          </button>
          <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 bg-green-700 text-white rounded-lg hover:bg-green-800 shadow-md transition">
            <Download size={18} /> Exportar Excel
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg border border-gray-200 flex-1 flex flex-col overflow-hidden">
        {/* Search Bar */}
        <div className="p-4 border-b border-gray-200 flex items-center gap-3 bg-white">
          <Search className="text-gray-400" />
          <input 
            type="text" 
            placeholder="Buscar por produto, lote ou fornecedor..." 
            className="bg-green-50 outline-none flex-1 text-gray-700 p-2 rounded border border-green-100 placeholder-gray-400"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Table Header */}
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead className="bg-green-900 text-white sticky top-0 z-10">
              <tr>
                <th className="p-4 font-semibold text-xs uppercase tracking-wider">Lote</th>
                <th className="p-4 font-semibold text-xs uppercase tracking-wider">Produto</th>
                <th className="p-4 font-semibold text-xs uppercase tracking-wider">Fornecedor</th>
                <th className="p-4 font-semibold text-xs uppercase tracking-wider">Cód. Forn.</th>
                <th className="p-4 font-semibold text-xs uppercase tracking-wider">Cód. Prod.</th>
                <th className="p-4 font-semibold text-xs uppercase tracking-wider">Data Entrada</th>
                <th className="p-4 font-semibold text-xs uppercase tracking-wider">Data Saída</th>
                <th className="p-4 font-semibold text-xs uppercase tracking-wider text-center">Qtd</th>
                <th className="p-4 font-semibold text-xs uppercase tracking-wider text-right">Subtotal</th>
                <th className="p-4 font-semibold text-xs uppercase tracking-wider text-center">Ações</th>
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
                          className="text-red-400 hover:text-red-600 p-2 rounded-full hover:bg-red-50 transition"
                          title="Excluir"
                        >
                          <Trash2 size={18} />
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