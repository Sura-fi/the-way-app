namespace TheWay.Api.Models.Dtos.Auth;

public class AuthResponse
{
    public string Token { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public bool MustChangePassword { get; set; }
    public string FormalName { get; set; } = string.Empty;
    public string SpiritualName { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;       
    public string? ProfilePictureUrl { get; set; }  
}
