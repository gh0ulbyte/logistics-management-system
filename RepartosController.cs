using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Kael.Api.Data;
using Kael.Api.Entities;

namespace Kael.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class RepartosController : ControllerBase
{
    private readonly KaelDbContext _db;

    public RepartosController(KaelDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken ct)
    {
        var list = await _db.Repartos
            .OrderByDescending(r => r.Fecha)
            .ThenByDescending(r => r.Id)
            .Select(r => new { r.Id, r.Nombre, r.Vehiculo, r.Fecha, r.Estado, r.CreatedAt })
            .ToListAsync(ct);
        return Ok(list);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id, CancellationToken ct)
    {
        var reparto = await _db.Repartos.FindAsync(new object[] { id }, ct);
        if (reparto == null) return NotFound(new { error = "Reparto no encontrado" });
        var pedidos = await _db.Pedidos
            .Where(p => p.RepartoId == id)
            .Include(p => p.Client)
            .Include(p => p.Detalle)
            .ThenInclude(d => d.Product)
            .OrderBy(p => p.CreatedAt)
            .ToListAsync(ct);
        var pedidosDto = pedidos.Select(p => new
        {
            p.Id,
            p.ClientId,
            client_name = p.Client.Nombre,
            direccion = p.Client.Direccion,
            p.Total,
            p.Estado,
            p.CreatedAt,
            detalle = p.Detalle.Select(d => new { d.Cantidad, d.PrecioUnitario, descripcion = d.Product.Descripcion, codigo = d.Product.Codigo }).ToList()
        }).ToList();
        return Ok(new { reparto.Id, reparto.Nombre, reparto.Vehiculo, reparto.Fecha, reparto.Estado, reparto.CreatedAt, pedidos = pedidosDto });
    }

    [HttpPost]
    [Authorize(Roles = "owner")]
    public async Task<IActionResult> Create([FromBody] RepartoRequest req, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(req?.Nombre))
            return BadRequest(new { error = "Nombre del reparto requerido" });
        var reparto = new Reparto
        {
            Nombre = req.Nombre,
            Vehiculo = req.Vehiculo,
            Fecha = req.Fecha,
            Estado = "activo"
        };
        _db.Repartos.Add(reparto);
        await _db.SaveChangesAsync(ct);
        return StatusCode(201, reparto);
    }

    [HttpPatch("{id:int}")]
    [Authorize(Roles = "owner")]
    public async Task<IActionResult> Update(int id, [FromBody] RepartoRequest req, CancellationToken ct)
    {
        var r = await _db.Repartos.FindAsync(new object[] { id }, ct);
        if (r == null) return NotFound(new { error = "Reparto no encontrado" });
        if (req.Nombre != null) r.Nombre = req.Nombre;
        if (req.Vehiculo != null) r.Vehiculo = req.Vehiculo;
        if (req.Fecha != null) r.Fecha = req.Fecha;
        if (req.Estado != null) r.Estado = req.Estado;
        await _db.SaveChangesAsync(ct);
        return Ok(r);
    }

    public record RepartoRequest(string? Nombre, string? Vehiculo, string? Fecha, string? Estado);
}
