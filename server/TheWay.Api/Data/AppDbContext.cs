using Microsoft.EntityFrameworkCore;
using TheWay.Api.Models.Domain;

namespace TheWay.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    // These DbSets represent your database tables
    public DbSet<User> Users => Set<User>();
    public DbSet<DailyLog> DailyLogs => Set<DailyLog>();
    public DbSet<PriestQuote> PriestQuotes => Set<PriestQuote>();
    public DbSet<PriestReview> PriestReviews => Set<PriestReview>();
    public DbSet<UserNote> UserNotes => Set<UserNote>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // ─────────────────────────────────────
        // USER table configuration
        // ─────────────────────────────────────
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(u => u.Id);

            entity.Property(u => u.FormalName)
                  .IsRequired()
                  .HasMaxLength(100);

            entity.Property(u => u.SpiritualName)
                  .IsRequired()
                  .HasMaxLength(100);

            entity.Property(u => u.Email)
                  .IsRequired()
                  .HasMaxLength(150);

            entity.HasIndex(u => u.Email)
                  .IsUnique();

            entity.Property(u => u.PasswordHash)
                  .IsRequired();

            entity.Property(u => u.Role)
                  .IsRequired()
                  .HasMaxLength(20);

            entity.Property(u => u.PhoneNumber)
                  .HasMaxLength(25);
        });

        // ─────────────────────────────────────
        // DAILYLOG table configuration
        // ─────────────────────────────────────
        modelBuilder.Entity<DailyLog>(entity =>
        {
            entity.HasKey(d => d.Id);

            // UNIQUE constraint: one log per user per day
            entity.HasIndex(d => new { d.UserId, d.LogDate })
                  .IsUnique();

            // Index on LogDate for fast queries and the 90-day purge job
            entity.HasIndex(d => d.LogDate);

            // Relationship: User has many DailyLogs
            entity.HasOne(d => d.User)
                  .WithMany(u => u.DailyLogs)
                  .HasForeignKey(d => d.UserId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // ─────────────────────────────────────
        // PRIESTQUOTE table configuration
        // ─────────────────────────────────────
        modelBuilder.Entity<PriestQuote>(entity =>
        {
            entity.HasKey(q => q.Id);

            entity.Property(q => q.Content)
                  .IsRequired()
                  .HasMaxLength(500);

            // Index on IsActive for quickly fetching the current quote
            entity.HasIndex(q => q.IsActive);

            // Relationship: User (Priest) has many PriestQuotes
            entity.HasOne(q => q.Publisher)
                  .WithMany(u => u.PublishedQuotes)
                  .HasForeignKey(q => q.PublishedBy)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // ─────────────────────────────────────
        // PRIESTREVIEW table configuration
        // ─────────────────────────────────────
        modelBuilder.Entity<PriestReview>(entity =>
        {
            entity.HasKey(r => r.Id);

            entity.Property(r => r.Content)
                  .IsRequired()
                  .HasMaxLength(1000);

            // Index on ExpiresAt for the cleanup job
            entity.HasIndex(r => r.ExpiresAt);

            // Index on GodChildId for fast lookups per child
            entity.HasIndex(r => r.GodChildId);

            // Relationship: GodChild receives many reviews
            entity.HasOne(r => r.GodChild)
                  .WithMany(u => u.ReceivedReviews)
                  .HasForeignKey(r => r.GodChildId)
                  .OnDelete(DeleteBehavior.Cascade);

            // Relationship: Priest writes many reviews
            entity.HasOne(r => r.Priest)
                  .WithMany(u => u.WrittenReviews)
                  .HasForeignKey(r => r.PriestId)
                  .OnDelete(DeleteBehavior.Restrict); // Prevent cascade conflict
        });

        // ─────────────────────────────────────
        // USERNOTE table configuration
        // ─────────────────────────────────────
        modelBuilder.Entity<UserNote>(entity =>
        {
            entity.HasKey(n => n.Id);

            entity.Property(n => n.Content)
                  .IsRequired()
                  .HasMaxLength(2000);

            entity.HasOne(n => n.User)
                  .WithMany(u => u.Notes)
                  .HasForeignKey(n => n.UserId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

    }
}
