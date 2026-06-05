using Microsoft.EntityFrameworkCore;
using TheWay.Api.Data;

namespace TheWay.Api.Services;

/// <summary>
/// Background service that purges expired priest reviews once per day.
/// Reviews have an ExpiresAt field set to CreatedAt + 3 months.
/// </summary>
public class ReviewCleanupService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<ReviewCleanupService> _logger;

    // Run the cleanup once every 24 hours
    private static readonly TimeSpan CleanupInterval = TimeSpan.FromHours(24);

    public ReviewCleanupService(
        IServiceScopeFactory scopeFactory,
        ILogger<ReviewCleanupService> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("ReviewCleanupService started.");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await PurgeExpiredReviewsAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error purging expired reviews.");
            }

            await Task.Delay(CleanupInterval, stoppingToken);
        }
    }

    private async Task PurgeExpiredReviewsAsync()
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var now = DateTime.UtcNow;
        var expiredCount = await db.PriestReviews
            .Where(r => r.ExpiresAt <= now)
            .ExecuteDeleteAsync();

        if (expiredCount > 0)
        {
            _logger.LogInformation(
                "Purged {Count} expired review(s).", expiredCount);
        }

        var cutoffDate = DateOnly.FromDateTime(now.AddDays(-90));
        var expiredLogsCount = await db.DailyLogs
            .Where(l => l.LogDate < cutoffDate)
            .ExecuteDeleteAsync();

        if (expiredLogsCount > 0)
        {
            _logger.LogInformation(
                "Purged {Count} expired daily log(s).", expiredLogsCount);
        }
    }
}
