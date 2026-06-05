namespace TheWay.Api.Models.Dtos.Auth;

public class RegisterRequest {
    public string FormalName { get; set; } = string.Empty;
    public string SpiritualName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
}

