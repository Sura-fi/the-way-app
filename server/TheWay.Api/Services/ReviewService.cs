using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using TheWay.Api.Data;
using TheWay.Api.Hubs;
using TheWay.Api.Models.Domain;
using TheWay.Api.Models.Dtos.Reviews;

namespace TheWay.Api.Services;

public class ReviewService
{
    private readonly AppDbContext _db;
    private readonly IHubContext<QuoteHub> _hubContext;

    public ReviewService(AppDbContext db, IHubContext<QuoteHub> hubContext)
    {
        _db = db;
        _hubContext = hubContext;
    }

    // ──────────────────────────────────────────
    // LIST — Get all non-expired reviews for a God Child
    // ──────────────────────────────────────────
    public Task<List<ReviewResponse>> GetReviewsForChildAsync(Guid godChildId) =>
        QueryForChildAsync(godChildId, pendingOnly: false);

    // ──────────────────────────────────────────
    // PENDING — Non-expired reviews the God Child hasn't said "Amen" to yet
    // ──────────────────────────────────────────
    public Task<List<ReviewResponse>> GetPendingForChildAsync(Guid godChildId) =>
        QueryForChildAsync(godChildId, pendingOnly: true);

    // ──────────────────────────────────────────
    // CREATE — Priest writes a review for a God Child
    // ──────────────────────────────────────────
    public async Task<ReviewResponse> CreateReviewAsync(
        Guid priestId, Guid godChildId, CreateReviewRequest request)
    {
        // Verify the God Child exists (and get their join date for the week number)
        var joinedAt = await _db.Users
            .Where(u => u.Id == godChildId && u.Role == "GodChild")
            .Select(u => (DateTime?)u.CreatedAt)
            .FirstOrDefaultAsync();

        if (joinedAt == null)
            throw new InvalidOperationException("God Child not found.");

        var review = new PriestReview
        {
            Id = Guid.NewGuid(),
            GodChildId = godChildId,
            PriestId = priestId,
            Content = request.Content,
            CreatedAt = DateTime.UtcNow,
            ExpiresAt = DateTime.UtcNow.AddMonths(3)
        };

        _db.PriestReviews.Add(review);
        await _db.SaveChangesAsync();

        // Fetch the Priest name directly for the response
        var priestName = await _db.Users
            .Where(u => u.Id == priestId)
            .Select(u => u.SpiritualName)
            .FirstOrDefaultAsync() ?? "Unknown";

        var response = MapToResponse(review, joinedAt.Value, priestName);

        // Pop-up for the God Child if they have the app open
        await _hubContext.Clients.User(godChildId.ToString())
            .SendAsync("ReviewReceived", response);

        return response;
    }

    // ──────────────────────────────────────────
    // ACKNOWLEDGE — God Child says "Amen" to a review (one-way, idempotent)
    // ──────────────────────────────────────────
    public async Task<ReviewResponse?> AcknowledgeReviewAsync(Guid reviewId, Guid godChildId)
    {
        var now = DateTime.UtcNow;

        var review = await _db.PriestReviews
            .Include(r => r.Priest)
            .FirstOrDefaultAsync(r =>
                r.Id == reviewId && r.GodChildId == godChildId && r.ExpiresAt > now);

        if (review == null)
            return null;

        if (review.AcknowledgedAt == null)
        {
            review.AcknowledgedAt = now;
            await _db.SaveChangesAsync();

            // Live update on the priest's screen
            await _hubContext.Clients.Group(QuoteHub.PriestsGroup).SendAsync(
                "ReviewAcknowledged",
                new { reviewId = review.Id, godChildId, acknowledgedAt = review.AcknowledgedAt });
        }

        var joinedAt = await _db.Users
            .Where(u => u.Id == godChildId)
            .Select(u => u.CreatedAt)
            .FirstAsync();

        return MapToResponse(review, joinedAt);
    }

    // ──────────────────────────────────────────
    // DELETE — Priest manually deletes their own review
    // ──────────────────────────────────────────
    public async Task<bool> DeleteReviewAsync(Guid reviewId, Guid priestId)
    {
        var review = await _db.PriestReviews
            .FirstOrDefaultAsync(r => r.Id == reviewId && r.PriestId == priestId);

        if (review == null)
            return false;

        _db.PriestReviews.Remove(review);
        await _db.SaveChangesAsync();
        return true;
    }

    // ──────────────────────────────────────────
    // Map domain entity to response DTO.
    // childJoinedAt anchors the week number (a review belongs to the week it was written).
    // ──────────────────────────────────────────
    public static ReviewResponse MapToResponse(
        PriestReview review, DateTime childJoinedAt, string? priestName = null)
    {
        return new ReviewResponse
        {
            Id = review.Id,
            Content = review.Content,
            CreatedAt = review.CreatedAt,
            ExpiresAt = review.ExpiresAt,
            AcknowledgedAt = review.AcknowledgedAt,
            WeekNumber = UserService.CalculateWeekCycle(
                childJoinedAt, DateOnly.FromDateTime(review.CreatedAt)).WeekNumber,
            PriestName = priestName ?? review.Priest?.SpiritualName ?? "Unknown"
        };
    }

    // ──────────────────────────────────────────
    // PRIVATE: Non-expired reviews for a child, newest first
    // ──────────────────────────────────────────
    private async Task<List<ReviewResponse>> QueryForChildAsync(Guid godChildId, bool pendingOnly)
    {
        var now = DateTime.UtcNow;

        var joinedAt = await _db.Users
            .Where(u => u.Id == godChildId)
            .Select(u => (DateTime?)u.CreatedAt)
            .FirstOrDefaultAsync();

        if (joinedAt == null)
            return new();

        var query = _db.PriestReviews
            .Where(r => r.GodChildId == godChildId && r.ExpiresAt > now);

        if (pendingOnly)
            query = query.Where(r => r.AcknowledgedAt == null);

        var reviews = await query
            .Include(r => r.Priest)
            .OrderByDescending(r => r.CreatedAt)
            .AsNoTracking()
            .ToListAsync();

        return reviews.Select(r => MapToResponse(r, joinedAt.Value)).ToList();
    }
}
