import React, { useEffect, useState, useCallback } from 'react';
import { inventoryApi, productsApi, warehousesApi } from '../../services/api';
import { InventoryStock, Product, Warehouse, PaginationMeta } from '../../types';
import { DataTable, Column, FilterOption } from '../../components/DataTable';
import { Modal } from '../../components/Modal';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { SlidersHorizontal, ArrowLeftRight, Boxes, AlertTriangle } from 'lucide-react';
import { exportToExcel, ExportColumn } from '../../utils/export';

export const InventoryPage: React.FC = () => {
  const { user } = useAuth();
  const canAdjust = user?.roleCode === 'ROLE_ADMIN' || user?.roleCode === 'ROLE_MANAGER';
  const canTransfer = user?.roleCode === 'ROLE_ADMIN' || user?.roleCode === 'ROLE_MANAGER' || user?.roleCode === 'ROLE_STAFF';

  const [stocks, setStocks] = useState<InventoryStock[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);

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
  const [warehouseId, setWarehouseId] = useState<string | number>('');
  const [status, setStatus] = useState('');
  const [sortBy, setSortBy] = useState('updatedAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  // Modals
  const [isAdjustOpen, setIsAdjustOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);

  // Form States
  const [adjustForm, setAdjustForm] = useState({
    productId: 0,
    warehouseId: 0,
    binLocation: 'DEFAULT',
    newQuantityOnHand: 0,
    reason: 'Stock Opname Bulanan'
  });

  const [transferForm, setTransferForm] = useState({
    productId: 0,
    sourceWarehouseId: 0,
    targetWarehouseId: 0,
    sourceBinLocation: 'DEFAULT',
    targetBinLocation: 'DEFAULT',
    quantity: 10,
    notes: 'Pemindahan stok antar gudang regional'
  });

  const toast = useToast();

  const fetchStocks = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await inventoryApi.getStocks({
        page: meta.currentPage,
        limit: meta.pageSize,
        search,
        warehouseId: warehouseId ? Number(warehouseId) : undefined,
        status: status || undefined,
        sortBy,
        sortDir
      });
      setStocks(res.data);
      setMeta(res.meta);
    } catch {
      toast.error('Gagal memuat data inventaris stok.');
    } finally {
      setIsLoading(false);
    }
  }, [meta.currentPage, meta.pageSize, search, warehouseId, status, sortBy, sortDir]);

  useEffect(() => {
    fetchStocks();
  }, [fetchStocks]);

  useEffect(() => {
    const loadPrerequisites = async () => {
      try {
        const [pRes, wRes] = await Promise.all([
          productsApi.getAll({ limit: 100 }),
          warehousesApi.getAll({ limit: 50 })
        ]);
        setProducts(pRes.data);
        setWarehouses(wRes.data);

        if (pRes.data.length > 0 && wRes.data.length > 0) {
          setAdjustForm((prev) => ({
            ...prev,
            productId: pRes.data[0].id,
            warehouseId: wRes.data[0].id
          }));
          setTransferForm((prev) => ({
            ...prev,
            productId: pRes.data[0].id,
            sourceWarehouseId: wRes.data[0].id,
            targetWarehouseId: wRes.data.length > 1 ? wRes.data[1].id : wRes.data[0].id
          }));
        }
      } catch {
        // Ignore
      }
    };
    loadPrerequisites();
  }, []);

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await inventoryApi.adjustStock(adjustForm);
      toast.success('Penyesuaian stok inventaris berhasil disimpan!');
      setIsAdjustOpen(false);
      fetchStocks();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal melakukan penyesuaian stok.');
    }
  };

  const handleTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (transferForm.sourceWarehouseId === transferForm.targetWarehouseId) {
      toast.error('Gudang tujuan tidak boleh sama dengan gudang asal.');
      return;
    }
    try {
      await inventoryApi.transferStock(transferForm);
      toast.success('Mutasi transfer stok antar gudang berhasil dieksekusi!');
      setIsTransferOpen(false);
      fetchStocks();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal melakukan transfer stok.');
    }
  };

  const handleExportAllInventory = async () => {
    try {
      toast.info('Menyiapkan seluruh data inventaris untuk diekspor...');
      const res = await inventoryApi.getStocks({
        page: 1,
        limit: 10000,
        search,
        warehouseId: warehouseId ? Number(warehouseId) : undefined,
        status: status || undefined,
        sortBy,
        sortDir
      });

      if (!res.data || res.data.length === 0) {
        toast.error('Tidak ada data inventaris untuk diekspor.');
        return;
      }

      exportToExcel(res.data, inventoryExportColumns, 'InvWare_Stok_Lokasi_Rak');
      toast.success(`Berhasil mengekspor seluruh ${res.data.length} data stok ke Excel!`);
    } catch {
      toast.error('Gagal mengekspor data inventaris.');
    }
  };

  const columns: Column<InventoryStock>[] = [
    {
      key: 'productName',
      header: 'BARANG & SKU',
      sortable: true,
      render: (s) => (
        <div>
          <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{s.productName}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
            SKU: <code style={{ color: 'var(--palette-rosewood)', backgroundColor: 'var(--palette-cream)', padding: '1px 4px', borderRadius: '4px', border: '1px solid #2C2424' }}>{s.productSku}</code>
          </div>
        </div>
      )
    },
    {
      key: 'warehouseName',
      header: 'LOKASI GUDANG & BIN',
      sortable: true,
      render: (s) => (
        <div>
          <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{s.warehouseName}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Rak/Bin: <strong style={{ color: 'var(--palette-rosewood)' }}>{s.binLocation}</strong>
          </div>
        </div>
      )
    },
    {
      key: 'quantityOnHand',
      header: 'FISIK (ON HAND)',
      sortable: true,
      render: (s) => (
        <strong style={{ fontSize: '0.9375rem', color: 'var(--text-main)' }}>
          {s.quantityOnHand.toLocaleString('id-ID')} {s.unitOfMeasure}
        </strong>
      )
    },
    {
      key: 'quantityAllocated',
      header: 'TERALOKASI',
      render: (s) => (
        <span style={{ color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.875rem' }}>
          {s.quantityAllocated.toLocaleString('id-ID')} {s.unitOfMeasure}
        </span>
      )
    },
    {
      key: 'quantityAvailable',
      header: 'TERSEDIA BEBAS',
      render: (s) => {
        const isOutOfStock = s.quantityAvailable === 0;
        const color = isOutOfStock ? '#b91c1c' : (s.isLowStock ? '#b45309' : '#15803d');
        return (
          <strong style={{ color, fontSize: '0.9375rem' }}>
            {s.quantityAvailable.toLocaleString('id-ID')} {s.unitOfMeasure}
          </strong>
        );
      }
    },
    {
      key: 'status',
      header: 'STATUS KONDISI',
      render: (s) => {
        if (s.quantityOnHand === 0) {
          return <span className="badge badge-danger">Habis</span>;
        }
        if (s.isLowStock) {
          return (
            <span className="badge badge-warning" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <AlertTriangle size={12} /> Menipis
            </span>
          );
        }
        return <span className="badge badge-success">Aman</span>;
      }
    }
  ];

  const inventoryExportColumns: ExportColumn<InventoryStock>[] = [
    { header: 'SKU Barang', accessor: 'productSku' },
    { header: 'Nama Produk', accessor: 'productName' },
    { header: 'Fasilitas Gudang', accessor: 'warehouseName' },
    { header: 'Lokasi Rak / Bin', accessor: 'binLocation' },
    { header: 'Saldo Fisik (On Hand)', accessor: 'quantityOnHand' },
    { header: 'Kuantitas Teralokasi', accessor: 'quantityAllocated' },
    { header: 'Kuantitas Tersedia Bebas', accessor: 'quantityAvailable' },
    { header: 'Satuan (UOM)', accessor: 'unitOfMeasure' },
    {
      header: 'Status Stok',
      accessor: (s) => (s.quantityOnHand === 0 ? 'Habis' : (s.isLowStock ? 'Menipis (Kritis)' : 'Aman'))
    },
    {
      header: 'Tanggal Audit Terakhir',
      accessor: (s) => (s.lastCountedAt ? new Date(s.lastCountedAt).toLocaleDateString('id-ID') : '-')
    }
  ];

  const filters: FilterOption[] = [
    {
      key: 'warehouseId',
      label: 'Lokasi Gudang',
      value: warehouseId,
      options: warehouses.map((w) => ({ label: w.name, value: w.id })),
      onChange: (val) => {
        setWarehouseId(val);
        setMeta((prev) => ({ ...prev, currentPage: 1 }));
      }
    },
    {
      key: 'status',
      label: 'Status Stok',
      value: status,
      options: [
        { label: 'Stok Menipis (Kritis)', value: 'low_stock' },
        { label: 'Habis Total (0)', value: 'out_of_stock' }
      ],
      onChange: (val) => {
        setStatus(val);
        setMeta((prev) => ({ ...prev, currentPage: 1 }));
      }
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div>
        <h1 style={{ fontSize: '1.5rem', color: 'var(--text-main)' }}>Manajemen Stok & Lokasi Rak</h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          Monitoring saldo fisik, kuantitas teralokasi, penyesuaian stock opname, dan mutasi transfer antar gudang.
        </p>
      </div>

      <DataTable
        columns={columns}
        data={stocks}
        meta={meta}
        isLoading={isLoading}
        searchPlaceholder="Cari nama barang, SKU, atau rak/bin..."
        searchValue={search}
        onSearchChange={(val) => {
          setSearch(val);
          setMeta((prev) => ({ ...prev, currentPage: 1 }));
        }}
        filters={filters}
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
          setWarehouseId('');
          setStatus('');
          setSortBy('updatedAt');
          setSortDir('desc');
        }}
        exportFilename="InvWare_Stok_Lokasi_Rak"
        exportColumns={inventoryExportColumns}
        onExportExcel={handleExportAllInventory}
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            {canAdjust && (
              <button
                onClick={() => setIsAdjustOpen(true)}
                className="btn btn-secondary"
                style={{ height: '42px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <SlidersHorizontal size={16} />
                <span>Penyesuaian / Opname</span>
              </button>
            )}
            {canTransfer && (
              <button
                onClick={() => setIsTransferOpen(true)}
                className="btn btn-primary"
                style={{ height: '42px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <ArrowLeftRight size={16} />
                <span>Transfer Antar Gudang</span>
              </button>
            )}
          </div>
        }
      />

      {/* Stock Adjustment Modal */}
      <Modal
        isOpen={isAdjustOpen}
        onClose={() => setIsAdjustOpen(false)}
        title="Penyesuaian Saldo Stok (Stock Opname)"
        maxWidth="560px"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setIsAdjustOpen(false)}>
              Batal
            </button>
            <button className="btn btn-primary" onClick={handleAdjustSubmit}>
              Simpan Penyesuaian
            </button>
          </>
        }
      >
        <form onSubmit={handleAdjustSubmit}>
          <div className="form-group">
            <label className="form-label">Pilih Barang / Produk *</label>
            <select
              className="form-select"
              value={adjustForm.productId}
              onChange={(e) => setAdjustForm({ ...adjustForm, productId: Number(e.target.value) })}
              required
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.sku})
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Gudang Penyimpanan *</label>
              <select
                className="form-select"
                value={adjustForm.warehouseId}
                onChange={(e) => setAdjustForm({ ...adjustForm, warehouseId: Number(e.target.value) })}
                required
              >
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Kode Lokasi Rak / Bin *</label>
              <input
                type="text"
                className="form-input"
                value={adjustForm.binLocation}
                onChange={(e) => setAdjustForm({ ...adjustForm, binLocation: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Kuantitas Fisik Sebenarnya (Hasil Hitung) *</label>
            <input
              type="number"
              className="form-input"
              value={adjustForm.newQuantityOnHand}
              onChange={(e) => setAdjustForm({ ...adjustForm, newQuantityOnHand: Number(e.target.value) })}
              min={0}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Alasan Penyesuaian / Catatan Audit *</label>
            <textarea
              className="form-textarea"
              rows={3}
              value={adjustForm.reason}
              onChange={(e) => setAdjustForm({ ...adjustForm, reason: e.target.value })}
              placeholder="Contoh: Selisih penghitungan fisik bulanan / barang rusak..."
              required
            />
          </div>
        </form>
      </Modal>

      {/* Stock Transfer Modal */}
      <Modal
        isOpen={isTransferOpen}
        onClose={() => setIsTransferOpen(false)}
        title="Transfer Mutasi Stok Antar Gudang"
        maxWidth="600px"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setIsTransferOpen(false)}>
              Batal
            </button>
            <button className="btn btn-primary" onClick={handleTransferSubmit}>
              Eksekusi Transfer Stok
            </button>
          </>
        }
      >
        <form onSubmit={handleTransferSubmit}>
          <div className="form-group">
            <label className="form-label">Pilih Barang yang Dipindahkan *</label>
            <select
              className="form-select"
              value={transferForm.productId}
              onChange={(e) => setTransferForm({ ...transferForm, productId: Number(e.target.value) })}
              required
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.sku})
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Gudang Asal *</label>
              <select
                className="form-select"
                value={transferForm.sourceWarehouseId}
                onChange={(e) => setTransferForm({ ...transferForm, sourceWarehouseId: Number(e.target.value) })}
                required
              >
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Gudang Tujuan *</label>
              <select
                className="form-select"
                value={transferForm.targetWarehouseId}
                onChange={(e) => setTransferForm({ ...transferForm, targetWarehouseId: Number(e.target.value) })}
                required
              >
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
            <div className="form-group">
              <label className="form-label">Rak Asal</label>
              <input
                type="text"
                className="form-input"
                value={transferForm.sourceBinLocation}
                onChange={(e) => setTransferForm({ ...transferForm, sourceBinLocation: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Rak Tujuan</label>
              <input
                type="text"
                className="form-input"
                value={transferForm.targetBinLocation}
                onChange={(e) => setTransferForm({ ...transferForm, targetBinLocation: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Jumlah Unit *</label>
              <input
                type="number"
                className="form-input"
                value={transferForm.quantity}
                onChange={(e) => setTransferForm({ ...transferForm, quantity: Number(e.target.value) })}
                min={1}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Catatan Mutasi / Surat Jalan</label>
            <textarea
              className="form-textarea"
              rows={2}
              value={transferForm.notes}
              onChange={(e) => setTransferForm({ ...transferForm, notes: e.target.value })}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};
