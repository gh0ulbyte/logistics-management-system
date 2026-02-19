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
public class PedidosController : ControllerBase
{
    private readonly KaelDbContext _db;

    public PedidosController(KaelDbContext db) => _db = db;

    private int UserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "0");

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int? reparto_id, CancellationToken ct)
    {
        var query = _db.Pedidos.Include(p => p.Client).AsQueryable();
        if (!User.IsInRole("owner"))
            query = query.Where(p => p.UserId == UserId);
        if (reparto_id.HasValue)
            query = query.Where(p => p.RepartoId == reparto_id);
        var list = await query
            .OrderByDescending(p => p.CreatedAt)
            .Select(p => new { p.Id, p.ClientId, p.RepartoId, p.UserId, p.Estado, p.Total, p.CreatedAt, client_name = p.Client.Nombre, direccion = p.Client.Direccion })
            .ToListAsync(ct);
        return Ok(list);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id, CancellationToken ct)
    {
        var pedido = await _db.Pedidos.Include(p => p.Client).Include(p => p.Detalle).ThenInclude(d => d.Product).FirstOrDefaultAsync(p => p.Id == id, ct);
        if (pedido == null) return NotFound(new { error = "Pedido no encontrado" });
        if (!User.IsInRole("owner") && pedido.UserId != UserId)
            return StatusCode(403, new { error = "No autorizado" });
        var detalle = pedido.Detalle.Select(d => new { d.Id, d.ProductId, d.Cantidad, d.PrecioUnitario, descripcion = d.Product.Descripcion, codigo = d.Product.Codigo }).ToList();
        return Ok(new
        {
            pedido.Id,
            pedido.ClientId,
            pedido.RepartoId,
            pedido.UserId,
            pedido.Estado,
            pedido.Total,
            pedido.CreatedAt,
            pedido.UpdatedAt,
            detalle,
            client = new { pedido.Client.Id, pedido.Client.Nombre, pedido.Client.Telefono, pedido.Client.Direccion, pedido.Client.Zona }
        });
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreatePedidoRequest req, CancellationToken ct)
    {
        if (req?.ClientId == null || req?.Items == null || req.Items.Count == 0)
            return BadRequest(new { error = "client_id e items (array de { product_id, cantidad }) requeridos" });
        var client = await _db.Clients.FindAsync(new object[] { req.ClientId }, ct);
        if (client == null) return NotFound(new { error = "Cliente no encontrado" });

        decimal total = 0;
        var detalles = new List<(int ProductId, int Cantidad, decimal PrecioUnitario)>();
        foreach (var it in req.Items)
        {
            var product = await _db.Products.FindAsync(new object[] { it.ProductId }, ct);
            if (product == null) return BadRequest(new { error = $"Producto {it.ProductId} no encontrado" });
            var cantidad = Math.Max(1, it.Cantidad);
            if (product.Stock < cantidad)
                return BadRequest(new { error = $"Stock insuficiente para producto {product.Id} (hay {product.Stock})" });
            total += product.PrecioVenta * cantidad;
            detalles.Add((product.Id, cantidad, product.PrecioVenta));
        }

        var pedido = new Pedido
        {
            ClientId = req.ClientId.Value,
            RepartoId = req.RepartoId,
            UserId = UserId,
            Estado = "pendiente",
            Total = total
        };
        _db.Pedidos.Add(pedido);
        await _db.SaveChangesAsync(ct);

        foreach (var (productId, cantidad, precioUnitario) in detalles)
        {
            _db.PedidoDetalle.Add(new PedidoDetalle { PedidoId = pedido.Id, ProductId = productId, Cantidad = cantidad, PrecioUnitario = precioUnitario });
            _db.MovimientosStock.Add(new MovimientoStock { ProductId = productId, Cantidad = -cantidad, Tipo = "salida", Referencia = "pedido", ReferenciaId = pedido.Id });
            var prod = await _db.Products.FindAsync(new object[] { productId }, ct);
            if (prod != null) { prod.Stock -= cantidad; prod.UpdatedAt = DateTime.UtcNow; }
        }
        await _db.SaveChangesAsync(ct);

        var created = await _db.Pedidos.Include(p => p.Detalle).ThenInclude(d => d.Product).FirstAsync(p => p.Id == pedido.Id, ct);
        var detalleDto = created.Detalle.Select(d => new { d.Id, d.ProductId, d.Cantidad, d.PrecioUnitario, descripcion = d.Product.Descripcion, codigo = d.Product.Codigo }).ToList();
        return StatusCode(201, new { created.Id, created.ClientId, created.RepartoId, created.UserId, created.Estado, created.Total, created.CreatedAt, detalle = detalleDto });
    }

    [HttpPatch("{id:int}/reparto")]
    public async Task<IActionResult> AssignReparto(int id, [FromBody] AssignRepartoRequest req, CancellationToken ct)
    {
        var pedido = await _db.Pedidos.FindAsync(new object[] { id }, ct);
        if (pedido == null) return NotFound(new { error = "Pedido no encontrado" });
        if (!User.IsInRole("owner") && pedido.UserId != UserId)
            return StatusCode(403, new { error = "No autorizado" });
        pedido.RepartoId = req.RepartoId;
        pedido.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
        return Ok(pedido);
    }

    public record CreatePedidoRequest(int? ClientId, int? RepartoId, List<PedidoItemRequest>? Items);
    public record PedidoItemRequest(int ProductId, int Cantidad);
    public record AssignRepartoRequest(int? RepartoId);
}
