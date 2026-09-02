using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmartWarehouse.Api.Data;
using SmartWarehouse.Api.DTOs.Common;
using SmartWarehouse.Api.DTOs.Transactions;
using SmartWarehouse.Api.Models.Entities;

namespace SmartWarehouse.Api.Controllers;

[Authorize]
[Route("api/stock-transactions")]
[Route("api/stocktransactions")]
public class StockTransactionsController : BaseApiController
{
    private readonly AppDbContext _context;

    public StockTransactionsController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<PagedResponse<TransactionDto>>> GetTransactions([FromQuery] QueryParameters query)
    {
        var queryable = _context.StockTransactions
            .AsNoTracking()
            .Include(t => t.Product)
            .Include(t => t.SourceWarehouse)
            .Include(t => t.TargetWarehouse)
            .Include(t => t.CreatedByUser).ThenInclude(u => u.Profile)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var s = query.Search.Trim().ToLower();
            queryable = queryable.Where(t =>
                t.ReferenceNumber.ToLower().Contains(s) ||
                t.Product.Name.ToLower().Contains(s) ||
                t.Product.Sku.ToLower().Contains(s) ||
                (t.Notes != null && t.Notes.ToLower().Contains(s)));
        }

        if (!string.IsNullOrWhiteSpace(query.Status)) // In this context, status can filter TransactionType
        {
            queryable = queryable.Where(t => t.TransactionType == query.Status.ToUpper());
        }

        if (query.StartDate.HasValue)
        {
            queryable = queryable.Where(t => t.CreatedAt >= query.StartDate.Value);
        }
        if (query.EndDate.HasValue)
        {
            queryable = queryable.Where(t => t.CreatedAt <= query.EndDate.Value);
        }

        var isAsc = query.SortDir?.ToLower() == "asc";
        queryable = query.SortBy?.ToLower() switch
        {
            "referencenumber" => isAsc ? queryable.OrderBy(t => t.ReferenceNumber) : queryable.OrderByDescending(t => t.ReferenceNumber),
            "quantity" => isAsc ? queryable.OrderBy(t => t.Quantity) : queryable.OrderByDescending(t => t.Quantity),
            "type" => isAsc ? queryable.OrderBy(t => t.TransactionType) : queryable.OrderByDescending(t => t.TransactionType),
            _ => isAsc ? queryable.OrderBy(t => t.CreatedAt) : queryable.OrderByDescending(t => t.CreatedAt)
        };

        var totalCount = await queryable.CountAsync();

        var items = await queryable
            .Skip((query.Page - 1) * query.Limit)
            .Take(query.Limit)
            .Select(t => new TransactionDto
            {
                Id = t.Id,
                ReferenceNumber = t.ReferenceNumber,
                TransactionType = t.TransactionType,
                ProductId = t.ProductId,
                ProductSku = t.Product.Sku,
                ProductName = t.Product.Name,
                SourceWarehouseId = t.SourceWarehouseId,
                SourceWarehouseName = t.SourceWarehouse != null ? t.SourceWarehouse.Name : null,
                TargetWarehouseId = t.TargetWarehouseId,
                TargetWarehouseName = t.TargetWarehouse != null ? t.TargetWarehouse.Name : null,
                Quantity = t.Quantity,
                Notes = t.Notes,
                DocumentUrl = t.DocumentUrl,
                CreatedByUserId = t.CreatedByUserId,
                CreatedByUserName = t.CreatedByUser.Profile != null ? t.CreatedByUser.Profile.FullName : t.CreatedByUser.Email,
                CreatedAt = t.CreatedAt
            })
            .ToListAsync();

        return Ok(PagedResponse<TransactionDto>.Create(items, totalCount, query.Page, query.Limit, "Riwayat transaksi mutasi berhasil dimuat."));
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<ApiResponse<TransactionDto>>> GetTransactionById(int id)
    {
        var t = await _context.StockTransactions
            .AsNoTracking()
            .Include(t => t.Product)
            .Include(t => t.SourceWarehouse)
            .Include(t => t.TargetWarehouse)
            .Include(t => t.CreatedByUser).ThenInclude(u => u.Profile)
            .FirstOrDefaultAsync(t => t.Id == id);

        if (t == null)
        {
            return NotFound(ApiResponse<TransactionDto>.Fail($"Transaksi dengan ID {id} tidak ditemukan.", 404));
        }

        var dto = new TransactionDto
        {
            Id = t.Id,
            ReferenceNumber = t.ReferenceNumber,
            TransactionType = t.TransactionType,
            ProductId = t.ProductId,
            ProductSku = t.Product.Sku,
            ProductName = t.Product.Name,
            SourceWarehouseId = t.SourceWarehouseId,
            SourceWarehouseName = t.SourceWarehouse != null ? t.SourceWarehouse.Name : null,
            TargetWarehouseId = t.TargetWarehouseId,
            TargetWarehouseName = t.TargetWarehouse != null ? t.TargetWarehouse.Name : null,
            Quantity = t.Quantity,
            Notes = t.Notes,
            DocumentUrl = t.DocumentUrl,
            CreatedByUserId = t.CreatedByUserId,
            CreatedByUserName = t.CreatedByUser.Profile != null ? t.CreatedByUser.Profile.FullName : t.CreatedByUser.Email,
            CreatedAt = t.CreatedAt
        };

        return Ok(ApiResponse<TransactionDto>.Ok(dto, "Detail transaksi berhasil dimuat."));
    }

    [Authorize(Roles = "ROLE_ADMIN,ROLE_MANAGER,ROLE_STAFF")]
    [HttpPost]
    public async Task<ActionResult<ApiResponse<TransactionDto>>> CreateTransaction([FromBody] CreateTransactionDto dto)
    {
        if (CurrentUserId == null)
        {
            return Unauthorized(ApiResponse<TransactionDto>.Fail("Pengguna tidak terautentikasi.", 401));
        }

        var product = await _context.Products.FindAsync(dto.ProductId);
        if (product == null) return NotFound(ApiResponse<TransactionDto>.Fail("Produk tidak ditemukan.", 404));

        var warehouse = await _context.Warehouses.FindAsync(dto.WarehouseId);
        if (warehouse == null) return NotFound(ApiResponse<TransactionDto>.Fail("Gudang tidak ditemukan.", 404));

        var type = dto.TransactionType.ToUpperInvariant();
        if (type != "INBOUND" && type != "OUTBOUND")
        {
            return BadRequest(ApiResponse<TransactionDto>.Fail("Tipe transaksi harus INBOUND atau OUTBOUND.", 400));
        }

        try
        {
            var stock = await _context.InventoryStocks
                .FirstOrDefaultAsync(s => s.ProductId == dto.ProductId && s.WarehouseId == dto.WarehouseId && s.BinLocation == dto.BinLocation);

            if (type == "INBOUND")
            {
                if (stock == null)
                {
                    stock = new InventoryStock
                    {
                        ProductId = dto.ProductId,
                        WarehouseId = dto.WarehouseId,
                        BinLocation = dto.BinLocation.Trim(),
                        QuantityOnHand = dto.Quantity,
                        QuantityAllocated = 0,
                        QuantityAvailable = dto.Quantity,
                        LastCountedAt = DateTime.UtcNow
                    };
                    await _context.InventoryStocks.AddAsync(stock);
                }
                else
                {
                    stock.QuantityOnHand += dto.Quantity;
                    stock.QuantityAvailable = Math.Max(0, stock.QuantityOnHand - stock.QuantityAllocated);
                }
            }
            else // OUTBOUND
            {
                if (stock == null || stock.QuantityAvailable < dto.Quantity)
                {
                    return BadRequest(ApiResponse<TransactionDto>.Fail($"Stok tersedia di gudang tidak mencukupi (Tersedia: {stock?.QuantityAvailable ?? 0}).", 400));
                }

                stock.QuantityOnHand -= dto.Quantity;
                stock.QuantityAvailable = Math.Max(0, stock.QuantityOnHand - stock.QuantityAllocated);
            }

            var refPrefix = type == "INBOUND" ? "INB" : "OUT";
            var transaction = new StockTransaction
            {
                ReferenceNumber = $"TRX-{refPrefix}-{DateTime.UtcNow:yyyyMMddHHmmss}-{Guid.NewGuid().ToString("N")[..6].ToUpper()}",
                TransactionType = type,
                ProductId = dto.ProductId,
                SourceWarehouseId = type == "OUTBOUND" ? dto.WarehouseId : null,
                TargetWarehouseId = type == "INBOUND" ? dto.WarehouseId : null,
                Quantity = dto.Quantity,
                Notes = dto.Notes,
                DocumentUrl = dto.DocumentUrl,
                CreatedByUserId = CurrentUserId.Value
            };
            await _context.StockTransactions.AddAsync(transaction);

            await _context.SaveChangesAsync();

            var result = new TransactionDto
            {
                Id = transaction.Id,
                ReferenceNumber = transaction.ReferenceNumber,
                TransactionType = transaction.TransactionType,
                ProductId = product.Id,
                ProductSku = product.Sku,
                ProductName = product.Name,
                SourceWarehouseId = transaction.SourceWarehouseId,
                SourceWarehouseName = type == "OUTBOUND" ? warehouse.Name : null,
                TargetWarehouseId = transaction.TargetWarehouseId,
                TargetWarehouseName = type == "INBOUND" ? warehouse.Name : null,
                Quantity = transaction.Quantity,
                Notes = transaction.Notes,
                DocumentUrl = transaction.DocumentUrl,
                CreatedByUserId = transaction.CreatedByUserId,
                CreatedByUserName = CurrentUserEmail ?? "User",
                CreatedAt = transaction.CreatedAt
            };

            return StatusCode(201, ApiResponse<TransactionDto>.Created(result, $"Transaksi {type} berhasil dicatat."));
        }
        catch (Exception ex)
        {
            return StatusCode(500, ApiResponse<TransactionDto>.Fail($"Gagal mencatat transaksi: {ex.Message}", 500));
        }
    }
}
