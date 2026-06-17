using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TheWay.Api.Services;

namespace TheWay.Api.Controllers;

/// <summary>
/// Self-service endpoints for God Children to access their own history.
/// </summary>
[ApiController]
[Route("api/me")]
[Authorize(Roles = "GodChild")]
public class MeController : ControllerBase
{
    private readonly UserService _userService;

    public MeController(UserService userService)
    {
        _userService = userService;
    }

    // ──────────────────────────────────────────
    // GET /api/me/weeks
    // GodChild's own weekly history
    // ──────────────────────────────────────────
    [HttpGet("weeks")]
    public async Task<IActionResult> GetMyWeeks()
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        var weeks = await _userService.GetWeekHistoryAsync(userId.Value);
        return Ok(weeks);
    }

    // ──────────────────────────────────────────
    // GET /api/me/weeks/{weekNumber}
    // GodChild's own week detail
    // ──────────────────────────────────────────
    [HttpGet("weeks/{weekNumber}")]
    public async Task<IActionResult> GetMyWeekLogs(int weekNumber)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        var result = await _userService.GetWeekLogsAsync(userId.Value, weekNumber);

        if (result == null)
            return NotFound(new { message = "Week not found." });

        return Ok(result);
    }

    // ──────────────────────────────────────────
    // DELETE /api/me/weeks/{weekNumber}
    // GodChild clears their own week data
    // ──────────────────────────────────────────
    [HttpDelete("weeks/{weekNumber}")]
    public async Task<IActionResult> DeleteMyWeekData(int weekNumber)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        var success = await _userService.DeleteWeekDataAsync(userId.Value, weekNumber);

        if (!success)
            return NotFound(new { message = "Week not found or cannot be deleted." });

        return Ok(new { message = $"Week {weekNumber} data cleared." });
    }

    // ──────────────────────────────────────────
    // GET /api/me/profile
    // GodChild's own profile with week info
    // ──────────────────────────────────────────
    [HttpGet("profile")]
    public async Task<IActionResult> GetMyProfile()
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        var detail = await _userService.GetUserByIdAsync(userId.Value);
        if (detail == null) return NotFound();

        return Ok(detail);
    }

    // ──────────────────────────────────────────
    // GET /api/me/priest
    // Public info of this god child's priest (name, phone, picture)
    // ──────────────────────────────────────────
    [HttpGet("priest")]
    public async Task<IActionResult> GetMyPriest()
    {
        var priest = await _userService.GetPriestPublicAsync();
        if (priest == null) return NotFound();

        return Ok(priest);
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
