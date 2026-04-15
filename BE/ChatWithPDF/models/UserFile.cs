using System.ComponentModel.DataAnnotations;
namespace ChatWithPDF.Models;

public class UserFile
{
    [Key]
    public Guid Id { get; set; }

    public Guid UserId { get; set; }

    public string FileName { get; set; } = string.Empty;

    public long FileSize { get; set; } // In bytes

    public DateTime UploadedAt { get; set; } = DateTime.UtcNow;

    // Relationship: One file has many chunks
    public List<DocumentChunk> Chunks { get; set; } = new();
}