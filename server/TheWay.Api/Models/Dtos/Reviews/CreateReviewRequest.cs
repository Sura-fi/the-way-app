using System.ComponentModel.DataAnnotations;

namespace TheWay.Api.Models.Dtos.Reviews;

public class CreateReviewRequest
{
    [Required]
    [MaxLength(1000)]
    public string Content { get; set; } = string.Empty;
}
