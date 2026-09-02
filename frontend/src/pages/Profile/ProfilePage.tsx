import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { usersApi } from '../../services/api';
import { User } from '../../types';
import { FileUpload } from '../../components/FileUpload';
import { StatusBadge } from '../../components/StatusBadge';
import { useToast } from '../../context/ToastContext';
import { User as UserIcon, Mail, Phone, Briefcase, MapPin, Key, Save, Shield, Eye, EyeOff } from 'lucide-react';
import { resolveMediaUrl } from '../../utils/media';

export const ProfilePage: React.FC = () => {
  const { user, setUser } = useAuth();
  const toast = useToast();

  const [profileData, setProfileData] = useState({
    fullName: '',
    phoneNumber: '',
    department: '',
    address: '',
    avatarUrl: ''
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: ''
  });

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);

  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isChangingPass, setIsChangingPass] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileData({
        fullName: user.fullName || '',
        phoneNumber: user.phoneNumber || '',
        department: user.department || '',
        address: user.address || '',
        avatarUrl: user.avatarUrl || ''
      });
    }
  }, [user]);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    try {
      const updated = await usersApi.updateProfile(profileData);
      const mergedUser: User = {
        ...(user || {}),
        ...updated,
        role: updated.role || updated.roleName || user?.role || 'Administrator',
        roleCode: updated.roleCode || user?.roleCode || 'ROLE_ADMIN'
      } as User;
      setUser(mergedUser);
      localStorage.setItem('swims_user', JSON.stringify(mergedUser));
      toast.success('Profil akun berhasil diperbarui!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal memperbarui profil.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmNewPassword) {
      toast.error('Konfirmasi kata sandi baru tidak cocok.');
      return;
    }

    setIsChangingPass(true);
    try {
      const msg = await usersApi.changePassword(passwordData);
      toast.success(msg);
      setPasswordData({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal mengganti kata sandi.');
    } finally {
      setIsChangingPass(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '900px' }}>
      <div>
        <h1 style={{ fontSize: '1.5rem', color: 'var(--text-main)' }}>Pengaturan Profil & Akun</h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          Kelola informasi personal, avatar foto profil, dan kata sandi login Anda.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {/* Profile Card Form */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
            <img
              src={resolveMediaUrl(profileData.avatarUrl, user?.fullName || 'U')}
              alt={user?.fullName}
              style={{ width: '64px', height: '64px', borderRadius: '12px', objectFit: 'cover', border: '1.5px solid #2C2424', backgroundColor: '#FFFFFF' }}
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName || 'U')}&background=946D6D&color=fff&bold=true`;
              }}
            />
            <div>
              <h3 style={{ fontSize: '1.125rem', color: 'var(--text-main)' }}>{user?.fullName}</h3>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{user?.email}</p>
              <div style={{ marginTop: '4px' }}>
                <StatusBadge status={user?.role || ''} type="role" />
              </div>
            </div>
          </div>

          <form onSubmit={handleProfileSubmit}>
            <div className="form-group">
              <label className="form-label">Nama Lengkap</label>
              <input
                type="text"
                className="form-input"
                value={profileData.fullName}
                onChange={(e) => setProfileData({ ...profileData, fullName: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Nomor Telepon / WhatsApp</label>
              <input
                type="tel"
                className="form-input"
                placeholder="081234567890"
                value={profileData.phoneNumber}
                onChange={(e) => setProfileData({ ...profileData, phoneNumber: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Departemen / Divisi</label>
              <input
                type="text"
                className="form-input"
                placeholder="Logistik, Operasional, dsb."
                value={profileData.department}
                onChange={(e) => setProfileData({ ...profileData, department: e.target.value })}
              />
            </div>

            <FileUpload
              label="Ganti Foto Avatar (Maks. 2MB)"
              acceptType="image"
              folder="avatars"
              value={profileData.avatarUrl}
              onChange={(url) => setProfileData({ ...profileData, avatarUrl: url })}
            />

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={isSavingProfile}>
              <Save size={18} />
              <span>{isSavingProfile ? 'Menyimpan...' : 'Simpan Profil'}</span>
            </button>
          </form>
        </div>

        {/* Change Password Card */}
        <div className="card" style={{ height: 'fit-content' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.25rem' }}>
            <Key size={20} color="var(--palette-rosewood)" />
            <h3 style={{ fontSize: '1.125rem', color: 'var(--text-main)' }}>Ganti Kata Sandi</h3>
          </div>

          <form onSubmit={handlePasswordSubmit}>
            <div className="form-group">
              <label className="form-label">Kata Sandi Saat Ini</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  className="form-input"
                  style={{ paddingRight: '40px' }}
                  placeholder="••••••••"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword((prev) => !prev)}
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
                  title={showCurrentPassword ? 'Sembunyikan sandi' : 'Lihat sandi'}
                >
                  {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Kata Sandi Baru</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  className="form-input"
                  style={{ paddingRight: '40px' }}
                  placeholder="••••••••"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword((prev) => !prev)}
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
                  title={showNewPassword ? 'Sembunyikan sandi' : 'Lihat sandi'}
                >
                  {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Konfirmasi Sandi Baru</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showConfirmNewPassword ? 'text' : 'password'}
                  className="form-input"
                  style={{ paddingRight: '40px' }}
                  placeholder="••••••••"
                  value={passwordData.confirmNewPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmNewPassword: e.target.value })}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmNewPassword((prev) => !prev)}
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
                  title={showConfirmNewPassword ? 'Sembunyikan sandi' : 'Lihat sandi'}
                >
                  {showConfirmNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button type="submit" className="btn btn-secondary" style={{ width: '100%', marginTop: '0.5rem' }} disabled={isChangingPass}>
              <Shield size={16} />
              {isChangingPass ? 'Memproses...' : 'Ubah Kata Sandi'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
