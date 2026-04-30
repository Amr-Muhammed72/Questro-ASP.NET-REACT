using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Questro.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddGameTrailer : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Trailer_Url",
                table: "Games",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Trailer_Url",
                table: "Games");
        }
    }
}
