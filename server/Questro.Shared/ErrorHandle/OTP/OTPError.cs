using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using static Questro.Shared.ErrorHandle.Error;

namespace Questro.Shared.ErrorHandle.OTP
{
    public class OTPError
    {
        public static readonly Errors InvalidOtp =
            new("User.InvalidOtp", "Invalid or expired OTP.", 400);

        public static readonly Errors OtpAlreadySent =
            new("User.OtpAlreadySent", "OTP already sent. Try again later.", 429);

        public static readonly Errors UserNotFound =
            new("User.NotFound", "User not found.", 404);
    }
}
