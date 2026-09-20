using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmartWarehouse.Api.Data;
using SmartWarehouse.Api.DTOs.Common;
using SmartWarehouse.Api.DTOs.PurchaseOrders;
using SmartWarehouse.Api.Models.Entities;

namespace SmartWarehouse.Api.Controllers;

[Authorize]
[Route("api/purchase-orders")]
[Route("api/purchaseorders")]
public class PurchaseOrdersController : BaseApiController
{
    private readonly AppDbContext _context;

    public PurchaseOrdersController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<PagedResponse<PurchaseOrderDto>>> GetPurchaseOrders([FromQuery] QueryParameters query)
    {
        var queryable = _context.PurchaseOrders
            .AsNoTracking()
            .Include(po => po.Supplier)
            .Include(po => po.CreatedByUser).ThenInclude(u => u.Profile)
            .Include(po => po.Items).ThenInclude(i => i.Product)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var s = query.Search.Trim().ToLower();
            queryable = queryable.Where(po =>
                po.PoNumber.ToLower().Contains(s) ||
                po.Supplier.Name.ToLower().Contains(s) ||
                (po.Notes != null && po.Notes.ToLower().Contains(s)));
        }

        if (!string.IsNullOrWhiteSpace(query.Status))
        {
            queryable = queryable.Where(po => po.Status == query.Status.ToUpper());
        }

        if (query.StartDate.HasValue)
        {
            queryable = queryable.Where(po => po.OrderDate >= query.StartDate.Value);
        }
        if (query.EndDate.HasValue)
        {
            queryable = queryable.Where(po => po.OrderDate <= query.EndDate.Value);
        }

        var isAsc = query.SortDir?.ToLower() == "asc";
        queryable = query.SortBy?.ToLower() switch
        {
            "ponumber" => isAsc ? queryable.OrderBy(po => po.PoNumber) : queryable.OrderByDescending(po => po.PoNumber),
            "suppliername" => isAsc ? queryable.OrderBy(po => po.Supplier.Name) : queryable.OrderByDescending(po => po.Supplier.Name),
            "totalamount" => isAsc ? queryable.OrderBy(po => po.TotalAmount) : queryable.OrderByDescending(po => po.TotalAmount),
            "status" => isAsc ? queryable.OrderBy(po => po.Status) : queryable.OrderByDescending(po => po.Status),
            _ => isAsc ? queryable.OrderBy(po => po.OrderDate) : queryable.OrderByDescending(po => po.OrderDate)
        };

        var totalCount = await queryable.CountAsync();

        var items = await queryable
            .Skip((query.Page - 1) * query.Limit)
            .Take(query.Limit)
            .Select(po => new PurchaseOrderDto
            {
                Id = po.Id,
                PoNumber = po.PoNumber,
                SupplierId = po.SupplierId,
                SupplierName = po.Supplier.Name,
                SupplierEmail = po.Supplier.Email,
                OrderDate = po.OrderDate,
                ExpectedDeliveryDate = po.ExpectedDeliveryDate,
                Status = po.Status,
                TotalAmount = po.TotalAmount,
                Notes = po.Notes,
                DocumentUrl = po.DocumentUrl,
                CreatedByUserId = po.CreatedByUserId,
                CreatedByUserName = po.CreatedByUser.Profile != null ? po.CreatedByUser.Profile.FullName : po.CreatedByUser.Email,
                Items = po.Items.Select(i => new PurchaseOrderItemDto
                {
                    Id = i.Id,
                    ProductId = i.ProductId,
                    ProductSku = i.Product.Sku,
                    ProductName = i.Product.Name,
                    UnitOfMeasure = i.Product.UnitOfMeasure,
                    OrderedQuantity = i.OrderedQuantity,
                    ReceivedQuantity = i.ReceivedQuantity,
                    UnitCost = i.UnitCost,
                    Subtotal = i.Subtotal,
                    Notes = i.Notes
                }).ToList(),
                CreatedAt = po.CreatedAt,
                UpdatedAt = po.UpdatedAt
            })
            .ToListAsync();

        return Ok(PagedResponse<PurchaseOrderDto>.Create(items, totalCount, query.Page, query.Limit, "Daftar Purchase Order berhasil dimuat."));
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<ApiResponse<PurchaseOrderDto>>> GetPurchaseOrderById(int id)
    {
        var po = await _context.PurchaseOrders
            .AsNoTracking()
            .Include(p => p.Supplier)
            .Include(p => p.CreatedByUser).ThenInclude(u => u.Profile)
            .Include(p => p.Items).ThenInclude(i => i.Product)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (po == null)
        {
            return NotFound(ApiResponse<PurchaseOrderDto>.Fail($"Purchase Order dengan ID {id} tidak ditemukan.", 404));
        }

        var dto = new PurchaseOrderDto
        {
            Id = po.Id,
            PoNumber = po.PoNumber,
            SupplierId = po.SupplierId,
            SupplierName = po.Supplier.Name,
            SupplierEmail = po.Supplier.Email,
            OrderDate = po.OrderDate,
            ExpectedDeliveryDate = po.ExpectedDeliveryDate,
            Status = po.Status,
            TotalAmount = po.TotalAmount,
            Notes = po.Notes,
            DocumentUrl = po.DocumentUrl,
            CreatedByUserId = po.CreatedByUserId,
            CreatedByUserName = po.CreatedByUser.Profile != null ? po.CreatedByUser.Profile.FullName : po.CreatedByUser.Email,
            Items = po.Items.Select(i => new PurchaseOrderItemDto
            {
                Id = i.Id,
                ProductId = i.ProductId,
                ProductSku = i.Product.Sku,
                ProductName = i.Product.Name,
                UnitOfMeasure = i.Product.UnitOfMeasure,
                OrderedQuantity = i.OrderedQuantity,
                ReceivedQuantity = i.ReceivedQuantity,
                UnitCost = i.UnitCost,
                Subtotal = i.Subtotal,
                Notes = i.Notes
            }).ToList(),
            CreatedAt = po.CreatedAt,
            UpdatedAt = po.UpdatedAt
        };

        return Ok(ApiResponse<PurchaseOrderDto>.Ok(dto, "Detail Purchase Order berhasil dimuat."));
    }

    [Authorize(Roles = "ROLE_ADMIN,ROLE_PURCHASING,ROLE_MANAGER")]
    [HttpPost]
    public async Task<ActionResult<ApiResponse<PurchaseOrderDto>>> CreatePurchaseOrder([FromBody] CreatePurchaseOrderDto dto)
    {
        if (CurrentUserId == null)
        {
            return Unauthorized(ApiResponse<PurchaseOrderDto>.Fail("Pengguna tidak terautentikasi.", 401));
        }

        var supplier = await _context.Suppliers.FindAsync(dto.SupplierId);
        if (supplier == null) return BadRequest(ApiResponse<PurchaseOrderDto>.Fail("Pemasok tidak ditemukan.", 400));

        var poNumber = $"PO-{DateTime.UtcNow:yyyyMM}-{Guid.NewGuid().ToString("N")[..6].ToUpper()}";

        decimal total = 0;
        var items = new List<PurchaseOrderItem>();

        foreach (var itemDto in dto.Items)
        {
            var prod = await _context.Products.FindAsync(itemDto.ProductId);
            if (prod == null) return BadRequest(ApiResponse<PurchaseOrderDto>.Fail($"Produk dengan ID {itemDto.ProductId} tidak ditemukan.", 400));

            var subtotal = itemDto.OrderedQuantity * itemDto.UnitCost;
            total += subtotal;

            items.Add(new PurchaseOrderItem
            {
                ProductId = itemDto.ProductId,
                OrderedQuantity = itemDto.OrderedQuantity,
                ReceivedQuantity = 0,
                UnitCost = itemDto.UnitCost,
                Subtotal = subtotal,
                Notes = itemDto.Notes
            });
        }

        var po = new PurchaseOrder
        {
            PoNumber = poNumber,
            SupplierId = dto.SupplierId,
            OrderDate = DateTime.UtcNow,
            ExpectedDeliveryDate = dto.ExpectedDeliveryDate,
            Status = "PENDING",
            TotalAmount = total,
            Notes = dto.Notes,
            DocumentUrl = dto.DocumentUrl,
            CreatedByUserId = CurrentUserId.Value,
            Items = items
        };

        await _context.PurchaseOrders.AddAsync(po);
        await _context.SaveChangesAsync();

        return StatusCode(201, ApiResponse<PurchaseOrderDto>.Created(new PurchaseOrderDto
        {
            Id = po.Id,
            PoNumber = po.PoNumber,
            SupplierId = supplier.Id,
            SupplierName = supplier.Name,
            SupplierEmail = supplier.Email,
            OrderDate = po.OrderDate,
            ExpectedDeliveryDate = po.ExpectedDeliveryDate,
            Status = po.Status,
            TotalAmount = po.TotalAmount,
            Notes = po.Notes,
            DocumentUrl = po.DocumentUrl,
            CreatedByUserId = po.CreatedByUserId,
            CreatedByUserName = CurrentUserEmail ?? "User",
            CreatedAt = po.CreatedAt,
            UpdatedAt = po.UpdatedAt
        }, "Purchase Order berhasil dibuat."));
    }

    [Authorize(Roles = "ROLE_ADMIN,ROLE_MANAGER")]
    [HttpPatch("{id:int}/status")]
    public async Task<ActionResult<ApiResponse<object>>> UpdateStatus(int id, [FromBody] UpdateStatusDto dto)
    {
        var po = await _context.PurchaseOrders.FindAsync(id);
        if (po == null) return NotFound(ApiResponse<object>.Fail("Purchase Order tidak ditemukan.", 404));

        var validStatuses = new[] { "DRAFT", "PENDING", "APPROVED", "CANCELLED" };
        var newStatus = dto.Status.ToUpperInvariant();

        if (!validStatuses.Contains(newStatus))
        {
            return BadRequest(ApiResponse<object>.Fail("Status yang diberikan tidak valid.", 400));
        }

        po.Status = newStatus;
        await _context.SaveChangesAsync();

        return Ok(ApiResponse<object>.Ok(new { id, status = po.Status }, $"Status PO berhasil diperbarui menjadi {po.Status}."));
    }

    [Authorize(Roles = "ROLE_ADMIN,ROLE_MANAGER,ROLE_STAFF")]
    [HttpPost("{id:int}/receive")]
    public async Task<ActionResult<ApiResponse<object>>> ReceivePurchaseOrder(int id, [FromBody] ReceivePurchaseOrderDto dto)
    {
        if (CurrentUserId == null)
        {
            return Unauthorized(ApiResponse<object>.Fail("Pengguna tidak terautentikasi.", 401));
        }

        var po = await _context.PurchaseOrders
            .Include(p => p.Items).ThenInclude(i => i.Product)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (po == null) return NotFound(ApiResponse<object>.Fail("Purchase Order tidak ditemukan.", 404));

        if (po.Status != "APPROVED")
        {
            return BadRequest(ApiResponse<object>.Fail("Hanya PO dengan status 'APPROVED' yang dapat diproses penerimaan barangnya.", 400));
        }

        var warehouse = await _context.Warehouses.FindAsync(dto.TargetWarehouseId);
        if (warehouse == null) return NotFound(ApiResponse<object>.Fail("Gudang tujuan tidak ditemukan.", 404));

        try
        {
            foreach (var item in po.Items)
            {
                item.ReceivedQuantity = item.OrderedQuantity;

                var binLoc = string.IsNullOrWhiteSpace(dto.BinLocation) ? "DEFAULT" : dto.BinLocation.Trim();
                var stock = await _context.InventoryStocks
                    .FirstOrDefaultAsync(s => s.ProductId == item.ProductId && s.WarehouseId == dto.TargetWarehouseId && s.BinLocation == binLoc);

                if (stock == null)
                {
                    stock = new InventoryStock
                    {
                        ProductId = item.ProductId,
                        WarehouseId = dto.TargetWarehouseId,
                        BinLocation = binLoc,
                        QuantityOnHand = item.OrderedQuantity,
                        QuantityAllocated = 0,
                        QuantityAvailable = item.OrderedQuantity,
                        LastCountedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    };
                    await _context.InventoryStocks.AddAsync(stock);
                }
                else
                {
                    stock.QuantityOnHand += item.OrderedQuantity;
                    stock.QuantityAvailable = Math.Max(0, stock.QuantityOnHand - stock.QuantityAllocated);
                    stock.UpdatedAt = DateTime.UtcNow;
                }

                // Log Inbound Transaction with unique reference number
                var trx = new StockTransaction
                {
                    ReferenceNumber = $"TRX-INB-PO-{po.PoNumber}-{item.ProductId}-{Guid.NewGuid().ToString("N")[..6].ToUpper()}",
                    TransactionType = "INBOUND",
                    ProductId = item.ProductId,
                    SourceWarehouseId = null,
                    TargetWarehouseId = dto.TargetWarehouseId,
                    Quantity = item.OrderedQuantity,
                    Notes = $"Penerimaan barang dari PO #{po.PoNumber} ({item.Product.Name})",
                    CreatedByUserId = CurrentUserId.Value
                };
                await _context.StockTransactions.AddAsync(trx);
            }

            po.Status = "RECEIVED";
            await _context.SaveChangesAsync();

            return Ok(ApiResponse<object>.Ok(new { id, status = "RECEIVED" }, "Barang dari PO berhasil diterima dan stok gudang telah diperbarui."));
        }
        catch (Exception ex)
        {
            return StatusCode(500, ApiResponse<object>.Fail($"Gagal menerima barang: {ex.Message}", 500));
        }
    }
}
