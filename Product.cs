namespace Kael.Api.Entities;

public class Product
{
    public int Id { get; set; }
    public string Codigo { get; set; } = "";
    public string Descripcion { get; set; } = "";
    public decimal PrecioCosto { get; set; }
    public decimal PrecioVenta { get; set; }
    public decimal PorcentajeGanancia { get; set; }
    public int Stock { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
