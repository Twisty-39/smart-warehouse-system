import React, { useEffect, useState, useCallback } from 'react';
import { categoriesApi } from '../../services/api';
import { Category } from '../../types';
import { Modal } from '../../components/Modal';
import { ConfirmModal } from '../../components/ConfirmModal';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { Plus, Edit2, Trash2, Search, Layers, Package } from 'lucide-react';

export const CategoriesPage: React.FC = () => {
  const { user } = useAuth();
  const canManageCategories = user?.roleCode === 'ROLE_ADMIN' || user?.roleCode === 'ROLE_MANAGER';

  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    parentCategoryId: undefined as number | undefined
  });

  const toast = useToast();

  const fetchCategories = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await categoriesApi.getAll(search);
      setCategories(data);
    } catch {
      toast.error('Gagal memuat daftar kategori.');
    } finally {
      setIsLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleOpenCreate = () => {
    setSelectedCategory(null);
    setFormData({
      name: '',
      code: `CAT-${Date.now().toString().slice(-4)}`,
      description: '',
      parentCategoryId: undefined
    });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (cat: Category) => {
    setSelectedCategory(cat);
    setFormData({
      name: cat.name,
      code: cat.code,
      description: cat.description || '',
      parentCategoryId: cat.parentCategoryId
    });
    setIsFormOpen(true);
  };

  const handleOpenDelete = (cat: Category) => {
    setSelectedCategory(cat);
    setIsDeleteOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (selectedCategory) {
        await categoriesApi.update(selectedCategory.id, formData);
        toast.success(`Kategori '${formData.name}' berhasil diperbarui.`);
      } else {
        await categoriesApi.create(formData);
        toast.success(`Kategori baru '${formData.name}' berhasil ditambahkan.`);
      }
      setIsFormOpen(false);
      fetchCategories();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan kategori.');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedCategory) return;
    try {
      await categoriesApi.delete(selectedCategory.id);
      toast.success(`Kategori '${selectedCategory.name}' berhasil dihapus.`);
      setIsDeleteOpen(false);
      fetchCategories();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal menghapus kategori.');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', color: 'var(--text-main)' }}>Master Kategori Barang</h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Pengelompokan hierarki katalog inventaris untuk klasifikasi dan manajemen pergudangan.
          </p>
        </div>

        {canManageCategories && (
          <button onClick={handleOpenCreate} className="btn btn-primary">
            <Plus size={18} /> Tambah Kategori
          </button>
        )}
      </div>

      <div className="card" style={{ padding: '1.25rem' }}>
        <div style={{ marginBottom: '1.25rem', display: 'flex', gap: '0.75rem', maxWidth: '360px' }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '38px' }}
              placeholder="Cari nama atau kode kategori..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Nama Kategori</th>
                <th>Kode</th>
                <th>Deskripsi</th>
                <th>Jumlah SKU Terkait</th>
                <th>Tanggal Dibuat</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '3rem' }}>
                    <div style={{ display: 'inline-block', width: '32px', height: '32px', border: '3px solid #E2D7BE', borderTopColor: 'var(--palette-rosewood)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                  </td>
                </tr>
              ) : categories.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                    Tidak ada kategori yang ditemukan.
                  </td>
                </tr>
              ) : (
                categories.map((cat) => (
                  <tr key={cat.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ padding: '6px', borderRadius: '8px', backgroundColor: 'var(--palette-lavender)', color: '#FFFFFF', border: '1px solid #2C2424' }}>
                          <Layers size={16} />
                        </div>
                        <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{cat.name}</span>
                      </div>
                    </td>
                    <td>
                      <code>{cat.code}</code>
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem', maxWidth: '300px' }}>
                      {cat.description || '-'}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Package size={15} color="var(--palette-rosewood)" />
                        <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>{cat.productCount} Produk</span>
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem', fontWeight: 500 }}>
                      {new Date(cat.createdAt).toLocaleDateString('id-ID')}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {canManageCategories ? (
                          <>
                            <button
                              onClick={() => handleOpenEdit(cat)}
                              className="btn btn-cream btn-icon"
                              style={{ width: '34px', height: '34px' }}
                              title="Edit Kategori"
                            >
                              <Edit2 size={16} color="#2C2424" />
                            </button>
                            <button
                              onClick={() => handleOpenDelete(cat)}
                              className="btn btn-danger btn-icon"
                              style={{ width: '34px', height: '34px' }}
                              title="Hapus Kategori"
                            >
                              <Trash2 size={16} color="#2C2424" />
                            </button>
                          </>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Read-Only</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Form Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={selectedCategory ? `Edit Kategori: ${selectedCategory.name}` : 'Tambah Kategori Baru'}
        maxWidth="500px"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setIsFormOpen(false)}>
              Batal
            </button>
            <button className="btn btn-primary" onClick={handleFormSubmit}>
              {selectedCategory ? 'Perbarui' : 'Simpan Kategori'}
            </button>
          </>
        }
      >
        <form onSubmit={handleFormSubmit}>
          <div className="form-group">
            <label className="form-label">Nama Kategori *</label>
            <input
              type="text"
              className="form-input"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Kode Kategori *</label>
            <input
              type="text"
              className="form-input"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Deskripsi</label>
            <textarea
              className="form-textarea"
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
        </form>
      </Modal>

      {/* Delete Modal */}
      <ConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Hapus Kategori"
        message={`Apakah Anda yakin ingin menghapus kategori '${selectedCategory?.name}'?`}
        confirmLabel="Ya, Hapus Kategori"
      />
    </div>
  );
};
