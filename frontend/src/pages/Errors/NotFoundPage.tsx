import React from 'react';
import { Compass, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export const NotFoundPage: React.FC = () => {
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
          backgroundColor: 'var(--palette-sky, #93B5C6)',
          color: '#2C2424',
          border: '2px solid #2C2424',
          boxShadow: '3px 3px 0px #2C2424',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '1.25rem'
        }}
      >
        <Compass size={38} />
      </div>
      <h1 style={{ fontSize: '2rem', color: 'var(--text-main, #2C2424)', fontWeight: 800, marginBottom: '0.5rem' }}>404 - Halaman Tidak Ditemukan</h1>
      <p style={{ color: 'var(--text-secondary, #6B5E5E)', maxWidth: '480px', marginBottom: '1.75rem', lineHeight: '1.6', fontWeight: 500 }}>
        Tautan atau rute halaman yang Anda tuju tidak tersedia atau telah dipindahkan ke lokasi lain.
      </p>
      <Link to="/dashboard" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
        <ArrowLeft size={18} /> Kembali ke Dasbor
      </Link>
    </div>
  );
};
