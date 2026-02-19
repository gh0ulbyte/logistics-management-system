# KAEL – Sistema de logística

Sistema de logística para distribución: carga de stock por factura (dueño), pedidos por vendedores, repartos por camioneta. Responsive (PC + móvil).

## Requisitos

- **.NET 8 SDK** (para el backend)
- **Node.js 18+** (solo para el frontend)
- npm o yarn

## Instalación y ejecución

### 1. Backend (API .NET)

```bash
cd Kael.Api
dotnet restore
dotnet run
```

- API en **http://localhost:3001**
- La base de datos SQLite se crea automáticamente en `database/kael.db` la primera vez.
- Usuario dueño por defecto: **admin@kael.com** / **admin123**

### 2. Frontend

En otra terminal:

```bash
cd frontend
npm install
npm run dev
```

- App en **http://localhost:5173**
- El proxy de Vite envía las peticiones `/api` al backend en el puerto 3001.

## Roles

- **Dueño (owner):** Login con admin@kael.com. Acceso a: Inicio, Repartos, Productos (costo + ganancia), Cargar factura, Usuarios. Ve qué lleva cada camioneta.
- **Vendedor:** Creado por el dueño en Usuarios. Acceso a: Clientes, Productos (solo stock y precio venta), Nuevo pedido, Mis pedidos. No ve costos ni ganancia.

## Flujo resumido

1. Dueño carga factura de compra (Cargar factura) → se actualiza stock y precios (costo + % ganancia).
2. Dueño crea repartos (camionetas) en Repartos.
3. Vendedor ve clientes, productos y toma pedidos (Nuevo pedido); puede asignar a un reparto.
4. Al confirmar pedido se descuenta stock.
5. Dueño ve en Repartos → Ver carga qué lleva cada camioneta.

## Estructura del proyecto

```
APP/
  Kael.sln
  Kael.Api/              # API ASP.NET Core 8 + SQLite
    Controllers/         # Auth, Products, Clients, Repartos, Pedidos, Facturas
    Entities/
    Data/                # KaelDbContext
    Services/            # AuthService (JWT, BCrypt)
  frontend/              # React + Vite
    src/
      pages/owner/
      pages/vendedor/
      api.js
  database/
    kael.db              # Creado automáticamente por el backend .NET
  backend/               # (opcional) API Node.js anterior
  ESPECIFICACION.md
```

## API (resumen)

- `POST /api/auth/login` – Login (email, password)
- `GET /api/auth/me` – Usuario actual (Bearer token)
- `GET/POST /api/products` – Productos (dueño ve costo; vendedor solo stock y precio_venta)
- `GET/POST /api/clients` – Clientes
- `GET/POST /api/repartos`, `GET /api/repartos/:id` – Repartos y detalle (qué lleva)
- `GET/POST /api/pedidos`, `PATCH /api/pedidos/:id/reparto` – Pedidos
- `POST /api/facturas` – Cargar factura de compra (dueño; actualiza stock y precios)
- `GET/POST /api/auth/users` – Usuarios (solo dueño)

## Backend anterior (Node.js)

Si preferís usar el backend en Node en lugar de .NET:

```bash
cd backend
npm install
npm run init-db
npm run dev
```

El frontend es el mismo; solo asegurate de que el backend que corras esté en el puerto 3001.
