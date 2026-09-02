import axios from 'axios';
import {
  AuthResponse,
  User,
  Product,
  Category,
  Warehouse,
  Supplier,
  InventoryStock,
  StockTransaction,
  PurchaseOrder,
  DashboardSummary,
  ChartData,
  RecentActivity,
  ApiResponse,
  PagedResponse
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request Interceptor: Attach JWT Token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('swims_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle 401 Global Logout
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const token = localStorage.getItem('swims_token');
      if (token && token !== 'demo-token-jwt') {
        localStorage.removeItem('swims_token');
        localStorage.removeItem('swims_user');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login?session_expired=true';
        }
      }
    }
    return Promise.reject(error);
  }
);

// ==========================================
// AUTH API
// ==========================================
export const authApi = {
  login: async (credentials: { email: string; password: string }): Promise<AuthResponse> => {
    const res = await apiClient.post<ApiResponse<AuthResponse>>('/auth/login', credentials);
    return res.data.data;
  },
  register: async (payload: any): Promise<User> => {
    const res = await apiClient.post<ApiResponse<User>>('/auth/register', payload);
    return res.data.data;
  },
  getMe: async (): Promise<User> => {
    const res = await apiClient.get<ApiResponse<User>>('/auth/me');
    return res.data.data;
  },
  forgotPassword: async (email: string): Promise<{ message: string; otpCode?: string; expiresInMinutes?: number }> => {
    const res = await apiClient.post<ApiResponse<{ message: string; otpCode?: string; expiresInMinutes?: number }>>('/auth/forgot-password', { email });
    return res.data.data || { message: res.data.message };
  },
  resendOtp: async (email: string): Promise<{ message: string; otpCode?: string; expiresInMinutes?: number }> => {
    const res = await apiClient.post<ApiResponse<{ message: string; otpCode?: string; expiresInMinutes?: number }>>('/auth/resend-otp', { email });
    return res.data.data || { message: res.data.message };
  },
  verifyOtp: async (payload: { email: string; otpCode: string }): Promise<boolean> => {
    const res = await apiClient.post<ApiResponse<boolean>>('/auth/verify-otp', payload);
    return res.data.data;
  },
  resetPassword: async (payload: any): Promise<string> => {
    const res = await apiClient.post<ApiResponse<string>>('/auth/reset-password', payload);
    return res.data.message;
  },
  logout: async (): Promise<void> => {
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // Ignore
    } finally {
      localStorage.removeItem('swims_token');
      localStorage.removeItem('swims_user');
    }
  }
};

// ==========================================
// DASHBOARD API
// ==========================================
export const dashboardApi = {
  getSummary: async (): Promise<DashboardSummary> => {
    const res = await apiClient.get<ApiResponse<DashboardSummary>>('/dashboard/summary');
    return res.data.data;
  },
  getCharts: async (months: number = 6): Promise<ChartData> => {
    const res = await apiClient.get<ApiResponse<ChartData>>('/dashboard/charts', { params: { months } });
    return res.data.data;
  },
  getRecentActivities: async (): Promise<RecentActivity[]> => {
    const res = await apiClient.get<ApiResponse<RecentActivity[]>>('/dashboard/recent-activities');
    return res.data.data;
  }
};

// ==========================================
// REAL-TIME CURRENCY EXCHANGE API
// ==========================================
export const currencyApi = {
  getUsdIdrRate: async (): Promise<{ rate: number; isLive: boolean; lastUpdated: string }> => {
    try {
      const res = await fetch('https://open.er-api.com/v6/latest/USD');
      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      if (data && data.rates && data.rates.IDR) {
        return {
          rate: Number(data.rates.IDR),
          isLive: true,
          lastUpdated: data.time_last_update_utc ? new Date(data.time_last_update_utc).toLocaleDateString('id-ID') : 'Hari ini'
        };
      }
      throw new Error('Invalid data');
    } catch {
      return {
        rate: 16250,
        isLive: false,
        lastUpdated: 'Kurs Acuan Default'
      };
    }
  }
};

// ==========================================
// PRODUCTS API
// ==========================================
export const productsApi = {
  getAll: async (params?: any): Promise<PagedResponse<Product>> => {
    const res = await apiClient.get<PagedResponse<Product>>('/products', { params });
    return res.data;
  },
  getById: async (id: number): Promise<Product> => {
    const res = await apiClient.get<ApiResponse<Product>>(`/products/${id}`);
    return res.data.data;
  },
  create: async (data: any): Promise<Product> => {
    const res = await apiClient.post<ApiResponse<Product>>('/products', data);
    return res.data.data;
  },
  update: async (id: number, data: any): Promise<Product> => {
    const res = await apiClient.put<ApiResponse<Product>>(`/products/${id}`, data);
    return res.data.data;
  },
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/products/${id}`);
  }
};

// ==========================================
// CATEGORIES API
// ==========================================
export const categoriesApi = {
  getAll: async (search?: string): Promise<Category[]> => {
    const res = await apiClient.get<ApiResponse<Category[]>>('/categories', { params: { search } });
    return res.data.data;
  },
  getById: async (id: number): Promise<Category> => {
    const res = await apiClient.get<ApiResponse<Category>>(`/categories/${id}`);
    return res.data.data;
  },
  create: async (data: any): Promise<Category> => {
    const res = await apiClient.post<ApiResponse<Category>>('/categories', data);
    return res.data.data;
  },
  update: async (id: number, data: any): Promise<Category> => {
    const res = await apiClient.put<ApiResponse<Category>>(`/categories/${id}`, data);
    return res.data.data;
  },
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/categories/${id}`);
  }
};

// ==========================================
// WAREHOUSES API
// ==========================================
export const warehousesApi = {
  getAll: async (params?: any): Promise<PagedResponse<Warehouse>> => {
    const res = await apiClient.get<PagedResponse<Warehouse>>('/warehouses', { params });
    return res.data;
  },
  getById: async (id: number): Promise<Warehouse> => {
    const res = await apiClient.get<ApiResponse<Warehouse>>(`/warehouses/${id}`);
    return res.data.data;
  },
  create: async (data: any): Promise<Warehouse> => {
    const res = await apiClient.post<ApiResponse<Warehouse>>('/warehouses', data);
    return res.data.data;
  },
  update: async (id: number, data: any): Promise<Warehouse> => {
    const res = await apiClient.put<ApiResponse<Warehouse>>(`/warehouses/${id}`, data);
    return res.data.data;
  },
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/warehouses/${id}`);
  }
};

// ==========================================
// SUPPLIERS API
// ==========================================
export const suppliersApi = {
  getAll: async (params?: any): Promise<PagedResponse<Supplier>> => {
    const res = await apiClient.get<PagedResponse<Supplier>>('/suppliers', { params });
    return res.data;
  },
  getById: async (id: number): Promise<Supplier> => {
    const res = await apiClient.get<ApiResponse<Supplier>>(`/suppliers/${id}`);
    return res.data.data;
  },
  create: async (data: any): Promise<Supplier> => {
    const res = await apiClient.post<ApiResponse<Supplier>>('/suppliers', data);
    return res.data.data;
  },
  update: async (id: number, data: any): Promise<Supplier> => {
    const res = await apiClient.put<ApiResponse<Supplier>>(`/suppliers/${id}`, data);
    return res.data.data;
  },
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/suppliers/${id}`);
  }
};

// ==========================================
// INVENTORY & STOCK API
// ==========================================
export const inventoryApi = {
  getStocks: async (params?: any): Promise<PagedResponse<InventoryStock>> => {
    const res = await apiClient.get<PagedResponse<InventoryStock>>('/inventory', { params });
    return res.data;
  },
  getLowStock: async (): Promise<InventoryStock[]> => {
    const res = await apiClient.get<ApiResponse<InventoryStock[]>>('/inventory/low-stock');
    return res.data.data;
  },
  adjustStock: async (data: { productId: number; warehouseId: number; binLocation: string; newQuantityOnHand: number; reason: string }): Promise<InventoryStock> => {
    const res = await apiClient.post<ApiResponse<InventoryStock>>('/inventory/adjust', data);
    return res.data.data;
  },
  transferStock: async (data: { productId: number; sourceWarehouseId: number; targetWarehouseId: number; sourceBinLocation?: string; targetBinLocation?: string; quantity: number; notes?: string }): Promise<any> => {
    const res = await apiClient.post<ApiResponse<any>>('/inventory/transfer', data);
    return res.data.data;
  }
};

// ==========================================
// TRANSACTIONS API
// ==========================================
export const transactionsApi = {
  getAll: async (params?: any): Promise<PagedResponse<StockTransaction>> => {
    const res = await apiClient.get<PagedResponse<StockTransaction>>('/stocktransactions', { params });
    return res.data;
  },
  getById: async (id: number): Promise<StockTransaction> => {
    const res = await apiClient.get<ApiResponse<StockTransaction>>(`/stocktransactions/${id}`);
    return res.data.data;
  },
  create: async (data: { transactionType: 'INBOUND' | 'OUTBOUND'; productId: number; warehouseId: number; binLocation: string; quantity: number; notes?: string; documentUrl?: string }): Promise<StockTransaction> => {
    const res = await apiClient.post<ApiResponse<StockTransaction>>('/stocktransactions', data);
    return res.data.data;
  }
};

// ==========================================
// PURCHASE ORDERS API
// ==========================================
export const purchaseOrdersApi = {
  getAll: async (params?: any): Promise<PagedResponse<PurchaseOrder>> => {
    const res = await apiClient.get<PagedResponse<PurchaseOrder>>('/purchaseorders', { params });
    return res.data;
  },
  getById: async (id: number): Promise<PurchaseOrder> => {
    const res = await apiClient.get<ApiResponse<PurchaseOrder>>(`/purchaseorders/${id}`);
    return res.data.data;
  },
  create: async (data: any): Promise<PurchaseOrder> => {
    const res = await apiClient.post<ApiResponse<PurchaseOrder>>('/purchaseorders', data);
    return res.data.data;
  },
  updateStatus: async (id: number, status: string): Promise<any> => {
    const res = await apiClient.patch<ApiResponse<any>>(`/purchaseorders/${id}/status`, { status });
    return res.data.data;
  },
  receivePO: async (id: number, data: { targetWarehouseId: number; binLocation: string; notes?: string }): Promise<any> => {
    const res = await apiClient.post<ApiResponse<any>>(`/purchaseorders/${id}/receive`, data);
    return res.data.data;
  }
};

// ==========================================
// USERS API
// ==========================================
export const usersApi = {
  getAll: async (params?: any): Promise<PagedResponse<User>> => {
    const res = await apiClient.get<PagedResponse<User>>('/users', { params });
    return res.data;
  },
  getRoles: async (): Promise<any[]> => {
    const res = await apiClient.get<ApiResponse<any[]>>('/users/roles');
    return res.data.data;
  },
  getById: async (id: number): Promise<User> => {
    const res = await apiClient.get<ApiResponse<User>>(`/users/${id}`);
    return res.data.data;
  },
  create: async (data: any): Promise<User> => {
    const res = await apiClient.post<ApiResponse<User>>('/users', data);
    return res.data.data;
  },
  update: async (id: number, data: any): Promise<User> => {
    const res = await apiClient.put<ApiResponse<User>>(`/users/${id}`, data);
    return res.data.data;
  },
  updateProfile: async (data: any): Promise<User> => {
    const res = await apiClient.put<ApiResponse<User>>('/users/profile', data);
    return res.data.data;
  },
  changePassword: async (data: any): Promise<string> => {
    const res = await apiClient.post<ApiResponse<string>>('/users/change-password', data);
    return res.data.message;
  }
};

// ==========================================
// UPLOADS API
// ==========================================
export const uploadsApi = {
  uploadImage: async (file: File, folder: string = 'products'): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await apiClient.post<ApiResponse<{ fileUrl: string }>>(`/uploads/image?folder=${folder}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data.data.fileUrl;
  },
  uploadDocument: async (file: File, folder: string = 'documents'): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await apiClient.post<ApiResponse<{ fileUrl: string }>>(`/uploads/document?folder=${folder}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data.data.fileUrl;
  }
};
