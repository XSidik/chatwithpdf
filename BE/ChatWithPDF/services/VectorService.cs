using ChatWithPDF.Data;
using ChatWithPDF.Models;
using Microsoft.SemanticKernel.Embeddings;
using Microsoft.SemanticKernel.Connectors.Google;
using UglyToad.PdfPig;
using Pgvector;
using System.Text.RegularExpressions;

namespace ChatWithPDF.Services;

public interface IVectorService
{
    Task ProcessFileAsync(UserFile file, Stream fileStream);
}

public class VectorService : IVectorService
{
    private readonly ApplicationDbContext _context;
    private readonly ITextEmbeddingGenerationService _embeddingService;
    private readonly string _modelId;
    private readonly string _apiKey;

    public VectorService(ApplicationDbContext context, IConfiguration configuration)
    {
        _context = context;

        _apiKey = configuration["GoogleAI:ApiKey"] ?? "";
        _modelId = configuration["GoogleAI:EmbeddingModel"] ?? "gemini-embedding-001";

        // Loud logging for Senior Developer diagnostics
        Console.WriteLine($"[INIT] VectorService: ModelID={_modelId}, KeyLength={_apiKey?.Length ?? 0}");

        // Initialize the new GoogleAIEmbeddingGenerator (replaces obsolete GoogleAITextEmbeddingGenerationService)
        _embeddingService = new GoogleAITextEmbeddingGenerationService(_modelId, _apiKey);
        // Note: Keeping GoogleAITextEmbeddingGenerationService for now but ensuring modelId is clean.
        // If it still 404s, we'll try prepending/removing 'models/'
    }

    public async Task ProcessFileAsync(UserFile file, Stream fileStream)
    {
        Console.WriteLine($"[VECTOR] Extracting chunks from fileStream, Length: {fileStream.Length}");
        var chunks = ExtractChunksFromPdf(fileStream);
        Console.WriteLine($"[VECTOR] Extracted {chunks.Count} chunks.");

        foreach (var chunk in chunks)
        {
            try
            {
                var contentSnippet = chunk.Content!.Length > 50 ? chunk.Content.Substring(0, 50) + "..." : chunk.Content;
                Console.WriteLine($"[VECTOR] Requesting embedding for page {chunk.PageNumber} (Model: {_modelId})");

                string rawContent = chunk.Content ?? string.Empty;
                chunk.Content = new string(rawContent.Where(c => c != '\0').ToArray());
                chunk.Content = chunk.Content.Replace("\u0000", "");

                if (chunk.Content.Contains('\0'))
                {
                    Console.WriteLine("DEBUG: Null byte found in sanitizedContent!");
                }

                var embedding = await _embeddingService.GenerateEmbeddingAsync(chunk.Content);
                float[] truncatedArray = embedding.ToArray().Take(768).ToArray();

                chunk.Embedding = new Vector(truncatedArray);
                chunk.FileId = file.Id;

                Console.WriteLine($"[VECTOR] Success! Dimension: {embedding.Length}");
                _context.DocumentChunks.Add(chunk);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[VECTOR] Embedding API Error: {ex.Message}");
                if (ex.InnerException != null) Console.WriteLine($"[VECTOR] Inner Error: {ex.InnerException.Message}");
                throw;
            }
        }

        Console.WriteLine("[VECTOR] All chunks processed, saving to DB...");
        await _context.SaveChangesAsync();
        Console.WriteLine("[VECTOR] Successfully saved chunks to DB.");
    }

    private List<DocumentChunk> ExtractChunksFromPdf(Stream fileStream)
    {
        var chunks = new List<DocumentChunk>();
        using (var pdf = PdfDocument.Open(fileStream))
        {
            foreach (var page in pdf.GetPages())
            {
                var text = page.Text;
                if (string.IsNullOrWhiteSpace(text)) continue;

                // Simple chunking: one chunk per page for now
                // Truncate to avoid exceeding model token limits (approx 2048 tokens for text-embedding-004)
                var content = text.Length > 8000 ? text.Substring(0, 8000) : text;

                chunks.Add(new DocumentChunk
                {
                    Id = Guid.NewGuid(),
                    Content = content,
                    PageNumber = page.Number
                });
            }
        }
        return chunks;
    }
}
