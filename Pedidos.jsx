import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getPedidos } from '../../api';

export default function VendedorPedidos() {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPedidos()
      .then(setPedidos)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h2>Mis pedidos</h2>
      <Link to="/pedido" className="btn btn-primary" style={{ marginBottom: '1rem' }}>+ Nuevo pedido</Link>
      {loading ? (
        <p>Cargando...</p>
      ) : pedidos.length === 0 ? (
        <div className="card"><p className="empty-state">No hay pedidos.</p></div>
      ) : (
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Cliente</th>
                  <th>Total</th>
                  <th>Estado</th>
                  <th>Reparto</th>
                </tr>
              </thead>
              <tbody>
                {pedidos.map((p) => (
                  <tr key={p.id}>
                    <td>{new Date(p.created_at).toLocaleString('es-AR')}</td>
                    <td>{p.client_name}</td>
                    <td>${Number(p.total).toLocaleString('es-AR')}</td>
                    <td><span className="badge badge-info">{p.estado}</span></td>
                    <td>{p.reparto_id ? `#${p.reparto_id}` : '-'}</td>
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
