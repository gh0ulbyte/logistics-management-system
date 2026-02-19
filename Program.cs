using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Kael.Api;
using Kael.Api.Data;
using Kael.Api.Services;
using Kael.Api.Entities;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = new JsonSnakeCaseNamingPolicy();
    });
builder.Services.AddEndpointsApiExplorer();

var dbDir = Path.Combine(builder.Environment.ContentRootPath, "..", "database");
var dbPath = Path.Combine(dbDir, "kael.db");
Directory.CreateDirectory(dbDir);
builder.Services.AddDbContext<KaelDbContext>(options =>
    options.UseSqlite($"Data Source={dbPath}"));

var jwtKey = builder.Configuration["Jwt:Key"] ?? "kael-secret-cambiar-en-produccion-min-32-chars!!";
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
            ValidateIssuer = false,
            ValidateAudience = false,
            ValidateLifetime = true,
            ClockSkew = TimeSpan.Zero
        };
    });
builder.Services.AddAuthorization();
builder.Services.AddScoped<AuthService>();
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod();
    });
});

var app = builder.Build();

// Crear DB y usuario dueño si no existe
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<KaelDbContext>();
    db.Database.EnsureCreated();
    try { db.Database.ExecuteSqlRaw("ALTER TABLE FacturasCompra ADD COLUMN ImagePath TEXT"); } catch { /* columna ya existe */ }
    if (!db.Users.Any(u => u.Role == "owner"))
    {
        db.Users.Add(new User
        {
            Email = "admin@kael.com",
            PasswordHash = AuthService.HashPassword("admin123"),
            Name = "Dueño",
            Role = "owner"
        });
        db.SaveChanges();
    }
}

app.UseCors();
app.UseAuthentication();
app.UseAuthorization();

app.UseDefaultFiles();
app.UseStaticFiles();

app.MapControllers();

app.MapGet("/api/health", () => Results.Ok(new { ok = true }));

app.Run();
