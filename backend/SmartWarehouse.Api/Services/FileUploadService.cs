using System.Text.RegularExpressions;

namespace SmartWarehouse.Api.Services;

public interface IFileUploadService
{
    Task<string> SaveImageAsync(IFormFile file, string subFolder = "products");
    Task<string> SaveDocumentAsync(IFormFile file, string subFolder = "documents");
}

public class FileUploadService : IFileUploadService
{
    private readonly IWebHostEnvironment _env;
    private readonly string[] _allowedImageExtensions = { ".jpg", ".jpeg", ".png", ".webp", ".gif" };
    private readonly string[] _allowedDocExtensions = { ".pdf", ".doc", ".docx", ".xls", ".xlsx" };
    private readonly HashSet<string> _allowedImageFolders = new(StringComparer.OrdinalIgnoreCase) { "products", "avatars", "general" };
    private readonly HashSet<string> _allowedDocFolders = new(StringComparer.OrdinalIgnoreCase) { "documents", "purchase-orders", "reports" };

    public FileUploadService(IWebHostEnvironment env)
    {
        _env = env;
    }

    public async Task<string> SaveImageAsync(IFormFile file, string subFolder = "products")
    {
        if (file == null || file.Length == 0)
        {
            throw new ArgumentException("Berkas gambar tidak ditemukan.");
        }

        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!_allowedImageExtensions.Contains(ext))
        {
            throw new ArgumentException($"Format gambar tidak didukung ({ext}). Harap gunakan: {string.Join(", ", _allowedImageExtensions)}");
        }

        if (file.Length > 5 * 1024 * 1024) // 5 MB
        {
            throw new ArgumentException("Ukuran gambar maksimal adalah 5MB.");
        }

        // Sanitasi nama folder untuk mencegah Path Traversal
        var safeFolder = SanitizeSubFolder(subFolder, _allowedImageFolders, "products");

        var webRoot = _env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
        var uploadsFolder = Path.Combine(webRoot, "uploads", "images", safeFolder);
        Directory.CreateDirectory(uploadsFolder);

        var uniqueFileName = $"{Guid.NewGuid():N}{ext}";
        var filePath = Path.Combine(uploadsFolder, uniqueFileName);

        using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        return $"/uploads/images/{safeFolder}/{uniqueFileName}";
    }

    public async Task<string> SaveDocumentAsync(IFormFile file, string subFolder = "documents")
    {
        if (file == null || file.Length == 0)
        {
            throw new ArgumentException("Berkas dokumen tidak ditemukan.");
        }

        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!_allowedDocExtensions.Contains(ext))
        {
            throw new ArgumentException($"Format dokumen tidak didukung ({ext}). Harap gunakan: {string.Join(", ", _allowedDocExtensions)}");
        }

        if (file.Length > 10 * 1024 * 1024) // 10 MB
        {
            throw new ArgumentException("Ukuran dokumen maksimal adalah 10MB.");
        }

        // Sanitasi nama folder untuk mencegah Path Traversal
        var safeFolder = SanitizeSubFolder(subFolder, _allowedDocFolders, "documents");

        var webRoot = _env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
        var uploadsFolder = Path.Combine(webRoot, "uploads", safeFolder);
        Directory.CreateDirectory(uploadsFolder);

        var uniqueFileName = $"{Guid.NewGuid():N}{ext}";
        var filePath = Path.Combine(uploadsFolder, uniqueFileName);

        using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        return $"/uploads/{safeFolder}/{uniqueFileName}";
    }

    private static string SanitizeSubFolder(string folder, HashSet<string> whitelist, string defaultFolder)
    {
        if (string.IsNullOrWhiteSpace(folder)) return defaultFolder;

        var clean = Regex.Replace(folder.Trim().ToLowerInvariant(), @"[^a-z0-9_-]", "");
        return whitelist.Contains(clean) ? clean : defaultFolder;
    }
}
