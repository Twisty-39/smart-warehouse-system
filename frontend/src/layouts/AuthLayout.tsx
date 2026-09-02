import React from 'react';
import { Outlet } from 'react-router-dom';

export const AuthLayout: React.FC = () => {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
        backgroundColor: 'var(--bg-canvas)'
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '480px'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <img
            src="/logo.png"
            alt="InvWare Logo"
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '16px',
              objectFit: 'contain',
              border: '2px solid #2C2424',
              boxShadow: '0 4px 0 #2C2424',
              backgroundColor: '#FFFFFF',
              padding: '4px',
              marginBottom: '0.75rem',
              display: 'inline-block'
            }}
          />
          <h1 style={{ fontSize: '1.625rem', color: 'var(--text-main)', fontWeight: 800 }}>
            InvWare Portal
          </h1>
          <p style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)', marginTop: '4px', fontWeight: 600 }}>
            Sistem Manajemen Gudang & Inventaris
          </p>
        </div>

        <div
          style={{
            backgroundColor: 'var(--palette-cream)',
            border: '2px solid #2C2424',
            borderRadius: '16px',
            padding: '2rem',
            boxShadow: '0 6px 0 #2C2424'
          }}
        >
          <Outlet />
        </div>
      </div>
    </div>
  );
};
