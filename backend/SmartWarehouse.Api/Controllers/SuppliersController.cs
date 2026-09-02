using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmartWarehouse.Api.Data;
using SmartWarehouse.Api.DTOs.Common;
using SmartWarehouse.Api.DTOs.Suppliers;
using SmartWarehouse.Api.Models.Entities;

namespace SmartWarehouse.Api.Controllers;

[Authorize]
public class SuppliersController : BaseApiController
{
    private readonly AppDbContext _context;

    public SuppliersController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<PagedResponse<SupplierDto>>> GetSuppliers([FromQuery] QueryParameters query)
    {
        var queryable = _context.Suppliers
            .AsNoTracking()
            .Include(s => s.PurchaseOrders)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var s = query.Search.Trim().ToLower();
            queryable = queryable.Where(sup =>
                sup.Name.ToLower().Contains(s) ||
                sup.Code.ToLower().Contains(s) ||
                sup.ContactName.ToLower().Contains(s) ||
                sup.Email.ToLower().Contains(s) ||
                sup.Phone.ToLower().Contains(s));
        }

        if (!string.IsNullOrWhiteSpace(query.Status))
        {
            var isActive = query.Status.Equals("active", StringComparison.OrdinalIgnoreCase);
            queryable = queryable.Where(s => s.IsActive == isActive);
        }

        var isAsc = query.SortDir?.ToLower() == "asc";
        queryable = query.SortBy?.ToLower() switch
        {
            "name" => isAsc ? queryable.OrderBy(s => s.Name) : queryable.OrderByDescending(s => s.Name),
            "code" => isAsc ? queryable.OrderBy(s => s.Code) : queryable.OrderByDescending(s => s.Code),
            "rating" => isAsc ? queryable.OrderBy(s => s.Rating) : queryable.OrderByDescending(s => s.Rating),
            _ => isAsc ? queryable.OrderBy(s => s.CreatedAt) : queryable.OrderByDescending(s => s.CreatedAt)
        };

        var totalCount = await queryable.CountAsync();

        var items = await queryable
            .Skip((query.Page - 1) * query.Limit)
            .Take(query.Limit)
            .Select(s => new SupplierDto
            {
                Id = s.Id,
                Code = s.Code,
                Name = s.Name,
                ContactName = s.ContactName,
                Email = s.Email,
                Phone = s.Phone,
                Address = s.Address,
                TaxId = s.TaxId,
                Rating = s.Rating,
                IsActive = s.IsActive,
                TotalPurchaseOrders = s.PurchaseOrders.Count,
                CreatedAt = s.CreatedAt,
                UpdatedAt = s.UpdatedAt
            })
            .ToListAsync();

        return Ok(PagedResponse<SupplierDto>.Create(items, totalCount, query.Page, query.Limit, "Daftar pemasok berhasil dimuat."));
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<ApiResponse<SupplierDto>>> GetSupplierById(int id)
    {
        var s = await _context.Suppliers
            .AsNoTracking()
            .Include(sup => sup.PurchaseOrders)
            .FirstOrDefaultAsync(sup => sup.Id == id);

        if (s == null)
        {
            return NotFound(ApiResponse<SupplierDto>.Fail($"Pemasok dengan ID {id} tidak ditemukan.", 404));
        }

        var dto = new SupplierDto
        {
            Id = s.Id,
            Code = s.Code,
            Name = s.Name,
            ContactName = s.ContactName,
            Email = s.Email,
            Phone = s.Phone,
            Address = s.Address,
            TaxId = s.TaxId,
            Rating = s.Rating,
            IsActive = s.IsActive,
            TotalPurchaseOrders = s.PurchaseOrders.Count,
            CreatedAt = s.CreatedAt,
            UpdatedAt = s.UpdatedAt
        };

        return Ok(ApiResponse<SupplierDto>.Ok(dto, "Detail pemasok berhasil dimuat."));
    }

    [Authorize(Roles = "ROLE_ADMIN,ROLE_PURCHASING,ROLE_MANAGER")]
    [HttpPost]
    public async Task<ActionResult<ApiResponse<SupplierDto>>> CreateSupplier([FromBody] CreateSupplierDto dto)
    {
        if (await _context.Suppliers.AnyAsync(s => s.Code.ToLower() == dto.Code.ToLower()))
        {
            return BadRequest(ApiResponse<SupplierDto>.Fail($"Kode pemasok '{dto.Code}' sudah digunakan.", 400));
        }

        if (await _context.Suppliers.AnyAsync(s => s.Email.ToLower() == dto.Email.ToLower()))
        {
            return BadRequest(ApiResponse<SupplierDto>.Fail($"Email pemasok '{dto.Email}' sudah digunakan.", 400));
        }

        var supplier = new Supplier
        {
            Code = dto.Code.Trim().ToUpper(),
            Name = dto.Name.Trim(),
            ContactName = dto.ContactName.Trim(),
            Email = dto.Email.Trim().ToLower(),
            Phone = dto.Phone.Trim(),
            Address = dto.Address.Trim(),
            TaxId = dto.TaxId?.Trim(),
            Rating = dto.Rating,
            IsActive = dto.IsActive
        };

        await _context.Suppliers.AddAsync(supplier);
        await _context.SaveChangesAsync();

        var result = new SupplierDto
        {
            Id = supplier.Id,
            Code = supplier.Code,
            Name = supplier.Name,
            ContactName = supplier.ContactName,
            Email = supplier.Email,
            Phone = supplier.Phone,
            Address = supplier.Address,
            TaxId = supplier.TaxId,
            Rating = supplier.Rating,
            IsActive = supplier.IsActive,
            TotalPurchaseOrders = 0,
            CreatedAt = supplier.CreatedAt,
            UpdatedAt = supplier.UpdatedAt
        };

        return StatusCode(201, ApiResponse<SupplierDto>.Created(result, "Pemasok baru berhasil ditambahkan."));
    }

    [Authorize(Roles = "ROLE_ADMIN,ROLE_PURCHASING,ROLE_MANAGER")]
    [HttpPut("{id:int}")]
    public async Task<ActionResult<ApiResponse<SupplierDto>>> UpdateSupplier(int id, [FromBody] UpdateSupplierDto dto)
    {
        var supplier = await _context.Suppliers.FindAsync(id);
        if (supplier == null)
        {
            return NotFound(ApiResponse<SupplierDto>.Fail($"Pemasok dengan ID {id} tidak ditemukan.", 404));
        }

        if (await _context.Suppliers.AnyAsync(s => s.Id != id && s.Code.ToLower() == dto.Code.ToLower()))
        {
            return BadRequest(ApiResponse<SupplierDto>.Fail($"Kode pemasok '{dto.Code}' sudah digunakan oleh pemasok lain.", 400));
        }

        if (await _context.Suppliers.AnyAsync(s => s.Id != id && s.Email.ToLower() == dto.Email.ToLower()))
        {
            return BadRequest(ApiResponse<SupplierDto>.Fail($"Email pemasok '{dto.Email}' sudah digunakan oleh pemasok lain.", 400));
        }

        supplier.Code = dto.Code.Trim().ToUpper();
        supplier.Name = dto.Name.Trim();
        supplier.ContactName = dto.ContactName.Trim();
        supplier.Email = dto.Email.Trim().ToLower();
        supplier.Phone = dto.Phone.Trim();
        supplier.Address = dto.Address.Trim();
        supplier.TaxId = dto.TaxId?.Trim();
        supplier.Rating = dto.Rating;
        supplier.IsActive = dto.IsActive;

        await _context.SaveChangesAsync();

        var result = new SupplierDto
        {
            Id = supplier.Id,
            Code = supplier.Code,
            Name = supplier.Name,
            ContactName = supplier.ContactName,
            Email = supplier.Email,
            Phone = supplier.Phone,
            Address = supplier.Address,
            TaxId = supplier.TaxId,
            Rating = supplier.Rating,
            IsActive = supplier.IsActive,
            CreatedAt = supplier.CreatedAt,
            UpdatedAt = supplier.UpdatedAt
        };

        return Ok(ApiResponse<SupplierDto>.Ok(result, "Data pemasok berhasil diperbarui."));
    }

    [Authorize(Roles = "ROLE_ADMIN,ROLE_PURCHASING,ROLE_MANAGER")]
    [HttpDelete("{id:int}")]
    public async Task<ActionResult<ApiResponse<object>>> DeleteSupplier(int id)
    {
        var supplier = await _context.Suppliers.FindAsync(id);
        if (supplier == null)
        {
            return NotFound(ApiResponse<object>.Fail($"Pemasok dengan ID {id} tidak ditemukan.", 404));
        }

        // Soft Delete
        supplier.IsDeleted = true;
        supplier.DeletedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return Ok(ApiResponse<object>.Ok(new { id, isDeleted = true }, "Pemasok berhasil dihapus (Soft Delete)."));
    }
}
