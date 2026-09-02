export interface User {
  id: number;
  email: string;
  fullName: string;
  role: string;
  roleName?: string;
  roleCode: string;
  phoneNumber?: string;
  department?: string;
  avatarUrl?: string;
  address?: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  user: User;
}

export interface Product {
  id: number;
  sku: string;
  barcode: string;
  name: string;
  description?: string;
  unitPrice: number;
  costPrice: number;
  reorderLevel: number;
  minStock: number;
  maxStock: number;
  unitOfMeasure: string;
  categoryId: number;
  categoryName: string;
  imageUrl?: string;
  totalStockOnHand: number;
  totalStockAvailable?: number;
  totalAvailableQuantity?: number;
  totalAllocatedQuantity?: number;
  isActive?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface Category {
  id: number;
  name: string;
  code: string;
  description?: string;
  parentCategoryId?: number;
  parentCategoryName?: string;
  productCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Warehouse {
  id: number;
  code: string;
  name: string;
  address: string;
  city: string;
  capacitySqm: number;
  managerId?: number;
  managerName?: string;
  isActive: boolean;
  totalProductsStored: number;
  totalUnitsStored: number;
  createdAt: string;
  updatedAt: string;
}

export interface Supplier {
  id: number;
  code: string;
  name: string;
  contactName: string;
  email: string;
  phone: string;
  address: string;
  taxId?: string;
  rating: number;
  isActive: boolean;
  totalPurchaseOrders: number;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryStock {
  id: number;
  productId: number;
  productSku: string;
  productName: string;
  productImageUrl?: string;
  unitOfMeasure: string;
  reorderLevel: number;
  warehouseId: number;
  warehouseCode: string;
  warehouseName: string;
  binLocation: string;
  quantityOnHand: number;
  quantityAllocated: number;
  quantityAvailable: number;
  isLowStock: boolean;
  lastCountedAt?: string;
  updatedAt: string;
}

export interface StockTransaction {
  id: number;
  referenceNumber: string;
  transactionType: 'INBOUND' | 'OUTBOUND' | 'TRANSFER' | 'ADJUSTMENT';
  productId: number;
  productSku: string;
  productName: string;
  sourceWarehouseId?: number;
  sourceWarehouseName?: string;
  targetWarehouseId?: number;
  targetWarehouseName?: string;
  quantity: number;
  notes?: string;
  documentUrl?: string;
  createdByUserId: number;
  createdByUserName: string;
  createdAt: string;
}

export interface PurchaseOrderItem {
  id: number;
  productId: number;
  productSku: string;
  productName: string;
  unitOfMeasure: string;
  orderedQuantity: number;
  receivedQuantity: number;
  unitCost: number;
  subtotal: number;
  notes?: string;
}

export interface PurchaseOrder {
  id: number;
  poNumber: string;
  supplierId: number;
  supplierName: string;
  supplierEmail: string;
  orderDate: string;
  expectedDeliveryDate?: string;
  status: 'DRAFT' | 'PENDING' | 'APPROVED' | 'RECEIVED' | 'CANCELLED';
  totalAmount: number;
  notes?: string;
  documentUrl?: string;
  createdByUserId: number;
  createdByUserName: string;
  items: PurchaseOrderItem[];
  createdAt: string;
  updatedAt: string;
}

export interface DashboardSummary {
  totalProducts: number;
  totalStockQuantity: number;
  totalStockValue: number;
  lowStockCount: number;
  outOfStockCount: number;
  totalWarehouses: number;
  totalSuppliers: number;
  activePurchaseOrders: number;
  monthlyInboundCount: number;
  monthlyOutboundCount: number;
}

export interface CategoryStockDistribution {
  categoryName: string;
  totalItems: number;
  totalValue: number;
}

export interface ChartData {
  months: string[];
  inboundData: number[];
  outboundData: number[];
  categoryDistribution: CategoryStockDistribution[];
}

export interface RecentActivity {
  id: number;
  referenceNumber: string;
  transactionType: string;
  productName: string;
  quantity: number;
  warehouseInfo: string;
  performedBy: string;
  createdAt: string;
}

export interface PaginationMeta {
  currentPage: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPrevious: boolean;
  hasNext: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
  errors?: Record<string, string[]>;
}

export interface PagedResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T[];
  meta: PaginationMeta;
}
