using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using TheWay.Api.Data;
using TheWay.Api.Services;

namespace TheWay.Api.Hubs;

/// <summary>
/// Real-time hub: quote broadcasts, comment notifications and online presence.
/// </summary>
[Authorize]
public class QuoteHub : Hub
{
    public const string PriestsGroup = "priests";
    public const string GodChildrenGroup = "godchildren";

    private readonly PresenceTracker _presence;
    private readonly AppDbContext _db;

    public QuoteHub(PresenceTracker presence, AppDbContext db)
    {
        _presence = presence;
        _db = db;
    }

    /// <summary>
    /// Called when a client connects to the hub.
    /// Only authenticated users can connect (enforced by [Authorize]).
    /// </summary>
    public override async Task OnConnectedAsync()
    {
        var isPriest = IsPriest();
        await Groups.AddToGroupAsync(Context.ConnectionId, isPriest ? PriestsGroup : GodChildrenGroup);

        var userId = GetUserId();
        if (userId != null)
        {
            var now = DateTime.UtcNow;
            await TouchLastSeenAsync(userId.Value, now);

            if (_presence.Connect(userId.Value))
                await NotifyOtherSideAsync(isPriest, userId.Value, true, now);
        }

        await base.OnConnectedAsync();
    }

    /// <summary>
    /// Called when a client disconnects from the hub.
    /// </summary>
    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var userId = GetUserId();
        if (userId != null && _presence.Disconnect(userId.Value))
        {
            var now = DateTime.UtcNow;
            await TouchLastSeenAsync(userId.Value, now);
            await NotifyOtherSideAsync(IsPriest(), userId.Value, false, now);
        }

        await base.OnDisconnectedAsync(exception);
    }

    // The priest hears about God Children; God Children only hear about the priest.
    private Task NotifyOtherSideAsync(bool isPriest, Guid userId, bool isOnline, DateTime lastSeenAt) =>
        Clients.Group(isPriest ? GodChildrenGroup : PriestsGroup)
            .SendAsync("PresenceChanged", new { userId, isOnline, lastSeenAt });

    private Task TouchLastSeenAsync(Guid userId, DateTime now) =>
        _db.Users
            .Where(u => u.Id == userId)
            .ExecuteUpdateAsync(s => s.SetProperty(u => u.LastSeenAt, (DateTime?)now));

    private bool IsPriest() => Context.User?.IsInRole("Priest") == true;

    // SignalR's user identifier is the NameIdentifier claim from the JWT
    private Guid? GetUserId() =>
        Guid.TryParse(Context.UserIdentifier, out var id) ? id : null;
}
