import React, { useState, useEffect } from 'react';
import { getProducts, createFactura } from '../../api';

export default function OwnerFactura() {
  const [products, setProducts] = useState([]);
  const [numero, setNumero] = useState('');
  const [proveedor, setProveedor] = useState('');
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));
  const [items, setItems] = useState([{ product_id: '', cantidad: 1, precio_costo: '', porcentaje_ganancia: '' }]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getProducts()
      .then(setProducts)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const addItem = () => {
    setItems((prev) => [...prev, { product_id: '', cantidad: 1, precio_costo: '', porcentaje_ganancia: '' }]);
  };

  const updateItem = (index, field, value) => {
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, [field]: value } : it)));
  };

  const removeItem = (index) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const payload = items
      .filter((it) => it.product_id && it.cantidad > 0 && (it.precio_costo !== '' || it.precio_venta !== ''))
      .map((it) => ({
        product_id: Number(it.product_id),
        cantidad: Math.max(1, Math.floor(Number(it.cantidad))) || 1,
        precio_costo: Number(it.precio_costo) || 0,
        porcentaje_ganancia: Number(it.porcentaje_ganancia) || 0,
        precio_venta: it.precio_venta !== '' ? Number(it.precio_venta) : undefined,
      }));
    if (payload.length === 0) {
      setError('Agregue al menos un ítem con cantidad y precio.');
      return;
    }
    setSaving(true);
    try {
      await createFactura({ numero, proveedor, fecha, items: payload });
      setNumero('');
      setProveedor('');
      setFecha(new Date().toISOString().slice(0, 10));
      setItems([{ product_id: '', cantidad: 1, precio_costo: '', porcentaje_ganancia: '' }]);
      setError('');
      alert('Factura cargada. Stock y precios actualizados.');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p>Cargando...</p>;

  return (
    <div>
      <h2>Cargar factura de compra</h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>
        Simula el escaneo: elegí productos, cantidades, precio de costo y % de ganancia. Se actualiza el stock y el precio de venta.
      </p>
      <div className="card">
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem' }}>
            <div className="form-group">
              <label>Nº factura</label>
              <input value={numero} onChange={(e) => setNumero(e.target.value)} placeholder="Opcional" />
            </div>
            <div className="form-group">
              <label>Proveedor</label>
              <input value={proveedor} onChange={(e) => setProveedor(e.target.value)} placeholder="Opcional" />
            </div>
            <div className="form-group">
              <label>Fecha</label>
              <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
            </div>
          </div>
          <h3 style={{ marginTop: '1.5rem' }}>Ítems</h3>
          {items.map((it, index) => (
            <div key={index} style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'flex-end', marginBottom: '0.75rem' }}>
              <div className="form-group" style={{ flex: '1 1 180px', marginBottom: 0 }}>
                <label>Producto</label>
                <select
                  value={it.product_id}
                  onChange={(e) => updateItem(index, 'product_id', e.target.value)}
                  required
                >
                  <option value="">Seleccionar</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>{p.codigo} - {p.descripcion}</option>
                  ))}
                </select>
              </div>
              <div className="form-group" style={{ width: '80px', marginBottom: 0 }}>
                <label>Cant.</label>
                <input
                  type="number"
                  min="1"
                  value={it.cantidad}
                  onChange={(e) => updateItem(index, 'cantidad', e.target.value)}
                />
              </div>
              <div className="form-group" style={{ width: '100px', marginBottom: 0 }}>
                <label>P. costo</label>
                <input
                  type="number"
                  step="0.01"
                  value={it.precio_costo}
                  onChange={(e) => updateItem(index, 'precio_costo', e.target.value)}
                />
              </div>
              <div className="form-group" style={{ width: '90px', marginBottom: 0 }}>
                <label>% gan.</label>
                <input
                  type="number"
                  step="0.01"
                  value={it.porcentaje_ganancia}
                  onChange={(e) => updateItem(index, 'porcentaje_ganancia', e.target.value)}
                />
              </div>
              <button type="button" className="btn btn-secondary" onClick={() => removeItem(index)}>Quitar</button>
            </div>
          ))}
          <button type="button" className="btn btn-secondary" onClick={addItem}>+ Agregar ítem</button>
          {error && <p style={{ color: 'var(--danger)', marginTop: '1rem' }}>{error}</p>}
          <div style={{ marginTop: '1rem' }}>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Cargando...' : 'Cargar factura (actualizar stock)'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
