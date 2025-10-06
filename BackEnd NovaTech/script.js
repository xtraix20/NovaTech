// === Utilidades básicas (compatibles) ===
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

// === API base (opcional) ===
function getApiBase(){
  // 1) Meta tag
  var meta = document.querySelector('meta[name="api-base"]');
  var metaBase = meta && meta.getAttribute('content');
  // 2) Global var
  var winBase = (typeof window !== 'undefined' && window.API_BASE) ? window.API_BASE : '';
  // 3) Mismo origen (si no es file://)
  var sameOrigin = (location.protocol !== 'file:') ? '' : '';
  // 4) Fallback local
  var hard = 'http://localhost:3001';
  return (metaBase || winBase || sameOrigin || hard).replace(/\/$/,'');
}

// === Usuarios (modo local) ===
function getUsers(){
  try { return JSON.parse(localStorage.getItem('nv-users') || '[]'); } catch(e){ return []; }
}
function saveUsers(arr){ localStorage.setItem('nv-users', JSON.stringify(arr||[])); }
function setCurrentUser(email){ localStorage.setItem('nv-user', email||''); }
function getCurrentUser(){ return localStorage.getItem('nv-user') || ''; }
function isAdmin(email){ return email === 'admin@novatech.com'; }

// === Órdenes (solo para fallback local) ===
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
