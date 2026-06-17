using Microsoft.EntityFrameworkCore;
using TheWay.Api.Data;
using TheWay.Api.Models.Domain;
using TheWay.Api.Models.Dtos.Checklist;
namespace TheWay.Api.Services;
public class ChecklistService
{
    private readonly AppDbContext _db;
    public ChecklistService(AppDbContext db)
    {
        _db = db;
    }
    // ──────────────────────────────────────────
    // GET TODAY — Returns today's log for a user
    // ──────────────────────────────────────────
    public async Task<ChecklistResponse?> GetTodayAsync(Guid userId, string? dateStr)
    {
        DateOnly today;
        if (!string.IsNullOrEmpty(dateStr) && DateOnly.TryParse(dateStr, out var parsed))
            today = parsed;
        else
            today = DateOnly.FromDateTime(DateTime.UtcNow);

        var log = await _db.DailyLogs
            .FirstOrDefaultAsync(d => d.UserId == userId && d.LogDate == today);
        if (log == null)
            return null;
        return MapToResponse(log);
    }

    // ──────────────────────────────────────────
    // UPSERT TODAY — Creates or updates today's log
    // ──────────────────────────────────────────
    public async Task<ChecklistResponse> UpsertTodayAsync(Guid userId, UpsertChecklistRequest request)
    {
        DateOnly today;
        if (!string.IsNullOrEmpty(request.LogDate) && DateOnly.TryParse(request.LogDate, out var parsed))
            today = parsed;
        else
            today = DateOnly.FromDateTime(DateTime.UtcNow);

        var log = await _db.DailyLogs
            .FirstOrDefaultAsync(d => d.UserId == userId && d.LogDate == today);
        if (log == null)
        {
            log = new DailyLog
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                LogDate = today,
                PrayerSelections = Sanitize(request.Prayer),
                BibleReadingSelections = Sanitize(request.BibleReading),
                SpiritualBooksSelections = Sanitize(request.SpiritualBooks),
                GoodDeedsSelections = Sanitize(request.GoodDeeds),
                AvoidingEvilSelections = Sanitize(request.AvoidingEvil),
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            _db.DailyLogs.Add(log);
        }
        else
        {
            log.PrayerSelections = Sanitize(request.Prayer);
            log.BibleReadingSelections = Sanitize(request.BibleReading);
            log.SpiritualBooksSelections = Sanitize(request.SpiritualBooks);
            log.GoodDeedsSelections = Sanitize(request.GoodDeeds);
            log.AvoidingEvilSelections = Sanitize(request.AvoidingEvil);
            log.UpdatedAt = DateTime.UtcNow;
        }

        await _db.SaveChangesAsync();
        return MapToResponse(log);
    }

    // ──────────────────────────────────────────
    // SYNC — Upsert an array of offline logs
    // ──────────────────────────────────────────
    public async Task<List<ChecklistResponse>> SyncAsync(Guid userId, List<SyncLogEntry> entries)
    {
        var responses = new List<ChecklistResponse>();
        foreach (var entry in entries)
        {
            var log = await _db.DailyLogs
                .FirstOrDefaultAsync(d => d.UserId == userId && d.LogDate == entry.LogDate);
            if (log == null)
            {
                log = new DailyLog
                {
                    Id = Guid.NewGuid(),
                    UserId = userId,
                    LogDate = entry.LogDate,
                    PrayerSelections = Sanitize(entry.Prayer),
                    BibleReadingSelections = Sanitize(entry.BibleReading),
                    SpiritualBooksSelections = Sanitize(entry.SpiritualBooks),
                    GoodDeedsSelections = Sanitize(entry.GoodDeeds),
                    AvoidingEvilSelections = Sanitize(entry.AvoidingEvil),
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
                _db.DailyLogs.Add(log);
            }
            else
            {
                log.PrayerSelections = Sanitize(entry.Prayer);
                log.BibleReadingSelections = Sanitize(entry.BibleReading);
                log.SpiritualBooksSelections = Sanitize(entry.SpiritualBooks);
                log.GoodDeedsSelections = Sanitize(entry.GoodDeeds);
                log.AvoidingEvilSelections = Sanitize(entry.AvoidingEvil);
                log.UpdatedAt = DateTime.UtcNow;
            }
            responses.Add(MapToResponse(log));
        }
        await _db.SaveChangesAsync();
        return responses;
    }
    
    // ──────────────────────────────────────────
    // PRIVATE: Cleans incoming selection lists before saving
    // ──────────────────────────────────────────
    private static List<string> Sanitize(List<string> items) =>
        (items ?? new List<string>())
            .Where(s => !string.IsNullOrWhiteSpace(s))
            .Where(s => !IsEmptyOther(s))
            .Select(s => s.Length > 90 ? s[..90] : s)
            .Take(10)
            .ToList();

    // An "Other:" entry with no text after the prefix is not a real selection.
    // A bare "Other" key is left untouched — it was a valid preset choice.
    private static bool IsEmptyOther(string s) =>
        s.StartsWith("Other:") && string.IsNullOrWhiteSpace(s[6..]);

    // ──────────────────────────────────────────
    // PRIVATE: Maps a DailyLog entity to a ChecklistResponse DTO
    // ──────────────────────────────────────────
    private static ChecklistResponse MapToResponse(DailyLog log)
    {
        return new ChecklistResponse
        {
            Id = log.Id,
            LogDate = log.LogDate,
            Prayer = log.PrayerSelections,
            BibleReading = log.BibleReadingSelections,
            SpiritualBooks = log.SpiritualBooksSelections,
            GoodDeeds = log.GoodDeedsSelections,
            AvoidingEvil = log.AvoidingEvilSelections,
            UpdatedAt = log.UpdatedAt
        };
    }
}
