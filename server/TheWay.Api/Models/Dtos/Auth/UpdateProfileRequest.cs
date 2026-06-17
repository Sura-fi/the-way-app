using System.ComponentModel.DataAnnotations;

namespace TheWay.Api.Models.Dtos.Auth;

public class UpdateProfileRequest
{
    [RegularExpression(@"^(\+251|0)[79]\d{8}$", ErrorMessage = "Invalid phone number format.")]
    public string? PhoneNumber { get; set; }

    [MaxLength(100, ErrorMessage = "Name is too long.")]
    public string? FormalName { get; set; }       //  (priest edits full name)

    // base64 data URL ("data:image/jpeg;base64,..."), "" to clear, null to leave unchanged
    public string? ProfilePicture { get; set; }  
}
