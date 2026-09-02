import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LogIn, Key, Mail, Eye, EyeOff } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setIsLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch {
      // Error handled by AuthContext
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('Password123!');
  };

  return (
    <div>
      <h2 style={{ fontSize: '1.25rem', color: 'var(--text-main)', fontWeight: 800, marginBottom: '0.25rem' }}>
        Masuk ke Akun Anda
      </h2>
      <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', fontWeight: 500 }}>
        Silakan masukkan email dan kata sandi yang telah terdaftar.
      </p>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Alamat Email</label>
          <div style={{ position: 'relative' }}>
            <Mail
              size={18}
              color="var(--text-muted)"
              style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
            />
            <input
              type="email"
              className="form-input"
              style={{ paddingLeft: '38px' }}
              placeholder="nama@smartwarehouse.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="form-group">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
            <label className="form-label">Kata Sandi</label>
            <Link
              to="/forgot-password"
              style={{ fontSize: '0.8125rem', color: 'var(--palette-rosewood)', textDecoration: 'none', fontWeight: 700 }}
            >
              Lupa Sandi?
            </Link>
          </div>
          <div style={{ position: 'relative' }}>
            <Key
              size={18}
              color="var(--text-muted)"
              style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
            />
            <input
              type={showPassword ? 'text' : 'password'}
              className="form-input"
              style={{ paddingLeft: '38px', paddingRight: '40px' }}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
              title={showPassword ? 'Sembunyikan kata sandi' : 'Lihat kata sandi'}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          className="btn btn-rosewood"
          style={{ width: '100%', marginTop: '0.5rem' }}
          disabled={isLoading}
        >
          <LogIn size={18} />
          <span>{isLoading ? 'Memverifikasi...' : 'Masuk Sekarang'}</span>
        </button>
      </form>

      {/* Akun Pengujian Cepat untuk Penguji/Admin */}
      <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1.5px dashed #2C2424' }}>
        <p style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-secondary)', marginBottom: '0.75rem', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Pilih Akun Demo (Password: Password123!)
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
          <button
            type="button"
            className="btn btn-sky btn-sm"
            onClick={() => handleQuickLogin('admin@smartwarehouse.com')}
          >
            Super Admin
          </button>
          <button
            type="button"
            className="btn btn-lavender btn-sm"
            style={{ backgroundColor: 'var(--palette-lavender)', color: '#FFFFFF' }}
            onClick={() => handleQuickLogin('manager.jkt@smartwarehouse.com')}
          >
            Manajer Gudang
          </button>
          <button
            type="button"
            className="btn btn-cream btn-sm"
            onClick={() => handleQuickLogin('staff.jkt1@smartwarehouse.com')}
          >
            Staf Gudang
          </button>
          <button
            type="button"
            className="btn btn-rosewood btn-sm"
            onClick={() => handleQuickLogin('purchasing.lead@smartwarehouse.com')}
          >
            Bagian Pembelian
          </button>
        </div>
      </div>
    </div>
  );
};
