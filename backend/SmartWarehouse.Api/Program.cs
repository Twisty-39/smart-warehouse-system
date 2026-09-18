using System.Text;
using FluentValidation;
using FluentValidation.AspNetCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;
using SmartWarehouse.Api.Data;
using SmartWarehouse.Api.Middleware;
using SmartWarehouse.Api.Services;
using SmartWarehouse.Api.Validators;

var builder = WebApplication.CreateBuilder(args);
builder.WebHost.UseUrls("http://0.0.0.0:5000");

// 1. ADD DATABASE CONTEXT (SQL Server)
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? "Server=localhost\\SQLEXPRESS;Database=SmartWarehouseDb;Trusted_Connection=True;TrustServerCertificate=True;";

builder.Services.AddDbContext<AppDbContext>(options =>
{
    options.UseSqlServer(connectionString, sqlOptions =>
    {
        sqlOptions.EnableRetryOnFailure(
            maxRetryCount: 3,
            maxRetryDelay: TimeSpan.FromSeconds(5),
            errorNumbersToAdd: null);
    });
});

// 2. REGISTER APPLICATION SERVICES
builder.Services.AddScoped<IJwtService, JwtService>();
builder.Services.AddScoped<IFileUploadService, FileUploadService>();

// 3. CONFIGURE AUTHENTICATION & JWT BEARER
var jwtKey = builder.Configuration["Jwt:Key"] ?? "SmartWarehouseEnterpriseSecretKey2026SecureLongKeyForHMACSHA256!";
var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "SmartWarehouseApi";
var jwtAudience = builder.Configuration["Jwt:Audience"] ?? "SmartWarehouseClient";

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = false;
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
        ValidateIssuer = true,
        ValidIssuer = jwtIssuer,
        ValidateAudience = true,
        ValidAudience = jwtAudience,
        ClockSkew = TimeSpan.Zero
    };
});

// 4. CONFIGURE CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.WithOrigins("http://localhost:5173", "http://localhost:3000", "http://localhost:5174", "http://localhost:4173")
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials();
    });
    options.AddPolicy("OpenPolicy", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

// 5. CONFIGURE FLUENT VALIDATION & CONTROLLERS
builder.Services.AddControllers();
builder.Services.AddFluentValidationAutoValidation();
builder.Services.AddValidatorsFromAssemblyContaining<LoginRequestValidator>();

// 6. CONFIGURE SWAGGER / OPENAPI WITH JWT SUPPORT
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "InvWare — Smart Warehouse & Inventory Management System API",
        Version = "v1",
        Description = "Enterprise REST API backend untuk sistem manajemen pergudangan cerdas (InvWare)."
    });

    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Masukkan token JWT dengan format: Bearer {token}"
    });
});

var app = builder.Build();

// 7. CONFIGURE MIDDLEWARE PIPELINE
app.UseMiddleware<GlobalExceptionMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "Smart Warehouse API v1");
        c.RoutePrefix = "swagger";
    });
}

// Static files for uploaded images and PDF documents
var uploadsPath = Path.Combine(app.Environment.ContentRootPath, "wwwroot");
Directory.CreateDirectory(uploadsPath);
Directory.CreateDirectory(Path.Combine(uploadsPath, "uploads", "images", "products"));
Directory.CreateDirectory(Path.Combine(uploadsPath, "uploads", "documents"));

app.UseStaticFiles();

app.UseRouting();

app.UseCors("OpenPolicy");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// 8. AUTO DATABASE INITIALIZATION & SEEDING ON STARTUP
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var db = services.GetRequiredService<AppDbContext>();
        await DbSeeder.SeedAsync(db);
        Console.WriteLine("[SWIMS] Database auto-migration and 20+ seed records verified successfully.");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"[SWIMS Warning] Could not automatically connect to SQL Server on startup: {ex.Message}");
        Console.WriteLine("[SWIMS Info] You can execute 'backend/SmartWarehouse.Api/Data/Scripts/init_database.sql' directly in SSMS.");
    }
}

app.Run();
