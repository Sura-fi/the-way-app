namespace TheWay.Api.Models.Dtos.Reviews;

public class ReviewResponse
{
    public Guid Id { get; set; }
    public string Content { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime ExpiresAt { get; set; }
    public string PriestName { get; set; } = string.Empty;
}
