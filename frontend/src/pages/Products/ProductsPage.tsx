import React, { useEffect, useState, useCallback } from 'react';
import { productsApi, categoriesApi } from '../../services/api';
import { Product, Category, PaginationMeta } from '../../types';
import { DataTable, Column, FilterOption } from '../../components/DataTable';
import { Modal } from '../../components/Modal';
import { ConfirmModal } from '../../components/ConfirmModal';
import { FileUpload } from '../../components/FileUpload';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { Plus, Edit2, Trash2, Eye, Package, AlertCircle } from 'lucide-react';
import { exportToExcel, ExportColumn } from '../../utils/export';

export const ProductsPage: React.FC = () => {
  const { user } = useAuth();
  const canManage = user?.roleCode === 'ROLE_ADMIN' || user?.roleCode === 'ROLE_MANAGER';

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({
    currentPage: 1,
    pageSize: 10,
    totalCount: 0,
    totalPages: 0,
    hasPrevious: false,
    hasNext: false
  });

  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState<string | number>('');
  const [status, setStatus] = useState<string>('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    sku: '',
    barcode: '',
    name: '',
    description: '',
    unitPrice: 0,
    costPrice: 0,
    reorderLevel: 10,
    minStock: 5,
    maxStock: 1000,
    unitOfMeasure: 'PCS',
    categoryId: 0,
    imageUrl: ''
  });

  const toast = useToast();

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await productsApi.getAll({
        page: meta.currentPage,
        limit: meta.pageSize,
        search,
        categoryId: categoryId ? Number(categoryId) : undefined,
        status: status || undefined,
        sortBy,
        sortDir
      });
      setProducts(res.data);
      setMeta(res.meta);
    } catch {
      // Mock Fallback Products
      const fallbackProducts: Product[] = [
        {
          id: 1,
          sku: 'SKU-ELEC-001',
          barcode: '899123456001',
          name: 'Server Enterprise SSD NVMe 1.92TB Gen4',
          description: 'Enterprise grade solid-state drive U.2 PCIe 4.0 x4 high endurance.',
          unitPrice: 4850000,
          costPrice: 3800000,
          totalStockOnHand: 45,
          totalAllocatedQuantity: 5,
          totalAvailableQuantity: 40,
          reorderLevel: 10,
          minStock: 5,
          maxStock: 200,
          unitOfMeasure: 'UNIT',
          isActive: true,
          categoryId: 1,
          categoryName: 'Komponen Elektronik',
          createdAt: new Date().toISOString()
        },
        {
          id: 2,
          sku: 'SKU-ELEC-002',
          barcode: '899123456002',
          name: 'RAM Server DDR4 ECC Registered 64GB 3200MHz',
          description: 'High performance server memory module with error-correcting code.',
          unitPrice: 3200000,
          costPrice: 2450000,
          totalStockOnHand: 8,
          totalAllocatedQuantity: 0,
          totalAvailableQuantity: 8,
          reorderLevel: 15,
          minStock: 5,
          maxStock: 150,
          unitOfMeasure: 'UNIT',
          isActive: true,
          categoryId: 1,
          categoryName: 'Komponen Elektronik',
          createdAt: new Date().toISOString()
        },
        {
          id: 3,
          sku: 'SKU-IND-001',
          barcode: '899123456003',
          name: 'Lampu Industri Highbay LED 150W IP65 Waterproof',
          description: 'Lampu penerangan plafon tinggi untuk gudang & pabrik hemat daya.',
          unitPrice: 850000,
          costPrice: 620000,
          totalStockOnHand: 120,
          totalAllocatedQuantity: 10,
          totalAvailableQuantity: 110,
          reorderLevel: 25,
          minStock: 10,
          maxStock: 500,
          unitOfMeasure: 'UNIT',
          isActive: true,
          categoryId: 2,
          categoryName: 'Perkakas Industri',
          createdAt: new Date().toISOString()
        },
        {
          id: 4,
          sku: 'SKU-LOG-001',
          barcode: '899123456004',
          name: 'Pallet Plastik Heavy Duty 1200x1000x150mm',
          description: 'Pallet standar pergudangan kuat beban dinamis 1.5 ton.',
          unitPrice: 420000,
          costPrice: 310000,
          totalStockOnHand: 0,
          totalAllocatedQuantity: 0,
          totalAvailableQuantity: 0,
          reorderLevel: 20,
          minStock: 10,
          maxStock: 300,
          unitOfMeasure: 'PCS',
          isActive: true,
          categoryId: 3,
          categoryName: 'Kemasan & Logistik',
          createdAt: new Date().toISOString()
        }
      ];
      setProducts(fallbackProducts);
      setMeta({
        currentPage: 1,
        pageSize: 10,
        totalCount: fallbackProducts.length,
        totalPages: 1,
        hasPrevious: false,
        hasNext: false
      });
    } finally {
      setIsLoading(false);
    }
  }, [meta.currentPage, meta.pageSize, search, categoryId, status, sortBy, sortDir]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const cats = await categoriesApi.getAll();
        setCategories(cats);
        if (cats.length > 0 && formData.categoryId === 0) {
          setFormData((prev) => ({ ...prev, categoryId: cats[0].id }));
        }
      } catch {
        // Ignore
      }
    };
    loadCategories();
  }, [formData.categoryId]);

  const handleOpenCreate = () => {
    setSelectedProduct(null);
    setFormData({
      sku: `SKU-${Date.now().toString().slice(-5)}`,
      barcode: `899${Date.now().toString().slice(-9)}`,
      name: '',
      description: '',
      unitPrice: 0,
      costPrice: 0,
      reorderLevel: 10,
      minStock: 5,
      maxStock: 1000,
      unitOfMeasure: 'PCS',
      categoryId: categories.length > 0 ? categories[0].id : 1,
      imageUrl: ''
    });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (p: Product) => {
    setSelectedProduct(p);
    setFormData({
      sku: p.sku,
      barcode: p.barcode,
      name: p.name,
      description: p.description || '',
      unitPrice: p.unitPrice,
      costPrice: p.costPrice,
      reorderLevel: p.reorderLevel,
      minStock: p.minStock,
      maxStock: p.maxStock,
      unitOfMeasure: p.unitOfMeasure,
      categoryId: p.categoryId,
      imageUrl: p.imageUrl || ''
    });
    setIsFormOpen(true);
  };

  const handleOpenDetail = (p: Product) => {
    setSelectedProduct(p);
    setIsDetailOpen(true);
  };

  const handleOpenDelete = (p: Product) => {
    setSelectedProduct(p);
    setIsDeleteOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (selectedProduct) {
        await productsApi.update(selectedProduct.id, formData);
        toast.success(`Produk '${formData.name}' berhasil diperbarui.`);
      } else {
        await productsApi.create(formData);
        toast.success(`Produk baru '${formData.name}' berhasil ditambahkan.`);
      }
      setIsFormOpen(false);
      fetchProducts();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan data produk.');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedProduct) return;
    try {
      await productsApi.delete(selectedProduct.id);
      toast.success(`Produk '${selectedProduct.name}' berhasil dihapus (Soft Delete).`);
      setIsDeleteOpen(false);
      fetchProducts();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal menghapus produk.');
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  };

  const columns: Column<Product>[] = [
    {
      key: 'name',
      header: 'Info Produk',
      sortable: true,
      render: (p) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img
            src={p.imageUrl || `https://placehold.co/80x80/1e293b/6366f1?text=${encodeURIComponent(p.sku.slice(0, 3))}`}
            alt={p.name}
            style={{ width: '44px', height: '44px', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--border-color)' }}
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://placehold.co/80x80/1e293b/6366f1?text=PROD';
            }}
          />
          <div>
            <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.875rem' }}>{p.name}</div>
            <div style={{ display: 'flex', gap: '8px', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              <span>SKU: <code>{p.sku}</code></span>
              <span>•</span>
              <span>Barcode: <code>{p.barcode}</code></span>
            </div>
          </div>
        </div>
      )
    },
    {
      key: 'categoryName',
      header: 'Kategori',
      sortable: true,
      render: (p) => <span className="badge badge-lavender">{p.categoryName}</span>
    },
    {
      key: 'unitPrice',
      header: 'Harga Jual',
      sortable: true,
      render: (p) => <strong style={{ color: 'var(--palette-rosewood)' }}>{formatCurrency(p.unitPrice)}</strong>
    },
    {
      key: 'totalStockOnHand',
      header: 'Total Stok',
      sortable: true,
      render: (p) => {
        const isLow = p.totalStockOnHand <= p.reorderLevel;
        return (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <strong style={{ color: isLow ? 'var(--palette-rosewood)' : 'var(--text-main)', fontSize: '0.9375rem' }}>
                {p.totalStockOnHand} {p.unitOfMeasure}
              </strong>
              {isLow && <AlertCircle size={14} color="var(--palette-rosewood)" />}
            </div>
            <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
              Reorder Min: {p.reorderLevel}
            </div>
          </div>
        );
      }
    },
    {
      key: 'actions',
      header: 'Aksi',
      render: (p) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            onClick={() => handleOpenDetail(p)}
            className="btn btn-sky btn-icon"
            style={{ width: '34px', height: '34px' }}
            title="Lihat Detail"
          >
            <Eye size={16} color="#2C2424" />
          </button>
          {canManage && (
            <>
              <button
                onClick={() => handleOpenEdit(p)}
                className="btn btn-cream btn-icon"
                style={{ width: '34px', height: '34px' }}
                title="Edit Produk"
              >
                <Edit2 size={16} color="#2C2424" />
              </button>
              <button
                onClick={() => handleOpenDelete(p)}
                className="btn btn-danger btn-icon"
                style={{ width: '34px', height: '34px' }}
                title="Hapus Produk"
              >
                <Trash2 size={16} color="#2C2424" />
              </button>
            </>
          )}
        </div>
      )
    }
  ];

  const filterOptions: FilterOption[] = [
    {
      key: 'categoryId',
      label: 'Kategori',
      value: categoryId,
      options: categories.map((c) => ({ label: c.name, value: c.id })),
      onChange: (val) => {
        setCategoryId(val);
        setMeta((prev) => ({ ...prev, currentPage: 1 }));
      }
    },
    {
      key: 'status',
      label: 'Kondisi Stok',
      value: status,
      options: [
        { label: 'Stok Menipis (<= Reorder)', value: 'low_stock' },
        { label: 'Habis Total (0)', value: 'out_of_stock' }
      ],
      onChange: (val) => {
        setStatus(val);
        setMeta((prev) => ({ ...prev, currentPage: 1 }));
      }
    }
  ];

  const productExportColumns: ExportColumn<Product>[] = [
    { header: 'SKU Barang', accessor: 'sku' },
    { header: 'Barcode / EAN-13', accessor: 'barcode' },
    { header: 'Nama Produk', accessor: 'name' },
    { header: 'Kategori', accessor: (p) => p.categoryName || '-' },
    { header: 'Satuan (UOM)', accessor: 'unitOfMeasure' },
    { header: 'Harga Modal (Rp)', accessor: 'costPrice' },
    { header: 'Harga Jual (Rp)', accessor: 'unitPrice' },
    { header: 'Total Stok Fisik', accessor: (p) => p.totalStockOnHand || 0 },
    { header: 'Stok Tersedia', accessor: (p) => p.totalStockAvailable || 0 },
    { header: 'Reorder Level', accessor: 'reorderLevel' },
    { header: 'Min Stock', accessor: 'minStock' },
    { header: 'Max Stock', accessor: 'maxStock' },
    { header: 'Tanggal Dibuat', accessor: (p) => new Date(p.createdAt).toLocaleDateString('id-ID') }
  ];

  const handleExportAllProducts = async () => {
    try {
      toast.info('Menyiapkan seluruh data katalog produk untuk diekspor...');
      const res = await productsApi.getAll({
        page: 1,
        limit: 10000,
        search,
        categoryId: categoryId ? Number(categoryId) : undefined,
        status: status || undefined,
        sortBy,
        sortDir
      });

      if (!res.data || res.data.length === 0) {
        toast.error('Tidak ada data produk untuk diekspor.');
        return;
      }

      exportToExcel(res.data, productExportColumns, 'InvWare_Katalog_Produk');
      toast.success(`Berhasil mengekspor seluruh ${res.data.length} data produk ke Excel!`);
    } catch {
      toast.error('Gagal mengekspor data produk.');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Top Header */}
      <div>
        <h1 style={{ fontSize: '1.5rem', color: 'var(--text-main)' }}>Katalog Produk & Master Barang</h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          Kelola data barang, harga, batas minimum stok, dan kode SKU di seluruh fasilitas pergudangan.
        </p>
      </div>

      {/* Main DataTable with Toolbar and Export */}
      <DataTable
        columns={columns}
        data={products}
        meta={meta}
        isLoading={isLoading}
        searchPlaceholder="Cari SKU, Barcode, Nama Produk..."
        searchValue={search}
        onSearchChange={(val) => {
          setSearch(val);
          setMeta((prev) => ({ ...prev, currentPage: 1 }));
        }}
        filters={filterOptions}
        sortBy={sortBy}
        sortDir={sortDir}
        onSortChange={(key) => {
          if (sortBy.toLowerCase() === key.toLowerCase()) {
            setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
          } else {
            setSortBy(key);
            setSortDir('asc');
          }
        }}
        onPageChange={(page) => setMeta((prev) => ({ ...prev, currentPage: page }))}
        onPageSizeChange={(size) => setMeta((prev) => ({ ...prev, pageSize: size, currentPage: 1 }))}
        onResetFilters={() => {
          setSearch('');
          setCategoryId('');
          setStatus('');
          setSortBy('createdAt');
          setSortDir('desc');
        }}
        exportFilename="InvWare_Katalog_Produk"
        exportColumns={productExportColumns}
        onExportExcel={handleExportAllProducts}
        actions={
          canManage && (
            <button onClick={handleOpenCreate} className="btn btn-primary" style={{ height: '42px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <Plus size={18} />
              <span>Tambah Produk Baru</span>
            </button>
          )
        }
      />

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={selectedProduct ? `Edit Produk: ${selectedProduct.name}` : 'Tambah Produk Baru'}
        maxWidth="680px"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setIsFormOpen(false)}>
              Batal
            </button>
            <button className="btn btn-primary" onClick={handleFormSubmit}>
              {selectedProduct ? 'Perbarui Produk' : 'Simpan Produk Baru'}
            </button>
          </>
        }
      >
        <form onSubmit={handleFormSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">SKU Barang *</label>
              <input
                type="text"
                className="form-input"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Barcode / EAN-13 *</label>
              <input
                type="text"
                className="form-input"
                value={formData.barcode}
                onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Nama Barang *</label>
            <input
              type="text"
              className="form-input"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Kategori *</label>
              <select
                className="form-select"
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: Number(e.target.value) })}
                required
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Satuan Ukuran (UOM) *</label>
              <select
                className="form-select"
                value={formData.unitOfMeasure}
                onChange={(e) => setFormData({ ...formData, unitOfMeasure: e.target.value })}
              >
                <option value="PCS">PCS</option>
                <option value="UNIT">UNIT</option>
                <option value="SET">SET</option>
                <option value="BOX">BOX</option>
                <option value="ROLL">ROLL</option>
                <option value="BATANG">BATANG</option>
                <option value="KG">KG</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Harga Jual Unit (Rp) *</label>
              <input
                type="number"
                className="form-input"
                value={formData.unitPrice}
                onChange={(e) => setFormData({ ...formData, unitPrice: Number(e.target.value) })}
                min={0}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Harga Pokok Modal / Cost (Rp) *</label>
              <input
                type="number"
                className="form-input"
                value={formData.costPrice}
                onChange={(e) => setFormData({ ...formData, costPrice: Number(e.target.value) })}
                min={0}
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
            <div className="form-group">
              <label className="form-label">Reorder Level *</label>
              <input
                type="number"
                className="form-input"
                value={formData.reorderLevel}
                onChange={(e) => setFormData({ ...formData, reorderLevel: Number(e.target.value) })}
                min={0}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Min Stock</label>
              <input
                type="number"
                className="form-input"
                value={formData.minStock}
                onChange={(e) => setFormData({ ...formData, minStock: Number(e.target.value) })}
                min={0}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Max Stock</label>
              <input
                type="number"
                className="form-input"
                value={formData.maxStock}
                onChange={(e) => setFormData({ ...formData, maxStock: Number(e.target.value) })}
                min={1}
              />
            </div>
          </div>

          <FileUpload
            label="Foto / Gambar Produk"
            acceptType="image"
            folder="products"
            value={formData.imageUrl}
            onChange={(url) => setFormData({ ...formData, imageUrl: url })}
          />

          <div className="form-group">
            <label className="form-label">Deskripsi Spesifikasi</label>
            <textarea
              className="form-textarea"
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Keterangan spesifikasi teknis, dimensi, atau instruksi penyimpanan..."
            />
          </div>
        </form>
      </Modal>

      {/* Detail Modal */}
      {selectedProduct && (
        <Modal
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          title={`Detail Produk: ${selectedProduct.name}`}
          maxWidth="560px"
          footer={
            <button className="btn btn-secondary" onClick={() => setIsDetailOpen(false)}>
              Tutup
            </button>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
              <img
                src={selectedProduct.imageUrl || 'https://placehold.co/120x120/1e293b/6366f1?text=PROD'}
                alt={selectedProduct.name}
                style={{ width: '80px', height: '80px', borderRadius: '12px', objectFit: 'cover', border: '1px solid var(--border-color)' }}
              />
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '1.125rem', color: 'var(--text-main)' }}>{selectedProduct.name}</h3>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  SKU: <code>{selectedProduct.sku}</code> | Barcode: <code>{selectedProduct.barcode}</code>
                </p>
                <div style={{ marginTop: '6px' }}>
                  <span className="badge badge-lavender">{selectedProduct.categoryName}</span>
                </div>
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '0.75rem',
                backgroundColor: 'var(--palette-cream)',
                padding: '1rem',
                borderRadius: '10px',
                border: '1.5px solid #2C2424'
              }}
            >
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 700 }}>Harga Jual Unit</div>
                <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--palette-rosewood)' }}>{formatCurrency(selectedProduct.unitPrice)}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 700 }}>Harga Pokok Modal</div>
                <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)' }}>{formatCurrency(selectedProduct.costPrice)}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 700 }}>Total Saldo Fisik</div>
                <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)' }}>{selectedProduct.totalStockOnHand} {selectedProduct.unitOfMeasure}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 700 }}>Ambang Reorder Level</div>
                <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--palette-rosewood)' }}>{selectedProduct.reorderLevel} {selectedProduct.unitOfMeasure}</div>
              </div>
            </div>

            {selectedProduct.description && (
              <div>
                <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>Deskripsi</div>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-main)', lineHeight: '1.5' }}>{selectedProduct.description}</p>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Delete Soft Confirm Modal */}
      <ConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Hapus Produk"
        message={`Apakah Anda yakin ingin menghapus produk '${selectedProduct?.name}'?`}
        confirmLabel="Ya, Hapus Produk"
      />
    </div>
  );
};
