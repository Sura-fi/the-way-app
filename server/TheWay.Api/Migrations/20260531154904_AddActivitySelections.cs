using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TheWay.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddActivitySelections : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AvoidingEvil",
                table: "DailyLogs");

            migrationBuilder.DropColumn(
                name: "BibleReading",
                table: "DailyLogs");

            migrationBuilder.DropColumn(
                name: "GoodDeeds",
                table: "DailyLogs");

            migrationBuilder.DropColumn(
                name: "Prayer",
                table: "DailyLogs");

            migrationBuilder.DropColumn(
                name: "SpiritualBooks",
                table: "DailyLogs");

            migrationBuilder.AddColumn<string[]>(
                name: "AvoidingEvilSelections",
                table: "DailyLogs",
                type: "text[]",
                nullable: false,
                defaultValueSql: "'{}'::text[]");

            migrationBuilder.AddColumn<string[]>(
                name: "BibleReadingSelections",
                table: "DailyLogs",
                type: "text[]",
                nullable: false,
                defaultValueSql: "'{}'::text[]");

            migrationBuilder.AddColumn<string[]>(
                name: "GoodDeedsSelections",
                table: "DailyLogs",
                type: "text[]",
                nullable: false,
                defaultValueSql: "'{}'::text[]");

            migrationBuilder.AddColumn<string[]>(
                name: "PrayerSelections",
                table: "DailyLogs",
                type: "text[]",
                nullable: false,
                defaultValueSql: "'{}'::text[]");

            migrationBuilder.AddColumn<string[]>(
                name: "SpiritualBooksSelections",
                table: "DailyLogs",
                type: "text[]",
                nullable: false,
                defaultValueSql: "'{}'::text[]");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: new Guid("a1b2c3d4-e5f6-7890-abcd-ef1234567890"),
                column: "PasswordHash",
                value: "$2a$11$m8ceQOngf6gb8A2blv2mBuvsUVyt.NpCXUPx66ZSF23To6Lm607KO");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AvoidingEvilSelections",
                table: "DailyLogs");

            migrationBuilder.DropColumn(
                name: "BibleReadingSelections",
                table: "DailyLogs");

            migrationBuilder.DropColumn(
                name: "GoodDeedsSelections",
                table: "DailyLogs");

            migrationBuilder.DropColumn(
                name: "PrayerSelections",
                table: "DailyLogs");

            migrationBuilder.DropColumn(
                name: "SpiritualBooksSelections",
                table: "DailyLogs");

            migrationBuilder.AddColumn<bool>(
                name: "AvoidingEvil",
                table: "DailyLogs",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "BibleReading",
                table: "DailyLogs",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "GoodDeeds",
                table: "DailyLogs",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "Prayer",
                table: "DailyLogs",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "SpiritualBooks",
                table: "DailyLogs",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: new Guid("a1b2c3d4-e5f6-7890-abcd-ef1234567890"),
                column: "PasswordHash",
                value: "$2a$11$ZLLymVfXeiEesOUQd8hOquiVdXAG2U9ICQN9f8LaPRdWZCwp1x7cC");
        }
    }
}
