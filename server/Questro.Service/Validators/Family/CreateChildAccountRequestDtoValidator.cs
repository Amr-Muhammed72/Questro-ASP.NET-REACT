using FluentValidation;
using Questro.Shared.Contracts.Family;

namespace Questro.Service.Validators.Family;

public class CreateChildAccountRequestDtoValidator : AbstractValidator<CreateChildAccountRequestDto>
{
    public CreateChildAccountRequestDtoValidator()
    {
        RuleFor(x => x.UserName)
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

        RuleFor(x => x.FirstName)
            .MaximumLength(50)
            .When(x => !string.IsNullOrWhiteSpace(x.FirstName));

        RuleFor(x => x.LastName)
            .MaximumLength(50)
            .When(x => !string.IsNullOrWhiteSpace(x.LastName));

        RuleFor(x => x.BirthDate)
            .LessThan(DateTime.UtcNow.Date)
            .When(x => x.BirthDate.HasValue);
    }
}
