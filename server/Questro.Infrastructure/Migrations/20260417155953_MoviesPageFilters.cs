using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Questro.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class MoviesPageFilters : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "Mpa_Certification",
                table: "Movies",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Language",
                table: "Movies",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)",
                oldNullable: true);

            migrationBuilder.AddColumn<string>(
                name: "IMDB_Rating",
                table: "Movies",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "TMDB_Rating",
                table: "Movies",
                type: "float",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "TMDB_VoteCount",
                table: "Movies",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Movies_Language",
                table: "Movies",
                column: "Language");

            migrationBuilder.CreateIndex(
                name: "IX_Movies_Popularity",
                table: "Movies",
                column: "Popularity");

            migrationBuilder.CreateIndex(
                name: "IX_Movies_Release_Date",
                table: "Movies",
                column: "Release_Date");

            migrationBuilder.CreateIndex(
                name: "IX_Movies_TMDB_Rating",
                table: "Movies",
                column: "TMDB_Rating");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Movies_Language",
                table: "Movies");

            migrationBuilder.DropIndex(
                name: "IX_Movies_Popularity",
                table: "Movies");

            migrationBuilder.DropIndex(
                name: "IX_Movies_Release_Date",
                table: "Movies");

            migrationBuilder.DropIndex(
                name: "IX_Movies_TMDB_Rating",
                table: "Movies");

            migrationBuilder.DropColumn(
                name: "IMDB_Rating",
                table: "Movies");

            migrationBuilder.DropColumn(
                name: "TMDB_Rating",
                table: "Movies");

            migrationBuilder.DropColumn(
                name: "TMDB_VoteCount",
                table: "Movies");

            migrationBuilder.AlterColumn<string>(
                name: "Mpa_Certification",
                table: "Movies",
                type: "nvarchar(max)",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(50)",
                oldMaxLength: 50,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Language",
                table: "Movies",
                type: "nvarchar(max)",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(20)",
                oldMaxLength: 20,
                oldNullable: true);
        }
    }
}
