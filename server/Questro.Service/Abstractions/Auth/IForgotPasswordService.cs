using Questro.Shared.Contracts.Auth;

using Questro.Shared.Result;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Questro.Service.Abstractions.Auth
{

    public interface IForgotPasswordService
    {
        Task<Result> SendResetOtpAsync(ForgotPasswordRequestDto request, CancellationToken cancellationToken = default);
        Task<Result<string>> VerifyResetOtpAsync(VerifyResetOtpRequestDto request, CancellationToken cancellationToken = default);
        Task<Result> ResetPasswordAsync(ResetPasswordRequestDto request, CancellationToken cancellationToken = default);
    }
}
