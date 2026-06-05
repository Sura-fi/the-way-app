using System.ComponentModel.DataAnnotations;

namespace TheWay.Api.Models.Dtos.Notes;

public class CreateNoteRequest
{
    [Required]
    [MaxLength(2000)]
    public string Content { get; set; } = string.Empty;
}
