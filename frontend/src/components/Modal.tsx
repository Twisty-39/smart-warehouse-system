import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  maxWidth = '600px'
}) => {
  const modalBoxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const modalContent = (
    <div
      className="modal-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(44, 36, 36, 0.65)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.25rem',
        zIndex: 99999,
        animation: 'fadeIn 0.15s ease-out'
      }}
      onClick={onClose}
    >
      <div
        ref={modalBoxRef}
        className="modal-box"
        style={{
          backgroundColor: '#FFFFFF',
          border: '2px solid #2C2424',
          borderRadius: '16px',
          width: '100%',
          maxWidth,
          maxHeight: 'min(90vh, 850px)',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 8px 0 #2C2424',
          overflow: 'hidden',
          animation: 'modalPop 0.25s cubic-bezier(0.34, 1.56, 0.64, 1) forwards'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal Bento Flat */}
        <div
          style={{
            padding: '1rem 1.25rem',
            borderBottom: '1.5px solid #2C2424',
            backgroundColor: 'var(--palette-cream)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <h3 style={{ fontSize: '1.125rem', color: 'var(--text-main)', fontWeight: 800, margin: 0, letterSpacing: '-0.01em' }}>
            {title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '5px',
              border: '1.5px solid #2C2424',
              borderRadius: '8px',
              backgroundColor: '#FFFFFF',
              boxShadow: '0 2px 0 #2C2424',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-main)',
              transition: 'all 0.1s ease'
            }}
            title="Tutup Jendela"
          >
            <X size={18} />
          </button>
        </div>

        {/* Isi Form / Konten Modal */}
        <div className="modal-body" style={{ padding: '1.25rem 1.5rem', overflowY: 'auto', flex: 1, backgroundColor: '#FFFFFF' }}>
          {children}
        </div>

        {/* Tombol Aksi Bawah */}
        {footer && (
          <div
            className="modal-footer"
            style={{
              padding: '1rem 1.25rem',
              borderTop: '1.5px solid #2C2424',
              backgroundColor: 'var(--bg-canvas)',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '0.75rem'
            }}
          >
            {footer}
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes modalPop {
          from {
            opacity: 0;
            transform: scale(0.94) translateY(10px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
      `}</style>
    </div>
  );

  return typeof document !== 'undefined'
    ? createPortal(modalContent, document.body)
    : modalContent;
};
