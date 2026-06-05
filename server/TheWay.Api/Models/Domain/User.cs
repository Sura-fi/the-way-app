namespace TheWay.Api.Models.Domain;

public class User 
{
    public Guid Id { get; set; }
    public string FormalName { get; set; } = string.Empty;
    public string SpiritualName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string Role {get; set;} = "GodChild";
    public bool MustChangePassword { get; set; } = false;
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;


     // Navigation properties — EF Core uses these to understand relationships
    public ICollection<DailyLog> DailyLogs { get; set; } = new List<DailyLog>();
    public ICollection<PriestQuote> PublishedQuotes { get; set; } = new List<PriestQuote>();

    // Reviews received (GodChild side) and reviews written (Priest side)
    public ICollection<PriestReview> ReceivedReviews { get; set; } = new List<PriestReview>();
    public ICollection<PriestReview> WrittenReviews { get; set; } = new List<PriestReview>();
    public ICollection<UserNote> Notes { get; set; } = new List<UserNote>();

}