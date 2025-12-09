
import React, { useState, useEffect } from 'react';
import { InventoryItem, RegistryEntity, ProductEntity, ServiceEntity } from '../types';
import { Save, AlertCircle, Briefcase, Package, Plus, Trash2 } from 'lucide-react';

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

interface EntryFormProps {
  onAdd: (item: Omit<InventoryItem, 'id'>) => void;
  existingItems: InventoryItem[];
  availableBatches?: AvailableBatch[];
  suppliers: RegistryEntity[];
  clients: RegistryEntity[];
  registeredProducts: ProductEntity[];
  registeredServices: ServiceEntity[];
  onNavigateToRegistry: (type: 'suppliers' | 'clients' | 'products' | 'services_registry') => void;
}

const EntryForm: React.FC<EntryFormProps> = ({ 
  onAdd, 
  existingItems, 
  availableBatches = [], 
  suppliers, 
  clients,
  registeredProducts,
  registeredServices,
  onNavigateToRegistry
}) => {
  const [movementType, setMovementType] = useState<'entrada' | 'saída' | 'devolucao'>('entrada');
  const [error, setError] = useState('');
  
  // M.O. Flag
  const [isService, setIsService] = useState(false);

  // Track selected IDs for dropdowns
  const [selectedEntityId, setSelectedEntityId] = useState('');
  const [selectedItemId, setSelectedItemId] = useState(''); // Product or Service ID
  
  // New Field: Material Type for M.O. Entry
  const [selectedMaterialTypeId, setSelectedMaterialTypeId] = useState('');

  // Multi-item state for 'devolucao' AND 'saída'
  const [exitItems, setExitItems] = useState<{batchId: string; quantity: string}[]>([{ batchId: '', quantity: '' }]);

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    supplier: '',
    supplierCode: '',
    productName: '',
    productCode: '',
    quantity: 0,
    unitCost: 0,
    observations: '',
  });

  const [previewBatch, setPreviewBatch] = useState('---/---/---');

  // Filter batches based on isService
  const filteredAvailableBatches = availableBatches.filter(b => !!b.isService === isService);

  // Logic to generate preview for "Entrada"
  useEffect(() => {
    if (movementType === 'entrada') {
      if (formData.supplierCode.length === 3 && formData.productCode.length === 3) {
        // We calculate sequence based on supplier and general entries
        const supplierEntries = existingItems.filter(i => i.supplierCode === formData.supplierCode && !!i.entryDate);
        
        let maxSeq = 0;
        supplierEntries.forEach(item => {
             const parts = item.batchId.split('/');
             if (parts.length === 3) {
                 const seq = parseInt(parts[1], 10);
                 if (!isNaN(seq) && seq > maxSeq) maxSeq = seq;
             }
        });
        
        const nextSequence = (maxSeq + 1).toString().padStart(3, '0');
        setPreviewBatch(`${formData.supplierCode}/${nextSequence}/${formData.productCode}`);
      } else {
        setPreviewBatch('Requer códigos de 3 dígitos');
      }
    } else if (movementType === 'devolucao' || movementType === 'saída') {
        setPreviewBatch('Múltiplos Lotes');
    }
  }, [formData.supplierCode, formData.productCode, existingItems, movementType]);

  const handleMovementTypeChange = (type: 'entrada' | 'saída' | 'devolucao') => {
    setMovementType(type);
    resetFields();
  };

  const resetFields = () => {
    setError('');
    setSelectedEntityId('');
    setSelectedItemId('');
    setSelectedMaterialTypeId('');
    setExitItems([{ batchId: '', quantity: '' }]);
    setFormData({
      date: new Date().toISOString().split('T')[0],
      supplier: '',
      supplierCode: '',
      productName: '',
      productCode: '',
      quantity: 0,
      unitCost: 0,
      observations: '',
    });
    setPreviewBatch('---/---/---');
  };

  const handleEntityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelectedEntityId(id);

    // For Devolucao/Saida, we use Clients list. For Entrada, Suppliers.
    const list = movementType === 'entrada' ? suppliers : clients;
    const entity = list.find(item => item.id === id);

    if (entity) {
      setFormData(prev => ({
        ...prev,
        supplier: entity.name,
        supplierCode: entity.code
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        supplier: '',
        supplierCode: ''
      }));
    }
  };

  const handleItemChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelectedItemId(id);

    // Decide whether looking in Products or Services based on checkbox
    let item: ProductEntity | ServiceEntity | undefined;
    if (isService) {
        item = registeredServices.find(s => s.id === id);
    } else {
        item = registeredProducts.find(p => p.id === id);
    }

    if (item) {
        setFormData(prev => ({
            ...prev,
            productName: item.name,
            productCode: item.code
        }));
    } else {
        setFormData(prev => ({
            ...prev,
            productName: '',
            productCode: ''
        }));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  // Handlers for Multi-Item Exit/Devolucao
  const handleAddExitItem = () => {
    setExitItems(prev => [...prev, { batchId: '', quantity: '' }]);
  };

  const handleRemoveExitItem = (index: number) => {
    setExitItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleExitItemChange = (index: number, field: 'batchId' | 'quantity', value: string) => {
    setExitItems(prev => {
        const newItems = [...prev];
        newItems[index] = { ...newItems[index], [field]: value };
        return newItems;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate Entity Selection
    if (!formData.supplier || !formData.supplierCode) {
      setError(`Selecione um ${movementType === 'entrada' ? 'Fornecedor' : 'Cliente'} cadastrado.`);
      return;
    }

    // --- SAIDA / DEVOLUÇÃO (MULTI-ITEM LOGIC) ---
    if (movementType === 'saída' || movementType === 'devolucao') {
        const validItems = exitItems.filter(i => i.batchId && Number(i.quantity) > 0);
        if (validItems.length === 0) {
            setError('Adicione pelo menos um item para baixar/devolver.');
            return;
        }

        // Validate quantities
        for (const item of validItems) {
            const batch = availableBatches.find(b => b.batchId === item.batchId);
            if (!batch) {
                setError(`Lote ${item.batchId} não encontrado.`);
                return;
            }
            if (Number(item.quantity) > batch.remainingQuantity) {
                setError(`Qtd indisponível para o lote ${item.batchId}. Disp: ${batch.remainingQuantity}`);
                return;
            }
        }

        // Process all items
        validItems.forEach(item => {
            const batch = availableBatches.find(b => b.batchId === item.batchId)!;
            onAdd({
                entryDate: '',
                exitDate: formData.date,
                supplier: formData.supplier, // Client Name
                supplierCode: formData.supplierCode, // Client Code
                productName: batch.productName,
                productCode: batch.productCode,
                quantity: Number(item.quantity),
                unitCost: batch.unitCost,
                unitPrice: 0,
                batchId: item.batchId,
                observations: movementType === 'devolucao' 
                    ? `Devolução M.O. | ${formData.observations}` 
                    : formData.observations,
                isService: isService // Respect current mode (could be product or service exit)
            });
        });

        resetFields();
        alert("Movimentação em massa registrada com sucesso!");
        return;
    }

    // --- ENTRADA (SINGLE ITEM LOGIC) ---

    if (movementType === 'entrada') {
      if (!formData.productName || !formData.productCode) {
         setError(`Selecione um ${isService ? 'Tipo de Serviço' : 'Produto'} cadastrado.`);
         return;
      }
      if (formData.supplierCode.length !== 3 || formData.productCode.length !== 3) {
        setError('Os códigos devem ter exatamente 3 dígitos.');
        return;
      }
      if (formData.quantity <= 0) {
        setError('A quantidade deve ser maior que zero.');
        return;
      }

      // Prepare observations: Append Material Type if M.O. Entry
      let finalObservations = formData.observations;
      if (isService && selectedMaterialTypeId) {
          const material = registeredProducts.find(p => p.id === selectedMaterialTypeId);
          if (material) {
              const matInfo = `Material Físico: ${material.name}`;
              finalObservations = finalObservations 
                  ? `${matInfo} | ${finalObservations}` 
                  : matInfo;
          }
      }

      onAdd({
        entryDate: formData.date,
        exitDate: '',
        supplier: formData.supplier,
        supplierCode: formData.supplierCode,
        productName: formData.productName,
        productCode: formData.productCode,
        quantity: Number(formData.quantity),
        unitCost: Number(formData.unitCost),
        unitPrice: 0, 
        batchId: '', 
        observations: finalObservations,
        isService: isService 
      });

      // Reset form
      resetFields();
      alert("Entrada registrada com sucesso!");
    }
  };

  const inputClass = "w-full p-3 border border-green-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none transition bg-green-50 text-gray-800 placeholder-gray-500";
  const disabledClass = "w-full p-3 border border-gray-200 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed";
  
  // Determine which list to show for entity
  // Devolucao works like Saida (Client context)
  const activeEntityList = movementType === 'entrada' ? suppliers : clients;
  const activeEntityLabel = movementType === 'entrada' ? 'Fornecedor' : 'Cliente';
  const entityListEmpty = activeEntityList.length === 0;
  
  // Determine item list state
  const itemList = isService ? registeredServices : registeredProducts;
  const itemListEmpty = itemList.length === 0;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-green-100">
        <div className="bg-green-900 p-6 text-white flex justify-between items-center">
          <h2 className="text-2xl font-bold">Nova Movimentação</h2>
          <div className="text-right">
             <p className="text-xs text-green-300 uppercase">
                {movementType === 'entrada' ? 'Lote Previsto' : 'Seleção'}
             </p>
             <p className="text-xl font-mono font-bold tracking-widest">{previewBatch}</p>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {error && (
            <div className="md:col-span-2 bg-red-50 text-red-700 p-4 rounded-lg flex items-center gap-2">
              <AlertCircle size={20} />
              {error}
            </div>
          )}

          {/* M.O. Checkbox */}
          <div className="md:col-span-2 bg-blue-50 p-4 rounded-lg border border-blue-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                 <div className="bg-blue-200 p-2 rounded-full text-blue-800">
                    <Briefcase size={20} />
                 </div>
                 <div>
                    <h3 className="text-blue-900 font-bold text-sm">Controle de M.O.</h3>
                    <p className="text-xs text-blue-700">Esta movimentação refere-se a Mão de Obra?</p>
                 </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={isService} 
                    onChange={(e) => {
                        setIsService(e.target.checked);
                        setSelectedItemId('');
                        setSelectedMaterialTypeId(''); 
                        // If unchecking, ensure we reset to a valid type if currently on Devolucao
                        if (!e.target.checked && movementType === 'devolucao') {
                            setMovementType('saída');
                        }
                        setFormData(prev => ({...prev, productName: '', productCode: ''}));
                    }}
                    className="w-6 h-6 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                  <span className="font-bold text-blue-900 text-sm">Entrada/Saída M.O.</span>
              </label>
          </div>

          {/* Dates & Type */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Data</label>
            <input type="date" name="date" value={formData.date} onChange={handleChange} required className={inputClass} />
          </div>
          <div>
             <label className="block text-sm font-semibold text-gray-700 mb-1">Tipo de Movimentação</label>
             <select 
                value={movementType} 
                onChange={(e) => handleMovementTypeChange(e.target.value as any)}
                className={inputClass}
             >
                <option value="entrada">Entrada (Compras)</option>
                <option value="saída">Saída (Vendas/Cobrança)</option>
                {isService && <option value="devolucao">Devolução de M.O.</option>}
             </select>
          </div>

          {/* MULTI ITEM SELECTION FOR SAIDA AND DEVOLUCAO */}
          {(movementType === 'saída' || movementType === 'devolucao') && (
             <div className="md:col-span-2 bg-yellow-50 p-4 rounded-lg border border-yellow-200 space-y-3">
                <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-bold text-yellow-800">
                        {movementType === 'saída' ? 'Baixar Estoque (Saída em Massa):' : 'Baixar Estoque M.O. (Devolução em Massa):'}
                    </label>
                    <button 
                        type="button" 
                        onClick={handleAddExitItem}
                        className="text-xs font-bold text-yellow-800 flex items-center gap-1 hover:text-yellow-900 bg-yellow-100 px-2 py-1 rounded border border-yellow-300"
                    >
                        <Plus size={14} /> Adicionar Material
                    </button>
                </div>
                
                {exitItems.map((item, index) => (
                    <div key={index} className="flex gap-2 items-center">
                        <select 
                            value={item.batchId} 
                            onChange={(e) => handleExitItemChange(index, 'batchId', e.target.value)}
                            className="flex-1 p-2 border border-yellow-300 rounded focus:ring-2 focus:ring-yellow-500 outline-none bg-white text-gray-800 text-sm"
                            required
                        >
                            <option value="">-- Selecione um lote --</option>
                            {filteredAvailableBatches.map(batch => (
                                <option key={batch.batchId} value={batch.batchId}>
                                    {batch.supplier} - {batch.batchId} - {batch.productName} ({batch.remainingQuantity}kg)
                                </option>
                            ))}
                        </select>
                        <input 
                            type="number"
                            placeholder="Qtd"
                            value={item.quantity}
                            onChange={(e) => handleExitItemChange(index, 'quantity', e.target.value)}
                            className="w-24 p-2 border border-yellow-300 rounded focus:ring-2 focus:ring-yellow-500 outline-none bg-white text-gray-800 text-sm"
                            required
                        />
                        <button 
                            type="button"
                            onClick={() => handleRemoveExitItem(index)}
                            disabled={exitItems.length === 1}
                            className="p-2 text-red-500 hover:bg-red-50 rounded disabled:opacity-50"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                ))}
             </div>
          )}

          {/* Supplier/Client Info */}
          <div className="md:col-span-2 border-t border-green-100 pt-4 mt-2">
             <h3 className="text-green-800 font-bold mb-4 flex items-center gap-2">
               <span className="w-2 h-2 bg-green-500 rounded-full"></span>
               {movementType === 'entrada' ? 'Dados do Fornecedor' : 'Dados do Cliente'}
             </h3>
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
                Selecione o {activeEntityLabel}
            </label>
            <div className="relative">
                <select 
                    value={selectedEntityId}
                    onChange={handleEntityChange}
                    className={inputClass}
                    required
                    disabled={entityListEmpty}
                >
                    <option value="">-- Selecione na lista --</option>
                    {activeEntityList.map(entity => (
                        <option key={entity.id} value={entity.id}>
                            {entity.code} - {entity.name}
                        </option>
                    ))}
                </select>
            </div>
            {entityListEmpty && (
                <div className="mt-2 text-xs text-red-600 flex items-center gap-1">
                    <AlertCircle size={12}/>
                    <span>Nenhum {activeEntityLabel.toLowerCase()} cadastrado.</span>
                    <button 
                        type="button"
                        onClick={() => onNavigateToRegistry(movementType === 'entrada' ? 'suppliers' : 'clients')}
                        className="font-bold underline hover:text-red-800 ml-1"
                    >
                        Cadastrar Novo
                    </button>
                </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
                {movementType === 'entrada' ? 'Cód. Fornecedor' : 'Cód. Cliente'}
            </label>
            <input 
                type="text" 
                name="supplierCode" 
                value={formData.supplierCode} 
                readOnly
                className={`${disabledClass} font-mono font-bold`} 
                placeholder="Automático" 
            />
          </div>

          {/* Product/Service Info - Hidden for Saida/Devolucao as it's determined by the multi-select batch list */}
          {movementType === 'entrada' && (
            <>
                <div className="md:col-span-2 border-t border-green-100 pt-4 mt-2">
                    <h3 className="text-green-800 font-bold mb-4 flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    {isService ? 'Dados do Serviço (M.O.)' : 'Dados do Produto'}
                    </h3>
                </div>

                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                        {isService ? 'Selecione o Tipo de Serviço' : 'Selecione o Produto'}
                    </label>
                    <select 
                        value={selectedItemId}
                        onChange={handleItemChange}
                        className={inputClass}
                        required
                        disabled={itemListEmpty}
                    >
                        <option value="">-- Selecione na lista --</option>
                        {itemList.map(item => (
                            <option key={item.id} value={item.id}>
                                {item.code} - {item.name}
                            </option>
                        ))}
                    </select>
                    {itemListEmpty && (
                        <div className="mt-2 text-xs text-red-600 flex items-center gap-1">
                            <AlertCircle size={12}/>
                            <span>Nenhum {isService ? 'serviço' : 'produto'} cadastrado.</span>
                            <button 
                                type="button"
                                onClick={() => onNavigateToRegistry(isService ? 'services_registry' : 'products')}
                                className="font-bold underline hover:text-red-800 ml-1"
                            >
                                Cadastrar Novo
                            </button>
                        </div>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                        {isService ? 'Cód. Serviço (3 dígitos)' : 'Cód. Produto (3 dígitos)'}
                    </label>
                    <input 
                        type="text" 
                        name="productCode" 
                        value={formData.productCode} 
                        readOnly
                        className={`${disabledClass} font-mono font-bold`} 
                        placeholder="Automático" 
                    />
                </div>

                {/* Material Type Selection for M.O. Entries */}
                {isService && (
                    <div className="md:col-span-2">
                        <label className="block text-sm font-semibold text-gray-700 mb-1 flex items-center gap-2">
                            <Package size={16} />
                            Tipo de Material (Entrada de M.O.)
                        </label>
                        <select 
                            value={selectedMaterialTypeId}
                            onChange={(e) => setSelectedMaterialTypeId(e.target.value)}
                            className={inputClass}
                        >
                            <option value="">-- Selecione o Material Físico (Opcional) --</option>
                            {registeredProducts.map(p => (
                                <option key={p.id} value={p.id}>{p.code} - {p.name}</option>
                            ))}
                        </select>
                    </div>
                )}
                
                <div className="md:col-span-2 grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Quantidade ({isService ? 'Horas/Un' : 'Kg'})</label>
                        <input 
                            type="number" 
                            name="quantity" 
                            value={formData.quantity} 
                            onChange={handleChange} 
                            required 
                            min="0.001" 
                            step="any"
                            className={inputClass} 
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Valor Unitário</label>
                        <input 
                            type="number" 
                            name="unitCost" 
                            value={formData.unitCost} 
                            onChange={handleChange} 
                            required 
                            min="0" 
                            step="0.01" 
                            className={inputClass} 
                        />
                    </div>
                </div>
            </>
          )}

          {/* Observations */}
          <div className="md:col-span-2">
             <label className="block text-sm font-semibold text-gray-700 mb-1">Observações</label>
             <textarea 
                name="observations" 
                value={formData.observations} 
                onChange={handleChange} 
                rows={3}
                className={inputClass}
                placeholder="Insira detalhes adicionais sobre a movimentação..."
             />
          </div>

          <div className="md:col-span-2 mt-6">
            <button 
                type="submit" 
                disabled={entityListEmpty || (movementType === 'entrada' && itemListEmpty)}
                className={`w-full font-bold py-4 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all transform hover:scale-[1.01]
                    ${(entityListEmpty || (movementType === 'entrada' && itemListEmpty)) ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-700 hover:bg-green-800 text-white'}
                `}
            >
              <Save size={20} />
              SALVAR REGISTRO
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default EntryForm;
