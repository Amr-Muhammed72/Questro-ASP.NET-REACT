using Hangfire;
using Microsoft.Extensions.Configuration;
using Questro.API;
using Questro.Infrastructure;
using Questro.Service;
using Questro.Service.Abstractions.Email;
using Questro.Service.Services.Email;
using Questro.Shared.Contracts.Email;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddApiLayer();
builder.Services.AddInfrastructureLayer(builder.Configuration);
builder.Services.AddServiceLayer(builder.Configuration);


var frontendOrigins = builder.Configuration.GetSection("DevCors:AllowedOrigins").Get<string[]>()
                      ?? new[] { "http://localhost:3000", "http://localhost:5173", "http://localhost:4200" , "http://localhost:5222" };

builder.Services.AddCors(options =>
{
    options.AddPolicy("DevCors", policy =>
    {
        policy.WithOrigins(frontendOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}
app.UseCors("DevCors");

app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.UseHangfireDashboard("/hangfire");
app.Run();

