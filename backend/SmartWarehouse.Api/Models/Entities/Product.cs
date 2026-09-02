namespace SmartWarehouse.Api.Models.Entities;

public class Product : BaseEntity, ISoftDeletable
{
    public string Sku { get; set; } = string.Empty;
    public string Barcode { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public decimal UnitPrice { get; set; } = 0;
    public decimal CostPrice { get; set; } = 0;
    public int ReorderLevel { get; set; } = 10;
    public int MinStock { get; set; } = 5;
    public int MaxStock { get; set; } = 1000;
    public string UnitOfMeasure { get; set; } = "PCS";

    public int CategoryId { get; set; }
    public Category Category { get; set; } = null!;

    public string? ImageUrl { get; set; }

    public bool IsDeleted { get; set; } = false;
    public DateTime? DeletedAt { get; set; }

    public ICollection<InventoryStock> Stocks { get; set; } = new List<InventoryStock>();
    public ICollection<StockTransaction> Transactions { get; set; } = new List<StockTransaction>();
    public ICollection<PurchaseOrderItem> PurchaseOrderItems { get; set; } = new List<PurchaseOrderItem>();
}
