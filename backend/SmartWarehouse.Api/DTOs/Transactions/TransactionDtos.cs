namespace SmartWarehouse.Api.DTOs.Transactions;

public class TransactionDto
{
    public int Id { get; set; }
    public string ReferenceNumber { get; set; } = string.Empty;
    public string TransactionType { get; set; } = string.Empty; // INBOUND, OUTBOUND, TRANSFER, ADJUSTMENT
    public int ProductId { get; set; }
    public string ProductSku { get; set; } = string.Empty;
    public string ProductName { get; set; } = string.Empty;
    public int? SourceWarehouseId { get; set; }
    public string? SourceWarehouseName { get; set; }
    public int? TargetWarehouseId { get; set; }
    public string? TargetWarehouseName { get; set; }
    public int Quantity { get; set; }
    public string? Notes { get; set; }
    public string? DocumentUrl { get; set; }
    public int CreatedByUserId { get; set; }
    public string CreatedByUserName { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

public class CreateTransactionDto
{
    public string TransactionType { get; set; } = "INBOUND"; // INBOUND, OUTBOUND
    public int ProductId { get; set; }
    public int WarehouseId { get; set; }
    public string BinLocation { get; set; } = "DEFAULT";
    public int Quantity { get; set; }
    public string? Notes { get; set; }
    public string? DocumentUrl { get; set; }
}
