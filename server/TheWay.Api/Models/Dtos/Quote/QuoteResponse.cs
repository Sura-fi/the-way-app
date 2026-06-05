namespace TheWay.Api.Models.Dtos.Quote;

public class QuoteResponse
{
    public Guid Id { get; set; }
    public string Content { get; set; } = string.Empty;
    public DateTime PublishedAt { get; set; }
    public string PublisherName { get; set; } = string.Empty;
}
