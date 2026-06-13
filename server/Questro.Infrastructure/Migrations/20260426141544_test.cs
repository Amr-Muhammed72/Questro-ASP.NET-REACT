using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Questro.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class test : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "RAWG_Id",
                table: "GameGenres",
                type: "int",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "RAWG_Id",
                table: "GameGenres");
        }
    }
}
