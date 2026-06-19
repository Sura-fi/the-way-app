using Microsoft.EntityFrameworkCore;
using TheWay.Api.Data;
using TheWay.Api.Models.Dtos.Checklist;
using TheWay.Api.Models.Dtos.Users;

namespace TheWay.Api.Services;

public class UserService
{
    private readonly AppDbContext _db;

    public UserService(AppDbContext db)
    {
        _db = db;
    }

    // ──────────────────────────────────────────
    // LIST — Get all God Children (search + paginate)
    // ──────────────────────────────────────────
    public async Task<List<UserSummaryResponse>> GetUsersAsync(
        string? search, int page, int pageSize, bool? isActive = null)
    {
        // 1. Start with all GodChild users
        var query = _db.Users
            .Where(u => u.Role == "GodChild")
            .AsNoTracking();

        // 2. Apply search filter if provided
        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.ToLower();
            query = query.Where(u =>
                u.FormalName.ToLower().Contains(term) ||
                u.SpiritualName.ToLower().Contains(term));
        }

        // 3. Apply active/inactive filter if provided
        if (isActive.HasValue)
            query = query.Where(u => u.IsActive == isActive.Value);

        // 4. Order and paginate
        var users = await query
            .OrderBy(u => u.FormalName)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        // 5. Map to DTOs with week cycle fields
        return users.Select(u =>
        {
            var (weekNum, dayInWeek) = CalculateWeekCycle(u.CreatedAt, today);
            return new UserSummaryResponse
            {
                Id = u.Id,
                FormalName = u.FormalName,
                SpiritualName = u.SpiritualName,
                Email = u.Email,
                PhoneNumber = u.PhoneNumber,
                ProfilePictureUrl = u.ProfilePictureUrl,
                IsActive = u.IsActive,
                CreatedAt = u.CreatedAt,
                CurrentDayInWeek = dayInWeek,
                CurrentWeekNumber = weekNum
            };
        }).ToList();
    }

    // ──────────────────────────────────────────
    // GET BY ID — Single user profile with stats
    // ──────────────────────────────────────────
    public async Task<UserDetailResponse?> GetUserByIdAsync(Guid userId)
    {
        var user = await _db.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == userId && u.Role == "GodChild");

        if (user == null)
            return null;

        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var joinDate = DateOnly.FromDateTime(user.CreatedAt);
        var (weekNum, dayInWeek) = CalculateWeekCycle(user.CreatedAt, today);
        var weekStart = joinDate.AddDays((weekNum - 1) * 7);
        var weekEnd = weekStart.AddDays(6);

        // Calculate stats from their logs
        var logs = await _db.DailyLogs
            .Where(d => d.UserId == userId)
            .AsNoTracking()
            .ToListAsync();

        // 1. Total Logs = total individual toggles across all time
        var totalLogs = logs.Sum(l => CountToggles(l));

        // 2. Completion Rate = toggles in current week / 35
        var currentWeekLogs = logs.Where(l => l.LogDate >= weekStart && l.LogDate <= weekEnd).ToList();
        var togglesInWeek = currentWeekLogs.Sum(l => CountToggles(l));
        var completionRate = Math.Round((double)togglesInWeek / 35.0 * 100, 1);

        // 3. Current Streak = consecutive days with at least one toggle
        var activeLogs = logs.Where(l => CountToggles(l) > 0).ToList();
        var currentStreak = CalculateStreak(activeLogs);

        return new UserDetailResponse
        {
            Id = user.Id,
            FormalName = user.FormalName,
            SpiritualName = user.SpiritualName,
            Email = user.Email,
            PhoneNumber = user.PhoneNumber,
            ProfilePictureUrl = user.ProfilePictureUrl,
            IsActive = user.IsActive,
            TotalLogs = totalLogs,
            CompletionRate = completionRate,
            CurrentStreak = currentStreak,
            JoinedAt = user.CreatedAt,
            CurrentWeekNumber = weekNum,
            CurrentDayInWeek = dayInWeek,
            CurrentWeekStart = weekStart,
            CurrentWeekEnd = weekEnd
        };
    }

    // ──────────────────────────────────────────
    // GET PRIEST — Public info of the (single) priest
    // ──────────────────────────────────────────
    public async Task<PriestPublicResponse?> GetPriestPublicAsync()
    {
        var priest = await _db.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Role == "Priest");

        if (priest == null)
            return null;

        return new PriestPublicResponse
        {
            FormalName = priest.FormalName,
            SpiritualName = priest.SpiritualName,
            PhoneNumber = priest.PhoneNumber,
            ProfilePictureUrl = priest.ProfilePictureUrl
        };
    }

    // ──────────────────────────────────────────
    // MY STATS — God child's own profile-card stats
    // Days-with-activity, this-month days, current streak.
    // ──────────────────────────────────────────
    public async Task<MyStatsResponse> GetMyStatsAsync(Guid userId, DateOnly? clientToday)
    {
        var logs = await _db.DailyLogs
            .Where(d => d.UserId == userId)
            .AsNoTracking()
            .ToListAsync();

        // Only days with at least one activity count (consistent with streak).
        var activeLogs = logs.Where(l => CountToggles(l) > 0).ToList();

        // Anchor "today"/"this month" to the client's local date when supplied,
        // since logs are keyed by the client's local date.
        var anchor = clientToday ?? DateOnly.FromDateTime(DateTime.UtcNow);

        return new MyStatsResponse
        {
            TotalDays = activeLogs.Count,
            ThisMonthDays = activeLogs.Count(l =>
                l.LogDate.Year == anchor.Year && l.LogDate.Month == anchor.Month),
            CurrentStreak = CalculateStreak(activeLogs, anchor)
        };
    }

    // ──────────────────────────────────────────
    // GET LOGS — User's daily logs with date filter
    // ──────────────────────────────────────────
    public async Task<List<ChecklistResponse>> GetUserLogsAsync(
        Guid userId, DateOnly? from, DateOnly? to)
    {
        var query = _db.DailyLogs
            .Where(d => d.UserId == userId)
            .AsNoTracking();

        // Apply date filters if provided
        if (from.HasValue)
            query = query.Where(d => d.LogDate >= from.Value);

        if (to.HasValue)
            query = query.Where(d => d.LogDate <= to.Value);

        var logs = await query
            .OrderByDescending(d => d.LogDate)
            .ToListAsync();

        return logs.Select(d => new ChecklistResponse
        {
            Id = d.Id,
            LogDate = d.LogDate,
            Prayer = d.PrayerSelections,
            BibleReading = d.BibleReadingSelections,
            SpiritualBooks = d.SpiritualBooksSelections,
            GoodDeeds = d.GoodDeedsSelections,
            AvoidingEvil = d.AvoidingEvilSelections,
            UpdatedAt = d.UpdatedAt
        }).ToList();
    }

    // ──────────────────────────────────────────
    // GET WEEK LOGS — Logs for a specific week number
    // ──────────────────────────────────────────
    public async Task<WeekLogsResponse?> GetWeekLogsAsync(Guid userId, int weekNumber)
    {
        var user = await _db.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == userId && u.Role == "GodChild");

        if (user == null) return null;

        var joinDate = DateOnly.FromDateTime(user.CreatedAt);
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var (currentWeek, _) = CalculateWeekCycle(user.CreatedAt, today);

        // Don't allow fetching weeks that haven't started yet
        if (weekNumber < 1 || weekNumber > currentWeek) return null;

        var weekStart = joinDate.AddDays((weekNumber - 1) * 7);
        var weekEnd = weekStart.AddDays(6);
        var isCurrentWeek = weekNumber == currentWeek;
        var isComplete = today > weekEnd;

        // Fetch logs for this week
        var logs = await _db.DailyLogs
            .Where(d => d.UserId == userId && d.LogDate >= weekStart && d.LogDate <= weekEnd)
            .OrderBy(d => d.LogDate)
            .AsNoTracking()
            .ToListAsync();

        // Build 7-slot array (null = no log for that day)
        var logsByDate = logs.ToDictionary(l => l.LogDate);
        var slots = new List<ChecklistResponse?>();
        for (int i = 0; i < 7; i++)
        {
            var date = weekStart.AddDays(i);
            // Don't create slots for days in the future
            if (date > today)
            {
                slots.Add(null);
                continue;
            }

            if (logsByDate.TryGetValue(date, out var log))
            {
                slots.Add(new ChecklistResponse
                {
                    Id = log.Id,
                    LogDate = log.LogDate,
                    Prayer = log.PrayerSelections,
                    BibleReading = log.BibleReadingSelections,
                    SpiritualBooks = log.SpiritualBooksSelections,
                    GoodDeeds = log.GoodDeedsSelections,
                    AvoidingEvil = log.AvoidingEvilSelections,
                    UpdatedAt = log.UpdatedAt
                });
            }
            else
            {
                // Day has passed but no log exists — empty entry
                slots.Add(new ChecklistResponse
                {
                    Id = Guid.Empty,
                    LogDate = date,
                    Prayer = new(),
                    BibleReading = new(),
                    SpiritualBooks = new(),
                    GoodDeeds = new(),
                    AvoidingEvil = new(),
                    UpdatedAt = DateTime.MinValue
                });
            }
        }

        // Check if a priest review exists for this week's date range
        var weekStartDt = weekStart.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc);
        var weekEndDt = weekEnd.ToDateTime(TimeOnly.MaxValue, DateTimeKind.Utc);
        var hasReview = await _db.PriestReviews
            .AnyAsync(r => r.GodChildId == userId &&
                           r.CreatedAt >= weekStartDt && r.CreatedAt <= weekEndDt);

        // Build summary
        var summary = BuildWeekSummary(logs);

        return new WeekLogsResponse
        {
            WeekNumber = weekNumber,
            WeekStart = weekStart,
            WeekEnd = weekEnd,
            IsCurrentWeek = isCurrentWeek,
            IsComplete = isComplete,
            Logs = slots,
            Summary = summary,
            HasReview = hasReview
        };
    }

    // ──────────────────────────────────────────
    // GET WEEK HISTORY — List of all weeks for a user
    // ──────────────────────────────────────────
    public async Task<List<WeekHistoryItem>> GetWeekHistoryAsync(Guid userId)
    {
        var user = await _db.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == userId && u.Role == "GodChild");

        if (user == null) return new();

        var joinDate = DateOnly.FromDateTime(user.CreatedAt);
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var (currentWeek, _) = CalculateWeekCycle(user.CreatedAt, today);

        // Cap at 13 weeks (90 days)
        var maxWeek = Math.Min(currentWeek, 13);

        // Fetch all logs within the range
        var allLogs = await _db.DailyLogs
            .Where(d => d.UserId == userId)
            .AsNoTracking()
            .ToListAsync();

        var allReviews = await _db.PriestReviews
            .Where(r => r.GodChildId == userId)
            .Select(r => r.CreatedAt)
            .ToListAsync();

        var weeks = new List<WeekHistoryItem>();

        for (int w = 1; w <= maxWeek; w++)
        {
            var weekStart = joinDate.AddDays((w - 1) * 7);
            var weekEnd = weekStart.AddDays(6);
            var isCurrentWeek = w == currentWeek;
            var isComplete = today > weekEnd;

            // Filter logs for this week
            var weekLogs = allLogs.Where(l => l.LogDate >= weekStart && l.LogDate <= weekEnd).ToList();
            var daysWithActivity = weekLogs.Count(l => CountToggles(l) > 0);
            var totalToggles = weekLogs.Sum(l => CountToggles(l));
            var completionRate = Math.Round((double)totalToggles / 35.0 * 100, 1);

            // Count reviews in this week's date range
            var weekStartDt = weekStart.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc);
            var weekEndDt = weekEnd.ToDateTime(TimeOnly.MaxValue, DateTimeKind.Utc);
            var reviewCount = allReviews.Count(r => r >= weekStartDt && r <= weekEndDt);

            weeks.Add(new WeekHistoryItem
            {
                WeekNumber = w,
                WeekStart = weekStart,
                WeekEnd = weekEnd,
                IsCurrentWeek = isCurrentWeek,
                IsComplete = isComplete,
                DaysWithActivity = daysWithActivity,
                CompletionRate = completionRate,
                ReviewCount = reviewCount
            });
        }

        return weeks;
    }

    // ──────────────────────────────────────────
    // DELETE WEEK — Delete logs + reviews for a week
    // ──────────────────────────────────────────
    public async Task<bool> DeleteWeekDataAsync(Guid userId, int weekNumber)
    {
        var user = await _db.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == userId && u.Role == "GodChild");

        if (user == null) return false;

        var joinDate = DateOnly.FromDateTime(user.CreatedAt);
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var (currentWeek, _) = CalculateWeekCycle(user.CreatedAt, today);

        // Can only delete completed weeks (not the current one)
        if (weekNumber < 1 || weekNumber >= currentWeek) return false;

        var weekStart = joinDate.AddDays((weekNumber - 1) * 7);
        var weekEnd = weekStart.AddDays(6);

        // Delete logs for this week
        await _db.DailyLogs
            .Where(d => d.UserId == userId && d.LogDate >= weekStart && d.LogDate <= weekEnd)
            .ExecuteDeleteAsync();

        // Delete reviews for this week
        var weekStartDt = weekStart.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc);
        var weekEndDt = weekEnd.ToDateTime(TimeOnly.MaxValue, DateTimeKind.Utc);
        await _db.PriestReviews
            .Where(r => r.GodChildId == userId &&
                         r.CreatedAt >= weekStartDt && r.CreatedAt <= weekEndDt)
            .ExecuteDeleteAsync();

        return true;
    }

    // ──────────────────────────────────────────
    // GET STATS — Completion rate and streak
    // ──────────────────────────────────────────
    public async Task<object> GetUserStatsAsync(Guid userId)
    {
        var logs = await _db.DailyLogs
            .Where(d => d.UserId == userId)
            .AsNoTracking()
            .ToListAsync();

        var activeLogs = logs.Where(l => CountToggles(l) > 0).ToList();

        var totalLogs = logs.Sum(l => CountToggles(l));

        var sevenDaysAgo = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(-6));
        var togglesIn7Days = logs.Where(l => l.LogDate >= sevenDaysAgo).Sum(l => CountToggles(l));
        var completionRate = Math.Round((double)togglesIn7Days / 35.0 * 100, 1);

        return new
        {
            TotalLogs = totalLogs,
            CompletionRate = completionRate,
            CurrentStreak = CalculateStreak(activeLogs),
            TotalDaysTracked = logs.Count,
            ActivitiesBreakdown = new
            {
                Prayer = logs.Count(l => l.PrayerSelections.Count > 0),
                BibleReading = logs.Count(l => l.BibleReadingSelections.Count > 0),
                SpiritualBooks = logs.Count(l => l.SpiritualBooksSelections.Count > 0),
                GoodDeeds = logs.Count(l => l.GoodDeedsSelections.Count > 0),
                AvoidingEvil = logs.Count(l => l.AvoidingEvilSelections.Count > 0)
            }
        };
    }

    // ──────────────────────────────────────────
    // TOGGLE STATUS — Activate/Deactivate a user
    // ──────────────────────────────────────────
    public async Task<bool> ToggleUserStatusAsync(Guid userId, bool isActive)
    {
        var user = await _db.Users
            .FirstOrDefaultAsync(u => u.Id == userId && u.Role == "GodChild");

        if (user == null)
            return false;

        user.IsActive = isActive;
        await _db.SaveChangesAsync();
        return true;
    }

    // ──────────────────────────────────────────
    // DELETE — Hard delete a GodChild user
    // ──────────────────────────────────────────
    public async Task<bool> DeleteUserAsync(Guid userId)
    {
        var user = await _db.Users
            .FirstOrDefaultAsync(u => u.Id == userId && u.Role == "GodChild");

        if (user == null)
            return false;

        _db.Users.Remove(user);
        await _db.SaveChangesAsync();
        return true;
    }

    // ══════════════════════════════════════════
    // PRIVATE HELPERS
    // ══════════════════════════════════════════

    /// <summary>
    /// Calculates the week number and day-in-week for a user based on their join date.
    /// Week 1 starts on joinDate, each week is exactly 7 days.
    /// </summary>
    private static (int WeekNumber, int DayInWeek) CalculateWeekCycle(DateTime createdAt, DateOnly today)
    {
        var joinDate = DateOnly.FromDateTime(createdAt);
        var totalDays = today.DayNumber - joinDate.DayNumber;

        // If user registered today or in the future, they're on W1 Day 1
        if (totalDays < 0) return (1, 1);

        var weekNumber = (totalDays / 7) + 1;
        var dayInWeek = (totalDays % 7) + 1;

        return (weekNumber, dayInWeek);
    }

    /// <summary>
    /// Counts toggle categories with at least one selection in a log entry.
    /// </summary>
    private static int CountToggles(Models.Domain.DailyLog log)
    {
        return (log.PrayerSelections.Count > 0 ? 1 : 0) +
               (log.BibleReadingSelections.Count > 0 ? 1 : 0) +
               (log.SpiritualBooksSelections.Count > 0 ? 1 : 0) +
               (log.GoodDeedsSelections.Count > 0 ? 1 : 0) +
               (log.AvoidingEvilSelections.Count > 0 ? 1 : 0);
    }

    /// <summary>
    /// Builds a WeekSummary from a list of DailyLogs for a given week.
    /// </summary>
    private static WeekSummary BuildWeekSummary(List<Models.Domain.DailyLog> logs)
    {
        var daysWithActivity = logs.Count(l => CountToggles(l) > 0);
        var totalActivities = logs.Sum(l => CountToggles(l));
        var completionRate = Math.Round((double)totalActivities / 35.0 * 100, 1);

        // Determine strongest and weakest areas
        var categoryCounts = new Dictionary<string, int>
        {
            ["Prayer"] = logs.Count(l => l.PrayerSelections.Count > 0),
            ["BibleReading"] = logs.Count(l => l.BibleReadingSelections.Count > 0),
            ["SpiritualBooks"] = logs.Count(l => l.SpiritualBooksSelections.Count > 0),
            ["GoodDeeds"] = logs.Count(l => l.GoodDeedsSelections.Count > 0),
            ["AvoidingEvil"] = logs.Count(l => l.AvoidingEvilSelections.Count > 0),
        };

        var maxCount = categoryCounts.Values.DefaultIfEmpty(0).Max();
        var strongest = categoryCounts
            .Where(kv => kv.Value == maxCount && kv.Value > 0)
            .Select(kv => kv.Key).ToArray();
        var weakest = categoryCounts
            .Where(kv => kv.Value > 0 && kv.Value < maxCount)
            .Select(kv => kv.Key).ToArray();

        return new WeekSummary
        {
            DaysWithActivity = daysWithActivity,
            TotalActivities = totalActivities,
            CompletionRate = completionRate,
            StrongestAreas = strongest,
            WeakestAreas = weakest
        };
    }

    /// <summary>
    /// Calculates current streak of consecutive days with at least one toggle.
    /// <paramref name="today"/> anchors "today" — pass the client's local date so the
    /// streak matches how logs are keyed (local date); defaults to UTC today when null.
    /// </summary>
    private static int CalculateStreak(
        List<Models.Domain.DailyLog> logs,
        DateOnly? today = null)
    {
        if (logs.Count == 0) return 0;

        // Sort by date descending (newest first)
        var sortedDates = logs
            .Select(l => l.LogDate)
            .OrderByDescending(d => d)
            .ToList();

        var streak = 0;
        var expectedDate = today ?? DateOnly.FromDateTime(DateTime.UtcNow);

        // If they haven't logged today, start checking from yesterday
        if (sortedDates[0] != expectedDate)
            expectedDate = expectedDate.AddDays(-1);

        foreach (var date in sortedDates)
        {
            if (date == expectedDate)
            {
                streak++;
                expectedDate = expectedDate.AddDays(-1);
            }
            else
            {
                break;  // Streak broken — a day was missed
            }
        }

        return streak;
    }
}
