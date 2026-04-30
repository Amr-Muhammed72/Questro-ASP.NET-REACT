namespace Questro.Core.Entities.Games;

public class GamePhoto
{
    public int GamePhotoId { get; set; }
    public int GameId { get; set; }
    public int? RAWG_Id { get; set; }
    public string Image_Url { get; set; } = null!;
    public int? Width { get; set; }
    public int? Height { get; set; }

    public virtual Game Game { get; set; } = null!;
}
