using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Questro.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class removesomecln : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "MaxContentRating",
                table: "ChildRestrictions");

            migrationBuilder.DropColumn(
                name: "MaxMetacriticRating",
                table: "ChildRestrictions");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "MaxContentRating",
                table: "ChildRestrictions",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "MaxMetacriticRating",
                table: "ChildRestrictions",
                type: "int",
                nullable: true);
        }
    }
}
