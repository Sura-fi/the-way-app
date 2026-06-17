namespace TheWay.Api.Models.Dtos.Users;

public class UserDetailResponse
{
    public Guid Id { get; set; }
    public string FormalName { get; set; } = string.Empty;
    public string SpiritualName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string? ProfilePictureUrl { get; set; }
    public bool IsActive { get; set; }
    public int TotalLogs { get; set; }
    public double CompletionRate { get; set; }
    public int CurrentStreak { get; set; }

    // ── Week Cycle Fields ───────────────────────
    public DateTime JoinedAt { get; set; }
    public int CurrentWeekNumber { get; set; }   // W1, W2, … W12+
    public int CurrentDayInWeek { get; set; }     // 1–7 (day 7 = review day)
    public DateOnly CurrentWeekStart { get; set; }
    public DateOnly CurrentWeekEnd { get; set; }
}
