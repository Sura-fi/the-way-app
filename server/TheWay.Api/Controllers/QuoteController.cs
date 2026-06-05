using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TheWay.Api.Models.Dtos.Quote;
using TheWay.Api.Services;

namespace TheWay.Api.Controllers;

[ApiController]
[Route("api/quotes")]
[Authorize]
public class QuoteController : ControllerBase
{
    private readonly QuoteService _quoteService;

    public QuoteController(QuoteService quoteService)
    {
        _quoteService = quoteService;
    }

    // ──────────────────────────────────────────
    // POST /api/quotes
    // Priest publishes a new quote
    // ──────────────────────────────────────────
    [HttpPost]
    [Authorize(Roles = "Priest")]
    public async Task<IActionResult> Publish([FromBody] PublishQuoteRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Content))
            return BadRequest(new { message = "Quote content cannot be empty." });

        if (request.Content.Length > 500)
            return BadRequest(new { message = "Quote cannot exceed 500 characters." });

        var userId = GetUserId();
        if (userId == null)
            return Unauthorized(new { message = "Invalid token." });

        var result = await _quoteService.PublishAsync(userId.Value, request);
        return Ok(result);
    }

    // ──────────────────────────────────────────
    // GET /api/quotes/active
    // Any authenticated user can get the active quote
    // ──────────────────────────────────────────
    [HttpGet("active")]
    public async Task<IActionResult> GetActive()
    {
        var result = await _quoteService.GetActiveAsync();

        if (result == null)
            return NoContent();  // 204 — no quote has been published yet

        return Ok(result);
    }

    // ──────────────────────────────────────────
    // GET /api/quotes/history
    // Priest views all past quotes
    // ──────────────────────────────────────────
    [HttpGet("history")]
    [Authorize(Roles = "Priest")]
    public async Task<IActionResult> GetHistory()
    {
        var results = await _quoteService.GetHistoryAsync();
        return Ok(results);
    }

    // ──────────────────────────────────────────
    // PRIVATE: Extract user ID from JWT claims
    // ──────────────────────────────────────────
    private Guid? GetUserId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (claim == null || !Guid.TryParse(claim, out var userId))
            return null;
        return userId;
    }
}
