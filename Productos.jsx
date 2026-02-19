import React, { useState, useEffect } from 'react';
import { getProducts, createProduct, updateProduct } from '../../api';

export default function OwnerProductos() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ codigo: '', descripcion: '', precio_costo: '', precio_venta: '', porcentaje_ganancia: '', stock: '' });
  const [error, setError] = useState('');

  useEffect(() => {
    getProducts()
      .then(setProducts)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const body = {
      codigo: form.codigo.trim(),
      descripcion: form.descripcion.trim(),
      precio_costo: Number(form.precio_costo) || 0,
      precio_venta: Number(form.precio_venta) || 0,
      porcentaje_ganancia: Number(form.porcentaje_ganancia) || 0,
      stock: Math.max(0, Math.floor(Number(form.stock))) || 0,
    };
    try {
      if (editing) {
        await updateProduct(editing.id, body);
        setProducts((prev) => prev.map((p) => (p.id === editing.id ? { ...p, ...body } : p)));
        setEditing(null);
      } else {
        const created = await createProduct(body);
        setProducts((prev) => [created, ...prev]);
      }
      setShowForm(false);
      setForm({ codigo: '', descripcion: '', precio_costo: '', precio_venta: '', porcentaje_ganancia: '', stock: '' });
    } catch (err) {
      setError(err.message);
    }
  };

  const calcPrecioVenta = () => {
    const costo = Number(form.precio_costo) || 0;
    const pct = Number(form.porcentaje_ganancia) || 0;
    if (costo && pct) setForm((f) => ({ ...f, precio_venta: (costo * (1 + pct / 100)).toFixed(2) }));
  };

  if (loading) return <p>Cargando...</p>;

  return (
    <div>
      <h2>Productos (stock y precios)</h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>
        Solo el dueño ve costo y ganancia. Los vendedores ven solo cantidad y precio de venta.
      </p>
      <button type="button" className="btn btn-primary" onClick={() => { setShowForm(!showForm); setEditing(null); setForm({ codigo: '', descripcion: '', precio_costo: '', precio_venta: '', porcentaje_ganancia: '', stock: '' }); }}>
        {showForm ? 'Cancelar' : '+ Nuevo producto'}
      </button>
      {showForm && (
        <div className="card" style={{ marginTop: '1rem' }}>
          <h3 style={{ marginTop: 0 }}>{editing ? 'Editar producto' : 'Nuevo producto'}</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Código</label>
              <input
                value={form.codigo}
                onChange={(e) => setForm((f) => ({ ...f, codigo: e.target.value }))}
                placeholder="Código"
                required
                disabled={!!editing}
              />
            </div>
            <div className="form-group">
              <label>Descripción</label>
              <input
                value={form.descripcion}
                onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))}
                placeholder="Descripción"
                required
              />
            </div>
            <div className="form-group">
              <label>Precio costo</label>
              <input
                type="number"
                step="0.01"
                value={form.precio_costo}
                onChange={(e) => setForm((f) => ({ ...f, precio_costo: e.target.value }))}
                onBlur={calcPrecioVenta}
              />
            </div>
            <div className="form-group">
              <label>% ganancia</label>
              <input
                type="number"
                step="0.01"
                value={form.porcentaje_ganancia}
                onChange={(e) => setForm((f) => ({ ...f, porcentaje_ganancia: e.target.value }))}
                onBlur={calcPrecioVenta}
              />
            </div>
            <div className="form-group">
              <label>Precio venta (con ganancia)</label>
              <input
                type="number"
                step="0.01"
                value={form.precio_venta}
                onChange={(e) => setForm((f) => ({ ...f, precio_venta: e.target.value }))}
              />
            </div>
            <div className="form-group">
              <label>Stock</label>
              <input
                type="number"
                min="0"
                value={form.stock}
                onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))}
              />
            </div>
            {error && <p style={{ color: 'var(--danger)' }}>{error}</p>}
            <button type="submit" className="btn btn-primary">{editing ? 'Guardar' : 'Crear'}</button>
          </form>
        </div>
      )}
      <div className="card" style={{ marginTop: '1rem' }}>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Código</th>
                <th>Descripción</th>
                <th>Stock</th>
                <th>Costo</th>
                <th>P. venta</th>
                <th>% gan.</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  <td>{p.codigo}</td>
                  <td>{p.descripcion}</td>
                  <td>{p.stock}</td>
                  <td>${Number(p.precio_costo).toLocaleString('es-AR')}</td>
                  <td>${Number(p.precio_venta).toLocaleString('es-AR')}</td>
                  <td>{p.porcentaje_ganancia}%</td>
                  <td>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => {
                        setEditing(p);
                        setShowForm(true);
                        setForm({
                          codigo: p.codigo,
                          descripcion: p.descripcion,
                          precio_costo: p.precio_costo,
                          precio_venta: p.precio_venta,
                          porcentaje_ganancia: p.porcentaje_ganancia,
                          stock: p.stock,
                        });
                      }}
                    >
                      Editar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
