namespace SmartWarehouse.Api.DTOs.Dashboard;

public class DashboardSummaryDto
{
    public int TotalProducts { get; set; }
    public int TotalStockQuantity { get; set; }
    public decimal TotalStockValue { get; set; }
    public int LowStockCount { get; set; }
    public int OutOfStockCount { get; set; }
    public int TotalWarehouses { get; set; }
    public int TotalSuppliers { get; set; }
    public int ActivePurchaseOrders { get; set; }
    public int MonthlyInboundCount { get; set; }
    public int MonthlyOutboundCount { get; set; }
}

public class ChartDataDto
{
    public List<string> Months { get; set; } = new();
    public List<int> InboundData { get; set; } = new();
    public List<int> OutboundData { get; set; } = new();
    public List<CategoryStockDataDto> CategoryDistribution { get; set; } = new();
}

public class CategoryStockDataDto
{
    public string CategoryName { get; set; } = string.Empty;
    public int TotalItems { get; set; }
    public decimal TotalValue { get; set; }
}

public class RecentActivityDto
{
    public int Id { get; set; }
    public string ReferenceNumber { get; set; } = string.Empty;
    public string TransactionType { get; set; } = string.Empty;
    public string ProductName { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public string WarehouseInfo { get; set; } = string.Empty;
    public string PerformedBy { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}
