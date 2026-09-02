using FluentValidation;
using SmartWarehouse.Api.DTOs.Auth;
using SmartWarehouse.Api.DTOs.Categories;
using SmartWarehouse.Api.DTOs.Inventory;
using SmartWarehouse.Api.DTOs.Products;
using SmartWarehouse.Api.DTOs.PurchaseOrders;
using SmartWarehouse.Api.DTOs.Suppliers;
using SmartWarehouse.Api.DTOs.Transactions;
using SmartWarehouse.Api.DTOs.Users;
using SmartWarehouse.Api.DTOs.Warehouses;

namespace SmartWarehouse.Api.Validators;

public class LoginRequestValidator : AbstractValidator<LoginRequestDto>
{
    public LoginRequestValidator()
    {
        RuleFor(x => x.Email).NotEmpty().WithMessage("Email wajib diisi.").EmailAddress().WithMessage("Format email tidak valid.");
        RuleFor(x => x.Password).NotEmpty().WithMessage("Password wajib diisi.").MinimumLength(6).WithMessage("Password minimal 6 karakter.");
    }
}

public class RegisterRequestValidator : AbstractValidator<RegisterRequestDto>
{
    public RegisterRequestValidator()
    {
        RuleFor(x => x.FullName).NotEmpty().WithMessage("Nama lengkap wajib diisi.").MaximumLength(100);
        RuleFor(x => x.Email).NotEmpty().WithMessage("Email wajib diisi.").EmailAddress().WithMessage("Format email tidak valid.");
        RuleFor(x => x.Password).NotEmpty().WithMessage("Password wajib diisi.").MinimumLength(6).WithMessage("Password minimal 6 karakter.");
        RuleFor(x => x.ConfirmPassword).Equal(x => x.Password).WithMessage("Konfirmasi password tidak cocok.");
        RuleFor(x => x.RoleId).GreaterThan(0).WithMessage("Role ID wajib dipilih.");
    }
}

public class ResetPasswordValidator : AbstractValidator<ResetPasswordDto>
{
    public ResetPasswordValidator()
    {
        RuleFor(x => x.Email).NotEmpty().EmailAddress();
        RuleFor(x => x.Token).NotEmpty().WithMessage("Token reset password wajib diisi.");
        RuleFor(x => x.NewPassword).NotEmpty().MinimumLength(6).WithMessage("Password baru minimal 6 karakter.");
        RuleFor(x => x.ConfirmNewPassword).Equal(x => x.NewPassword).WithMessage("Konfirmasi password baru tidak cocok.");
    }
}

public class CreateProductValidator : AbstractValidator<CreateProductDto>
{
    public CreateProductValidator()
    {
        RuleFor(x => x.Sku).NotEmpty().WithMessage("SKU barang wajib diisi.").MaximumLength(50);
        RuleFor(x => x.Barcode).NotEmpty().WithMessage("Barcode barang wajib diisi.").MaximumLength(50);
        RuleFor(x => x.Name).NotEmpty().WithMessage("Nama barang wajib diisi.").MaximumLength(150);
        RuleFor(x => x.UnitPrice).GreaterThan(0).WithMessage("Harga jual unit harus lebih besar dari 0.");
        RuleFor(x => x.CostPrice).GreaterThanOrEqualTo(0).WithMessage("Harga modal unit tidak boleh negatif.");
        RuleFor(x => x.ReorderLevel).GreaterThanOrEqualTo(0).WithMessage("Reorder level minimal 0.");
        RuleFor(x => x.MinStock).GreaterThanOrEqualTo(0).WithMessage("Batas minimum stok minimal 0.");
        RuleFor(x => x.MaxStock).GreaterThan(x => x.MinStock).WithMessage("Batas maksimum stok harus lebih besar dari batas minimum stok.");
        RuleFor(x => x.CategoryId).GreaterThan(0).WithMessage("Kategori wajib dipilih.");
    }
}

public class UpdateProductValidator : AbstractValidator<UpdateProductDto>
{
    public UpdateProductValidator()
    {
        RuleFor(x => x.Sku).NotEmpty().WithMessage("SKU barang wajib diisi.").MaximumLength(50);
        RuleFor(x => x.Barcode).NotEmpty().WithMessage("Barcode barang wajib diisi.").MaximumLength(50);
        RuleFor(x => x.Name).NotEmpty().WithMessage("Nama barang wajib diisi.").MaximumLength(150);
        RuleFor(x => x.UnitPrice).GreaterThan(0).WithMessage("Harga jual unit harus lebih besar dari 0.");
        RuleFor(x => x.CostPrice).GreaterThanOrEqualTo(0).WithMessage("Harga modal unit tidak boleh negatif.");
        RuleFor(x => x.ReorderLevel).GreaterThanOrEqualTo(0).WithMessage("Reorder level minimal 0.");
        RuleFor(x => x.MinStock).GreaterThanOrEqualTo(0).WithMessage("Batas minimum stok minimal 0.");
        RuleFor(x => x.MaxStock).GreaterThan(x => x.MinStock).WithMessage("Batas maksimum stok harus lebih besar dari batas minimum stok.");
        RuleFor(x => x.CategoryId).GreaterThan(0).WithMessage("Kategori wajib dipilih.");
    }
}

public class CreateWarehouseValidator : AbstractValidator<CreateWarehouseDto>
{
    public CreateWarehouseValidator()
    {
        RuleFor(x => x.Code).NotEmpty().WithMessage("Kode gudang wajib diisi.").MaximumLength(50);
        RuleFor(x => x.Name).NotEmpty().WithMessage("Nama gudang wajib diisi.").MaximumLength(100);
        RuleFor(x => x.Address).NotEmpty().WithMessage("Alamat gudang wajib diisi.");
        RuleFor(x => x.City).NotEmpty().WithMessage("Kota gudang wajib diisi.");
        RuleFor(x => x.CapacitySqm).GreaterThan(0).WithMessage("Kapasitas gudang harus lebih dari 0 m².");
    }
}

public class UpdateWarehouseValidator : AbstractValidator<UpdateWarehouseDto>
{
    public UpdateWarehouseValidator()
    {
        RuleFor(x => x.Code).NotEmpty().WithMessage("Kode gudang wajib diisi.").MaximumLength(50);
        RuleFor(x => x.Name).NotEmpty().WithMessage("Nama gudang wajib diisi.").MaximumLength(100);
        RuleFor(x => x.Address).NotEmpty().WithMessage("Alamat gudang wajib diisi.");
        RuleFor(x => x.City).NotEmpty().WithMessage("Kota gudang wajib diisi.");
        RuleFor(x => x.CapacitySqm).GreaterThan(0).WithMessage("Kapasitas gudang harus lebih dari 0 m².");
    }
}

public class CreateSupplierValidator : AbstractValidator<CreateSupplierDto>
{
    public CreateSupplierValidator()
    {
        RuleFor(x => x.Code).NotEmpty().WithMessage("Kode pemasok wajib diisi.").MaximumLength(50);
        RuleFor(x => x.Name).NotEmpty().WithMessage("Nama pemasok wajib diisi.").MaximumLength(150);
        RuleFor(x => x.ContactName).NotEmpty().WithMessage("Nama kontak PIC wajib diisi.");
        RuleFor(x => x.Email).NotEmpty().EmailAddress().WithMessage("Format email pemasok tidak valid.");
        RuleFor(x => x.Phone).NotEmpty().WithMessage("Nomor telepon pemasok wajib diisi.");
        RuleFor(x => x.Rating).InclusiveBetween(1.0m, 5.0m).WithMessage("Rating harus antara 1.00 dan 5.00.");
    }
}

public class UpdateSupplierValidator : AbstractValidator<UpdateSupplierDto>
{
    public UpdateSupplierValidator()
    {
        RuleFor(x => x.Code).NotEmpty().WithMessage("Kode pemasok wajib diisi.").MaximumLength(50);
        RuleFor(x => x.Name).NotEmpty().WithMessage("Nama pemasok wajib diisi.").MaximumLength(150);
        RuleFor(x => x.ContactName).NotEmpty().WithMessage("Nama kontak PIC wajib diisi.");
        RuleFor(x => x.Email).NotEmpty().EmailAddress().WithMessage("Format email pemasok tidak valid.");
        RuleFor(x => x.Phone).NotEmpty().WithMessage("Nomor telepon pemasok wajib diisi.");
        RuleFor(x => x.Rating).InclusiveBetween(1.0m, 5.0m).WithMessage("Rating harus antara 1.00 dan 5.00.");
    }
}

public class CreateCategoryValidator : AbstractValidator<CreateCategoryDto>
{
    public CreateCategoryValidator()
    {
        RuleFor(x => x.Name).NotEmpty().WithMessage("Nama kategori wajib diisi.").MaximumLength(100);
        RuleFor(x => x.Code).NotEmpty().WithMessage("Kode kategori wajib diisi.").MaximumLength(50);
    }
}

public class UpdateCategoryValidator : AbstractValidator<UpdateCategoryDto>
{
    public UpdateCategoryValidator()
    {
        RuleFor(x => x.Name).NotEmpty().WithMessage("Nama kategori wajib diisi.").MaximumLength(100);
        RuleFor(x => x.Code).NotEmpty().WithMessage("Kode kategori wajib diisi.").MaximumLength(50);
    }
}

public class CreateUserValidator : AbstractValidator<CreateUserDto>
{
    public CreateUserValidator()
    {
        RuleFor(x => x.Email).NotEmpty().WithMessage("Email wajib diisi.").EmailAddress().WithMessage("Format email tidak valid.");
        RuleFor(x => x.Password).NotEmpty().WithMessage("Password wajib diisi.").MinimumLength(6).WithMessage("Password minimal 6 karakter.");
        RuleFor(x => x.FullName).NotEmpty().WithMessage("Nama lengkap wajib diisi.").MaximumLength(100);
        RuleFor(x => x.RoleId).GreaterThan(0).WithMessage("Role ID wajib dipilih.");
    }
}

public class UpdateUserValidator : AbstractValidator<UpdateUserDto>
{
    public UpdateUserValidator()
    {
        RuleFor(x => x.FullName).MaximumLength(100).When(x => !string.IsNullOrEmpty(x.FullName));
        RuleFor(x => x.PhoneNumber).MaximumLength(20).When(x => !string.IsNullOrEmpty(x.PhoneNumber));
    }
}

public class ChangePasswordValidator : AbstractValidator<ChangePasswordDto>
{
    public ChangePasswordValidator()
    {
        RuleFor(x => x.CurrentPassword).NotEmpty().WithMessage("Password saat ini wajib diisi.");
        RuleFor(x => x.NewPassword).NotEmpty().WithMessage("Password baru wajib diisi.").MinimumLength(6).WithMessage("Password baru minimal 6 karakter.");
        RuleFor(x => x.ConfirmNewPassword).Equal(x => x.NewPassword).WithMessage("Konfirmasi password baru tidak cocok.");
    }
}

public class CreateTransactionValidator : AbstractValidator<CreateTransactionDto>
{
    public CreateTransactionValidator()
    {
        RuleFor(x => x.ProductId).GreaterThan(0).WithMessage("Produk wajib dipilih.");
        RuleFor(x => x.WarehouseId).GreaterThan(0).WithMessage("Gudang wajib dipilih.");
        RuleFor(x => x.Quantity).GreaterThan(0).WithMessage("Jumlah unit harus lebih besar dari 0.");
        RuleFor(x => x.BinLocation).NotEmpty().WithMessage("Lokasi Bin wajib diisi.").MaximumLength(50);
        RuleFor(x => x.TransactionType).Must(t => t == "INBOUND" || t == "OUTBOUND")
            .WithMessage("Tipe transaksi harus INBOUND atau OUTBOUND.");
    }
}

public class StockAdjustmentValidator : AbstractValidator<StockAdjustmentDto>
{
    public StockAdjustmentValidator()
    {
        RuleFor(x => x.ProductId).GreaterThan(0).WithMessage("Produk wajib dipilih.");
        RuleFor(x => x.WarehouseId).GreaterThan(0).WithMessage("Gudang wajib dipilih.");
        RuleFor(x => x.NewQuantityOnHand).GreaterThanOrEqualTo(0).WithMessage("Jumlah stok baru minimal 0.");
        RuleFor(x => x.BinLocation).NotEmpty().WithMessage("Lokasi Bin wajib diisi.");
        RuleFor(x => x.Reason).NotEmpty().WithMessage("Alasan penyesuaian stok wajib diisi.");
    }
}

public class StockTransferValidator : AbstractValidator<StockTransferDto>
{
    public StockTransferValidator()
    {
        RuleFor(x => x.ProductId).GreaterThan(0).WithMessage("Produk wajib dipilih.");
        RuleFor(x => x.SourceWarehouseId).GreaterThan(0).WithMessage("Gudang asal wajib dipilih.");
        RuleFor(x => x.TargetWarehouseId).GreaterThan(0).WithMessage("Gudang tujuan wajib dipilih.")
            .NotEqual(x => x.SourceWarehouseId).WithMessage("Gudang tujuan tidak boleh sama dengan gudang asal.");
        RuleFor(x => x.Quantity).GreaterThan(0).WithMessage("Jumlah unit yang ditransfer harus lebih dari 0.");
    }
}

public class CreatePurchaseOrderValidator : AbstractValidator<CreatePurchaseOrderDto>
{
    public CreatePurchaseOrderValidator()
    {
        RuleFor(x => x.SupplierId).GreaterThan(0).WithMessage("Pemasok wajib dipilih.");
        RuleFor(x => x.Items).NotEmpty().WithMessage("Minimal terdapat 1 item barang dalam Purchase Order.");
        RuleForEach(x => x.Items).ChildRules(item =>
        {
            item.RuleFor(i => i.ProductId).GreaterThan(0).WithMessage("Produk wajib dipilih.");
            item.RuleFor(i => i.OrderedQuantity).GreaterThan(0).WithMessage("Jumlah pemesanan harus lebih dari 0.");
            item.RuleFor(i => i.UnitCost).GreaterThan(0).WithMessage("Harga modal harus lebih dari 0.");
        });
    }
}
