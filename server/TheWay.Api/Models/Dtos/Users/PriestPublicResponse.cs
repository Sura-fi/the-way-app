namespace TheWay.Api.Models.Dtos.Users;

// Public-facing priest info that any god child may view (no email/private fields).
public class PriestPublicResponse
{
    public string FormalName { get; set; } = string.Empty;
    public string SpiritualName { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string? ProfilePictureUrl { get; set; }
}
