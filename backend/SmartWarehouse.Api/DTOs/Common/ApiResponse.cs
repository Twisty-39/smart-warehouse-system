namespace SmartWarehouse.Api.DTOs.Common;

public class ApiResponse<T>
{
    public bool Success { get; set; } = true;
    public int StatusCode { get; set; } = 200;
    public string Message { get; set; } = string.Empty;
    public T? Data { get; set; }
    public IDictionary<string, string[]>? Errors { get; set; }

    public static ApiResponse<T> Ok(T data, string message = "Operasi berhasil dilakukan.") =>
        new() { Success = true, StatusCode = 200, Message = message, Data = data };

    public static ApiResponse<T> Created(T data, string message = "Data berhasil dibuat.") =>
        new() { Success = true, StatusCode = 201, Message = message, Data = data };

    public static ApiResponse<T> Fail(string message, int statusCode = 400, IDictionary<string, string[]>? errors = null) =>
        new() { Success = false, StatusCode = statusCode, Message = message, Errors = errors };
}

public class PagedResponse<T>
{
    public bool Success { get; set; } = true;
    public int StatusCode { get; set; } = 200;
    public string Message { get; set; } = "Daftar data berhasil diambil.";
    public IEnumerable<T> Data { get; set; } = new List<T>();
    public PaginationMeta Meta { get; set; } = new();

    public static PagedResponse<T> Create(IEnumerable<T> items, int totalCount, int page, int pageSize, string message = "Daftar data berhasil diambil.")
    {
        var totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);
        return new PagedResponse<T>
        {
            Success = true,
            StatusCode = 200,
            Message = message,
            Data = items,
            Meta = new PaginationMeta
            {
                CurrentPage = page,
                PageSize = pageSize,
                TotalCount = totalCount,
                TotalPages = totalPages,
                HasPrevious = page > 1,
                HasNext = page < totalPages
            }
        };
    }
}

public class PaginationMeta
{
    public int CurrentPage { get; set; } = 1;
    public int PageSize { get; set; } = 10;
    public int TotalCount { get; set; } = 0;
    public int TotalPages { get; set; } = 0;
    public bool HasPrevious { get; set; } = false;
    public bool HasNext { get; set; } = false;
}

public class QueryParameters
{
    private const int MaxPageSize = 10000;
    private int _pageSize = 10;

    public int Page { get; set; } = 1;

    public int Limit
    {
        get => _pageSize;
        set => _pageSize = value > MaxPageSize ? MaxPageSize : (value < 1 ? 10 : value);
    }

    public string? Search { get; set; }
    public string? Status { get; set; }
    public int? CategoryId { get; set; }
    public int? WarehouseId { get; set; }
    public string? SortBy { get; set; } = "createdAt";
    public string? SortDir { get; set; } = "desc";
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
}
