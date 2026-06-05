namespace TheWay.Api.Models.Domain;

public class DailyLog
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public DateOnly LogDate { get; set; }

    // The 5 spiritual activities — stores selected sub-options
    public List<string> PrayerSelections { get; set; } = new();
    public List<string> BibleReadingSelections { get; set; } = new();
    public List<string> SpiritualBooksSelections { get; set; } = new();
    public List<string> GoodDeedsSelections { get; set; } = new();
    public List<string> AvoidingEvilSelections { get; set; } = new();

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation property — links back to the User who owns this log
    public User User { get; set; } = null!;
}
