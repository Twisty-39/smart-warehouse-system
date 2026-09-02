import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Mail, ArrowLeft, KeyRound, ShieldCheck } from 'lucide-react';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    try {
      const res = await authApi.forgotPassword(email);
      toast.success(res.message || 'Kode OTP 6-digit berhasil dikirimkan!');
      navigate(`/reset-password?email=${encodeURIComponent(email)}&otp=${encodeURIComponent(res.otpCode || '')}`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal memproses permohonan reset sandi.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.5rem' }}>
        <div style={{ padding: '6px', borderRadius: '8px', backgroundColor: 'var(--palette-sky)', border: '1.5px solid #2C2424' }}>
          <KeyRound size={20} color="#2C2424" />
        </div>
        <h3 style={{ fontSize: '1.25rem', color: 'var(--text-main)', fontWeight: 700, margin: 0 }}>Lupa Kata Sandi?</h3>
      </div>
      <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
        Masukkan alamat email terdaftar untuk menerima <strong>6-Digit Kode Verifikasi OTP</strong>.
      </p>

      {/* Info Banner Mode Demo */}
      <div style={{
        padding: '10px 12px',
        backgroundColor: '#EAF7EE',
        border: '1.5px solid #15803D',
        borderRadius: '8px',
        marginBottom: '1.25rem',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: '0.75rem',
        color: '#0D4720'
      }}>
        <ShieldCheck size={16} color="#15803D" style={{ flexShrink: 0 }} />
        <span><strong>Mode Demo Siap Pakai:</strong> Kode OTP 6-digit akan langsung ditampilkan di layar verifikasi berikutnya.</span>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label" style={{ fontWeight: 600, color: 'var(--text-main)' }}>Alamat Email Terdaftar *</label>
          <div style={{ position: 'relative' }}>
            <Mail size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="email"
              className="form-input"
              style={{ paddingLeft: '38px', color: 'var(--text-main)', fontWeight: 500 }}
              placeholder="nama@smartwarehouse.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
        </div>

        <button
          type="submit"
          className="btn btn-primary"
          style={{ width: '100%', marginTop: '0.5rem', padding: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          disabled={isLoading}
        >
          <KeyRound size={18} />
          <span>{isLoading ? 'Menghasilkan OTP...' : 'Dapatkan Kode OTP'}</span>
        </button>
      </form>

      <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
        <Link
          to="/login"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            color: 'var(--text-secondary)',
            fontSize: '0.8125rem',
            textDecoration: 'none',
            fontWeight: 600
          }}
        >
          <ArrowLeft size={16} /> Kembali ke Halaman Masuk
        </Link>
      </div>
    </div>
  );
};
