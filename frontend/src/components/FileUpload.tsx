import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, CheckCircle2, X } from 'lucide-react';
import { uploadsApi } from '../services/api';
import { useToast } from '../context/ToastContext';

interface FileUploadProps {
  label?: string;
  acceptType?: 'image' | 'document';
  folder?: string;
  value?: string;
  onChange: (url: string) => void;
  maxSizeMB?: number;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  label = 'Unggah Berkas',
  acceptType = 'image',
  folder = 'products',
  value,
  onChange,
  maxSizeMB = 5
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();

  const acceptedExts = acceptType === 'image' ? 'image/png, image/jpeg, image/webp' : '.pdf, application/pdf';

  const handleFile = async (file: File) => {
    if (file.size > maxSizeMB * 1024 * 1024) {
      toast.error(`Ukuran berkas melebihi batas maksimal ${maxSizeMB}MB.`);
      return;
    }

    setIsUploading(true);
    try {
      let fileUrl = '';
      if (acceptType === 'image') {
        fileUrl = await uploadsApi.uploadImage(file, folder);
      } else {
        fileUrl = await uploadsApi.uploadDocument(file, folder);
      }
      onChange(fileUrl);
      toast.success('Berkas berhasil diunggah!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal mengunggah berkas.');
    } finally {
      setIsUploading(false);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="form-group">
      {label && <label className="form-label">{label}</label>}

      {value ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 14px',
            backgroundColor: 'var(--palette-cream)',
            border: '1.5px solid #2C2424',
            borderRadius: '10px',
            boxShadow: '0 2px 0 #2C2424'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', overflow: 'hidden' }}>
            {acceptType === 'image' ? (
              <img
                src={value.startsWith('http') ? value : `http://localhost:5000${value}`}
                alt="Preview"
                style={{ width: '44px', height: '44px', objectFit: 'cover', borderRadius: '8px', border: '1.5px solid #2C2424', backgroundColor: '#FFFFFF' }}
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            ) : (
              <FileText size={28} color="var(--palette-rosewood)" />
            )}
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-main)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                {value.split('/').pop()}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#15803d', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                <CheckCircle2 size={13} /> Berkas Siap Tersimpan
              </div>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => onChange('')}
            title="Hapus berkas"
            style={{ padding: '6px', border: '1.5px solid #2C2424', borderRadius: '6px', backgroundColor: '#FFFFFF' }}
          >
            <X size={16} />
          </button>
        </div>
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: isDragging ? '2px dashed var(--palette-sky)' : '2px dashed var(--palette-rosewood)',
            borderRadius: '12px',
            padding: '1.5rem',
            textAlign: 'center',
            cursor: 'pointer',
            backgroundColor: isDragging ? '#EBF4F6' : 'var(--palette-cream)',
            transition: 'all 0.15s ease'
          }}
        >
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: 'none' }}
            accept={acceptedExts}
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFile(e.target.files[0]);
              }
            }}
          />

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                backgroundColor: '#FFFFFF',
                border: '1.5px solid #2C2424',
                boxShadow: '0 2px 0 #2C2424',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--palette-rosewood)'
              }}
            >
              <UploadCloud size={24} />
            </div>
            <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-main)' }}>
              {isUploading ? 'Mengunggah berkas...' : 'Klik untuk memilih berkas atau geser ke sini'}
            </div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
              {acceptType === 'image' ? 'Format didukung: PNG, JPG, WEBP' : 'Format didukung: Dokumen PDF'} (Maksimal {maxSizeMB}MB)
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
