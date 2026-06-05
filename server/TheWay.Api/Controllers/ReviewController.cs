using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TheWay.Api.Models.Dtos.Reviews;
using TheWay.Api.Services;

namespace TheWay.Api.Controllers;

[ApiController]
[Route("api/users/{godChildId}/reviews")]
[Authorize(Roles = "Priest")]
public class ReviewController : ControllerBase
{
    private readonly ReviewService _reviewService;

    public ReviewController(ReviewService reviewService)
    {
        _reviewService = reviewService;
    }

    // ──────────────────────────────────────────
    // GET /api/users/{godChildId}/reviews
    // List all non-expired reviews for a God Child
    // ──────────────────────────────────────────
    [HttpGet]
    public async Task<IActionResult> GetReviews(Guid godChildId)
    {
        var reviews = await _reviewService.GetReviewsForChildAsync(godChildId);
        return Ok(reviews);
    }

    // ──────────────────────────────────────────
    // POST /api/users/{godChildId}/reviews
    // Priest writes a new review
    // ──────────────────────────────────────────
    [HttpPost]
    public async Task<IActionResult> CreateReview(
        Guid godChildId,
        [FromBody] CreateReviewRequest request)
    {
        // Extract the priest's ID from the JWT claims
        var priestId = Guid.Parse(
            User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        try
        {
            var review = await _reviewService.CreateReviewAsync(
                priestId, godChildId, request);
            return Created($"/api/users/{godChildId}/reviews/{review.Id}", review);
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    // ──────────────────────────────────────────
    // DELETE /api/users/{godChildId}/reviews/{reviewId}
    // Priest manually deletes their own review
    // ──────────────────────────────────────────
    [HttpDelete("{reviewId}")]
    public async Task<IActionResult> DeleteReview(
        Guid godChildId, Guid reviewId)
    {
        var priestId = Guid.Parse(
            User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        var success = await _reviewService.DeleteReviewAsync(reviewId, priestId);

        if (!success)
            return NotFound(new { message = "Review not found or you are not the author." });

        return Ok(new { message = "Review deleted successfully." });
    }
}
