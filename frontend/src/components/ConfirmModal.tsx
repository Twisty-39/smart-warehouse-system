import React from 'react';
import { Modal } from './Modal';
import { AlertTriangle, AlertCircle } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDanger?: boolean;
  isLoading?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Konfirmasi Tindakan',
  message,
  confirmLabel = 'Ya, Lanjutkan',
  cancelLabel = 'Batal',
  isDanger = true,
  isLoading = false
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      maxWidth="480px"
      footer={
        <>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onClose}
            disabled={isLoading}
            style={{ fontWeight: 700, padding: '8px 16px' }}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className={isDanger ? 'btn btn-rosewood btn-sm' : 'btn btn-primary btn-sm'}
            onClick={onConfirm}
            disabled={isLoading}
            style={{ fontWeight: 800, padding: '8px 18px' }}
          >
            {isLoading ? 'Memproses...' : confirmLabel}
          </button>
        </>
      }
    >
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
        <div
          style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            backgroundColor: isDanger ? 'var(--palette-cream)' : 'var(--palette-sky)',
            color: isDanger ? 'var(--palette-rosewood)' : 'var(--text-main)',
            border: '1.5px solid #2C2424',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 0 #2C2424',
            flexShrink: 0
          }}
        >
          {isDanger ? <AlertTriangle size={24} /> : <AlertCircle size={24} />}
        </div>
        <div>
          <p style={{ color: 'var(--text-main)', fontSize: '0.9375rem', fontWeight: 600, lineHeight: '1.5', margin: 0 }}>
            {message}
          </p>
          {isDanger && (
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.5rem', margin: '0.5rem 0 0 0', fontWeight: 500 }}>
              Catatan: Tindakan ini permanen pada database inventaris pergudangan.
            </p>
          )}
        </div>
      </div>
    </Modal>
  );
};
