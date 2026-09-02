using System.Security.Cryptography;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmartWarehouse.Api.Data;
using SmartWarehouse.Api.DTOs.Auth;
using SmartWarehouse.Api.DTOs.Common;
using SmartWarehouse.Api.Models.Entities;
using SmartWarehouse.Api.Services;

namespace SmartWarehouse.Api.Controllers;

public class AuthController : BaseApiController
{
    private readonly AppDbContext _context;
    private readonly IJwtService _jwtService;

    public AuthController(AppDbContext context, IJwtService jwtService)
    {
        _context = context;
        _jwtService = jwtService;
    }

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<AuthResponseDto>>> Login([FromBody] LoginRequestDto dto)
    {
        var normalizedEmail = dto.Email.Trim().ToLower();
        if (normalizedEmail == "purchasing@smartwarehouse.com")
        {
            normalizedEmail = "purchasing.lead@smartwarehouse.com";
        }

        var user = await _context.Users
            .Include(u => u.Role)
            .Include(u => u.Profile)
            .FirstOrDefaultAsync(u => u.Email.ToLower() == normalizedEmail);

        if (user == null || !BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash))
        {
            return Unauthorized(ApiResponse<AuthResponseDto>.Fail("Email atau password yang Anda masukkan salah.", 401));
        }

        if (!user.IsActive)
        {
            return StatusCode(403, ApiResponse<AuthResponseDto>.Fail("Akun Anda telah dinonaktifkan. Silakan hubungi Administrator.", 403));
        }

        var accessToken = _jwtService.GenerateAccessToken(user);
        var refreshToken = _jwtService.GenerateRefreshToken();

        user.RefreshToken = refreshToken;
        user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(7);
        await _context.SaveChangesAsync();

        var responseDto = new AuthResponseDto
        {
            AccessToken = accessToken,
            RefreshToken = refreshToken,
            ExpiresAt = DateTime.UtcNow.AddMinutes(60),
            User = new UserInfoDto
            {
                Id = user.Id,
                Email = user.Email,
                FullName = user.Profile?.FullName ?? user.Email,
                Role = user.Role.Name,
                RoleCode = user.Role.Code,
                PhoneNumber = user.Profile?.PhoneNumber,
                Department = user.Profile?.Department,
                AvatarUrl = user.Profile?.AvatarUrl,
                Address = user.Profile?.Address
            }
        };

        return Ok(ApiResponse<AuthResponseDto>.Ok(responseDto, "Login berhasil. Selamat datang kembali!"));
    }

    [HttpPost("register")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<UserInfoDto>>> Register([FromBody] RegisterRequestDto dto)
    {
        if (await _context.Users.AnyAsync(u => u.Email.ToLower() == dto.Email.ToLower()))
        {
            return BadRequest(ApiResponse<UserInfoDto>.Fail("Alamat email sudah terdaftar di sistem.", 400));
        }

        // Untuk keamanan registrasi publik, tetapkan role default ROLE_STAFF (mencegah eskalasi wewenang)
        var defaultRole = await _context.Roles.FirstOrDefaultAsync(r => r.Code == "ROLE_STAFF")
            ?? await _context.Roles.OrderBy(r => r.Id).FirstOrDefaultAsync();

        if (defaultRole == null)
        {
            return BadRequest(ApiResponse<UserInfoDto>.Fail("Konfigurasi role sistem belum diinisialisasi.", 400));
        }

        var passwordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password);

        var newUser = new User
        {
            Email = dto.Email.Trim().ToLower(),
            PasswordHash = passwordHash,
            RoleId = defaultRole.Id,
            IsActive = true,
            Profile = new UserProfile
            {
                FullName = dto.FullName.Trim(),
                PhoneNumber = dto.PhoneNumber,
                Department = dto.Department,
                AvatarUrl = $"https://ui-avatars.com/api/?name={Uri.EscapeDataString(dto.FullName)}&background=0D8ABC&color=fff"
            }
        };

        await _context.Users.AddAsync(newUser);
        await _context.SaveChangesAsync();

        var userInfo = new UserInfoDto
        {
            Id = newUser.Id,
            Email = newUser.Email,
            FullName = newUser.Profile.FullName,
            Role = defaultRole.Name,
            RoleCode = defaultRole.Code,
            PhoneNumber = newUser.Profile.PhoneNumber,
            Department = newUser.Profile.Department,
            AvatarUrl = newUser.Profile.AvatarUrl
        };

        return StatusCode(201, ApiResponse<UserInfoDto>.Created(userInfo, "Registrasi akun berhasil. Silakan login."));
    }

    [HttpPost("refresh-token")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<AuthResponseDto>>> RefreshToken([FromBody] RefreshTokenRequestDto dto)
    {
        var user = await _context.Users
            .Include(u => u.Role)
            .Include(u => u.Profile)
            .FirstOrDefaultAsync(u => u.RefreshToken == dto.RefreshToken);

        if (user == null || user.RefreshTokenExpiryTime <= DateTime.UtcNow)
        {
            return Unauthorized(ApiResponse<AuthResponseDto>.Fail("Refresh token tidak valid atau sudah kadaluarsa.", 401));
        }

        var newAccessToken = _jwtService.GenerateAccessToken(user);
        var newRefreshToken = _jwtService.GenerateRefreshToken();

        user.RefreshToken = newRefreshToken;
        user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(7);
        await _context.SaveChangesAsync();

        var responseDto = new AuthResponseDto
        {
            AccessToken = newAccessToken,
            RefreshToken = newRefreshToken,
            ExpiresAt = DateTime.UtcNow.AddMinutes(60),
            User = new UserInfoDto
            {
                Id = user.Id,
                Email = user.Email,
                FullName = user.Profile?.FullName ?? user.Email,
                Role = user.Role.Name,
                RoleCode = user.Role.Code,
                PhoneNumber = user.Profile?.PhoneNumber,
                Department = user.Profile?.Department,
                AvatarUrl = user.Profile?.AvatarUrl
            }
        };

        return Ok(ApiResponse<AuthResponseDto>.Ok(responseDto, "Token berhasil diperbarui."));
    }

    [HttpPost("forgot-password")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<OtpResponseDto>>> ForgotPassword([FromBody] ForgotPasswordDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Email))
        {
            return BadRequest(ApiResponse<OtpResponseDto>.Fail("Alamat email wajib diisi.", 400));
        }

        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == dto.Email.Trim().ToLower());
        if (user == null || !user.IsActive)
        {
            return BadRequest(ApiResponse<OtpResponseDto>.Fail("Alamat email tidak terdaftar atau akun dinonaktifkan.", 400));
        }

        var otpCode = RandomNumberGenerator.GetInt32(100000, 999999).ToString();
        user.PasswordResetToken = otpCode;
        user.PasswordResetTokenExpiryTime = DateTime.UtcNow.AddMinutes(5);
        await _context.SaveChangesAsync();

        Console.WriteLine($"[AUTH OTP] Kode OTP 6-Digit untuk {user.Email}: {otpCode} (Kedaluwarsa 5 Menit)");

        var responseData = new OtpResponseDto
        {
            Email = user.Email,
            OtpCode = otpCode,
            Message = "Kode verifikasi OTP 6-digit berhasil dibuat.",
            ExpiresInMinutes = 5
        };

        return Ok(ApiResponse<OtpResponseDto>.Ok(responseData, $"Kode OTP berhasil dikirim untuk {user.Email}. Berlaku selama 5 menit."));
    }

    [HttpPost("resend-otp")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<OtpResponseDto>>> ResendOtp([FromBody] ForgotPasswordDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Email))
        {
            return BadRequest(ApiResponse<OtpResponseDto>.Fail("Alamat email wajib diisi.", 400));
        }

        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == dto.Email.Trim().ToLower());
        if (user == null || !user.IsActive)
        {
            return BadRequest(ApiResponse<OtpResponseDto>.Fail("Pengguna dengan email tersebut tidak ditemukan.", 400));
        }

        var newOtp = RandomNumberGenerator.GetInt32(100000, 999999).ToString();
        user.PasswordResetToken = newOtp;
        user.PasswordResetTokenExpiryTime = DateTime.UtcNow.AddMinutes(5);
        await _context.SaveChangesAsync();

        Console.WriteLine($"[AUTH OTP RESEND] Kode OTP Baru untuk {user.Email}: {newOtp} (Kedaluwarsa 5 Menit)");

        var responseData = new OtpResponseDto
        {
            Email = user.Email,
            OtpCode = newOtp,
            Message = "Kode OTP baru berhasil dibuat.",
            ExpiresInMinutes = 5
        };

        return Ok(ApiResponse<OtpResponseDto>.Ok(responseData, "Kode OTP baru berhasil digenerate. Berlaku selama 5 menit."));
    }

    [HttpPost("verify-otp")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<bool>>> VerifyOtp([FromBody] VerifyOtpDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Email) || string.IsNullOrWhiteSpace(dto.OtpCode))
        {
            return BadRequest(ApiResponse<bool>.Fail("Email dan kode OTP wajib diisi.", 400));
        }

        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == dto.Email.Trim().ToLower());
        if (user == null || string.IsNullOrWhiteSpace(user.PasswordResetToken) || user.PasswordResetToken.Trim() != dto.OtpCode.Trim())
        {
            return BadRequest(ApiResponse<bool>.Fail("Kode OTP salah atau tidak cocok.", 400));
        }

        if (user.PasswordResetTokenExpiryTime == null || user.PasswordResetTokenExpiryTime < DateTime.UtcNow)
        {
            return BadRequest(ApiResponse<bool>.Fail("Kode OTP telah kedaluwarsa. Silakan minta kode baru.", 400));
        }

        return Ok(ApiResponse<bool>.Ok(true, "Kode OTP valid. Silakan tentukan kata sandi baru Anda."));
    }

    [HttpPost("reset-password")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<string>>> ResetPassword([FromBody] ResetPasswordDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Email))
        {
            return BadRequest(ApiResponse<string>.Fail("Alamat email wajib diisi.", 400));
        }

        var tokenOrOtp = !string.IsNullOrWhiteSpace(dto.OtpCode) ? dto.OtpCode.Trim() : (dto.Token ?? "").Trim();
        if (string.IsNullOrWhiteSpace(tokenOrOtp))
        {
            return BadRequest(ApiResponse<string>.Fail("Kode OTP / Token verifikasi wajib disertakan.", 400));
        }

        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == dto.Email.Trim().ToLower());
        if (user == null || string.IsNullOrWhiteSpace(user.PasswordResetToken) || user.PasswordResetToken.Trim() != tokenOrOtp)
        {
            return BadRequest(ApiResponse<string>.Fail("Kode verifikasi OTP tidak valid atau tidak cocok.", 400));
        }

        if (user.PasswordResetTokenExpiryTime == null || user.PasswordResetTokenExpiryTime < DateTime.UtcNow)
        {
            return BadRequest(ApiResponse<string>.Fail("Kode verifikasi OTP telah kedaluwarsa. Silakan ajukan permohonan baru.", 400));
        }

        if (string.IsNullOrWhiteSpace(dto.NewPassword) || dto.NewPassword.Length < 6)
        {
            return BadRequest(ApiResponse<string>.Fail("Kata sandi baru minimal 6 karakter.", 400));
        }

        if (dto.NewPassword != dto.ConfirmNewPassword)
        {
            return BadRequest(ApiResponse<string>.Fail("Konfirmasi kata sandi baru tidak cocok.", 400));
        }

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword);
        user.PasswordResetToken = null;
        user.PasswordResetTokenExpiryTime = null;
        user.RefreshToken = null;
        user.RefreshTokenExpiryTime = null;
        await _context.SaveChangesAsync();

        return Ok(ApiResponse<string>.Ok("Kata sandi berhasil direset", "Kata sandi akun Anda telah berhasil diperbarui. Silakan login kembali dengan kata sandi baru."));
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<ActionResult<ApiResponse<UserInfoDto>>> GetCurrentUser()
    {
        if (CurrentUserId == null)
        {
            return Unauthorized(ApiResponse<UserInfoDto>.Fail("Pengguna tidak terotentikasi.", 401));
        }

        var user = await _context.Users
            .Include(u => u.Role)
            .Include(u => u.Profile)
            .FirstOrDefaultAsync(u => u.Id == CurrentUserId.Value);

        if (user == null)
        {
            return NotFound(ApiResponse<UserInfoDto>.Fail("Data profil pengguna tidak ditemukan.", 404));
        }

        var userInfo = new UserInfoDto
        {
            Id = user.Id,
            Email = user.Email,
            FullName = user.Profile?.FullName ?? user.Email,
            Role = user.Role.Name,
            RoleCode = user.Role.Code,
            PhoneNumber = user.Profile?.PhoneNumber,
            Department = user.Profile?.Department,
            AvatarUrl = user.Profile?.AvatarUrl,
            Address = user.Profile?.Address
        };

        return Ok(ApiResponse<UserInfoDto>.Ok(userInfo, "Data profil berhasil diambil."));
    }

    [Authorize]
    [HttpPost("logout")]
    public async Task<ActionResult<ApiResponse<string>>> Logout()
    {
        if (CurrentUserId != null)
        {
            var user = await _context.Users.FindAsync(CurrentUserId.Value);
            if (user != null)
            {
                user.RefreshToken = null;
                user.RefreshTokenExpiryTime = null;
                await _context.SaveChangesAsync();
            }
        }

        return Ok(ApiResponse<string>.Ok("Logout berhasil", "Sesi login Anda telah diakhiri."));
    }
}
