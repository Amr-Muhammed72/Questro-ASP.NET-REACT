using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Questro.Shared.Contracts.OTP
{
    public record VerifyOtpRequestDto( string Otp, string UserName ,
     string FirstName,
     string LastName,
     string Email,
     string Password,
     string? Gender ,
     DateTime BirthDate );
}
