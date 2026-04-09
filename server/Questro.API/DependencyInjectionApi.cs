using Microsoft.Extensions.DependencyInjection;

namespace Questro.API;

public static class DependencyInjectionApi
{
    public static IServiceCollection AddApiLayer(this IServiceCollection services)
    {
        services.AddControllers();
        services.AddEndpointsApiExplorer();
        services.AddSwaggerGen();

        return services;
    }
}