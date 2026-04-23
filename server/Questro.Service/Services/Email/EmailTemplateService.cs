using Questro.Service.Abstractions.Email;

namespace Questro.Service.Services.Email
{
    public class EmailTemplateService : IEmailTemplateService
    {
        public string GetOtpEmailBody(string otp, int expiryMinutes)
        {
            var templatePath = Path.Combine(
                AppContext.BaseDirectory,
                "Templates",
                "Email",
                "OtpEmail.html"
            );

            var template = File.ReadAllText(templatePath);

            return template
                .Replace("{{OTP}}", otp)
                .Replace("{{EXPIRY_MINUTES}}", expiryMinutes.ToString());
        }
    }
}