using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Kael.Api.Data;
using Kael.Api.Entities;
using Kael.Api.Services;

namespace Kael.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly AuthService _auth;
    private readonly KaelDbContext _db;

    public AuthController(AuthService auth, KaelDbContext db)
    {
        _auth = auth;
        _db = db;
    }

    [HttpPost("login")]
    public IActionResult Login([FromBody] LoginRequest req)
    {
        if (string.IsNullOrEmpty(req?.Email) || string.IsNullOrEmpty(req?.Password))
            return BadRequest(new { error = "Email y contraseña requeridos" });
        var user = _auth.ValidateUser(req.Email, req.Password);
        if (user == null)
            return Unauthorized(new { error = "Credenciales incorrectas" });
        var token = _auth.GenerateToken(user);
        return Ok(new
        {
            token,
            user = new { id = user.Id, email = user.Email, name = user.Name, role = user.Role }
        });
    }

    [Authorize]
    [HttpGet("me")]
    public IActionResult Me()
    {
        var user = _db.Users
            .Where(u => u.Id == UserId)
            .Select(u => new { u.Id, u.Email, u.Name, u.Role, u.CreatedAt })
            .FirstOrDefault();
        if (user == null) return NotFound(new { error = "Usuario no encontrado" });
        return Ok(user);
    }

    [Authorize(Roles = "owner")]
    [HttpGet("users")]
    public IActionResult ListUsers()
    {
        var list = _db.Users
            .OrderBy(u => u.Name)
            .Select(u => new { u.Id, u.Email, u.Name, u.Role, u.CreatedAt })
            .ToList();
        return Ok(list);
    }

    [Authorize(Roles = "owner")]
    [HttpPost("users")]
    public async Task<IActionResult> CreateUser([FromBody] CreateUserRequest req, CancellationToken ct)
    {
        if (string.IsNullOrEmpty(req?.Email) || string.IsNullOrEmpty(req?.Password) || string.IsNullOrEmpty(req?.Name))
            return BadRequest(new { error = "Email, contraseña y nombre requeridos" });
        if (_db.Users.Any(u => u.Email == req.Email))
            return Conflict(new { error = "El email ya está registrado" });
        var user = new User
        {
            Email = req.Email,
            PasswordHash = AuthService.HashPassword(req.Password),
            Name = req.Name,
            Role = "vendedor"
        };
        _db.Users.Add(user);
        await _db.SaveChangesAsync(ct);
        return StatusCode(201, new { user.Id, user.Email, user.Name, role = user.Role });
    }

    private int UserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "0");

    public record LoginRequest(string Email, string Password);
    public record CreateUserRequest(string Email, string Password, string Name);
}
