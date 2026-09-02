import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Layers,
  Warehouse,
  Boxes,
  ArrowLeftRight,
  ShoppingCart,
  Truck,
  Users,
  UserCheck,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isDesktop?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, isDesktop }) => {
  const { user } = useAuth();
  const isAdmin = user?.roleCode === 'ROLE_ADMIN';

  const menuItems = [
    { to: '/dashboard', label: 'Dasbor Utama', icon: <LayoutDashboard size={20} /> },
    { to: '/products', label: 'Katalog Produk', icon: <Package size={20} /> },
    { to: '/inventory', label: 'Stok & Lokasi Rak', icon: <Boxes size={20} /> },
    { to: '/transactions', label: 'Mutasi Barang', icon: <ArrowLeftRight size={20} /> },
    { to: '/purchase-orders', label: 'Pesanan Pembelian (PO)', icon: <ShoppingCart size={20} /> },
    { to: '/warehouses', label: 'Daftar Gudang', icon: <Warehouse size={20} /> },
    { to: '/suppliers', label: 'Daftar Pemasok', icon: <Truck size={20} /> },
    { to: '/categories', label: 'Kategori Produk', icon: <Layers size={20} /> }
  ];

  if (isAdmin) {
    menuItems.push({ to: '/users', label: 'Manajemen Pengguna', icon: <Users size={20} /> });
  }

  menuItems.push({ to: '/profile', label: 'Profil Akun', icon: <UserCheck size={20} /> });

  return (
    <>
      {/* Mobile Backdrop (Hanya di layar non-desktop) */}
      {!isDesktop && isOpen && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(44, 36, 36, 0.5)',
            zIndex: 40
          }}
        />
      )}

      <aside
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          width: 'var(--sidebar-width)',
          backgroundColor: 'var(--palette-cream)',
          borderRight: 'var(--border-flat)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 50,
          transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          transform: isOpen ? 'translateX(0)' : 'translateX(-100%)'
        }}
        className="sidebar-container"
      >
        {/* Brand Header */}
        <div
          style={{
            height: 'var(--navbar-height)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 1.25rem',
            borderBottom: 'var(--border-flat)',
            backgroundColor: 'var(--palette-cream)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img
              src="/logo.png"
              alt="InvWare Logo"
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                objectFit: 'contain',
                border: '1.5px solid #2C2424',
                boxShadow: '0 2px 0 #2C2424',
                backgroundColor: '#FFFFFF',
                padding: '2px'
              }}
            />
            <div>
              <div style={{ fontWeight: 800, fontSize: '1.1875rem', color: 'var(--text-main)', lineHeight: 1.2, letterSpacing: '-0.01em' }}>
                InvWare
              </div>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Sistem Pergudangan
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="btn btn-secondary btn-sm mobile-close-btn"
            style={{ display: 'none', padding: '6px' }}
            title="Tutup Menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* Menu Navigasi */}
        <div style={{ flex: 1, padding: '1.25rem 0.875rem', overflowY: 'auto' }}>
          <div
            style={{
              fontSize: '0.75rem',
              fontWeight: 800,
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              padding: '0 0.5rem 0.625rem'
            }}
          >
            Menu Operasional
          </div>

          <nav style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {menuItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => {
                  if (typeof window !== 'undefined' && window.innerWidth < 1025) onClose();
                }}
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '0.625rem 0.875rem',
                  borderRadius: '10px',
                  textDecoration: 'none',
                  fontSize: '0.9375rem',
                  fontWeight: isActive ? 800 : 600,
                  color: isActive ? '#FFFFFF' : 'var(--text-main)',
                  backgroundColor: isActive ? 'var(--palette-rosewood)' : 'transparent',
                  border: isActive ? '1.5px solid #2C2424' : '1.5px solid transparent',
                  boxShadow: isActive ? '0 3px 0 #2C2424' : 'none',
                  transition: 'all 0.15s ease'
                })}
              >
                {item.icon}
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Footer Widget Sederhana */}
        <div
          style={{
            padding: '1rem',
            borderTop: 'var(--border-flat)',
            fontSize: '0.8125rem',
            fontWeight: 600,
            color: 'var(--text-secondary)',
            textAlign: 'center',
            backgroundColor: 'rgba(253, 244, 210, 0.6)'
          }}
        >
          InvWare v1.0.0 &copy; 2026
        </div>
      </aside>

      <style>{`
        @media (max-width: 1024px) {
          .mobile-close-btn {
            display: flex !important;
          }
        }
      `}</style>
    </>
  );
};
