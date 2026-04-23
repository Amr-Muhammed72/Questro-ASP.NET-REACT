using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using static Questro.Shared.ErrorHandle.Error;

namespace Questro.Shared.ErrorHandle.Passwordreset
{
    public static class ForgotPasswordError
    {
        public static readonly Errors UserNotFound =
            new("ForgotPassword.UserNotFound", "User not found." , 404);
        public static readonly Errors InvalidOrExpiredOtp =
            new("ForgotPassword.InvalidOtp", "Invalid or expired OTP." , 400);
        public static readonly Errors PasswordMismatch =
            new("ForgotPassword.PasswordMismatch", "Passwords do not match." , 400);
        public static readonly Errors ResetFailed =
            new("ForgotPassword.ResetFailed", "Failed to reset password." , 500);
        public static readonly Errors InvalidResetToken =
            new("ForgotPassword.InvalidResetToken", "Invalid or expired reset token." , 400);
    }
}
