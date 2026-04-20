using FluentValidation;
using Microsoft.Extensions.DependencyInjection;
using Questro.Service.Abstractions.Auth;
using Questro.Service.Abstractions.Movies;
using Questro.Service.Services.Auth;
using Questro.Service.Services.Movies;

namespace Questro.Service;

public static class DependencyInjectionService
{
    public static IServiceCollection AddServiceLayer(this IServiceCollection services)
    {
        services.AddHttpClient();
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IMovieService, MovieService>();
        services.AddValidatorsFromAssembly(typeof(DependencyInjectionService).Assembly);

        return services;
    }
}