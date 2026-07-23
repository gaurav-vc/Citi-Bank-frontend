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
    const response = await api.get('/inventory/items/');
    return Array.isArray(response.data) ? response.data : (response.data?.results ?? []);
  },
  createItem: async (data: Partial<Item>): Promise<Item> => {
    const response = await api.post('/inventory/items/', data);
    return response.data;
  },
  updateItem: async (id: string, data: Partial<Item>): Promise<Item> => {
    const response = await api.patch(`/inventory/items/${id}/`, data);
    return response.data;
  },
  deleteItem: async (id: string): Promise<void> => {
    await api.delete(`/inventory/items/${id}/`);
  },

  // Stock / Ledger
  getStockLedger: async (): Promise<any[]> => {
    // Uses the custom mapped view that returns currentStock, minStockLevel, etc.
    const response = await api.get('/stock/');
    return Array.isArray(response.data) ? response.data : (response.data?.results ?? []);
  },
  addStock: async (data: any): Promise<any> => {
    const response = await api.post('/inventory/add-stock/', data);
    return response.data;
  },
  getHistory: async (itemId: string): Promise<any> => {
    const response = await api.get(`/inventory/${itemId}/history/`);
    return Array.isArray(response.data) ? response.data : (response.data?.results ?? []);
  },

  // GRNs
  getGRNs: async (): Promise<GRN[]> => {
    const response = await api.get('/inventory/grns/');
    return Array.isArray(response.data) ? response.data : (response.data?.results ?? []);
  },
  getPurchaseOrders: async (): Promise<any[]> => {
    const response = await api.get('/orders/');
    return Array.isArray(response.data) ? response.data : (response.data?.results ?? []);
  },
  getGRNById: async (id: string): Promise<GRN> => {
    const response = await api.get(`/inventory/grns/${id}/`);
    return response.data;
  },
  createGRN: async (data: Partial<GRN>): Promise<GRN> => {
    const response = await api.post('/inventory/grns/', data);
    return response.data;
  },
  processGRNAction: async (id: string, data: any): Promise<any> => {
    const response = await api.post(`/inventory/grns/${id}/action/`, data);
    return response.data;
  },

  // Stock Transfers
  getTransfers: async (): Promise<StockTransfer[]> => {
    const response = await api.get('/inventory/transfers/');
    return Array.isArray(response.data) ? response.data : (response.data?.results ?? []);
  },
  createTransfer: async (data: Partial<StockTransfer>): Promise<StockTransfer> => {
    const response = await api.post('/inventory/transfers/', data);
    return response.data;
  },
  updateTransfer: async (id: string, data: Partial<StockTransfer>): Promise<StockTransfer> => {
    const response = await api.patch(`/inventory/transfers/${id}/`, data);
    return response.data;
  },

  // Material Issues / GDN
  getIssues: async (): Promise<MaterialIssue[]> => {
    const response = await api.get('/inventory/issues/');
    return Array.isArray(response.data) ? response.data : (response.data?.results ?? []);
  },
  createIssue: async (data: Partial<MaterialIssue>): Promise<MaterialIssue> => {
    const response = await api.post('/inventory/issues/', data);
    return response.data;
  },
  updateIssue: async (id: string, data: Partial<MaterialIssue>): Promise<MaterialIssue> => {
    const response = await api.patch(`/inventory/issues/${id}/`, data);
    return response.data;
  },

  // Scrap Disposal
  getScraps: async (): Promise<ScrapDisposal[]> => {
    const response = await api.get('/inventory/scrap/');
    return Array.isArray(response.data) ? response.data : (response.data?.results ?? []);
  },
  createScrap: async (data: Partial<ScrapDisposal>): Promise<ScrapDisposal> => {
    const response = await api.post('/inventory/scrap/', data);
    return response.data;
  },
  updateScrap: async (id: string, data: Partial<ScrapDisposal>): Promise<ScrapDisposal> => {
    const response = await api.patch(`/inventory/scrap/${id}/`, data);
    return response.data;
  },

  // Product Inspections
  getInspections: async (): Promise<ProductInspection[]> => {
    const response = await api.get('/inventory/inspections/');
    return Array.isArray(response.data) ? response.data : (response.data?.results ?? []);
  },
  createInspection: async (data: Partial<ProductInspection>): Promise<ProductInspection> => {
    const response = await api.post('/inventory/inspections/', data);
    return response.data;
  },
};
