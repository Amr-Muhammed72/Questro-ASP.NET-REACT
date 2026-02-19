
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.Extensions.FileProviders;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Memory cache
builder.Services.AddMemoryCache();

builder.Services.AddHttpContextAccessor();

// builder.Services.Configure<FormOptions>(options =>
// {
//     options.MultipartBodyLengthLimit = 15 * 1024 * 1024; 
// });



builder.Services.AddMemoryCache();

var app = builder.Build();


if (app.Environment.IsDevelopment())
{
    //  app.MapOpenApi();
    app.UseSwagger();
    app.UseSwaggerUI();
}


app.UseHttpsRedirection();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
