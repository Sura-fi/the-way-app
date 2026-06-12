using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TheWay.Api.Migrations
{
    /// <inheritdoc />
    public partial class RemoveSeedDataFromModel : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // No-op: seed data moved to runtime (Program.cs).
            // This migration only updates the model snapshot so future
            // migrations don't generate UpdateData for the priest.
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // No-op: reversing this migration restores the model snapshot
            // to include HasData, but no database changes were made.
        }
    }
}
