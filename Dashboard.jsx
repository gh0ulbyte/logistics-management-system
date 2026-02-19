import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getRepartos, getPedidos } from '../../api';

export default function OwnerDashboard() {
  const [repartos, setRepartos] = useState([]);
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getRepartos(), getPedidos()])
      .then(([r, p]) => {
        setRepartos(r);
        setPedidos(p);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Cargando...</p>;

  const repartosActivos = repartos.filter((x) => x.estado === 'activo');

  return (
    <div>
      <h2>Inicio</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="card">
          <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Repartos activos</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{repartosActivos.length}</div>
          <Link to="/repartos">Ver repartos</Link>
        </div>
        <div className="card">
          <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Pedidos recientes</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{pedidos.length}</div>
          <Link to="/repartos">Ver por reparto</Link>
        </div>
      </div>
      <div className="card">
        <h3 style={{ marginTop: 0 }}>Repartos (camionetas)</h3>
        {repartos.length === 0 ? (
          <p className="empty-state">No hay repartos. Crear uno en Repartos.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Vehículo</th>
                  <th>Fecha</th>
                  <th>Estado</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {repartos.slice(0, 10).map((r) => (
                  <tr key={r.id}>
                    <td>{r.nombre}</td>
                    <td>{r.vehiculo || '-'}</td>
                    <td>{r.fecha || '-'}</td>
                    <td><span className={`badge badge-${r.estado === 'activo' ? 'success' : 'info'}`}>{r.estado}</span></td>
                    <td><Link to={`/repartos/${r.id}`}>Ver carga</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
