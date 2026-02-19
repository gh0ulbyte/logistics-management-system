import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getClients, getProducts, getRepartos, createPedido } from '../../api';

export default function VendedorPedido() {
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [products, setProducts] = useState([]);
  const [repartos, setRepartos] = useState([]);
  const [clientId, setClientId] = useState('');
  const [repartoId, setRepartoId] = useState('');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([getClients(), getProducts(), getRepartos()])
      .then(([c, p, r]) => {
        setClients(c);
        setProducts(p);
        setRepartos(r.filter((x) => x.estado === 'activo'));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const addItem = (product) => {
    if (product.stock <= 0) return;
    const existing = items.find((i) => i.product_id === product.id);
    if (existing) {
      if (existing.cantidad >= product.stock) return;
      setItems((prev) => prev.map((i) => (i.product_id === product.id ? { ...i, cantidad: i.cantidad + 1 } : i)));
    } else {
      setItems((prev) => [...prev, { product_id: product.id, cantidad: 1, precio_venta: product.precio_venta, descripcion: product.descripcion }]);
    }
  };

  const stockFor = (pid) => products.find((p) => p.id === pid)?.stock ?? 0;
  const inCart = (pid) => items.filter((i) => i.product_id === pid).reduce((s, i) => s + i.cantidad, 0);

  const updateCantidad = (productId, delta) => {
    setItems((prev) => {
      const current = prev.find((i) => i.product_id === productId);
      const currentQty = current ? current.cantidad : 0;
      const newQty = currentQty + delta;
      if (newQty <= 0) {
        return prev.filter((i) => i.product_id !== productId);
      }
      if (newQty > stockFor(productId)) return prev;
      if (!current) return prev;
      return prev.map((i) => (i.product_id === productId ? { ...i, cantidad: newQty } : i));
    });
  };

  const total = items.reduce((acc, i) => acc + i.cantidad * i.precio_venta, 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!clientId) {
      setError('Seleccioná un cliente.');
      return;
    }
    if (items.length === 0) {
      setError('Agregá al menos un producto.');
      return;
    }
    setSaving(true);
    try {
      const pedido = await createPedido({
        client_id: Number(clientId),
        reparto_id: repartoId ? Number(repartoId) : null,
        items: items.map((i) => ({ product_id: i.product_id, cantidad: i.cantidad })),
      });
      navigate(`/pedidos`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p>Cargando...</p>;

  return (
    <div>
      <h2>Nuevo pedido</h2>
      <form onSubmit={handleSubmit}>
        <div className="card">
          <div className="form-group">
            <label>Cliente</label>
            <select value={clientId} onChange={(e) => setClientId(e.target.value)} required>
              <option value="">Seleccionar cliente</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.nombre} - {c.direccion || '-'}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Reparto (camioneta)</label>
            <select value={repartoId} onChange={(e) => setRepartoId(e.target.value)}>
              <option value="">Sin asignar</option>
              {repartos.map((r) => (
                <option key={r.id} value={r.id}>{r.nombre} {r.vehiculo ? `- ${r.vehiculo}` : ''}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Productos</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Clic en producto para agregar. Stock disponible y precio de venta.</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
            {products.filter((p) => p.stock > 0).map((p) => (
              <button
                key={p.id}
                type="button"
                className="btn btn-secondary"
                onClick={() => addItem(p)}
              >
                {p.descripcion} (stock: {p.stock}) - ${Number(p.precio_venta).toLocaleString('es-AR')}
              </button>
            ))}
          </div>
          {items.length > 0 && (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Cant.</th>
                    <th>P. unit.</th>
                    <th>Subtotal</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((i) => (
                    <tr key={i.product_id}>
                      <td>{i.descripcion}</td>
                      <td>
                        <button type="button" onClick={() => updateCantidad(i.product_id, -1)}>−</button>
                        <span style={{ margin: '0 0.5rem' }}>{i.cantidad}</span>
                        <button type="button" onClick={() => updateCantidad(i.product_id, 1)}>+</button>
                      </td>
                      <td>${Number(i.precio_venta).toLocaleString('es-AR')}</td>
                      <td>${(i.cantidad * i.precio_venta).toLocaleString('es-AR')}</td>
                      <td><button type="button" className="btn btn-secondary" onClick={() => updateCantidad(i.product_id, -i.cantidad)}>Quitar</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p style={{ marginTop: '0.75rem', fontWeight: 700 }}>Total: ${total.toLocaleString('es-AR')}</p>
            </div>
          )}
        </div>
        {error && <p style={{ color: 'var(--danger)' }}>{error}</p>}
        <button type="submit" className="btn btn-primary" disabled={saving || items.length === 0}>
          {saving ? 'Guardando...' : 'Confirmar pedido'}
        </button>
      </form>
    </div>
  );
}
