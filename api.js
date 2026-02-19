const API = '/api';

function getToken() {
  return localStorage.getItem('token');
}

function getHeaders() {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function login(email, password) {
  const res = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Error al iniciar sesión');
  return data;
}

export async function getMe() {
  const res = await fetch(`${API}/auth/me`, { headers: getHeaders() });
  if (res.status === 401) return null;
  const data = await res.json().catch(() => null);
  return data;
}

export async function getProducts() {
  const res = await fetch(`${API}/products`, { headers: getHeaders() });
  if (!res.ok) throw new Error('Error al cargar productos');
  return res.json();
}

export async function getProduct(id) {
  const res = await fetch(`${API}/products/${id}`, { headers: getHeaders() });
  if (!res.ok) throw new Error('Producto no encontrado');
  return res.json();
}

export async function createProduct(body) {
  const res = await fetch(`${API}/products`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Error al crear producto');
  return data;
}

export async function updateProduct(id, body) {
  const res = await fetch(`${API}/products/${id}`, {
    method: 'PATCH',
    headers: getHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error('Error al actualizar');
  return res.json();
}

export async function getClients(params = {}) {
  const q = new URLSearchParams(params).toString();
  const res = await fetch(`${API}/clients${q ? `?${q}` : ''}`, { headers: getHeaders() });
  if (!res.ok) throw new Error('Error al cargar clientes');
  return res.json();
}

export async function getClient(id) {
  const res = await fetch(`${API}/clients/${id}`, { headers: getHeaders() });
  if (!res.ok) throw new Error('Cliente no encontrado');
  return res.json();
}

export async function createClient(body) {
  const res = await fetch(`${API}/clients`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Error al crear cliente');
  return data;
}

export async function updateClient(id, body) {
  const res = await fetch(`${API}/clients/${id}`, {
    method: 'PATCH',
    headers: getHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error('Error al actualizar');
  return res.json();
}

export async function getRepartos() {
  const res = await fetch(`${API}/repartos`, { headers: getHeaders() });
  if (!res.ok) throw new Error('Error al cargar repartos');
  return res.json();
}

export async function getReparto(id) {
  const res = await fetch(`${API}/repartos/${id}`, { headers: getHeaders() });
  if (!res.ok) throw new Error('Reparto no encontrado');
  return res.json();
}

export async function createReparto(body) {
  const res = await fetch(`${API}/repartos`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Error al crear reparto');
  return data;
}

export async function getPedidos(params = {}) {
  const q = new URLSearchParams(params).toString();
  const res = await fetch(`${API}/pedidos${q ? `?${q}` : ''}`, { headers: getHeaders() });
  if (!res.ok) throw new Error('Error al cargar pedidos');
  return res.json();
}

export async function getPedido(id) {
  const res = await fetch(`${API}/pedidos/${id}`, { headers: getHeaders() });
  if (!res.ok) throw new Error('Pedido no encontrado');
  return res.json();
}

export async function createPedido(body) {
  const res = await fetch(`${API}/pedidos`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Error al crear pedido');
  return data;
}

export async function assignPedidoReparto(pedidoId, repartoId) {
  const res = await fetch(`${API}/pedidos/${pedidoId}/reparto`, {
    method: 'PATCH',
    headers: getHeaders(),
    body: JSON.stringify({ reparto_id: repartoId }),
  });
  if (!res.ok) throw new Error('Error al asignar reparto');
  return res.json();
}

export async function createFactura(body) {
  const res = await fetch(`${API}/facturas`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Error al cargar factura');
  return data;
}

export async function getFacturas() {
  const res = await fetch(`${API}/facturas`, { headers: getHeaders() });
  if (!res.ok) throw new Error('Error al cargar facturas');
  return res.json();
}

export async function getUsers() {
  const res = await fetch(`${API}/auth/users`, { headers: getHeaders() });
  if (!res.ok) throw new Error('Error al cargar usuarios');
  return res.json();
}

export async function createUser(body) {
  const res = await fetch(`${API}/auth/users`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Error al crear usuario');
  return data;
}
