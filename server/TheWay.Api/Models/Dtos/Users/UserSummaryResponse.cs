namespace TheWay.Api.Models.Dtos.Users;

public class UserSummaryResponse
{
    public Guid Id { get; set; }
    public string FormalName { get; set; } = string.Empty;
    public string SpiritualName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string? ProfilePictureUrl { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }

    // ── Week Cycle Fields (for dashboard badge) ─
    public int CurrentDayInWeek { get; set; }     // 1–7
    public int CurrentWeekNumber { get; set; }    // W1, W2, …
}
