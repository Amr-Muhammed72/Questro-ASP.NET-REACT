using FluentValidation;
using Questro.Shared.Contracts.Users;

namespace Questro.Service.Validators.Users;

public class SubmitSurveyRequestDtoValidator : AbstractValidator<SubmitSurveyRequestDto>
{
    public SubmitSurveyRequestDtoValidator()
    {
        RuleFor(x => x.LikedMovieGenres)
            .NotEmpty().WithMessage("At least 1 liked movie genre is required.")
            .Must(list => list == null || list.Count <= 3)
            .WithMessage("Up to 3 liked movie genres at most are allowed.");

        RuleFor(x => x.DislikedMovieGenres)
            .Must(list => list == null || list.Count <= 3)
            .WithMessage("Up to 3 disliked movie genres at most are allowed.");

        RuleFor(x => x.LikedGameGenres)
            .NotEmpty().WithMessage("At least 1 liked game genre is required.")
            .Must(list => list == null || list.Count <= 3)
            .WithMessage("Up to 3 liked game genres at most are allowed.");

        RuleFor(x => x.DislikedGameGenres)
            .Must(list => list == null || list.Count <= 3)
            .WithMessage("Up to 3 disliked game genres at most are allowed.");
    }
}
