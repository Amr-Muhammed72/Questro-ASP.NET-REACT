using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Questro.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddGamePhotos : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "GamePhotos",
                columns: table => new
                {
                    GamePhotoId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    GameId = table.Column<int>(type: "int", nullable: false),
                    RAWG_Id = table.Column<int>(type: "int", nullable: true),
                    Image_Url = table.Column<string>(type: "nvarchar(2048)", maxLength: 2048, nullable: false),
                    Width = table.Column<int>(type: "int", nullable: true),
                    Height = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GamePhotos", x => x.GamePhotoId);
                    table.ForeignKey(
                        name: "FK_GamePhotos_Games_GameId",
                        column: x => x.GameId,
                        principalTable: "Games",
                        principalColumn: "GameId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_GamePhotos_GameId",
                table: "GamePhotos",
                column: "GameId");

            migrationBuilder.CreateIndex(
                name: "IX_GamePhotos_GameId_RAWG_Id",
                table: "GamePhotos",
                columns: new[] { "GameId", "RAWG_Id" },
                unique: true,
                filter: "[RAWG_Id] IS NOT NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "GamePhotos");
        }
    }
}
