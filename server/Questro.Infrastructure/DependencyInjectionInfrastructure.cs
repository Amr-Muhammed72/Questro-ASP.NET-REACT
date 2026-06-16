using Hangfire;
using Microsoft.Extensions.Http;
using Polly;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using Questro.Core.Entities.UserManagement;
using Questro.Infrastructure.Abstractions;
using Questro.Infrastructure.Data;
using Questro.Infrastructure.ExternalServices.Tmdb;
using Questro.Infrastructure.ExternalServices.RAWG;
using Questro.Infrastructure.ExternalServices.Recommender;
using Questro.Infrastructure.Repositories;
using Questro.Shared.Contracts.Email;
using Questro.Shared.Options.Jwt;
using Questro.Shared.Options.Tmdb;
using Questro.Shared.Options.Rawg;
using Questro.Shared.Options.Recommender;
using System.Net;
using System.Text;
using StackExchange.Redis;
namespace Questro.Infrastructure;

public static class DependencyInjectionInfrastructure
{
    public static IServiceCollection AddInfrastructureLayer(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddDbContext<ApplicationDbContext>(options =>
            options.UseSqlServer(configuration.GetConnectionString("DefaultConnection")));

        services
            .AddIdentityCore<ApplicationUser>(options =>
            {
                options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(10);
                options.Lockout.MaxFailedAccessAttempts = 5;
                options.Lockout.AllowedForNewUsers = true;
                options.User.RequireUniqueEmail = true;
            }
            )
            .AddRoles<ApplicationRole>()
            .AddEntityFrameworkStores<ApplicationDbContext>().AddSignInManager().AddDefaultTokenProviders();

        services.AddOptions<JwtOptions>()
            .Bind(configuration.GetSection(JwtOptions.SectionName));

        services.AddOptions<TmdbOptions>()
            .Bind(configuration.GetSection(TmdbOptions.SectionName));

        services.AddOptions<RawgOptions>()
            .Bind(configuration.GetSection(RawgOptions.SectionName));

        services.AddAuthentication(options =>
        {
            options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
            options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
        }).AddJwtBearer();

        services.AddOptions<JwtBearerOptions>(JwtBearerDefaults.AuthenticationScheme)
            .Configure<IOptions<JwtOptions>>((options, jwtOptions) =>
            {
                var jwt = jwtOptions.Value;

                if (string.IsNullOrWhiteSpace(jwt.Key) || string.IsNullOrWhiteSpace(jwt.Issuer) || string.IsNullOrWhiteSpace(jwt.Audience))
                    throw new InvalidOperationException("Jwt options are not configured correctly.");

                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidateIssuerSigningKey = true,
                    ValidateLifetime = true,
                    ValidIssuer = jwt.Issuer,
                    ValidAudience = jwt.Audience,
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwt.Key)),
                    ClockSkew = TimeSpan.Zero
                };
            });

        services.AddScoped(typeof(IGenericRepository<>), typeof(GenericRepository<>));
        services.AddScoped<IUserCleanupRepository, UserCleanupRepository>();
        services.AddScoped<IFamilyRepository, FamilyRepository>();
        services.AddScoped<IUnitOfWork, UnitOfWork>();

        // File service - requires WebRootPath, resolved at runtime
        services.AddSingleton<IFileService>(sp =>
        {
            var env = sp.GetRequiredService<Microsoft.AspNetCore.Hosting.IWebHostEnvironment>();
            return new Questro.Infrastructure.Services.LocalFileService(env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot"));
        });

        services.AddHttpClient<ITmdbService, TmdbService>((serviceProvider, client) =>
        {
            var options = serviceProvider.GetRequiredService<IOptions<TmdbOptions>>().Value;
            if (Uri.TryCreate(options.BaseUrl, UriKind.Absolute, out var baseUri))
            {
                client.BaseAddress = baseUri;
            }
            client.Timeout = TimeSpan.FromSeconds(15);
        })
        .ConfigurePrimaryHttpMessageHandler(() => new HttpClientHandler
        {
            AutomaticDecompression = DecompressionMethods.GZip | DecompressionMethods.Deflate
        })
        .AddPolicyHandler(Policy.TimeoutAsync<HttpResponseMessage>(TimeSpan.FromSeconds(10)))
        .AddTransientHttpErrorPolicy(p => p.WaitAndRetryAsync(2, attempt => TimeSpan.FromSeconds(attempt)))
        .AddTransientHttpErrorPolicy(p => p.CircuitBreakerAsync(5, TimeSpan.FromSeconds(30)));

        services.AddHttpClient<IRawgService, RawgService>((serviceProvider, client) =>
        {
            var options = serviceProvider.GetRequiredService<IOptions<RawgOptions>>().Value;
            if (Uri.TryCreate(options.BaseUrl, UriKind.Absolute, out var baseUri))
            {
                client.BaseAddress = baseUri;
            }
            client.Timeout = TimeSpan.FromSeconds(15);
        })
        .ConfigurePrimaryHttpMessageHandler(() => new HttpClientHandler
        {
            AutomaticDecompression = DecompressionMethods.GZip | DecompressionMethods.Deflate
        })
        .AddPolicyHandler(Policy.TimeoutAsync<HttpResponseMessage>(TimeSpan.FromSeconds(10)))
        .AddTransientHttpErrorPolicy(p => p.WaitAndRetryAsync(2, attempt => TimeSpan.FromSeconds(attempt)))
        .AddTransientHttpErrorPolicy(p => p.CircuitBreakerAsync(5, TimeSpan.FromSeconds(30)));

        // ── Recommender API ─────────────────────────────────────────────────
        services.AddOptions<RecommenderOptions>()
            .Bind(configuration.GetSection(RecommenderOptions.SectionName));

        services.AddHttpClient<IRecommenderService, RecommenderService>((serviceProvider, client) =>
        {
            var options = serviceProvider.GetRequiredService<IOptions<RecommenderOptions>>().Value;
            if (Uri.TryCreate(options.BaseUrl, UriKind.Absolute, out var baseUri))
            {
                client.BaseAddress = baseUri;
            }
            client.Timeout = TimeSpan.FromSeconds(30);

            
        })
        .ConfigurePrimaryHttpMessageHandler(() => new HttpClientHandler
        {
            AutomaticDecompression = DecompressionMethods.GZip | DecompressionMethods.Deflate
        })
        .AddPolicyHandler(Policy.TimeoutAsync<HttpResponseMessage>(TimeSpan.FromSeconds(25)))
        .AddTransientHttpErrorPolicy(p => p.WaitAndRetryAsync(2, attempt => TimeSpan.FromSeconds(attempt)))
        .AddTransientHttpErrorPolicy(p => p.CircuitBreakerAsync(5, TimeSpan.FromSeconds(30)));
        services.AddStackExchangeRedisCache(options =>
        {
            options.Configuration = configuration["Redis:ConnectionString"];
            options.InstanceName = "RecommendationApp:";
        });
        services.AddHybridCache();

        return services;
    }
}