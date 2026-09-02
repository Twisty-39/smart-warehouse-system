import React, { createContext, useContext, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
  isExiting?: boolean;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType, duration?: number) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  warning: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismissToast = useCallback((id: string) => {
    // Tandai toast sebagai sedang exit untuk memicu animasi out
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, isExiting: true } : t))
    );
    // Hapus dari state setelah animasi keluar selesai (250ms)
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 250);
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType = 'info', duration: number = 4000) => {
      const id = Math.random().toString(36).substring(2, 9);
      setToasts((prev) => [...prev, { id, message, type, duration, isExiting: false }]);

      if (duration > 0) {
        setTimeout(() => {
          dismissToast(id);
        }, duration);
      }
    },
    [dismissToast]
  );

  const success = useCallback((msg: string) => showToast(msg, 'success'), [showToast]);
  const error = useCallback((msg: string) => showToast(msg, 'error'), [showToast]);
  const warning = useCallback((msg: string) => showToast(msg, 'warning'), [showToast]);
  const info = useCallback((msg: string) => showToast(msg, 'info'), [showToast]);

  const toastStyles: Record<
    ToastType,
    { bg: string; border: string; text: string; badgeBg: string; shadow: string; icon: React.ReactNode }
  > = {
    success: {
      bg: '#EAF7EE',
      border: '#15803D',
      text: '#0D4720',
      badgeBg: '#D1EEDB',
      shadow: '#15803D',
      icon: <CheckCircle2 size={20} color="#15803D" />
    },
    error: {
      bg: '#FDF0F0',
      border: '#DC2626',
      text: '#781515',
      badgeBg: '#FBD4D4',
      shadow: '#DC2626',
      icon: <AlertCircle size={20} color="#DC2626" />
    },
    warning: {
      bg: '#FEF9EB',
      border: '#D97706',
      text: '#78350F',
      badgeBg: '#FDE68A',
      shadow: '#D97706',
      icon: <AlertTriangle size={20} color="#D97706" />
    },
    info: {
      bg: '#EEF7FC',
      border: '#0284C7',
      text: '#0C4A6E',
      badgeBg: '#BAE6FD',
      shadow: '#0284C7',
      icon: <Info size={20} color="#0284C7" />
    }
  };

  const toastContainer = (
    <div
      style={{
        position: 'fixed',
        top: '24px',
        right: '24px',
        zIndex: 1000000, // Selalu di atas segala modal, drawer, dan backdrop
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        maxWidth: '420px',
        width: 'calc(100% - 48px)',
        pointerEvents: 'none'
      }}
    >
      {toasts.map((toast) => {
        const style = toastStyles[toast.type];

        return (
          <div
            key={toast.id}
            className={`toast-bento-card ${toast.isExiting ? 'toast-exit' : 'toast-enter'}`}
            style={{
              pointerEvents: 'auto',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              padding: '12px 16px',
              backgroundColor: style.bg,
              border: `2px solid ${style.border}`,
              borderRadius: '12px',
              color: style.text,
              boxShadow: `0 4px 0 ${style.shadow}`,
              fontWeight: 700
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  backgroundColor: style.badgeBg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                {style.icon}
              </div>
              <span style={{ fontSize: '0.875rem', lineHeight: '1.45', fontWeight: 700 }}>
                {toast.message}
              </span>
            </div>
            <button
              type="button"
              onClick={() => dismissToast(toast.id)}
              style={{
                background: 'transparent',
                border: 'none',
                color: style.text,
                opacity: 0.7,
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '6px',
                transition: 'all 0.15s ease'
              }}
              title="Tutup Notifikasi"
            >
              <X size={18} />
            </button>
          </div>
        );
      })}

      <style>{`
        @keyframes toastSlideInRight {
          0% {
            opacity: 0;
            transform: translateX(120%) scale(0.92);
          }
          70% {
            transform: translateX(-6px) scale(1.02);
          }
          100% {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
        }

        @keyframes toastSlideOutRight {
          0% {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
          100% {
            opacity: 0;
            transform: translateX(120%) scale(0.92);
          }
        }

        .toast-enter {
          animation: toastSlideInRight 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }

        .toast-exit {
          animation: toastSlideOutRight 0.25s cubic-bezier(0.4, 0, 1, 1) forwards;
        }
      `}</style>
    </div>
  );

  const contextValue = React.useMemo(
    () => ({ showToast, success, error, warning, info }),
    [showToast, success, error, warning, info]
  );

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      {typeof document !== 'undefined' ? createPortal(toastContainer, document.body) : toastContainer}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
