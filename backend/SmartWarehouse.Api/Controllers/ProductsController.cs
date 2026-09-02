using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmartWarehouse.Api.Data;
using SmartWarehouse.Api.DTOs.Common;
using SmartWarehouse.Api.DTOs.Products;
using SmartWarehouse.Api.Models.Entities;

namespace SmartWarehouse.Api.Controllers;

[Authorize]
public class ProductsController : BaseApiController
{
    private readonly AppDbContext _context;

    public ProductsController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<PagedResponse<ProductDto>>> GetProducts([FromQuery] QueryParameters query)
    {
        var queryable = _context.Products
            .AsNoTracking()
            .Include(p => p.Category)
            .Include(p => p.Stocks)
            .AsQueryable();

        // 1. Search Filter (SKU, Barcode, Name, Description)
        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var search = query.Search.Trim().ToLower();
            queryable = queryable.Where(p =>
                p.Name.ToLower().Contains(search) ||
                p.Sku.ToLower().Contains(search) ||
                p.Barcode.ToLower().Contains(search) ||
                (p.Description != null && p.Description.ToLower().Contains(search)));
        }

        // 2. Category Filter
        if (query.CategoryId.HasValue && query.CategoryId.Value > 0)
        {
            queryable = queryable.Where(p => p.CategoryId == query.CategoryId.Value);
        }

        // 3. Status / Stock Level Filter
        if (!string.IsNullOrWhiteSpace(query.Status))
        {
            if (query.Status.Equals("low_stock", StringComparison.OrdinalIgnoreCase))
            {
                queryable = queryable.Where(p => p.Stocks.Sum(s => s.QuantityOnHand) <= p.ReorderLevel);
            }
            else if (query.Status.Equals("out_of_stock", StringComparison.OrdinalIgnoreCase))
            {
                queryable = queryable.Where(p => p.Stocks.Sum(s => s.QuantityOnHand) == 0);
            }
        }

        // 4. Date Range Filter
        if (query.StartDate.HasValue)
        {
            queryable = queryable.Where(p => p.CreatedAt >= query.StartDate.Value);
        }
        if (query.EndDate.HasValue)
        {
            queryable = queryable.Where(p => p.CreatedAt <= query.EndDate.Value);
        }

        // 5. Sorting
        var isAsc = query.SortDir?.ToLower() == "asc";
        queryable = query.SortBy?.ToLower() switch
        {
            "name" => isAsc ? queryable.OrderBy(p => p.Name) : queryable.OrderByDescending(p => p.Name),
            "sku" => isAsc ? queryable.OrderBy(p => p.Sku) : queryable.OrderByDescending(p => p.Sku),
            "unitprice" => isAsc ? queryable.OrderBy(p => p.UnitPrice) : queryable.OrderByDescending(p => p.UnitPrice),
            "costprice" => isAsc ? queryable.OrderBy(p => p.CostPrice) : queryable.OrderByDescending(p => p.CostPrice),
            _ => isAsc ? queryable.OrderBy(p => p.CreatedAt) : queryable.OrderByDescending(p => p.CreatedAt)
        };

        var totalCount = await queryable.CountAsync();

        var items = await queryable
            .Skip((query.Page - 1) * query.Limit)
            .Take(query.Limit)
            .Select(p => new ProductDto
            {
                Id = p.Id,
                Sku = p.Sku,
                Barcode = p.Barcode,
                Name = p.Name,
                Description = p.Description,
                UnitPrice = p.UnitPrice,
                CostPrice = p.CostPrice,
                ReorderLevel = p.ReorderLevel,
                MinStock = p.MinStock,
                MaxStock = p.MaxStock,
                UnitOfMeasure = p.UnitOfMeasure,
                CategoryId = p.CategoryId,
                CategoryName = p.Category.Name,
                ImageUrl = p.ImageUrl,
                TotalStockOnHand = p.Stocks.Sum(s => s.QuantityOnHand),
                TotalStockAvailable = p.Stocks.Sum(s => s.QuantityAvailable),
                CreatedAt = p.CreatedAt,
                UpdatedAt = p.UpdatedAt
            })
            .ToListAsync();

        return Ok(PagedResponse<ProductDto>.Create(items, totalCount, query.Page, query.Limit, "Daftar produk berhasil dimuat."));
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<ApiResponse<ProductDto>>> GetProductById(int id)
    {
        var product = await _context.Products
            .AsNoTracking()
            .Include(p => p.Category)
            .Include(p => p.Stocks).ThenInclude(s => s.Warehouse)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (product == null)
        {
            return NotFound(ApiResponse<ProductDto>.Fail($"Produk dengan ID {id} tidak ditemukan.", 404));
        }

        var dto = new ProductDto
        {
            Id = product.Id,
            Sku = product.Sku,
            Barcode = product.Barcode,
            Name = product.Name,
            Description = product.Description,
            UnitPrice = product.UnitPrice,
            CostPrice = product.CostPrice,
            ReorderLevel = product.ReorderLevel,
            MinStock = product.MinStock,
            MaxStock = product.MaxStock,
            UnitOfMeasure = product.UnitOfMeasure,
            CategoryId = product.CategoryId,
            CategoryName = product.Category.Name,
            ImageUrl = product.ImageUrl,
            TotalStockOnHand = product.Stocks.Sum(s => s.QuantityOnHand),
            TotalStockAvailable = product.Stocks.Sum(s => s.QuantityAvailable),
            CreatedAt = product.CreatedAt,
            UpdatedAt = product.UpdatedAt
        };

        return Ok(ApiResponse<ProductDto>.Ok(dto, "Detail produk berhasil dimuat."));
    }

    [Authorize(Roles = "ROLE_ADMIN,ROLE_MANAGER")]
    [HttpPost]
    public async Task<ActionResult<ApiResponse<ProductDto>>> CreateProduct([FromBody] CreateProductDto dto)
    {
        if (await _context.Products.AnyAsync(p => p.Sku.ToLower() == dto.Sku.ToLower()))
        {
            return BadRequest(ApiResponse<ProductDto>.Fail($"SKU '{dto.Sku}' sudah digunakan.", 400));
        }

        if (await _context.Products.AnyAsync(p => p.Barcode.ToLower() == dto.Barcode.ToLower()))
        {
            return BadRequest(ApiResponse<ProductDto>.Fail($"Barcode '{dto.Barcode}' sudah digunakan.", 400));
        }

        var category = await _context.Categories.FindAsync(dto.CategoryId);
        if (category == null)
        {
            return BadRequest(ApiResponse<ProductDto>.Fail("Kategori produk tidak ditemukan.", 400));
        }

        var product = new Product
        {
            Sku = dto.Sku.Trim().ToUpper(),
            Barcode = dto.Barcode.Trim(),
            Name = dto.Name.Trim(),
            Description = dto.Description?.Trim(),
            UnitPrice = dto.UnitPrice,
            CostPrice = dto.CostPrice,
            ReorderLevel = dto.ReorderLevel,
            MinStock = dto.MinStock,
            MaxStock = dto.MaxStock,
            UnitOfMeasure = dto.UnitOfMeasure.Trim().ToUpper(),
            CategoryId = dto.CategoryId,
            ImageUrl = dto.ImageUrl
        };

        await _context.Products.AddAsync(product);
        await _context.SaveChangesAsync();

        var resultDto = new ProductDto
        {
            Id = product.Id,
            Sku = product.Sku,
            Barcode = product.Barcode,
            Name = product.Name,
            Description = product.Description,
            UnitPrice = product.UnitPrice,
            CostPrice = product.CostPrice,
            ReorderLevel = product.ReorderLevel,
            MinStock = product.MinStock,
            MaxStock = product.MaxStock,
            UnitOfMeasure = product.UnitOfMeasure,
            CategoryId = product.CategoryId,
            CategoryName = category.Name,
            ImageUrl = product.ImageUrl,
            TotalStockOnHand = 0,
            TotalStockAvailable = 0,
            CreatedAt = product.CreatedAt,
            UpdatedAt = product.UpdatedAt
        };

        return StatusCode(201, ApiResponse<ProductDto>.Created(resultDto, "Produk baru berhasil ditambahkan."));
    }

    [Authorize(Roles = "ROLE_ADMIN,ROLE_MANAGER")]
    [HttpPut("{id:int}")]
    public async Task<ActionResult<ApiResponse<ProductDto>>> UpdateProduct(int id, [FromBody] UpdateProductDto dto)
    {
        var product = await _context.Products
            .Include(p => p.Category)
            .Include(p => p.Stocks)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (product == null)
        {
            return NotFound(ApiResponse<ProductDto>.Fail($"Produk dengan ID {id} tidak ditemukan.", 404));
        }

        if (await _context.Products.AnyAsync(p => p.Id != id && p.Sku.ToLower() == dto.Sku.ToLower()))
        {
            return BadRequest(ApiResponse<ProductDto>.Fail($"SKU '{dto.Sku}' sudah digunakan oleh produk lain.", 400));
        }

        if (await _context.Products.AnyAsync(p => p.Id != id && p.Barcode.ToLower() == dto.Barcode.ToLower()))
        {
            return BadRequest(ApiResponse<ProductDto>.Fail($"Barcode '{dto.Barcode}' sudah digunakan oleh produk lain.", 400));
        }

        var category = await _context.Categories.FindAsync(dto.CategoryId);
        if (category == null)
        {
            return BadRequest(ApiResponse<ProductDto>.Fail("Kategori produk tidak ditemukan.", 400));
        }

        product.Sku = dto.Sku.Trim().ToUpper();
        product.Barcode = dto.Barcode.Trim();
        product.Name = dto.Name.Trim();
        product.Description = dto.Description?.Trim();
        product.UnitPrice = dto.UnitPrice;
        product.CostPrice = dto.CostPrice;
        product.ReorderLevel = dto.ReorderLevel;
        product.MinStock = dto.MinStock;
        product.MaxStock = dto.MaxStock;
        product.UnitOfMeasure = dto.UnitOfMeasure.Trim().ToUpper();
        product.CategoryId = dto.CategoryId;
        if (!string.IsNullOrEmpty(dto.ImageUrl))
        {
            product.ImageUrl = dto.ImageUrl;
        }

        await _context.SaveChangesAsync();

        var resultDto = new ProductDto
        {
            Id = product.Id,
            Sku = product.Sku,
            Barcode = product.Barcode,
            Name = product.Name,
            Description = product.Description,
            UnitPrice = product.UnitPrice,
            CostPrice = product.CostPrice,
            ReorderLevel = product.ReorderLevel,
            MinStock = product.MinStock,
            MaxStock = product.MaxStock,
            UnitOfMeasure = product.UnitOfMeasure,
            CategoryId = product.CategoryId,
            CategoryName = category.Name,
            ImageUrl = product.ImageUrl,
            TotalStockOnHand = product.Stocks.Sum(s => s.QuantityOnHand),
            TotalStockAvailable = product.Stocks.Sum(s => s.QuantityAvailable),
            CreatedAt = product.CreatedAt,
            UpdatedAt = product.UpdatedAt
        };

        return Ok(ApiResponse<ProductDto>.Ok(resultDto, "Data produk berhasil diperbarui."));
    }

    [Authorize(Roles = "ROLE_ADMIN,ROLE_MANAGER")]
    [HttpDelete("{id:int}")]
    public async Task<ActionResult<ApiResponse<object>>> DeleteProduct(int id)
    {
        var product = await _context.Products.FindAsync(id);
        if (product == null)
        {
            return NotFound(ApiResponse<object>.Fail($"Produk dengan ID {id} tidak ditemukan.", 404));
        }

        // Soft Delete implementation
        product.IsDeleted = true;
        product.DeletedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return Ok(ApiResponse<object>.Ok(new { id, isDeleted = true }, "Produk berhasil dihapus (Soft Delete)."));
    }
}
