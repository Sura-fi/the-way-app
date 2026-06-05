using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TheWay.Api.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Users",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    FormalName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    SpiritualName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Email = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    PasswordHash = table.Column<string>(type: "text", nullable: false),
                    Role = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    MustChangePassword = table.Column<bool>(type: "boolean", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Users", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "DailyLogs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    LogDate = table.Column<DateOnly>(type: "date", nullable: false),
                    Prayer = table.Column<bool>(type: "boolean", nullable: false),
                    BibleReading = table.Column<bool>(type: "boolean", nullable: false),
                    SpiritualBooks = table.Column<bool>(type: "boolean", nullable: false),
                    GoodDeeds = table.Column<bool>(type: "boolean", nullable: false),
                    AvoidingEvil = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DailyLogs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DailyLogs_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "PriestQuotes",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Content = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    PublishedBy = table.Column<Guid>(type: "uuid", nullable: false),
                    PublishedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PriestQuotes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PriestQuotes_Users_PublishedBy",
                        column: x => x.PublishedBy,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.InsertData(
                table: "Users",
                columns: new[] { "Id", "CreatedAt", "Email", "FormalName", "IsActive", "MustChangePassword", "PasswordHash", "Role", "SpiritualName" },
                values: new object[] { new Guid("a1b2c3d4-e5f6-7890-abcd-ef1234567890"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "priest@theway.app", "Administrator", true, true, "$2a$11$MBc2AuN2cmICMosY9jzFDe88jo.UWX/nlxDkEdDeB4DI4JrdDRQFi", "Priest", "ቀሲስ" });

            migrationBuilder.CreateIndex(
                name: "IX_DailyLogs_LogDate",
                table: "DailyLogs",
                column: "LogDate");

            migrationBuilder.CreateIndex(
                name: "IX_DailyLogs_UserId_LogDate",
                table: "DailyLogs",
                columns: new[] { "UserId", "LogDate" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PriestQuotes_IsActive",
                table: "PriestQuotes",
                column: "IsActive");

            migrationBuilder.CreateIndex(
                name: "IX_PriestQuotes_PublishedBy",
                table: "PriestQuotes",
                column: "PublishedBy");

            migrationBuilder.CreateIndex(
                name: "IX_Users_Email",
                table: "Users",
                column: "Email",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "DailyLogs");

            migrationBuilder.DropTable(
                name: "PriestQuotes");

            migrationBuilder.DropTable(
                name: "Users");
        }
    }
}
