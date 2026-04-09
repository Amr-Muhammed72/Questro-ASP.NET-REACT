using FluentValidation;
using Microsoft.Extensions.DependencyInjection;
using Questro.Service.Abstractions.Auth;
using Questro.Service.Services.Auth;

namespace Questro.Service;

public static class DependencyInjectionService
{
    public static IServiceCollection AddServiceLayer(this IServiceCollection services)
    {
        services.AddScoped<IAuthService, AuthService>();
        services.AddValidatorsFromAssembly(typeof(DependencyInjectionService).Assembly);

        return services;
    }
}