namespace TheWay.Api.Models.Dtos.Checklist;

public class UpsertChecklistRequest
{
    public string? LogDate { get; set; }
    public List<string> Prayer { get; set; } = new();
    public List<string> BibleReading { get; set; } = new();
    public List<string> SpiritualBooks { get; set; } = new();
    public List<string> GoodDeeds { get; set; } = new();
    public List<string> AvoidingEvil { get; set; } = new();
}
