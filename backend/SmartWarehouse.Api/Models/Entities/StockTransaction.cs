namespace SmartWarehouse.Api.Models.Entities;

public class StockTransaction : BaseEntity
{
    public string ReferenceNumber { get; set; } = string.Empty;
    public string TransactionType { get; set; } = "INBOUND"; // INBOUND, OUTBOUND, TRANSFER, ADJUSTMENT
    
    public int ProductId { get; set; }
    public Product Product { get; set; } = null!;

    public int? SourceWarehouseId { get; set; }
    public Warehouse? SourceWarehouse { get; set; }

    public int? TargetWarehouseId { get; set; }
    public Warehouse? TargetWarehouse { get; set; }

    public int Quantity { get; set; }
    public string? Notes { get; set; }
    public string? DocumentUrl { get; set; }

    public int CreatedByUserId { get; set; }
    public User CreatedByUser { get; set; } = null!;
}
