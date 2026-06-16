using FluentValidation;
using Hangfire;
using Microsoft.AspNetCore.Routing.Template;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Questro.Service.Abstractions.Auth;
using Questro.Service.Abstractions.Email;
using Questro.Service.Abstractions.Games;
using Questro.Service.Abstractions.Interactions;
using Questro.Service.Abstractions.Movies;
using Questro.Service.Abstractions.Notifications;
using Questro.Service.Abstractions.Social;
using Questro.Service.Abstractions.Users;
using Questro.Service.Services.Auth;
using Questro.Service.Services.Email;
using Questro.Service.Services.Games;
using Questro.Service.Services.Interactions;
using Questro.Service.Services.Movies;
using Questro.Service.Services.Notifications;
using Questro.Service.Services.Social;
using Questro.Service.Services.Users;
using Questro.Service.Abstractions.Search;
using Questro.Service.Services.Search;

using Questro.Shared.Contracts.Email;


namespace Questro.Service;

public static class DependencyInjectionService
{

    public static IServiceCollection AddServiceLayer(this IServiceCollection services , IConfiguration configuration)
    {
        services.AddHttpClient();
        services.AddMemoryCache();

        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IExternalLoginServices, ExternalLoginServices>();
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
        services.AddScoped<IUserInteractionService, UserInteractionService>();

        // Phase 2: Profile, Library, Social, Notifications
        services.AddScoped<IUserProfileService, UserProfileService>();
        services.AddScoped<IUserMovieLibraryService, UserMovieLibraryService>();
        services.AddScoped<IUserGameLibraryService, UserGameLibraryService>();
        services.AddScoped<IFamilyManagementService, FamilyManagementService>();
        services.AddScoped<IUserNetworkService, UserNetworkService>();
        services.AddScoped<INotificationService, NotificationService>();
        services.AddScoped<IGlobalSearchService, GlobalSearchService>();
        services.AddScoped<NewContentNotificationJob>();

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

