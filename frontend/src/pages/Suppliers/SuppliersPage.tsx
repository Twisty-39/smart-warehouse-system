import React, { useEffect, useState, useCallback } from 'react';
import { suppliersApi } from '../../services/api';
import { Supplier, PaginationMeta } from '../../types';
import { DataTable, Column, FilterOption } from '../../components/DataTable';
import { Modal } from '../../components/Modal';
import { ConfirmModal } from '../../components/ConfirmModal';
import { StatusBadge } from '../../components/StatusBadge';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { Plus, Edit2, Trash2, Truck, Star, Mail, Phone, MapPin, Eye } from 'lucide-react';
import { exportToExcel, ExportColumn } from '../../utils/export';

export const SuppliersPage: React.FC = () => {
  const { user } = useAuth();
  const canManageSuppliers = user?.roleCode === 'ROLE_ADMIN' || user?.roleCode === 'ROLE_PURCHASING';

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
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
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    contactName: '',
    email: '',
    phone: '',
    address: '',
    taxId: '',
    rating: 5.0,
    isActive: true
  });

  const toast = useToast();

  const fetchSuppliers = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await suppliersApi.getAll({
        page: meta.currentPage,
        limit: meta.pageSize,
        search,
        status: status || undefined,
        sortBy,
        sortDir
      });
      setSuppliers(res.data);
      setMeta(res.meta);
    } catch {
      toast.error('Gagal memuat data pemasok.');
    } finally {
      setIsLoading(false);
    }
  }, [meta.currentPage, meta.pageSize, search, status, sortBy, sortDir]);

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  const handleOpenCreate = () => {
    setSelectedSupplier(null);
    setFormData({
      code: `SUP-${Date.now().toString().slice(-4)}`,
      name: '',
      contactName: '',
      email: '',
      phone: '',
      address: '',
      taxId: '01.234.567.8-011.000',
      rating: 5.0,
      isActive: true
    });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (s: Supplier) => {
    setSelectedSupplier(s);
    setFormData({
      code: s.code,
      name: s.name,
      contactName: s.contactName,
      email: s.email,
      phone: s.phone,
      address: s.address,
      taxId: s.taxId || '',
      rating: s.rating,
      isActive: s.isActive
    });
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (selectedSupplier) {
        await suppliersApi.update(selectedSupplier.id, formData);
        toast.success(`Data pemasok '${formData.name}' berhasil diperbarui.`);
      } else {
        await suppliersApi.create(formData);
        toast.success(`Pemasok baru '${formData.name}' berhasil ditambahkan.`);
      }
      setIsFormOpen(false);
      fetchSuppliers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan data pemasok.');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedSupplier) return;
    try {
      await suppliersApi.delete(selectedSupplier.id);
      toast.success(`Pemasok '${selectedSupplier.name}' berhasil dihapus (Soft Delete).`);
      setIsDeleteOpen(false);
      fetchSuppliers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal menghapus pemasok.');
    }
  };

  const columns: Column<Supplier>[] = [
    {
      key: 'name',
      header: 'Perusahaan Pemasok',
      sortable: true,
      render: (s) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ padding: '8px', borderRadius: '10px', backgroundColor: 'var(--palette-lavender)', color: '#FFFFFF', border: '1px solid #2C2424' }}>
            <Truck size={20} />
          </div>
          <div>
            <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{s.name}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Kode: <code>{s.code}</code>
            </div>
          </div>
        </div>
      )
    },
    {
      key: 'contactName',
      header: 'Kontak PIC',
      sortable: true,
      render: (s) => (
        <div>
          <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{s.contactName}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
            <Mail size={12} color="var(--palette-rosewood)" /> {s.email}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            <Phone size={12} color="var(--palette-rosewood)" /> {s.phone}
          </div>
        </div>
      )
    },
    {
      key: 'rating',
      header: 'Performa Rating',
      sortable: true,
      render: (s) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Star size={16} color="#d97706" fill="#d97706" />
          <strong style={{ color: '#b45309', fontSize: '0.9375rem' }}>{s.rating.toFixed(1)}</strong>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>/ 5.0</span>
        </div>
      )
    },
    {
      key: 'totalPurchaseOrders',
      header: 'Histori PO',
      render: (s) => <span>{s.totalPurchaseOrders} Transaksi</span>
    },
    {
      key: 'isActive',
      header: 'STATUS',
      render: (s) => <StatusBadge status={s.isActive ? 'Aktif' : 'Nonaktif'} type="active" />
    },
    {
      key: 'actions',
      header: 'AKSI',
      render: (s) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            onClick={() => { setSelectedSupplier(s); setIsDetailOpen(true); }}
            className="btn btn-secondary btn-icon"
            style={{ width: '34px', height: '34px' }}
            title="Lihat Detail"
          >
            <Eye size={16} color="#2C2424" />
          </button>
          {canManageSuppliers && (
            <>
              <button
                onClick={() => handleOpenEdit(s)}
                className="btn btn-cream btn-icon"
                style={{ width: '34px', height: '34px' }}
                title="Edit Pemasok"
              >
                <Edit2 size={16} color="#2C2424" />
              </button>
              <button
                onClick={() => { setSelectedSupplier(s); setIsDeleteOpen(true); }}
                className="btn btn-danger btn-icon"
                style={{ width: '34px', height: '34px' }}
                title="Hapus Pemasok"
              >
                <Trash2 size={16} color="#2C2424" />
              </button>
            </>
          )}
        </div>
      )
    }
  ];

  const supplierExportColumns: ExportColumn<Supplier>[] = [
    { header: 'Kode Pemasok', accessor: 'code' },
    { header: 'Nama Perusahaan Pemasok', accessor: 'name' },
    { header: 'Nama Kontak PIC', accessor: 'contactName' },
    { header: 'Email Pemasok', accessor: 'email' },
    { header: 'No. Telepon / HP', accessor: 'phone' },
    { header: 'Alamat Kantor', accessor: 'address' },
    { header: 'NPWP Perusahaan', accessor: (s) => s.taxId || '-' },
    { header: 'Rating Performa', accessor: 'rating' },
    { header: 'Histori Transaksi PO', accessor: 'totalPurchaseOrders' },
    { header: 'Status', accessor: (s) => (s.isActive ? 'Aktif' : 'Nonaktif') },
    { header: 'Tanggal Dibuat', accessor: (s) => new Date(s.createdAt).toLocaleDateString('id-ID') }
  ];

  const handleExportAllSuppliers = async () => {
    try {
      toast.info('Menyiapkan seluruh data pemasok untuk diekspor...');
      const res = await suppliersApi.getAll({
        page: 1,
        limit: 10000,
        search,
        status: status || undefined,
        sortBy,
        sortDir
      });

      if (!res.data || res.data.length === 0) {
        toast.error('Tidak ada data pemasok untuk diekspor.');
        return;
      }

      exportToExcel(res.data, supplierExportColumns, 'InvWare_Direktori_Pemasok');
      toast.success(`Berhasil mengekspor seluruh ${res.data.length} data rekanan pemasok ke Excel!`);
    } catch {
      toast.error('Gagal mengekspor data pemasok.');
    }
  };

  const filters: FilterOption[] = [
    {
      key: 'status',
      label: 'Status Pemasok',
      value: status,
      options: [
        { label: 'Vendor Aktif', value: 'active' },
        { label: 'Nonaktif', value: 'inactive' }
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
        <h1 style={{ fontSize: '1.5rem', color: 'var(--text-main)' }}>Direktori Pemasok & Vendor</h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          Kelola data rekanan pemasok rantai pasok, PIC kontak, NPWP, dan evaluasi rating performa.
        </p>
      </div>

      <DataTable
        columns={columns}
        data={suppliers}
        meta={meta}
        isLoading={isLoading}
        searchPlaceholder="Cari nama vendor, kode, PIC, email..."
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
          setStatus('');
          setSortBy('createdAt');
          setSortDir('desc');
        }}
        exportFilename="InvWare_Direktori_Pemasok"
        exportColumns={supplierExportColumns}
        onExportExcel={handleExportAllSuppliers}
        actions={
          canManageSuppliers && (
            <button
              onClick={handleOpenCreate}
              className="btn btn-primary"
              style={{ height: '42px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <Plus size={18} />
              <span>Tambah Pemasok Baru</span>
            </button>
          )
        }
      />

      {/* Form Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={selectedSupplier ? `Edit Pemasok: ${selectedSupplier.name}` : 'Tambah Pemasok Baru'}
        maxWidth="640px"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setIsFormOpen(false)}>
              Batal
            </button>
            <button className="btn btn-primary" onClick={handleFormSubmit}>
              {selectedSupplier ? 'Perbarui' : 'Simpan Pemasok'}
            </button>
          </>
        }
      >
        <form onSubmit={handleFormSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Kode Pemasok *</label>
              <input
                type="text"
                className="form-input"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Nama Perusahaan / Vendor *</label>
              <input
                type="text"
                className="form-input"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Nama Kontak PIC *</label>
              <input
                type="text"
                className="form-input"
                value={formData.contactName}
                onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Alamat Email *</label>
              <input
                type="email"
                className="form-input"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Nomor Telepon *</label>
              <input
                type="text"
                className="form-input"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">NPWP / Tax ID</label>
              <input
                type="text"
                className="form-input"
                value={formData.taxId}
                onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Rating Performa (1.0 - 5.0)</label>
            <input
              type="number"
              step="0.1"
              min="1.0"
              max="5.0"
              className="form-input"
              value={formData.rating}
              onChange={(e) => setFormData({ ...formData, rating: Number(e.target.value) })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Alamat Kantor / Pabrik *</label>
            <textarea
              className="form-textarea"
              rows={3}
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              required
            />
          </div>
        </form>
      </Modal>

      {/* Detail Modal */}
      {selectedSupplier && (
        <Modal
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          title={`Detail Pemasok: ${selectedSupplier.name}`}
          maxWidth="520px"
          footer={<button className="btn btn-secondary" onClick={() => setIsDetailOpen(false)}>Tutup</button>}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 700 }}>Kode Rekanan</span>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' }}><code>{selectedSupplier.code}</code></div>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 700 }}>Nama PIC & Kontak</span>
              <div style={{ fontSize: '0.9375rem', color: 'var(--text-main)', fontWeight: 600 }}>{selectedSupplier.contactName} ({selectedSupplier.email} | {selectedSupplier.phone})</div>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 700 }}>Alamat Lengkap</span>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-main)' }}>{selectedSupplier.address}</div>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                backgroundColor: 'var(--palette-cream)',
                padding: '0.875rem',
                borderRadius: '10px',
                border: '1.5px solid #2C2424'
              }}
            >
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 700 }}>Rating Kualitas</span>
                <div style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--palette-rosewood)' }}>★ {selectedSupplier.rating.toFixed(1)} / 5.0</div>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 700 }}>NPWP / Pajak</span>
                <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-main)' }}><code>{selectedSupplier.taxId || '-'}</code></div>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Soft Confirm */}
      <ConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Hapus Data Pemasok"
        message={`Apakah Anda yakin ingin menghapus pemasok '${selectedSupplier?.name}'?`}
        confirmLabel="Ya, Hapus Pemasok"
      />
    </div>
  );
};
