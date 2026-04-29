using FluentValidation;
using Hangfire;
using Microsoft.AspNetCore.Routing.Template;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Questro.Service.Abstractions.Auth;
using Questro.Service.Abstractions.Email;
using Questro.Service.Abstractions.Movies;
using Questro.Service.Abstractions.Games;
using Questro.Service.Services.Auth;
using Questro.Service.Services.Email;
using Questro.Service.Services.Movies;

using Questro.Shared.Contracts.Email;
using Questro.Service.Services.Games;

namespace Questro.Service;

public static class DependencyInjectionService
{

    public static IServiceCollection AddServiceLayer(this IServiceCollection services , IConfiguration configuration)
    {
        services.AddHttpClient();
        services.AddMemoryCache();

        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IOTPService, OTPService>();
        services.AddScoped<IForgotPasswordService, ForgotPasswordService>();

        services.AddScoped<IEmailTemplateService, EmailTemplateService>();
        services.AddScoped<IEmailService, EmailService>();
        services.AddScoped<IMovieCatalogService, MovieCatalogService>();
        services.AddScoped<IMovieSyncService, MovieSyncService>();
        services.AddScoped<IMovieDetailsService, MovieDetailsService>();
        services.AddScoped<IMovieInteractionService, MovieInteractionService>();

        services.AddScoped<IGameCatalogServices, GameCatalogServices>();
        services.AddScoped<IGameSyncService, GameSyncService>();
        services.AddScoped<IGameDetailsService, GameDetailsService>();
        services.AddScoped<IGameInteractionService, GameInteractionService>();

        services.AddValidatorsFromAssembly(typeof(DependencyInjectionService).Assembly);
        services.AddHangfireServer();
        services.AddHangfire(config =>
                            config.UseSqlServerStorage
                            (configuration.GetConnectionString("DefaultConnection")));
        services.Configure<EmailSettings>(
                    configuration.GetSection("EmailSettings"));
        return services;
    }
}
