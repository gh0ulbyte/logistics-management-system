namespace Kael.Api.Entities;

public class FacturaCompra
{
    public int Id { get; set; }
    public string? Numero { get; set; }
    public string? Proveedor { get; set; }
    public string? Fecha { get; set; }
    public int? UserId { get; set; }
    public string? ImagePath { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<FacturaCompraDetalle> Detalle { get; set; } = new List<FacturaCompraDetalle>();
}

public class FacturaCompraDetalle
{
    public int Id { get; set; }
    public int FacturaId { get; set; }
    public int ProductId { get; set; }
    public int Cantidad { get; set; }
    public decimal PrecioCosto { get; set; }
    public decimal PrecioVenta { get; set; }
    public decimal PorcentajeGanancia { get; set; }

    public FacturaCompra Factura { get; set; } = null!;
    public Product Product { get; set; } = null!;
}
