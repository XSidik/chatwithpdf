using System.ComponentModel.DataAnnotations;
namespace ChatWithPDF.Models;

public class User
{
    [Key]
    public Guid Id { get; set; }
    [Required]
    [EmailAddress]
    public string? Email { get; set; }
    public string? Name { get; set; }
    public string? RefreshToken { get; set; }
    public DateTime? RefreshTokenExpiry { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}