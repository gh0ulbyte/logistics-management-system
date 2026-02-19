import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getClient, createClient, updateClient } from '../../api';

export default function VendedorClienteDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = id === 'nuevo';
  const [client, setClient] = useState(isNew ? {} : null);
  const [loading, setLoading] = useState(!isNew);
  const [form, setForm] = useState({ nombre: '', telefono: '', direccion: '', zona: '', dias_visita: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isNew) {
      setForm({ nombre: '', telefono: '', direccion: '', zona: '', dias_visita: '' });
      return;
    }
    getClient(id)
      .then((data) => {
        setClient(data);
        setForm({
          nombre: data.nombre || '',
          telefono: data.telefono || '',
          direccion: data.direccion || '',
          zona: data.zona || '',
          dias_visita: data.dias_visita || '',
        });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id, isNew]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      if (isNew) {
        const created = await createClient(form);
        navigate(`/clientes/${created.id}`, { replace: true });
      } else {
        await updateClient(id, form);
        setClient((prev) => ({ ...prev, ...form }));
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!isNew && loading) return <p>Cargando...</p>;
  if (!isNew && !client) return <p>Cliente no encontrado.</p>;

  return (
    <div>
      <Link to="/clientes" style={{ marginBottom: '1rem', display: 'inline-block' }}>← Clientes</Link>
      <div className="card">
        <h2 style={{ marginTop: 0 }}>{isNew ? 'Nuevo cliente' : client.nombre}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Nombre</label>
            <input value={form.nombre} onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))} required />
          </div>
          <div className="form-group">
            <label>Teléfono</label>
            <input value={form.telefono} onChange={(e) => setForm((f) => ({ ...f, telefono: e.target.value }))} />
          </div>
          <div className="form-group">
            <label>Dirección</label>
            <input value={form.direccion} onChange={(e) => setForm((f) => ({ ...f, direccion: e.target.value }))} />
          </div>
          <div className="form-group">
            <label>Zona</label>
            <input value={form.zona} onChange={(e) => setForm((f) => ({ ...f, zona: e.target.value }))} placeholder="Ej: zona tablada" />
          </div>
          <div className="form-group">
            <label>Días de visita</label>
            <input value={form.dias_visita} onChange={(e) => setForm((f) => ({ ...f, dias_visita: e.target.value }))} placeholder="Ej: Mar Vie" />
          </div>
          {error && <p style={{ color: 'var(--danger)' }}>{error}</p>}
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Guardando...' : isNew ? 'Crear cliente' : 'Guardar'}
          </button>
        </form>
      </div>
      {!isNew && client.ultimas_compras?.length > 0 && (
        <div className="card" style={{ marginTop: '1rem' }}>
          <h3 style={{ marginTop: 0 }}>Últimas compras</h3>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Total</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {client.ultimas_compras.map((p) => (
                  <tr key={p.id}>
                    <td>{new Date(p.created_at).toLocaleDateString('es-AR')}</td>
                    <td>${Number(p.total).toLocaleString('es-AR')}</td>
                    <td><span className="badge badge-info">{p.estado}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
