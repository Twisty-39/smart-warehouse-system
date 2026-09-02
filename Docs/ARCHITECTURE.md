# ARCHITECTURE: System Architecture & Design Documentation

## 1. Gambaran Umum Arsitektur Sistem (High-Level Architecture)

**Smart Warehouse & Inventory Management System (SWIMS)** dibangun menggunakan arsitektur **Fullstack Monorepo**. Pemisahan antara sisi server (Backend API) dan sisi klien (Frontend SPA) dilakukan secara modular namun tetap berada dalam satu repositori kerja untuk mempermudah integrasi, deployment, dan pemeliharaan.

```mermaid
graph TB
    subgraph Client_Side ["Frontend Layer (Client Side - React + Vite + TypeScript)"]
        UI["Modern Web UI / Responsive Layout<br/>(Desktop, Tablet, Mobile)"]
        Router["Client-Side Routing & Route Guards<br/>(Public, Private, Role-Based)"]
        State["State & Auth Context<br/>(JWT in LocalStorage/Cookie)"]
        Axios["API Client (Axios Interceptors & Error Fallback)"]
    end

    subgraph Gateway_Security ["Security & Middleware Layer"]
        CORS["CORS Policy"]
        AuthMiddleware["JWT Bearer Authentication & Claims"]
        ExceptionMiddleware["Global Exception & Error Handling (400, 401, 403, 404, 422, 500)"]
        ValidationFilter["FluentValidation Filter"]
    end

    subgraph Backend_Side ["Backend Layer (C# ASP.NET Core Web API)"]
        Controllers["Controllers (RESTful Endpoints & HTTP Verbs)"]
        Services["Application Services & Business Logic"]
        DTOs["Data Transfer Objects (DTOs & ViewModels)"]
        EFCore["Infrastructure / Entity Framework Core 10"]
    end

    subgraph Storage_Layer ["Persistence & Storage Layer"]
        MSSQL[("Microsoft SQL Server (SSMS)<br/>SmartWarehouseDb")]
        FileStorage["Local File Storage<br/>(wwwroot/uploads - Images & PDFs)"]
    end

    UI --> Router
    Router --> State
    State --> Axios
    Axios -- "HTTP / REST (JSON & Multipart)" --> CORS
    CORS --> AuthMiddleware
    AuthMiddleware --> ExceptionMiddleware
    ExceptionMiddleware --> ValidationFilter
    ValidationFilter --> Controllers
    Controllers --> Services
    Services --> DTOs
    Services --> EFCore
    EFCore --> MSSQL
    Services --> FileStorage
```

---

## 2. Struktur Direktori Monorepo

```
Smart Warehouse & Inventory Management System/
│
├── Docs/                              # Seluruh Berkas Dokumentasi Projekan S1
│   ├── API_SPECS.md                   # Spesifikasi REST API & Kontrak Data
│   ├── ARCHITECTURE.md                # Dokumentasi Arsitektur & Flowchart
│   ├── CONTEXT.md                     # Latar Belakang Bisnis & RBAC Matrix
│   ├── PLANNING.md                    # Roadmap & Manajemen Rencana Proyek
│   ├── PROGRESS.md                    # Lembar Pelacak Progres Interaktif
│   ├── SCHEMA.md                      # Kamus Data 3NF, ERD & Seed Data
│   └── KETENTUAN UMUM PEMBUATAN...pdf # Dokumen Acuan Persyaratan S1
│
├── backend/                           # Backend C# ASP.NET Core Web API
│   ├── SmartWarehouse.sln             # File Solusi .NET
│   └── SmartWarehouse.Api/
│       ├── Controllers/               # REST API Controllers
│       ├── Data/                      # DbContext, Migrations, Seeder, Scripts
│       │   ├── AppDbContext.cs
│       │   ├── DbSeeder.cs
│       │   └── Scripts/init_database.sql # Script SQL Mandiri untuk SSMS
│       ├── DTOs/                      # Request & Response Data Transfer Objects
│       ├── Middleware/                # Global Exception & Logging Middleware
│       ├── Models/Entities/           # Domain Entities (11 Tabel Relasional)
│       ├── Services/                  # Business Logic Services
│       ├── Validators/                # FluentValidation Rules
│       ├── wwwroot/uploads/           # Berkas Gambar & Dokumen PDF yang diunggah
│       ├── appsettings.json           # Konfigurasi Koneksi DB & JWT Key
│       └── Program.cs                 # Entry Point & Dependency Injection
│
├── frontend/                          # Frontend React + TypeScript + Vite
│   ├── public/                        # Static Assets & Icons
│   ├── src/
│   │   ├── assets/                    # Gambar & Style Tema
│   │   ├── components/                # Komponen Reusable (DataTable, Modal, Toast, Upload)
│   │   ├── context/                   # AuthContext & ThemeContext
│   │   ├── layouts/                   # MainLayout, AuthLayout, Sidebar, Navbar
│   │   ├── pages/                     # Halaman CRUD & View
│   │   │   ├── Auth/                  # Login, Register, Forgot/Reset Password
│   │   │   ├── Dashboard/             # Dashboard Real-time & Chart Analitik
│   │   │   ├── Products/              # List, Detail, Form Modal Produk
│   │   │   ├── Warehouses/            # List, Detail, Form Gudang
│   │   │   ├── Inventory/             # Monitoring Stok & Modal Mutasi/Transfer
│   │   │   ├── PurchaseOrders/        # List, Detail, Form PO Multi-item
│   │   │   ├── Suppliers/             # List & Modal Vendor Pemasok
│   │   │   ├── Categories/            # List & Modal Master Kategori
│   │   │   ├── Users/                 # Manajemen Pengguna & Profil
│   │   │   └── Errors/                # 401, 403, 404, 500 Error Pages
│   │   ├── routes/                    # AppRoutes, ProtectedRoute, RoleGuard
│   │   ├── services/                  # Axios API Client & Service Hooks
│   │   ├── types/                     # TypeScript Interface Definitions
│   │   ├── App.tsx                    # Root Component
│   │   └── main.tsx                   # Entry Point React
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
│
└── README.md                          # Panduan Menjalankan & Informasi Proyek
```

---

## 3. Diagram Alur Kerja Sistem (System Flowcharts)

### 3.1. Alur Autentikasi & Otorisasi Pengguna (Authentication & RBAC Flow)

```mermaid
flowchart TD
    Start([User Mengakses Aplikasi]) --> CheckToken{Memiliki Token JWT Valid?}
    CheckToken -- Ya --> FetchProfile[Ambil Data Profil & Hak Akses Role]
    CheckToken -- Tidak --> AuthChoice{Punya Akun Terdaftar?}
    
    AuthChoice -- Belum --> RegisterPage[Halaman Register]
    RegisterPage --> SubmitRegister[Kirim Data Registrasi]
    SubmitRegister --> BackendValidateReg{Validasi Backend Berhasil?}
    BackendValidateReg -- Gagal --> ShowRegError[Tampilkan Pesan Error Validasi] --> RegisterPage
    BackendValidateReg -- Berhasil --> RedirectLogin[Arahkan ke Halaman Login]
    
    AuthChoice -- Sudah --> LoginPage[Halaman Login]
    LoginPage --> SubmitLogin[Kirim Email & Password]
    SubmitLogin --> BackendAuth{Kredensial Valid?}
    BackendAuth -- Salah --> ShowLoginError[Tampilkan Notifikasi Error] --> LoginPage
    BackendAuth -- Benar --> IssueJWT[Terbitkan Access Token & Refresh Token]
    IssueJWT --> SaveStorage[Simpan Token di LocalStorage / Cookie]
    SaveStorage --> FetchProfile
    
    FetchProfile --> RoleCheck{Role Sesuai Rute Tujuan?}
    RoleCheck -- Tidak Sesuai --> Show403[Redirect ke Halaman 403 Forbidden]
    RoleCheck -- Sesuai --> Dashboard[Akses Halaman Utama / Dasbor]
```

### 3.2. Alur Penerimaan Barang Masuk (Inbound Receiving Flow)

```mermaid
flowchart TD
    StartInbound([Petugas Menerima Barang dari Pemasok / PO]) --> SelectPO[Pilih Purchase Order Terkait]
    SelectPO --> CheckPOStatus{Status PO APPROVED?}
    CheckPOStatus -- Tidak --> RejectPO[PO Harus Disetujui Terlebih Dahulu]
    CheckPOStatus -- Ya --> InspectItems[Pemeriksaan Fisik Kuantitas & Kondisi Barang]
    InspectItems --> UploadReceipt[Unggah Foto Surat Jalan / PDF Faktur]
    UploadReceipt --> SubmitInbound[Kirim Form Penerimaan Barang Inbound]
    SubmitInbound --> DBTransaction[Eksekusi Database Transaction]
    DBTransaction --> UpdateStock[Tambahkan Saldo Quantity di InventoryStocks]
    DBTransaction --> LogTransaction[Catat Mutasi di StockTransactions Tipe INBOUND]
    DBTransaction --> UpdatePOStatus[Ubah Status PurchaseOrder Menjadi RECEIVED]
    UpdatePOStatus --> CommitDB{Semua Operasi Berhasil?}
    CommitDB -- Gagal --> Rollback[Rollback Transaction & Kembalikan Error 500]
    CommitDB -- Berhasil --> SuccessToast[Tampilkan Toast Sukses & Perbarui Dasbor]
```

### 3.3. Alur Mutasi / Transfer Antar Gudang (Warehouse Transfer Flow)

```mermaid
flowchart TD
    StartTransfer([Inisiasi Transfer Barang]) --> InputData[Pilih Produk, Gudang Asal, Gudang Tujuan & Kuantitas]
    InputData --> ValidateStock{Stok di Gudang Asal Mencukupi?}
    ValidateStock -- Tidak --> ShowError[Peringatan: Stok Tersedia Kurang]
    ValidateStock -- Ya --> ConfirmTransfer[Konfirmasi Permintaan Transfer]
    ConfirmTransfer --> BeginTrx[Mulai Database Transaction]
    BeginTrx --> DeductSource[Kurangi Saldo Stok Gudang Asal]
    DeductSource --> AddTarget[Tambahkan Saldo Stok Gudang Tujuan]
    AddTarget --> RecordAudit[Buat Catatan Audit di StockTransactions Tipe TRANSFER]
    RecordAudit --> EndTrx[Commit Transaction]
    EndTrx --> RefreshUI[Perbarui Data Stok & Kirim Notifikasi Sukses]
```

### 3.4. Siklus Hidup Dokumen Pengadaan (Purchase Order Lifecycle)

```mermaid
stateDiagram-v2
    [*] --> DRAFT : Purchasing Officer Membuat Draft PO
    DRAFT --> PENDING : Submit untuk Persetujuan
    PENDING --> APPROVED : Disetujui oleh Warehouse Manager
    PENDING --> CANCELLED : Ditolak / Dibatalkan
    APPROVED --> RECEIVED : Barang Diterima di Gudang & Stok Bertambah
    APPROVED --> CANCELLED : Dibatalkan Sebelum Pengiriman
    RECEIVED --> [*]
    CANCELLED --> [*]
```

### 3.5. Alur Pemulihan Kata Sandi dengan 6-Digit OTP (OTP Password Reset Flow)

```mermaid
flowchart TD
    ReqStart([Pengguna Lupa Kata Sandi]) --> InputEmail[Input Alamat Email Terdaftar]
    InputEmail --> CallForgotAPI[Kirim POST /api/auth/forgot-password]
    CallForgotAPI --> CheckUser{Email Terdaftar di DB?}
    CheckUser -- Tidak --> Ret404[Kembalikan Pesan: Akun Tidak Ditemukan]
    CheckUser -- Ya --> GenOTP[Generate 6-Digit Kriptografis OTP & Simpan Hash]
    GenOTP --> SetExpiry[Set Waktu Kedaluwarsa: 5 Menit]
    SetExpiry --> NavReset[Arahkan ke Halaman /reset-password]
    NavReset --> RenderPIN[Tampilkan 6 Kotak Input PIN OTP Kosong]
    RenderPIN --> FillOTP[User Input/Paste 6 Digit OTP & Kata Sandi Baru]
    FillOTP --> SubmitReset[Kirim POST /api/auth/reset-password]
    SubmitReset --> VerifyOTP{OTP Cocok & Belum Kedaluwarsa?}
    VerifyOTP -- Tidak --> ShowOTPError[Tampilkan Notifikasi Error OTP] --> RenderPIN
    VerifyOTP -- Ya --> HashPassword[Enkripsi Password Baru dengan BCrypt]
    HashPassword --> ClearToken[Hapus Token OTP dari DB]
    ClearToken --> SuccessLogin[Redirect ke /login dengan Toast Sukses]
```

---

## 4. Arsitektur Keamanan (Security Architecture)

1. **Password Hashing**: Menggunakan algoritma **BCrypt** dengan *salt work factor* 11 untuk mengenkripsi seluruh kata sandi pengguna di database.
2. **JWT Authentication & Authorization**:
   - Token ditandatangani menggunakan algoritma `HMAC-SHA256` dengan kunci rahasia minimal 256-bit.
   - Mengandung *claims*: `userId`, `email`, `role`, `exp`, `nbf`.
   - Masa berlaku Access Token: 60 menit.
   - Refresh Token disimpan aman untuk pembaruan sesi otomatis tanpa login ulang.
3. **Pencegahan SQL Injection**: Seluruh interaksi basis data menggunakan ORM **Entity Framework Core** dengan parameterisasi query otomatis (`Parameterized Queries`). Tidak ada eksekusi *raw SQL string concatenation*.
4. **Proteksi XSS (Cross-Site Scripting)**:
   - Sanitasi input pada layer DTO dan validasi pola karakter.
   - React otomatis melakukan escaping terhadap data dinamis pada JSX template.
5. **CORS (Cross-Origin Resource Sharing)**: Konfigurasi kebijakan CORS yang ketat di ASP.NET Core (`WithOrigins`, `AllowAnyMethod`, `AllowAnyHeader`).
6. **Validasi Sisi Server**: Memanfaatkan **FluentValidation** untuk menguji aturan wajib, format email, batasan numerik, dan status enum sebelum request diteruskan ke service.
