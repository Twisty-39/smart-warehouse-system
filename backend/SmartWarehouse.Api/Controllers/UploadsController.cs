using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SmartWarehouse.Api.DTOs.Common;
using SmartWarehouse.Api.Services;

namespace SmartWarehouse.Api.Controllers;

[Authorize]
public class UploadsController : BaseApiController
{
    private readonly IFileUploadService _fileUploadService;

    public UploadsController(IFileUploadService fileUploadService)
    {
        _fileUploadService = fileUploadService;
    }

    [HttpPost("image")]
    public async Task<ActionResult<ApiResponse<object>>> UploadImage([FromForm] IFormFile file, [FromQuery] string? folder)
    {
        try
        {
            var sub = string.IsNullOrWhiteSpace(folder) ? "products" : folder.Trim();
            var relativeUrl = await _fileUploadService.SaveImageAsync(file, sub);
            return Ok(ApiResponse<object>.Ok(new
            {
                fileUrl = relativeUrl,
                fileName = file.FileName,
                fileSizeBytes = file.Length
            }, "Berkas gambar berhasil diunggah."));
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ApiResponse<object>.Fail(ex.Message, 400));
        }
        catch (Exception ex)
        {
            return StatusCode(500, ApiResponse<object>.Fail($"Gagal mengunggah berkas gambar: {ex.Message}", 500));
        }
    }

    [HttpPost("document")]
    public async Task<ActionResult<ApiResponse<object>>> UploadDocument([FromForm] IFormFile file, [FromQuery] string? folder)
    {
        try
        {
            var sub = string.IsNullOrWhiteSpace(folder) ? "documents" : folder.Trim();
            var relativeUrl = await _fileUploadService.SaveDocumentAsync(file, sub);
            return Ok(ApiResponse<object>.Ok(new
            {
                fileUrl = relativeUrl,
                fileName = file.FileName,
                fileSizeBytes = file.Length
            }, "Berkas dokumen PDF berhasil diunggah."));
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ApiResponse<object>.Fail(ex.Message, 400));
        }
        catch (Exception ex)
        {
            return StatusCode(500, ApiResponse<object>.Fail($"Gagal mengunggah dokumen: {ex.Message}", 500));
        }
    }
}
