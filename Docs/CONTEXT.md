# CONTEXT: Smart Warehouse & Inventory Management System (SWIMS)

## 1. Ringkasan Eksekutif (Executive Summary)
**Smart Warehouse & Inventory Management System (SWIMS)** adalah platform sistem informasi manajemen pergudangan dan rantai pasok inventaris terintegrasi (*enterprise-grade*) berbasis web. Sistem ini dirancang untuk memodernisasi tata kelola pergudangan tradisional menjadi ekosistem digital cerdas yang efisien, transparan, dan mampu menyediakan visibilitas data secara *real-time*.

Aplikasi ini dikembangkan menggunakan arsitektur **Fullstack Monorepo** dengan backend bertenaga **C# ASP.NET Core Web API**, basis data relasional **Microsoft SQL Server (SSMS)**, dan antarmuka interaktif **React + TypeScript (Vite)**.

---

## 2. Latar Belakang & Identifikasi Masalah (Problem Statement)
Pengelolaan gudang manual atau berbasis spreadsheet konvensional seringkali menghadapi berbagai kendala operasional yang berisiko merugikan bisnis, antara lain:

1. **Ketidaksesuaian Stok Fisik vs Data (*Inventory Discrepancies*)**: Pencatatan manual sering menimbulkan selisih data stok fisik di rak dengan data administrasi.
2. **Ketiadaan Visibilitas Mutasi (*Audit Trail*)**: Sulitnya melacak riwayat pergerakan barang masuk (*inbound*), barang keluar (*outbound*), penyesuaian (*adjustment*), dan mutasi antar gudang (*warehouse transfer*).
3. **Risiko *Stockout* dan *Overstock***: Tidak adanya peringatan dini batas minimum stok (*reorder level alert*) yang menyebabkan terganggunya rantai suplai atau terjadinya penumpukan modal mati (*dead stock*).
4. **Alur Pengadaan Barang (*Procurement*) yang Terfragmentasi**: Proses pemesanan barang ke pemasok (*Purchase Order*) tidak terhubung secara langsung dengan penerimaan barang di gudang.
5. **Keterbatasan Kontrol Hak Akses (*Security & Governance*)**: Ketiadaan pemisahan wewenang operasional yang berpotensi menimbulkan manipulasi data.

---

## 3. Tujuan Sistem (System Objectives)
SWIMS dirancang untuk mencapai sasaran bisnis berikut:
- **Otomatisasi & Akurasi**: Menghilangkan pencatatan ganda dan menyediakan data inventaris yang akurat hingga ke tingkat lokasi rak/bin (*bin location*).
- **Pemantauan Real-time**: Menyediakan dasbor analitik interaktif yang menampilkan KPI pergudangan, pergerakan stok, dan peringatan stok menipis secara instan.
- **Tata Kelola Aman & Terstruktur**: Mengimplementasikan *Role-Based Access Control* (RBAC) serta mekanisme *Soft Delete* untuk menjamin integritas dan jejak audit data.
- **Pengadaan Terpadu**: Mengintegrasikan siklus hidup *Purchase Order* dari pembuatan, persetujuan (*approval*), hingga penerimaan barang dan pembaruan stok otomatis.

---

## 4. Analisis Pengguna & Peran (User Roles & RBAC Matrix)

Sistem membagi pengguna ke dalam 4 peran utama dengan batasan wewenang yang tegas:

| Modul / Fitur | Super Admin | Warehouse Manager | Inventory Staff | Purchasing Officer |
| :--- | :---: | :---: | :---: | :---: |
| **Manajemen Pengguna & Role** | Full (CRUD) | Read Only | No Access | No Access |
| **Master Data (Kategori, Gudang)** | Full (CRUD) | Full (CRUD) | Read Only | Read Only |
| **Katalog Produk** | Full (CRUD) | Full (CRUD) | Read / Update Stok | Read Only |
| **Pemasok (Suppliers)** | Full (CRUD) | Read Only | Read Only | Full (CRUD) |
| **Mutasi Stok (Inbound, Outbound, Transfer)** | Full (CRUD) | Full Approval | Create / View | Read Only |
| **Penyesuaian Stok (Stock Adjustment)** | Full (CRUD) | Full Approval | Submit Request | No Access |
| **Purchase Order (PO)** | Full (CRUD) | Approve / Reject | Receive Stock | Create / Edit PO |
| **Laporan & Dasbor Analitik** | Full Access | Full Access | Operasional View | Finansial & PO View |
| **Upload Berkas (Foto Produk / PDF Invoice)** | Allowed | Allowed | Allowed (Foto) | Allowed (Invoice PDF) |

---

## 5. Batasan Sistem & Ruang Lingkup (System Scope & Boundaries)

### Ruang Lingkup Fungsional:
1. **Autentikasi & Otorisasi**: Registrasi, Login JWT, Refresh Token, Lupa Password, Reset Password, Profil Pengguna dengan foto avatar.
2. **Dasbor Real-Time**: KPI Total Nilai Aset Stok, Peringatan Stok Kritis, Total Transaksi, Utilisasi Kapasitas Gudang, dan Grafik Mutasi Bulanan.
3. **Master Data Management**: CRUD Produk (dengan foto), Kategori, Gudang (dengan kapasitas & manajer), dan Pemasok (dengan rating & kontak).
4. **Operasional Pergudangan**:
   - Monitoring stok per gudang & bin location.
   - Penerimaan barang (*Inbound*), Pengeluaran barang (*Outbound*), Transfer antar gudang (*Transfer*), dan Penyesuaian stok (*Stock Adjustment*).
5. **Pengadaan Barang (Purchase Order)**:
   - Pembuatan PO multi-item barang.
   - Perubahan status (*Draft -> Pending -> Approved -> Received -> Cancelled*).
   - Unggah faktur / dokumen pendukung dalam format PDF.
   - Otomatisasi penambahan stok saat status PO disetujui/diterima (*Received*).
6. **Pencarian, Filter, Pengurutan & Paginasi Seragam**:
   - Keyword search di semua tabel data.
   - Filter berdasarkan status, kategori, dan rentang tanggal.
   - Pengurutan data (terbaru, terlama, A-Z, Z-A).
   - Paginasi server-side lengkap.

---

## 6. Matriks Kepatuhan Terhadap Ketentuan Projekan S1

Tabel berikut menunjukkan kesesuaian proyek SWIMS dengan dokumen `KETENTUAN UMUM PEMBUATAN PROJEKAN S1`:

| Kategori | Syarat Dokumen S1 | Implementasi pada SWIMS | Status |
| :--- | :--- | :--- | :---: |
| **Frontend** | Desain Responsif (Mobile ≤768px, Tablet 769–1024px, Desktop >1024px) | Layout adaptif tanpa overflow dengan sidebar lipat otomatis | **MEMENUHI** |
| **Frontend** | Autentikasi lengkap (Login, Register, Logout, Forgot & Reset Password) | Alur autentikasi JWT lengkap dengan penyimpanan LocalStorage/Cookie | **MEMENUHI** |
| **Frontend** | Client-Side Routing (Public, Private, Role Route, Redirect akses) | React Router v6 dengan Protected Route Guard & Role Guard | **MEMENUHI** |
| **Frontend** | Dasbor Real-time (Card summary, Total data, Statistik chart, Aktivitas) | Dasbor interaktif dengan Chart.js, KPI card, dan feed aktivitas | **MEMENUHI** |
| **Frontend** | CRUD Interface (List, Detail, Tambah, Edit, Hapus) | Seluruh 6+ entitas memiliki halaman/modal CRUD terhubung API | **MEMENUHI** |
| **Frontend** | Search, Filter (status/kategori/tanggal), Sorting (terbaru/terlama/A-Z/Z-A) | Komponen `DataTable` reusable dengan multi-filter & multi-sort | **MEMENUHI** |
| **Frontend** | Paginasi (Prev, Next, No Halaman, Total Data, Limit per page) | Kontrol paginasi lengkap pada seluruh endpoint daftar data | **MEMENUHI** |
| **Frontend** | Unggah File (Gambar / PDF) | Unggah foto produk (JPEG/PNG) dan faktur PO (PDF) | **MEMENUHI** |
| **Frontend** | Validasi Form Real-time & Notifikasi Toast | React Hook Form dengan pesan error instan + Toast Notification | **MEMENUHI** |
| **Frontend** | Penanganan Error (401, 403, 404, 500 & Fallback API) | Halaman error khusus dan fallback state jika API gagal | **MEMENUHI** |
| **Backend** | Standar REST API (GET, POST, PUT, PATCH, DELETE + HTTP Status) | ASP.NET Core Web API dengan RESTful verbs & semantic status codes | **MEMENUHI** |
| **Backend** | RBAC (Minimal 2 Role berbeda hak akses) | 4 Role terkonfigurasi (SuperAdmin, Manager, Staff, Purchasing) | **MEMENUHI** |
| **Backend** | Minimal 6 Entitas Utama CRUD lengkap | 10 Entitas utama terimplementasi penuh | **MEMENUHI** |
| **Backend** | Validasi Sisi Server (Required, Email, Unique, Min, Max, Enum, Date) | FluentValidation untuk seluruh request payload POST & PUT | **MEMENUHI** |
| **Backend** | Global Error Handling (400, 401, 403, 404, 422, 500) | GlobalExceptionMiddleware dengan format JSON konsisten | **MEMENUHI** |
| **Backend** | Relasi DB (Minimal 6 tabel, 5 relasi: 1:1, 1:N, N:1, M:N) | 11 Tabel, 10+ relasi mencakup 1:1, 1:N, N:1, dan M:N | **MEMENUHI** |
| **Backend** | Soft Delete (Minimal 2 tabel) | Diterapkan pada 3 tabel: `Products`, `Suppliers`, `Warehouses` | **MEMENUHI** |
| **Backend** | Dokumentasi API (Swagger / OpenAPI) | Terintegrasi OpenAPI / Swagger UI & Scalar interactive docs | **MEMENUHI** |
| **Backend** | Keamanan (Password Hashing, JWT, CORS, SQL Injection, XSS) | BCrypt hashing, JWT Bearer, CORS policy, EF Core parameterization | **MEMENUHI** |
| **Database** | Normalisasi 3NF, Timestamps (`created_at`, `updated_at`) | Struktur 3NF murni dengan auto audit timestamps di EF Core | **MEMENUHI** |
| **Database** | Seed data minimal 20 baris per tabel utama | `DbSeeder` & file script SQL dengan >20 record realistis per tabel | **MEMENUHI** |
| **Repositori** | Monorepo Fullstack (Frontend & Backend dalam 1 repo) | Struktur monorepo `backend/` dan `frontend/` lengkap dengan README | **MEMENUHI** |
