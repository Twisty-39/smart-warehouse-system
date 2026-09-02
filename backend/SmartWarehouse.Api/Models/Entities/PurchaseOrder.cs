namespace SmartWarehouse.Api.Models.Entities;

public class PurchaseOrder : BaseEntity
{
    public string PoNumber { get; set; } = string.Empty;

    public int SupplierId { get; set; }
    public Supplier Supplier { get; set; } = null!;

    public DateTime OrderDate { get; set; } = DateTime.UtcNow;
    public DateTime? ExpectedDeliveryDate { get; set; }

    public string Status { get; set; } = "PENDING"; // DRAFT, PENDING, APPROVED, RECEIVED, CANCELLED
    public decimal TotalAmount { get; set; } = 0;
    public string? Notes { get; set; }
    public string? DocumentUrl { get; set; }

    public int CreatedByUserId { get; set; }
    public User CreatedByUser { get; set; } = null!;

    public ICollection<PurchaseOrderItem> Items { get; set; } = new List<PurchaseOrderItem>();
}
