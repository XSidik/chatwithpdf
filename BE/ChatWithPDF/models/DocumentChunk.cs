using System.ComponentModel.DataAnnotations;
namespace ChatWithPDF.Models;
using Pgvector;

public class DocumentChunk
{
    [Key]
    public Guid Id { get; set; }
    [Required]
    // Foreign Key to the File History
    public Guid FileId { get; set; }
    public UserFile File { get; set; } = null!;
    public string? Content { get; set; }
    public Vector? Embedding { get; set; }
    public int PageNumber { get; set; }
}