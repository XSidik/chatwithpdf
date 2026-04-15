using System.Text.Json.Serialization;

namespace ChatWithPDF.dtos;
public class GoogleTokenRequest
{
    public string? IdToken { get; set; }
}

public class GoogleTokenInfo
{
    public string? email { get; set; }

    [JsonPropertyName("name")]
    public string? FullName { get; set; }
}
