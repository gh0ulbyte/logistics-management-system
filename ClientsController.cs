using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Kael.Api.Data;
using Kael.Api.Entities;

namespace Kael.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ClientsController : ControllerBase
{
    private readonly KaelDbContext _db;

    public ClientsController(KaelDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? q, [FromQuery] string? dias, CancellationToken ct)
    {
        var query = _db.Clients.AsQueryable();
        if (!string.IsNullOrWhiteSpace(q))
        {
            var term = $"%{q}%";
            query = query.Where(c => EF.Functions.Like(c.Nombre, term) || EF.Functions.Like(c.Direccion ?? "", term) || EF.Functions.Like(c.Telefono ?? "", term));
        }
        if (!string.IsNullOrWhiteSpace(dias))
            query = query.Where(c => c.DiasVisita != null && c.DiasVisita.Contains(dias));
        var list = await query
            .OrderBy(c => c.Nombre)
            .Select(c => new { c.Id, c.Nombre, c.Telefono, c.Direccion, c.Zona, c.DiasVisita, c.CreatedAt })
            .ToListAsync(ct);
        return Ok(list);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id, CancellationToken ct)
    {
        var c = await _db.Clients.FindAsync(new object[] { id }, ct);
        if (c == null) return NotFound(new { error = "Cliente no encontrado" });
        var ultimasCompras = await _db.Pedidos
            .Where(p => p.ClientId == id)
            .OrderByDescending(p => p.CreatedAt)
            .Take(10)
            .Select(p => new { p.Id, p.CreatedAt, p.Total, p.Estado })
            .ToListAsync(ct);
        return Ok(new { c.Id, c.Nombre, c.Telefono, c.Direccion, c.Zona, c.DiasVisita, c.CreatedAt, c.CreatedBy, c.UpdatedAt, ultimas_compras = ultimasCompras });
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] ClientRequest req, CancellationToken ct)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "0");
        if (string.IsNullOrWhiteSpace(req?.Nombre))
            return BadRequest(new { error = "Nombre requerido" });
        var client = new Client
        {
            Nombre = req.Nombre,
            Telefono = req.Telefono,
            Direccion = req.Direccion,
            Zona = req.Zona,
            DiasVisita = req.DiasVisita,
            CreatedBy = userId
        };
        _db.Clients.Add(client);
        await _db.SaveChangesAsync(ct);
        return StatusCode(201, client);
    }

    [HttpPatch("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] ClientRequest req, CancellationToken ct)
    {
        var c = await _db.Clients.FindAsync(new object[] { id }, ct);
        if (c == null) return NotFound(new { error = "Cliente no encontrado" });
        if (req.Nombre != null) c.Nombre = req.Nombre;
        if (req.Telefono != null) c.Telefono = req.Telefono;
        if (req.Direccion != null) c.Direccion = req.Direccion;
        if (req.Zona != null) c.Zona = req.Zona;
        if (req.DiasVisita != null) c.DiasVisita = req.DiasVisita;
        c.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
        return Ok(c);
    }

    public record ClientRequest(string? Nombre, string? Telefono, string? Direccion, string? Zona, string? DiasVisita);
}
