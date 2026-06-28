using Questro.Shared.Contracts.Auth;
using Questro.Shared.Contracts.OTP;
using Questro.Shared.Result;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Questro.Service.Abstractions.Auth
{
    public interface IOTPService
    {
       Task <Result> SendOTPAsync(SendOtpRequestDto request, CancellationToken cancellationToken = default);
        Task<Result> ResendOTPAsync(SendOtpRequestDto request, CancellationToken cancellationToken = default);
        Task<Result> RegisterResendOTPAsync(SendOtpRequestDto request, CancellationToken cancellationToken = default);

        Task<Result> VerifyOTPAsync(VerifyOtpRequestDto request, CancellationToken cancellationToken = default);
    }
}
