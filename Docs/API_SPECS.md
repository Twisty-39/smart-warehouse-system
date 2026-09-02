# API_SPECS: REST API Specification & Contract Documentation

## 1. Konvensi Umum & Standar REST API

- **Base URL**: `http://localhost:5000/api` atau `https://localhost:7001/api`
- **Format Pertukaran Data**: `application/json` (Kecuali endpoint upload file: `multipart/form-data`)
- **Skema Autentikasi**: `Authorization: Bearer <JWT_TOKEN>`
- **Format Timestamp**: ISO 8601 UTC (`YYYY-MM-DDTHH:mm:ss.fffZ`)

---

## 2. Struktur Standar Respons JSON (Response Envelope)

### 2.1. Respons Berhasil (Success Single Item)
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Operasi berhasil dilakukan.",
  "data": { ... }
}
```

### 2.2. Respons Berhasil Terpaginasi (Paginated List)
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Daftar data berhasil diambil.",
  "data": [ ... ],
  "meta": {
    "currentPage": 1,
    "pageSize": 10,
    "totalCount": 48,
    "totalPages": 5,
    "hasPrevious": false,
    "hasNext": true
  }
}
```

### 2.3. Respons Error Validasi (422 Unprocessable Entity / 400 Bad Request)
```json
{
  "success": false,
  "statusCode": 422,
  "message": "Validasi input gagal.",
  "errors": {
    "Email": ["Format email tidak valid."],
    "UnitPrice": ["Harga unit harus bernilai lebih dari 0."]
  }
}
```

### 2.4. Respons Error Terpusat (401, 403, 404, 500)
```json
{
  "success": false,
  "statusCode": 404,
  "message": "Data dengan ID 12 tidak ditemukan.",
  "errors": null
}
```

---

## 3. Parameter Standar Pencarian, Filter, Pengurutan & Paginasi

Semua endpoint list mendukung query parameter standar berikut:

| Parameter | Tipe | Contoh | Deskripsi |
| :--- | :--- | :--- | :--- |
| `page` | `integer` | `?page=1` | Nomor halaman (default: 1) |
| `limit` | `integer` | `?limit=10` | Jumlah data per halaman (pilihan: 5, 10, 25, 50, 100) |
| `search` | `string` | `?search=laptop` | Pencarian teks bebas pada nama, kode, SKU, atau nomor ref |
| `status` | `string` | `?status=active` | Filter berdasarkan status (`active`, `inactive`, `PENDING`, dsb.) |
| `categoryId` | `integer` | `?categoryId=2` | Filter berdasarkan ID kategori barang |
| `warehouseId`| `integer` | `?warehouseId=1` | Filter berdasarkan lokasi gudang |
| `sortBy` | `string` | `?sortBy=name` | Kolom pengurutan (`createdAt`, `name`, `unitPrice`, `sku`) |
| `sortDir` | `string` | `?sortDir=asc` | Arah pengurutan (`asc` atau `desc`, default: `desc`) |
| `startDate` | `date` | `?startDate=2026-01-01` | Filter awal rentang tanggal pembuatan |
| `endDate` | `date` | `?endDate=2026-08-22` | Filter akhir rentang tanggal pembuatan |

---

## 4. Daftar Lengkap Endpoint REST API

### 4.1. Modul Autentikasi (`/api/auth`)

#### `POST /api/auth/register`
Mendaftarkan akun baru.
- **Wewenang**: Public
- **Request Body**:
  ```json
  {
    "fullName": "Fajar Sidik",
    "email": "fajar@smartwarehouse.com",
    "password": "Password123!",
    "confirmPassword": "Password123!",
    "phoneNumber": "081234567890",
    "department": "Logistics & Supply Chain",
    "roleId": 3
  }
  ```
- **Response 201 Created**:
  ```json
  {
    "success": true,
    "statusCode": 201,
    "message": "Registrasi pengguna berhasil.",
    "data": {
      "id": 1,
      "email": "fajar@smartwarehouse.com",
      "fullName": "Fajar Sidik",
      "role": "Inventory Staff"
    }
  }
  ```

#### `POST /api/auth/login`
Autentikasi akun dan penerbitan token JWT.
- **Wewenang**: Public
- **Request Body**:
  ```json
  {
    "email": "admin@smartwarehouse.com",
    "password": "Password123!"
  }
  ```
- **Response 200 OK**:
  ```json
  {
    "success": true,
    "statusCode": 200,
    "message": "Login berhasil.",
    "data": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
      "expiresAt": "2026-08-22T08:00:00Z",
      "user": {
        "id": 1,
        "email": "admin@smartwarehouse.com",
        "fullName": "System Administrator",
        "role": "Super Admin",
        "roleCode": "ROLE_ADMIN",
        "avatarUrl": "/uploads/avatars/admin.png"
      }
    }
  }
  ```

#### `POST /api/auth/refresh-token`
Memperbarui Access Token yang telah kadaluarsa menggunakan Refresh Token.
- **Wewenang**: Public
- **Request Body**:
  ```json
  {
    "refreshToken": "7c9e6679-7425-40de-944b-e07fc1f90ae7"
  }
  ```

#### `POST /api/auth/forgot-password`
Menghasilkan kode 6-Digit OTP kriptografis dengan masa berlaku 5 menit untuk pemulihan kata sandi.
- **Wewenang**: Public
- **Request Body**:
  ```json
  {
    "email": "admin@smartwarehouse.com"
  }
  ```
- **Response 200 OK**:
  ```json
  {
    "success": true,
    "statusCode": 200,
    "message": "Kode OTP berhasil dikirimkan.",
    "data": {
      "otpCode": "849201",
      "expiryMinutes": 5
    }
  }
  ```

#### `POST /api/auth/resend-otp`
Membuat dan mengirimkan kode OTP 6 digit baru jika waktu tunggu telah habis.
- **Wewenang**: Public
- **Request Body**:
  ```json
  {
    "email": "admin@smartwarehouse.com"
  }
  ```

#### `POST /api/auth/verify-otp`
Memvalidasi kecocokan 6-digit OTP sebelum mengatur ulang kata sandi.
- **Wewenang**: Public
- **Request Body**:
  ```json
  {
    "email": "admin@smartwarehouse.com",
    "otpCode": "849201"
  }
  ```

#### `POST /api/auth/reset-password`
Mereset kata sandi baru menggunakan verifikasi kode 6-Digit OTP.
- **Wewenang**: Public
- **Request Body**:
  ```json
  {
    "email": "admin@smartwarehouse.com",
    "otpCode": "849201",
    "token": "849201",
    "newPassword": "NewPassword123!",
    "confirmNewPassword": "NewPassword123!"
  }
  ```

#### `GET /api/auth/me`
Mengambil informasi detail pengguna yang sedang login berdasarkan Bearer token.
- **Wewenang**: Authenticated

---

### 4.2. Modul Dasbor Analitik (`/api/dashboard`)

#### `GET /api/dashboard/summary`
Mengambil ringkasan data KPI analitik real-time.
- **Wewenang**: Authenticated
- **Response 200 OK**:
  ```json
  {
    "success": true,
    "statusCode": 200,
    "data": {
      "totalProducts": 142,
      "totalStockQuantity": 28450,
      "totalStockValue": 458900000.00,
      "lowStockCount": 12,
      "outOfStockCount": 3,
      "totalWarehouses": 8,
      "totalActivePurchaseOrders": 6,
      "monthlyInboundCount": 24,
      "monthlyOutboundCount": 18
    }
  }
  ```

#### `GET /api/dashboard/charts`
Mengambil data statistik grafik (tren transaksi bulanan & distribusi kategori).
- **Wewenang**: Authenticated

#### `GET /api/dashboard/recent-activities`
Mengambil 10 aktivitas mutasi transaksi terbaru.
- **Wewenang**: Authenticated

---

### 4.3. Modul Produk (`/api/products`)

- `GET /api/products` — Mendapatkan daftar produk dengan pencarian, filter, sorting, dan paginasi.
- `GET /api/products/{id}` — Mendapatkan detail produk beserta total stok di seluruh gudang.
- `POST /api/products` — Menambah produk baru (Validasi: SKU/Barcode unik, UnitPrice > 0).
- `PUT /api/products/{id}` — Memperbarui data produk.
- `PATCH /api/products/{id}/status` — Mengubah status produk aktif/nonaktif.
- `DELETE /api/products/{id}` — Menghapus produk (*Soft Delete*, set `is_deleted = true`).

---

### 4.4. Modul Kategori (`/api/categories`)

- `GET /api/categories` — Mendapatkan daftar seluruh kategori (flat atau tree view).
- `GET /api/categories/{id}` — Mendapatkan detail kategori beserta produk di dalamnya.
- `POST /api/categories` — Menambah kategori baru (Validasi: Kode unik).
- `PUT /api/categories/{id}` — Memperbarui kategori.
- `DELETE /api/categories/{id}` — Menghapus kategori.

---

### 4.5. Modul Fasilitas Gudang (`/api/warehouses`)

- `GET /api/warehouses` — Mendapatkan daftar gudang (search, sort, paginasi).
- `GET /api/warehouses/{id}` — Mendapatkan detail gudang, utilisasi kapasitas, dan daftar stok barang di dalamnya.
- `POST /api/warehouses` — Menambah gudang baru.
- `PUT /api/warehouses/{id}` — Memperbarui info gudang.
- `DELETE /api/warehouses/{id}` — Menghapus gudang (*Soft Delete*).

---

### 4.6. Modul Stok & Inventaris (`/api/inventory`)

- `GET /api/inventory` — Mendapatkan daftar stok per produk dan lokasi bin/gudang.
- `GET /api/inventory/low-stock` — Mendapatkan daftar produk dengan kuantitas di bawah ambang `reorder_level`.
- `POST /api/inventory/adjust` — Penyesuaian stok manual (*Stock Opname Adjustment*).
- `POST /api/inventory/transfer` — Mutasi/Transfer stok antar gudang.

---

### 4.7. Modul Mutasi & Transaksi (`/api/transactions`)

- `GET /api/transactions` — Daftar log mutasi barang (Filter: `INBOUND`, `OUTBOUND`, `TRANSFER`, `ADJUSTMENT`, tanggal, gudang).
- `GET /api/transactions/{id}` — Detail riwayat transaksi mutasi.
- `POST /api/transactions/inbound` — Mencatat barang masuk dari pemasok/retur.
- `POST /api/transactions/outbound` — Mencatat barang keluar untuk pengiriman/distribusi.

---

### 4.8. Modul Pengadaan Barang / Purchase Order (`/api/purchase-orders`)

- `GET /api/purchase-orders` — Daftar PO pengadaan barang (Filter status: `DRAFT`, `PENDING`, `APPROVED`, `RECEIVED`, `CANCELLED`).
- `GET /api/purchase-orders/{id}` — Detail PO dan rincian item barang (`PurchaseOrderItems`).
- `POST /api/purchase-orders` — Membuat PO baru dengan multi-item barang.
- `PUT /api/purchase-orders/{id}` — Memperbarui data PO (hanya jika status `DRAFT` atau `PENDING`).
- `PATCH /api/purchase-orders/{id}/status` — Mengubah status PO (`APPROVE`, `CANCEL`).
- `POST /api/purchase-orders/{id}/receive` — Menerima barang masuk dari PO dan otomatis menambahkan stok pada tabel `InventoryStocks`.

---

### 4.9. Modul Pemasok / Vendor (`/api/suppliers`)

- `GET /api/suppliers` — Daftar pemasok dengan search, sort, filter rating, dan paginasi.
- `GET /api/suppliers/{id}` — Detail pemasok dan histori PO terkait.
- `POST /api/suppliers` — Menambah pemasok baru (Validasi: Kode & Email unik).
- `PUT /api/suppliers/{id}` — Memperbarui pemasok.
- `DELETE /api/suppliers/{id}` — Menghapus pemasok (*Soft Delete*).

---

### 4.10. Modul Pengguna & Profil (`/api/users`)

- `GET /api/users` — Daftar pengguna sistem (Wewenang: Super Admin).
- `GET /api/users/{id}` — Detail profil pengguna.
- `POST /api/users` — Menambah pengguna baru dan menetapkan role.
- `PUT /api/users/{id}` — Memperbarui data akun atau profil.
- `PATCH /api/users/{id}/toggle-status` — Mengaktifkan/menonaktifkan akun.
- `DELETE /api/users/{id}` — Menghapus pengguna.

---

### 4.11. Modul Unggah File (`/api/uploads`)

#### `POST /api/uploads/image`
Mengunggah berkas gambar foto produk atau avatar pengguna.
- **Content-Type**: `multipart/form-data`
- **File Type**: JPG, JPEG, PNG, WEBP (Max: 5MB)
- **Response 200 OK**:
  ```json
  {
    "success": true,
    "statusCode": 200,
    "data": {
      "fileName": "product_a9f1.webp",
      "fileUrl": "/uploads/images/product_a9f1.webp",
      "fileSizeBytes": 452810
    }
  }
  ```

#### `POST /api/uploads/document`
Mengunggah berkas dokumen faktur atau surat jalan.
- **Content-Type**: `multipart/form-data`
- **File Type**: PDF (Max: 10MB)
- **Response 200 OK**:
  ```json
  {
    "success": true,
    "statusCode": 200,
    "data": {
      "fileName": "invoice_po_2026.pdf",
      "fileUrl": "/uploads/documents/invoice_po_2026.pdf",
      "fileSizeBytes": 1284500
    }
  }
  ```
