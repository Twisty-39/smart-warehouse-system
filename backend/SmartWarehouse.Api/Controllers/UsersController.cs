using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmartWarehouse.Api.Data;
using SmartWarehouse.Api.DTOs.Common;
using SmartWarehouse.Api.DTOs.Users;
using SmartWarehouse.Api.Models.Entities;

namespace SmartWarehouse.Api.Controllers;

[Authorize]
public class UsersController : BaseApiController
{
    private readonly AppDbContext _context;

    public UsersController(AppDbContext context)
    {
        _context = context;
    }

    [Authorize(Roles = "ROLE_ADMIN,ROLE_MANAGER")]
    [HttpGet]
    public async Task<ActionResult<PagedResponse<UserDto>>> GetUsers([FromQuery] QueryParameters query)
    {
        var queryable = _context.Users
            .AsNoTracking()
            .Include(u => u.Role)
            .Include(u => u.Profile)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var s = query.Search.Trim().ToLower();
            queryable = queryable.Where(u =>
                u.Email.ToLower().Contains(s) ||
                (u.Profile != null && u.Profile.FullName.ToLower().Contains(s)) ||
                (u.Profile != null && u.Profile.Department != null && u.Profile.Department.ToLower().Contains(s)));
        }

        if (query.CategoryId.HasValue && query.CategoryId.Value > 0) // used here as RoleId filter
        {
            queryable = queryable.Where(u => u.RoleId == query.CategoryId.Value);
        }

        var isAsc = query.SortDir?.ToLower() == "asc";
        queryable = query.SortBy?.ToLower() switch
        {
            "email" => isAsc ? queryable.OrderBy(u => u.Email) : queryable.OrderByDescending(u => u.Email),
            "role" => isAsc ? queryable.OrderBy(u => u.Role.Name) : queryable.OrderByDescending(u => u.Role.Name),
            _ => isAsc ? queryable.OrderBy(u => u.CreatedAt) : queryable.OrderByDescending(u => u.CreatedAt)
        };

        var totalCount = await queryable.CountAsync();

        var items = await queryable
            .Skip((query.Page - 1) * query.Limit)
            .Take(query.Limit)
            .Select(u => new UserDto
            {
                Id = u.Id,
                Email = u.Email,
                RoleId = u.RoleId,
                RoleName = u.Role.Name,
                Role = u.Role.Name,
                RoleCode = u.Role.Code,
                IsActive = u.IsActive,
                FullName = u.Profile != null ? u.Profile.FullName : u.Email,
                PhoneNumber = u.Profile != null ? u.Profile.PhoneNumber : null,
                AvatarUrl = u.Profile != null ? u.Profile.AvatarUrl : null,
                Department = u.Profile != null ? u.Profile.Department : null,
                Address = u.Profile != null ? u.Profile.Address : null,
                CreatedAt = u.CreatedAt,
                UpdatedAt = u.UpdatedAt
            })
            .ToListAsync();

        return Ok(PagedResponse<UserDto>.Create(items, totalCount, query.Page, query.Limit, "Daftar pengguna berhasil dimuat."));
    }

    [Authorize(Roles = "ROLE_ADMIN,ROLE_MANAGER")]
    [HttpGet("roles")]
    public async Task<ActionResult<ApiResponse<List<Role>>>> GetRoles()
    {
        var roles = await _context.Roles.AsNoTracking().OrderBy(r => r.Id).ToListAsync();
        return Ok(ApiResponse<List<Role>>.Ok(roles, "Daftar role berhasil dimuat."));
    }

    [Authorize(Roles = "ROLE_ADMIN,ROLE_MANAGER")]
    [HttpGet("{id:int}")]
    public async Task<ActionResult<ApiResponse<UserDto>>> GetUserById(int id)
    {
        var u = await _context.Users
            .AsNoTracking()
            .Include(u => u.Role)
            .Include(u => u.Profile)
            .FirstOrDefaultAsync(u => u.Id == id);

        if (u == null)
        {
            return NotFound(ApiResponse<UserDto>.Fail($"Pengguna dengan ID {id} tidak ditemukan.", 404));
        }

        var dto = new UserDto
        {
            Id = u.Id,
            Email = u.Email,
            RoleId = u.RoleId,
            RoleName = u.Role.Name,
            Role = u.Role.Name,
            RoleCode = u.Role.Code,
            IsActive = u.IsActive,
            FullName = u.Profile != null ? u.Profile.FullName : u.Email,
            PhoneNumber = u.Profile != null ? u.Profile.PhoneNumber : null,
            AvatarUrl = u.Profile != null ? u.Profile.AvatarUrl : null,
            Department = u.Profile != null ? u.Profile.Department : null,
            Address = u.Profile != null ? u.Profile.Address : null,
            CreatedAt = u.CreatedAt,
            UpdatedAt = u.UpdatedAt
        };

        return Ok(ApiResponse<UserDto>.Ok(dto, "Detail pengguna berhasil dimuat."));
    }

    [Authorize(Roles = "ROLE_ADMIN")]
    [HttpPost]
    public async Task<ActionResult<ApiResponse<UserDto>>> CreateUser([FromBody] CreateUserDto dto)
    {
        if (await _context.Users.AnyAsync(u => u.Email.ToLower() == dto.Email.ToLower()))
        {
            return BadRequest(ApiResponse<UserDto>.Fail("Alamat email sudah digunakan.", 400));
        }

        var role = await _context.Roles.FindAsync(dto.RoleId);
        if (role == null)
        {
            return BadRequest(ApiResponse<UserDto>.Fail("Role tidak ditemukan.", 400));
        }

        var user = new User
        {
            Email = dto.Email.Trim().ToLower(),
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
            RoleId = dto.RoleId,
            IsActive = true,
            Profile = new UserProfile
            {
                FullName = dto.FullName.Trim(),
                PhoneNumber = dto.PhoneNumber,
                Department = dto.Department,
                Address = dto.Address,
                AvatarUrl = $"https://ui-avatars.com/api/?name={Uri.EscapeDataString(dto.FullName)}&background=0D8ABC&color=fff"
            }
        };

        await _context.Users.AddAsync(user);
        await _context.SaveChangesAsync();

        var result = new UserDto
        {
            Id = user.Id,
            Email = user.Email,
            RoleId = user.RoleId,
            RoleName = role.Name,
            RoleCode = role.Code,
            IsActive = user.IsActive,
            FullName = user.Profile.FullName,
            PhoneNumber = user.Profile.PhoneNumber,
            Department = user.Profile.Department,
            AvatarUrl = user.Profile.AvatarUrl,
            Address = user.Profile.Address,
            CreatedAt = user.CreatedAt,
            UpdatedAt = user.UpdatedAt
        };

        return StatusCode(201, ApiResponse<UserDto>.Created(result, "Pengguna baru berhasil dibuat."));
    }

    [Authorize(Roles = "ROLE_ADMIN")]
    [HttpPut("{id:int}")]
    public async Task<ActionResult<ApiResponse<UserDto>>> UpdateUser(int id, [FromBody] UpdateUserDto dto)
    {
        var user = await _context.Users
            .Include(u => u.Role)
            .Include(u => u.Profile)
            .FirstOrDefaultAsync(u => u.Id == id);

        if (user == null)
        {
            return NotFound(ApiResponse<UserDto>.Fail($"Pengguna dengan ID {id} tidak ditemukan.", 404));
        }

        if (dto.RoleId.HasValue)
        {
            var role = await _context.Roles.FindAsync(dto.RoleId.Value);
            if (role != null) user.RoleId = dto.RoleId.Value;
        }

        if (dto.IsActive.HasValue)
        {
            user.IsActive = dto.IsActive.Value;
        }

        if (user.Profile == null)
        {
            user.Profile = new UserProfile { UserId = user.Id, FullName = user.Email };
        }

        if (!string.IsNullOrEmpty(dto.FullName)) user.Profile.FullName = dto.FullName.Trim();
        if (dto.PhoneNumber != null) user.Profile.PhoneNumber = dto.PhoneNumber.Trim();
        if (dto.Department != null) user.Profile.Department = dto.Department.Trim();
        if (dto.Address != null) user.Profile.Address = dto.Address.Trim();
        if (dto.AvatarUrl != null) user.Profile.AvatarUrl = dto.AvatarUrl.Trim();

        await _context.SaveChangesAsync();

        var result = new UserDto
        {
            Id = user.Id,
            Email = user.Email,
            RoleId = user.RoleId,
            RoleName = user.Role.Name,
            Role = user.Role.Name,
            RoleCode = user.Role.Code,
            IsActive = user.IsActive,
            FullName = user.Profile.FullName,
            PhoneNumber = user.Profile.PhoneNumber,
            Department = user.Profile.Department,
            AvatarUrl = user.Profile.AvatarUrl,
            Address = user.Profile.Address,
            CreatedAt = user.CreatedAt,
            UpdatedAt = user.UpdatedAt
        };

        return Ok(ApiResponse<UserDto>.Ok(result, "Data pengguna berhasil diperbarui."));
    }

    [HttpPut("profile")]
    public async Task<ActionResult<ApiResponse<UserDto>>> UpdateProfile([FromBody] UpdateProfileDto dto)
    {
        if (CurrentUserId == null) return Unauthorized(ApiResponse<UserDto>.Fail("Pengguna tidak terautentikasi.", 401));

        var user = await _context.Users
            .Include(u => u.Role)
            .Include(u => u.Profile)
            .FirstOrDefaultAsync(u => u.Id == CurrentUserId.Value);

        if (user == null) return NotFound(ApiResponse<UserDto>.Fail("Profil pengguna tidak ditemukan.", 404));

        if (user.Profile == null)
        {
            user.Profile = new UserProfile { UserId = user.Id, FullName = user.Email };
        }

        user.Profile.FullName = dto.FullName.Trim();
        user.Profile.PhoneNumber = dto.PhoneNumber?.Trim();
        user.Profile.Department = dto.Department?.Trim();
        user.Profile.Address = dto.Address?.Trim();
        if (!string.IsNullOrEmpty(dto.AvatarUrl))
        {
            user.Profile.AvatarUrl = dto.AvatarUrl;
        }

        await _context.SaveChangesAsync();

        var result = new UserDto
        {
            Id = user.Id,
            Email = user.Email,
            RoleId = user.RoleId,
            RoleName = user.Role.Name,
            Role = user.Role.Name,
            RoleCode = user.Role.Code,
            IsActive = user.IsActive,
            FullName = user.Profile.FullName,
            PhoneNumber = user.Profile.PhoneNumber,
            Department = user.Profile.Department,
            AvatarUrl = user.Profile.AvatarUrl,
            Address = user.Profile.Address,
            CreatedAt = user.CreatedAt,
            UpdatedAt = user.UpdatedAt
        };

        return Ok(ApiResponse<UserDto>.Ok(result, "Profil berhasil diperbarui."));
    }

    [HttpPost("change-password")]
    public async Task<ActionResult<ApiResponse<string>>> ChangePassword([FromBody] ChangePasswordDto dto)
    {
        if (CurrentUserId == null) return Unauthorized(ApiResponse<string>.Fail("Pengguna tidak terautentikasi.", 401));

        var user = await _context.Users.FindAsync(CurrentUserId.Value);
        if (user == null) return NotFound(ApiResponse<string>.Fail("Pengguna tidak ditemukan.", 404));

        if (!BCrypt.Net.BCrypt.Verify(dto.CurrentPassword, user.PasswordHash))
        {
            return BadRequest(ApiResponse<string>.Fail("Password saat ini salah.", 400));
        }

        if (dto.NewPassword != dto.ConfirmNewPassword)
        {
            return BadRequest(ApiResponse<string>.Fail("Konfirmasi password baru tidak cocok.", 400));
        }

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword);
        await _context.SaveChangesAsync();

        return Ok(ApiResponse<string>.Ok("Password berhasil diganti", "Password akun Anda telah berhasil diperbarui."));
    }
}
