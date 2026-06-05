using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TheWay.Api.Models.Dtos.Checklist;
using TheWay.Api.Services;

namespace TheWay.Api.Controllers;

[ApiController]
[Route("api/checklist")]
[Authorize]
public class ChecklistController : ControllerBase
{
    private readonly ChecklistService _checklistService;

    public ChecklistController(ChecklistService checklistService)
    {
        _checklistService = checklistService;
    }

    // ──────────────────────────────────────────
    // GET /api/checklist/today
    // Returns today's log for the authenticated user
    // ──────────────────────────────────────────
    [HttpGet("today")]
    public async Task<IActionResult> GetToday([FromQuery] string? date)
    {
        var userId = GetUserId();
        if (userId == null)
            return Unauthorized(new { message = "Invalid token." });

        var result = await _checklistService.GetTodayAsync(userId.Value, date);

        if (result == null)
            return NoContent();  // 204 — no log exists yet for today

        return Ok(result);  // 200 — here's today's log
    }

    // ──────────────────────────────────────────
    // PUT /api/checklist/today
    // Creates or updates today's log
    // ──────────────────────────────────────────
    [HttpPut("today")]
    public async Task<IActionResult> UpsertToday([FromBody] UpsertChecklistRequest request)
    {
        var userId = GetUserId();
        if (userId == null)
            return Unauthorized(new { message = "Invalid token." });

        var result = await _checklistService.UpsertTodayAsync(userId.Value, request);
        return Ok(result);
    }

    // ──────────────────────────────────────────
    // POST /api/checklist/sync
    // Accepts an array of offline logs and upserts each
    // ──────────────────────────────────────────
    [HttpPost("sync")]
    public async Task<IActionResult> Sync([FromBody] List<SyncLogEntry> entries)
    {
        var userId = GetUserId();
        if (userId == null)
            return Unauthorized(new { message = "Invalid token." });

        if (entries == null || entries.Count == 0)
            return BadRequest(new { message = "No entries provided." });

        var results = await _checklistService.SyncAsync(userId.Value, entries);
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
