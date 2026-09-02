import React, { useEffect, useState, useCallback } from 'react';
import { warehousesApi, usersApi } from '../../services/api';
import { Warehouse, User, PaginationMeta } from '../../types';
import { DataTable, Column, FilterOption } from '../../components/DataTable';
import { Modal } from '../../components/Modal';
import { ConfirmModal } from '../../components/ConfirmModal';
import { StatusBadge } from '../../components/StatusBadge';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { Plus, Edit2, Trash2, Warehouse as WhIcon, MapPin, UserCheck, Eye } from 'lucide-react';
import { exportToExcel, ExportColumn } from '../../utils/export';

export const WarehousesPage: React.FC = () => {
  const { user } = useAuth();
  const canManageWarehouses = user?.roleCode === 'ROLE_ADMIN' || user?.roleCode === 'ROLE_MANAGER';

  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [managers, setManagers] = useState<User[]>([]);
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
  const [selectedWarehouse, setSelectedWarehouse] = useState<Warehouse | null>(null);

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    address: '',
    city: '',
    capacitySqm: 5000,
    managerId: undefined as number | undefined,
    isActive: true
  });

  const toast = useToast();

  const fetchWarehouses = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await warehousesApi.getAll({
        page: meta.currentPage,
        limit: meta.pageSize,
        search,
        status: status || undefined,
        sortBy,
        sortDir
      });
      setWarehouses(res.data);
      setMeta(res.meta);
    } catch {
      toast.error('Gagal memuat data gudang.');
    } finally {
      setIsLoading(false);
    }
  }, [meta.currentPage, meta.pageSize, search, status, sortBy, sortDir]);

  useEffect(() => {
    fetchWarehouses();
  }, [fetchWarehouses]);

  useEffect(() => {
    const loadManagers = async () => {
      try {
        const uRes = await usersApi.getAll({ limit: 50 });
        setManagers(uRes.data);
      } catch {
        // Ignore
      }
    };
    loadManagers();
  }, []);

  const handleOpenCreate = () => {
    setSelectedWarehouse(null);
    setFormData({
      code: `WH-LOC-${Date.now().toString().slice(-4)}`,
      name: '',
      address: '',
      city: 'Jakarta',
      capacitySqm: 10000,
      managerId: managers.length > 0 ? managers[0].id : undefined,
      isActive: true
    });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (w: Warehouse) => {
    setSelectedWarehouse(w);
    setFormData({
      code: w.code,
      name: w.name,
      address: w.address,
      city: w.city,
      capacitySqm: w.capacitySqm,
      managerId: w.managerId,
      isActive: w.isActive
    });
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (selectedWarehouse) {
        await warehousesApi.update(selectedWarehouse.id, formData);
        toast.success(`Fasilitas gudang '${formData.name}' berhasil diperbarui.`);
      } else {
        await warehousesApi.create(formData);
        toast.success(`Fasilitas gudang '${formData.name}' berhasil ditambahkan.`);
      }
      setIsFormOpen(false);
      fetchWarehouses();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan data gudang.');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedWarehouse) return;
    try {
      await warehousesApi.delete(selectedWarehouse.id);
      toast.success(`Fasilitas gudang '${selectedWarehouse.name}' berhasil dihapus (Soft Delete).`);
      setIsDeleteOpen(false);
      fetchWarehouses();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal menghapus data gudang.');
    }
  };

  const columns: Column<Warehouse>[] = [
    {
      key: 'name',
      header: 'Fasilitas Gudang',
      sortable: true,
      render: (w) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ padding: '8px', borderRadius: '10px', backgroundColor: 'var(--palette-sky)', color: 'var(--text-main)', border: '1px solid #2C2424' }}>
            <WhIcon size={20} />
          </div>
          <div>
            <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{w.name}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Kode: <code>{w.code}</code>
            </div>
          </div>
        </div>
      )
    },
    {
      key: 'city',
      header: 'Kota & Lokasi',
      sortable: true,
      render: (w) => (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-main)', fontWeight: 600 }}>
            <MapPin size={14} color="var(--palette-rosewood)" /> {w.city}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', maxWidth: '240px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
            {w.address}
          </div>
        </div>
      )
    },
    {
      key: 'capacitySqm',
      header: 'Kapasitas Area',
      sortable: true,
      render: (w) => <strong style={{ color: 'var(--text-main)' }}>{w.capacitySqm.toLocaleString('id-ID')} m²</strong>
    },
    {
      key: 'managerName',
      header: 'Kepala Gudang',
      render: (w) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8125rem', color: 'var(--text-main)', fontWeight: 500 }}>
          <UserCheck size={14} color="var(--palette-rosewood)" />
          <span>{w.managerName || 'Belum Ditugaskan'}</span>
        </div>
      )
    },
    {
      key: 'isActive',
      header: 'Status',
      render: (w) => <StatusBadge status={w.isActive ? 'Aktif' : 'Nonaktif'} type="active" />
    },
    {
      key: 'actions',
      header: 'AKSI',
      render: (w) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            onClick={() => { setSelectedWarehouse(w); setIsDetailOpen(true); }}
            className="btn btn-secondary btn-icon"
            style={{ width: '34px', height: '34px' }}
            title="Lihat Detail"
          >
            <Eye size={16} color="#2C2424" />
          </button>
          {canManageWarehouses && (
            <>
              <button
                onClick={() => handleOpenEdit(w)}
                className="btn btn-cream btn-icon"
                style={{ width: '34px', height: '34px' }}
                title="Edit Gudang"
              >
                <Edit2 size={16} color="#2C2424" />
              </button>
              <button
                onClick={() => { setSelectedWarehouse(w); setIsDeleteOpen(true); }}
                className="btn btn-danger btn-icon"
                style={{ width: '34px', height: '34px' }}
                title="Hapus Gudang"
              >
                <Trash2 size={16} color="#2C2424" />
              </button>
            </>
          )}
        </div>
      )
    }
  ];

  const warehouseExportColumns: ExportColumn<Warehouse>[] = [
    { header: 'Kode Gudang', accessor: 'code' },
    { header: 'Nama Fasilitas Gudang', accessor: 'name' },
    { header: 'Kota / Lokasi', accessor: 'city' },
    { header: 'Alamat Lengkap', accessor: 'address' },
    { header: 'Kapasitas Area (m²)', accessor: 'capacitySqm' },
    { header: 'Kepala Gudang', accessor: (w) => w.managerName || 'Belum Ditugaskan' },
    { header: 'Status', accessor: (w) => (w.isActive ? 'Aktif' : 'Nonaktif') },
    { header: 'Tanggal Dibuat', accessor: (w) => new Date(w.createdAt).toLocaleDateString('id-ID') }
  ];

  const handleExportAllWarehouses = async () => {
    try {
      toast.info('Menyiapkan data fasilitas pergudangan untuk diekspor...');
      const res = await warehousesApi.getAll({
        page: 1,
        limit: 10000,
        search,
        status: status || undefined,
        sortBy,
        sortDir
      });

      if (!res.data || res.data.length === 0) {
        toast.error('Tidak ada data gudang untuk diekspor.');
        return;
      }

      exportToExcel(res.data, warehouseExportColumns, 'InvWare_Fasilitas_Gudang');
      toast.success(`Berhasil mengekspor seluruh ${res.data.length} data fasilitas gudang ke Excel!`);
    } catch {
      toast.error('Gagal mengekspor data fasilitas gudang.');
    }
  };

  const filters: FilterOption[] = [
    {
      key: 'status',
      label: 'Status',
      value: status,
      options: [
        { label: 'Gudang Aktif', value: 'active' },
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
        <h1 style={{ fontSize: '1.5rem', color: 'var(--text-main)' }}>Jaringan Fasilitas Pergudangan</h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          Daftar lokasi pusat distribusi, hub logistik, dan pengelolaan kapasitas ruang simpan.
        </p>
      </div>

      <DataTable
        columns={columns}
        data={warehouses}
        meta={meta}
        isLoading={isLoading}
        searchPlaceholder="Cari nama, kode, atau kota gudang..."
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
        exportFilename="InvWare_Fasilitas_Gudang"
        exportColumns={warehouseExportColumns}
        onExportExcel={handleExportAllWarehouses}
        actions={
          canManageWarehouses && (
            <button
              onClick={handleOpenCreate}
              className="btn btn-primary"
              style={{ height: '42px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <Plus size={18} />
              <span>Tambah Gudang Baru</span>
            </button>
          )
        }
      />

      {/* Form Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={selectedWarehouse ? `Edit Gudang: ${selectedWarehouse.name}` : 'Tambah Gudang Baru'}
        maxWidth="600px"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setIsFormOpen(false)}>
              Batal
            </button>
            <button className="btn btn-primary" onClick={handleFormSubmit}>
              {selectedWarehouse ? 'Perbarui' : 'Simpan Gudang'}
            </button>
          </>
        }
      >
        <form onSubmit={handleFormSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Kode Gudang *</label>
              <input
                type="text"
                className="form-input"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Nama Gudang *</label>
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
              <label className="form-label">Kota Lokasi *</label>
              <input
                type="text"
                className="form-input"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Kapasitas Area (m²) *</label>
              <input
                type="number"
                className="form-input"
                value={formData.capacitySqm}
                onChange={(e) => setFormData({ ...formData, capacitySqm: Number(e.target.value) })}
                min={0}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Kepala Gudang / Penanggung Jawab</label>
            <select
              className="form-select"
              value={formData.managerId ?? ''}
              onChange={(e) => setFormData({ ...formData, managerId: e.target.value ? Number(e.target.value) : undefined })}
            >
              <option value="">-- Pilih Kepala Gudang --</option>
              {managers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.fullName} ({m.email})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Alamat Lengkap *</label>
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
      {selectedWarehouse && (
        <Modal
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          title={`Detail Gudang: ${selectedWarehouse.name}`}
          maxWidth="500px"
          footer={<button className="btn btn-secondary" onClick={() => setIsDetailOpen(false)}>Tutup</button>}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 700 }}>Kode Fasilitas</span>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' }}><code>{selectedWarehouse.code}</code></div>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 700 }}>Alamat & Kota</span>
              <div style={{ fontSize: '0.9375rem', color: 'var(--text-main)', fontWeight: 600 }}>{selectedWarehouse.address}, {selectedWarehouse.city}</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', backgroundColor: 'var(--palette-cream)', padding: '1rem', borderRadius: '10px', border: '1.5px solid #2C2424' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 700 }}>Kapasitas Luas</span>
                <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--palette-rosewood)' }}>{selectedWarehouse.capacitySqm.toLocaleString()} m²</div>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 700 }}>Total Unit Tersimpan</span>
                <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)' }}>{selectedWarehouse.totalUnitsStored.toLocaleString()} Unit</div>
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
        title="Hapus Fasilitas Gudang"
        message={`Apakah Anda yakin ingin menghapus gudang '${selectedWarehouse?.name}'?`}
        confirmLabel="Ya, Hapus Gudang"
      />
    </div>
  );
};
