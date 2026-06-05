using Microsoft.EntityFrameworkCore;
using TheWay.Api.Data;
using TheWay.Api.Models.Domain;
using TheWay.Api.Models.Dtos.Reviews;

namespace TheWay.Api.Services;

public class ReviewService
{
    private readonly AppDbContext _db;

    public ReviewService(AppDbContext db)
    {
        _db = db;
    }

    // ──────────────────────────────────────────
    // LIST — Get all non-expired reviews for a God Child
    // ──────────────────────────────────────────
    public async Task<List<ReviewResponse>> GetReviewsForChildAsync(Guid godChildId)
    {
        var now = DateTime.UtcNow;

        var reviews = await _db.PriestReviews
            .Where(r => r.GodChildId == godChildId && r.ExpiresAt > now)
            .Include(r => r.Priest)
            .OrderByDescending(r => r.CreatedAt)
            .AsNoTracking()
            .ToListAsync();

        return reviews.Select(MapToResponse).ToList();
    }

    // ──────────────────────────────────────────
    // CREATE — Priest writes a review for a God Child
    // ──────────────────────────────────────────
    public async Task<ReviewResponse> CreateReviewAsync(
        Guid priestId, Guid godChildId, CreateReviewRequest request)
    {
        // Verify the God Child exists
        var childExists = await _db.Users
            .AnyAsync(u => u.Id == godChildId && u.Role == "GodChild");

        if (!childExists)
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

        return new ReviewResponse
        {
            Id = review.Id,
            Content = review.Content,
            CreatedAt = review.CreatedAt,
            ExpiresAt = review.ExpiresAt,
            PriestName = priestName
        };
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
    // PRIVATE: Map domain entity to response DTO
    // ──────────────────────────────────────────
    private static ReviewResponse MapToResponse(PriestReview review)
    {
        return new ReviewResponse
        {
            Id = review.Id,
            Content = review.Content,
            CreatedAt = review.CreatedAt,
            ExpiresAt = review.ExpiresAt,
            PriestName = review.Priest?.SpiritualName ?? "Unknown"
        };
    }
}
