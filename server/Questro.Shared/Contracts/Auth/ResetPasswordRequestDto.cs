using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Questro.Shared.Contracts.Auth
{
    public record ResetPasswordRequestDto(string ResetToken, string NewPassword, string ConfirmPassword);

}
