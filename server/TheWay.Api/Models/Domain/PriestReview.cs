namespace TheWay.Api.Models.Domain;

public class PriestReview
{
    public Guid Id { get; set; }
    public Guid GodChildId { get; set; }       // FK → Users.Id (the child being reviewed)
    public Guid PriestId { get; set; }          // FK → Users.Id (the priest who wrote it)
    public string Content { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime ExpiresAt { get; set; }     // CreatedAt + 3 months
    public DateTime? AcknowledgedAt { get; set; } // when the God Child said "Amen" (null = no response yet)

    // Navigation properties
    public User GodChild { get; set; } = null!;
    public User Priest { get; set; } = null!;
}
