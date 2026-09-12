using System.Collections.Concurrent;

namespace TheWay.Api.Services;

/// <summary>
/// In-memory record of who currently has the app open (a live SignalR connection).
/// Counts connections per user so several tabs/devices stay "online" until the last one closes.
/// Registered as a singleton — valid for a single API instance.
/// </summary>
public class PresenceTracker
{
    private readonly ConcurrentDictionary<Guid, int> _connections = new();

    /// <summary>Registers a connection. Returns true if the user just came online.</summary>
    public bool Connect(Guid userId) =>
        _connections.AddOrUpdate(userId, 1, (_, count) => count + 1) == 1;

    /// <summary>Removes a connection. Returns true if the user just went offline.</summary>
    public bool Disconnect(Guid userId)
    {
        while (true)
        {
            if (!_connections.TryGetValue(userId, out var count))
                return false;

            if (count <= 1)
            {
                if (_connections.TryRemove(new KeyValuePair<Guid, int>(userId, count)))
                    return true;
            }
            else if (_connections.TryUpdate(userId, count - 1, count))
            {
                return false;
            }
        }
    }

    public bool IsOnline(Guid userId) => _connections.ContainsKey(userId);
}
