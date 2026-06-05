using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TheWay.Api.Services;

namespace TheWay.Api.Controllers;

[ApiController]
[Route("api/users")]
[Authorize(Roles = "Priest")]
public class UsersController : ControllerBase
{
    private readonly UserService _userService;

    public UsersController(UserService userService)
    {
        _userService = userService;
    }

    // ──────────────────────────────────────────
    // GET /api/users?search=&page=1&pageSize=10
    // List God Children with search and pagination
    // ──────────────────────────────────────────
    [HttpGet]
    public async Task<IActionResult> GetUsers(
        [FromQuery] string? search,
        [FromQuery] bool? isActive,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10)
    {
        if (page < 1) page = 1;
        if (pageSize < 1 || pageSize > 50) pageSize = 10;

        var users = await _userService.GetUsersAsync(search, page, pageSize, isActive);
        return Ok(users);
    }

    // ──────────────────────────────────────────
    // GET /api/users/{id}
    // Single user profile + computed stats
    // ──────────────────────────────────────────
    [HttpGet("{id}")]
    public async Task<IActionResult> GetUser(Guid id)
    {
        var user = await _userService.GetUserByIdAsync(id);

        if (user == null)
            return NotFound(new { message = "User not found." });

        return Ok(user);
    }

    // ──────────────────────────────────────────
    // GET /api/users/{id}/logs?from=2026-05-01&to=2026-05-23
    // User's daily logs with optional date filters
    // ──────────────────────────────────────────
    [HttpGet("{id}/logs")]
    public async Task<IActionResult> GetUserLogs(
        Guid id,
        [FromQuery] DateOnly? from,
        [FromQuery] DateOnly? to)
    {
        var logs = await _userService.GetUserLogsAsync(id, from, to);
        return Ok(logs);
    }

    // ──────────────────────────────────────────
    // GET /api/users/{id}/logs/week/{weekNumber}
    // Logs for a specific week in the user's cycle
    // ──────────────────────────────────────────
    [HttpGet("{id}/logs/week/{weekNumber}")]
    public async Task<IActionResult> GetUserWeekLogs(Guid id, int weekNumber)
    {
        var result = await _userService.GetWeekLogsAsync(id, weekNumber);

        if (result == null)
            return NotFound(new { message = "Week not found." });

        return Ok(result);
    }

    // ──────────────────────────────────────────
    // GET /api/users/{id}/weeks
    // List of all available weeks for history browsing
    // ──────────────────────────────────────────
    [HttpGet("{id}/weeks")]
    public async Task<IActionResult> GetUserWeeks(Guid id)
    {
        var weeks = await _userService.GetWeekHistoryAsync(id);
        return Ok(weeks);
    }

    // ──────────────────────────────────────────
    // DELETE /api/users/{id}/weeks/{weekNumber}
    // Delete logs + reviews for a specific week
    // ──────────────────────────────────────────
    [HttpDelete("{id}/weeks/{weekNumber}")]
    public async Task<IActionResult> DeleteWeekData(Guid id, int weekNumber)
    {
        var success = await _userService.DeleteWeekDataAsync(id, weekNumber);

        if (!success)
            return NotFound(new { message = "Week not found or cannot be deleted." });

        return Ok(new { message = $"Week {weekNumber} data deleted successfully." });
    }

    // ──────────────────────────────────────────
    // GET /api/users/{id}/stats
    // Completion rate, streak, activity breakdown
    // ──────────────────────────────────────────
    [HttpGet("{id}/stats")]
    public async Task<IActionResult> GetUserStats(Guid id)
    {
        var stats = await _userService.GetUserStatsAsync(id);
        return Ok(stats);
    }

    // ──────────────────────────────────────────
    // PATCH /api/users/{id}/status
    // Activate or deactivate a user
    // ──────────────────────────────────────────
    [HttpPatch("{id}/status")]
    public async Task<IActionResult> UpdateStatus(
        Guid id,
        [FromBody] UpdateStatusRequest request)
    {
        var success = await _userService.ToggleUserStatusAsync(id, request.IsActive);

        if (!success)
            return NotFound(new { message = "User not found." });

        return Ok(new { message = $"User {(request.IsActive ? "activated" : "deactivated")} successfully." });
    }

    // ──────────────────────────────────────────
    // DELETE /api/users/{id}
    // Permanently delete a GodChild and all their data
    // ──────────────────────────────────────────
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteUser(Guid id)
    {
        var success = await _userService.DeleteUserAsync(id);

        if (!success)
            return NotFound(new { message = "User not found." });

        return Ok(new { message = "User deleted successfully." });
    }
}

// Small DTO — can live in this file since it's only used here
public class UpdateStatusRequest
{
    public bool IsActive { get; set; }
}
