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

PRINT '==============================================================================';
PRINT 'SMART WAREHOUSE & INVENTORY MANAGEMENT SYSTEM (SWIMS) DATABASE CREATED SUCCESSFULLY';
PRINT '==============================================================================';
GO
