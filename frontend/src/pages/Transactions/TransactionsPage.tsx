import React, { useEffect, useState, useCallback } from 'react';
import { transactionsApi, productsApi, warehousesApi } from '../../services/api';
import { StockTransaction, Product, Warehouse, PaginationMeta } from '../../types';
import { DataTable, Column, FilterOption } from '../../components/DataTable';
import { Modal } from '../../components/Modal';
import { StatusBadge } from '../../components/StatusBadge';
import { FileUpload } from '../../components/FileUpload';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { Plus, ArrowDownLeft, ArrowUpRight, ArrowLeftRight, FileText } from 'lucide-react';
import { exportToExcel, ExportColumn } from '../../utils/export';

export const TransactionsPage: React.FC = () => {
  const { user } = useAuth();
  const canRecordMutasi = user?.roleCode === 'ROLE_ADMIN' || user?.roleCode === 'ROLE_MANAGER' || user?.roleCode === 'ROLE_STAFF';

  const [transactions, setTransactions] = useState<StockTransaction[]>([]);
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
  const [typeFilter, setTypeFilter] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    transactionType: 'INBOUND' as 'INBOUND' | 'OUTBOUND',
    productId: 0,
    warehouseId: 0,
    binLocation: 'DEFAULT',
    quantity: 10,
    notes: '',
    documentUrl: ''
  });

  const toast = useToast();

  const fetchTransactions = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await transactionsApi.getAll({
        page: meta.currentPage,
        limit: meta.pageSize,
        search,
        status: typeFilter || undefined,
        sortBy,
        sortDir
      });
      setTransactions(res.data);
      setMeta(res.meta);
    } catch {
      toast.error('Gagal memuat riwayat mutasi transaksi.');
    } finally {
      setIsLoading(false);
    }
  }, [meta.currentPage, meta.pageSize, search, typeFilter, sortBy, sortDir]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

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
          setFormData((prev) => ({
            ...prev,
            productId: pRes.data[0].id,
            warehouseId: wRes.data[0].id
          }));
        }
      } catch {
        // Ignore
      }
    };
    loadPrerequisites();
  }, []);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await transactionsApi.create(formData);
      toast.success(`Transaksi ${formData.transactionType} berhasil dicatat.`);
      setIsModalOpen(false);
      fetchTransactions();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal mencatat transaksi.');
    }
  };

  const handleExportAllTransactions = async () => {
    try {
      toast.info('Menyiapkan seluruh data mutasi transaksi untuk diekspor...');
      const res = await transactionsApi.getAll({
        page: 1,
        limit: 10000,
        search,
        status: typeFilter || undefined,
        sortBy,
        sortDir
      });

      if (!res.data || res.data.length === 0) {
        toast.error('Tidak ada data transaksi untuk diekspor.');
        return;
      }

      exportToExcel(res.data, transactionExportColumns, 'InvWare_Riwayat_Mutasi_Transaksi');
      toast.success(`Berhasil mengekspor seluruh ${res.data.length} data transaksi mutasi ke Excel!`);
    } catch {
      toast.error('Gagal mengekspor data transaksi.');
    }
  };

  const columns: Column<StockTransaction>[] = [
    {
      key: 'referenceNumber',
      header: 'NO. REFERENSI',
      sortable: true,
      render: (t) => (
        <div>
          <span style={{ fontWeight: 700, color: 'var(--text-main)', fontFamily: 'monospace', fontSize: '0.875rem' }}>
            {t.referenceNumber}
          </span>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Oleh: <strong>{t.createdByUserName}</strong>
          </div>
        </div>
      )
    },
    {
      key: 'transactionType',
      header: 'TIPE MUTASI',
      sortable: true,
      render: (t) => <StatusBadge status={t.transactionType} type="transaction" />
    },
    {
      key: 'productName',
      header: 'NAMA BARANG & SKU',
      sortable: true,
      render: (t) => (
        <div>
          <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{t.productName}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
            SKU: <code style={{ color: 'var(--palette-rosewood)', backgroundColor: 'var(--palette-cream)', padding: '1px 4px', borderRadius: '4px', border: '1px solid #2C2424' }}>{t.productSku}</code>
          </div>
        </div>
      )
    },
    {
      key: 'quantity',
      header: 'JUMLAH UNIT',
      sortable: true,
      render: (t) => {
        const isPositive = t.transactionType === 'INBOUND';
        const isNegative = t.transactionType === 'OUTBOUND';
        const color = isPositive ? '#15803d' : (isNegative ? '#dc2626' : '#d97706');
        return (
          <strong style={{ color, fontSize: '0.9375rem', fontWeight: 700 }}>
            {isPositive ? '+' : (isNegative ? '-' : '↔')} {t.quantity.toLocaleString('id-ID')}
          </strong>
        );
      }
    },
    {
      key: 'locations',
      header: 'GUDANG TERKAIT',
      render: (t) => {
        if (t.transactionType === 'INBOUND') {
          return (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', backgroundColor: '#EAF7EE', color: '#15803D', border: '1px solid #15803D' }}>
                Masuk
              </span>
              <span style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.875rem' }}>
                {t.targetWarehouseName || '-'}
              </span>
            </div>
          );
        }
        if (t.transactionType === 'OUTBOUND') {
          return (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', backgroundColor: '#FDF0F0', color: '#DC2626', border: '1px solid #DC2626' }}>
                Keluar
              </span>
              <span style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.875rem' }}>
                {t.sourceWarehouseName || '-'}
              </span>
            </div>
          );
        }
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.875rem', color: 'var(--text-main)', fontWeight: 600 }}>
            <span>{t.sourceWarehouseName || '-'}</span>
            <span style={{ color: 'var(--palette-rosewood)' }}>&rarr;</span>
            <span>{t.targetWarehouseName || '-'}</span>
          </div>
        );
      }
    },
    {
      key: 'documentUrl',
      header: 'BUKTI BERKAS',
      render: (t) => t.documentUrl ? (
        <a
          href={t.documentUrl.startsWith('http') ? t.documentUrl : `http://localhost:5000${t.documentUrl}`}
          target="_blank"
          rel="noreferrer"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            color: 'var(--text-main)',
            fontSize: '0.8125rem',
            fontWeight: 700,
            padding: '3px 8px',
            backgroundColor: '#FAF7EE',
            borderRadius: '6px',
            border: '1px solid #2C2424'
          }}
        >
          <FileText size={14} color="var(--palette-rosewood)" />
          <span>Lihat Berkas</span>
        </a>
      ) : <span style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>-</span>
    },
    {
      key: 'createdAt',
      header: 'WAKTU TRANSAKSI',
      sortable: true,
      render: (t) => (
        <strong style={{ fontSize: '0.8125rem', color: 'var(--text-main)', fontWeight: 600 }}>
          {new Date(t.createdAt).toLocaleString('id-ID')}
        </strong>
      )
    }
  ];

  const transactionExportColumns: ExportColumn<StockTransaction>[] = [
    { header: 'No. Referensi', accessor: 'referenceNumber' },
    { header: 'Tipe Mutasi', accessor: 'transactionType' },
    { header: 'SKU Barang', accessor: 'productSku' },
    { header: 'Nama Barang', accessor: 'productName' },
    { header: 'Jumlah Unit', accessor: 'quantity' },
    { header: 'Gudang Asal', accessor: (t) => t.sourceWarehouseName || '-' },
    { header: 'Gudang Tujuan', accessor: (t) => t.targetWarehouseName || '-' },
    { header: 'Dicatat Oleh', accessor: 'createdByUserName' },
    { header: 'Catatan / Alasan', accessor: (t) => t.notes || '-' },
    { header: 'Waktu Transaksi', accessor: (t) => new Date(t.createdAt).toLocaleString('id-ID') }
  ];

  const filters: FilterOption[] = [
    {
      key: 'type',
      label: 'Tipe Mutasi',
      value: typeFilter,
      options: [
        { label: 'Barang Masuk (INBOUND)', value: 'INBOUND' },
        { label: 'Barang Keluar (OUTBOUND)', value: 'OUTBOUND' },
        { label: 'Transfer Antar Gudang', value: 'TRANSFER' },
        { label: 'Penyesuaian (ADJUSTMENT)', value: 'ADJUSTMENT' }
      ],
      onChange: (val) => {
        setTypeFilter(val);
        setMeta((prev) => ({ ...prev, currentPage: 1 }));
      }
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div>
        <h1 style={{ fontSize: '1.5rem', color: 'var(--text-main)' }}>Riwayat Mutasi & Transaksi Gudang</h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          Audit trail pergerakan barang masuk, barang keluar untuk distribusi, transfer lokasi, dan penyesuaian.
        </p>
      </div>

      <DataTable
        columns={columns}
        data={transactions}
        meta={meta}
        isLoading={isLoading}
        searchPlaceholder="Cari no. ref, nama barang, SKU..."
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
          setTypeFilter('');
          setSortBy('createdAt');
          setSortDir('desc');
        }}
        exportFilename="InvWare_Riwayat_Mutasi_Transaksi"
        exportColumns={transactionExportColumns}
        onExportExcel={handleExportAllTransactions}
        actions={
          canRecordMutasi && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="btn btn-primary"
              style={{ height: '42px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <Plus size={18} />
              <span>Catat Mutasi Baru</span>
            </button>
          )
        }
      />

      {/* Record Transaction Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Catat Mutasi Barang (Inbound / Outbound)"
        maxWidth="600px"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
              Batal
            </button>
            <button className="btn btn-primary" onClick={handleFormSubmit}>
              Simpan Transaksi
            </button>
          </>
        }
      >
        <form onSubmit={handleFormSubmit}>
          <div className="form-group">
            <label className="form-label">Tipe Mutasi *</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <button
                type="button"
                className={`btn ${formData.transactionType === 'INBOUND' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setFormData({ ...formData, transactionType: 'INBOUND' })}
              >
                <ArrowDownLeft size={16} /> Barang Masuk (INBOUND)
              </button>
              <button
                type="button"
                className={`btn ${formData.transactionType === 'OUTBOUND' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setFormData({ ...formData, transactionType: 'OUTBOUND' })}
              >
                <ArrowUpRight size={16} /> Barang Keluar (OUTBOUND)
              </button>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Pilih Barang / Produk *</label>
            <select
              className="form-select"
              value={formData.productId}
              onChange={(e) => setFormData({ ...formData, productId: Number(e.target.value) })}
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
              <label className="form-label">Fasilitas Gudang *</label>
              <select
                className="form-select"
                value={formData.warehouseId}
                onChange={(e) => setFormData({ ...formData, warehouseId: Number(e.target.value) })}
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
              <label className="form-label">Lokasi Rak / Bin *</label>
              <input
                type="text"
                className="form-input"
                value={formData.binLocation}
                onChange={(e) => setFormData({ ...formData, binLocation: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Jumlah Unit *</label>
            <input
              type="number"
              className="form-input"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
              min={1}
              required
            />
          </div>

          <FileUpload
            label="Unggah Surat Jalan / Bukti Terima (Gambar/PDF)"
            acceptType="document"
            folder="transactions"
            value={formData.documentUrl}
            onChange={(url) => setFormData({ ...formData, documentUrl: url })}
          />

          <div className="form-group">
            <label className="form-label">Catatan Tambahan</label>
            <textarea
              className="form-textarea"
              rows={2}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Nomor DO, nama driver pengantar, atau kondisi fisik barang..."
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};
