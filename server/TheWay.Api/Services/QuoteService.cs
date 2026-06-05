using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using TheWay.Api.Data;
using TheWay.Api.Hubs;
using TheWay.Api.Models.Domain;
using TheWay.Api.Models.Dtos.Quote;

namespace TheWay.Api.Services;

public class QuoteService
{
    private readonly AppDbContext _db;
    private readonly IHubContext<QuoteHub> _hubContext;

    public QuoteService(AppDbContext db, IHubContext<QuoteHub> hubContext)
    {
        _db = db;
        _hubContext = hubContext;
    }

    // ──────────────────────────────────────────
    // PUBLISH — Priest publishes a new quote
    // ──────────────────────────────────────────
    public async Task<QuoteResponse> PublishAsync(Guid priestId, PublishQuoteRequest request)
    {
        // 1. Deactivate ALL currently active quotes
        var activeQuotes = await _db.PriestQuotes
            .Where(q => q.IsActive)
            .ToListAsync();

        foreach (var old in activeQuotes)
        {
            old.IsActive = false;
        }

        // 2. Create the new quote
        var quote = new PriestQuote
        {
            Id = Guid.NewGuid(),
            Content = request.Content.Trim(),
            PublishedBy = priestId,
            PublishedAt = DateTime.UtcNow,
            IsActive = true
        };

        _db.PriestQuotes.Add(quote);
        await _db.SaveChangesAsync();

        // 3. Resolve the Priest's name for the response
        var priest = await _db.Users.FindAsync(priestId);
        var response = MapToResponse(quote, priest?.SpiritualName ?? "Unknown");

        // 4. Broadcast to ALL connected clients via SignalR
        await _hubContext.Clients.All.SendAsync("ReceiveQuote", response);

        return response;
    }

    // ──────────────────────────────────────────
    // GET ACTIVE — Returns the currently active quote
    // ──────────────────────────────────────────
    public async Task<QuoteResponse?> GetActiveAsync()
    {
        // Find the one active quote, include the Publisher for the name
        var quote = await _db.PriestQuotes
            .Include(q => q.Publisher)
            .FirstOrDefaultAsync(q => q.IsActive);

        if (quote == null)
            return null;

        return MapToResponse(quote, quote.Publisher.SpiritualName);
    }

    // ──────────────────────────────────────────
    // GET HISTORY — Returns all quotes (newest first)
    // ──────────────────────────────────────────
    public async Task<List<QuoteResponse>> GetHistoryAsync()
    {
        var quotes = await _db.PriestQuotes
            .Include(q => q.Publisher)
            .OrderByDescending(q => q.PublishedAt)
            .ToListAsync();

        return quotes.Select(q => MapToResponse(q, q.Publisher.SpiritualName)).ToList();
    }

    // ──────────────────────────────────────────
    // PRIVATE: Map entity to response DTO
    // ──────────────────────────────────────────
    private static QuoteResponse MapToResponse(PriestQuote quote, string publisherName)
    {
        return new QuoteResponse
        {
            Id = quote.Id,
            Content = quote.Content,
            PublishedAt = quote.PublishedAt,
            PublisherName = publisherName
        };
    }
}
