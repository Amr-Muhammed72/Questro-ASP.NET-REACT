using FluentValidation;
using Questro.Shared.Contracts.Auth;

namespace Questro.Service.Validators.Auth;

public class CompleteProfileRequestDtoValidator : AbstractValidator<CompleteProfileRequestDto>
{
    public CompleteProfileRequestDtoValidator()
    {
        RuleFor(x => x.UserName)
            .NotEmpty()
            .MaximumLength(50);

        RuleFor(x => x.Gender)
            .NotEmpty()
            .MaximumLength(20);

        RuleFor(x => x.BirthDate)
            .Must(birthDate => birthDate != default && birthDate.Date < DateTime.UtcNow.Date)
            .WithMessage("Birth date must be in the past.");
    }
}
