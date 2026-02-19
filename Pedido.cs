namespace Kael.Api.Entities;

public class Pedido
{
    public int Id { get; set; }
    public int ClientId { get; set; }
    public int? RepartoId { get; set; }
    public int UserId { get; set; }
    public string Estado { get; set; } = "pendiente";
    public decimal Total { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public Client Client { get; set; } = null!;
    public Reparto? Reparto { get; set; }
    public User User { get; set; } = null!;
    public ICollection<PedidoDetalle> Detalle { get; set; } = new List<PedidoDetalle>();
}

public class PedidoDetalle
{
    public int Id { get; set; }
    public int PedidoId { get; set; }
    public int ProductId { get; set; }
    public int Cantidad { get; set; }
    public decimal PrecioUnitario { get; set; }

    public Pedido Pedido { get; set; } = null!;
    public Product Product { get; set; } = null!;
}
