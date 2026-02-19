import React, { useState, useEffect } from 'react';
import { getUsers, createUser } from '../../api';

export default function OwnerUsuarios() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    getUsers()
      .then(setUsers)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const u = await createUser({ email, password, name });
      setUsers((prev) => [...prev, u]);
      setShowForm(false);
      setEmail('');
      setPassword('');
      setName('');
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <p>Cargando...</p>;

  return (
    <div>
      <h2>Usuarios (vendedores)</h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>
        Crear cuentas de vendedor para que usen la app móvil.
      </p>
      <button type="button" className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
        {showForm ? 'Cancelar' : '+ Nuevo vendedor'}
      </button>
      {showForm && (
        <div className="card" style={{ marginTop: '1rem' }}>
          <form onSubmit={handleCreate}>
            <div className="form-group">
              <label>Nombre</label>
              <input value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Contraseña</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
            </div>
            {error && <p style={{ color: 'var(--danger)' }}>{error}</p>}
            <button type="submit" className="btn btn-primary">Crear vendedor</button>
          </form>
        </div>
      )}
      <div className="card" style={{ marginTop: '1rem' }}>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Email</th>
                <th>Rol</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td><span className={`badge ${u.role === 'owner' ? 'badge-success' : 'badge-info'}`}>{u.role}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
