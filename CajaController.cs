using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Kael.Api.Data;

namespace Kael.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "owner")]
public class CajaController : ControllerBase
{
    private readonly KaelDbContext _db;

    public CajaController(KaelDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> Get(CancellationToken ct)
    {
        var pedidos = await _db.Pedidos.ToListAsync(ct);
        var entregados = pedidos.Where(p => p.Estado == "entregado").ToList();
        var confirmados = pedidos.Where(p => p.Estado == "confirmado").ToList();
        var pendientes = pedidos.Where(p => p.Estado == "pendiente").ToList();
        var totalRecaudado = entregados.Sum(p => p.Total) + confirmados.Sum(p => p.Total);
        return Ok(new
        {
            total_recaudado = totalRecaudado,
            cantidad_entregados = entregados.Count,
            total_entregados = entregados.Sum(p => p.Total),
            cantidad_confirmados = confirmados.Count,
            total_confirmados = confirmados.Sum(p => p.Total),
            cantidad_pendientes = pendientes.Count,
            total_pendientes = pendientes.Sum(p => p.Total),
            cantidad_total = pedidos.Count
        });
    }
}
