namespace Kael.Api.Entities;

public class MovimientoStock
{
    public int Id { get; set; }
    public int ProductId { get; set; }
    public int Cantidad { get; set; }
    public string Tipo { get; set; } = ""; // entrada | salida
    public string Referencia { get; set; } = ""; // factura | pedido
    public int ReferenciaId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
