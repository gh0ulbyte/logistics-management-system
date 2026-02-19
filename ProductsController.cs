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
public class ProductsController : ControllerBase
{
    private readonly KaelDbContext _db;

    public ProductsController(KaelDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken ct)
    {
        var isOwner = User.IsInRole("owner");
        var list = await _db.Products.OrderBy(p => p.Descripcion).ToListAsync(ct);
        if (!isOwner)
            return Ok(list.Select(p => new { p.Id, p.Codigo, p.Descripcion, p.Stock, p.PrecioVenta, p.CreatedAt }));
        return Ok(list);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id, CancellationToken ct)
    {
        var p = await _db.Products.FindAsync(new object[] { id }, ct);
        if (p == null) return NotFound(new { error = "Producto no encontrado" });
        if (!User.IsInRole("owner"))
            return Ok(new { p.Id, p.Codigo, p.Descripcion, p.Stock, p.PrecioVenta, p.CreatedAt });
        return Ok(p);
    }

    [HttpPost]
    [Authorize(Roles = "owner")]
    public async Task<IActionResult> Create([FromBody] ProductCreateRequest req, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(req?.Codigo) || string.IsNullOrWhiteSpace(req?.Descripcion))
            return BadRequest(new { error = "Código y descripción requeridos" });
        if (await _db.Products.AnyAsync(x => x.Codigo == req.Codigo, ct))
            return Conflict(new { error = "El código de producto ya existe" });
        var product = new Product
        {
            Codigo = req.Codigo.Trim(),
            Descripcion = req.Descripcion.Trim(),
            PrecioCosto = req.PrecioCosto ?? 0,
            PrecioVenta = req.PrecioVenta ?? 0,
            PorcentajeGanancia = req.PorcentajeGanancia ?? 0,
            Stock = Math.Max(0, req.Stock ?? 0)
        };
        _db.Products.Add(product);
        await _db.SaveChangesAsync(ct);
        return StatusCode(201, product);
    }

    [HttpPatch("{id:int}")]
    [Authorize(Roles = "owner")]
    public async Task<IActionResult> Update(int id, [FromBody] ProductUpdateRequest req, CancellationToken ct)
    {
        var p = await _db.Products.FindAsync(new object[] { id }, ct);
        if (p == null) return NotFound(new { error = "Producto no encontrado" });
        if (req.Descripcion != null) p.Descripcion = req.Descripcion;
        if (req.PrecioCosto.HasValue) p.PrecioCosto = req.PrecioCosto.Value;
        if (req.PrecioVenta.HasValue) p.PrecioVenta = req.PrecioVenta.Value;
        if (req.PorcentajeGanancia.HasValue) p.PorcentajeGanancia = req.PorcentajeGanancia.Value;
        p.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
        return Ok(p);
    }

    public record ProductCreateRequest(string Codigo, string Descripcion, decimal? PrecioCosto, decimal? PrecioVenta, decimal? PorcentajeGanancia, int? Stock);
    public record ProductUpdateRequest(string? Descripcion, decimal? PrecioCosto, decimal? PrecioVenta, decimal? PorcentajeGanancia);
}
