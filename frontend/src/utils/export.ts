import * as XLSX from 'xlsx';

/**
 * Utilitas Export Data ke berkas Asli Microsoft Excel (.xlsx)
 * Menghasilkan file .xlsx resmi dengan worksheet, kolom yang pas, dan tipe data angka murni.
 */

export interface ExportColumn<T> {
  header: string;
  accessor: keyof T | ((item: T) => any);
}

export function exportToExcel<T>(
  data: T[],
  columns: ExportColumn<T>[],
  fileName: string = 'InvWare_Export'
) {
  if (!data || data.length === 0) {
    return false;
  }

  // 1. Buat baris Header
  const headers = columns.map((c) => c.header);

  // 2. Buat baris-baris Data
  const rows = data.map((row) => {
    return columns.map((col) => {
      let val: any = '';
      if (typeof col.accessor === 'function') {
        val = col.accessor(row);
      } else if (col.accessor) {
        val = row[col.accessor];
      }

      if (val === null || val === undefined) {
        return '';
      }
      return val;
    });
  });

  // 3. Konversi Array of Arrays ke Worksheet Excel
  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);

  // 4. Atur lebar kolom otomatis (Auto column width)
  const colWidths = headers.map((header, colIndex) => {
    let maxLen = header.length;
    for (const row of rows) {
      const cellVal = row[colIndex] ? String(row[colIndex]) : '';
      if (cellVal.length > maxLen) {
        maxLen = cellVal.length;
      }
    }
    return { wch: Math.min(Math.max(maxLen + 4, 12), 45) };
  });
  worksheet['!cols'] = colWidths;

  // 5. Buat Workbook Excel
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Data InvWare');

  // 6. Download langsung sebagai file .xlsx
  const today = new Date().toISOString().slice(0, 10);
  const cleanFileName = fileName.endsWith('.xlsx') ? fileName : `${fileName}_${today}.xlsx`;

  XLSX.writeFile(workbook, cleanFileName, { bookType: 'xlsx', type: 'binary' });
  return true;
}
