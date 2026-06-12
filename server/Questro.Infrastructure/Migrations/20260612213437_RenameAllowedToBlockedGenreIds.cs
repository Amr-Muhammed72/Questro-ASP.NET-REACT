using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Questro.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class RenameAllowedToBlockedGenreIds : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "AllowedMovieGenreIds",
                table: "ChildRestrictions",
                newName: "BlockedMovieGenreIds");

            migrationBuilder.RenameColumn(
                name: "AllowedGameGenreIds",
                table: "ChildRestrictions",
                newName: "BlockedGameGenreIds");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "BlockedMovieGenreIds",
                table: "ChildRestrictions",
                newName: "AllowedMovieGenreIds");

            migrationBuilder.RenameColumn(
                name: "BlockedGameGenreIds",
                table: "ChildRestrictions",
                newName: "AllowedGameGenreIds");
        }
    }
}
