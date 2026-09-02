namespace SmartWarehouse.Api.Models.Entities;

public class InventoryStock : BaseEntity
{
    public int ProductId { get; set; }
    public Product Product { get; set; } = null!;

    public int WarehouseId { get; set; }
    public Warehouse Warehouse { get; set; } = null!;

    public string BinLocation { get; set; } = "DEFAULT";
    public int QuantityOnHand { get; set; } = 0;
    public int QuantityAllocated { get; set; } = 0;
    public int QuantityAvailable { get; set; } = 0;
    public DateTime? LastCountedAt { get; set; }
}
