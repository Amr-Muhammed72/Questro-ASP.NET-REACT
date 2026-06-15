using Questro.Shared.Contracts.Auth;
using Questro.Shared.Result;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Questro.Service.Abstractions.Auth
{
    public interface IExternalLoginServices
    {
        Task<Result<ExternalLoginResponse>> LoginWithGoogleAsync(ExternalLoginRequest request);
    }
}
