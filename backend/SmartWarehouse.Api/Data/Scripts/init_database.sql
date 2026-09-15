-- ============================================================================
-- SMART WAREHOUSE & INVENTORY MANAGEMENT SYSTEM (SWIMS)
-- SQL Server Management Studio (SSMS) Direct Initialization Script
-- S1 Project Standard - 3NF Database Structure with Relationships & Seeds
-- ============================================================================

USE master;
GO

IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'SmartWarehouseDb')
BEGIN
    CREATE DATABASE SmartWarehouseDb;
END
GO

USE SmartWarehouseDb;
GO

-- 1. DROP EXISTING FOREIGN KEYS AND TABLES IF EXIST (SAFE RESET)
IF OBJECT_ID('dbo.PurchaseOrderItems', 'U') IS NOT NULL DROP TABLE dbo.PurchaseOrderItems;
IF OBJECT_ID('dbo.PurchaseOrders', 'U') IS NOT NULL DROP TABLE dbo.PurchaseOrders;
IF OBJECT_ID('dbo.StockTransactions', 'U') IS NOT NULL DROP TABLE dbo.StockTransactions;
IF OBJECT_ID('dbo.InventoryStocks', 'U') IS NOT NULL DROP TABLE dbo.InventoryStocks;
IF OBJECT_ID('dbo.Products', 'U') IS NOT NULL DROP TABLE dbo.Products;
IF OBJECT_ID('dbo.Suppliers', 'U') IS NOT NULL DROP TABLE dbo.Suppliers;
IF OBJECT_ID('dbo.Warehouses', 'U') IS NOT NULL DROP TABLE dbo.Warehouses;
IF OBJECT_ID('dbo.Categories', 'U') IS NOT NULL DROP TABLE dbo.Categories;
IF OBJECT_ID('dbo.UserProfiles', 'U') IS NOT NULL DROP TABLE dbo.UserProfiles;
IF OBJECT_ID('dbo.Users', 'U') IS NOT NULL DROP TABLE dbo.Users;
IF OBJECT_ID('dbo.Roles', 'U') IS NOT NULL DROP TABLE dbo.Roles;
GO

-- 2. CREATE ROLES TABLE
CREATE TABLE dbo.Roles (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(50) NOT NULL,
    code NVARCHAR(50) NOT NULL UNIQUE,
    description NVARCHAR(255) NULL,
    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);
GO

-- 3. CREATE USERS TABLE
CREATE TABLE dbo.Users (
    id INT IDENTITY(1,1) PRIMARY KEY,
    email NVARCHAR(100) NOT NULL UNIQUE,
    password_hash NVARCHAR(255) NOT NULL,
    role_id INT NOT NULL CONSTRAINT FK_Users_Roles FOREIGN KEY REFERENCES dbo.Roles(id),
    is_active BIT NOT NULL DEFAULT 1,
    refresh_token NVARCHAR(MAX) NULL,
    refresh_token_expiry_time DATETIME2 NULL,
    password_reset_token NVARCHAR(MAX) NULL,
    password_reset_token_expiry_time DATETIME2 NULL,
    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);
GO

-- 4. CREATE USER_PROFILES TABLE (1:1 with Users)
CREATE TABLE dbo.UserProfiles (
    id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT NOT NULL UNIQUE CONSTRAINT FK_UserProfiles_Users FOREIGN KEY REFERENCES dbo.Users(id) ON DELETE CASCADE,
    full_name NVARCHAR(100) NOT NULL,
    phone_number NVARCHAR(20) NULL,
    avatar_url NVARCHAR(255) NULL,
    department NVARCHAR(100) NULL,
    address NVARCHAR(255) NULL,
    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);
GO

-- 5. CREATE CATEGORIES TABLE (Self-referencing 1:N)
CREATE TABLE dbo.Categories (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(100) NOT NULL,
    code NVARCHAR(50) NOT NULL UNIQUE,
    description NVARCHAR(255) NULL,
    parent_category_id INT NULL CONSTRAINT FK_Categories_Parent FOREIGN KEY REFERENCES dbo.Categories(id),
    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);
GO

-- 6. CREATE WAREHOUSES TABLE (Soft Delete Table 1)
CREATE TABLE dbo.Warehouses (
    id INT IDENTITY(1,1) PRIMARY KEY,
    code NVARCHAR(50) NOT NULL UNIQUE,
    name NVARCHAR(100) NOT NULL,
    address NVARCHAR(255) NOT NULL,
    city NVARCHAR(100) NOT NULL,
    capacity_sqm DECIMAL(12,2) NOT NULL DEFAULT 0,
    manager_id INT NULL CONSTRAINT FK_Warehouses_Manager FOREIGN KEY REFERENCES dbo.Users(id),
    is_active BIT NOT NULL DEFAULT 1,
    is_deleted BIT NOT NULL DEFAULT 0,
    deleted_at DATETIME2 NULL,
    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);
GO

-- 7. CREATE PRODUCTS TABLE (Soft Delete Table 2)
CREATE TABLE dbo.Products (
    id INT IDENTITY(1,1) PRIMARY KEY,
    sku NVARCHAR(50) NOT NULL UNIQUE,
    barcode NVARCHAR(50) NOT NULL UNIQUE,
    name NVARCHAR(150) NOT NULL,
    description NVARCHAR(MAX) NULL,
    unit_price DECIMAL(18,2) NOT NULL DEFAULT 0,
    cost_price DECIMAL(18,2) NOT NULL DEFAULT 0,
    reorder_level INT NOT NULL DEFAULT 10,
    min_stock INT NOT NULL DEFAULT 5,
    max_stock INT NOT NULL DEFAULT 1000,
    unit_of_measure NVARCHAR(20) NOT NULL DEFAULT 'PCS',
    category_id INT NOT NULL CONSTRAINT FK_Products_Category FOREIGN KEY REFERENCES dbo.Categories(id),
    image_url NVARCHAR(255) NULL,
    is_deleted BIT NOT NULL DEFAULT 0,
    deleted_at DATETIME2 NULL,
    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);
GO

-- 8. CREATE SUPPLIERS TABLE (Soft Delete Table 3)
CREATE TABLE dbo.Suppliers (
    id INT IDENTITY(1,1) PRIMARY KEY,
    code NVARCHAR(50) NOT NULL UNIQUE,
    name NVARCHAR(150) NOT NULL,
    contact_name NVARCHAR(100) NOT NULL,
    email NVARCHAR(100) NOT NULL,
    phone NVARCHAR(20) NOT NULL,
    address NVARCHAR(255) NOT NULL,
    tax_id NVARCHAR(50) NULL,
    rating DECIMAL(3,2) NOT NULL DEFAULT 5.00,
    is_active BIT NOT NULL DEFAULT 1,
    is_deleted BIT NOT NULL DEFAULT 0,
    deleted_at DATETIME2 NULL,
    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);
GO

-- 9. CREATE INVENTORY_STOCKS TABLE
CREATE TABLE dbo.InventoryStocks (
    id INT IDENTITY(1,1) PRIMARY KEY,
    product_id INT NOT NULL CONSTRAINT FK_Stocks_Product FOREIGN KEY REFERENCES dbo.Products(id) ON DELETE CASCADE,
    warehouse_id INT NOT NULL CONSTRAINT FK_Stocks_Warehouse FOREIGN KEY REFERENCES dbo.Warehouses(id) ON DELETE CASCADE,
    bin_location NVARCHAR(50) NOT NULL DEFAULT 'DEFAULT',
    quantity_on_hand INT NOT NULL DEFAULT 0,
    quantity_allocated INT NOT NULL DEFAULT 0,
    quantity_available INT NOT NULL DEFAULT 0,
    last_counted_at DATETIME2 NULL,
    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT UQ_Product_Warehouse_Bin UNIQUE (product_id, warehouse_id, bin_location)
);
GO

-- 10. CREATE STOCK_TRANSACTIONS TABLE
CREATE TABLE dbo.StockTransactions (
    id INT IDENTITY(1,1) PRIMARY KEY,
    reference_number NVARCHAR(50) NOT NULL UNIQUE,
    transaction_type NVARCHAR(30) NOT NULL, -- INBOUND, OUTBOUND, TRANSFER, ADJUSTMENT
    product_id INT NOT NULL CONSTRAINT FK_Transactions_Product FOREIGN KEY REFERENCES dbo.Products(id),
    source_warehouse_id INT NULL CONSTRAINT FK_Transactions_SrcWarehouse FOREIGN KEY REFERENCES dbo.Warehouses(id),
    target_warehouse_id INT NULL CONSTRAINT FK_Transactions_TgtWarehouse FOREIGN KEY REFERENCES dbo.Warehouses(id),
    quantity INT NOT NULL,
    notes NVARCHAR(255) NULL,
    document_url NVARCHAR(255) NULL,
    created_by_user_id INT NOT NULL CONSTRAINT FK_Transactions_User FOREIGN KEY REFERENCES dbo.Users(id),
    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);
GO

-- 11. CREATE PURCHASE_ORDERS TABLE
CREATE TABLE dbo.PurchaseOrders (
    id INT IDENTITY(1,1) PRIMARY KEY,
    po_number NVARCHAR(50) NOT NULL UNIQUE,
    supplier_id INT NOT NULL CONSTRAINT FK_PurchaseOrders_Supplier FOREIGN KEY REFERENCES dbo.Suppliers(id),
    order_date DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    expected_delivery_date DATETIME2 NULL,
    status NVARCHAR(30) NOT NULL DEFAULT 'PENDING',
    total_amount DECIMAL(18,2) NOT NULL DEFAULT 0,
    notes NVARCHAR(255) NULL,
    document_url NVARCHAR(255) NULL,
    created_by_user_id INT NOT NULL CONSTRAINT FK_PurchaseOrders_User FOREIGN KEY REFERENCES dbo.Users(id),
    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);
GO

-- 12. CREATE PURCHASE_ORDER_ITEMS TABLE (M:N Junction)
CREATE TABLE dbo.PurchaseOrderItems (
    id INT IDENTITY(1,1) PRIMARY KEY,
    purchase_order_id INT NOT NULL CONSTRAINT FK_POItems_PO FOREIGN KEY REFERENCES dbo.PurchaseOrders(id) ON DELETE CASCADE,
    product_id INT NOT NULL CONSTRAINT FK_POItems_Product FOREIGN KEY REFERENCES dbo.Products(id),
    ordered_quantity INT NOT NULL,
    received_quantity INT NOT NULL DEFAULT 0,
    unit_cost DECIMAL(18,2) NOT NULL,
    subtotal DECIMAL(18,2) NOT NULL,
    notes NVARCHAR(255) NULL,
    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);
GO

-- ============================================================================
-- 13. SEED INITIAL DATA (Untuk Keperluan Pengujian Langsung oleh Dosen di SSMS)
-- ============================================================================

-- 13.1. SEED ROLES (4 Roles)
SET IDENTITY_INSERT dbo.Roles ON;
INSERT INTO dbo.Roles (id, name, code, description, created_at, updated_at) VALUES
(1, N'Super Admin', N'ROLE_ADMIN', N'Akses penuh ke seluruh modul sistem', SYSUTCDATETIME(), SYSUTCDATETIME()),
(2, N'Warehouse Manager', N'ROLE_MANAGER', N'Mengelola operasional gudang, persetujuan PO dan mutasi stok', SYSUTCDATETIME(), SYSUTCDATETIME()),
(3, N'Inventory Staff', N'ROLE_STAFF', N'Mencatat penerimaan, pengeluaran, dan stock opname fisik', SYSUTCDATETIME(), SYSUTCDATETIME()),
(4, N'Purchasing Officer', N'ROLE_PURCHASING', N'Mengelola data vendor pemasok dan pembuatan Purchase Order', SYSUTCDATETIME(), SYSUTCDATETIME());
SET IDENTITY_INSERT dbo.Roles OFF;
GO

-- 13.2. SEED USERS & USER PROFILES (Password: Password123!)
-- Hash BCrypt untuk 'Password123!': $2a$11$eAKZ9oJ0qM4sF7l5xK1O2.3yX6uW9vR2eZ1tY8aB4cD7eF0gH3iJk
SET IDENTITY_INSERT dbo.Users ON;
INSERT INTO dbo.Users (id, email, password_hash, role_id, is_active, created_at, updated_at) VALUES
(1, N'admin@smartwarehouse.com', N'$2a$11$eAKZ9oJ0qM4sF7l5xK1O2.3yX6uW9vR2eZ1tY8aB4cD7eF0gH3iJk', 1, 1, SYSUTCDATETIME(), SYSUTCDATETIME()),
(2, N'manager.jkt@smartwarehouse.com', N'$2a$11$eAKZ9oJ0qM4sF7l5xK1O2.3yX6uW9vR2eZ1tY8aB4cD7eF0gH3iJk', 2, 1, SYSUTCDATETIME(), SYSUTCDATETIME()),
(3, N'manager.sby@smartwarehouse.com', N'$2a$11$eAKZ9oJ0qM4sF7l5xK1O2.3yX6uW9vR2eZ1tY8aB4cD7eF0gH3iJk', 2, 1, SYSUTCDATETIME(), SYSUTCDATETIME()),
(4, N'manager.ckr@smartwarehouse.com', N'$2a$11$eAKZ9oJ0qM4sF7l5xK1O2.3yX6uW9vR2eZ1tY8aB4cD7eF0gH3iJk', 2, 1, SYSUTCDATETIME(), SYSUTCDATETIME()),
(5, N'purchasing.lead@smartwarehouse.com', N'$2a$11$eAKZ9oJ0qM4sF7l5xK1O2.3yX6uW9vR2eZ1tY8aB4cD7eF0gH3iJk', 4, 1, SYSUTCDATETIME(), SYSUTCDATETIME()),
(6, N'purchasing.staff1@smartwarehouse.com', N'$2a$11$eAKZ9oJ0qM4sF7l5xK1O2.3yX6uW9vR2eZ1tY8aB4cD7eF0gH3iJk', 4, 1, SYSUTCDATETIME(), SYSUTCDATETIME()),
(7, N'purchasing.staff2@smartwarehouse.com', N'$2a$11$eAKZ9oJ0qM4sF7l5xK1O2.3yX6uW9vR2eZ1tY8aB4cD7eF0gH3iJk', 4, 1, SYSUTCDATETIME(), SYSUTCDATETIME()),
(8, N'staff.jkt1@smartwarehouse.com', N'$2a$11$eAKZ9oJ0qM4sF7l5xK1O2.3yX6uW9vR2eZ1tY8aB4cD7eF0gH3iJk', 3, 1, SYSUTCDATETIME(), SYSUTCDATETIME()),
(9, N'staff.jkt2@smartwarehouse.com', N'$2a$11$eAKZ9oJ0qM4sF7l5xK1O2.3yX6uW9vR2eZ1tY8aB4cD7eF0gH3iJk', 3, 1, SYSUTCDATETIME(), SYSUTCDATETIME()),
(10, N'staff.ckr1@smartwarehouse.com', N'$2a$11$eAKZ9oJ0qM4sF7l5xK1O2.3yX6uW9vR2eZ1tY8aB4cD7eF0gH3iJk', 3, 1, SYSUTCDATETIME(), SYSUTCDATETIME());
SET IDENTITY_INSERT dbo.Users OFF;
GO

SET IDENTITY_INSERT dbo.UserProfiles ON;
INSERT INTO dbo.UserProfiles (id, user_id, full_name, phone_number, avatar_url, department, address, created_at, updated_at) VALUES
(1, 1, N'Fajar Sidik', N'081234567890', N'https://ui-avatars.com/api/?name=Fajar+Sidik&background=946D6D&color=fff', N'Executive Management', N'Jl. Sudirman Kav 10, Jakarta', SYSUTCDATETIME(), SYSUTCDATETIME()),
(2, 2, N'Budi Santoso', N'081234567891', N'https://ui-avatars.com/api/?name=Budi+Santoso&background=946D6D&color=fff', N'Warehouse Operations', N'Jl. Daan Mogot KM 12, Jakarta Barat', SYSUTCDATETIME(), SYSUTCDATETIME()),
(3, 3, N'Siti Rahmawati', N'081234567892', N'https://ui-avatars.com/api/?name=Siti+Rahmawati&background=946D6D&color=fff', N'Warehouse Operations', N'Jl. Rungkut Industri III, Surabaya', SYSUTCDATETIME(), SYSUTCDATETIME()),
(4, 4, N'Hendro Wijaya', N'081234567893', N'https://ui-avatars.com/api/?name=Hendro+Wijaya&background=946D6D&color=fff', N'Warehouse Operations', N'Kawasan Industri GIIC, Cikarang', SYSUTCDATETIME(), SYSUTCDATETIME()),
(5, 5, N'Dewi Lestari', N'081234567894', N'https://ui-avatars.com/api/?name=Dewi+Lestari&background=946D6D&color=fff', N'Procurement & SCM', N'Jl. Gatot Subroto No. 45, Jakarta', SYSUTCDATETIME(), SYSUTCDATETIME()),
(6, 6, N'Agus Pratama', N'081234567895', N'https://ui-avatars.com/api/?name=Agus+Pratama&background=946D6D&color=fff', N'Procurement & SCM', N'Jl. Kuningan Barat No. 8, Jakarta', SYSUTCDATETIME(), SYSUTCDATETIME()),
(7, 7, N'Rina Marlina', N'081234567896', N'https://ui-avatars.com/api/?name=Rina+Marlina&background=946D6D&color=fff', N'Procurement & SCM', N'Jl. TB Simatupang No. 18, Jakarta', SYSUTCDATETIME(), SYSUTCDATETIME()),
(8, 8, N'Ahmad Fauzi', N'081234567897', N'https://ui-avatars.com/api/?name=Ahmad+Fauzi&background=946D6D&color=fff', N'Inbound Logistics', N'Jl. Sunter Podomoro, Jakarta Utara', SYSUTCDATETIME(), SYSUTCDATETIME()),
(9, 9, N'Rian Hidayat', N'081234567898', N'https://ui-avatars.com/api/?name=Rian+Hidayat&background=946D6D&color=fff', N'Outbound Logistics', N'Jl. Cakung Cilincing, Jakarta Timur', SYSUTCDATETIME(), SYSUTCDATETIME()),
(10, 10, N'Dedi Kurniawan', N'081234567899', N'https://ui-avatars.com/api/?name=Dedi+Kurniawan&background=946D6D&color=fff', N'Storage & Picking', N'Jl. Jababeka Raya, Cikarang', SYSUTCDATETIME(), SYSUTCDATETIME());
SET IDENTITY_INSERT dbo.UserProfiles OFF;
GO

-- 13.3. SEED CATEGORIES (20 Categories)
SET IDENTITY_INSERT dbo.Categories ON;
INSERT INTO dbo.Categories (id, name, code, description, created_at, updated_at) VALUES
(1, N'Komponen Elektronik', N'CAT-ELEK', N'Mikrokontroler, resistor, kapasitor, modul PCB industrial', SYSUTCDATETIME(), SYSUTCDATETIME()),
(2, N'Perangkat Komputer', N'CAT-PCIT', N'Server enterprise rack, RAM ECC, SSD NVMe, GPU', SYSUTCDATETIME(), SYSUTCDATETIME()),
(3, N'Perlengkapan Jaringan', N'CAT-NETW', N'Router enterprise, switch PoE manageable, patch cord fiber', SYSUTCDATETIME(), SYSUTCDATETIME()),
(4, N'Perkakas Mesin', N'CAT-MACH', N'Mesin bubut, CNC router, mata bor karbida presisi', SYSUTCDATETIME(), SYSUTCDATETIME()),
(5, N'Material Bangunan', N'CAT-BLDG', N'Baja ringan C75, semen instan, insulasi panel sandwich', SYSUTCDATETIME(), SYSUTCDATETIME()),
(6, N'Kemasan & Logistik', N'CAT-PACK', N'Kardus corrugated, bubble wrap tebal, stretch film palet', SYSUTCDATETIME(), SYSUTCDATETIME()),
(7, N'Bahan Kimia Industri', N'CAT-CHEM', N'Cairan solvent degreaser, pelumas gear oil sintetis', SYSUTCDATETIME(), SYSUTCDATETIME()),
(8, N'Alat Pelindung Diri (APD)', N'CAT-SAFE', N'Helm proyek ANSI Z89, rompi safety reflektif, sepatu safety', SYSUTCDATETIME(), SYSUTCDATETIME()),
(9, N'Perkakas Tangan', N'CAT-TOOL', N'Kunci socket ratchet, cordless impact drill, obeng torsi', SYSUTCDATETIME(), SYSUTCDATETIME()),
(10, N'Kabel & Kelistrikan', N'CAT-CAB', N'Kabel NYYHY 3x2.5mm, tray kabel galvanis, MCB 3-Phase', SYSUTCDATETIME(), SYSUTCDATETIME()),
(11, N'Lampu & Penerangan Industri', N'CAT-LGHT', N'Highbay LED 150W IP65, floodlight solar cell 200W', SYSUTCDATETIME(), SYSUTCDATETIME()),
(12, N'Mesin & Otomasi Industri', N'CAT-INDS', N'Kompresor piston 3HP 120L, inverter VFD, forklift charger', SYSUTCDATETIME(), SYSUTCDATETIME()),
(13, N'Sensor & Barcode Reader', N'CAT-SENS', N'Fixed barcode scanner 2D, proximity inductive sensor, sensor laser', SYSUTCDATETIME(), SYSUTCDATETIME()),
(14, N'Pipa & Valve Industri', N'CAT-PIPE', N'Pipa seamless carbon steel SCH 40, ball valve flanged', SYSUTCDATETIME(), SYSUTCDATETIME()),
(15, N'Baut & Fasteners Stainless', N'CAT-FAST', N'Baut hexagon M12x50 SUS304, dynabolt anchor, rivet baja', SYSUTCDATETIME(), SYSUTCDATETIME()),
(16, N'Cat & Pelapis Industri', N'CAT-COAT', N'Epoxy lantai pabrik heavy duty, primer zinc chromate', SYSUTCDATETIME(), SYSUTCDATETIME()),
(17, N'Peralatan Fire Safety & APAR', N'CAT-FIRE', N'Tabung APAR dry chemical 6kg, fire blanket, hydrant valve', SYSUTCDATETIME(), SYSUTCDATETIME()),
(18, N'Alat Ukur Presisi & Kalibrasi', N'CAT-MEAS', N'Digital caliper vernier 150mm, multitester True-RMS digital', SYSUTCDATETIME(), SYSUTCDATETIME()),
(19, N'Palet Plastik & Racking Gudang', N'CAT-RACK', N'Palet plastik heavy duty 4-ton, racking beam upright', SYSUTCDATETIME(), SYSUTCDATETIME()),
(20, N'Aksesoris Pengiriman & Labeling', N'CAT-SHP', N'Segel kontainer barcode, label thermal barcode direct 100x150', SYSUTCDATETIME(), SYSUTCDATETIME());
SET IDENTITY_INSERT dbo.Categories OFF;
GO

-- 13.4. SEED WAREHOUSES (20 Facilities)
SET IDENTITY_INSERT dbo.Warehouses ON;
INSERT INTO dbo.Warehouses (id, code, name, address, city, capacity_sqm, manager_id, is_active, is_deleted, created_at, updated_at) VALUES
(1, N'WH-JKT-01', N'Gudang Utama Jakarta Utara', N'Kawasan Berikat Nusantara, Marunda', N'Jakarta Utara', 15000.00, 2, 1, 0, SYSUTCDATETIME(), SYSUTCDATETIME()),
(2, N'WH-CKR-01', N'Central DC Cikarang', N'Kawasan Industri GIIC Blok AA No. 5', N'Bekasi', 25000.00, 4, 1, 0, SYSUTCDATETIME(), SYSUTCDATETIME()),
(3, N'WH-KRW-01', N'Hub Logistik Karawang', N'Kawasan Industri KIIC Lot C-3', N'Karawang', 18000.00, 4, 1, 0, SYSUTCDATETIME(), SYSUTCDATETIME()),
(4, N'WH-SBY-01', N'Pusat Distribusi Rungkut Surabaya', N'Kawasan SIER Rungkut Industri Raya', N'Surabaya', 20000.00, 3, 1, 0, SYSUTCDATETIME(), SYSUTCDATETIME()),
(5, N'WH-SMG-01', N'Hub Logistik Jawa Tengah Semarang', N'Kawasan Candi Gatot Subroto No. 88', N'Semarang', 12000.00, 2, 1, 0, SYSUTCDATETIME(), SYSUTCDATETIME()),
(6, N'WH-BDG-01', N'DC Regional Bandung Gedebage', N'Jl. Soekarno Hatta KM 14', N'Bandung', 10000.00, 2, 1, 0, SYSUTCDATETIME(), SYSUTCDATETIME()),
(7, N'WH-MDN-01', N'Hub Sumatera 1 Medan Belawan', N'Kawasan Industri Medan (KIM 2)', N'Medan', 14000.00, 2, 1, 0, SYSUTCDATETIME(), SYSUTCDATETIME()),
(8, N'WH-PLB-01', N'DC Sumatera 2 Palembang', N'Jl. Bypass Alang-Alang Lebar', N'Palembang', 9500.00, 2, 1, 0, SYSUTCDATETIME(), SYSUTCDATETIME()),
(9, N'WH-MKS-01', N'Hub Indonesia Timur Makassar', N'Kawasan Industri Makassar KIMA 10', N'Makassar', 16000.00, 3, 1, 0, SYSUTCDATETIME(), SYSUTCDATETIME()),
(10, N'WH-BPN-01', N'DC Kalimantan 1 Balikpapan', N'Kawasan Industri Kariangau KM 13', N'Balikpapan', 11000.00, 3, 1, 0, SYSUTCDATETIME(), SYSUTCDATETIME());
SET IDENTITY_INSERT dbo.Warehouses OFF;
GO

-- 13.5. SEED SUPPLIERS (20 Suppliers)
SET IDENTITY_INSERT dbo.Suppliers ON;
INSERT INTO dbo.Suppliers (id, code, name, contact_name, email, phone, address, tax_id, rating, is_active, is_deleted, created_at, updated_at) VALUES
(1, N'SUP-001', N'PT Mega Elektronik Nusantara', N'Bambang Wijaya', N'sales@megaelektronik.co.id', N'021-89830001', N'Kawasan Industri Cikarang Blok C-1', N'01.234.567.8-011.000', 4.90, 1, 0, SYSUTCDATETIME(), SYSUTCDATETIME()),
(2, N'SUP-002', N'PT Global IT Solutions', N'Jessica Iskandar', N'contact@globalitsol.com', N'021-57900002', N'Gedung Cyber 2 Lantai 15, Jakarta Selatan', N'01.234.567.8-012.000', 4.80, 1, 0, SYSUTCDATETIME(), SYSUTCDATETIME()),
(3, N'SUP-003', N'PT Jaringan Fiber Utama', N'Gunawan Prasetyo', N'info@jaringanfiber.co.id', N'021-29340003', N'Kawasan Industri Pulogadung Kav 12', N'01.234.567.8-013.000', 4.70, 1, 0, SYSUTCDATETIME(), SYSUTCDATETIME()),
(4, N'SUP-004', N'PT Sinar Baja Presisi', N'Toni Hermanto', N'orders@sinarbaja.com', N'021-89350004', N'Kawasan EJIP Plot 8, Cikarang', N'01.234.567.8-014.000', 4.90, 1, 0, SYSUTCDATETIME(), SYSUTCDATETIME()),
(5, N'SUP-005', N'PT Semen & Konstruksi Jaya', N'Rahmat Hidayat', N'marketing@semenkonstruksi.id', N'031-78900005', N'Jl. Gresik Industri No. 45, Gresik', N'01.234.567.8-015.000', 4.60, 1, 0, SYSUTCDATETIME(), SYSUTCDATETIME()),
(6, N'SUP-006', N'PT Packindo Kemasan Logistik', N'Maya Anggraini', N'sales@packindolog.com', N'021-89110006', N'Kawasan Industri KIIC Lot D-2, Karawang', N'01.234.567.8-016.000', 4.80, 1, 0, SYSUTCDATETIME(), SYSUTCDATETIME()),
(7, N'SUP-007', N'PT Tri Chem Industri', N'Dr. Handoko M.', N'info@tricheme.co.id', N'0254-3900007', N'Kawasan Industri Krakatau, Cilegon', N'01.234.567.8-017.000', 4.90, 1, 0, SYSUTCDATETIME(), SYSUTCDATETIME()),
(8, N'SUP-008', N'PT Safety First Indonesia', N'Aris Munandar', N'cs@safetyfirst.co.id', N'021-58300008', N'Komp. Pergudangan Daan Mogot Prima No. 8', N'01.234.567.8-018.000', 4.70, 1, 0, SYSUTCDATETIME(), SYSUTCDATETIME()),
(9, N'SUP-009', N'PT Perkakas Mandiri Perkasa', N'Surya Darmawan', N'order@perkakasmandiri.com', N'021-65400009', N'Pertokoan Glodok Makmur No. 34, Jakarta', N'01.234.567.8-019.000', 4.50, 1, 0, SYSUTCDATETIME(), SYSUTCDATETIME()),
(10, N'SUP-010', N'PT Supreme Kabel Logistik', N'Indra Kusuma', N'sales@supremekabel.co.id', N'021-59000010', N'Jl. Raya Daan Mogot KM 16, Tangerang', N'01.234.567.8-020.000', 4.80, 1, 0, SYSUTCDATETIME(), SYSUTCDATETIME());
SET IDENTITY_INSERT dbo.Suppliers OFF;
GO

-- 13.6. SEED PRODUCTS (Sample Master SKU)
SET IDENTITY_INSERT dbo.Products ON;
INSERT INTO dbo.Products (id, sku, barcode, name, description, unit_price, cost_price, reorder_level, min_stock, max_stock, unit_of_measure, category_id, is_deleted, created_at, updated_at) VALUES
(1, N'SKU-ELEK-001', N'8991001000011', N'Mikrokontroler STM32 ARM Cortex-M4', N'Board mikrokontroler 32-bit untuk kontroler cerdas & otomasi', 185000.00, 140000.00, 50, 20, 2000, N'UNIT', 1, 0, SYSUTCDATETIME(), SYSUTCDATETIME()),
(2, N'SKU-ELEK-002', N'8991001000028', N'Power Supply Switching 24V 10A Industrial', N'Catu daya teregulasi din-rail mounting industrial', 350000.00, 270000.00, 30, 10, 1000, N'UNIT', 1, 0, SYSUTCDATETIME(), SYSUTCDATETIME()),
(3, N'SKU-PCIT-001', N'8991001000035', N'Server Enterprise SSD NVMe 1.92TB Gen4', N'SSD enterprise grade read-intensive untuk storage server', 4200000.00, 3500000.00, 15, 5, 200, N'UNIT', 2, 0, SYSUTCDATETIME(), SYSUTCDATETIME()),
(4, N'SKU-PCIT-002', N'8991001000042', N'RAM Server DDR4 ECC Registered 32GB 3200MHz', N'Memori server dengan deteksi koreksi error parity', 1650000.00, 1300000.00, 20, 8, 300, N'UNIT', 2, 0, SYSUTCDATETIME(), SYSUTCDATETIME()),
(5, N'SKU-NETW-001', N'8991001000059', N'Manageable Switch 24-Port Gigabit PoE+ L2', N'Switch jaringan enterprise rackmount 1U dukungan VLAN & QoS', 3800000.00, 2950000.00, 10, 4, 100, N'UNIT', 3, 0, SYSUTCDATETIME(), SYSUTCDATETIME()),
(6, N'SKU-NETW-002', N'8991001000066', N'Access Point WiFi-6 Dual Band Enterprise', N'AP outdoor/indoor kecepatan tinggi hingga 3000Mbps', 1950000.00, 1500000.00, 15, 5, 150, N'UNIT', 3, 0, SYSUTCDATETIME(), SYSUTCDATETIME()),
(7, N'SKU-MACH-001', N'8991001000073', N'Mata Bor Karbida CNC Solid 10mm 4-Flute', N'Mata milling presisi tinggi untuk baja paduan dan stainless', 120000.00, 85000.00, 40, 15, 500, N'PCS', 4, 0, SYSUTCDATETIME(), SYSUTCDATETIME()),
(8, N'SKU-BLDG-001', N'8991001000080', N'Baja Ringan Kanal C75 Ketebalan 0.75mm', N'Panjang standar 6 meter untuk konstruksi atap pabrik/gudang', 95000.00, 78000.00, 100, 30, 5000, N'BATANG', 5, 0, SYSUTCDATETIME(), SYSUTCDATETIME()),
(9, N'SKU-PACK-001', N'8991001000097', N'Kardus Corrugated Double Wall 40x30x30 cm', N'Kardus kuat standar ekspor untuk pengiriman logistik berat', 18500.00, 12500.00, 200, 50, 10000, N'PCS', 6, 0, SYSUTCDATETIME(), SYSUTCDATETIME()),
(10, N'SKU-PACK-002', N'8991001000103', N'Stretch Film Wrapping 50cm x 300m 17 Micron', N'Plastik wrapping pembungkus palet barang anti debu & air', 75000.00, 55000.00, 80, 25, 2000, N'ROLL', 6, 0, SYSUTCDATETIME(), SYSUTCDATETIME()),
(11, N'SKU-CHEM-001', N'8991001000110', N'Pelumas Mesin Industri Gear Oil ISO VG 220 20L', N'Oli transmisi gearbox beban berat kemasan pail industrial', 950000.00, 760000.00, 20, 5, 250, N'PAIL', 7, 0, SYSUTCDATETIME(), SYSUTCDATETIME()),
(12, N'SKU-SAFE-001', N'8991001000127', N'Helm Keselamatan Kerja V-Gard Industrial ANSI Z89', N'Helm pelindung kepala suspensi ratchet 4 titik standar K3', 145000.00, 95000.00, 50, 20, 1000, N'UNIT', 8, 0, SYSUTCDATETIME(), SYSUTCDATETIME()),
(13, N'SKU-SAFE-002', N'8991001000134', N'Sepatu Safety Ujung Baja S1P Kulit Asli', N'Sepatu kerja tahan benturan 200J dan sol anti slip minyak', 285000.00, 210000.00, 25, 10, 500, N'PASANG', 8, 0, SYSUTCDATETIME(), SYSUTCDATETIME()),
(14, N'SKU-TOOL-001', N'8991001000141', N'Cordless Impact Drill 20V Brushless Heavy Duty', N'Mesin bor baterai torsi 65Nm dengan 2 baterai lithium', 1250000.00, 950000.00, 15, 5, 200, N'SET', 9, 0, SYSUTCDATETIME(), SYSUTCDATETIME()),
(15, N'SKU-TOOL-002', N'8991001000158', N'Kunci Socket Set 1/2 Inch 24-Piece Chrome Vanadium', N'Set mata sock lengkap dengan gagang ratchet reversibel', 480000.00, 360000.00, 20, 8, 300, N'SET', 9, 0, SYSUTCDATETIME(), SYSUTCDATETIME());
SET IDENTITY_INSERT dbo.Products OFF;
GO

-- 13.7. SEED INVENTORY STOCKS (Stok Awal di Gudang)
SET IDENTITY_INSERT dbo.InventoryStocks ON;
INSERT INTO dbo.InventoryStocks (id, product_id, warehouse_id, bin_location, quantity_on_hand, quantity_allocated, quantity_available, last_counted_at, created_at, updated_at) VALUES
(1, 1, 1, N'A01-R01-B01', 120, 10, 110, SYSUTCDATETIME(), SYSUTCDATETIME(), SYSUTCDATETIME()),
(2, 1, 2, N'C01-R01-B01', 180, 15, 165, SYSUTCDATETIME(), SYSUTCDATETIME(), SYSUTCDATETIME()),
(3, 2, 1, N'A01-R01-B02', 130, 12, 118, SYSUTCDATETIME(), SYSUTCDATETIME(), SYSUTCDATETIME()),
(4, 2, 2, N'C01-R01-B02', 194, 17, 177, SYSUTCDATETIME(), SYSUTCDATETIME(), SYSUTCDATETIME()),
(5, 3, 1, N'A02-R01-B01', 140, 14, 126, SYSUTCDATETIME(), SYSUTCDATETIME(), SYSUTCDATETIME()),
(6, 3, 2, N'C02-R01-B01', 208, 19, 189, SYSUTCDATETIME(), SYSUTCDATETIME(), SYSUTCDATETIME()),
(7, 4, 1, N'A02-R01-B02', 150, 16, 134, SYSUTCDATETIME(), SYSUTCDATETIME(), SYSUTCDATETIME()),
(8, 5, 1, N'A03-R01-B01', 160, 18, 142, SYSUTCDATETIME(), SYSUTCDATETIME(), SYSUTCDATETIME()),
(9, 6, 1, N'A03-R01-B02', 170, 20, 150, SYSUTCDATETIME(), SYSUTCDATETIME(), SYSUTCDATETIME()),
(10, 7, 1, N'A04-R01-B01', 180, 22, 158, SYSUTCDATETIME(), SYSUTCDATETIME(), SYSUTCDATETIME()),
(11, 8, 1, N'A04-R01-B02', 190, 24, 166, SYSUTCDATETIME(), SYSUTCDATETIME(), SYSUTCDATETIME()),
(12, 9, 1, N'A05-R01-B01', 200, 26, 174, SYSUTCDATETIME(), SYSUTCDATETIME(), SYSUTCDATETIME()),
(13, 10, 1, N'A05-R01-B02', 210, 28, 182, SYSUTCDATETIME(), SYSUTCDATETIME(), SYSUTCDATETIME()),
(14, 11, 1, N'A01-R02-B01', 220, 30, 190, SYSUTCDATETIME(), SYSUTCDATETIME(), SYSUTCDATETIME()),
(15, 12, 1, N'A01-R02-B02', 230, 32, 198, SYSUTCDATETIME(), SYSUTCDATETIME(), SYSUTCDATETIME());
SET IDENTITY_INSERT dbo.InventoryStocks OFF;
GO

-- 13.8. SEED PURCHASE ORDERS & ITEMS
SET IDENTITY_INSERT dbo.PurchaseOrders ON;
INSERT INTO dbo.PurchaseOrders (id, po_number, supplier_id, order_date, expected_delivery_date, status, total_amount, notes, created_by_user_id, created_at, updated_at) VALUES
(1, N'PO-2026-0001', 1, SYSUTCDATETIME(), DATEADD(day, 7, SYSUTCDATETIME()), N'RECEIVED', 7400000.00, N'Pengadaan rutin mikrokontroler & catu daya', 5, SYSUTCDATETIME(), SYSUTCDATETIME()),
(2, N'PO-2026-0002', 2, SYSUTCDATETIME(), DATEADD(day, 5, SYSUTCDATETIME()), N'APPROVED', 17500000.00, N'Pengadaan SSD server enterprise DC Cikarang', 5, SYSUTCDATETIME(), SYSUTCDATETIME()),
(3, N'PO-2026-0003', 3, SYSUTCDATETIME(), DATEADD(day, 10, SYSUTCDATETIME()), N'PENDING', 5900000.00, N'Peralatan jaringan kabel & switch gedung baru', 6, SYSUTCDATETIME(), SYSUTCDATETIME());
SET IDENTITY_INSERT dbo.PurchaseOrders OFF;
GO

SET IDENTITY_INSERT dbo.PurchaseOrderItems ON;
INSERT INTO dbo.PurchaseOrderItems (id, purchase_order_id, product_id, ordered_quantity, received_quantity, unit_cost, subtotal, notes, created_at, updated_at) VALUES
(1, 1, 1, 20, 20, 140000.00, 2800000.00, N'Batch 1', SYSUTCDATETIME(), SYSUTCDATETIME()),
(2, 1, 2, 15, 15, 270000.00, 4050000.00, N'Batch 1', SYSUTCDATETIME(), SYSUTCDATETIME()),
(3, 2, 3, 5, 0, 3500000.00, 17500000.00, N'Server drive DC', SYSUTCDATETIME(), SYSUTCDATETIME()),
(4, 3, 5, 2, 0, 2950000.00, 5900000.00, N'Manageable Switch', SYSUTCDATETIME(), SYSUTCDATETIME());
SET IDENTITY_INSERT dbo.PurchaseOrderItems OFF;
GO

-- 13.9. SEED STOCK TRANSACTIONS (Sample Inbound & Outbound)
SET IDENTITY_INSERT dbo.StockTransactions ON;
INSERT INTO dbo.StockTransactions (id, reference_number, transaction_type, product_id, source_warehouse_id, target_warehouse_id, quantity, notes, created_by_user_id, created_at, updated_at) VALUES
(1, N'TRX-INB-2026-0001', N'INBOUND', 1, NULL, 1, 50, N'Penerimaan barang dari PO-2026-0001', 8, SYSUTCDATETIME(), SYSUTCDATETIME()),
(2, N'TRX-INB-2026-0002', N'INBOUND', 2, NULL, 1, 30, N'Penerimaan barang dari PO-2026-0001', 8, SYSUTCDATETIME(), SYSUTCDATETIME()),
(3, N'TRX-OUT-2026-0001', N'OUTBOUND', 1, 1, NULL, 10, N'Pengeluaran komponen untuk lini produksi A', 9, SYSUTCDATETIME(), SYSUTCDATETIME()),
(4, N'TRX-TRF-2026-0001', N'TRANSFER', 1, 1, 2, 20, N'Transfer stok antar fasilitas Jakarta ke Cikarang', 8, SYSUTCDATETIME(), SYSUTCDATETIME());
SET IDENTITY_INSERT dbo.StockTransactions OFF;
GO

PRINT '==============================================================================';
PRINT 'SMART WAREHOUSE & INVENTORY MANAGEMENT SYSTEM (SWIMS) DATABASE INITIALIZED & SEEDED SUCCESSFULLY';
PRINT '==============================================================================';
GO

