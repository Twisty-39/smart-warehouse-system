using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmartWarehouse.Api.Data;
using SmartWarehouse.Api.DTOs.Common;
using SmartWarehouse.Api.DTOs.Warehouses;
using SmartWarehouse.Api.Models.Entities;

namespace SmartWarehouse.Api.Controllers;

[Authorize]
public class WarehousesController : BaseApiController
{
    private readonly AppDbContext _context;

    public WarehousesController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<PagedResponse<WarehouseDto>>> GetWarehouses([FromQuery] QueryParameters query)
    {
        var queryable = _context.Warehouses
            .AsNoTracking()
            .Include(w => w.Manager).ThenInclude(m => m!.Profile)
            .Include(w => w.Stocks)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var s = query.Search.Trim().ToLower();
            queryable = queryable.Where(w =>
                w.Name.ToLower().Contains(s) ||
                w.Code.ToLower().Contains(s) ||
                w.City.ToLower().Contains(s) ||
                w.Address.ToLower().Contains(s));
        }

        if (!string.IsNullOrWhiteSpace(query.Status))
        {
            var isActive = query.Status.Equals("active", StringComparison.OrdinalIgnoreCase);
            queryable = queryable.Where(w => w.IsActive == isActive);
        }

        var isAsc = query.SortDir?.ToLower() == "asc";
        queryable = query.SortBy?.ToLower() switch
        {
            "name" => isAsc ? queryable.OrderBy(w => w.Name) : queryable.OrderByDescending(w => w.Name),
            "code" => isAsc ? queryable.OrderBy(w => w.Code) : queryable.OrderByDescending(w => w.Code),
            "city" => isAsc ? queryable.OrderBy(w => w.City) : queryable.OrderByDescending(w => w.City),
            "capacity" => isAsc ? queryable.OrderBy(w => w.CapacitySqm) : queryable.OrderByDescending(w => w.CapacitySqm),
            _ => isAsc ? queryable.OrderBy(w => w.CreatedAt) : queryable.OrderByDescending(w => w.CreatedAt)
        };

        var totalCount = await queryable.CountAsync();

        var items = await queryable
            .Skip((query.Page - 1) * query.Limit)
            .Take(query.Limit)
            .Select(w => new WarehouseDto
            {
                Id = w.Id,
                Code = w.Code,
                Name = w.Name,
                Address = w.Address,
                City = w.City,
                CapacitySqm = w.CapacitySqm,
                ManagerId = w.ManagerId,
                ManagerName = w.Manager != null && w.Manager.Profile != null ? w.Manager.Profile.FullName : (w.Manager != null ? w.Manager.Email : null),
                IsActive = w.IsActive,
                TotalProductsStored = w.Stocks.Select(s => s.ProductId).Distinct().Count(),
                TotalUnitsStored = w.Stocks.Sum(s => s.QuantityOnHand),
                CreatedAt = w.CreatedAt,
                UpdatedAt = w.UpdatedAt
            })
            .ToListAsync();

        return Ok(PagedResponse<WarehouseDto>.Create(items, totalCount, query.Page, query.Limit, "Daftar gudang berhasil dimuat."));
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<ApiResponse<WarehouseDto>>> GetWarehouseById(int id)
    {
        var w = await _context.Warehouses
            .AsNoTracking()
            .Include(w => w.Manager).ThenInclude(m => m!.Profile)
            .Include(w => w.Stocks)
            .FirstOrDefaultAsync(w => w.Id == id);

        if (w == null)
        {
            return NotFound(ApiResponse<WarehouseDto>.Fail($"Gudang dengan ID {id} tidak ditemukan.", 404));
        }

        var dto = new WarehouseDto
        {
            Id = w.Id,
            Code = w.Code,
            Name = w.Name,
            Address = w.Address,
            City = w.City,
            CapacitySqm = w.CapacitySqm,
            ManagerId = w.ManagerId,
            ManagerName = w.Manager != null && w.Manager.Profile != null ? w.Manager.Profile.FullName : (w.Manager != null ? w.Manager.Email : null),
            IsActive = w.IsActive,
            TotalProductsStored = w.Stocks.Select(s => s.ProductId).Distinct().Count(),
            TotalUnitsStored = w.Stocks.Sum(s => s.QuantityOnHand),
            CreatedAt = w.CreatedAt,
            UpdatedAt = w.UpdatedAt
        };

        return Ok(ApiResponse<WarehouseDto>.Ok(dto, "Detail gudang berhasil dimuat."));
    }

    [Authorize(Roles = "ROLE_ADMIN,ROLE_MANAGER")]
    [HttpPost]
    public async Task<ActionResult<ApiResponse<WarehouseDto>>> CreateWarehouse([FromBody] CreateWarehouseDto dto)
    {
        if (await _context.Warehouses.AnyAsync(w => w.Code.ToLower() == dto.Code.ToLower()))
        {
            return BadRequest(ApiResponse<WarehouseDto>.Fail($"Kode gudang '{dto.Code}' sudah ada.", 400));
        }

        var warehouse = new Warehouse
        {
            Code = dto.Code.Trim().ToUpper(),
            Name = dto.Name.Trim(),
            Address = dto.Address.Trim(),
            City = dto.City.Trim(),
            CapacitySqm = dto.CapacitySqm,
            ManagerId = dto.ManagerId,
            IsActive = dto.IsActive
        };

        await _context.Warehouses.AddAsync(warehouse);
        await _context.SaveChangesAsync();

        var result = new WarehouseDto
        {
            Id = warehouse.Id,
            Code = warehouse.Code,
            Name = warehouse.Name,
            Address = warehouse.Address,
            City = warehouse.City,
            CapacitySqm = warehouse.CapacitySqm,
            ManagerId = warehouse.ManagerId,
            IsActive = warehouse.IsActive,
            TotalProductsStored = 0,
            TotalUnitsStored = 0,
            CreatedAt = warehouse.CreatedAt,
            UpdatedAt = warehouse.UpdatedAt
        };

        return StatusCode(201, ApiResponse<WarehouseDto>.Created(result, "Gudang baru berhasil ditambahkan."));
    }

    [Authorize(Roles = "ROLE_ADMIN,ROLE_MANAGER")]
    [HttpPut("{id:int}")]
    public async Task<ActionResult<ApiResponse<WarehouseDto>>> UpdateWarehouse(int id, [FromBody] UpdateWarehouseDto dto)
    {
        var warehouse = await _context.Warehouses.FindAsync(id);
        if (warehouse == null)
        {
            return NotFound(ApiResponse<WarehouseDto>.Fail($"Gudang dengan ID {id} tidak ditemukan.", 404));
        }

        if (await _context.Warehouses.AnyAsync(w => w.Id != id && w.Code.ToLower() == dto.Code.ToLower()))
        {
            return BadRequest(ApiResponse<WarehouseDto>.Fail($"Kode gudang '{dto.Code}' sudah digunakan gudang lain.", 400));
        }

        warehouse.Code = dto.Code.Trim().ToUpper();
        warehouse.Name = dto.Name.Trim();
        warehouse.Address = dto.Address.Trim();
        warehouse.City = dto.City.Trim();
        warehouse.CapacitySqm = dto.CapacitySqm;
        warehouse.ManagerId = dto.ManagerId;
        warehouse.IsActive = dto.IsActive;

        await _context.SaveChangesAsync();

        var result = new WarehouseDto
        {
            Id = warehouse.Id,
            Code = warehouse.Code,
            Name = warehouse.Name,
            Address = warehouse.Address,
            City = warehouse.City,
            CapacitySqm = warehouse.CapacitySqm,
            ManagerId = warehouse.ManagerId,
            IsActive = warehouse.IsActive,
            CreatedAt = warehouse.CreatedAt,
            UpdatedAt = warehouse.UpdatedAt
        };

        return Ok(ApiResponse<WarehouseDto>.Ok(result, "Data gudang berhasil diperbarui."));
    }

    [Authorize(Roles = "ROLE_ADMIN,ROLE_MANAGER")]
    [HttpDelete("{id:int}")]
    public async Task<ActionResult<ApiResponse<object>>> DeleteWarehouse(int id)
    {
        var warehouse = await _context.Warehouses.FindAsync(id);
        if (warehouse == null)
        {
            return NotFound(ApiResponse<object>.Fail($"Gudang dengan ID {id} tidak ditemukan.", 404));
        }

        // Soft Delete
        warehouse.IsDeleted = true;
        warehouse.DeletedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return Ok(ApiResponse<object>.Ok(new { id, isDeleted = true }, "Gudang berhasil dihapus (Soft Delete)."));
    }
}
