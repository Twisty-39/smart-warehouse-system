using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmartWarehouse.Api.Data;
using SmartWarehouse.Api.DTOs.Categories;
using SmartWarehouse.Api.DTOs.Common;
using SmartWarehouse.Api.Models.Entities;

namespace SmartWarehouse.Api.Controllers;

[Authorize]
public class CategoriesController : BaseApiController
{
    private readonly AppDbContext _context;

    public CategoriesController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<List<CategoryDto>>>> GetCategories([FromQuery] string? search)
    {
        var query = _context.Categories
            .AsNoTracking()
            .Include(c => c.ParentCategory)
            .Include(c => c.Products)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim().ToLower();
            query = query.Where(c => c.Name.ToLower().Contains(s) || c.Code.ToLower().Contains(s));
        }

        var categories = await query
            .OrderBy(c => c.Name)
            .Select(c => new CategoryDto
            {
                Id = c.Id,
                Name = c.Name,
                Code = c.Code,
                Description = c.Description,
                ParentCategoryId = c.ParentCategoryId,
                ParentCategoryName = c.ParentCategory != null ? c.ParentCategory.Name : null,
                ProductCount = c.Products.Count,
                CreatedAt = c.CreatedAt,
                UpdatedAt = c.UpdatedAt
            })
            .ToListAsync();

        return Ok(ApiResponse<List<CategoryDto>>.Ok(categories, "Daftar kategori berhasil dimuat."));
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<ApiResponse<CategoryDto>>> GetCategoryById(int id)
    {
        var c = await _context.Categories
            .AsNoTracking()
            .Include(c => c.ParentCategory)
            .Include(c => c.Products)
            .FirstOrDefaultAsync(c => c.Id == id);

        if (c == null)
        {
            return NotFound(ApiResponse<CategoryDto>.Fail($"Kategori dengan ID {id} tidak ditemukan.", 404));
        }

        var dto = new CategoryDto
        {
            Id = c.Id,
            Name = c.Name,
            Code = c.Code,
            Description = c.Description,
            ParentCategoryId = c.ParentCategoryId,
            ParentCategoryName = c.ParentCategory != null ? c.ParentCategory.Name : null,
            ProductCount = c.Products.Count,
            CreatedAt = c.CreatedAt,
            UpdatedAt = c.UpdatedAt
        };

        return Ok(ApiResponse<CategoryDto>.Ok(dto, "Detail kategori berhasil dimuat."));
    }

    [Authorize(Roles = "ROLE_ADMIN,ROLE_MANAGER")]
    [HttpPost]
    public async Task<ActionResult<ApiResponse<CategoryDto>>> CreateCategory([FromBody] CreateCategoryDto dto)
    {
        if (await _context.Categories.AnyAsync(c => c.Code.ToLower() == dto.Code.ToLower()))
        {
            return BadRequest(ApiResponse<CategoryDto>.Fail($"Kode kategori '{dto.Code}' sudah ada.", 400));
        }

        var cat = new Category
        {
            Name = dto.Name.Trim(),
            Code = dto.Code.Trim().ToUpper(),
            Description = dto.Description?.Trim(),
            ParentCategoryId = dto.ParentCategoryId
        };

        await _context.Categories.AddAsync(cat);
        await _context.SaveChangesAsync();

        var result = new CategoryDto
        {
            Id = cat.Id,
            Name = cat.Name,
            Code = cat.Code,
            Description = cat.Description,
            ParentCategoryId = cat.ParentCategoryId,
            ProductCount = 0,
            CreatedAt = cat.CreatedAt,
            UpdatedAt = cat.UpdatedAt
        };

        return StatusCode(201, ApiResponse<CategoryDto>.Created(result, "Kategori baru berhasil dibuat."));
    }

    [Authorize(Roles = "ROLE_ADMIN,ROLE_MANAGER")]
    [HttpPut("{id:int}")]
    public async Task<ActionResult<ApiResponse<CategoryDto>>> UpdateCategory(int id, [FromBody] UpdateCategoryDto dto)
    {
        var cat = await _context.Categories.Include(c => c.Products).FirstOrDefaultAsync(c => c.Id == id);
        if (cat == null)
        {
            return NotFound(ApiResponse<CategoryDto>.Fail($"Kategori dengan ID {id} tidak ditemukan.", 404));
        }

        if (await _context.Categories.AnyAsync(c => c.Id != id && c.Code.ToLower() == dto.Code.ToLower()))
        {
            return BadRequest(ApiResponse<CategoryDto>.Fail($"Kode kategori '{dto.Code}' sudah digunakan kategori lain.", 400));
        }

        cat.Name = dto.Name.Trim();
        cat.Code = dto.Code.Trim().ToUpper();
        cat.Description = dto.Description?.Trim();
        cat.ParentCategoryId = dto.ParentCategoryId;

        await _context.SaveChangesAsync();

        var result = new CategoryDto
        {
            Id = cat.Id,
            Name = cat.Name,
            Code = cat.Code,
            Description = cat.Description,
            ParentCategoryId = cat.ParentCategoryId,
            ProductCount = cat.Products.Count,
            CreatedAt = cat.CreatedAt,
            UpdatedAt = cat.UpdatedAt
        };

        return Ok(ApiResponse<CategoryDto>.Ok(result, "Data kategori berhasil diperbarui."));
    }

    [Authorize(Roles = "ROLE_ADMIN,ROLE_MANAGER")]
    [HttpDelete("{id:int}")]
    public async Task<ActionResult<ApiResponse<object>>> DeleteCategory(int id)
    {
        var cat = await _context.Categories.Include(c => c.Products).FirstOrDefaultAsync(c => c.Id == id);
        if (cat == null)
        {
            return NotFound(ApiResponse<object>.Fail($"Kategori dengan ID {id} tidak ditemukan.", 404));
        }

        if (cat.Products.Any())
        {
            return BadRequest(ApiResponse<object>.Fail($"Kategori tidak dapat dihapus karena masih memuat {cat.Products.Count} produk.", 400));
        }

        _context.Categories.Remove(cat);
        await _context.SaveChangesAsync();

        return Ok(ApiResponse<object>.Ok(new { id }, "Kategori berhasil dihapus."));
    }
}
