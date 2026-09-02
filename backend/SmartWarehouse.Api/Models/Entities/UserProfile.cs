namespace SmartWarehouse.Api.Models.Entities;

public class UserProfile : BaseEntity
{
    public int UserId { get; set; }
    public User User { get; set; } = null!;
    public string FullName { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
    public string? AvatarUrl { get; set; }
    public string? Department { get; set; }
    public string? Address { get; set; }
}
