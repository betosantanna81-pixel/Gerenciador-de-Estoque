
import React, { useState, useEffect } from 'react';
import { InventoryItem, RegistryEntity, ProductEntity } from '../types';
import { Save, AlertCircle, UserPlus, PackagePlus } from 'lucide-react';

interface AvailableBatch {
  batchId: string;
  productName: string;
  productCode: string;
  supplier: string;
  supplierCode: string;
  unitCost: number;
  remainingQuantity: number;
}

interface EntryFormProps {
  onAdd: (item: Omit<InventoryItem, 'id'>) => void;
  existingItems: InventoryItem[];
  availableBatches?: AvailableBatch[];
  suppliers: RegistryEntity[];
  clients: RegistryEntity[];
  registeredProducts: ProductEntity[];
  onNavigateToRegistry: (type: 'suppliers' | 'clients' | 'products') => void;
}

const EntryForm: React.FC<EntryFormProps> = ({ 
  onAdd, 
  existingItems, 
  availableBatches = [], 
  suppliers, 
  clients,
  registeredProducts,
  onNavigateToRegistry
}) => {
  const [movementType, setMovementType] = useState<'entrada' | 'saída'>('entrada');
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [error, setError] = useState('');
  
  // Track selected IDs for dropdowns
  const [selectedEntityId, setSelectedEntityId] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');

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

  // Logic to handle Batch Selection for "Saída"
  useEffect(() => {
    if (movementType === 'saída' && selectedBatchId) {
      const batch = availableBatches.find(b => b.batchId === selectedBatchId);
      if (batch) {
        setFormData(prev => ({
          ...prev,
          // For Exit, we do NOT overwrite supplier with batch supplier.
          // The user must enter the Client name in these fields via the entity selector.
          productName: batch.productName,
          productCode: batch.productCode,
          unitCost: batch.unitCost, // Pre-fill with batch cost
          quantity: 0
        }));
        setPreviewBatch(batch.batchId);
      }
    } else if (movementType === 'entrada') {
      // Reset logic for entry handled elsewhere
    }
  }, [selectedBatchId, movementType, availableBatches]);

  // Logic to generate preview for "Entrada"
  useEffect(() => {
    if (movementType === 'entrada') {
      if (formData.supplierCode.length === 3 && formData.productCode.length === 3) {
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
    }
  }, [formData.supplierCode, formData.productCode, existingItems, movementType]);

  const handleMovementTypeChange = (type: 'entrada' | 'saída') => {
    setMovementType(type);
    setError('');
    setSelectedBatchId('');
    setSelectedEntityId('');
    setSelectedProductId('');
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

  const handleProductChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelectedProductId(id);

    const product = registeredProducts.find(item => item.id === id);

    if (product) {
        setFormData(prev => ({
            ...prev,
            productName: product.name,
            productCode: product.code
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate Entity Selection
    if (!formData.supplier || !formData.supplierCode) {
      setError(`Selecione um ${movementType === 'entrada' ? 'Fornecedor' : 'Cliente'} cadastrado.`);
      return;
    }

    if (movementType === 'entrada') {
      if (!formData.productName || !formData.productCode) {
         setError('Selecione um Produto cadastrado.');
         return;
      }
      if (formData.supplierCode.length !== 3 || formData.productCode.length !== 3) {
        setError('Os códigos devem ter exatamente 3 dígitos.');
        return;
      }
    }

    if (!formData.supplier || !formData.productName || formData.quantity <= 0) {
      setError('Preencha todos os campos obrigatórios corretamente.');
      return;
    }

    // Validation for Exit
    if (movementType === 'saída') {
        if (!selectedBatchId) {
            setError('Selecione um lote para dar baixa.');
            return;
        }
        const batch = availableBatches.find(b => b.batchId === selectedBatchId);
        if (batch && Number(formData.quantity) > batch.remainingQuantity) {
            setError(`Quantidade indisponível. O lote possui apenas ${batch.remainingQuantity} Kg.`);
            return;
        }
    }

    onAdd({
      entryDate: movementType === 'entrada' ? formData.date : '',
      exitDate: movementType === 'saída' ? formData.date : '',
      supplier: formData.supplier,
      supplierCode: formData.supplierCode,
      productName: formData.productName,
      productCode: formData.productCode,
      quantity: Number(formData.quantity),
      unitCost: Number(formData.unitCost),
      unitPrice: 0, 
      batchId: movementType === 'saída' ? selectedBatchId : '', 
      observations: formData.observations,
    });

    // Reset form
    setFormData(prev => ({
      ...prev,
      supplier: '',
      supplierCode: '',
      productName: '',
      productCode: '',
      quantity: 0,
      unitCost: 0,
      observations: '',
    }));
    setSelectedEntityId('');
    setSelectedProductId('');
    if(movementType === 'saída') {
        setSelectedBatchId('');
    }
    alert("Movimentação registrada com sucesso!");
  };

  const inputClass = "w-full p-3 border border-green-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none transition bg-green-50 text-gray-800 placeholder-gray-500";
  const disabledClass = "w-full p-3 border border-gray-200 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed";
  
  // Determine which list to show for entity
  const activeEntityList = movementType === 'entrada' ? suppliers : clients;
  const activeEntityLabel = movementType === 'entrada' ? 'Fornecedor' : 'Cliente';
  const entityListEmpty = activeEntityList.length === 0;
  
  // Determine product list state
  const productListEmpty = registeredProducts.length === 0;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-green-100">
        <div className="bg-green-900 p-6 text-white flex justify-between items-center">
          <h2 className="text-2xl font-bold">Nova Movimentação</h2>
          <div className="text-right">
             <p className="text-xs text-green-300 uppercase">
                {movementType === 'entrada' ? 'Lote Previsto' : 'Lote Selecionado'}
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

          {/* Dates & Type */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Data</label>
            <input type="date" name="date" value={formData.date} onChange={handleChange} required className={inputClass} />
          </div>
          <div>
             <label className="block text-sm font-semibold text-gray-700 mb-1">Tipo de Movimentação</label>
             <select 
                value={movementType} 
                onChange={(e) => handleMovementTypeChange(e.target.value as 'entrada' | 'saída')}
                className={inputClass}
             >
                <option value="entrada">Entrada (Compras)</option>
                <option value="saída">Saída (Vendas)</option>
             </select>
          </div>

          {/* Special Field for Exit: Select Batch */}
          {movementType === 'saída' && (
             <div className="md:col-span-2 bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <label className="block text-sm font-bold text-yellow-800 mb-2">Baixar de (Selecionar Lote):</label>
                <select 
                    value={selectedBatchId} 
                    onChange={(e) => setSelectedBatchId(e.target.value)}
                    className="w-full p-3 border border-yellow-300 rounded-lg focus:ring-2 focus:ring-yellow-500 outline-none bg-white text-gray-800"
                    required
                >
                    <option value="">-- Selecione um lote disponível --</option>
                    {availableBatches.map(batch => (
                        <option key={batch.batchId} value={batch.batchId}>
                            {batch.supplier} - {batch.batchId} - {batch.productName} (Disp: {batch.remainingQuantity} Kg)
                        </option>
                    ))}
                </select>
             </div>
          )}

          {/* Supplier/Client Info */}
          <div className="md:col-span-2 border-t border-green-100 pt-4 mt-2">
             <h3 className="text-green-800 font-bold mb-4 flex items-center gap-2">
               <span className="w-2 h-2 bg-green-500 rounded-full"></span>
               {movementType === 'saída' ? 'Dados do Cliente' : 'Dados do Fornecedor'}
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
                {movementType === 'saída' ? 'Cód. Cliente' : 'Cód. Fornecedor'}
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

          {/* Product Info */}
          <div className="md:col-span-2 border-t border-green-100 pt-4 mt-2">
             <h3 className="text-green-800 font-bold mb-4 flex items-center gap-2">
               <span className="w-2 h-2 bg-green-500 rounded-full"></span>
               Dados do Produto
             </h3>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Selecione o Produto</label>
            {movementType === 'entrada' ? (
                <>
                    <select 
                        value={selectedProductId}
                        onChange={handleProductChange}
                        className={inputClass}
                        required
                        disabled={productListEmpty}
                    >
                        <option value="">-- Selecione na lista --</option>
                        {registeredProducts.map(prod => (
                            <option key={prod.id} value={prod.id}>
                                {prod.code} - {prod.name}
                            </option>
                        ))}
                    </select>
                    {productListEmpty && (
                        <div className="mt-2 text-xs text-red-600 flex items-center gap-1">
                            <AlertCircle size={12}/>
                            <span>Nenhum produto cadastrado.</span>
                            <button 
                                type="button"
                                onClick={() => onNavigateToRegistry('products')}
                                className="font-bold underline hover:text-red-800 ml-1"
                            >
                                Cadastrar Novo
                            </button>
                        </div>
                    )}
                </>
            ) : (
                // For Exit, product is determined by batch
                <input 
                    type="text" 
                    value={formData.productName} 
                    readOnly 
                    className={disabledClass}
                    placeholder="Selecionado via Lote"
                />
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Cód. Produto (3 dígitos)</label>
            <input 
                type="text" 
                name="productCode" 
                value={formData.productCode} 
                readOnly
                className={`${disabledClass} font-mono font-bold`} 
                placeholder="Automático" 
            />
          </div>
          
          <div className="md:col-span-2 grid grid-cols-2 gap-4">
             <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Quantidade (Kg)</label>
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
                disabled={entityListEmpty || (movementType === 'entrada' && productListEmpty)}
                className={`w-full font-bold py-4 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all transform hover:scale-[1.01]
                    ${(entityListEmpty || (movementType === 'entrada' && productListEmpty)) ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-700 hover:bg-green-800 text-white'}
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
