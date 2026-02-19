using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Kael.Api.Data;
using Kael.Api.Entities;

namespace Kael.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "owner")]
public class FacturasController : ControllerBase
{
    private readonly KaelDbContext _db;

    public FacturasController(KaelDbContext db) => _db = db;

    private int UserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "0");

    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken ct)
    {
        var list = await _db.FacturasCompra
            .OrderByDescending(f => f.CreatedAt)
            .Select(f => new { f.Id, f.Numero, f.Proveedor, f.Fecha, f.UserId, f.CreatedAt })
            .ToListAsync(ct);
        return Ok(list);
    }

    [HttpPost("upload-image")]
    [RequestSizeLimit(10 * 1024 * 1024)]
    public async Task<IActionResult> UploadImage(IFormFile? image, CancellationToken ct)
    {
        if (image == null || image.Length == 0)
            return BadRequest(new { error = "Seleccione una imagen." });
        var ext = Path.GetExtension(image.FileName).ToLowerInvariant();
        if (string.IsNullOrEmpty(ext) || (ext != ".jpg" && ext != ".jpeg" && ext != ".png" && ext != ".webp"))
            ext = ".jpg";
        var uploadsDir = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads");
        Directory.CreateDirectory(uploadsDir);
        var fileName = $"{Guid.NewGuid():N}{ext}";
        var filePath = Path.Combine(uploadsDir, fileName);
        await using (var stream = new FileStream(filePath, FileMode.Create))
            await image.CopyToAsync(stream, ct);
        return Ok(new { path = "/uploads/" + fileName });
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateFacturaRequest req, CancellationToken ct)
    {
        if (req?.Items == null || req.Items.Count == 0)
            return BadRequest(new { error = "items requerido (array de { product_id o codigo, cantidad, precio_costo, porcentaje_ganancia })" });

        var factura = new FacturaCompra
        {
            Numero = req.Numero,
            Proveedor = req.Proveedor,
            Fecha = req.Fecha ?? DateTime.UtcNow.ToString("yyyy-MM-dd"),
            UserId = UserId,
            ImagePath = req.ImagePath
        };
        _db.FacturasCompra.Add(factura);
        await _db.SaveChangesAsync(ct);

        foreach (var it in req.Items)
        {
            Product? product = it.ProductId > 0
                ? await _db.Products.FindAsync(new object[] { it.ProductId }, ct)
                : await _db.Products.FirstOrDefaultAsync(p => p.Codigo == it.Codigo, ct);
            if (product == null)
                return BadRequest(new { error = $"Producto no encontrado: {it.ProductId?.ToString() ?? it.Codigo ?? "?"}" });
            var cantidad = Math.Max(1, it.Cantidad);
            var precioCosto = it.PrecioCosto ?? 0;
            var porcentajeGanancia = it.PorcentajeGanancia ?? 0;
            var precioVenta = it.PrecioVenta ?? (precioCosto * (1 + porcentajeGanancia / 100));

            _db.FacturasCompraDetalle.Add(new FacturaCompraDetalle
            {
                FacturaId = factura.Id,
                ProductId = product.Id,
                Cantidad = cantidad,
                PrecioCosto = precioCosto,
                PrecioVenta = precioVenta,
                PorcentajeGanancia = porcentajeGanancia
            });
            _db.MovimientosStock.Add(new MovimientoStock { ProductId = product.Id, Cantidad = cantidad, Tipo = "entrada", Referencia = "factura", ReferenciaId = factura.Id });
            product.Stock += cantidad;
            product.PrecioCosto = precioCosto;
            product.PrecioVenta = precioVenta;
            product.PorcentajeGanancia = porcentajeGanancia;
            product.UpdatedAt = DateTime.UtcNow;
        }
        await _db.SaveChangesAsync(ct);

        var created = await _db.FacturasCompra
            .Include(f => f.Detalle)
            .ThenInclude(d => d.Product)
            .FirstAsync(f => f.Id == factura.Id, ct);
        var detalle = created.Detalle.Select(d => new { d.Id, d.ProductId, d.Cantidad, d.PrecioCosto, d.PrecioVenta, d.PorcentajeGanancia, codigo = d.Product.Codigo, descripcion = d.Product.Descripcion }).ToList();
        return StatusCode(201, new { created.Id, created.Numero, created.Proveedor, created.Fecha, created.UserId, created.CreatedAt, detalle });
    }

    public record CreateFacturaRequest(string? Numero, string? Proveedor, string? Fecha, string? ImagePath, List<FacturaItemRequest> Items);
    public record FacturaItemRequest(int? ProductId, string? Codigo, int Cantidad, decimal? PrecioCosto, decimal? PrecioVenta, decimal? PorcentajeGanancia);
}
