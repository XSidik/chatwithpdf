using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using ChatWithPDF.Services;
using ChatWithPDF.Models;
using ChatWithPDF.Data;
using ChatWithPDF.dtos;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace ChatWithPDF.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class FileController : ControllerBase
{
    private readonly IStorageService _storageService;
    private readonly IVectorService _vectorService;
    private readonly ApplicationDbContext _context;

    public FileController(
        IStorageService storageService,
        IVectorService vectorService,
        ApplicationDbContext context)
    {
        _storageService = storageService;
        _vectorService = vectorService;
        _context = context;
    }

    [HttpPost("upload")]
    [RequestSizeLimit(2 * 1024 * 1024)] // 2MB limit
    public async Task<IActionResult> Upload(
        [FromForm] IFormFile file,
        [FromForm] int chunkIndex,
        [FromForm] int totalChunks,
        [FromForm] string fileName,
        [FromForm] string fileId)
    {
        var userIdString = User.FindFirst("id")?.Value;
        if (string.IsNullOrEmpty(userIdString) || !Guid.TryParse(userIdString, out var userId))
        {
            Console.WriteLine("[UPLOAD] Unauthorized: User ID claim missing or invalid");
            return BadRequest(new ApiResponse<object> { Success = false, Message = "Unauthorized" });
        }

        if (file == null || file.Length == 0)
            return BadRequest(new ApiResponse<object> { Success = false, Message = "No file uploaded." });

        if (!file.ContentType.Equals("application/octet-stream", StringComparison.OrdinalIgnoreCase))
            return BadRequest(new ApiResponse<object> { Success = false, Message = "Only PDF files are allowed." });

        try
        {
            // upload to storage
            await _storageService.UploadStreamAsync(
                file.OpenReadStream(),
                $"chunks/{fileId}/{chunkIndex}.part",
                file.Length,
                file.ContentType);

            if (chunkIndex < totalChunks - 1)
            {
                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    Message = $"Chunk {chunkIndex + 1}/{totalChunks} uploaded successfully."
                });
            }

            Console.WriteLine($"[UPLOAD] All chunks received. Assembling {fileName}...");
            byte[] fileBytes;
            using (var assembled = new MemoryStream())
            {
                for (int i = 0; i < totalChunks; i++)
                {
                    await using var chunkStream = await _storageService.DownloadFileAsync($"chunks/{fileId}/{i}.part");
                    await chunkStream.CopyToAsync(assembled);
                }
                fileBytes = assembled.ToArray();
            }

            var userFile = new UserFile
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                FileName = fileName.Replace("\0", string.Empty),
                FileSize = fileBytes.Length,
                UploadedAt = DateTime.UtcNow
            };

            Console.WriteLine($"[UPLOAD] Uploading assembled file to MinIO: {userFile.Id}.pdf");

            try
            {
                using var storageStream = new MemoryStream(fileBytes);
                await _storageService.UploadStreamAsync(
                    objectName: $"{userFile.Id}.pdf",
                    stream: storageStream,
                    size: fileBytes.Length,
                    contentType: file.ContentType);
            }
            catch (Exception minioEx)
            {
                Console.WriteLine($"[UPLOAD] MinIO Upload Failed: {minioEx}");
                throw new Exception($"Storage error: {minioEx.Message}", minioEx);
            }

            Console.WriteLine("[UPLOAD] Saving metadata to DB...");
            _context.UserFiles.Add(userFile);
            await _context.SaveChangesAsync();

            Console.WriteLine("[UPLOAD] Starting Vectorization...");
            try
            {
                using var vectorStream = new MemoryStream(fileBytes);
                await _vectorService.ProcessFileAsync(userFile, vectorStream);
            }
            catch (Exception vectorEx)
            {
                Console.WriteLine($"[UPLOAD] Vectorization failed: {vectorEx}");
                throw new Exception($"Vectorization failed: {vectorEx.Message}", vectorEx);
            }

            Console.WriteLine("[UPLOAD] Cleaning up chunks...");
            for (int i = 0; i < totalChunks; i++)
            {
                await _storageService.DeleteFileAsync($"chunks/{fileId}/{i}.part");
            }

             Console.WriteLine("[UPLOAD] Success!");
            return Ok(new ApiResponse<object>
            {
                Success = true,
                Data    = new { fileId = userFile.Id, fileName = userFile.FileName },
                Message = "File uploaded and processed successfully."
            });

        }
        catch (Exception ex)
        {
            Console.WriteLine($"[UPLOAD] FATAL ERROR: {ex}");
            return StatusCode(500, new ApiResponse<object>
            {
                Success = false,
                Message = $"Upload failed: {ex.Message}"
            });
        }
    }

    [HttpGet("history")]
    public async Task<IActionResult> GetHistory([FromQuery] int page = 1, [FromQuery] int pageSize = 10)
    {
        try
        {
            var userIdString = User.FindFirst("id")?.Value;
            if (string.IsNullOrEmpty(userIdString) || !Guid.TryParse(userIdString, out var userId))
                return Unauthorized();

            var query = _context.UserFiles
                .Where(f => f.UserId == userId)
                .OrderByDescending(f => f.UploadedAt);

            var totalCount = await query.CountAsync();
            var files = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(f => new
                {
                    f.Id,
                    f.FileName,
                    f.FileSize,
                    f.UploadedAt
                })
                .ToListAsync();

            return Ok(new PaginatedApiResponse<object>
            {
                Success = true,
                Data = files,
                TotalCount = totalCount,
                PageNumber = page,
                PageSize = pageSize,
                Message = "History retrieved successfully."
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<object>
            {
                Success = false,
                Message = $"An error occurred: {ex.Message}"
            });
        }
    }
}
