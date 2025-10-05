\
// Utilidades
function qs(sel, root=document){ return root.querySelector(sel); }
function qsa(sel, root=document){ return Array.from(root.querySelectorAll(sel)); }
function getPage(){ return document.body.dataset.page || ''; }
function setActiveNav(){
  const page = getPage();
  const nav = qs('#site-nav');
  if(!nav) return;
  qsa('a', nav).forEach(a => {
    a.classList.toggle('active', a.dataset.nav === page || (a.dataset.nav==='contacto' && location.hash==='#contacto'));
  });
}

// Login
function initLogin(){
  const form = qs('#login-form');
  if(!form) return;
  form.addEventListener('submit', (e)=>{
    e.preventDefault();
    const email = qs('input[type="email"]', form).value.trim();
    const password = qs('input[type="password"]', form).value.trim();
    if(!email || !password){ alert('Por favor completa todos los campos.'); return; }
    if((email === 'admin@novatech.com' && password === 'admin123') || tryLoginDynamic(email, password)){
      alert('Inicio de sesión exitoso.');
      localStorage.setItem('nv-auth','ok');
      setCurrentUser(email);
      location.href = (email==='admin@novatech.com') ? 'admin.html' : 'dashboard.html';
    } else {
      alert('Credenciales incorrectas.');
    }
  });
}

// Admin
function guardRoute(){
  if(getPage() === 'admin'){
    const ok = localStorage.getItem('nv-auth') === 'ok';
    if(!ok){ alert('Debes iniciar sesión.'); location.href='login.html'; }
  }
}

function initAdmin(){
  if(getPage() !== 'admin') return;
  const addUserBtn = qs('#add-user-btn');
  const tableBody = qs('#admin-table tbody');
  if(!addUserBtn || !tableBody) return;

  addUserBtn.addEventListener('click', ()=>{
    const newRow = document.createElement('tr');
    newRow.innerHTML = `
      <td>Nuevo Usuario</td>
      <td><input class="input" placeholder="" /></td>
      <td><input class="input" placeholder="" /></td>
      <td><input class="input" placeholder="" /></td>
      <td>
        <div class="actions">
          <span class="icon blue" title="Editar">&#9998;</span>
          <span class="icon red" title="Eliminar">&#9633;</span>
        </div>
      </td>`;
    tableBody.appendChild(newRow);
  });

  tableBody.addEventListener('click', (e)=>{
    if(e.target.classList.contains('red')){
      const row = e.target.closest('tr');
      if(confirm('¿Deseas eliminar este usuario?')) row.remove();
    }
    if(e.target.classList.contains('blue')){
      alert('Función de edición no implementada aún.');
    }
  });
}

// Servicios
function initServiceCards(){
  if(getPage() !== 'services') return;
  // Ya usamos hrefs con querystring, pero evitamos navegación vacía
  qsa('.card .btn').forEach(btn => {
    btn.addEventListener('click', (e)=>{
      // Permite el link nativo
    });
  });
}

function initServiceDetail(){
  if(getPage() !== 'services') return;
  const nameEl = qs('#svc-name'); const priceEl = qs('#svc-price');
  const qtyEl = qs('#svc-qty'); const buyBtn = qs('#buy-btn');
  if(!nameEl || !priceEl || !buyBtn) return;
  const params = new URLSearchParams(location.search);
  const name = params.get('name') || 'Servicio';
  const price = Number(params.get('price') || '0');
  nameEl.textContent = name;
  priceEl.textContent = `$${price}`;

  buyBtn.addEventListener('click', (e)=>{
    e.preventDefault();
    const qty = Math.max(1, parseInt(qtyEl.value || '1',10));
    alert(`Gracias por tu compra de ${qty} × ${name} por $${(price*qty).toFixed(2)}. Pronto recibirás confirmación por correo.`);
  });
}


// ---------- Usuarios & Órdenes ----------
function setCurrentUser(email){ localStorage.setItem('nv-user', email); }
function getCurrentUser(){ return localStorage.getItem('nv-user') || ''; }

function getOrders(){
  try { return JSON.parse(localStorage.getItem('nv-orders') || '[]'); } catch(e){ return []; }
}
function saveOrders(orders){ localStorage.setItem('nv-orders', JSON.stringify(orders)); }
function newOrderId(){ return 'ORD-' + Math.random().toString(36).slice(2,8).toUpperCase(); }

function ensureLoggedForPurchase(){
  const user = getCurrentUser();
  if(!user){
    if(confirm('Debes iniciar sesión para comprar. ¿Ir al login ahora?')){
      location.href = 'login.html';
    }
    return false;
  }
  return true;
}

// Guardas extendidas: protege dashboard para usuarios logueados (cualquier usuario)
function guardUserRoutes(){
  const page = getPage();
  if(page === 'dashboard'){
    const ok = localStorage.getItem('nv-auth') === 'ok';
    if(!ok){ alert('Debes iniciar sesión.'); location.href='login.html'; }
  }
}


document.addEventListener('DOMContentLoaded', ()=>{
  setActiveNav();
  guardRoute();
  guardUserRoutes();
  initLogin();
  initAdmin();
  initServiceCards();
  initServiceDetail();
  initRegister();
});

// Registro
function getUsers(){
  try { return JSON.parse(localStorage.getItem('nv-users') || '[]'); } catch(e){ return []; }
}
function saveUsers(users){ localStorage.setItem('nv-users', JSON.stringify(users)); }

function initRegister(){
  if(getPage() !== 'register') return;
  const form = qs('#register-form');
  if(!form) return;

  form.addEventListener('submit', (e)=>{
    e.preventDefault();
    const name = qs('#r-name').value.trim();
    const email = qs('#r-email').value.trim().toLowerCase();
    const pass = qs('#r-pass').value;
    const pass2 = qs('#r-pass2').value;

    if(!name || !email || !pass || !pass2){
      alert('Completa todos los campos.'); return;
    }
    if(pass.length < 8){
      alert('El password debe tener al menos 8 caracteres.'); return;
    }
    if(pass !== pass2){
      alert('Los passwords no coinciden.'); return;
    }

    const users = getUsers();
    if(users.some(u => u.email === email)){
      alert('Ya existe una cuenta con ese email.'); return;
    }
    users.push({ name, email, pass });
    saveUsers(users);
    showRegisterConfirm();
  });
}

// Extender login para aceptar usuarios registrados
function tryLoginDynamic(email, password){
  const users = getUsers();
  const found = users.find(u => u.email === email && u.pass === password);
  return !!found;
}


// Modal de confirmación post-registro
function showRegisterConfirm(){
  const modal = qs('#register-confirm');
  if(!modal) { alert('Cuenta creada con éxito.'); return; }
  modal.classList.add('show');
  qs('#btn-go-login', modal)?.addEventListener('click', (e)=>{
    e.preventDefault();
    location.href = 'login.html';
  });
  qs('#btn-stay', modal)?.addEventListener('click', (e)=>{
    e.preventDefault();
    modal.classList.remove('show');
  });
}

// ---------- Dashboard ----------
function renderDashboard(){
  if(getPage() !== 'dashboard') return;
  const user = getCurrentUser();
  const welcome = qs('#welcome-user');
  if(welcome){ welcome.textContent = user ? `Bienvenido/a, ${user}` : 'Bienvenido/a'; }

  const orders = getOrders().filter(o => o.user === user);

  const activosBody = qs('#tbl-activos tbody');
  const cursoBody = qs('#tbl-curso tbody');
  const histBody = qs('#tbl-historico tbody');
  [activosBody, cursoBody, histBody].forEach(t=> t && (t.innerHTML=''));

  const fmtDate = (iso)=> new Date(iso).toLocaleDateString();
  const mkRow = (o, idx) => {
    return `<tr data-id="${o.id}">
      <td>${o.name}</td>
      <td>${fmtDate(o.date)}</td>
      <td>${o.qty}</td>
      <td><span class="pill">${o.status}</span></td>
      <td>$${o.total.toFixed(2)}</td>
      <td class="actions">
        <button class="btn" data-action="reorder">Reordenar</button>
        ${o.status!=='Completado' ? '<button class="btn muted" data-action="mark">Marcar completado</button>' : ''}
        ${o.status!=='Cancelado' ? '<button class="btn muted" data-action="cancel">Cancelar</button>' : ''}
      </td>
    </tr>`;
  };

  orders.forEach(o=>{
    const row = mkRow(o);
    if(o.status === 'En curso') cursoBody.insertAdjacentHTML('beforeend', row);
    if(o.status === 'Completado') histBody.insertAdjacentHTML('beforeend', row);
    if(o.status !== 'Completado' && o.status !== 'Cancelado') activosBody.insertAdjacentHTML('beforeend', row);
  });

  // Actions: reorder, mark complete, cancel
  const tables = [activosBody, cursoBody, histBody];
  tables.forEach(tbody => {
    if(!tbody) return;
    tbody.addEventListener('click', (e)=>{
      const btn = e.target.closest('button[data-action]');
      if(!btn) return;
      const tr = e.target.closest('tr');
      const id = tr?.dataset?.id;
      if(!id) return;
      let list = getOrders();
      const idx = list.findIndex(x => x.id === id);
      if(idx < 0) return;
      const item = list[idx];
      const action = btn.dataset.action;

      if(action === 'reorder'){
        const copy = { ...item, id: newOrderId(), date: new Date().toISOString(), status: 'En curso' };
        list.push(copy);
        saveOrders(list);
        alert('Pedido creado nuevamente.');
      }
      if(action === 'mark'){
        list[idx].status = 'Completado';
        saveOrders(list);
      }
      if(action === 'cancel'){
        list[idx].status = 'Cancelado';
        saveOrders(list);
      }
      renderDashboard();
    });
  });
}

document.addEventListener('DOMContentLoaded', ()=>{
  renderDashboard();
});
