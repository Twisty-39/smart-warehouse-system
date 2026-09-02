import React, { useEffect, useState, useCallback } from 'react';
import { usersApi } from '../../services/api';
import { User, PaginationMeta } from '../../types';
import { DataTable, Column, FilterOption } from '../../components/DataTable';
import { Modal } from '../../components/Modal';
import { StatusBadge } from '../../components/StatusBadge';
import { useToast } from '../../context/ToastContext';
import { Plus, Edit2, UserCheck, Shield, Eye, EyeOff } from 'lucide-react';

export const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
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
  const [roleIdFilter, setRoleIdFilter] = useState<string | number>('');

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    roleId: 3,
    phoneNumber: '',
    department: '',
    address: ''
  });

  const toast = useToast();

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await usersApi.getAll({
        page: meta.currentPage,
        limit: meta.pageSize,
        search,
        categoryId: roleIdFilter ? Number(roleIdFilter) : undefined
      });
      setUsers(res.data);
      setMeta(res.meta);
    } catch {
      toast.error('Gagal memuat daftar pengguna.');
    } finally {
      setIsLoading(false);
    }
  }, [meta.currentPage, meta.pageSize, search, roleIdFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    const loadRoles = async () => {
      try {
        const data = await usersApi.getRoles();
        setRoles(data);
      } catch {
        // Fallback default roles
        setRoles([
          { id: 1, name: 'Super Admin' },
          { id: 2, name: 'Warehouse Manager' },
          { id: 3, name: 'Inventory Staff' },
          { id: 4, name: 'Purchasing Officer' }
        ]);
      }
    };
    loadRoles();
  }, []);

  const handleOpenCreate = () => {
    setSelectedUser(null);
    setFormData({
      fullName: '',
      email: '',
      password: 'Password123!',
      roleId: roles.length > 0 ? roles[2].id : 3,
      phoneNumber: '',
      department: 'Logistik & Gudang',
      address: ''
    });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (u: User) => {
    setSelectedUser(u);
    const matchedRole = roles.find((r) => r.name === u.role);
    setFormData({
      fullName: u.fullName,
      email: u.email,
      password: '',
      roleId: matchedRole ? matchedRole.id : 3,
      phoneNumber: u.phoneNumber || '',
      department: u.department || '',
      address: u.address || ''
    });
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (selectedUser) {
        await usersApi.update(selectedUser.id, {
          fullName: formData.fullName,
          roleId: formData.roleId,
          phoneNumber: formData.phoneNumber,
          department: formData.department,
          address: formData.address
        });
        toast.success(`Pengguna '${formData.fullName}' berhasil diperbarui.`);
      } else {
        await usersApi.create(formData);
        toast.success(`Pengguna baru '${formData.fullName}' berhasil ditambahkan.`);
      }
      setIsFormOpen(false);
      fetchUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan data pengguna.');
    }
  };

  const columns: Column<User>[] = [
    {
      key: 'fullName',
      header: 'Nama & Pengguna',
      sortable: true,
      render: (u) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img
            src={u.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.fullName)}&background=6366f1&color=fff`}
            alt={u.fullName}
            style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover' }}
          />
          <div>
            <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{u.fullName}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{u.email}</div>
          </div>
        </div>
      )
    },
    {
      key: 'role',
      header: 'Role Wewenang (RBAC)',
      render: (u) => <StatusBadge status={u.role} type="role" />
    },
    {
      key: 'department',
      header: 'Departemen',
      render: (u) => <span>{u.department || '-'}</span>
    },
    {
      key: 'phoneNumber',
      header: 'Kontak Telepon',
      render: (u) => <span>{u.phoneNumber || '-'}</span>
    },
    {
      key: 'actions',
      header: 'AKSI',
      render: (u) => (
        <button
          onClick={() => handleOpenEdit(u)}
          className="btn btn-cream btn-icon"
          style={{ width: '34px', height: '34px' }}
          title="Edit Akun & Role"
        >
          <Edit2 size={16} color="#2C2424" />
        </button>
      )
    }
  ];

  const filters: FilterOption[] = [
    {
      key: 'roleId',
      label: 'Role Wewenang',
      value: roleIdFilter,
      options: roles.map((r) => ({ label: r.name, value: r.id })),
      onChange: (val) => {
        setRoleIdFilter(val);
        setMeta((prev) => ({ ...prev, currentPage: 1 }));
      }
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', color: 'var(--text-main)' }}>Manajemen Pengguna & Hak Akses (RBAC)</h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Kelola akun petugas, kepala gudang, tim purchasing, dan penetapan role otorisasi sistem.
          </p>
        </div>

        <button onClick={handleOpenCreate} className="btn btn-primary">
          <Plus size={18} /> Tambah Akun Pengguna
        </button>
      </div>

      <div className="card" style={{ padding: '1.25rem' }}>
        <DataTable
          columns={columns}
          data={users}
          meta={meta}
          isLoading={isLoading}
          searchPlaceholder="Cari nama, email, departemen..."
          searchValue={search}
          onSearchChange={(val) => {
            setSearch(val);
            setMeta((prev) => ({ ...prev, currentPage: 1 }));
          }}
          filters={filters}
          onPageChange={(page) => setMeta((prev) => ({ ...prev, currentPage: page }))}
          onPageSizeChange={(size) => setMeta((prev) => ({ ...prev, pageSize: size, currentPage: 1 }))}
        />
      </div>

      {/* Form Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={selectedUser ? `Edit Pengguna: ${selectedUser.fullName}` : 'Tambah Pengguna Baru'}
        maxWidth="580px"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setIsFormOpen(false)}>
              Batal
            </button>
            <button className="btn btn-primary" onClick={handleFormSubmit}>
              {selectedUser ? 'Perbarui Akun' : 'Simpan Pengguna'}
            </button>
          </>
        }
      >
        <form onSubmit={handleFormSubmit}>
          <div className="form-group">
            <label className="form-label">Nama Lengkap *</label>
            <input
              type="text"
              className="form-input"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Alamat Email *</label>
              <input
                type="email"
                className="form-input"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                disabled={!!selectedUser}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Role Akses (Wewenang) *</label>
              <select
                className="form-select"
                value={formData.roleId}
                onChange={(e) => setFormData({ ...formData, roleId: Number(e.target.value) })}
                required
              >
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {!selectedUser && (
            <div className="form-group">
              <label className="form-label">Kata Sandi Awal *</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  style={{ paddingRight: '40px' }}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--text-muted)',
                    padding: '4px'
                  }}
                  title={showPassword ? 'Sembunyikan sandi' : 'Lihat sandi'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Nomor Telepon</label>
              <input
                type="text"
                className="form-input"
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Departemen</label>
              <input
                type="text"
                className="form-input"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Alamat Domisili</label>
            <textarea
              className="form-textarea"
              rows={2}
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};
