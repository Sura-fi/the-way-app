namespace TheWay.Api.Models.Dtos.Users;

// God child's own profile-card stats, computed server-side from PostgreSQL
// (the source of truth) so they survive the offline-cache clear on login.
public class MyStatsResponse
{
    // Days with at least one logged activity (consistent with streak counting).
    public int TotalDays { get; set; }

    // Days-with-activity that fall in the current calendar month (per client's local date).
    public int ThisMonthDays { get; set; }

    // Consecutive days (ending today/yesterday) with at least one activity.
    public int CurrentStreak { get; set; }
}
