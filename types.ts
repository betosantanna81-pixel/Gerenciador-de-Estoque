
export interface InventoryItem {
  id: string;
  entryDate: string;
  exitDate: string; // Optional or empty string if currently in stock
  supplier: string;
  supplierCode: string; // 3 digits
  productName: string;
  productCode: string; // 3 digits
  quantity: number;
  batchId: string; // Calculated: SupplierCode/XXX/ProductCode
  
  // Financials (Implicitly needed for the dashboard shown in image)
  unitCost: number;
  unitPrice: number;
  
  observations?: string; // New field for notes
  isService?: boolean; // Flag to identify M.O. (Mão de Obra) items
}

export interface ProductAnalysis {
  batchId?: string; // Added to support analysis per batch
  productCode: string;
  
  // Agua Régia
  cu_ar: number;
  zn_ar: number;

  // HCL
  cu_hcl: number;
  zn_hcl: number;
  mn: number; // Mn (%)
  b: number;  // B (%)

  // 2º Extrator
  cu_2: number;
  zn_2: number;
  mn_2: number;
  b_2: number;

  // Contaminantes
  pb: number;
  fe: number; 
  cd: number; // ppm

  // Outros
  h2o: number;
  mesh35: number;
  ret: number;
  
  // Legacy support (optional)
  cu?: number;
  zn?: number;
}

export interface RegistryEntity {
  id: string;
  code: string; // 3 digits
  name: string;
  contact: string;
  cnpj: string;
  ie: string;
  address: {
    state: string;
    city: string;
    neighborhood: string;
    street: string;
    number: string;
    zip: string;
  };
  phone: string;
  email: string;
}

export interface ProductEntity {
  id: string;
  name: string;
  code: string; // 3 digits
}

export interface ServiceEntity {
  id: string;
  name: string;
  code: string; // 3 digits
  defaultPrice?: number;
}

export interface ProductionOrder {
  id: string;
  date: string;
  sourceBatchId: string;
  sourceProduct: string;
  sourceIsService: boolean; // Added to track source type
  processedQuantity: number;
  supplier: string;
  supplierCode: string;
  outputs: {
    productName: string;
    productCode: string;
    quantity: number;
    newBatchId: string;
    destinationIsService: boolean; // Added to track output destination
    unitCost: number; // Added to track cost of generated item
  }[];
  loss: number;
}

export type ViewState = 'dashboard' | 'entry' | 'list' | 'stock' | 'settings' | 'suppliers' | 'clients' | 'products' | 'operations' | 'analysis' | 'processes' | 'production_orders' | 'stock_mo' | 'billing_mo' | 'services_registry' | 'mo_return';

export interface DashboardStats {
  totalStock: number;
  totalCost: number;
  revenue: number;
  profit: number;
}
