namespace SmartWarehouse.Api.Models.Entities;

public class PurchaseOrderItem : BaseEntity
{
    public int PurchaseOrderId { get; set; }
    public PurchaseOrder PurchaseOrder { get; set; } = null!;

    public int ProductId { get; set; }
    public Product Product { get; set; } = null!;

    public int OrderedQuantity { get; set; }
    public int ReceivedQuantity { get; set; } = 0;
    public decimal UnitCost { get; set; }
    public decimal Subtotal { get; set; }
    public string? Notes { get; set; }
}
