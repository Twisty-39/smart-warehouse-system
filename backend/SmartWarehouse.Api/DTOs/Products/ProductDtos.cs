namespace SmartWarehouse.Api.DTOs.Products;

public class ProductDto
{
    public int Id { get; set; }
    public string Sku { get; set; } = string.Empty;
    public string Barcode { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal CostPrice { get; set; }
    public int ReorderLevel { get; set; }
    public int MinStock { get; set; }
    public int MaxStock { get; set; }
    public string UnitOfMeasure { get; set; } = "PCS";
    public int CategoryId { get; set; }
    public string CategoryName { get; set; } = string.Empty;
    public string? ImageUrl { get; set; }
    public int TotalStockOnHand { get; set; }
    public int TotalStockAvailable { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class CreateProductDto
{
    public string Sku { get; set; } = string.Empty;
    public string Barcode { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal CostPrice { get; set; }
    public int ReorderLevel { get; set; } = 10;
    public int MinStock { get; set; } = 5;
    public int MaxStock { get; set; } = 1000;
    public string UnitOfMeasure { get; set; } = "PCS";
    public int CategoryId { get; set; }
    public string? ImageUrl { get; set; }
}

public class UpdateProductDto
{
    public string Sku { get; set; } = string.Empty;
    public string Barcode { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal CostPrice { get; set; }
    public int ReorderLevel { get; set; }
    public int MinStock { get; set; }
    public int MaxStock { get; set; }
    public string UnitOfMeasure { get; set; } = "PCS";
    public int CategoryId { get; set; }
    public string? ImageUrl { get; set; }
}
