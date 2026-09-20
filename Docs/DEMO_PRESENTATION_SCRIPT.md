# 🎬 PANDUAN LENGKAP & NASKAH DEMO SCREEN RECORDING
## InvWare — Smart Warehouse & Inventory Management System (SWIMS)

Dokumen ini adalah skenario presentasi dan naskah berbicara (*speaking script*) kata-per-kata yang dirancang khusus untuk rekaman video demo (*screen recording*) di hadapan dosen penguji / pembimbing.

---

## 📋 DAFTAR ISI
1. [Persiapan Sebelum Merekam (Pre-Recording Checklist)](#1-persiapan-sebelum-merekam)
2. [Timeline & Rundown Alur Demo (10–12 Menit)](#2-timeline--rundown-alur-demo)
3. [Naskah Berbicara Kata-Per-Kata & Panduan Aksi Layar](#3-naskah-berbicara-kata-per-kata--panduan-aksi-layar)
   - [Bagian 1: Pembukaan & Latar Belakang Masalah (00:00 - 01:15)](#bagian-1-pembukaan--latar-belakang-masalah)
   - [Bagian 2: Autentikasi, Keamanan & Pemulihan OTP (01:15 - 02:45)](#bagian-2-autentikasi-keamanan--pemulihan-otp)
   - [Bagian 3: Dasbor Eksekutif & Analitik Real-Time (02:45 - 04:15)](#bagian-3-dasbor-eksekutif--analitik-real-time)
   - [Bagian 4: Manajemen Master Data & Katalog SKU (04:15 - 05:30)](#bagian-4-manajemen-master-data--katalog-sku)
   - [Bagian 5: Siklus Pengadaan (Purchase Order Lifecycle) (05:30 - 07:15)](#bagian-5-siklus-pengadaan-purchase-order-lifecycle)
   - [Bagian 6: Tata Kelola Stok Fisik & Audit Mutasi (07:15 - 08:45)](#bagian-6-tata-kelola-stok-fisik--audit-mutasi)
   - [Bagian 7: Manajemen Pengguna & Otorisasi RBAC (08:45 - 09:45)](#bagian-7-manajemen-pengguna--otorisasi-rbac)
   - [Bagian 8: Arsitektur Sistem, Database & Cloud Deployment (09:45 - 11:00)](#bagian-8-arsitektur-sistem-database--cloud-deployment)
   - [Bagian 9: Penutup & Kesimpulan (11:00 - 11:30)](#bagian-9-penutup--kesimpulan)
4. [Antisipasi Pertanyaan Dosen Penguji (Tanya Jawab / Q&A Defense)](#4-antisipasi-pertanyaan-dosen-penguji)

---

## 1. Persiapan Sebelum Merekam

### A. Perangkat Lunak Perekam (Screen Recorder):
- Gunakan **OBS Studio** (disarankan) atau **Windows Game Bar** (`Win + G`) atau **Loom** / **Clipchamp**.
- Atur resolusi rekaman ke **1080p (1920x1080)** dengan frame rate 30 atau 60 fps.
- Pastikan mikrofon jernih tanpa kebisingan (*noise suppression* aktif).

### B. Tab Browser & Berkas yang Harus Dibuka Sebelum Merekam:
1. **Tab 1**: Halaman Login InvWare: **`http://70.153.139.90/login`** (atau `http://localhost:5173/login`).
2. **Tab 2**: Repositori GitHub: **`https://github.com/Twisty-39/smart-warehouse-system`**.
3. **Tab 3**: Berkas Arsitektur / Flowchart: Dokumen [Docs/FLOWCHARTS.md](file:///d:/FAJAR%20SIDIK/Portofolio/Smart%20Warehouse%20&%20Inventory%20Management%20System/Docs/FLOWCHARTS.md).
4. **Tab 4 (Opsional)**: Swagger API Docs: `http://localhost:5000/swagger` (jika ingin menunjukkan endpoint REST API).

### C. Kredensial Login Pengujian Cepat (Tersedia Tombol 1-Klik di Halaman Login):
- **Super Admin**: `admin@smartwarehouse.com` | Password: `Password123!`
- **Warehouse Manager**: `manager.jkt@smartwarehouse.com` | Password: `Password123!`
- **Inventory Staff**: `staff.jkt1@smartwarehouse.com` | Password: `Password123!`
- **Purchasing Officer**: `purchasing.lead@smartwarehouse.com` | Password: `Password123!`

---

## 2. Timeline & Rundown Alur Demo

| Menit | Modul / Halaman yang Dibuka | Fokus Demonstrasi |
|---|---|---|
| **00:00 - 01:15** | Halaman Depan / Login Page | Perkenalan diri, judul proyek, latar belakang masalah rantai pasok |
| **01:15 - 02:45** | Login Page & Lupa Password | Konsep 4 Role RBAC & Demo Pemulihan Akun via 6-Digit OTP |
| **02:45 - 04:15** | `/dashboard` (Dasbor) | 4 KPI Cards, Multi-Currency IDR/USD, Trend Mutasi, Feed Aktivitas |
| **04:15 - 05:30** | `/products` (Katalog Produk) | Master SKU, Barcode, Kategori, Foto Produk, Ekspor Excel native |
| **05:30 - 07:15** | `/purchase-orders` (PO Lifecycle) | Alur PO: Draft ➔ Approve ➔ Receive (Stok otomatis bertambah!) |
| **07:15 - 08:45** | `/inventory` & `/transactions` | Lokasi Rak Bin, On-Hand vs Available, Transfer Gudang, Stock Opname |
| **08:45 - 09:45** | `/users` (User Management) | Otorisasi RBAC 4 Level, Audit log pengguna, Route Protection |
| **09:45 - 11:00** | GitHub & Visual Arsitektur | Clean Architecture, SQL Server 3NF, Docker Compose di Azure VM |
| **11:00 - 11:30** | Halaman Dasbor | Kesimpulan dan salam penutup |

---

## 3. Naskah Berbicara Kata-Per-Kata & Panduan Aksi Layar

---

### BAGIAN 1: PEMBUKAAN & LATAR BELAKANG MASALAH
*(Estimasi: 00:00 - 01:15)*

**[AKSI LAYAR]**:
- Tampilkan browser pada halaman login: `http://70.153.139.90/login`.
- Kursor berada di tengah layar, menyorot logo dan nama aplikasi **InvWare**.

**[NASKAH SUARA]**:
> *"Selamat pagi / siang kepada Bapak / Ibu Dosen Pembimbing dan Dosen Penguji.*
> 
> *Perkenalkan, nama saya **Fajar Sidik**. Pada kesempatan kali ini, saya akan mendemonstrasikan secara menyeluruh hasil rancang bangun proyek tugas akhir / portofolio saya yang berjudul:*
> 
> ***InvWare — Smart Warehouse & Inventory Management System (SWIMS)***.
> 
> *Latar belakang dikembangkannya sistem ini berangkat dari problematika nyata dalam operasional pergudangan dan rantai pasok modern: seperti ketidaksesuaian jumlah stok fisik dengan pencatatan digital, lambatnya persetujuan dokumen pengadaan barang (Purchase Order), sulitnya pelacakan posisi rak barang, serta minimnya sistem audit jejak aktivitas staf yang rentan menimbulkan selisih inventaris.*
> 
> *InvWare hadir sebagai solusi terpadu berbasis **Fullstack Monorepo Enterprise**, yang memadukan arsitektur backend **C# ASP.NET Core 10 Web API**, basis data relasional **Microsoft SQL Server 2022**, dan antarmuka frontend modern **React 19 TypeScript** dengan sistem desain **Bento Flat UI**. Sistem ini juga telah berhasil kami deploy secara live di **Microsoft Azure Virtual Machine** menggunakan **Docker Compose**."*

---

### BAGIAN 2: AUTENTIKASI, KEAMANAN & PEMULIHAN OTP
*(Estimasi: 01:15 - 02:45)*

**[AKSI LAYAR]**:
- Sorot form login dan bagian bawah bertuliskan **"PILIH AKUN DEMO"**.
- Klik link **"Lupa kata sandi?"** menuju `/forgot-password`.

**[NASKAH SUARA]**:
> *"Kita mulai dari modul autentikasi dan keamanan sistem.*
> 
> *InvWare menerapkan sistem keamanan tingkat tinggi berbasis **Role-Based Access Control (RBAC)** dengan empat tingkat hak akses terpisah: yaitu **Super Admin**, **Warehouse Manager**, **Inventory Staff**, dan **Purchasing Officer**. Kata sandi pengguna diamankan menggunakan algoritma enkripsi **BCrypt** dengan salt factor 11, dan komunikasi sesi diotorisasi melalui **JWT Bearer Token**.*
> 
> *Selain login standar, sistem ini juga dilengkapi modul pemulihan akun cerdas menggunakan **6-Digit Cryptographic OTP**."*

**[AKSI LAYAR]**:
- Pada halaman Lupa Kata Sandi, ketik email: `admin@smartwarehouse.com`.
- Klik tombol **"Kirim Kode OTP"**.
- Layar berpindah ke halaman Verifikasi OTP dengan 6 kotak input PIN dan tombol bantuan demo.
- Klik tombol **"Isi OTP Demo (123456)"** atau ketik angka 1-2-3-4-5-6 secara otomatis berpindah kotak (*auto-advance*).
- Tunjukkan countdown timer kirim ulang 60 detik.
- Masukkan password baru (misal `Password123!`) lalu klik **"Simpan & Masuk"**.
- Kembali ke halaman login.

**[NASKAH SUARA]**:
> *"Bisa kita lihat bersama di layar, generator OTP di sisi backend menghasilkan kode kriptografis unik dengan masa berlaku 5 menit. Antarmuka input 6-digit didesain responsif dengan auto-advance dan proteksi salah input. Pengguna dapat mereset kata sandi dengan aman tanpa intervensi administrator.*
> 
> *Sekarang, kita akan masuk menggunakan hak akses tertinggi, yaitu **Super Admin**."*

**[AKSI LAYAR]**:
- Klik tombol **"Super Admin"** pada kotak Akun Demo (otomatis mengisi `admin@smartwarehouse.com` dan `Password123!`).
- Klik tombol **"Masuk Sekarang"**.
- Sistem berhasil login dan diarahkan ke `/dashboard`.

---

### BAGIAN 3: DASBOR EKSEKUTIF & ANALITIK REAL-TIME
*(Estimasi: 02:45 - 04:15)*

**[AKSI LAYAR]**:
- Layar menampilkan **DashboardPage**.
- Arahkan kursor perlahan ke **4 Kartu Bento KPI Utama**.

**[NASKAH SUARA]**:
> *"Setelah login, pengguna langsung disambut oleh Dasbor Operasional Eksekutif berkonsep **Bento Grid**.*
> 
> *Di bagian atas, terdapat empat metrik utama yang dikalkulasi secara real-time dari database:*
> 1. *Pertama, **Total Nilai Aset Inventaris** yang merefleksikan seluruh valuasi stok di gudang.*
> 2. *Kedua, **Peringatan Stok Menipis (Low Stock Alert)**, yang mendeteksi otomatis SKU barang yang berada di bawah safety stock.*
> 3. *Ketiga, **Total Transaksi Mutasi Logistik**, baik barang masuk maupun keluar.*
> 4. *Dan keempat, **Utilisasi Kapasitas Gudang**, menghitung persentase ruang fisik yang terpakai."*

**[AKSI LAYAR]**:
- Arahkan kursor ke tombol **Multi-Currency Switcher** (IDR ⇄ USD) di kanan atas.
- Klik tombol **"USD ($)"**, lihat angka nilai aset berubah dari Rupiah menjadi Dolar secara mulus.
- Klik kembali ke **"IDR (Rp)"**.
- Gulir layar ke bawah menuju grafik tren mutasi.
- Klik tab filter waktu: **"3 Bulan"**, **"6 Bulan"**, **"12 Bulan"**.
- Sorot tabel **Fast Moving Items** dan log **Aktivitas Terkini**.

**[NASKAH SUARA]**:
> *"Sistem ini juga dilengkapi fitur **Multi-Currency Switcher**. Cukup dengan satu klik, nilai aset dikonversi secara instan antara Rupiah (IDR) dan US Dollar (USD) menggunakan rate kurs dinamis.*
> 
> *Di bawahnya, terdapat **Grafik Visual Tren Mutasi Barang**, membandingkan volume Barang Masuk (Inbound) dengan Barang Keluar (Outbound) yang dapat difilter berdasarkan rentang 3 bulan, 6 bulan, hingga 1 tahun.*
> 
> *Di samping grafik, terdapat tabel **Fast Moving Items** untuk mengetahui produk terlaris, serta **Feed Aktivitas Terkini** yang mencatat audit trail setiap tindakan staf di gudang."*

---

### BAGIAN 4: MANAJEMEN MASTER DATA & KATALOG SKU
*(Estimasi: 04:15 - 05:30)*

**[AKSI LAYAR]**:
- Klik menu sidebar **"Produk"** menuju `/products`.
- Tampilkan tabel katalog produk yang rapi dengan pagination, status badge, dan thumbnail gambar.
- Ketik kata kunci di kolom pencarian (misal: `"Kabel"` atau `"Router"`).
- Filter berdasarkan Kategori (misal: `"Elektronik"`).

**[NASKAH SUARA]**:
> *"Kita beralih ke modul **Katalog Produk & Master Data SKU**.*
> 
> *Modul ini mengelola seluruh informasi produk secara terpusat: mulai dari kode SKU unik, nomor Barcode, klasifikasi Kategori, satuan unit, harga beli, harga jual, hingga batas minimum dan maksimum stok.*
> 
> *Pencarian data didukung oleh mekanisme *debounce query* di sisi server, memungkinkan pencarian instan berdasarkan nama, barcode, maupun SKU."*

**[AKSI LAYAR]**:
- Klik tombol **"Tambah Produk"** (Modal muncul).
- Tunjukkan formulir input yang bersih, termasuk input file gambar produk dengan *live preview*.
- Tutup modal.
- Klik tombol **"Ekspor Excel"** di kanan atas tabel.
- Berkas `.xlsx` langsung terdownload secara instan ke laptop.

**[NASKAH SUARA]**:
> *"Setiap produk dapat dilengkapi dengan unggahan foto fisik barang yang disimpan dan disajikan secara terisolasi melalui Nginx reverse proxy.*
> 
> *Selain itu, untuk keperluan pelaporan manajerial, seluruh tabel di InvWare dilengkapi fitur **Ekspor Native Excel (.xlsx)** berbasis SheetJS dengan format auto-width kolom yang rapi dan siap cetak."*

---

### BAGIAN 5: SIKLUS PENGADAAN (PURCHASE ORDER LIFECYCLE)
*(Estimasi: 05:30 - 07:15)*

**[AKSI LAYAR]**:
- Klik menu sidebar **"Purchase Orders"** menuju `/purchase-orders`.
- Tampilkan tabel daftar PO beserta filter status (`DRAFT`, `PENDING`, `APPROVED`, `RECEIVED`).

**[NASKAH SUARA]**:
> *"Sekarang kita masuk ke modul paling krusial dalam rantai pasok, yaitu **Purchase Order Lifecycle (Pengadaan Barang)**.*
> 
> *Sistem InvWare mendisiplinkan alur pengadaan barang dengan siklus status bertahap:*
> *Dari **DRAFT** dibuat oleh Purchasing Officer ➔ diajukan menjadi **PENDING** ➔ ditinjau dan di-**APPROVED** oleh Warehouse Manager ➔ hingga status akhir **RECEIVED** saat barang fisik tiba di gudang.*
> 
> *Mari kita perhatikan fitur otomatisasi paling penting di sini:"*

**[AKSI LAYAR]**:
- Buka detail salah satu PO yang berstatus **APPROVED** (misal PO-2026-003).
- Tunjukkan nama vendor supplier, gudang tujuan, dan rincian kuantitas item.
- Klik tombol **"Terima Barang (Receive)"**.
- Konfirmasi penerimaan barang. Status PO berubah menjadi **RECEIVED**.

**[NASKAH SUARA]**:
> *"Ketika dokumen PO diubah statusnya menjadi **RECEIVED**, backend ASP.NET Core mengeksekusi *database transaction* secara atomik:*
> 1. *Pertama, stok fisik produk secara otomatis bertambah di gudang tujuan.*
> 2. *Kedua, sistem secara otomatis menerbitkan dokumen transaksi **INBOUND** lengkap dengan nomor referensi PO dan nama staf penerima.*
> 
> *Dengan demikian, tidak ada lagi proses manual penambahan stok ganda atau risiko manipulasi data barang masuk."*

---

### BAGIAN 6: TATA KELOLA STOK FISIK & AUDIT MUTASI
*(Estimasi: 07:15 - 08:45)*

**[AKSI LAYAR]**:
- Klik menu sidebar **"Inventaris & Stok"** menuju `/inventory`.
- Tampilkan dropdown pemilihan fasilitas gudang (Jakarta Main Hub, Surabaya, Cikarang).
- Sorot kolom: **On Hand**, **Allocated**, **Available**, dan **Lokasi Rak (Bin)**.

**[NASKAH SUARA]**:
> *"Berikutnya adalah modul **Inventaris & Pelacakan Rak Fisik**.*
> 
> *Sistem ini mendukung pengelolaan multi-fasilitas gudang. Perhatikan bagaimana InvWare memisahkan tiga indikator stok:*
> - ***On Hand Quantity***: *Jumlah total fisik barang yang berada di gudang.*
> - ***Allocated Quantity***: *Jumlah barang yang sudah dipesan / dialokasikan untuk pengiriman keluar.*
> - ***Available Quantity***: *Jumlah riil yang benar-benar bebas untuk ditransaksikan.*
> 
> *Setiap item juga dipetakan hingga ke koordinat rak fisik, seperti kode bin **A01-R02-B03**, sehingga memudahkan staf picker di lapangan."*

**[AKSI LAYAR]**:
- Klik tombol aksi **"Penyesuaian Stok (Adjustment / Stock Opname)"**.
- Tunjukkan modal penyesuaian stok jika ditemukan selisih fisik saat opname berkala.
- Tutup modal, lalu pindah ke menu **"Riwayat Transaksi"** (`/transactions`).
- Tunjukkan log mutasi lengkap dengan filter tipe: `INBOUND`, `OUTBOUND`, `TRANSFER`, dan `ADJUSTMENT`.

**[NASKAH SUARA]**:
> *"Jika terjadi selisih stok saat audit berkala, staf dapat melakukan **Stock Opname Adjustment** dengan mencantumkan alasan selisih.*
> 
> *Seluruh pergerakan barang, baik Inbound, Outbound pengiriman pesanan, maupun Transfer antar fasilitas gudang, tercatat permanen di halaman **Riwayat Transaksi** ini sebagai *immutable audit log* yang transparan dan akuntabel."*

---

### BAGIAN 7: MANAJEMEN PENGGUNA & OTORISASI RBAC
*(Estimasi: 08:45 - 09:45)*

**[AKSI LAYAR]**:
- Klik menu sidebar **"Pengguna"** menuju `/users`.
- Tampilkan daftar 20 pengguna sistem beserta role dan departemennya.
- Tunjukkan bahwa menu ini hanya muncul untuk role **Super Admin**.

**[NASKAH SUARA]**:
> *"Pada modul **Manajemen Pengguna**, Super Admin memiliki wewenang untuk menambah akun baru, menonaktifkan akun staf yang sudah tidak bertugas, serta menetapkan Role RBAC.*
> 
> *Frontend mengimplementasikan **Route Guards** yang ketat. Jika staf gudang biasa atau purchasing mencoba mengakses URL `/users` secara sengaja melalui browser bar, sistem secara otomatis mencegat dan melempar halaman **403 Forbidden** atau mengarahkannya kembali ke Dasbor."*

---

### BAGIAN 8: ARSITEKTUR SISTEM, DATABASE & CLOUD DEPLOYMENT
*(Estimasi: 09:45 - 11:00)*

**[AKSI LAYAR]**:
- Pindah ke Tab Browser 2: Repositori GitHub (`https://github.com/Twisty-39/smart-warehouse-system`).
- Tunjukkan badge header dan struktur direktori.
- Pindah ke Tab Browser 3: Dokumen Flowchart Terintegrasi [Docs/FLOWCHARTS.md](file:///d:/FAJAR%20SIDIK/Portofolio/Smart%20Warehouse%20&%20Inventory%20Management%20System/Docs/FLOWCHARTS.md) atau buka diagram Mermaid.

**[NASKAH SUARA]**:
> *"Terakhir, mari kita tinjau dari sudut pandang arsitektur teknis perangkat lunak dan infrastruktur cloud.*
> 
> *Dari sisi rekayasa perangkat lunak:*
> 1. *Backend dibangun menggunakan **C# ASP.NET Core 10 Web API** dengan prinsip **Clean Architecture & Separation of Concerns**, memisahkan Controllers, Services, DTOs, dan Middleware error handling global.*
> 2. *Basis data dirancang memenuhi kaidah normalisasi **Third Normal Form (3NF)** pada **Microsoft SQL Server 2022**, terdiri dari 11 entitas relasional dengan constraint Foreign Key dan Indexing yang optimal.*
> 3. *Untuk arsitektur deployment, sistem ini diorkestrasi menggunakan **Docker Compose** dan telah live aktif di **Microsoft Azure Virtual Machine (Ubuntu 24.04 LTS)** pada IP publik **70.153.139.90**.*
> 
> *Nginx bertindak sebagai **Reverse Proxy** di port 80, meneruskan traffic API dan static uploads ke container backend secara aman tanpa terkena batasan CORS."*

---

### BAGIAN 9: PENUTUP & KESIMPULAN
*(Estimasi: 11:00 - 11:30)*

**[AKSI LAYAR]**:
- Kembali ke Tab 1 (Dasbor InvWare `http://70.153.139.90/dashboard`).
- Tampilkan tampilan dasbor secara utuh.

**[NASKAH SUARA]**:
> *"Sebagai kesimpulan, sistem **InvWare (Smart Warehouse & Inventory Management System)** ini telah berhasil memenuhi seluruh spesifikasi fungsional dan non-fungsional sistem informasi pergudangan modern skala enterprise:*
> - *Mulai dari keamanan RBAC 4 level,*
> - *Otomatisasi pengadaan barang ke stok,*
> - *Pelacakan koordinat rak gudang fisik,*
> - *Hingga kesiapan deployment di cloud Azure.*
> 
> *Demikian demonstrasi sistem yang dapat saya sampaikan. Terima kasih banyak atas perhatian Bapak / Ibu Dosen. Saya sangat terbuka untuk sesi tanya jawab, saran, serta masukan demi penyempurnaan sistem ini ke depannya.*
> 
> *Wassalamu'alaikum Warahmatullahi Wabarakatuh / Selamat siang."*

---

## 4. Antisipasi Pertanyaan Dosen Penguji

Berikut adalah daftar pertanyaan teknis yang paling sering diajukan oleh dosen penguji beserta jawaban cerdas dan tepat yang disiapkan untuk Anda:

### Q1: *"Bagaimana sistem mencegah kesalahan data atau selisih stok jika ada dua transaksi bersamaan (Concurrency Control)?"*
> **Jawaban Anda**:
> *"Sistem menerapkan dua lapis proteksi:*
> 1. *Di sisi database SQL Server, perubahan stok dieksekusi di dalam **Database Transaction (ACID Compliance)** menggunakan Entity Framework Core. Jika salah satu step gagal (misal kuantitas melebihi stok yang ada), seluruh transaksi akan di-*rollback* otomatis.*
> 2. *Di sisi bisnis logic, sistem memeriksa ketersediaan `Available Quantity` sebelum kuantitas dikurangi, sehingga mencegah kondisi stok minus atau *race condition*."*

### Q2: *"Bagaimana arsitektur keamanannya? Bagaimana sistem memastikan token JWT tidak dipalsukan?"*
> **Jawaban Anda**:
> *"Setiap request ke backend dilindungi oleh **JWT Bearer Token** yang ditandatangani menggunakan algoritma enkripsi **HMAC-SHA256** dengan secret key rahasia di server. Di dalam payload token tersimpan `ClaimTypes.Role` (misalnya `ROLE_ADMIN`, `ROLE_MANAGER`).*
> 
> *Setiap Controller backend didekorasi dengan atribut `[Authorize(Roles = "...")]`. Meskipun seorang penyerang mencoba memodifikasi payload di browser, tanda tangan kriptografis token akan menjadi tidak valid dan ditolak oleh middleware autentikasi dengan status 401/403."*

### Q3: *"Mengapa memilih arsitektur Docker Compose dan Reverse Proxy Nginx untuk deployment di Azure VM?"*
> **Jawaban Anda**:
> *"Ada tiga alasan utama:*
> 1. ***Environment Parity**: Dengan container Docker, seluruh stack (SQL Server 2022, .NET 10 runtime, dan Node/Nginx) dijamin berjalan identik di server Azure maupun di komputer lokal tanpa kendala perbedaan versi SDK.*
> 2. ***Keamanan & Eliminasi CORS**: Nginx bertindak sebagai gerbang tunggal di port 80. Trafik web statis React dilayani langsung oleh Nginx, sedangkan request `/api/` diteruskan secara internal ke container backend di port 5000 melalui jaringan bridge internal Docker. Ini sepenuhnya menghilangkan error CORS.*
> 3. ***Skalabilitas & Kemudahan Maintenance**: Update versi terbaru di server hanya memerlukan perintah `git pull` dan `docker compose up -d --build` tanpa mengganggu dependensi sistem operasi induk Ubuntu."*

### Q4: *"Apakah database sudah dinormalisasi dan mendukung relasi yang kompleks?"*
> **Jawaban Anda**:
> *"Sudah, basis data telah dinormalisasi hingga **Third Normal Form (3NF)** untuk menghindari redundansi data dan anomali pembaruan.*
> *Terdapat 11 entitas relasional utama, antara lain tabel `Users`, `Roles`, `UserProfiles`, `Categories`, `Products`, `Warehouses`, `InventoryStocks`, `StockTransactions`, `Suppliers`, `PurchaseOrders`, dan `PurchaseOrderItems`. Hubungan relasi antar tabel diproteksi dengan foreign key constraints dan cascading rule yang terstruktur."*
