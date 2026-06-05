namespace TheWay.Api.Models.Dtos.Users;

/// <summary>
/// Summary item for the weekly history list (GET /api/users/{id}/weeks).
/// </summary>
public class WeekHistoryItem
{
    public int WeekNumber { get; set; }
    public DateOnly WeekStart { get; set; }
    public DateOnly WeekEnd { get; set; }
    public bool IsCurrentWeek { get; set; }
    public bool IsComplete { get; set; }           // all 7 days have passed
    public int DaysWithActivity { get; set; }
    public double CompletionRate { get; set; }
    public int ReviewCount { get; set; }           // priest reviews during this week
}
