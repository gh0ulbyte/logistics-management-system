namespace Kael.Api.Entities;

public class Reparto
{
    public int Id { get; set; }
    public string Nombre { get; set; } = "";
    public string? Vehiculo { get; set; }
    public string? Fecha { get; set; }
    public string Estado { get; set; } = "activo"; // activo | cerrado
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<Pedido> Pedidos { get; set; } = new List<Pedido>();
}
