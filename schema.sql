-- Sistema de logística KAEL - Esquema SQLite
-- Ejecutar para crear la base de datos inicial

-- Usuarios: dueño (owner) y vendedores (vendedor)
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('owner', 'vendedor')),
  created_at TEXT DEFAULT (datetime('now'))
);

-- Productos: stock, precio costo (solo dueño), precio venta (con ganancia)
CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  codigo TEXT UNIQUE NOT NULL,
  descripcion TEXT NOT NULL,
  precio_costo REAL NOT NULL DEFAULT 0,
  precio_venta REAL NOT NULL DEFAULT 0,
  porcentaje_ganancia REAL NOT NULL DEFAULT 0,
  stock INTEGER NOT NULL DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Clientes: vendedores pueden agregar; dueño ve todo
CREATE TABLE IF NOT EXISTS clients (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  telefono TEXT,
  direccion TEXT,
  zona TEXT,
  dias_visita TEXT,
  created_by INTEGER REFERENCES users(id),
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Facturas de compra (dueño escanea → carga stock)
CREATE TABLE IF NOT EXISTS facturas_compra (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  numero TEXT,
  proveedor TEXT,
  fecha TEXT,
  user_id INTEGER REFERENCES users(id),
  created_at TEXT DEFAULT (datetime('now'))
);

-- Detalle factura: ítems con costo y precio venta
CREATE TABLE IF NOT EXISTS facturas_compra_detalle (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  factura_id INTEGER NOT NULL REFERENCES facturas_compra(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id),
  cantidad INTEGER NOT NULL,
  precio_costo REAL NOT NULL,
  precio_venta REAL NOT NULL,
  porcentaje_ganancia REAL NOT NULL DEFAULT 0
);

-- Repartos (camionetas): el dueño ve qué lleva cada una
CREATE TABLE IF NOT EXISTS repartos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  vehiculo TEXT,
  fecha TEXT,
  estado TEXT DEFAULT 'activo' CHECK (estado IN ('activo', 'cerrado')),
  created_at TEXT DEFAULT (datetime('now'))
);

-- Pedidos: vendedor crea, se asigna a un reparto
CREATE TABLE IF NOT EXISTS pedidos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id INTEGER NOT NULL REFERENCES clients(id),
  reparto_id INTEGER REFERENCES repartos(id),
  user_id INTEGER NOT NULL REFERENCES users(id),
  estado TEXT DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'confirmado', 'entregado', 'cancelado')),
  total REAL DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Detalle del pedido: productos y cantidades (descuenta stock)
CREATE TABLE IF NOT EXISTS pedido_detalle (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  pedido_id INTEGER NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id),
  cantidad INTEGER NOT NULL,
  precio_unitario REAL NOT NULL
);

-- Movimientos de stock (entrada por factura, salida por pedido)
CREATE TABLE IF NOT EXISTS movimientos_stock (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL REFERENCES products(id),
  cantidad INTEGER NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('entrada', 'salida')),
  referencia TEXT NOT NULL CHECK (referencia IN ('factura', 'pedido')),
  referencia_id INTEGER NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_pedidos_reparto ON pedidos(reparto_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_client ON pedidos(client_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_user ON pedidos(user_id);
CREATE INDEX IF NOT EXISTS idx_pedido_detalle_pedido ON pedido_detalle(pedido_id);
CREATE INDEX IF NOT EXISTS idx_clients_dias ON clients(dias_visita);
CREATE INDEX IF NOT EXISTS idx_movimientos_product ON movimientos_stock(product_id);

-- Usuario dueño inicial se crea desde el backend (seed o registro).
