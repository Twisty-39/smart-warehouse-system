import React from 'react';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export const UnauthorizedPage: React.FC = () => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '70vh',
        textAlign: 'center',
        padding: '2rem'
      }}
    >
      <div
        style={{
          width: '72px',
          height: '72px',
          borderRadius: '16px',
          backgroundColor: '#FDF0F0',
          color: '#DC2626',
          border: '2px solid #2C2424',
          boxShadow: '3px 3px 0px #2C2424',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '1.25rem'
        }}
      >
        <ShieldAlert size={38} />
      </div>
      <h1 style={{ fontSize: '2rem', color: 'var(--text-main, #2C2424)', fontWeight: 800, marginBottom: '0.5rem' }}>403 - Akses Ditolak</h1>
      <p style={{ color: 'var(--text-secondary, #6B5E5E)', maxWidth: '480px', marginBottom: '1.75rem', lineHeight: '1.6', fontWeight: 500 }}>
        Anda tidak memiliki hak akses (role wewenang) yang sesuai untuk membuka halaman atau fitur ini. Silakan hubungi Super Administrator jika ini adalah kekeliruan.
      </p>
      <Link to="/dashboard" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
        <ArrowLeft size={18} /> Kembali ke Dasbor
      </Link>
    </div>
  );
};
