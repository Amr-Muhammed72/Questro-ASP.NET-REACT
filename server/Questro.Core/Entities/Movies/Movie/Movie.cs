namespace Questro.Core.Entities.Movies;

public class Movie
{
    public int MovieId { get; set; }
    public int? TMDB_Id { get; set; }
    public string? IMDB_Id { get; set; }
    public string? IMDB_Rating { get; set; }
    public double? TMDB_Rating { get; set; }
    public int? TMDB_VoteCount { get; set; }
    public string Title { get; set; } = null!;
    public int? Runtime { get; set; }
    public string? Overview { get; set; }
    public double? Popularity { get; set; }
    public string? Trailer_Url { get; set; }
    public string? Backdrop_Url { get; set; }
    public string? Language { get; set; }
    public string? Poster_Url { get; set; }
    public string? Mpa_Certification { get; set; }
    public DateTime? Release_Date { get; set; }

    public virtual ICollection<Movie_MovieGenre> MovieGenres { get; set; } = new HashSet<Movie_MovieGenre>();
    public virtual ICollection<Movie_Staff> MovieStaffs { get; set; } = new HashSet<Movie_Staff>();

    public virtual ICollection<UserMovieLike> UserLikes { get; set; } = new HashSet<UserMovieLike>();
    public virtual ICollection<UserMovieRate> UserRates { get; set; } = new HashSet<UserMovieRate>();
    public virtual ICollection<UserMovieReview> UserReviews { get; set; } = new HashSet<UserMovieReview>();
    public virtual ICollection<UserMovieWatched> UserWatched { get; set; } = new HashSet<UserMovieWatched>();
    public virtual ICollection<UserMovieWatchlist> UserWatchlists { get; set; } = new HashSet<UserMovieWatchlist>();
    public virtual ICollection<UserMovieRecommended> UserRecommendations { get; set; } = new HashSet<UserMovieRecommended>();
}
