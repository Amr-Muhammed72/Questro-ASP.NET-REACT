using FluentValidation;
using Questro.Shared.Contracts.Family;

namespace Questro.Service.Validators.Family;

public class ChangeChildPasswordRequestDtoValidator : AbstractValidator<ChangeChildPasswordRequestDto>
{
    public ChangeChildPasswordRequestDtoValidator()
    {
        RuleFor(x => x.NewPassword)
            .NotEmpty()
            .MinimumLength(8)
            .MaximumLength(128);

        RuleFor(x => x.ConfirmNewPassword)
            .NotEmpty()
            .Equal(x => x.NewPassword);
    }
}
