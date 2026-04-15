# ChatWithPDF Backend

A high-performance Web API built with .NET for processing and chatting with PDF documents through RAG (Retrieval-Augmented Generation).

## 🚀 Technologies

- **Runtime:** .NET 10 (ASP.NET Core)
- **Database:** PostgreSQL with `pgvector` support
- **Storage:** Minio (S3 Compatible Object Storage)
- **AI/Embeddings:** Google AI Services (`text-embedding-004`)
- **ORM:** Entity Framework Core (Npgsql)
- **Documentation:** Swagger/OpenAPI

## 🛠️ Project Structure

- `controllers/`: API endpoints for accounts, storage, and processing.
- `services/`: Business logic including storage, vector search, and AI integration.
- `models/`: Database entities and application models.
- `dtos/`: Data Transfer Objects for API requests and responses.
- `data/`: Entity Framework DbContext and migrations.
- `Middleware/`: Custom security and logging middleware.

## ⚙️ Getting Started

### Prerequisites

- .NET 10 SDK
- PostgreSQL with `pgvector` extension
- Minio Server
- Google AI API Key

### Configuration

Create a `.env` file in the `ChatWithPDF/` directory or update `appsettings.json` with your credentials:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Port=5432;Database=chat_with_pdf;Username=postgres;Password=your_password"
  },
  "Minio": {
    "Endpoint": "localhost:9000",
    "AccessKey": "admin",
    "SecretKey": "admin123",
    "BucketName": "pdfs"
  },
  "GoogleAI": {
    "ApiKey": "YOUR_GOOGLE_AI_API_KEY"
  }
}
```

### Running the Application

Navigate to the project directory and run:

```bash
dotnet run --project ChatWithPDF/ChatWithPDF.csproj
```

The API will be available at `http://localhost:5037` (or your configured port). Access the Swagger UI at `/swagger/index.html`.

## 📜 API Documentation

Swagger is integrated and can be accessed in development mode to explore and test the endpoints.

## 🤝 Contributing

1. Fork the repository.
2. Create your feature branch (`git checkout -b feature/AmazingFeature`).
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.
