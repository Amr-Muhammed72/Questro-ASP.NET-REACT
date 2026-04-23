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

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.UseHangfireDashboard("/hangfire");
app.Run();

