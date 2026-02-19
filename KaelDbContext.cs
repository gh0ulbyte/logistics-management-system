using Microsoft.EntityFrameworkCore;
using Kael.Api.Entities;

namespace Kael.Api.Data;

public class KaelDbContext : DbContext
{
    public KaelDbContext(DbContextOptions<KaelDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<Product> Products => Set<Product>();
    public DbSet<Client> Clients => Set<Client>();
    public DbSet<FacturaCompra> FacturasCompra => Set<FacturaCompra>();
    public DbSet<FacturaCompraDetalle> FacturasCompraDetalle => Set<FacturaCompraDetalle>();
    public DbSet<Reparto> Repartos => Set<Reparto>();
    public DbSet<Pedido> Pedidos => Set<Pedido>();
    public DbSet<PedidoDetalle> PedidoDetalle => Set<PedidoDetalle>();
    public DbSet<MovimientoStock> MovimientosStock => Set<MovimientoStock>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>(e =>
        {
            e.HasIndex(u => u.Email).IsUnique();
            e.Property(u => u.Role).HasMaxLength(20);
        });
        modelBuilder.Entity<Product>(e => e.HasIndex(p => p.Codigo).IsUnique());
        modelBuilder.Entity<FacturaCompraDetalle>().HasOne(f => f.Product).WithMany().OnDelete(DeleteBehavior.Restrict);
        modelBuilder.Entity<PedidoDetalle>().HasOne(p => p.Product).WithMany().OnDelete(DeleteBehavior.Restrict);
    }
}
