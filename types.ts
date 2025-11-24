
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
}

export interface ProductAnalysis {
  batchId?: string; // Added to support analysis per batch
  productCode: string;
  cu: number;
  zn: number;
  mn: number;
  b: number;
  pb: number;
  cd: number; // ppm
  h2o: number;
  mesh35: number;
  ret: number;
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

export type ViewState = 'dashboard' | 'entry' | 'list' | 'stock' | 'settings' | 'suppliers' | 'clients' | 'products' | 'operations' | 'analysis' | 'processes';

export interface DashboardStats {
  totalStock: number;
  totalCost: number;
  revenue: number;
  profit: number;
}