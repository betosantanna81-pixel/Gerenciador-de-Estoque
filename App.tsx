
import React, { useState, useEffect, useMemo } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import EntryForm from './components/EntryForm';
import InventoryTable from './components/InventoryTable';
import CurrentStockTable from './components/CurrentStockTable';
import AnalysisForm from './components/AnalysisForm';
import EntityRegistry from './components/EntityRegistry';
import ProductRegistry from './components/ProductRegistry';
import { InventoryItem, ViewState, ProductAnalysis, RegistryEntity, ProductEntity } from './types';
import * as XLSX from 'xlsx';

// Declare XLSX for window access if needed, though we use import in components
declare global {
  interface Window {
    XLSX: any;
  }
}

function App() {
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [analyses, setAnalyses] = useState<ProductAnalysis[]>([]);
  const [suppliers, setSuppliers] = useState<RegistryEntity[]>([]);
  const [clients, setClients] = useState<RegistryEntity[]>([]);
  const [registeredProducts, setRegisteredProducts] = useState<ProductEntity[]>([]);

  // Load from LocalStorage
  useEffect(() => {
    const savedItems = localStorage.getItem('greenstock_data');
    if (savedItems) {
      try { setItems(JSON.parse(savedItems)); } catch (e) { console.error(e); }
    }
    const savedAnalyses = localStorage.getItem('greenstock_analyses');
    if (savedAnalyses) {
       try { setAnalyses(JSON.parse(savedAnalyses)); } catch(e) { console.error(e); }
    }
    const savedSuppliers = localStorage.getItem('greenstock_suppliers');
    if (savedSuppliers) {
       try { setSuppliers(JSON.parse(savedSuppliers)); } catch(e) { console.error(e); }
    }
    const savedClients = localStorage.getItem('greenstock_clients');
    if (savedClients) {
       try { setClients(JSON.parse(savedClients)); } catch(e) { console.error(e); }
    }
    const savedProducts = localStorage.getItem('greenstock_products');
    if (savedProducts) {
       try { setRegisteredProducts(JSON.parse(savedProducts)); } catch(e) { console.error(e); }
    }
  }, []);

  // Save to LocalStorage
  useEffect(() => {
    localStorage.setItem('greenstock_data', JSON.stringify(items));
  }, [items]);
  
  useEffect(() => {
    localStorage.setItem('greenstock_analyses', JSON.stringify(analyses));
  }, [analyses]);

  useEffect(() => {
    localStorage.setItem('greenstock_suppliers', JSON.stringify(suppliers));
  }, [suppliers]);

  useEffect(() => {
    localStorage.setItem('greenstock_clients', JSON.stringify(clients));
  }, [clients]);

  useEffect(() => {
    localStorage.setItem('greenstock_products', JSON.stringify(registeredProducts));
  }, [registeredProducts]);

  // Calculate available batches for the Exit Form
  const batchesWithStock = useMemo(() => {
    const batchMap = new Map<string, {
      batchId: string;
      productName: string;
      productCode: string;
      supplier: string;
      supplierCode: string;
      unitCost: number;
      remainingQuantity: number;
    }>();

    // 1. Process entries
    items.forEach(item => {
      if (item.entryDate && !item.exitDate) {
        // It's an entry
        if (!batchMap.has(item.batchId)) {
          batchMap.set(item.batchId, {
            batchId: item.batchId,
            productName: item.productName,
            productCode: item.productCode,
            supplier: item.supplier,
            supplierCode: item.supplierCode,
            unitCost: item.unitCost,
            remainingQuantity: 0
          });
        }
        const batch = batchMap.get(item.batchId)!;
        batch.remainingQuantity += item.quantity;
      }
    });

    // 2. Process exits
    items.forEach(item => {
      if (item.exitDate && !item.entryDate) {
        // It's an exit, deduct from the specific batch
        if (batchMap.has(item.batchId)) {
          const batch = batchMap.get(item.batchId)!;
          batch.remainingQuantity -= item.quantity;
        }
      }
    });

    // 3. Return only batches with positive stock
    return Array.from(batchMap.values()).filter(b => b.remainingQuantity > 0);
  }, [items]);

  const handleAddItem = (newItemData: Omit<InventoryItem, 'id'>) => {
    let batchId = newItemData.batchId;

    // If no batchId provided (it's a new Entry), generate one
    if (!batchId) {
      // Generate Batch ID logic: SupplierCode / Sequence / ProductCode
      // Find items from same supplier
      const supplierEntries = items.filter(i => i.supplierCode === newItemData.supplierCode && !!i.entryDate);
      
      // Find MAX sequence to ensure no duplicates if items were deleted
      let maxSeq = 0;
      supplierEntries.forEach(item => {
        const parts = item.batchId.split('/');
        if (parts.length === 3) {
           const seq = parseInt(parts[1], 10);
           if (!isNaN(seq) && seq > maxSeq) maxSeq = seq;
        }
      });

      const nextSequence = (maxSeq + 1).toString().padStart(3, '0');
      batchId = `${newItemData.supplierCode}/${nextSequence}/${newItemData.productCode}`;
    }

    const newItem: InventoryItem = {
      ...newItemData,
      id: crypto.randomUUID(),
      batchId: batchId,
      observations: newItemData.observations || ''
    };

    setItems(prev => [...prev, newItem]);
  };

  const handleDeleteItem = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este item?')) {
      setItems(prev => prev.filter(item => item.id !== id));
    }
  };

  const handleImportItems = (importedItems: InventoryItem[]) => {
    if (confirm(`Importar ${importedItems.length} itens? Isso irá substituir a lista atual.`)) {
      setItems(importedItems);
      alert('Dados carregados com sucesso!');
    }
  };

  const handleSaveAnalysis = (newAnalysis: ProductAnalysis) => {
    setAnalyses(prev => {
        // Filter out existing analysis for this batchId (if present) OR productCode (legacy support)
        const filtered = prev.filter(a => {
            if (newAnalysis.batchId) return a.batchId !== newAnalysis.batchId;
            return a.productCode !== newAnalysis.productCode;
        });
        return [...filtered, newAnalysis];
    });
  };

  // Registry Handlers
  const handleSaveSupplier = (entity: RegistryEntity) => {
    setSuppliers(prev => {
      const index = prev.findIndex(item => item.id === entity.id);
      if (index >= 0) {
        const updated = [...prev];
        updated[index] = entity;
        return updated;
      }
      return [...prev, entity];
    });
  };

  const handleDeleteSupplier = (id: string) => {
    if(confirm('Excluir fornecedor?')) setSuppliers(prev => prev.filter(s => s.id !== id));
  };

  const handleSaveClient = (entity: RegistryEntity) => {
    setClients(prev => {
      const index = prev.findIndex(item => item.id === entity.id);
      if (index >= 0) {
        const updated = [...prev];
        updated[index] = entity;
        return updated;
      }
      return [...prev, entity];
    });
  };

  const handleDeleteClient = (id: string) => {
    if(confirm('Excluir cliente?')) setClients(prev => prev.filter(c => c.id !== id));
  };
  
  const handleSaveProduct = (product: ProductEntity) => {
    setRegisteredProducts(prev => {
      const index = prev.findIndex(item => item.id === product.id);
      if (index >= 0) {
        const updated = [...prev];
        updated[index] = product;
        return updated;
      }
      return [...prev, product];
    });
  };
  
  const handleDeleteProduct = (id: string) => {
    if(confirm('Excluir produto?')) setRegisteredProducts(prev => prev.filter(p => p.id !== id));
  }

  // Helper date function for import
  const parseImportDate = (val: any): string => {
    if (!val) return '';
    if (val instanceof Date) {
        return val.toISOString().split('T')[0];
    }
    if (typeof val === 'string') {
        // Handle common formats if needed, usually YYYY-MM-DD or DD/MM/YYYY
        if(val.includes('/')) {
            const parts = val.split('/');
            // Assume DD/MM/YYYY
            if(parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
        }
        return val.split('T')[0];
    }
    return '';
  };

  // EXPORT FUNCTIONALITY: Single File with Multiple Tabs
  const handleExportAll = () => {
    const wb = XLSX.utils.book_new();

    // 1. Estoque_Atual (Snapshot)
    const stockData = (() => {
        const grouped: any = {};
        items.forEach(item => {
            const key = item.batchId || item.productCode;
            if (!grouped[key]) grouped[key] = { 
                productName: item.productName, 
                productCode: item.productCode,
                batchId: item.batchId,
                qty: 0, 
                unitCost: 0,
                observations: ''
            };

            const isEntry = !!item.entryDate;
            const isExit = !!item.exitDate && !item.entryDate;

            if (isEntry) {
                grouped[key].qty += item.quantity;
                grouped[key].unitCost = item.unitCost; // Entry defines cost
                if (item.observations) grouped[key].observations = item.observations;
            } else if (isExit) {
                grouped[key].qty -= item.quantity;
            }
        });

        return Object.values(grouped)
             .filter((g: any) => g.qty > 0.0001) // Filter out zero/negative stock
             .map((g: any) => {
             // Find analysis by Batch ID first
             const analysis = analyses.find(a => a.batchId === g.batchId) || 
                              analyses.find(a => !a.batchId && a.productCode === g.productCode) || 
                              {};
                              
             return {
                 'Lote': g.batchId,
                 'Produto': g.productName,
                 'Código': g.productCode,
                 'Saldo (Kg)': g.qty,
                 'V. Estimado': g.qty * g.unitCost,
                 'Cu (%)': (analysis as any).cu || 0,
                 'Zn (%)': (analysis as any).zn || 0,
                 'Mn (%)': (analysis as any).mn || 0,
                 'B (%)': (analysis as any).b || 0,
                 'Pb (%)': (analysis as any).pb || 0,
                 'Cd (ppm)': (analysis as any).cd || 0,
                 'H2O (%)': (analysis as any).h2o || 0,
                 '#35 (%)': (analysis as any).mesh35 || 0,
                 'Ret. (%)': (analysis as any).ret || 0,
                 'Observações': g.observations
             };
        });
    })();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(stockData), "Estoque_Atual");

    // Helper for transaction data - Updated to match requested column names EXACTLY
    const mapMovementWide = (i: InventoryItem) => ({
        'Data Entrada': i.entryDate,
        'Data Saida': i.exitDate,
        'Fornecedor': i.supplier,
        'codigo fornecedor': i.supplierCode,
        'Nome do Produto': i.productName,
        'codigo do produto': i.productCode,
        'Quantidade': i.quantity,
        'Lote': i.batchId, 
        'Valor Unitário': i.unitCost,
        'Observações': i.observations,
        'ID': i.id
    });

    // 2. Movimentacoes (Full Log in wide format)
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(items.map(mapMovementWide)), "Movimentacoes");

    // 3. Fornecedores (Explicit Registry Data)
    const suppliersExport = suppliers.map(s => ({
        'Cod. Fornecedor': s.code,
        'Nome Fornecedor': s.name,
        'Contato': s.contact,
        'CNPJ': s.cnpj,
        'I.E.': s.ie,
        'Estado': s.address.state,
        'Cidade': s.address.city,
        'Bairro': s.address.neighborhood,
        'Logradouro': s.address.street,
        'Numero': s.address.number,
        'CEP': s.address.zip,
        'Telefone': s.phone,
        'e-mail': s.email
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(suppliersExport), "Fornecedores");

    // 4. Clientes (Explicit Registry Data)
    const clientsExport = clients.map(c => ({
        'Cod. Cliente': c.code,
        'Nome Cliente': c.name,
        'Contato': c.contact,
        'CNPJ': c.cnpj,
        'I.E.': c.ie,
        'Estado': c.address.state,
        'Cidade': c.address.city,
        'Bairro': c.address.neighborhood,
        'Logradouro': c.address.street,
        'Numero': c.address.number,
        'CEP': c.address.zip,
        'Telefone': c.phone,
        'e-mail': c.email
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(clientsExport), "Clientes");

    // 5. Produtos (Explicit Registry Data)
    const productsExport = registeredProducts.map(p => ({
        'Nome Produto': p.name,
        'Codigo Produto': p.code
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(productsExport), "Produtos");

    // 6. Analises
    const analysesExport = analyses.map(a => {
         const match = items.find(i => i.batchId === a.batchId || i.productCode === a.productCode);
         return {
            'Lote': a.batchId || '-',
            'Produto': match ? match.productName : '-',
            'Código': a.productCode,
            'Cu (%)': a.cu, 'Zn (%)': a.zn, 'Mn (%)': a.mn, 'B (%)': a.b,
            'Pb (%)': a.pb, 'Cd (ppm)': a.cd, 'H2O (%)': a.h2o, '#35 (%)': a.mesh35, 'Ret. (%)': a.ret
         };
    });
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(analysesExport), "Analises");

    // Save File
    XLSX.writeFile(wb, "banco_dados_controle_estoque.xlsx");
  };

  // Keep logic for manual restore in case we add button back, but currently unused via sidebar
  const handleGlobalImport = (file: File) => {
    if (!confirm('ATENÇÃO: A importação irá substituir TODOS os dados atuais. Deseja continuar?')) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const buffer = evt.target?.result;
        if (!buffer) return;

        // Use read (array buffer) which is more robust than binary string in modern environments
        const wb = XLSX.read(buffer, { type: 'array', cellDates: true });

        // Case-insensitive sheet finder
        const findSheet = (names: string[]) => {
            const found = wb.SheetNames.find(n => names.some(name => name.toLowerCase() === n.toLowerCase()));
            return found ? wb.Sheets[found] : null;
        }

        // 1. Import Fornecedores
        const sheetSuppliers = findSheet(["Fornecedores"]);
        if (sheetSuppliers) {
           const raw = XLSX.utils.sheet_to_json(sheetSuppliers);
           const mapped: RegistryEntity[] = raw.map((r: any) => ({
               id: crypto.randomUUID(),
               code: (r['Cod. Fornecedor'] || '').toString().padStart(3, '0'),
               name: r['Nome Fornecedor'] || '',
               contact: r['Contato'] || '',
               cnpj: r['CNPJ'] || '',
               ie: r['I.E.'] || '',
               address: {
                  state: r['Estado'] || '',
                  city: r['Cidade'] || '',
                  neighborhood: r['Bairro'] || '',
                  street: r['Logradouro'] || '',
                  number: r['Numero'] || '',
                  zip: r['CEP'] || ''
               },
               phone: r['Telefone'] || '',
               email: r['e-mail'] || ''
           }));
           setSuppliers(mapped);
        }

        // 2. Import Clientes
        const sheetClients = findSheet(["Clientes"]);
        if (sheetClients) {
           const raw = XLSX.utils.sheet_to_json(sheetClients);
           const mapped: RegistryEntity[] = raw.map((r: any) => ({
               id: crypto.randomUUID(),
               code: (r['Cod. Cliente'] || '').toString().padStart(3, '0'),
               name: r['Nome Cliente'] || '',
               contact: r['Contato'] || '',
               cnpj: r['CNPJ'] || '',
               ie: r['I.E.'] || '',
               address: {
                  state: r['Estado'] || '',
                  city: r['Cidade'] || '',
                  neighborhood: r['Bairro'] || '',
                  street: r['Logradouro'] || '',
                  number: r['Numero'] || '',
                  zip: r['CEP'] || ''
               },
               phone: r['Telefone'] || '',
               email: r['e-mail'] || ''
           }));
           setClients(mapped);
        }

        // 3. Import Produtos
        const sheetProducts = findSheet(["Produtos"]);
        if (sheetProducts) {
           const raw = XLSX.utils.sheet_to_json(sheetProducts);
           const mapped: ProductEntity[] = raw.map((r: any) => ({
               id: crypto.randomUUID(),
               name: r['Nome Produto'] || '',
               code: (r['Codigo Produto'] || '').toString().padStart(3, '0')
           }));
           setRegisteredProducts(mapped);
        }

        // 4. Import Movimentacoes (Items)
        // Strictly look for Movimentacoes sheet. We do NOT load items from Estoque_Atual to avoid duplication/sync issues.
        // The Stock view will be CALCULATED from these movements.
        const movesSheet = findSheet(["Movimentacoes", "Entrada_Saida", "Movimentações"]);
        let loadedItems: InventoryItem[] = [];

        if (movesSheet) {
           const raw = XLSX.utils.sheet_to_json(movesSheet);
           loadedItems = raw.map((r: any) => ({
               id: r['ID'] || crypto.randomUUID(),
               batchId: r['Lote'] || '',
               productName: r['Nome do Produto'] || r['Produto'] || '',
               productCode: (r['codigo do produto'] || r['Código do Produto'] || r['Cód. Produto'] || '').toString().padStart(3, '0'),
               supplier: r['Fornecedor'] || r['Parceiro'] || '',
               supplierCode: (r['codigo fornecedor'] || r['Cód. Fornecedor'] || '').toString().padStart(3, '0'),
               quantity: Number(r['Quantidade'] || r['quanntidade'] || r['Qtd'] || 0),
               unitCost: Number(r['Valor Unitário'] || r['Valor Unit.'] || 0),
               unitPrice: 0,
               entryDate: parseImportDate(r['Data Entrada']),
               exitDate: parseImportDate(r['Data Saida'] || r['Data Saída']),
               observations: r['Observações'] || ''
           }));
           setItems(loadedItems);
        } else {
            console.warn("Aba de Movimentações não encontrada. O estoque pode ficar zerado se não houver histórico.");
        }

        // 5. Import Analises (can come from 'Analises' or 'Estoque_Atual')
        let loadedAnalyses: ProductAnalysis[] = [];
        const analysisSheet = findSheet(["Analises"]);
        if (analysisSheet) {
           const raw = XLSX.utils.sheet_to_json(analysisSheet);
           loadedAnalyses = raw.map((r: any) => ({
               batchId: r['Lote'] === '-' ? '' : (r['Lote'] || ''),
               productCode: (r['Código'] || '').toString().padStart(3, '0'),
               cu: Number(r['Cu (%)'] || 0),
               zn: Number(r['Zn (%)'] || 0),
               mn: Number(r['Mn (%)'] || 0),
               b: Number(r['B (%)'] || 0),
               pb: Number(r['Pb (%)'] || 0),
               cd: Number(r['Cd (ppm)'] || 0),
               h2o: Number(r['H2O (%)'] || 0),
               mesh35: Number(r['#35 (%)'] || 0),
               ret: Number(r['Ret. (%)'] || 0)
           }));
           setAnalyses(loadedAnalyses);
        }

        // 6. Update Analyses from Estoque_Atual if present (User might edit analysis there)
        const currentStockSheet = findSheet(["Estoque_Atual", "Estoque Atual", "Dado Atual"]);
        if (currentStockSheet) {
             const raw = XLSX.utils.sheet_to_json(currentStockSheet);
             
             const stockAnalyses: ProductAnalysis[] = raw.map((r: any) => ({
                 batchId: r['Lote'] === '-' ? '' : (r['Lote'] || ''),
                 productCode: (r['Código'] || '').toString().padStart(3, '0'),
                 cu: Number(r['Cu (%)'] || 0),
                 zn: Number(r['Zn (%)'] || 0),
                 mn: Number(r['Mn (%)'] || 0),
                 b: Number(r['B (%)'] || 0),
                 pb: Number(r['Pb (%)'] || 0),
                 cd: Number(r['Cd (ppm)'] || 0),
                 h2o: Number(r['H2O (%)'] || 0),
                 mesh35: Number(r['#35 (%)'] || 0),
                 ret: Number(r['Ret. (%)'] || 0)
             }));
             
             // If valid analyses found in Estoque_Atual, they take precedence or merge
             if (stockAnalyses.length > 0) {
                 setAnalyses(stockAnalyses);
             }
        }

        if (loadedItems.length === 0) {
            alert('Aviso: Nenhuma movimentação foi encontrada nas abas "Movimentacoes" ou "Entrada_Saida". O estoque foi recalculado e pode estar vazio.');
        } else {
            alert(`Sucesso! Carregados ${loadedItems.length} registros de movimentação.`);
        }

      } catch(error) {
        console.error("Erro na importação:", error);
        alert("Erro ao importar o arquivo. Verifique o formato.");
      }
    };
    // Use readAsArrayBuffer for maximum compatibility
    reader.readAsArrayBuffer(file);
  };

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard items={items} />;
      case 'entry':
        return (
          <EntryForm 
            onAdd={handleAddItem} 
            existingItems={items} 
            availableBatches={batchesWithStock} 
            suppliers={suppliers}
            clients={clients}
            registeredProducts={registeredProducts}
            onNavigateToRegistry={(view) => setCurrentView(view)}
          />
        );
      case 'list':
        return (
          <InventoryTable 
            items={items} 
            onDelete={handleDeleteItem} 
          />
        );
      case 'stock':
        return <CurrentStockTable items={items} analyses={analyses} />;
      case 'analysis':
        return <AnalysisForm items={items} currentAnalyses={analyses} onSave={handleSaveAnalysis} />;
      case 'suppliers':
        return <EntityRegistry type="supplier" data={suppliers} onSave={handleSaveSupplier} onDelete={handleDeleteSupplier} />;
      case 'clients':
        return <EntityRegistry type="client" data={clients} onSave={handleSaveClient} onDelete={handleDeleteClient} />;
      case 'products':
        return <ProductRegistry data={registeredProducts} onSave={handleSaveProduct} onDelete={handleDeleteProduct} />;
      default:
        return (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 bg-gray-50">
               <h1 className="text-3xl font-bold mb-2 uppercase text-green-900">{currentView}</h1>
               <p>Módulo em desenvolvimento</p>
            </div>
        );
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar 
        currentView={currentView} 
        setView={setCurrentView} 
        onExport={handleExportAll} 
      />
      <main className="ml-64 w-full transition-all duration-300">
        {renderContent()}
      </main>
    </div>
  );
}

export default App;
