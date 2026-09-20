import React, { useEffect, useState, useCallback } from 'react';
import { purchaseOrdersApi, suppliersApi, productsApi, warehousesApi } from '../../services/api';
import { PurchaseOrder, Supplier, Product, Warehouse, PaginationMeta } from '../../types';
import { DataTable, Column, FilterOption } from '../../components/DataTable';
import { Modal } from '../../components/Modal';
import { StatusBadge } from '../../components/StatusBadge';
import { FileUpload } from '../../components/FileUpload';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { Plus, CheckCircle2, XCircle, PackageCheck, Eye, Trash2, FileText, ShoppingCart } from 'lucide-react';

interface POItemForm {
  productId: number;
  orderedQuantity: number;
  unitCost: number;
  notes?: string;
}

export const PurchaseOrdersPage: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.roleCode === 'ROLE_ADMIN';
  const isManager = user?.roleCode === 'ROLE_MANAGER';
  const isPurchasing = user?.roleCode === 'ROLE_PURCHASING';
  const isStaff = user?.roleCode === 'ROLE_STAFF';

  const canCreatePO = isAdmin || isPurchasing;
  const canApprovePO = isAdmin || isManager;
  const canReceivePO = isAdmin || isManager || isStaff;

  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
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
  const [status, setStatus] = useState('');
  const [sortBy, setSortBy] = useState('orderDate');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isReceiveOpen, setIsReceiveOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null);

  // Create Form State
  const [createForm, setCreateForm] = useState({
    supplierId: 0,
    expectedDeliveryDate: '',
    notes: '',
    documentUrl: '',
    items: [] as POItemForm[]
  });

  // Receive Form State
  const [receiveForm, setReceiveForm] = useState({
    targetWarehouseId: 0,
    binLocation: 'DEFAULT',
    notes: 'Penerimaan barang fisik dari PO ke gudang'
  });

  const toast = useToast();

  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await purchaseOrdersApi.getAll({
        page: meta.currentPage,
        limit: meta.pageSize,
        search,
        status: status || undefined,
        sortBy,
        sortDir
      });
      setOrders(res.data);
      setMeta(res.meta);
    } catch {
      toast.error('Gagal memuat data Purchase Order.');
    } finally {
      setIsLoading(false);
    }
  }, [meta.currentPage, meta.pageSize, search, status, sortBy, sortDir]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    const loadPrerequisites = async () => {
      try {
        const [sRes, pRes, wRes] = await Promise.all([
          suppliersApi.getAll({ limit: 50 }),
          productsApi.getAll({ limit: 100 }),
          warehousesApi.getAll({ limit: 50 })
        ]);
        setSuppliers(sRes.data);
        setProducts(pRes.data);
        setWarehouses(wRes.data);

        if (wRes.data.length > 0) {
          setReceiveForm((prev) => ({ ...prev, targetWarehouseId: wRes.data[0].id }));
        }
      } catch {
        // Ignore
      }
    };
    loadPrerequisites();
  }, []);

  const handleOpenCreate = () => {
    if (suppliers.length === 0 || products.length === 0) {
      toast.error('Data pemasok atau produk belum tersedia.');
      return;
    }

    setCreateForm({
      supplierId: suppliers[0].id,
      expectedDeliveryDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      notes: 'Pengadaan barang reguler stok gudang',
      documentUrl: '',
      items: [
        {
          productId: products[0].id,
          orderedQuantity: 20,
          unitCost: products[0].costPrice,
          notes: ''
        }
      ]
    });
    setIsCreateOpen(true);
  };

  const handleAddItemRow = () => {
    if (products.length === 0) return;
    setCreateForm((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          productId: products[0].id,
          orderedQuantity: 10,
          unitCost: products[0].costPrice,
          notes: ''
        }
      ]
    }));
  };

  const handleRemoveItemRow = (index: number) => {
    setCreateForm((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const handleItemChange = (index: number, field: keyof POItemForm, val: any) => {
    setCreateForm((prev) => {
      const updated = [...prev.items];
      if (field === 'productId') {
        const selectedProd = products.find((p) => p.id === Number(val));
        updated[index] = {
          ...updated[index],
          productId: Number(val),
          unitCost: selectedProd ? selectedProd.costPrice : updated[index].unitCost
        };
      } else {
        updated[index] = {
          ...updated[index],
          [field]: field === 'orderedQuantity' || field === 'unitCost' ? Number(val) : val
        };
      }
      return { ...prev, items: updated };
    });
  };

  const calculateTotal = () => {
    return createForm.items.reduce((sum, item) => sum + (item.orderedQuantity * item.unitCost), 0);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (createForm.items.length === 0) {
      toast.error('Minimal harus ada 1 item barang yang dipesan.');
      return;
    }

    try {
      await purchaseOrdersApi.create(createForm);
      toast.success('Purchase Order berhasil dibuat!');
      setIsCreateOpen(false);
      fetchOrders();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal membuat Purchase Order.');
    }
  };

  const handleStatusChange = async (id: number, newStatus: string) => {
    try {
      await purchaseOrdersApi.updateStatus(id, newStatus);
      toast.success(`Status PO berhasil diubah menjadi ${newStatus}.`);
      fetchOrders();
      if (selectedOrder && selectedOrder.id === id) {
        setSelectedOrder({ ...selectedOrder, status: newStatus as any });
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal memperbarui status PO.');
    }
  };

  const handleReceiveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;

    try {
      await purchaseOrdersApi.receivePO(selectedOrder.id, receiveForm);
      toast.success('Barang PO telah diterima dan stok gudang berhasil diperbarui!');
      setIsReceiveOpen(false);
      fetchOrders();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal memproses penerimaan barang PO.');
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  };

  const columns: Column<PurchaseOrder>[] = [
    {
      key: 'poNumber',
      header: 'No. PO',
      sortable: true,
      render: (po) => (
        <div>
          <span style={{ fontWeight: 700, color: 'var(--text-main)', fontFamily: 'monospace' }}>
            {po.poNumber}
          </span>
          <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
            Dibuat oleh: {po.createdByUserName}
          </div>
        </div>
      )
    },
    {
      key: 'supplierName',
      header: 'Pemasok / Vendor',
      sortable: true,
      render: (po) => (
        <div>
          <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{po.supplierName}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{po.supplierEmail}</div>
        </div>
      )
    },
    {
      key: 'orderDate',
      header: 'Tanggal Order',
      sortable: true,
      render: (po) => (
        <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
          {new Date(po.orderDate).toLocaleDateString('id-ID')}
        </span>
      )
    },
    {
      key: 'totalAmount',
      header: 'Total Nilai PO',
      sortable: true,
      render: (po) => (
        <div>
          <strong style={{ color: 'var(--text-main)', fontSize: '0.9375rem', fontWeight: 700 }}>{formatCurrency(po.totalAmount)}</strong>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{po.items.length} Macam Barang</div>
        </div>
      )
    },
    {
      key: 'status',
      header: 'Status Alur',
      sortable: true,
      render: (po) => <StatusBadge status={po.status} type="po" />
    },
    {
      key: 'actions',
      header: 'Aksi',
      render: (po) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            onClick={() => { setSelectedOrder(po); setIsDetailOpen(true); }}
            className="btn btn-secondary btn-icon"
            style={{ width: '32px', height: '32px' }}
            title="Lihat Rincian Item"
          >
            <Eye size={15} color="var(--palette-rosewood)" />
          </button>

          {canApprovePO && po.status === 'PENDING' && (
            <button
              onClick={() => handleStatusChange(po.id, 'APPROVED')}
              className="btn btn-success btn-icon"
              style={{ width: '32px', height: '32px' }}
              title="Setujui PO (Approve)"
            >
              <CheckCircle2 size={15} />
            </button>
          )}

          {canReceivePO && po.status === 'APPROVED' && (
            <button
              onClick={() => { setSelectedOrder(po); setIsReceiveOpen(true); }}
              className="btn btn-primary"
              style={{ padding: '4px 8px', fontSize: '0.75rem' }}
              title="Terima Barang Masuk"
            >
              <PackageCheck size={14} /> Terima
            </button>
          )}

          {canApprovePO && (po.status === 'PENDING' || po.status === 'DRAFT') && (
            <button
              onClick={() => handleStatusChange(po.id, 'CANCELLED')}
              className="btn btn-danger btn-icon"
              style={{ width: '32px', height: '32px' }}
              title="Batalkan PO"
            >
              <XCircle size={15} />
            </button>
          )}
        </div>
      )
    }
  ];

  const filters: FilterOption[] = [
    {
      key: 'status',
      label: 'Status Alur',
      value: status,
      options: [
        { label: 'Menunggu Persetujuan (PENDING)', value: 'PENDING' },
        { label: 'Disetujui (APPROVED)', value: 'APPROVED' },
        { label: 'Selesai Diterima (RECEIVED)', value: 'RECEIVED' },
        { label: 'Dibatalkan (CANCELLED)', value: 'CANCELLED' }
      ],
      onChange: (val) => {
        setStatus(val);
        setMeta((prev) => ({ ...prev, currentPage: 1 }));
      }
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', color: 'var(--text-main)' }}>Pengadaan Barang & Purchase Orders</h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Kelola alur pemesanan barang ke vendor pemasok, persetujuan manajerial, dan penerimaan fisik stok gudang.
          </p>
        </div>

        {canCreatePO && (
          <button onClick={handleOpenCreate} className="btn btn-primary">
            <Plus size={18} /> Buat PO Baru
          </button>
        )}
      </div>

      <div className="card" style={{ padding: '1.25rem' }}>
        <DataTable
          columns={columns}
          data={orders}
          meta={meta}
          isLoading={isLoading}
          searchPlaceholder="Cari nomor PO, nama pemasok..."
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
        />
      </div>

      {/* Create Multi-Item PO Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Buat Dokumen Purchase Order Baru"
        maxWidth="760px"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setIsCreateOpen(false)}>
              Batal
            </button>
            <button className="btn btn-primary" onClick={handleCreateSubmit}>
              Simpan & Terbitkan PO
            </button>
          </>
        }
      >
        <form onSubmit={handleCreateSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Vendor Pemasok *</label>
              <select
                className="form-select"
                value={createForm.supplierId}
                onChange={(e) => setCreateForm({ ...createForm, supplierId: Number(e.target.value) })}
                required
              >
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.code})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Estimasi Tanggal Tiba</label>
              <input
                type="date"
                className="form-input"
                value={createForm.expectedDeliveryDate}
                onChange={(e) => setCreateForm({ ...createForm, expectedDeliveryDate: e.target.value })}
              />
            </div>
          </div>

          {/* Dynamic Item Lines Table */}
          <div style={{ marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <label className="form-label" style={{ margin: 0, fontWeight: 700 }}>
                Rincian Barang yang Dipesan ({createForm.items.length} Item)
              </label>
              <button
                type="button"
                onClick={handleAddItemRow}
                className="btn btn-secondary"
                style={{ padding: '4px 10px', fontSize: '0.75rem' }}
              >
                <Plus size={14} /> Tambah Baris Barang
              </button>
            </div>

            <div className="table-container" style={{ maxHeight: '240px', overflowY: 'auto' }}>
              <table className="data-table" style={{ fontSize: '0.8125rem' }}>
                <thead>
                  <tr>
                    <th style={{ width: '40%' }}>Barang / Produk</th>
                    <th style={{ width: '20%' }}>Kuantitas</th>
                    <th style={{ width: '25%' }}>Harga Modal (Rp)</th>
                    <th style={{ width: '15%' }}>Hapus</th>
                  </tr>
                </thead>
                <tbody>
                  {createForm.items.map((item, idx) => (
                    <tr key={idx}>
                      <td>
                        <select
                          className="form-select"
                          value={item.productId}
                          onChange={(e) => handleItemChange(idx, 'productId', e.target.value)}
                          style={{ fontSize: '0.8125rem', padding: '4px 8px' }}
                          required
                        >
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} ({p.sku})
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <input
                          type="number"
                          className="form-input"
                          value={item.orderedQuantity}
                          onChange={(e) => handleItemChange(idx, 'orderedQuantity', e.target.value)}
                          min={1}
                          style={{ fontSize: '0.8125rem', padding: '4px 8px' }}
                          required
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          className="form-input"
                          value={item.unitCost}
                          onChange={(e) => handleItemChange(idx, 'unitCost', e.target.value)}
                          min={0}
                          style={{ fontSize: '0.8125rem', padding: '4px 8px' }}
                          required
                        />
                      </td>
                      <td>
                        <button
                          type="button"
                          onClick={() => handleRemoveItemRow(idx)}
                          className="btn btn-danger btn-icon"
                          style={{ width: '28px', height: '28px' }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ textAlign: 'right', marginTop: '0.5rem', fontSize: '0.9375rem', color: 'var(--text-secondary)' }}>
              Total Kalkulasi PO:{' '}
              <strong style={{ color: '#38bdf8', fontSize: '1.125rem' }}>{formatCurrency(calculateTotal())}</strong>
            </div>
          </div>

          <FileUpload
            label="Unggah Faktur / Dokumen Purchase Order Resmi (PDF)"
            acceptType="document"
            folder="documents"
            value={createForm.documentUrl}
            onChange={(url) => setCreateForm({ ...createForm, documentUrl: url })}
          />

          <div className="form-group">
            <label className="form-label">Catatan Tambahan PO</label>
            <textarea
              className="form-textarea"
              rows={2}
              value={createForm.notes}
              onChange={(e) => setCreateForm({ ...createForm, notes: e.target.value })}
            />
          </div>
        </form>
      </Modal>

      {/* PO Detail Modal */}
      {selectedOrder && (
        <Modal
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          title={`Detail PO: ${selectedOrder.poNumber}`}
          maxWidth="680px"
          footer={
            <button className="btn btn-secondary" onClick={() => setIsDetailOpen(false)}>
              Tutup
            </button>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '1.125rem', color: 'var(--text-main)' }}>{selectedOrder.supplierName}</h3>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>Email: {selectedOrder.supplierEmail}</p>
              </div>
              <StatusBadge status={selectedOrder.status} type="po" />
            </div>

            <div className="table-container">
              <table className="data-table" style={{ fontSize: '0.8125rem' }}>
                <thead>
                  <tr>
                    <th>Barang</th>
                    <th>Qty Dipesan</th>
                    <th>Qty Diterima</th>
                    <th>Harga Satuan</th>
                    <th>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedOrder.items.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{item.productName}</div>
                        <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>SKU: <code>{item.productSku}</code></div>
                      </td>
                      <td>{item.orderedQuantity} {item.unitOfMeasure}</td>
                      <td>
                        <strong style={{ color: item.receivedQuantity > 0 ? '#34d399' : 'var(--text-muted)' }}>
                          {item.receivedQuantity} {item.unitOfMeasure}
                        </strong>
                      </td>
                      <td>{formatCurrency(item.unitCost)}</td>
                      <td><strong>{formatCurrency(item.subtotal)}</strong></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1e293b', padding: '1rem', borderRadius: '8px' }}>
              {selectedOrder.documentUrl ? (
                <a
                  href={selectedOrder.documentUrl.startsWith('http') ? selectedOrder.documentUrl : `http://localhost:5000${selectedOrder.documentUrl}`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-secondary"
                  style={{ fontSize: '0.8125rem' }}
                >
                  <FileText size={16} /> Lihat Faktur PDF
                </a>
              ) : <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Tidak ada berkas terlampir</span>}

              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total Nilai Transaksi</span>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#38bdf8' }}>
                  {formatCurrency(selectedOrder.totalAmount)}
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Receive Goods Modal */}
      {selectedOrder && (
        <Modal
          isOpen={isReceiveOpen}
          onClose={() => setIsReceiveOpen(false)}
          title={`Penerimaan Barang: ${selectedOrder.poNumber}`}
          maxWidth="520px"
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setIsReceiveOpen(false)}>
                Batal
              </button>
              <button className="btn btn-success" onClick={handleReceiveSubmit}>
                Konfirmasi Penerimaan Fisik
              </button>
            </>
          }
        >
          <form onSubmit={handleReceiveSubmit}>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.25rem', lineHeight: '1.6' }}>
              Seluruh item barang pada PO ini akan otomatis ditambahkan ke saldo inventaris gudang tujuan dan dicatat dalam buku besar mutasi transaksi INBOUND.
            </p>

            <div className="form-group">
              <label className="form-label">Gudang Penyimpanan Tujuan *</label>
              <select
                className="form-select"
                value={receiveForm.targetWarehouseId}
                onChange={(e) => setReceiveForm({ ...receiveForm, targetWarehouseId: Number(e.target.value) })}
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
              <label className="form-label">Lokasi Rak / Bin Masuk *</label>
              <input
                type="text"
                className="form-input"
                value={receiveForm.binLocation}
                onChange={(e) => setReceiveForm({ ...receiveForm, binLocation: e.target.value })}
                placeholder="Contoh: DEFAULT atau A01-R01-B01"
                required
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                Default 'DEFAULT' untuk penempatan standar gudang, atau isi kode bin/rak spesifik.
              </span>
            </div>

            <div className="form-group">
              <label className="form-label">Catatan Penerimaan</label>
              <textarea
                className="form-textarea"
                rows={2}
                value={receiveForm.notes}
                onChange={(e) => setReceiveForm({ ...receiveForm, notes: e.target.value })}
              />
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
