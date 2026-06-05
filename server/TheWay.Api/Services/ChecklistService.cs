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
                PrayerSelections = request.Prayer,
                BibleReadingSelections = request.BibleReading,
                SpiritualBooksSelections = request.SpiritualBooks,
                GoodDeedsSelections = request.GoodDeeds,
                AvoidingEvilSelections = request.AvoidingEvil,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            _db.DailyLogs.Add(log);
        }
        else
        {
            log.PrayerSelections = request.Prayer;
            log.BibleReadingSelections = request.BibleReading;
            log.SpiritualBooksSelections = request.SpiritualBooks;
            log.GoodDeedsSelections = request.GoodDeeds;
            log.AvoidingEvilSelections = request.AvoidingEvil;
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
                    PrayerSelections = entry.Prayer,
                    BibleReadingSelections = entry.BibleReading,
                    SpiritualBooksSelections = entry.SpiritualBooks,
                    GoodDeedsSelections = entry.GoodDeeds,
                    AvoidingEvilSelections = entry.AvoidingEvil,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
                _db.DailyLogs.Add(log);
            }
            else
            {
                log.PrayerSelections = entry.Prayer;
                log.BibleReadingSelections = entry.BibleReading;
                log.SpiritualBooksSelections = entry.SpiritualBooks;
                log.GoodDeedsSelections = entry.GoodDeeds;
                log.AvoidingEvilSelections = entry.AvoidingEvil;
                log.UpdatedAt = DateTime.UtcNow;
            }
            responses.Add(MapToResponse(log));
        }
        await _db.SaveChangesAsync();
        return responses;
    }
    
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
