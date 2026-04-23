using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Questro.Shared.Contracts.OTP
{
    public record VerifyOtpRequestDto(string Email, string Otp);
}
