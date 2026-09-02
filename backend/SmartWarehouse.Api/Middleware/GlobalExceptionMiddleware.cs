using System.Net;
using System.Text.Json;
using SmartWarehouse.Api.DTOs.Common;

namespace SmartWarehouse.Api.Middleware;

public class GlobalExceptionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<GlobalExceptionMiddleware> _logger;

    public GlobalExceptionMiddleware(RequestDelegate next, ILogger<GlobalExceptionMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);

            if (context.Response.StatusCode == (int)HttpStatusCode.Unauthorized && !context.Response.HasStarted)
            {
                context.Response.ContentType = "application/json";
                var response = ApiResponse<object>.Fail("Akses ditolak: Token autentikasi tidak valid atau telah kadaluarsa.", (int)HttpStatusCode.Unauthorized);
                await context.Response.WriteAsync(JsonSerializer.Serialize(response));
            }
            else if (context.Response.StatusCode == (int)HttpStatusCode.Forbidden && !context.Response.HasStarted)
            {
                context.Response.ContentType = "application/json";
                var response = ApiResponse<object>.Fail("Akses dilarang: Anda tidak memiliki wewenang (role) untuk mengakses resource ini.", (int)HttpStatusCode.Forbidden);
                await context.Response.WriteAsync(JsonSerializer.Serialize(response));
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Terjadi kesalahan yang tidak ditangani: {Message}", ex.Message);
            await HandleExceptionAsync(context, ex);
        }
    }

    private static async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        context.Response.ContentType = "application/json";

        int statusCode;
        string message;
        IDictionary<string, string[]>? errors = null;

        switch (exception)
        {
            case KeyNotFoundException notFoundEx:
                statusCode = (int)HttpStatusCode.NotFound;
                message = notFoundEx.Message;
                break;
            case UnauthorizedAccessException unauthEx:
                statusCode = (int)HttpStatusCode.Unauthorized;
                message = unauthEx.Message;
                break;
            case InvalidOperationException invalidEx:
                statusCode = (int)HttpStatusCode.BadRequest;
                message = invalidEx.Message;
                break;
            case ArgumentException argEx:
                statusCode = (int)HttpStatusCode.BadRequest;
                message = argEx.Message;
                break;
            default:
                statusCode = (int)HttpStatusCode.InternalServerError;
                message = "Terjadi kesalahan internal pada server. Silakan coba beberapa saat lagi.";
                break;
        }

        context.Response.StatusCode = statusCode;
        var response = ApiResponse<object>.Fail(message, statusCode, errors);

        var jsonOptions = new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };
        await context.Response.WriteAsync(JsonSerializer.Serialize(response, jsonOptions));
    }
}
