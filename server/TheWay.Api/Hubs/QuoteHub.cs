using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace TheWay.Api.Hubs;

[Authorize]
public class QuoteHub : Hub
{
    /// <summary>
    /// Called when a client connects to the hub.
    /// Only authenticated users can connect (enforced by [Authorize]).
    /// </summary>
    public override async Task OnConnectedAsync()
    {
        await base.OnConnectedAsync();
    }

    /// <summary>
    /// Called when a client disconnects from the hub.
    /// </summary>
    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        await base.OnDisconnectedAsync(exception);
    }
}
