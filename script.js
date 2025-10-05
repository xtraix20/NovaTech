// === Utilidades básicas ===
function qs(sel, root){ return (root||document).querySelector(sel); }
function qsa(sel, root){ return Array.prototype.slice.call((root||document).querySelectorAll(sel)); }
function getPage(){ return (document.body.getAttribute('data-page') || ''); }

function setActiveNav(){
  var page = getPage();
  var nav = qs('#site-nav');
  if(!nav) return;
  qsa('a', nav).forEach(function(a){
    var isActive = (a.getAttribute('data-nav') === page) ||
                   (a.getAttribute('data-nav') === 'contacto' && location.hash === '#contacto');
    if(isActive) a.classList.add('active'); else a.classList.remove('active');
  });
}

// === API base (meta, global o fallback) ===
function getApiBase(){
  var meta = document.querySelector('meta[name="api-base"]');
  var metaBase = meta && meta.getAttribute('content');
  var winBase = (typeof window !== 'undefined' && window.API_BASE) ? window.API_BASE : '';
  var sameOrigin = (location.protocol !== 'file:') ? '' : '';
  var hard = 'http://localhost:3001';
  return (metaBase || winBase || sameOrigin || hard).replace(/\/$/,'');
}

// === Usuarios (modo local, para fallback) ===
function getUsers(){
  try { return JSON.parse(localStorage.getItem('nv-users') || '[]'); } catch(e){ return []; }
}
function saveUsers(arr){ localStorage.setItem('nv-users', JSON.stringify(arr||[])); }
function setCurrentUser(email){ localStorage.setItem('nv-user', email||''); }
function getCurrentUser(){ return localStorage.getItem('nv-user') || ''; }
function isAdmin(email){ return email === 'admin@novatech.com'; }

// === Órdenes (solo fallback local) ===
function getOrders(){
  try { return JSON.parse(localStorage.getItem('nv-orders') || '[]'); } catch(e){ return []; }
}
function saveOrders(arr){ localStorage.setItem('nv-orders', JSON.stringify(arr||[])); }
function newOrderId(){ return 'ORD-' + Math.random().toString(36).slice(2,8).toUpperCase(); }

// === Compra: exigir login (aunque dashboard sea solo lectura) ===
function ensureLoggedForPurchase(){
  var user = getCurrentUser();
  var logged = localStorage.getItem('nv-auth') === 'ok';
  if(!logged || !user){
    if(confirm('Debes iniciar sesión para comprar. ¿Ir al login ahora?')){ location.href = 'login.html'; }
    return false;
  }
  return true;
}

// === Nav dinámico (Dashboard solo para registrados logueados, no admin) ===
function updateNavForUser(){
  var link = qs('#nav-dashboard');
  if(!link) return;
  var logged = localStorage.getItem('nv-auth') === 'ok';
  var user = getCurrentUser();
  var users = getUsers();
  var isRegistered = false;
  for(var i=0;i<users.length;i++){ if(users[i].email === user){ isRegistered = true; break; } }
  var show = logged && isRegistered && !isAdmin(user);
  if(show) link.classList.remove('hidden'); else link.classList.add('hidden');
}

function updateUserBadge(){
  var badge = qs('#nav-user');
  var logoutBtn = qs('#nav-logout');
  if(!badge || !logoutBtn) return;
  var logged = localStorage.getItem('nv-auth')==='ok';
  var user = getCurrentUser();
  if(logged && user){
    badge.textContent = isAdmin(user) ? 'Administrador' : user;
    badge.classList.remove('hidden');
    logoutBtn.classList.remove('hidden');
  } else {
    badge.classList.add('hidden');
    logoutBtn.classList.add('hidden');
  }
  updateNavForUser();
}

function attachLogout(){
  var btn = qs('#nav-logout');
  if(!btn) return;
  btn.addEventListener('click', function(e){
    e.preventDefault();
    localStorage.removeItem('nv-auth');
    localStorage.removeItem('nv-user');
    localStorage.removeItem('nv-token');
    updateUserBadge();
    updateNavForUser();
    location.href = 'index.html';
  });
}

// === Registro (modo local para demo) ===
function tryLoginDynamic(email, password){
  var users = getUsers();
  for(var i=0;i<users.length;i++){
    if(users[i].email === email && users[i].pass === password) return true;
  }
  return false;
}

function initRegister(){
  if(getPage() !== 'register') return;
  var form = qs('#register-form');
  if(!form) return;

  form.addEventListener('submit', function(e){
    e.preventDefault();

    var name  = (qs('#r-name') || {}).value || '';  name  = name.trim();
    var email = (qs('#r-email')|| {}).value || '';  email = email.trim().toLowerCase();
    var pass  = (qs('#r-pass') || {}).value || '';
    var pass2 = (qs('#r-pass2')|| {}).value || '';

    if(!name || !email || !pass || !pass2){
      alert('Completa todos los campos.');
      return;
    }

    // 🔻 Se eliminó la validación de mínimo 8 caracteres
    // if(pass.length < 8){ alert('La clave debe tener al menos 8 caracteres.'); return; }

    if(pass !== pass2){
      alert('Las claves no coinciden.');
      return;
    }

    var users = getUsers();
    for(var i=0;i<users.length;i++){
      if(users[i].email === email){
        alert('Ya existe una cuenta con ese correo.');
        return;
      }
    }

    users.push({ name: name, email: email, pass: pass });
    saveUsers(users);

    // Autologin + modal de confirmación
    localStorage.setItem('nv-auth','ok');
    setCurrentUser(email);
    updateUserBadge();
    updateNavForUser();
    showRegisterConfirm();
  });
}


// Modal post-registro
function showRegisterConfirm(){
  var modal = qs('#register-confirm');
  if(!modal){ location.href='dashboard.html'; return; }
  modal.classList.add('show');
  var goDash = qs('#btn-go-dashboard', modal);
  if(goDash){ goDash.addEventListener('click', function(e){ e.preventDefault(); location.href='dashboard.html'; }); }
  var stay = qs('#btn-stay', modal);
  if(stay){ stay.addEventListener('click', function(e){ e.preventDefault(); modal.classList.remove('show'); }); }
}

// === Guards de rutas ===
function guardRoute(){
  if(getPage() === 'admin'){
    var ok = localStorage.getItem('nv-auth') === 'ok';
    var user = getCurrentUser();
    if(!ok || !isAdmin(user)){
      alert('Solo el administrador puede acceder.');
      location.href = ok ? 'dashboard.html' : 'login.html';
    }
  }
}

function guardUserRoutes(){
  if(getPage() === 'dashboard'){
    var logged = localStorage.getItem('nv-auth')==='ok';
    var user = getCurrentUser();
    var users = getUsers();
    var isRegistered = false;
    for(var i=0;i<users.length;i++){ if(users[i].email === user){ isRegistered = true; break; } }
    if(!(logged && isRegistered && !isAdmin(user))){
      alert('Debes iniciar sesión con una cuenta registrada.');
      location.href='login.html';
    }
  }
}

// === Login (backend primero; si falla, modo local) ===
function initLogin(){
  var form = qs('#login-form') || qs('form.form');
  if(!form) return;

  var msg = qs('#login-msg');
  function showMsg(text){ if(msg){ msg.textContent = text; msg.style.color = '#b91c1c'; } else { alert(text); } }

  form.addEventListener('submit', function(e){
    e.preventDefault();
    if(msg) msg.textContent='';
    var email = ((qs('input[type="email"]', form)||{}).value || '').trim().toLowerCase();
    var password = ((qs('input[type="password"]', form)||{}).value || '').trim();
    if(!email || !password){ showMsg('Por favor completa todos los campos.'); return; }

    // 1) Intento backend (API en español)
    var base = getApiBase();
    var url = base + '/api/auth/ingreso';

    fetch(url, {
      method:'POST',
      headers: { 'Content-Type':'application/json' },
      body: JSON.stringify({ correo: email, clave: password })
    })
    .then(function(r){
      if(!r.ok){
        return r.json().catch(function(){ return { error: 'HTTP '+r.status }; }).then(function(j){ throw new Error(j.error || ('HTTP '+r.status)); });
      }
      return r.json();
    })
    .then(function(payload){
      try{
        var token = payload && payload.token;
        var usuario = payload && payload.usuario;
        if(!token || !usuario || !usuario.correo){ throw new Error('Respuesta inesperada del servidor.'); }
        localStorage.setItem('nv-token', token);
        localStorage.setItem('nv-auth', 'ok');
        setCurrentUser(String(usuario.correo).toLowerCase());
        updateUserBadge();
        updateNavForUser();
        if(String(usuario.correo).toLowerCase() === 'admin@novatech.com'){ location.href='admin.html'; }
        else { location.href='dashboard.html'; }
      }catch(e){
        fallbackLocal();
      }
    })
    .catch(function(){
      fallbackLocal();
    });

    function fallbackLocal(){
      if(email === 'admin@novatech.com' && password === 'admin123'){
        alert('Inicio de sesión exitoso (modo local).');
        localStorage.setItem('nv-auth','ok');
        setCurrentUser(email);
        updateUserBadge();
        location.href = 'admin.html';
        return;
      }
      if(tryLoginDynamic(email, password)){
        alert('Inicio de sesión exitoso (modo local).');
        localStorage.setItem('nv-auth','ok');
        setCurrentUser(email);
        updateUserBadge();
        location.href = 'dashboard.html';
        return;
      }
      showMsg('Credenciales incorrectas o API inaccesible.');
    }
  });
}

// === Admin (UI local básica; en producción, usar datos del backend) ===
function initAdmin(){
  if(getPage() !== 'admin') return;
  var addUserBtn = qs('#add-user-btn');
  var tableBody = qs('#admin-table tbody');
  if(!addUserBtn || !tableBody) return;

  addUserBtn.addEventListener('click', function(){
    var tr = document.createElement('tr');
    tr.innerHTML = '' +
      '<td>Nuevo Usuario</td>' +
      '<td><input class="input" placeholder="" /></td>' +
      '<td><input class="input" placeholder="" /></td>' +
      '<td><input class="input" placeholder="" /></td>' +
      '<td><div class="actions">' +
        '<span class="icon blue" title="Editar">&#9998;</span>' +
        '<span class="icon red" title="Eliminar">&#9633;</span>' +
      '</div></td>';
    tableBody.appendChild(tr);
  });

  tableBody.addEventListener('click', function(e){
    var t = e.target;
    if(t.classList.contains('red')){
      var row = t.closest('tr');
      if(confirm('¿Deseas eliminar este usuario?')) row.remove();
    } else if(t.classList.contains('blue')){
      alert('Función de edición no implementada aún.');
    }
  });
}

// === Servicios ===
function initServiceDetail(){
  var nameEl = qs('#svc-name');
  var priceEl = qs('#svc-price');
  var qtyEl = qs('#svc-qty');
  var buyBtn = qs('#buy-btn');
  if(!nameEl || !priceEl || !buyBtn) return;

  var params = new URLSearchParams(location.search);
  var name = params.get('name') || 'Servicio';
  var price = Number(params.get('price') || '0');
  nameEl.textContent = name;
  priceEl.textContent = '$' + price;

  buyBtn.addEventListener('click', function(e){
    e.preventDefault();
    if(!ensureLoggedForPurchase()) return;

    // Dashboard del cliente es solo lectura: la orden real debe crearse en el servidor.
    alert('Gracias por tu compra. (El registro real de la orden se realiza en el servidor).');
    location.href = 'dashboard.html';
  });
}

// === Dashboard (solo lectura) ===
function renderDashboard(){
  if(getPage() !== 'dashboard') return;
  var user = getCurrentUser();
  var welcome = qs('#welcome-user');
  if(welcome){ welcome.textContent = user ? ('Bienvenido/a, ' + user) : 'Bienvenido/a'; }

  var activosBody = qs('#tbl-activos tbody');
  var cursoBody   = qs('#tbl-curso tbody');
  var histBody    = qs('#tbl-historico tbody');
  if(activosBody) activosBody.innerHTML = '';
  if(cursoBody)   cursoBody.innerHTML   = '';
  if(histBody)    histBody.innerHTML    = '';

  function fmtDate(iso){ var d = new Date(iso); return isNaN(d) ? '' : d.toLocaleDateString(); }
  function insertRow(tbody, o){
    if(!tbody) return;
    var tr = document.createElement('tr');
    tr.innerHTML = '' +
      '<td>' + (o.servicio || o.service_name || o.name || '') + '</td>' +
      '<td>' + fmtDate(o.creado_en || o.created_at || o.date) + '</td>' +
      '<td>' + (o.cantidad || o.qty || 1) + '</td>' +
      '<td><span class="pill">' + (o.estado || o.status || '') + '</span></td>' +
      '<td>$' + Number(o.total || 0).toFixed(2) + '</td>';
    tbody.appendChild(tr);
  }

  function pintar(data){
    (data || []).forEach(function(o){
      var estado = o.estado || o.status;
      if(estado === 'En curso') insertRow(cursoBody, o);
      if(estado === 'Completado') insertRow(histBody, o);
      if(estado !== 'Completado' && estado !== 'Cancelado') insertRow(activosBody, o);
    });
  }

  var base = getApiBase();
  var url = base + '/api/ordenes?usuario=' + encodeURIComponent(user);

  fetch(url, { headers: { 'Accept': 'application/json' } })
    .then(function(r){ if(!r.ok) throw new Error('HTTP '+r.status); return r.json(); })
    .then(function(json){ pintar(json || []); })
    .catch(function(){
      // Fallback local por cortesía
      try {
        var ls = JSON.parse(localStorage.getItem('nv-orders')||'[]').filter(function(x){ return x.user===user; });
        var adapt = ls.map(function(x){ return {
          servicio: x.name, creado_en: x.date, cantidad: x.qty, estado: x.status, total: x.total
        }; });
        pintar(adapt);
      } catch(e){ /* ignore */ }
    });
}

// === Quitar controles admin si no eres admin (defensa básica) ===
function stripAdminControlsIfNotAdmin(){
  var page = getPage();
  if(page === 'admin') return; // en admin sí se permiten

  qsa('[data-admin-only]').forEach(function(n){ n.remove(); });
  ['add-user-btn','admin-table','admin-panel','admin-actions'].forEach(function(id){
    var el = document.getElementById(id); if(el) el.remove();
  });
  qsa('.actions, .actions .icon, .icon.red, .icon.blue').forEach(function(el){ el.remove(); });

  qsa('button, a').forEach(function(el){
    var txt = (el.textContent || '').trim().toLowerCase();
    if(txt.indexOf('agregar usuario') !== -1 || txt.indexOf('añadir usuario') !== -1 || txt.indexOf('add user') !== -1){
      el.remove();
    }
  });
}

// === Limpieza agresiva por texto + observer (bloquea fugas sin id/clase) ===
function _removeByText(root, patterns){
  var walker = document.createTreeWalker(root || document.body, NodeFilter.SHOW_ELEMENT, null);
  var toRemove = [];
  while(walker.nextNode()){
    var el = walker.currentNode;
    if (!el || el.tagName === 'SCRIPT' || el.tagName === 'STYLE' || el.tagName === 'NOSCRIPT') continue;
    var txt = (el.textContent || '').trim().toLowerCase();
    if(!txt) continue;
    for(var i=0;i<patterns.length;i++){
      if (txt.indexOf(patterns[i]) !== -1){
        var kill = el;
        for (var up = 0; up < 3 && kill && kill.parentElement; up++){
          if (/(button|a|li|div|section|article|td|th)/i.test(kill.tagName)) break;
          kill = kill.parentElement;
        }
        if (kill) toRemove.push(kill);
        break;
      }
    }
  }
  toRemove.forEach(function(n){ try{ n.remove(); }catch(_){} });
  return toRemove.length;
}

function killAddUserEverywhere(){
  var page = getPage();
  if(page === 'admin') return;

  qsa('#add-user-btn, #admin-table, [data-admin-only], .actions, .icon.red, .icon.blue').forEach(function(n){
    try{ n.remove(); }catch(_){}
  });

  var patterns = ['agregar usuario','añadir usuario','add user'];
  _removeByText(document, patterns);

  if (!window.__killAddUserObs){
    window.__killAddUserObs = new MutationObserver(function(muts){
      for (var i=0;i<muts.length;i++){
        var m = muts[i];
        if (m.addedNodes && m.addedNodes.length){
          for (var j=0;j<m.addedNodes.length;j++){
            var node = m.addedNodes[j];
            if (node.nodeType === 1){
              _removeByText(node, patterns);
              qsa('#add-user-btn, #admin-table, [data-admin-only], .actions, .icon.red, .icon.blue', node)
                .forEach(function(n){ try{ n.remove(); }catch(_){ } });
            }
          }
        }
      }
    });
    window.__killAddUserObs.observe(document.documentElement, { childList: true, subtree: true });
  }

  [100, 300, 800, 1500].forEach(function(ms){
    setTimeout(function(){
      _removeByText(document, patterns);
      qsa('#add-user-btn, #admin-table, [data-admin-only], .actions, .icon.red, .icon.blue')
        .forEach(function(n){ try{ n.remove(); }catch(_){ } });
    }, ms);
  });
}

// === Quitar tablas de admin detectadas por encabezados en el dashboard ===
function nukeAdminTablesOnDashboard(){
  if (getPage() !== 'dashboard') return;

  var killWords = ['ingreso de precios','ingreso de artículos','estado de entrega','acciones'];
  document.querySelectorAll('table').forEach(function(tbl){
    var heads = Array.from(tbl.querySelectorAll('thead th, th')).map(function(th){
      return (th.textContent || '').trim().toLowerCase();
    });
    var isAdminTable = killWords.some(function(w){ return heads.some(function(h){ return h.indexOf(w) !== -1; }); });
    if (isAdminTable){
      var host = tbl.closest('.card, article, section, .table-wrap, .content, div') || tbl;
      try { host.remove(); } catch(e) { try { tbl.remove(); } catch(_){} }
    } else {
      var idxAcc = heads.findIndex(function(h){ return h === 'acciones'; });
      if (idxAcc >= 0){
        var thRows = tbl.querySelectorAll('thead tr');
        thRows.forEach(function(tr){
          var cells = tr.children;
          if (cells[idxAcc]) cells[idxAcc].remove();
        });
        var tbRows = tbl.querySelectorAll('tbody tr');
        tbRows.forEach(function(tr){
          var cells = tr.children;
          if (cells[idxAcc]) cells[idxAcc].remove();
        });
      }
    }
  });

  var patterns = ['agregar usuario','añadir usuario','add user'];
  Array.from(document.querySelectorAll('button, a, [role="button"], .btn, input[type="button"]')).forEach(function(el){
    var txt = (el.textContent || el.value || '').trim().toLowerCase();
    if (patterns.some(function(p){ return txt.indexOf(p) !== -1; })) {
      try { el.remove(); } catch(_){}
    }
  });
}

function observeAdminLeaks(){
  if (getPage() !== 'dashboard') return;
  if (window.__obsAdminLeaks) return;
  window.__obsAdminLeaks = new MutationObserver(function(muts){
    var needsSweep = false;
    for (var i=0;i<muts.length;i++){
      if (muts[i].addedNodes && muts[i].addedNodes.length){ needsSweep = true; break; }
    }
    if (needsSweep) nukeAdminTablesOnDashboard();
  });
  window.__obsAdminLeaks.observe(document.documentElement, { childList:true, subtree:true });
}

// === Boot ===
document.addEventListener('DOMContentLoaded', function(){
  setActiveNav();
  guardRoute();
  guardUserRoutes();
  initLogin();
  initAdmin();
  initServiceDetail();
  initRegister();
  updateUserBadge();
  updateNavForUser();
  attachLogout();
  renderDashboard();

  // Limpiezas para mantener el dashboard 100% de solo lectura
  stripAdminControlsIfNotAdmin();
  killAddUserEverywhere();
  nukeAdminTablesOnDashboard();
  observeAdminLeaks();
});

