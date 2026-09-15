import React, { useState } from 'react';
import { Menu, LogOut, Calendar, AlertTriangle, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { StatusBadge } from './StatusBadge';
import { resolveMediaUrl } from '../utils/media';

interface NavbarProps {
  onToggleSidebar: () => void;
  isSidebarOpen?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar, isSidebarOpen = true }) => {
  const { user, logout } = useAuth();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const today = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const handleConfirmLogout = async () => {
    setShowLogoutModal(false);
    await logout();
  };

  const avatarSrc = resolveMediaUrl(user?.avatarUrl, user?.fullName || 'Pengguna');

  return (
    <>
      <header className="navbar-header">
        {/* Kiri: Toggle Menu & Tanggal */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            onClick={onToggleSidebar}
            className="btn btn-secondary btn-sm"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: isSidebarOpen ? 'var(--palette-sky)' : '#FFFFFF',
              fontWeight: 800,
              borderColor: '#2C2424',
              boxShadow: '0 2px 0 #2C2424',
              padding: '0.375rem 0.625rem'
            }}
            title={isSidebarOpen ? 'Sembunyikan Sidebar Navigasi' : 'Tampilkan Sidebar Navigasi'}
          >
            <Menu size={18} />
            <span className="navbar-menu-text">Menu</span>
          </button>

          <div className="navbar-date">
            <Calendar size={16} color="var(--palette-rosewood)" />
            <span>{today}</span>
          </div>
        </div>

        {/* Kanan: Role Badge, Info Pengguna & Logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div className="navbar-role">
            {user && <StatusBadge status={user.role} type="role" />}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Link
              to="/profile"
              className="navbar-user-link"
              title="Buka Pengaturan Profil Akun"
            >
              <img
                src={avatarSrc}
                alt={user?.fullName || 'Avatar'}
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  objectFit: 'cover',
                  border: '1.5px solid #2C2424',
                  boxShadow: '0 2px 0 #2C2424',
                  backgroundColor: '#FFFFFF'
                }}
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName || 'U')}&background=946D6D&color=fff&bold=true`;
                }}
              />
              <span className="navbar-user-name" style={{ color: 'var(--text-main)' }}>
                {user?.fullName || 'Pengguna'}
              </span>
            </Link>

            {/* Tombol Keluar memicu Modal Konfirmasi */}
            <button
              type="button"
              onClick={() => setShowLogoutModal(true)}
              className="btn btn-rosewood btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '0.375rem 0.625rem' }}
              title="Keluar dari sesi akun"
            >
              <LogOut size={16} />
              <span className="navbar-logout-text">Keluar</span>
            </button>
          </div>
        </div>
      </header>

      {/* ====================================================================
          MODAL KONFIRMASI KELUAR (BENTO FLAT DESIGN)
          ==================================================================== */}
      {showLogoutModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(44, 36, 36, 0.6)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem',
            animation: 'fadeIn 0.15s ease-out'
          }}
          onClick={() => setShowLogoutModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: '#FFFFFF',
              border: '2px solid #2C2424',
              borderRadius: '16px',
              boxShadow: '0 8px 0 #2C2424',
              maxWidth: '440px',
              width: '100%',
              overflow: 'hidden',
              animation: 'modalPop 0.25s cubic-bezier(0.34, 1.56, 0.64, 1) forwards'
            }}
          >
            {/* Header Modal */}
            <div
              style={{
                backgroundColor: 'var(--palette-cream)',
                borderBottom: '1.5px solid #2C2424',
                padding: '1rem 1.25rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="badge badge-rosewood">Konfirmasi Keamanan</span>
                <h3 style={{ fontSize: '1.0625rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
                  Keluar dari Sistem
                </h3>
              </div>
              <button
                onClick={() => setShowLogoutModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  color: 'var(--text-secondary)'
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Isi Konten Modal */}
            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '10px',
                    backgroundColor: 'var(--palette-cream)',
                    color: 'var(--palette-rosewood)',
                    border: '1.5px solid #2C2424',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 0 #2C2424',
                    flexShrink: 0
                  }}
                >
                  <AlertTriangle size={22} />
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    Apakah Anda yakin ingin keluar?
                  </p>
                  <p style={{ margin: '4px 0 0 0', fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                    Sesi pengguna <strong>{user?.fullName}</strong> akan diakhiri. Anda perlu memasukkan kredensial login kembali untuk mengakses data pergudangan.
                  </p>
                </div>
              </div>

              {/* Tombol Aksi */}
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setShowLogoutModal(false)}
                  className="btn btn-secondary btn-sm"
                  style={{ padding: '8px 16px', fontWeight: 700 }}
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleConfirmLogout}
                  className="btn btn-rosewood btn-sm"
                  style={{
                    padding: '8px 18px',
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <LogOut size={16} />
                  <span>Ya, Keluar Sekarang</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes modalPop {
          from {
            opacity: 0;
            transform: scale(0.92) translateY(8px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
      `}</style>
    </>
  );
};
