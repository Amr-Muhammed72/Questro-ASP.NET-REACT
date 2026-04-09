using FluentValidation;
using Questro.Shared.Contracts.Auth;

namespace Questro.Service.Validators.Auth;

public class RegisterRequestDtoValidator : AbstractValidator<RegisterRequestDto>
{
    public RegisterRequestDtoValidator()
    {
        RuleFor(x => x.UserName)
            .NotEmpty()
            .MaximumLength(50);

        RuleFor(x => x.FirstName)
            .NotEmpty()
            .MaximumLength(50);

        RuleFor(x => x.LastName)
            .NotEmpty()
            .MaximumLength(50);

        RuleFor(x => x.Email)
            .NotEmpty()
            .EmailAddress()
            .MaximumLength(256);

        RuleFor(x => x.Password)
            .NotEmpty()
            .MinimumLength(8)
            .MaximumLength(128);

        RuleFor(x => x.ConfirmPassword)
            .NotEmpty()
            .Equal(x => x.Password);

        RuleFor(x => x.Gender)
            .MaximumLength(20)
            .When(x => !string.IsNullOrWhiteSpace(x.Gender));

        RuleFor(x => x.BirthDate)
            .LessThan(DateTime.UtcNow.Date);
    }
}