import React from 'react';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Filter,
  RotateCcw,
  PackageOpen,
  Loader2,
  FileSpreadsheet,
  Download
} from 'lucide-react';
import { PaginationMeta } from '../types';
import { exportToExcel, ExportColumn } from '../utils/export';
import { useToast } from '../context/ToastContext';

export interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
  sortable?: boolean;
  width?: string;
}

export interface FilterOption {
  key: string;
  label: string;
  value: string | number;
  options: { label: string; value: string | number }[];
  onChange: (value: any) => void;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  meta?: PaginationMeta;
  isLoading?: boolean;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (val: string) => void;
  filters?: FilterOption[];
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
  onSortChange?: (columnKey: string) => void;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  onResetFilters?: () => void;
  actions?: React.ReactNode;
  emptyMessage?: string;
  exportFilename?: string;
  exportColumns?: ExportColumn<T>[];
  onExportExcel?: () => void;
}

export function DataTable<T extends { id?: number | string }>({
  columns,
  data,
  meta,
  isLoading = false,
  searchPlaceholder = 'Cari data...',
  searchValue = '',
  onSearchChange,
  filters = [],
  sortBy,
  sortDir = 'desc',
  onSortChange,
  onPageChange,
  onPageSizeChange,
  onResetFilters,
  actions,
  emptyMessage = 'Belum ada data yang tersedia.',
  exportFilename = 'InvWare_Export',
  exportColumns,
  onExportExcel
}: DataTableProps<T>) {
  const toast = useToast();

  const handleExport = () => {
    if (onExportExcel) {
      onExportExcel();
      return;
    }
    let success = false;
    if (exportColumns && exportColumns.length > 0) {
      success = exportToExcel(data, exportColumns, exportFilename);
    } else {
      // Default auto-mapping from table columns
      const autoCols: ExportColumn<T>[] = columns
        .filter((c) => c.key !== 'actions' && c.key !== 'imageUrl' && c.header !== 'AKSI')
        .map((c) => ({
          header: c.header,
          accessor: c.key as keyof T
        }));
      success = exportToExcel(data, autoCols, exportFilename);
    }

    if (success) {
      toast.success('Berkas Excel (.xlsx) berhasil diunduh!');
    } else {
      toast.error('Tidak ada baris data untuk diekspor ke Excel.');
    }
  };

  const hasActiveFilters = filters.some((f) => f.value !== '' && f.value !== 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', width: '100%' }}>
      {/* Control Bar: Pencarian, Filter & Tombol Aksi dalam Bento Toolbar */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          border: '1.5px solid #2C2424',
          borderRadius: '12px',
          padding: '1rem 1.25rem',
          boxShadow: '0 3px 0 #2C2424',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}
      >
        {/* Baris Atas: Pencarian & Tombol Aksi Utama */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '1rem',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          {/* Kotak Pencarian */}
          {onSearchChange && (
            <div
              style={{
                position: 'relative',
                minWidth: '280px',
                flex: '1 1 320px',
                maxWidth: '500px'
              }}
            >
              <Search
                size={18}
                color="var(--palette-rosewood)"
                style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }}
              />
              <input
                type="text"
                className="form-input"
                placeholder={searchPlaceholder}
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
                style={{
                  paddingLeft: '42px',
                  height: '42px',
                  backgroundColor: 'var(--palette-cream)',
                  border: '1.5px solid #2C2424',
                  borderRadius: '8px',
                  fontSize: '0.9375rem',
                  fontWeight: 600
                }}
              />
            </div>
          )}

          {/* Tombol Export Excel & Aksi Tambahan */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleExport}
              title="Export data saat ini ke format Excel / Spreadsheet CSV"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                height: '42px',
                padding: '0 14px',
                backgroundColor: '#FAF7EE',
                color: 'var(--text-main)',
                fontWeight: 700,
                fontSize: '0.875rem'
              }}
            >
              <FileSpreadsheet size={17} color="#15803d" />
              <span>Export ke Excel</span>
            </button>

            {actions && <div>{actions}</div>}
          </div>
        </div>

        {/* Baris Bawah: Filter Dropdown & Reset (Jika Ada) */}
        {filters.length > 0 && (
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: '0.875rem',
              paddingTop: '0.75rem',
              borderTop: '1px solid #EFE8D6'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
              <Filter size={15} color="var(--palette-rosewood)" />
              <span>Filter Data:</span>
            </div>

            {filters.map((f) => (
              <div key={f.key} style={{ minWidth: '160px', flex: '0 1 auto' }}>
                <select
                  className="form-select"
                  value={f.value}
                  onChange={(e) => f.onChange(e.target.value)}
                  style={{
                    height: '38px',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    backgroundColor: f.value !== '' && f.value !== 0 ? 'var(--palette-sky)' : '#FFFFFF',
                    border: '1.5px solid #2C2424',
                    borderRadius: '8px',
                    padding: '0 10px'
                  }}
                >
                  <option value="">{f.label}: Semua</option>
                  {f.options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            ))}

            {/* Tombol Reset Filter */}
            {onResetFilters && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={onResetFilters}
                disabled={!hasActiveFilters && searchValue === ''}
                title="Reset seluruh kata kunci pencarian dan filter"
                style={{
                  height: '38px',
                  padding: '0 12px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.8125rem',
                  fontWeight: 700,
                  opacity: hasActiveFilters || searchValue !== '' ? 1 : 0.6
                }}
              >
                <RotateCcw size={14} />
                <span>Reset Filter</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Tabel Kontainer */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  style={{
                    width: col.width,
                    cursor: col.sortable ? 'pointer' : 'default',
                    userSelect: 'none'
                  }}
                  onClick={() => col.sortable && onSortChange && onSortChange(col.key)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>{col.header}</span>
                    {col.sortable && (
                      <ArrowUpDown
                        size={14}
                        color={sortBy === col.key ? 'var(--palette-rosewood)' : 'var(--text-muted)'}
                      />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={columns.length} style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                    <Loader2 size={28} className="animate-spin" color="var(--palette-rosewood)" />
                    <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Memuat data...</span>
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                    <PackageOpen size={36} color="var(--text-muted)" />
                    <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{emptyMessage}</span>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((item, index) => (
                <tr key={item.id || index}>
                  {columns.map((col) => (
                    <td key={col.key} style={{ width: col.width }}>
                      {col.render ? col.render(item) : (item as any)[col.key] ?? '-'}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {meta && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '1rem',
            padding: '0.75rem 0.5rem'
          }}
        >
          {/* Info Jumlah Data & Pilihan Limit */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            <span>
              Menampilkan <strong>{data.length}</strong> dari total <strong>{meta.totalCount}</strong> baris data
            </span>

            {onPageSizeChange && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>Baris per halaman:</span>
                <select
                  className="form-select"
                  value={meta.pageSize}
                  onChange={(e) => onPageSizeChange(Number(e.target.value))}
                  style={{ width: 'auto', padding: '2px 8px', fontSize: '0.8125rem' }}
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            )}
          </div>

          {/* Tombol Halaman Prev / Next */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => onPageChange && onPageChange(meta.currentPage - 1)}
              disabled={!meta.hasPrevious || isLoading}
              style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <ChevronLeft size={16} />
              <span>Sebelumnya</span>
            </button>

            <span style={{ fontSize: '0.875rem', fontWeight: 600, padding: '0 6px' }}>
              Halaman {meta.currentPage} dari {meta.totalPages || 1}
            </span>

            <button
              className="btn btn-secondary btn-sm"
              onClick={() => onPageChange && onPageChange(meta.currentPage + 1)}
              disabled={!meta.hasNext || isLoading}
              style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <span>Selanjutnya</span>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
