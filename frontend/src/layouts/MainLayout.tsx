import React, { useState, useEffect, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { Navbar } from '../components/Navbar';
import { fadeIn } from '../utils/animations';

export const MainLayout: React.FC = () => {
  // Buka secara default pada desktop, tutup pada mobile
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(() => {
    return typeof window !== 'undefined' ? window.innerWidth >= 1025 : true;
  });
  const [isDesktop, setIsDesktop] = useState<boolean>(() => {
    return typeof window !== 'undefined' ? window.innerWidth >= 1025 : true;
  });
  const location = useLocation();
  const contentRef = useRef<HTMLDivElement>(null);

  // Pantau perubahan ukuran layar
  useEffect(() => {
    const handleResize = () => {
      const desktop = window.innerWidth >= 1025;
      setIsDesktop(desktop);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Animasi transisi lembut saat ganti route
  useEffect(() => {
    if (contentRef.current) {
      fadeIn(contentRef.current, 0, 250);
    }
  }, [location.pathname]);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-canvas)' }}>
      {/* Sidebar Navigasi */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        isDesktop={isDesktop}
      />

      {/* Konten Utama */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          marginLeft: isDesktop && isSidebarOpen ? 'var(--sidebar-width)' : '0px',
          transition: 'margin-left 0.25s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
        className="main-content-wrapper"
      >
        <Navbar
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
        />

        <main style={{ flex: 1, padding: '1.5rem', maxWidth: '1440px', width: '100%', margin: '0 auto' }}>
          <div ref={contentRef}>
            <Outlet />
          </div>
        </main>

        <footer
          style={{
            padding: '1.25rem 1.5rem',
            borderTop: 'var(--border-flat)',
            textAlign: 'center',
            fontSize: '0.875rem',
            fontWeight: 600,
            color: 'var(--text-secondary)',
            backgroundColor: 'var(--palette-cream)'
          }}
        >
          InvWare — Smart Warehouse & Inventory Management System &copy; 2026.
        </footer>
      </div>
    </div>
  );
};
