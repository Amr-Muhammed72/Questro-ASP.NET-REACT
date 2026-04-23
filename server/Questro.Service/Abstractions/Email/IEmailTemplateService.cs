using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Questro.Service.Abstractions.Email
{
    public interface IEmailTemplateService
    {
        string GetOtpEmailBody(string otp, int expiryMinutes);
    }
}
