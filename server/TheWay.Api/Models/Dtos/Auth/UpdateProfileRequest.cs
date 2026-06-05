using System.ComponentModel.DataAnnotations;

namespace TheWay.Api.Models.Dtos.Auth;

public class UpdateProfileRequest
{
    [RegularExpression(@"^(\+251|0)[79]\d{8}$", ErrorMessage = "Invalid phone number format.")]
    public string? PhoneNumber { get; set; }
}
