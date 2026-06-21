using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Questro.Shared.Contracts.Auth
{
    public record RegisterResendOtp( string UserName,
  string FirstName,
  string LastName,
  string Email,
  string Password,
  string? Gender,
  DateTime BirthDate);
}
