namespace SmartWarehouse.Api.DTOs.Inventory;

public class InventoryStockDto
{
    public int Id { get; set; }
    public int ProductId { get; set; }
    public string ProductSku { get; set; } = string.Empty;
    public string ProductName { get; set; } = string.Empty;
    public string? ProductImageUrl { get; set; }
    public string UnitOfMeasure { get; set; } = "PCS";
    public int ReorderLevel { get; set; }
    public int WarehouseId { get; set; }
    public string WarehouseCode { get; set; } = string.Empty;
    public string WarehouseName { get; set; } = string.Empty;
    public string BinLocation { get; set; } = "DEFAULT";
    public int QuantityOnHand { get; set; }
    public int QuantityAllocated { get; set; }
    public int QuantityAvailable { get; set; }
    public bool IsLowStock => QuantityOnHand <= ReorderLevel;
    public DateTime? LastCountedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class StockAdjustmentDto
{
    public int ProductId { get; set; }
    public int WarehouseId { get; set; }
    public string BinLocation { get; set; } = "DEFAULT";
    public int NewQuantityOnHand { get; set; }
    public string Reason { get; set; } = string.Empty;
}

public class StockTransferDto
{
    public int ProductId { get; set; }
    public int SourceWarehouseId { get; set; }
    public int TargetWarehouseId { get; set; }
    public string SourceBinLocation { get; set; } = "DEFAULT";
    public string TargetBinLocation { get; set; } = "DEFAULT";
    public int Quantity { get; set; }
    public string? Notes { get; set; }
}
