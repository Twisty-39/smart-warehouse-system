import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authApi } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { KeyRound, CheckCircle2, ArrowLeft, Eye, EyeOff, RotateCw, Copy, Check, ShieldCheck } from 'lucide-react';

export const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const emailParam = searchParams.get('email') || '';
  const otpParam = searchParams.get('otp') || '';

  const [email, setEmail] = useState(emailParam);
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [demoOtp, setDemoOtp] = useState<string>(otpParam);
  const [copiedOtp, setCopiedOtp] = useState(false);

  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);

  const [countdown, setCountdown] = useState<number>(60);
  const [isResending, setIsResending] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const toast = useToast();
  const navigate = useNavigate();

  // Populate from params
  useEffect(() => {
    if (emailParam) setEmail(emailParam);
    if (otpParam && otpParam.length === 6) {
      setDemoOtp(otpParam);
      // Do not auto-fill otpDigits: let user enter manually or click "Gunakan Kode"
      setOtpDigits(['', '', '', '', '', '']);
    }
  }, [emailParam, otpParam]);

  // Resend Countdown Timer
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  // Handle single digit input
  const handleDigitChange = (index: number, value: string) => {
    const char = value.slice(-1); // Only last character
    if (char && !/^\d$/.test(char)) return; // Only numbers

    const newDigits = [...otpDigits];
    newDigits[index] = char;
    setOtpDigits(newDigits);

    // Auto-advance to next input
    if (char && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Handle backspace navigation
  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Handle pasting full 6-digit OTP
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    if (/^\d{6}$/.test(pastedData)) {
      const splitDigits = pastedData.split('');
      setOtpDigits(splitDigits);
      inputRefs.current[5]?.focus();
      toast.success('Kode OTP berhasil ditempelkan!');
    }
  };

  // Use Demo OTP button handler
  const handleApplyDemoOtp = () => {
    if (!demoOtp || demoOtp.length !== 6) return;
    setOtpDigits(demoOtp.split(''));
    inputRefs.current[5]?.focus();
    toast.success(`Kode OTP ${demoOtp} berhasil dimasukkan otomatis!`);
  };

  // Copy Demo OTP
  const handleCopyDemoOtp = () => {
    if (!demoOtp) return;
    navigator.clipboard.writeText(demoOtp);
    setCopiedOtp(true);
    toast.info('Kode OTP disalin ke clipboard!');
    setTimeout(() => setCopiedOtp(false), 2000);
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (!email) {
      toast.error('Alamat email tidak ditemukan.');
      return;
    }

    setIsResending(true);
    try {
      const res = await authApi.resendOtp(email);
      if (res.otpCode) {
        setDemoOtp(res.otpCode);
        toast.success(`Kode OTP baru berhasil dibuat: ${res.otpCode}`);
      } else {
        toast.success(res.message || 'Kode OTP baru berhasil dikirimkan!');
      }
      setCountdown(60);
      setOtpDigits(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal mengirim ulang kode OTP.');
    } finally {
      setIsResending(false);
    }
  };

  // Submit Password Reset with 6-Digit OTP
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const fullOtp = otpDigits.join('');
    if (fullOtp.length !== 6) {
      toast.error('Harap masukkan 6 digit kode OTP secara lengkap.');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('Kata sandi baru minimal harus 6 karakter.');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      toast.error('Konfirmasi kata sandi baru tidak cocok.');
      return;
    }

    setIsSubmitting(true);
    try {
      const msg = await authApi.resetPassword({
        email,
        otpCode: fullOtp,
        token: fullOtp,
        newPassword,
        confirmNewPassword
      });
      toast.success(msg || 'Kata sandi berhasil diperbarui!');
      navigate('/login');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal mereset kata sandi. Pastikan OTP valid.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.5rem' }}>
        <div style={{ padding: '6px', borderRadius: '8px', backgroundColor: 'var(--palette-lavender)', border: '1.5px solid #2C2424' }}>
          <KeyRound size={20} color="#FFFFFF" />
        </div>
        <h3 style={{ fontSize: '1.25rem', color: 'var(--text-main)', fontWeight: 700, margin: 0 }}>Verifikasi OTP & Reset Sandi</h3>
      </div>
      <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
        Masukkan <strong>6-Digit Kode OTP</strong> dan kata sandi baru untuk akun Anda ({email || 'email Anda'}).
      </p>

      {/* Demo OTP Helper Banner */}
      {demoOtp && (
        <div style={{
          padding: '12px 14px',
          backgroundColor: '#FAF7EE',
          border: '1.5px solid #2C2424',
          borderRadius: '10px',
          marginBottom: '1.25rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '10px',
          boxShadow: '2px 2px 0px #2C2424'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--palette-rosewood)' }}>
              <ShieldCheck size={16} /> Mode Demo OTP:
            </div>
            <div style={{ fontSize: '1.125rem', fontWeight: 800, letterSpacing: '4px', color: 'var(--text-main)', marginTop: '2px', fontFamily: 'monospace' }}>
              {demoOtp}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              type="button"
              onClick={handleCopyDemoOtp}
              className="btn btn-secondary"
              style={{ height: '32px', padding: '0 10px', fontSize: '0.75rem', gap: '4px' }}
              title="Salin Kode"
            >
              {copiedOtp ? <Check size={14} color="#15803D" /> : <Copy size={14} />}
              <span>{copiedOtp ? 'Tersalin' : 'Salin'}</span>
            </button>
            <button
              type="button"
              onClick={handleApplyDemoOtp}
              className="btn btn-primary"
              style={{ height: '32px', padding: '0 10px', fontSize: '0.75rem' }}
            >
              Gunakan Kode
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Email Read-only Display */}
        <div className="form-group" style={{ marginBottom: '1rem' }}>
          <label className="form-label" style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.8125rem' }}>Email Terdaftar</label>
          <input
            type="email"
            className="form-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ fontWeight: 600, color: 'var(--text-main)', backgroundColor: '#F4EFE6' }}
            required
          />
        </div>

        {/* 6-Digit OTP Boxes */}
        <div className="form-group" style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <label className="form-label" style={{ fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
              Kode Verifikasi OTP (6 Digit) *
            </label>
            {countdown > 0 ? (
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                Kirim ulang dalam ({countdown}s)
              </span>
            ) : (
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={isResending}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--palette-rosewood)',
                  fontWeight: 700,
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: 0
                }}
              >
                <RotateCw size={12} className={isResending ? 'spin' : ''} />
                <span>{isResending ? 'Mengirim...' : 'Kirim Ulang OTP'}</span>
              </button>
            )}
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(6, minmax(0, 1fr))',
              gap: '8px',
              width: '100%',
              boxSizing: 'border-box'
            }}
            onPaste={handlePaste}
          >
            {otpDigits.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => { inputRefs.current[idx] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleDigitChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                style={{
                  width: '100%',
                  minWidth: '0',
                  height: '48px',
                  textAlign: 'center',
                  fontSize: '1.25rem',
                  fontWeight: 800,
                  borderRadius: '10px',
                  border: digit ? '2px solid var(--palette-rosewood)' : '1.5px solid #2C2424',
                  backgroundColor: digit ? '#FAF7EE' : '#FFFFFF',
                  color: 'var(--text-main)',
                  boxShadow: digit ? '2px 2px 0px #2C2424' : 'none',
                  outline: 'none',
                  transition: 'all 0.15s ease',
                  boxSizing: 'border-box',
                  padding: '0'
                }}
              />
            ))}
          </div>
        </div>

        {/* New Password */}
        <div className="form-group" style={{ marginBottom: '1rem' }}>
          <label className="form-label" style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.8125rem' }}>Kata Sandi Baru *</label>
          <div style={{ position: 'relative' }}>
            <input
              type={showNewPassword ? 'text' : 'password'}
              className="form-input"
              style={{ paddingRight: '40px', color: 'var(--text-main)' }}
              placeholder="Minimal 6 karakter"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
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
              title={showNewPassword ? 'Sembunyikan' : 'Tampilkan'}
            >
              {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {/* Confirm New Password */}
        <div className="form-group" style={{ marginBottom: '1.25rem' }}>
          <label className="form-label" style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.8125rem' }}>Ulangi Kata Sandi Baru *</label>
          <div style={{ position: 'relative' }}>
            <input
              type={showConfirmNewPassword ? 'text' : 'password'}
              className="form-input"
              style={{ paddingRight: '40px', color: 'var(--text-main)' }}
              placeholder="••••••••"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
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
              title={showConfirmNewPassword ? 'Sembunyikan' : 'Tampilkan'}
            >
              {showConfirmNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          className="btn btn-primary"
          style={{ width: '100%', padding: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          disabled={isSubmitting}
        >
          <CheckCircle2 size={18} />
          <span>{isSubmitting ? 'Memverifikasi...' : 'Verifikasi OTP & Reset Sandi'}</span>
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
          <ArrowLeft size={16} /> Batal & Kembali ke Login
        </Link>
      </div>
    </div>
  );
};
