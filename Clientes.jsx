import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getClients } from '../../api';

const DIAS = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'];

export default function VendedorClientes() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [dias, setDias] = useState('');

  useEffect(() => {
    const params = {};
    if (q) params.q = q;
    if (dias) params.dias = dias;
    getClients(params)
      .then(setClients)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [q, dias]);

  return (
    <div>
      <h2>Clientes</h2>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
        <input
          type="search"
          placeholder="Buscar..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="form-group"
          style={{ flex: '1 1 200px', maxWidth: 300 }}
        />
        <select value={dias} onChange={(e) => setDias(e.target.value)} style={{ minWidth: 120 }}>
          <option value="">Todos los días</option>
          {DIAS.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
      </div>
      <p style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>{clients.length} clientes</p>
      {loading ? (
        <p>Cargando...</p>
      ) : clients.length === 0 ? (
        <div className="card"><p className="empty-state">No hay clientes. Agregar uno nuevo.</p></div>
      ) : (
        <div className="card">
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {clients.map((c) => (
              <li key={c.id} style={{ borderBottom: '1px solid var(--border)', padding: '0.75rem 0' }}>
                <Link to={`/clientes/${c.id}`} style={{ display: 'block', color: 'inherit' }}>
                  <strong>{c.nombre}</strong>
                  {c.dias_visita && <span style={{ color: 'var(--accent)', marginLeft: '0.5rem' }}>({c.dias_visita})</span>}
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
                    📍 {c.direccion || '-'} {c.zona ? `- ${c.zona}` : ''}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
      <Link to="/clientes/nuevo" className="btn btn-primary" style={{ marginTop: '1rem' }}>
        + Nuevo cliente
      </Link>
    </div>
  );
}
