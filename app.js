(function () {
  const API = '/api';
  let user = null;

  function getToken() { return localStorage.getItem('token'); }
  function setToken(t) { localStorage.setItem('token', t); }
  function removeToken() { localStorage.removeItem('token'); }

  async function api(path, options = {}) {
    const url = path.startsWith('http') ? path : API + path;
    const headers = options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' };
    Object.assign(headers, options.headers || {});
    const token = getToken();
    if (token) headers['Authorization'] = 'Bearer ' + token;
    const res = await fetch(url, { ...options, headers });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Error');
    return data;
  }

  function parseHash() {
    const h = (location.hash || '#/login').slice(1).split('?')[0];
    const [path, id] = h.split('/').filter(Boolean);
    return { path: path || 'login', id: id || null };
  }

  function navigate(path, id) {
    location.hash = id ? `#/${path}/${id}` : `#/${path}`;
  }

  function showLogin() {
    document.getElementById('header').style.display = 'none';
    document.getElementById('nav').style.display = 'none';
    document.getElementById('main').innerHTML = `
      <div class="card" style="max-width:400px;margin:2rem auto">
        <h2 style="text-align:center;color:var(--accent)">KAEL</h2>
        <p style="text-align:center;color:var(--text-muted);margin-bottom:1.5rem">Inicie sesión</p>
        <form id="loginForm">
          <div class="form-group">
            <label>Usuario o email</label>
            <input type="text" id="loginEmail" placeholder="Usuario o email" required />
          </div>
          <div class="form-group">
            <label>Contraseña</label>
            <input type="password" id="loginPassword" placeholder="Contraseña" required />
          </div>
          <p id="loginError" class="error-msg" style="display:none"></p>
          <button type="submit" class="btn btn-primary" style="width:100%">Entrar</button>
        </form>
      </div>`;
    document.getElementById('loginForm').onsubmit = async (e) => {
      e.preventDefault();
      const errEl = document.getElementById('loginError');
      errEl.style.display = 'none';
      try {
        const data = await api('/auth/login', { method: 'POST', body: JSON.stringify({ email: document.getElementById('loginEmail').value, password: document.getElementById('loginPassword').value }) });
        setToken(data.token);
        user = data.user;
        navigate(user.role === 'owner' ? 'dashboard' : 'clientes');
        initApp();
      } catch (err) {
        errEl.textContent = err.message;
        errEl.style.display = 'block';
      }
    };
  }

  function renderHeader() {
    document.getElementById('header').style.display = 'flex';
    document.getElementById('userName').textContent = user ? user.name : '';
  }

  function renderNav() {
    const nav = document.getElementById('nav');
    nav.style.display = 'block';
    const isOwner = user && user.role === 'owner';
    const links = isOwner
      ? [{ path: 'dashboard', label: 'Inicio' }, { path: 'repartos', label: 'Repartos' }, { path: 'pedidos', label: 'Pedidos' }, { path: 'productos', label: 'Productos' }, { path: 'stock', label: 'Actualizar Stock' }, { path: 'caja', label: 'Caja' }, { path: 'vendedores', label: 'Vendedores' }]
      : [{ path: 'clientes', label: 'Clientes' }, { path: 'catalogo', label: 'Productos' }, { path: 'pedido', label: 'Nuevo pedido' }, { path: 'pedidos', label: 'Mis pedidos' }];
    const current = parseHash().path;
    nav.innerHTML = '<button type="button" class="btn btn-secondary nav-close" id="navClose">✕ Cerrar</button>' + links.map(l => `<a href="#/${l.path}" class="${current === l.path ? 'active' : ''}">${l.label}</a>`).join('');
    document.getElementById('navClose').onclick = () => nav.style.display = 'none';
    document.getElementById('btnMenu').onclick = () => nav.style.display = 'block';
  }

  document.getElementById('btnSalir').onclick = () => { removeToken(); user = null; location.hash = '#/login'; initApp(); };

  async function loadUser() {
    try {
      user = await api('/auth/me');
      return true;
    } catch (_) { return false; }
  }

  async function renderDashboard() {
    const [repartos, pedidos, products] = await Promise.all([api('/repartos'), api('/pedidos'), user.role === 'owner' ? api('/products') : Promise.resolve([])]);
    const activos = repartos.filter(r => r.estado === 'activo').length;
    const stockTable = user.role === 'owner' && products.length > 0
      ? `<div class="card" style="margin-bottom:1rem">
          <h3 style="margin-top:0">Stock por producto</h3>
          <div class="table-wrap"><table><thead><tr><th>Producto</th><th>Unidades</th></tr></thead><tbody>${products.map(p => `<tr><td>${p.codigo} – ${p.descripcion}</td><td><strong>${p.stock}</strong></td></tr>`).join('')}</tbody></table></div>
          <a href="#/productos">Ver todos los productos</a>
        </div>`
      : '';
    document.getElementById('main').innerHTML = `
      <h2>Inicio</h2>
      ${stockTable}
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:1rem;margin-bottom:1.5rem">
        <div class="card"><div style="color:var(--text-muted);font-size:0.9rem">Repartos activos</div><div style="font-size:1.5rem;font-weight:700">${activos}</div><a href="#/repartos">Ver repartos</a></div>
        <div class="card"><div style="color:var(--text-muted);font-size:0.9rem">Pedidos</div><div style="font-size:1.5rem;font-weight:700">${pedidos.length}</div><a href="#/repartos">Ver por reparto</a></div>
      </div>
      <div class="card">
        <h3 style="margin-top:0">Repartos</h3>
        ${repartos.length === 0 ? '<p class="empty-state">No hay repartos.</p>' : `<div class="table-wrap"><table><thead><tr><th>Nombre</th><th>Vehículo</th><th>Fecha</th><th>Estado</th><th></th></tr></thead><tbody>${repartos.slice(0,10).map(r => `<tr><td>${r.nombre}</td><td>${r.vehiculo || '-'}</td><td>${r.fecha || '-'}</td><td><span class="badge badge-${r.estado==='activo'?'success':'info'}">${r.estado}</span></td><td><a href="#/repartos/${r.id}">Ver carga</a></td></tr>`).join('')}</tbody></table></div>`}
      </div>`;
  }

  async function renderRepartos() {
    const repartos = await api('/repartos');
    document.getElementById('main').innerHTML = `
      <h2>Repartos</h2>
      <button type="button" class="btn btn-primary" id="btnNuevoReparto">+ Nuevo reparto</button>
      <div class="card" style="margin-top:1rem">
        ${repartos.length === 0 ? '<p class="empty-state">No hay repartos.</p>' : `<div class="table-wrap"><table><thead><tr><th>Nombre</th><th>Vehículo</th><th>Fecha</th><th>Estado</th><th></th></tr></thead><tbody>${repartos.map(r => `<tr><td>${r.nombre}</td><td>${r.vehiculo||'-'}</td><td>${r.fecha||'-'}</td><td><span class="badge badge-${r.estado==='activo'?'success':'info'}">${r.estado}</span></td><td><a href="#/repartos/${r.id}">Ver carga</a></td></tr>`).join('')}</tbody></table></div>`}
      </div>
      <div id="modalReparto" class="card" style="margin-top:1rem;display:none">
        <h3>Nuevo reparto</h3>
        <form id="formReparto">
          <div class="form-group"><label>Nombre</label><input id="repNombre" required /></div>
          <div class="form-group"><label>Vehículo</label><input id="repVehiculo" /></div>
          <div class="form-group"><label>Fecha</label><input type="date" id="repFecha" /></div>
          <p id="repError" class="error-msg" style="display:none"></p>
          <button type="submit" class="btn btn-primary">Crear</button>
        </form>
      </div>`;
    document.getElementById('btnNuevoReparto').onclick = () => { document.getElementById('modalReparto').style.display = 'block'; document.getElementById('repFecha').value = new Date().toISOString().slice(0,10); };
    document.getElementById('formReparto').onsubmit = async (e) => {
      e.preventDefault();
      const errEl = document.getElementById('repError');
      try {
        await api('/repartos', { method: 'POST', body: JSON.stringify({ nombre: document.getElementById('repNombre').value, vehiculo: document.getElementById('repVehiculo').value, fecha: document.getElementById('repFecha').value }) });
        location.hash = '#/repartos'; location.reload();
      } catch (err) { errEl.textContent = err.message; errEl.style.display = 'block'; }
    };
  }

  async function renderRepartoDetalle(id) {
    const r = await api('/repartos/' + id);
    const bultos = (r.pedidos || []).reduce((a,p) => a + (p.detalle || []).reduce((s,d) => s + (d.cantidad||0), 0), 0);
    document.getElementById('main').innerHTML = `
      <a href="#/repartos" style="display:inline-block;margin-bottom:1rem">← Repartos</a>
      <div class="card"><h2>${r.nombre}</h2><p><strong>Vehículo:</strong> ${r.vehiculo||'-'}</p><p><strong>Fecha:</strong> ${r.fecha||'-'}</p><p><strong>Bultos aprox.:</strong> ${bultos}</p></div>
      <div class="card"><h3>Pedidos en este reparto</h3>
        ${!r.pedidos || r.pedidos.length === 0 ? '<p class="empty-state">No hay pedidos.</p>' : `<div class="table-wrap"><table><thead><tr><th>Cliente</th><th>Dirección</th><th>Total</th><th>Detalle</th></tr></thead><tbody>${r.pedidos.map(p => `<tr><td>${p.client_name}</td><td>${p.direccion||'-'}</td><td>$${Number(p.total).toLocaleString('es-AR')}</td><td>${(p.detalle||[]).map(d=>d.descripcion+' x'+d.cantidad).join(', ')}</td></tr>`).join('')}</tbody></table></div>`}
      </div>`;
  }

  async function renderProductos() {
    const products = await api('/products');
    const cols = user.role === 'owner' ? '<th>Código</th><th>Descripción</th><th>Stock</th><th>Costo</th><th>P. venta</th><th>% gan.</th>' : '<th>Código</th><th>Descripción</th><th>Stock</th><th>P. venta</th>';
    const rows = products.map(p => {
      if (user.role === 'owner') return `<tr><td>${p.codigo}</td><td>${p.descripcion}</td><td>${p.stock}</td><td>$${Number(p.precio_costo).toLocaleString('es-AR')}</td><td>$${Number(p.precio_venta).toLocaleString('es-AR')}</td><td>${p.porcentaje_ganancia}%</td></tr>`;
      return `<tr><td>${p.codigo}</td><td>${p.descripcion}</td><td>${p.stock}</td><td>$${Number(p.precio_venta).toLocaleString('es-AR')}</td></tr>`;
    }).join('');
    document.getElementById('main').innerHTML = `<h2>Productos</h2><p class="page-title">${user.role==='owner'?'Costo y ganancia (solo dueño).':'Solo stock y precio de venta.'}</p><div class="card"><div class="table-wrap"><table><thead><tr>${cols}</tr></thead><tbody>${rows}</tbody></table></div></div>`;
  }

  async function renderFactura() {
    const products = await api('/products');
    document.getElementById('main').innerHTML = `
      <h2>Actualizar Stock</h2>
      <p class="page-title">Control del stock en vivo: subí una foto de la factura (celular o PC) y/o cargá los ítems manualmente. El stock se actualiza al instante. <a href="#/dashboard">Ver stock actual en Inicio</a></p>
      <div class="card factura-section">
        <h3 style="margin-top:0">1. Foto de la factura (opcional)</h3>
        <div class="form-group">
          <label class="btn btn-secondary" style="display:inline-block;cursor:pointer;margin-bottom:0.5rem">
            📷 Elegir foto o sacar una
            <input type="file" id="facPhoto" accept="image/*" capture="environment" style="display:none" />
          </label>
          <p style="color:var(--text-muted);font-size:0.85rem;margin:0">En el celular podés tomar la foto directo. En PC elegí un archivo.</p>
        </div>
        <div id="facPhotoPreview" style="display:none;margin-top:0.75rem">
          <img id="facPhotoImg" alt="Vista previa" style="max-width:100%;max-height:280px;border-radius:8px;border:1px solid var(--border)" />
          <button type="button" class="btn btn-secondary" id="facPhotoQuitar" style="margin-top:0.5rem">Quitar foto</button>
        </div>
      </div>
      <div class="card factura-section">
        <h3 style="margin-top:0">2. Datos e ítems (manual)</h3>
        <form id="formFactura">
          <div class="form-row-responsive">
            <div class="form-group"><label>Nº factura</label><input id="facNumero" /></div>
            <div class="form-group"><label>Proveedor</label><input id="facProveedor" /></div>
            <div class="form-group"><label>Fecha</label><input type="date" id="facFecha" /></div>
          </div>
          <h4 style="margin:1rem 0 0.5rem">Ítems (producto, cantidad, precio costo, % ganancia)</h4>
          <div id="facturaItems"></div>
          <button type="button" class="btn btn-secondary" id="btnAddItem">+ Agregar ítem</button>
          <p id="facError" class="error-msg" style="display:none"></p>
          <button type="submit" class="btn btn-primary" style="margin-top:1rem" id="facSubmitBtn">Actualizar stock</button>
        </form>
      </div>`;
    document.getElementById('facFecha').value = new Date().toISOString().slice(0,10);
    var facPhotoFile = null;
    document.getElementById('facPhoto').onchange = function() {
      var f = this.files && this.files[0];
      facPhotoFile = f || null;
      var prev = document.getElementById('facPhotoPreview');
      var img = document.getElementById('facPhotoImg');
      if (f) {
        img.src = URL.createObjectURL(f);
        prev.style.display = 'block';
      } else {
        prev.style.display = 'none';
      }
    };
    document.getElementById('facPhotoQuitar').onclick = function() {
      facPhotoFile = null;
      document.getElementById('facPhoto').value = '';
      document.getElementById('facPhotoPreview').style.display = 'none';
    };
    let itemCount = 0;
    function addItemRow() {
      const id = itemCount++;
      const div = document.createElement('div');
      div.className = 'factura-item-row';
      div.innerHTML = `
        <div class="form-group"><label>Producto</label><select name="product_id" required><option value="">Seleccionar</option>${products.map(p=>`<option value="${p.id}">${p.codigo} - ${p.descripcion}</option>`).join('')}</select></div>
        <div class="form-group"><label>Cant.</label><input type="number" name="cantidad" min="1" value="1" /></div>
        <div class="form-group"><label>P. costo</label><input type="number" step="0.01" name="precio_costo" /></div>
        <div class="form-group"><label>% gan.</label><input type="number" step="0.01" name="porcentaje_ganancia" /></div>
        <button type="button" class="btn btn-secondary" data-remove="${id}">Quitar</button>`;
      document.getElementById('facturaItems').appendChild(div);
      div.querySelector('[data-remove]').onclick = () => div.remove();
    }
    document.getElementById('btnAddItem').onclick = addItemRow;
    addItemRow();
    document.getElementById('formFactura').onsubmit = async (e) => {
      e.preventDefault();
      const errEl = document.getElementById('facError');
      const btn = document.getElementById('facSubmitBtn');
      const items = [];
      document.querySelectorAll('#facturaItems > div').forEach(row => {
        const pid = row.querySelector('[name=product_id]').value;
        const cant = row.querySelector('[name=cantidad]').value;
        const costo = row.querySelector('[name=precio_costo]').value;
        const pct = row.querySelector('[name=porcentaje_ganancia]').value;
        if (pid && cant && (costo || pct)) items.push({ product_id: parseInt(pid,10), cantidad: parseInt(cant,10)||1, precio_costo: parseFloat(costo)||0, porcentaje_ganancia: parseFloat(pct)||0 });
      });
      if (items.length === 0) { errEl.textContent = 'Agregue al menos un ítem.'; errEl.style.display = 'block'; return; }
      errEl.style.display = 'none';
      btn.disabled = true;
      try {
        var imagePath = null;
        if (facPhotoFile) {
          var fd = new FormData();
          fd.append('image', facPhotoFile);
          var up = await api('/facturas/upload-image', { method: 'POST', body: fd });
          imagePath = up.path;
        }
        await api('/facturas', { method: 'POST', body: JSON.stringify({ numero: document.getElementById('facNumero').value, proveedor: document.getElementById('facProveedor').value, fecha: document.getElementById('facFecha').value, image_path: imagePath, items }) });
        alert('Factura cargada. Stock actualizado.');
        document.getElementById('formFactura').reset();
        facPhotoFile = null;
        document.getElementById('facPhoto').value = '';
        document.getElementById('facPhotoPreview').style.display = 'none';
      } catch (err) { errEl.textContent = err.message; errEl.style.display = 'block'; }
      btn.disabled = false;
    };
  }

  async function renderUsuarios() {
    const users = await api('/auth/users');
    document.getElementById('main').innerHTML = `
      <h2>Vendedores</h2>
      <button type="button" class="btn btn-primary" id="btnNuevoUser">+ Nuevo vendedor</button>
      <div id="modalUser" class="card" style="margin-top:1rem;display:none">
        <h3>Nuevo vendedor</h3>
        <form id="formUser">
          <div class="form-group"><label>Nombre</label><input id="uName" required /></div>
          <div class="form-group"><label>Email</label><input type="email" id="uEmail" required /></div>
          <div class="form-group"><label>Contraseña</label><input type="password" id="uPass" required minlength="6" /></div>
          <p id="uError" class="error-msg" style="display:none"></p>
          <button type="submit" class="btn btn-primary">Crear</button>
        </form>
      </div>
      <div class="card" style="margin-top:1rem"><div class="table-wrap"><table><thead><tr><th>Nombre</th><th>Email</th><th>Rol</th></tr></thead><tbody>${users.map(u=>`<tr><td>${u.name}</td><td>${u.email}</td><td><span class="badge badge-${u.role==='owner'?'success':'info'}">${u.role}</span></td></tr>`).join('')}</tbody></table></div></div>`;
    document.getElementById('btnNuevoUser').onclick = () => document.getElementById('modalUser').style.display = 'block';
    document.getElementById('formUser').onsubmit = async (e) => {
      e.preventDefault();
      const errEl = document.getElementById('uError');
      try {
        await api('/auth/users', { method: 'POST', body: JSON.stringify({ name: document.getElementById('uName').value, email: document.getElementById('uEmail').value, password: document.getElementById('uPass').value }) });
        location.hash = '#/usuarios'; location.reload();
      } catch (err) { errEl.textContent = err.message; errEl.style.display = 'block'; }
    };
  }

  async function renderClientes() {
    const q = (location.search && new URLSearchParams(location.search).get('q')) || '';
    const clients = await api('/clients' + (q ? '?q=' + encodeURIComponent(q) : ''));
    document.getElementById('main').innerHTML = `
      <h2>Clientes</h2>
      <div style="margin-bottom:1rem"><input type="search" placeholder="Buscar..." id="clientSearch" value="${q}" style="max-width:300px" /> <a href="#/clientes/nuevo" class="btn btn-primary">+ Nuevo cliente</a></div>
      <p class="page-title">${clients.length} clientes</p>
      <div class="card">${clients.length === 0 ? '<p class="empty-state">No hay clientes.</p>' : '<ul style="list-style:none;padding:0;margin:0">' + clients.map(c => `<li style="border-bottom:1px solid var(--border);padding:0.75rem 0"><a href="#/clientes/${c.id}" style="color:inherit;text-decoration:none"><strong>${c.nombre}</strong>${c.dias_visita ? ' <span style="color:var(--accent)">('+c.dias_visita+')</span>' : ''}<div style="color:var(--text-muted);font-size:0.9rem">📍 ${c.direccion||'-'} ${c.zona ? '- '+c.zona : ''}</div></a></li>`).join('') + '</ul>'}</div>`;
    document.getElementById('clientSearch').onchange = () => { location.search = '?q=' + encodeURIComponent(document.getElementById('clientSearch').value); location.reload(); };
  }

  async function renderClienteDetalle(id) {
    if (id === 'nuevo') {
      document.getElementById('main').innerHTML = `
        <a href="#/clientes" style="display:inline-block;margin-bottom:1rem">← Clientes</a>
        <div class="card"><h2>Nuevo cliente</h2><form id="formCliente"><div class="form-group"><label>Nombre</label><input name="nombre" required /></div><div class="form-group"><label>Teléfono</label><input name="telefono" /></div><div class="form-group"><label>Dirección</label><input name="direccion" /></div><div class="form-group"><label>Zona</label><input name="zona" /></div><div class="form-group"><label>Días visita</label><input name="dias_visita" placeholder="Ej: Mar Vie" /></div><p id="cliError" class="error-msg" style="display:none"></p><button type="submit" class="btn btn-primary">Crear</button></form></div>`;
      document.getElementById('formCliente').onsubmit = async (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const obj = Object.fromEntries([...fd.entries()].filter(([,v])=>v!==''));
        try {
          await api('/clients', { method: 'POST', body: JSON.stringify(obj) });
          navigate('clientes');
        } catch (err) { document.getElementById('cliError').textContent = err.message; document.getElementById('cliError').style.display = 'block'; }
      };
      return;
    }
    const c = await api('/clients/' + id);
    document.getElementById('main').innerHTML = `
      <a href="#/clientes" style="display:inline-block;margin-bottom:1rem">← Clientes</a>
      <div class="card"><h2>${c.nombre}</h2><form id="formCliente"><div class="form-group"><label>Nombre</label><input name="nombre" value="${c.nombre||''}" /></div><div class="form-group"><label>Teléfono</label><input name="telefono" value="${c.telefono||''}" /></div><div class="form-group"><label>Dirección</label><input name="direccion" value="${c.direccion||''}" /></div><div class="form-group"><label>Zona</label><input name="zona" value="${c.zona||''}" /></div><div class="form-group"><label>Días visita</label><input name="dias_visita" value="${c.dias_visita||''}" /></div><p id="cliError" class="error-msg" style="display:none"></p><button type="submit" class="btn btn-primary">Guardar</button></form></div>
      ${(c.ultimas_compras&&c.ultimas_compras.length) ? '<div class="card"><h3>Últimas compras</h3><div class="table-wrap"><table><thead><tr><th>Fecha</th><th>Total</th><th>Estado</th></tr></thead><tbody>'+c.ultimas_compras.map(p=>`<tr><td>${new Date(p.created_at).toLocaleDateString('es-AR')}</td><td>$${Number(p.total).toLocaleString('es-AR')}</td><td><span class="badge badge-info">${p.estado}</span></td></tr>`).join('')+'</tbody></table></div></div>' : ''}`;
    document.getElementById('formCliente').onsubmit = async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const obj = Object.fromEntries([...fd.entries()]);
      try {
        await api('/clients/' + id, { method: 'PATCH', body: JSON.stringify(obj) });
        document.getElementById('cliError').style.display = 'none';
      } catch (err) { document.getElementById('cliError').textContent = err.message; document.getElementById('cliError').style.display = 'block'; }
    };
  }

  async function renderCatalogo() {
    const products = await api('/products');
    document.getElementById('main').innerHTML = `<h2>Productos</h2><p class="page-title">Solo stock y precio de venta.</p><div class="card"><div class="table-wrap"><table><thead><tr><th>Código</th><th>Descripción</th><th>Stock</th><th>P. venta</th></tr></thead><tbody>${products.map(p=>`<tr><td>${p.codigo}</td><td>${p.descripcion}</td><td>${p.stock}</td><td>$${Number(p.precio_venta).toLocaleString('es-AR')}</td></tr>`).join('')}</tbody></table></div></div>`;
  }

  async function renderNuevoPedido() {
    const [clients, products, repartos] = await Promise.all([api('/clients'), api('/products'), api('/repartos')]);
    const activos = repartos.filter(r => r.estado === 'activo');
    let items = [];
    let clientId = '';
    let repartoId = '';
    const main = document.getElementById('main');
    function render() {
      const total = items.reduce((a,i)=>a + i.cantidad * i.precio_venta, 0);
      main.innerHTML = `
        <h2>Nuevo pedido</h2>
        <div class="card"><div class="form-group"><label>Cliente</label><select id="pedClient" required><option value="">Seleccionar</option>${clients.map(c=>`<option value="${c.id}">${c.nombre} - ${c.direccion||'-'}</option>`).join('')}</select></div><div class="form-group"><label>Reparto</label><select id="pedReparto"><option value="">Sin asignar</option>${activos.map(r=>`<option value="${r.id}">${r.nombre} ${r.vehiculo?' - '+r.vehiculo:''}</option>`).join('')}</select></div></div>
        <div class="card"><h3>Productos</h3><p class="page-title">Clic para agregar. Stock y precio venta.</p><div style="display:flex;flex-wrap:wrap;gap:0.5rem;margin-bottom:1rem">${products.filter(p=>p.stock>0).map(p=>`<button type="button" class="btn btn-secondary" data-pid="${p.id}" data-desc="${p.descripcion}" data-pv="${p.precio_venta}" data-stock="${p.stock}">${p.descripcion} (${p.stock}) - $${Number(p.precio_venta).toLocaleString('es-AR')}</button>`).join('')}</div>
        ${items.length ? `<div class="table-wrap"><table><thead><tr><th>Producto</th><th>Cant.</th><th>P. unit.</th><th>Subtotal</th><th></th></tr></thead><tbody>${items.map((i,idx)=>`<tr><td>${i.descripcion}</td><td><button type="button" data-idx="${idx}" data-delta="-1">−</button> <span>${i.cantidad}</span> <button type="button" data-idx="${idx}" data-delta="1">+</button></td><td>$${Number(i.precio_venta).toLocaleString('es-AR')}</td><td>$${(i.cantidad*i.precio_venta).toLocaleString('es-AR')}</td><td><button type="button" class="btn btn-secondary" data-remove="${idx}">Quitar</button></td></tr>`).join('')}</tbody></table><p style="font-weight:700">Total: $${total.toLocaleString('es-AR')}</p></div>` : ''}
        <p id="pedError" class="error-msg" style="display:none"></p>
        <button type="button" class="btn btn-primary" id="btnConfirmarPedido" ${items.length?'' : 'disabled'}>Confirmar pedido</button>
      </div>`;
      main.querySelectorAll('[data-pid]').forEach(btn => {
        btn.onclick = () => {
          const pid = parseInt(btn.dataset.pid,10); const pv = parseFloat(btn.dataset.pv); const desc = btn.dataset.desc; const stock = parseInt(btn.dataset.stock,10);
          const inCart = items.filter(x=>x.product_id===pid).reduce((s,x)=>s+x.cantidad,0);
          if (inCart >= stock) return;
          const existing = items.find(x=>x.product_id===pid);
          if (existing) existing.cantidad++; else items.push({ product_id: pid, cantidad: 1, precio_venta: pv, descripcion: desc });
          render();
        };
      });
      main.querySelectorAll('[data-delta]').forEach(btn => {
        btn.onclick = () => {
          const idx = parseInt(btn.dataset.idx,10); const delta = parseInt(btn.dataset.delta,10);
          items[idx].cantidad += delta;
          if (items[idx].cantidad <= 0) items.splice(idx,1); render();
        };
      });
      main.querySelectorAll('[data-remove]').forEach(btn => { btn.onclick = () => { items.splice(parseInt(btn.dataset.remove,10),1); render(); }; });
      document.getElementById('btnConfirmarPedido').onclick = async () => {
        const errEl = document.getElementById('pedError');
        clientId = document.getElementById('pedClient').value;
        repartoId = document.getElementById('pedReparto').value;
        if (!clientId) { errEl.textContent = 'Seleccione un cliente.'; errEl.style.display = 'block'; return; }
        if (items.length === 0) { errEl.textContent = 'Agregue al menos un producto.'; errEl.style.display = 'block'; return; }
        try {
          await api('/pedidos', { method: 'POST', body: JSON.stringify({ client_id: parseInt(clientId,10), reparto_id: repartoId ? parseInt(repartoId,10) : null, items: items.map(i=>({ product_id: i.product_id, cantidad: i.cantidad })) }) });
          navigate('pedidos');
        } catch (err) { errEl.textContent = err.message; errEl.style.display = 'block'; }
      };
    }
    render();
  }

  async function renderPedidos() {
    const pedidos = await api('/pedidos');
    document.getElementById('main').innerHTML = `
      <h2>Mis pedidos</h2>
      <a href="#/pedido" class="btn btn-primary" style="margin-bottom:1rem">+ Nuevo pedido</a>
      <div class="card">${pedidos.length === 0 ? '<p class="empty-state">No hay pedidos.</p>' : `<div class="table-wrap"><table><thead><tr><th>Fecha</th><th>Cliente</th><th>Total</th><th>Estado</th></tr></thead><tbody>${pedidos.map(p=>`<tr><td>${new Date(p.created_at).toLocaleString('es-AR')}</td><td>${p.client_name}</td><td>$${Number(p.total).toLocaleString('es-AR')}</td><td><span class="badge badge-info">${p.estado}</span></td></tr>`).join('')}</tbody></table></div>`}</div>`;
  }

  async function renderPedidosOwner() {
    const hashQuery = (location.hash || '').split('?')[1] || '';
    const repartoId = hashQuery ? new URLSearchParams(hashQuery).get('reparto') || '' : '';
    const [pedidos, repartos] = await Promise.all([api('/pedidos' + (repartoId ? '?reparto_id=' + repartoId : '')), api('/repartos')]);
    const activos = repartos.filter(r => r.estado === 'activo');
    document.getElementById('main').innerHTML = `
      <h2>Pedidos</h2>
      <p class="page-title">Asigná pedidos a un reparto. Filtrá por reparto si querés.</p>
      <div class="form-group" style="max-width:280px;margin-bottom:1rem">
        <label>Filtrar por reparto</label>
        <select id="pedidosFiltroReparto"><option value="">Todos</option>${repartos.map(r=>`<option value="${r.id}">${r.nombre} ${r.vehiculo?' - '+r.vehiculo:''}</option>`).join('')}</select>
      </div>
      <div class="card" id="pedidosOwnerCard">
        ${pedidos.length === 0 ? '<p class="empty-state">No hay pedidos.</p>' : `<div class="table-wrap"><table><thead><tr><th>Fecha</th><th>Cliente</th><th>Total</th><th>Estado</th><th>Reparto</th></tr></thead><tbody>${pedidos.map(p => {
          const repartoOpts = activos.map(r => `<option value="${r.id}" ${p.reparto_id === r.id ? 'selected' : ''}>${r.nombre}</option>`).join('');
          return `<tr data-pedido-id="${p.id}"><td>${new Date(p.created_at).toLocaleString('es-AR')}</td><td>${p.client_name}</td><td>$${Number(p.total).toLocaleString('es-AR')}</td><td><span class="badge badge-info">${p.estado}</span></td><td><select class="pedido-reparto" data-pedido-id="${p.id}"><option value="">Sin asignar</option>${repartoOpts}</select></td></tr>`;
        }).join('')}</tbody></table></div>`}
      </div>`;
    const filtro = document.getElementById('pedidosFiltroReparto');
    if (filtro) filtro.onchange = () => { location.hash = '#/pedidos' + (filtro.value ? '?reparto=' + filtro.value : ''); location.reload(); };
    if (repartoId && filtro) filtro.value = repartoId;
    document.querySelectorAll('.pedido-reparto').forEach(sel => {
      sel.onchange = async function() {
        const pid = parseInt(this.dataset.pedidoId, 10);
        const rid = this.value ? parseInt(this.value, 10) : null;
        try {
          await api('/pedidos/' + pid + '/reparto', { method: 'PATCH', body: JSON.stringify({ reparto_id: rid }) });
        } catch (err) { alert(err.message); }
      };
    });
  }

  async function renderCaja() {
    const caja = await api('/caja');
    document.getElementById('main').innerHTML = `
      <h2>Caja</h2>
      <p class="page-title">Dinero recaudado por estado de pedidos.</p>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:1rem;margin-bottom:1.5rem">
        <div class="card"><div style="color:var(--text-muted);font-size:0.9rem">Total recaudado</div><div style="font-size:1.5rem;font-weight:700;color:var(--success)">$${Number(caja.total_recaudado).toLocaleString('es-AR')}</div><div style="font-size:0.85rem">(entregados + confirmados)</div></div>
        <div class="card"><div style="color:var(--text-muted);font-size:0.9rem">Entregados</div><div style="font-size:1.25rem;font-weight:700">${caja.cantidad_entregados} pedidos</div><div>$${Number(caja.total_entregados).toLocaleString('es-AR')}</div></div>
        <div class="card"><div style="color:var(--text-muted);font-size:0.9rem">Confirmados</div><div style="font-size:1.25rem;font-weight:700">${caja.cantidad_confirmados} pedidos</div><div>$${Number(caja.total_confirmados).toLocaleString('es-AR')}</div></div>
        <div class="card"><div style="color:var(--text-muted);font-size:0.9rem">Pendientes</div><div style="font-size:1.25rem;font-weight:700">${caja.cantidad_pendientes} pedidos</div><div>$${Number(caja.total_pendientes).toLocaleString('es-AR')}</div></div>
      </div>`;
  }

  async function render(path, id) {
    const main = document.getElementById('main');
    try {
      if (path === 'dashboard') await renderDashboard();
      else if (path === 'repartos') id ? await renderRepartoDetalle(id) : await renderRepartos();
      else if (path === 'productos') await renderProductos();
      else if (path === 'factura' || path === 'stock') await renderFactura();
      else if (path === 'vendedores' || path === 'usuarios') await renderUsuarios();
      else if (path === 'caja') await renderCaja();
      else if (path === 'pedidos') { if (user.role === 'owner') await renderPedidosOwner(); else await renderPedidos(); }
      else if (path === 'clientes') id ? await renderClienteDetalle(id) : await renderClientes();
      else if (path === 'catalogo') await renderCatalogo();
      else if (path === 'pedido') await renderNuevoPedido();
      else if (path === 'pedidos') await renderPedidos();
      else main.innerHTML = '<p class="empty-state">Página no encontrada.</p>';
    } catch (err) {
      main.innerHTML = '<p class="error-msg">' + err.message + '</p>';
    }
  }

  function initApp() {
    const { path, id } = parseHash();
    if (path === 'login' || !getToken()) {
      showLogin();
      return;
    }
    if (!user) {
      loadUser().then(ok => {
        if (!ok) { removeToken(); showLogin(); return; }
        renderHeader(); renderNav(); render(path, id);
      });
      return;
    }
    if (user.role === 'owner' && ['clientes','catalogo','pedido','pedidos'].includes(path)) { navigate('dashboard'); return; }
    if (user.role === 'vendedor' && ['dashboard','repartos','productos','factura','stock','usuarios','vendedores','caja'].includes(path)) { navigate('clientes'); return; }
    renderHeader();
    renderNav();
    render(path, id);
  }

  window.addEventListener('hashchange', () => { const { path, id } = parseHash(); if (path !== 'login' && user) render(path, id); });
  window.addEventListener('load', initApp);
})();
