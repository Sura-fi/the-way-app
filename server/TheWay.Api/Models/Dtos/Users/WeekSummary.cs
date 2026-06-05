namespace TheWay.Api.Models.Dtos.Users;

/// <summary>
/// 7th-day summary for a completed (or current) week.
/// </summary>
public class WeekSummary
{
    public int DaysWithActivity { get; set; }     // days with ≥1 toggle (0–7)
    public int TotalActivities { get; set; }      // sum of all toggles
    public double CompletionRate { get; set; }    // activities / 35 * 100
    public string[] StrongestAreas { get; set; } = [];
    public string[] WeakestAreas { get; set; } = [];
}
