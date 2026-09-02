import React from 'react';
import { ServerCrash, RefreshCw } from 'lucide-react';

export const ServerErrorPage: React.FC = () => {
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
          backgroundColor: '#FEF9EB',
          color: '#B45309',
          border: '2px solid #2C2424',
          boxShadow: '3px 3px 0px #2C2424',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '1.25rem'
        }}
      >
        <ServerCrash size={38} />
      </div>
      <h1 style={{ fontSize: '2rem', color: 'var(--text-main, #2C2424)', fontWeight: 800, marginBottom: '0.5rem' }}>500 - Gangguan Server</h1>
      <p style={{ color: 'var(--text-secondary, #6B5E5E)', maxWidth: '480px', marginBottom: '1.75rem', lineHeight: '1.6', fontWeight: 500 }}>
        Terjadi kendala pada backend server atau koneksi database SQL Server. Silakan muat ulang halaman atau periksa status service database Anda.
      </p>
      <button onClick={() => window.location.reload()} className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
        <RefreshCw size={18} /> Muat Ulang Halaman
      </button>
    </div>
  );
};
