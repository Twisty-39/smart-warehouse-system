using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmartWarehouse.Api.Data;
using SmartWarehouse.Api.DTOs.Common;
using SmartWarehouse.Api.DTOs.Inventory;
using SmartWarehouse.Api.Models.Entities;

namespace SmartWarehouse.Api.Controllers;

[Authorize]
public class InventoryController : BaseApiController
{
    private readonly AppDbContext _context;

    public InventoryController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<PagedResponse<InventoryStockDto>>> GetStocks([FromQuery] QueryParameters query)
    {
        var queryable = _context.InventoryStocks
            .AsNoTracking()
            .Include(s => s.Product)
            .Include(s => s.Warehouse)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var s = query.Search.Trim().ToLower();
            queryable = queryable.Where(st =>
                st.Product.Name.ToLower().Contains(s) ||
                st.Product.Sku.ToLower().Contains(s) ||
                st.Warehouse.Name.ToLower().Contains(s) ||
                st.BinLocation.ToLower().Contains(s));
        }

        if (query.WarehouseId.HasValue && query.WarehouseId.Value > 0)
        {
            queryable = queryable.Where(st => st.WarehouseId == query.WarehouseId.Value);
        }

        if (query.CategoryId.HasValue && query.CategoryId.Value > 0)
        {
            queryable = queryable.Where(st => st.Product.CategoryId == query.CategoryId.Value);
        }

        if (!string.IsNullOrWhiteSpace(query.Status) && query.Status.Equals("low_stock", StringComparison.OrdinalIgnoreCase))
        {
            queryable = queryable.Where(st => st.QuantityOnHand <= st.Product.ReorderLevel);
        }

        var isAsc = query.SortDir?.ToLower() == "asc";
        queryable = query.SortBy?.ToLower() switch
        {
            "productname" => isAsc ? queryable.OrderBy(s => s.Product.Name) : queryable.OrderByDescending(s => s.Product.Name),
            "warehousename" => isAsc ? queryable.OrderBy(s => s.Warehouse.Name) : queryable.OrderByDescending(s => s.Warehouse.Name),
            "quantityonhand" => isAsc ? queryable.OrderBy(s => s.QuantityOnHand) : queryable.OrderByDescending(s => s.QuantityOnHand),
            _ => isAsc ? queryable.OrderBy(s => s.UpdatedAt) : queryable.OrderByDescending(s => s.UpdatedAt)
        };

        var totalCount = await queryable.CountAsync();

        var items = await queryable
            .Skip((query.Page - 1) * query.Limit)
            .Take(query.Limit)
            .Select(s => new InventoryStockDto
            {
                Id = s.Id,
                ProductId = s.ProductId,
                ProductSku = s.Product.Sku,
                ProductName = s.Product.Name,
                ProductImageUrl = s.Product.ImageUrl,
                UnitOfMeasure = s.Product.UnitOfMeasure,
                ReorderLevel = s.Product.ReorderLevel,
                WarehouseId = s.WarehouseId,
                WarehouseCode = s.Warehouse.Code,
                WarehouseName = s.Warehouse.Name,
                BinLocation = s.BinLocation,
                QuantityOnHand = s.QuantityOnHand,
                QuantityAllocated = s.QuantityAllocated,
                QuantityAvailable = s.QuantityAvailable,
                LastCountedAt = s.LastCountedAt,
                UpdatedAt = s.UpdatedAt
            })
            .ToListAsync();

        return Ok(PagedResponse<InventoryStockDto>.Create(items, totalCount, query.Page, query.Limit, "Data stok inventaris berhasil dimuat."));
    }

    [HttpGet("low-stock")]
    public async Task<ActionResult<ApiResponse<List<InventoryStockDto>>>> GetLowStockItems()
    {
        var lowStocks = await _context.InventoryStocks
            .AsNoTracking()
            .Include(s => s.Product)
            .Include(s => s.Warehouse)
            .Where(s => s.QuantityOnHand <= s.Product.ReorderLevel)
            .OrderBy(s => s.QuantityOnHand)
            .Take(20)
            .Select(s => new InventoryStockDto
            {
                Id = s.Id,
                ProductId = s.ProductId,
                ProductSku = s.Product.Sku,
                ProductName = s.Product.Name,
                ProductImageUrl = s.Product.ImageUrl,
                UnitOfMeasure = s.Product.UnitOfMeasure,
                ReorderLevel = s.Product.ReorderLevel,
                WarehouseId = s.WarehouseId,
                WarehouseCode = s.Warehouse.Code,
                WarehouseName = s.Warehouse.Name,
                BinLocation = s.BinLocation,
                QuantityOnHand = s.QuantityOnHand,
                QuantityAllocated = s.QuantityAllocated,
                QuantityAvailable = s.QuantityAvailable,
                LastCountedAt = s.LastCountedAt,
                UpdatedAt = s.UpdatedAt
            })
            .ToListAsync();

        return Ok(ApiResponse<List<InventoryStockDto>>.Ok(lowStocks, "Daftar produk dengan stok menipis berhasil dimuat."));
    }

    [Authorize(Roles = "ROLE_ADMIN,ROLE_MANAGER")]
    [HttpPost("adjust")]
    public async Task<ActionResult<ApiResponse<InventoryStockDto>>> AdjustStock([FromBody] StockAdjustmentDto dto)
    {
        if (CurrentUserId == null)
        {
            return Unauthorized(ApiResponse<InventoryStockDto>.Fail("Pengguna tidak terautentikasi.", 401));
        }

        var product = await _context.Products.FindAsync(dto.ProductId);
        if (product == null) return NotFound(ApiResponse<InventoryStockDto>.Fail("Produk tidak ditemukan.", 404));

        var warehouse = await _context.Warehouses.FindAsync(dto.WarehouseId);
        if (warehouse == null) return NotFound(ApiResponse<InventoryStockDto>.Fail("Gudang tidak ditemukan.", 404));

        try
        {
            var stock = await _context.InventoryStocks
                .FirstOrDefaultAsync(s => s.ProductId == dto.ProductId && s.WarehouseId == dto.WarehouseId && s.BinLocation == dto.BinLocation);

            var previousQty = stock?.QuantityOnHand ?? 0;
            var diff = dto.NewQuantityOnHand - previousQty;

            if (stock == null)
            {
                stock = new InventoryStock
                {
                    ProductId = dto.ProductId,
                    WarehouseId = dto.WarehouseId,
                    BinLocation = dto.BinLocation.Trim(),
                    QuantityOnHand = dto.NewQuantityOnHand,
                    QuantityAllocated = 0,
                    QuantityAvailable = dto.NewQuantityOnHand,
                    LastCountedAt = DateTime.UtcNow
                };
                await _context.InventoryStocks.AddAsync(stock);
            }
            else
            {
                stock.QuantityOnHand = dto.NewQuantityOnHand;
                stock.QuantityAvailable = Math.Max(0, dto.NewQuantityOnHand - stock.QuantityAllocated);
                stock.LastCountedAt = DateTime.UtcNow;
            }

            // Catat mutasi audit
            var transaction = new StockTransaction
            {
                ReferenceNumber = $"ADJ-{DateTime.UtcNow:yyyyMMddHHmmss}-{Guid.NewGuid().ToString("N")[..6].ToUpper()}",
                TransactionType = "ADJUSTMENT",
                ProductId = dto.ProductId,
                SourceWarehouseId = dto.WarehouseId,
                TargetWarehouseId = dto.WarehouseId,
                Quantity = Math.Abs(diff),
                Notes = $"Stock Adjustment: {dto.Reason} (Selisih: {(diff >= 0 ? "+" : "")}{diff} {product.UnitOfMeasure})",
                CreatedByUserId = CurrentUserId.Value
            };
            await _context.StockTransactions.AddAsync(transaction);

            await _context.SaveChangesAsync();

            var result = new InventoryStockDto
            {
                Id = stock.Id,
                ProductId = product.Id,
                ProductSku = product.Sku,
                ProductName = product.Name,
                ProductImageUrl = product.ImageUrl,
                UnitOfMeasure = product.UnitOfMeasure,
                ReorderLevel = product.ReorderLevel,
                WarehouseId = warehouse.Id,
                WarehouseCode = warehouse.Code,
                WarehouseName = warehouse.Name,
                BinLocation = stock.BinLocation,
                QuantityOnHand = stock.QuantityOnHand,
                QuantityAllocated = stock.QuantityAllocated,
                QuantityAvailable = stock.QuantityAvailable,
                LastCountedAt = stock.LastCountedAt,
                UpdatedAt = stock.UpdatedAt
            };

            return Ok(ApiResponse<InventoryStockDto>.Ok(result, "Penyesuaian stok berhasil disimpan."));
        }
        catch (Exception ex)
        {
            return StatusCode(500, ApiResponse<InventoryStockDto>.Fail($"Gagal menyesuaikan stok: {ex.Message}", 500));
        }
    }

    [Authorize(Roles = "ROLE_ADMIN,ROLE_MANAGER,ROLE_STAFF")]
    [HttpPost("transfer")]
    public async Task<ActionResult<ApiResponse<object>>> TransferStock([FromBody] StockTransferDto dto)
    {
        if (CurrentUserId == null)
        {
            return Unauthorized(ApiResponse<object>.Fail("Pengguna tidak terautentikasi.", 401));
        }

        if (dto.SourceWarehouseId == dto.TargetWarehouseId)
        {
            return BadRequest(ApiResponse<object>.Fail("Gudang asal dan tujuan tidak boleh sama.", 400));
        }

        var sourceStock = await _context.InventoryStocks
            .FirstOrDefaultAsync(s => s.ProductId == dto.ProductId && s.WarehouseId == dto.SourceWarehouseId && s.BinLocation == dto.SourceBinLocation);

        if (sourceStock == null || sourceStock.QuantityAvailable < dto.Quantity)
        {
            return BadRequest(ApiResponse<object>.Fail($"Stok tersedia di gudang asal tidak mencukupi (Tersedia: {sourceStock?.QuantityAvailable ?? 0}).", 400));
        }

        var targetStock = await _context.InventoryStocks
            .FirstOrDefaultAsync(s => s.ProductId == dto.ProductId && s.WarehouseId == dto.TargetWarehouseId && s.BinLocation == dto.TargetBinLocation);

        try
        {
            // 1. Kurangi gudang asal
            sourceStock.QuantityOnHand -= dto.Quantity;
            sourceStock.QuantityAvailable = Math.Max(0, sourceStock.QuantityOnHand - sourceStock.QuantityAllocated);

            // 2. Tambah gudang tujuan
            if (targetStock == null)
            {
                targetStock = new InventoryStock
                {
                    ProductId = dto.ProductId,
                    WarehouseId = dto.TargetWarehouseId,
                    BinLocation = dto.TargetBinLocation.Trim(),
                    QuantityOnHand = dto.Quantity,
                    QuantityAllocated = 0,
                    QuantityAvailable = dto.Quantity,
                    LastCountedAt = DateTime.UtcNow
                };
                await _context.InventoryStocks.AddAsync(targetStock);
            }
            else
            {
                targetStock.QuantityOnHand += dto.Quantity;
                targetStock.QuantityAvailable = Math.Max(0, targetStock.QuantityOnHand - targetStock.QuantityAllocated);
            }

            // 3. Catat mutasi audit TRANSFER
            var transaction = new StockTransaction
            {
                ReferenceNumber = $"TRF-{DateTime.UtcNow:yyyyMMddHHmmss}-{Guid.NewGuid().ToString("N")[..6].ToUpper()}",
                TransactionType = "TRANSFER",
                ProductId = dto.ProductId,
                SourceWarehouseId = dto.SourceWarehouseId,
                TargetWarehouseId = dto.TargetWarehouseId,
                Quantity = dto.Quantity,
                Notes = dto.Notes,
                CreatedByUserId = CurrentUserId.Value
            };
            await _context.StockTransactions.AddAsync(transaction);

            await _context.SaveChangesAsync();

            return Ok(ApiResponse<object>.Ok(new
            {
                TransactionId = transaction.Id,
                ReferenceNumber = transaction.ReferenceNumber,
                SourceWarehouse = sourceStock.Warehouse?.Name,
                TargetWarehouse = targetStock.Warehouse?.Name,
                QuantityTransferred = dto.Quantity
            }, "Transfer stok antar gudang berhasil dicatat."));
        }
        catch (Exception ex)
        {
            return StatusCode(500, ApiResponse<object>.Fail($"Gagal melakukan transfer stok: {ex.Message}", 500));
        }
    }
}
