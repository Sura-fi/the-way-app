using Microsoft.EntityFrameworkCore;
using TheWay.Api.Data;
using TheWay.Api.Models.Domain;
using TheWay.Api.Models.Dtos.Notes;

namespace TheWay.Api.Services;

public class NoteService
{
    private readonly AppDbContext _db;

    public NoteService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<List<NoteResponse>> GetNotesAsync(Guid userId)
    {
        return await _db.UserNotes
            .Where(n => n.UserId == userId)
            .OrderByDescending(n => n.UpdatedAt)
            .AsNoTracking()
            .Select(n => new NoteResponse
            {
                Id = n.Id,
                Content = n.Content,
                CreatedAt = n.CreatedAt,
                UpdatedAt = n.UpdatedAt
            })
            .ToListAsync();
    }

    public async Task<NoteResponse> CreateNoteAsync(Guid userId, CreateNoteRequest request)
    {
        var note = new UserNote
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Content = request.Content.Trim(),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _db.UserNotes.Add(note);
        await _db.SaveChangesAsync();

        return new NoteResponse
        {
            Id = note.Id,
            Content = note.Content,
            CreatedAt = note.CreatedAt,
            UpdatedAt = note.UpdatedAt
        };
    }

    public async Task<bool> DeleteNoteAsync(Guid noteId, Guid userId)
    {
        var note = await _db.UserNotes
            .FirstOrDefaultAsync(n => n.Id == noteId && n.UserId == userId);

        if (note == null)
            return false;

        _db.UserNotes.Remove(note);
        await _db.SaveChangesAsync();
        return true;
    }
}
