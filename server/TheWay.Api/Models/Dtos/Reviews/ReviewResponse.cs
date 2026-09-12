namespace TheWay.Api.Models.Dtos.Reviews;

public class ReviewResponse
{
    public Guid Id { get; set; }
    public string Content { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime ExpiresAt { get; set; }
    public DateTime? AcknowledgedAt { get; set; }  // when the God Child said "Amen" (null = no response)
    public int WeekNumber { get; set; }             // the child's week this review was written in
    public string PriestName { get; set; } = string.Empty;
}
