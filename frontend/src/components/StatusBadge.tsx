import React from 'react';

interface StatusBadgeProps {
  status: string;
  type?: 'stock' | 'po' | 'role' | 'active' | 'transaction';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, type = 'stock' }) => {
  const s = (status || '').toUpperCase();

  let badgeClass = 'badge badge-cream';
  let label = status;

  if (type === 'active') {
    if (status === 'true' || status === 'Aktif' || status === 'Active') {
      badgeClass = 'badge badge-sky';
      label = 'Aktif';
    } else {
      badgeClass = 'badge badge-rosewood';
      label = 'Nonaktif';
    }
  } else if (type === 'po') {
    switch (s) {
      case 'RECEIVED':
        badgeClass = 'badge badge-sky';
        label = '✓ Selesai Diterima';
        break;
      case 'APPROVED':
        badgeClass = 'badge badge-lavender';
        label = 'Disetujui';
        break;
      case 'PENDING':
        badgeClass = 'badge badge-cream';
        label = 'Menunggu Persetujuan';
        break;
      case 'DRAFT':
        badgeClass = 'badge badge-neutral';
        label = 'Draf';
        break;
      case 'CANCELLED':
        badgeClass = 'badge badge-rosewood';
        label = 'Dibatalkan';
        break;
      default:
        badgeClass = 'badge badge-cream';
        label = status;
    }
  } else if (type === 'transaction') {
    switch (s) {
      case 'INBOUND':
        badgeClass = 'badge badge-sky';
        label = '↓ Barang Masuk';
        break;
      case 'OUTBOUND':
        badgeClass = 'badge badge-rosewood';
        label = '↑ Barang Keluar';
        break;
      case 'TRANSFER':
        badgeClass = 'badge badge-lavender';
        label = '↔ Transfer Gudang';
        break;
      case 'ADJUSTMENT':
        badgeClass = 'badge badge-cream';
        label = '⚙ Penyesuaian Stok';
        break;
      default:
        badgeClass = 'badge badge-cream';
        label = status;
    }
  } else if (type === 'role') {
    switch (s) {
      case 'ROLE_ADMIN':
      case 'SUPER ADMIN':
      case 'SUPER ADMINISTRATOR':
      case 'ADMINISTRATOR':
      case 'ADMIN':
        badgeClass = 'badge badge-rosewood';
        label = 'Administrator';
        break;
      case 'ROLE_MANAGER':
      case 'WAREHOUSE MANAGER':
      case 'MANAJER GUDANG':
      case 'MANAGER':
        badgeClass = 'badge badge-lavender';
        label = 'Manajer Gudang';
        break;
      case 'ROLE_PURCHASING':
      case 'PURCHASING OFFICER':
      case 'BAGIAN PEMBELIAN':
      case 'PURCHASING':
        badgeClass = 'badge badge-sky';
        label = 'Bagian Pembelian';
        break;
      case 'ROLE_STAFF':
      case 'INVENTORY STAFF':
      case 'STAF GUDANG':
      case 'STAF OPERASIONAL':
      case 'STAFF':
        badgeClass = 'badge badge-cream';
        label = 'Staf Operasional';
        break;
      default:
        badgeClass = 'badge badge-cream';
        label = status || 'Staf Operasional';
    }
  } else {
    // Default Stock Status
    if (s.includes('HABIS') || s.includes('OUT') || s === '0' || s === 'OUT_OF_STOCK') {
      badgeClass = 'badge badge-rosewood';
      label = 'Stok Habis';
    } else if (s.includes('MENIPIS') || s.includes('LOW') || s.includes('WARNING') || s === 'LOW_STOCK') {
      badgeClass = 'badge badge-cream';
      label = 'Stok Menipis';
    } else {
      badgeClass = 'badge badge-sky';
      label = 'Stok Aman';
    }
  }

  return <span className={badgeClass}>{label}</span>;
};
