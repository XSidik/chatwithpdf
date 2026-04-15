using Microsoft.EntityFrameworkCore;
using ChatWithPDF.Models;

namespace ChatWithPDF.Data;
public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options) {}

    public DbSet<User> Users { get; set; } = null!;
    public DbSet<UserFile> UserFiles { get; set; } = null!;
    public DbSet<DocumentChunk> DocumentChunks { get; set; } = null!;

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.HasPostgresExtension("vector");

        // Configure User
        modelBuilder.Entity<User>()
            .HasIndex(e => e.Email).IsUnique();

        // Configure UserFile
        modelBuilder.Entity<UserFile>(entity =>
        {
            entity.HasIndex(e => e.UserId);

            entity.HasMany(f => f.Chunks)
                  .WithOne(c => c.File)
                  .HasForeignKey(c => c.FileId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // Configure DocumentChunk (The Vectors)
        modelBuilder.Entity<DocumentChunk>(entity =>
        {
            // Specify the dimension (768) for the embedding column
            entity.Property(e => e.Embedding)
                  .HasColumnType("vector(768)");

            entity.HasIndex(e => e.Embedding)
              .HasMethod("hnsw")
              .HasOperators("vector_cosine_ops");
        });
    }
}
