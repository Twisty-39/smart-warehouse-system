namespace SmartWarehouse.Api.Models.Entities;

public class Warehouse : BaseEntity, ISoftDeletable
{
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public decimal CapacitySqm { get; set; } = 0;
    
    public int? ManagerId { get; set; }
    public User? Manager { get; set; }

    public bool IsActive { get; set; } = true;
    public bool IsDeleted { get; set; } = false;
    public DateTime? DeletedAt { get; set; }

    public ICollection<InventoryStock> Stocks { get; set; } = new List<InventoryStock>();
    public ICollection<StockTransaction> SourceTransactions { get; set; } = new List<StockTransaction>();
    public ICollection<StockTransaction> TargetTransactions { get; set; } = new List<StockTransaction>();
}
