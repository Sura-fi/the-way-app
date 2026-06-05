namespace TheWay.Api.Models.Domain;

public class PriestQuote
{
    public Guid Id { get; set; }
    public string Content { get; set; } = string.Empty;
    public Guid PublishedBy { get; set; }
    public DateTime PublishedAt { get; set; } = DateTime.UtcNow;
    public bool IsActive { get; set; } = true;

    // Navigation property — links to the Priest who published this quote
    public User Publisher { get; set; } = null!;
}
