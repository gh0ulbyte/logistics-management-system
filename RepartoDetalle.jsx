import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getReparto } from '../../api';

export default function OwnerRepartoDetalle() {
  const { id } = useParams();
  const [reparto, setReparto] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getReparto(id)
      .then(setReparto)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <p>Cargando...</p>;
  if (!reparto) return <p>Reparto no encontrado.</p>;

  const { pedidos = [] } = reparto;
  const totalBultos = pedidos.reduce((acc, p) => {
    const sum = (p.detalle || []).reduce((a, d) => a + (d.cantidad || 0), 0);
    return acc + sum;
  }, 0);

  return (
    <div>
      <Link to="/repartos" style={{ marginBottom: '1rem', display: 'inline-block' }}>← Repartos</Link>
      <div className="card">
        <h2 style={{ marginTop: 0 }}>{reparto.nombre}</h2>
        <p><strong>Vehículo:</strong> {reparto.vehiculo || '-'}</p>
        <p><strong>Fecha:</strong> {reparto.fecha || '-'}</p>
        <p><strong>Estado:</strong> <span className={`badge badge-${reparto.estado === 'activo' ? 'success' : 'info'}`}>{reparto.estado}</span></p>
        <p><strong>Bultos aprox.:</strong> {totalBultos}</p>
      </div>
      <div className="card">
        <h3 style={{ marginTop: 0 }}>Pedidos en este reparto</h3>
        {pedidos.length === 0 ? (
          <p className="empty-state">No hay pedidos asignados a esta camioneta.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Dirección</th>
                  <th>Total</th>
                  <th>Estado</th>
                  <th>Detalle</th>
                </tr>
              </thead>
              <tbody>
                {pedidos.map((p) => (
                  <tr key={p.id}>
                    <td>{p.client_name}</td>
                    <td>{p.direccion || '-'}</td>
                    <td>${Number(p.total).toLocaleString('es-AR')}</td>
                    <td><span className="badge badge-info">{p.estado}</span></td>
                    <td>
                      {(p.detalle || []).map((d, i) => (
                        <span key={i}>
                          {d.descripcion} x{d.cantidad}
                          {i < (p.detalle?.length || 0) - 1 ? ', ' : ''}
                        </span>
                      ))}
                    </td>
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
