using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmartWarehouse.Api.Data;
using SmartWarehouse.Api.DTOs.Common;
using SmartWarehouse.Api.DTOs.Dashboard;

namespace SmartWarehouse.Api.Controllers;

[Authorize]
public class DashboardController : BaseApiController
{
    private readonly AppDbContext _context;

    public DashboardController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet("summary")]
    public async Task<ActionResult<ApiResponse<DashboardSummaryDto>>> GetSummary()
    {
        var totalProducts = await _context.Products.CountAsync();
        var totalWarehouses = await _context.Warehouses.CountAsync();
        var totalSuppliers = await _context.Suppliers.CountAsync();
        var activePOs = await _context.PurchaseOrders.CountAsync(po => po.Status == "PENDING" || po.Status == "APPROVED");

        var totalStockQty = await _context.InventoryStocks.SumAsync(s => (int?)s.QuantityOnHand) ?? 0;
        var totalStockValue = await _context.InventoryStocks.SumAsync(s => (decimal?)(s.QuantityOnHand * s.Product.CostPrice)) ?? 0m;

        var productStockLevels = await _context.Products
            .AsNoTracking()
            .Select(p => new
            {
                TotalOnHand = p.Stocks.Sum(s => (int?)s.QuantityOnHand) ?? 0,
                p.ReorderLevel
            })
            .ToListAsync();

        var outOfStockCount = productStockLevels.Count(p => p.TotalOnHand == 0);
        var lowStockCount = productStockLevels.Count(p => p.TotalOnHand > 0 && p.TotalOnHand <= p.ReorderLevel);

        var oneMonthAgo = DateTime.UtcNow.AddDays(-30);
        var monthlyInbound = await _context.StockTransactions
            .CountAsync(t => t.TransactionType == "INBOUND" && t.CreatedAt >= oneMonthAgo);
        var monthlyOutbound = await _context.StockTransactions
            .CountAsync(t => t.TransactionType == "OUTBOUND" && t.CreatedAt >= oneMonthAgo);

        var summary = new DashboardSummaryDto
        {
            TotalProducts = totalProducts,
            TotalStockQuantity = totalStockQty,
            TotalStockValue = totalStockValue,
            LowStockCount = lowStockCount,
            OutOfStockCount = outOfStockCount,
            TotalWarehouses = totalWarehouses,
            TotalSuppliers = totalSuppliers,
            ActivePurchaseOrders = activePOs,
            MonthlyInboundCount = monthlyInbound,
            MonthlyOutboundCount = monthlyOutbound
        };

        return Ok(ApiResponse<DashboardSummaryDto>.Ok(summary, "Data ringkasan dasbor berhasil dimuat."));
    }

    [HttpGet("charts")]
    public async Task<ActionResult<ApiResponse<ChartDataDto>>> GetCharts([FromQuery] int months = 6)
    {
        if (months < 1) months = 6;
        if (months > 24) months = 24;

        var monthsAgo = DateTime.UtcNow.AddMonths(-(months - 1));
        var startDate = new DateTime(monthsAgo.Year, monthsAgo.Month, 1, 0, 0, 0, DateTimeKind.Utc);

        var monthlyData = await _context.StockTransactions
            .AsNoTracking()
            .Where(t => t.CreatedAt >= startDate && (t.TransactionType == "INBOUND" || t.TransactionType == "OUTBOUND"))
            .GroupBy(t => new { t.CreatedAt.Year, t.CreatedAt.Month, t.TransactionType })
            .Select(g => new
            {
                g.Key.Year,
                g.Key.Month,
                g.Key.TransactionType,
                TotalQty = g.Sum(x => x.Quantity)
            })
            .ToListAsync();

        var monthLabels = new List<string>();
        var inboundData = new List<int>();
        var outboundData = new List<int>();

        for (int i = months - 1; i >= 0; i--)
        {
            var targetMonth = DateTime.UtcNow.AddMonths(-i);
            var monthName = targetMonth.ToString("MMM yyyy");
            monthLabels.Add(monthName);

            var inCount = monthlyData
                .FirstOrDefault(d => d.Year == targetMonth.Year && d.Month == targetMonth.Month && d.TransactionType == "INBOUND")?.TotalQty ?? 0;

            var outCount = monthlyData
                .FirstOrDefault(d => d.Year == targetMonth.Year && d.Month == targetMonth.Month && d.TransactionType == "OUTBOUND")?.TotalQty ?? 0;

            inboundData.Add(inCount);
            outboundData.Add(outCount);
        }

        // Distribusi Stok seluruh kategori berdasarkan nilai riil persediaan dan jumlah produk
        var categoryDistribution = await _context.Categories
            .AsNoTracking()
            .Select(c => new CategoryStockDataDto
            {
                CategoryName = c.Name,
                TotalItems = c.Products.Count,
                TotalValue = c.Products.SelectMany(p => p.Stocks).Sum(s => (decimal?)(s.QuantityOnHand * s.Product.CostPrice)) ?? 0m
            })
            .OrderByDescending(c => c.TotalValue)
            .ToListAsync();

        var chartDto = new ChartDataDto
        {
            Months = monthLabels,
            InboundData = inboundData,
            OutboundData = outboundData,
            CategoryDistribution = categoryDistribution
        };

        return Ok(ApiResponse<ChartDataDto>.Ok(chartDto, "Data analitik grafik berhasil dimuat."));
    }

    [HttpGet("recent-activities")]
    public async Task<ActionResult<ApiResponse<List<RecentActivityDto>>>> GetRecentActivities()
    {
        var recent = await _context.StockTransactions
            .AsNoTracking()
            .Include(t => t.Product)
            .Include(t => t.SourceWarehouse)
            .Include(t => t.TargetWarehouse)
            .Include(t => t.CreatedByUser).ThenInclude(u => u.Profile)
            .OrderByDescending(t => t.CreatedAt)
            .Take(10)
            .Select(t => new RecentActivityDto
            {
                Id = t.Id,
                ReferenceNumber = t.ReferenceNumber,
                TransactionType = t.TransactionType,
                ProductName = t.Product.Name,
                Quantity = t.Quantity,
                WarehouseInfo = t.TransactionType == "INBOUND"
                    ? $"Masuk ke: {t.TargetWarehouse!.Name}"
                    : (t.TransactionType == "OUTBOUND"
                        ? $"Keluar dari: {t.SourceWarehouse!.Name}"
                        : $"{t.SourceWarehouse!.Name} -> {t.TargetWarehouse!.Name}"),
                PerformedBy = t.CreatedByUser.Profile != null ? t.CreatedByUser.Profile.FullName : t.CreatedByUser.Email,
                CreatedAt = t.CreatedAt
            })
            .ToListAsync();

        return Ok(ApiResponse<List<RecentActivityDto>>.Ok(recent, "Daftar aktivitas terbaru berhasil dimuat."));
    }

    [HttpPost("reseed")]
    public async Task<ActionResult<ApiResponse<string>>> ReseedDatabase()
    {
        await DbSeeder.SeedAsync(_context, forceReset: true);
        return Ok(ApiResponse<string>.Ok("Database berhasil di-reseed dengan data bersih tanpa duplikasi dan 12 bulan analitik."));
    }
}
