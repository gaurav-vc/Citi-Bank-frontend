import { api } from './client';

export interface Item {
  id: string;
  name: string;
  type: string;
  category: string;
  uom: string;
  min_stock_level: number;
  reorder_level: number;
  current_stock: number;
  preferred_vendor: string;
  unit_price: number;
}

export interface GRN {
  id: string;
  po_id: string;
  received_date: string;
  received_by: string;
  items: any[];
  status: string;
  invoice_status: string;
  vendor_name: string;
  invoice_number: string;
  remarks: string;
  attachments?: any[];
  created_at?: string;
}

export interface StockTransfer {
  id: string;
  from_location: string;
  to_location: string;
  items: any[];
  requested_by: string;
  requested_date: string;
  status: string;
  approved_by?: string;
  transfer_date?: string;
  reason?: string;
}

export interface MaterialIssue {
  id: string;
  items: any[];
  issued_to: string;
  issued_date: string;
  tower: string;
  floor: string;
  purpose: string;
  status: string;
  department?: string;
  work_order_ref?: string;
  issued_by?: string;
}

export interface ScrapDisposal {
  id: string;
  items: any[];
  total_value: number;
  disposal_date: string;
  buyer: string;
  status: string;
  gate_pass_no?: string;
  recovered_value?: number;
}

export interface ProductInspection {
  id: string;
  po_id: string;
  vendor_name: string;
  received_date: string;
  inspector_name: string;
  items: any[];
  status: string;
  challan_number?: string;
  invoice_number?: string;
  invoice_date?: string;
  remarks?: string;
}

export const inventoryAPI = {
  // Items Master
  getItems: async (): Promise<Item[]> => {
    const response = await api.get('items/');
    return Array.isArray(response) ? response : (response?.results ?? []);
  },
  createItem: async (data: Partial<Item>): Promise<Item> => {
    const response = await api.post('items/', data);
    return response;
  },
  updateItem: async (id: string, data: Partial<Item>): Promise<Item> => {
    const response = await api.patch(`items/${id}/`, data);
    return response;
  },
  deleteItem: async (id: string): Promise<void> => {
    await api.delete(`items/${id}/`);
  },

  // Stock / Ledger
  getStockLedger: async (): Promise<any[]> => {
    // Uses the custom mapped view that returns currentStock, minStockLevel, etc.
    const response = await api.get('stock/');
    return Array.isArray(response) ? response : (response?.results ?? []);
  },
  addStock: async (data: any): Promise<any> => {
    const response = await api.post('inventory/add-stock/', data);
    return response;
  },
  getHistory: async (itemId: string): Promise<any> => {
    const response = await api.get(`inventory/${itemId}/history/`);
    return Array.isArray(response) ? response : (response?.results ?? []);
  },

  // GRNs
  getGRNs: async (): Promise<GRN[]> => {
    const response = await api.get('grns/');
    return Array.isArray(response) ? response : (response?.results ?? []);
  },
  getPurchaseOrders: async (): Promise<any[]> => {
    const response = await api.get('orders/');
    return Array.isArray(response) ? response : (response?.results ?? []);
  },
  getGRNById: async (id: string): Promise<GRN> => {
    const response = await api.get(`grns/${id}/`);
    return response;
  },
  createGRN: async (data: Partial<GRN>): Promise<GRN> => {
    const response = await api.post('grns/', data);
    return response;
  },
  processGRNAction: async (id: string, data: any): Promise<any> => {
    const response = await api.post(`grns/${id}/action/`, data);
    return response;
  },

  // Stock Transfers
  getTransfers: async (): Promise<StockTransfer[]> => {
    const response = await api.get('transfers/');
    return Array.isArray(response) ? response : (response?.results ?? []);
  },
  createTransfer: async (data: Partial<StockTransfer>): Promise<StockTransfer> => {
    const response = await api.post('transfers/', data);
    return response;
  },
  updateTransfer: async (id: string, data: Partial<StockTransfer>): Promise<StockTransfer> => {
    const response = await api.patch(`transfers/${id}/`, data);
    return response;
  },

  // Material Issues / GDN
  getIssues: async (): Promise<MaterialIssue[]> => {
    const response = await api.get('issues/');
    return Array.isArray(response) ? response : (response?.results ?? []);
  },
  createIssue: async (data: Partial<MaterialIssue>): Promise<MaterialIssue> => {
    const response = await api.post('issues/', data);
    return response;
  },
  updateIssue: async (id: string, data: Partial<MaterialIssue>): Promise<MaterialIssue> => {
    const response = await api.patch(`issues/${id}/`, data);
    return response;
  },

  // Scrap Disposal
  getScraps: async (): Promise<ScrapDisposal[]> => {
    const response = await api.get('scrap/');
    return Array.isArray(response) ? response : (response?.results ?? []);
  },
  createScrap: async (data: Partial<ScrapDisposal>): Promise<ScrapDisposal> => {
    const response = await api.post('scrap/', data);
    return response;
  },
  updateScrap: async (id: string, data: Partial<ScrapDisposal>): Promise<ScrapDisposal> => {
    const response = await api.patch(`scrap/${id}/`, data);
    return response;
  },

  // Product Inspections
  getInspections: async (): Promise<ProductInspection[]> => {
    const response = await api.get('inspections/');
    return Array.isArray(response) ? response : (response?.results ?? []);
  },
  createInspection: async (data: Partial<ProductInspection>): Promise<ProductInspection> => {
    const response = await api.post('inspections/', data);
    return response;
  },
};
