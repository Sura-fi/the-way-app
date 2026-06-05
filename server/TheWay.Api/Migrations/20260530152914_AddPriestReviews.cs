using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TheWay.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddPriestReviews : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "PriestReviews",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    GodChildId = table.Column<Guid>(type: "uuid", nullable: false),
                    PriestId = table.Column<Guid>(type: "uuid", nullable: false),
                    Content = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ExpiresAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PriestReviews", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PriestReviews_Users_GodChildId",
                        column: x => x.GodChildId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_PriestReviews_Users_PriestId",
                        column: x => x.PriestId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: new Guid("a1b2c3d4-e5f6-7890-abcd-ef1234567890"),
                column: "PasswordHash",
                value: "$2a$11$ZLLymVfXeiEesOUQd8hOquiVdXAG2U9ICQN9f8LaPRdWZCwp1x7cC");

            migrationBuilder.CreateIndex(
                name: "IX_PriestReviews_ExpiresAt",
                table: "PriestReviews",
                column: "ExpiresAt");

            migrationBuilder.CreateIndex(
                name: "IX_PriestReviews_GodChildId",
                table: "PriestReviews",
                column: "GodChildId");

            migrationBuilder.CreateIndex(
                name: "IX_PriestReviews_PriestId",
                table: "PriestReviews",
                column: "PriestId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "PriestReviews");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: new Guid("a1b2c3d4-e5f6-7890-abcd-ef1234567890"),
                column: "PasswordHash",
                value: "$2a$11$MBc2AuN2cmICMosY9jzFDe88jo.UWX/nlxDkEdDeB4DI4JrdDRQFi");
        }
    }
}
