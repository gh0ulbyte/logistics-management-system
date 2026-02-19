import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getRepartos, createReparto } from '../../api';

export default function OwnerRepartos() {
  const [repartos, setRepartos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [nombre, setNombre] = useState('');
  const [vehiculo, setVehiculo] = useState('');
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    getRepartos()
      .then(setRepartos)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const r = await createReparto({ nombre, vehiculo, fecha });
      setRepartos((prev) => [r, ...prev]);
      setShowForm(false);
      setNombre('');
      setVehiculo('');
      setFecha(new Date().toISOString().slice(0, 10));
      navigate(`/repartos/${r.id}`);
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <p>Cargando...</p>;

  return (
    <div>
      <h2>Repartos (camionetas)</h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>
        Ve qué lleva cada camioneta. Crear reparto y asignar pedidos desde aquí o desde la app del vendedor.
      </p>
      <button type="button" className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
        {showForm ? 'Cancelar' : '+ Nuevo reparto'}
      </button>
      {showForm && (
        <div className="card" style={{ marginTop: '1rem' }}>
          <h3 style={{ marginTop: 0 }}>Nuevo reparto</h3>
          <form onSubmit={handleCreate}>
            <div className="form-group">
              <label>Nombre</label>
              <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej: Lunes zona Norte" required />
            </div>
            <div className="form-group">
              <label>Vehículo</label>
              <input value={vehiculo} onChange={(e) => setVehiculo(e.target.value)} placeholder="Ej: Ford 350" />
            </div>
            <div className="form-group">
              <label>Fecha</label>
              <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
            </div>
            {error && <p style={{ color: 'var(--danger)' }}>{error}</p>}
            <button type="submit" className="btn btn-primary">Crear reparto</button>
          </form>
        </div>
      )}
      <div className="card" style={{ marginTop: '1rem' }}>
        {repartos.length === 0 ? (
          <p className="empty-state">No hay repartos. Crear uno para asignar pedidos.</p>
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
                {repartos.map((r) => (
                  <tr key={r.id}>
                    <td>{r.nombre}</td>
                    <td>{r.vehiculo || '-'}</td>
                    <td>{r.fecha || '-'}</td>
                    <td><span className={`badge badge-${r.estado === 'activo' ? 'success' : 'info'}`}>{r.estado}</span></td>
                    <td><Link to={`/repartos/${r.id}`} className="btn btn-secondary">Ver carga</Link></td>
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
