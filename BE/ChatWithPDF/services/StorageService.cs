using Minio;
using Minio.DataModel.Args;
using Minio.Exceptions;
using Microsoft.Extensions.Options;

namespace ChatWithPDF.Services;

public interface IStorageService
{
    Task UploadFileAsync(string objectName, string filePath, string contentType, CancellationToken ct = default);
    Task UploadStreamAsync(Stream stream, string objectName, long size, string contentType, CancellationToken ct = default);
    Task<Stream> DownloadFileAsync(string objectName, CancellationToken ct = default);
    Task DeleteFileAsync(string objectName, CancellationToken ct = default);
    Task<string> GetPresignedUrlAsync(string objectName, int expirySeconds = 3600);
}

public class StorageService : IStorageService
{
    private readonly IMinioClient _minioClient;
    private readonly string _bucketName;

    public StorageService(IConfiguration configuration)
    {
        var endpoint = configuration["Minio:Endpoint"] ?? "localhost:9000";
        var accessKey = configuration["Minio:AccessKey"] ?? "admin";
        var secretKey = configuration["Minio:SecretKey"] ?? "admin123";
        _bucketName = configuration["Minio:BucketName"] ?? "documents";

        _minioClient = new MinioClient()
            .WithEndpoint(endpoint)
            .WithCredentials(accessKey, secretKey)
            .WithSSL(false)
            .Build();
    }

    private async Task EnsureBucketExistsAsync()
    {
        var beArgs = new BucketExistsArgs().WithBucket(_bucketName);
        bool found = await _minioClient.BucketExistsAsync(beArgs).ConfigureAwait(false);
        if (!found)
        {
            var mbArgs = new MakeBucketArgs().WithBucket(_bucketName);
            await _minioClient.MakeBucketAsync(mbArgs).ConfigureAwait(false);
        }
    }

    public async Task UploadFileAsync(
        string objectName,
        string filePath,
        string contentType,
        CancellationToken ct = default)
    {
        await EnsureBucketExistsAsync();

        await _minioClient.PutObjectAsync(new PutObjectArgs()
            .WithBucket(_bucketName)
            .WithObject(objectName)
            .WithFileName(filePath)
            .WithContentType(contentType), ct);
    }

    public async Task UploadStreamAsync(
        Stream stream,
        string objectName,
        long size,
        string contentType,
        CancellationToken ct = default)
    {
        await EnsureBucketExistsAsync();

        await _minioClient.PutObjectAsync(new PutObjectArgs()
            .WithBucket(_bucketName)
            .WithObject(objectName)
            .WithStreamData(stream)
            .WithObjectSize(size)
            .WithContentType(contentType), ct);
    }

    public async Task<Stream> DownloadFileAsync(string objectName, CancellationToken ct = default)
    {
        var memStream = new MemoryStream();

        await _minioClient.GetObjectAsync(new GetObjectArgs()
            .WithBucket(_bucketName)
            .WithObject(objectName)
            .WithCallbackStream(async (stream, token) =>
            {
                await stream.CopyToAsync(memStream, token);
            }), ct);

        memStream.Position = 0;
        return memStream;
    }

    public async Task DeleteFileAsync(string objectName, CancellationToken ct = default)
    {
        await _minioClient.RemoveObjectAsync(new RemoveObjectArgs()
            .WithBucket(_bucketName)
            .WithObject(objectName), ct);
    }

    public async Task<string> GetPresignedUrlAsync(string objectName, int expirySeconds = 3600)
    {
        return await _minioClient.PresignedGetObjectAsync(new PresignedGetObjectArgs()
            .WithBucket(_bucketName)
            .WithObject(objectName)
            .WithExpiry(expirySeconds));
    }
}
