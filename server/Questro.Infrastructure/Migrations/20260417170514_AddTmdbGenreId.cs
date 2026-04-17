using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Questro.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddTmdbGenreId : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "TMDB_Id",
                table: "MovieGenres",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_MovieGenres_TMDB_Id",
                table: "MovieGenres",
                column: "TMDB_Id",
                unique: true,
                filter: "[TMDB_Id] IS NOT NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_MovieGenres_TMDB_Id",
                table: "MovieGenres");

            migrationBuilder.DropColumn(
                name: "TMDB_Id",
                table: "MovieGenres");
        }
    }
}
