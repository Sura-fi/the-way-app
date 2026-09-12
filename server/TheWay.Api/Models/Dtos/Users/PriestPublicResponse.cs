namespace TheWay.Api.Models.Dtos.Users;

// Public-facing priest info that any god child may view (no email/private fields).
public class PriestPublicResponse
{
    public Guid Id { get; set; }                  // lets the client match PresenceChanged events
    public string FormalName { get; set; } = string.Empty;
    public string SpiritualName { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string? ProfilePictureUrl { get; set; }
    public bool IsOnline { get; set; }
    public DateTime? LastSeenAt { get; set; }
}
