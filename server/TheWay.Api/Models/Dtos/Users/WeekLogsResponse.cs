using TheWay.Api.Models.Dtos.Checklist;

namespace TheWay.Api.Models.Dtos.Users;

/// <summary>
/// Full response for a single week's data (7-day window of logs + summary).
/// </summary>
public class WeekLogsResponse
{
    public int WeekNumber { get; set; }
    public DateOnly WeekStart { get; set; }
    public DateOnly WeekEnd { get; set; }
    public bool IsCurrentWeek { get; set; }
    public bool IsComplete { get; set; }           // all 7 days have passed
    public List<ChecklistResponse?> Logs { get; set; } = new(); // 7 slots (null = no log)
    public WeekSummary Summary { get; set; } = new();
    public bool HasReview { get; set; }            // whether a priest review exists for this week
}
