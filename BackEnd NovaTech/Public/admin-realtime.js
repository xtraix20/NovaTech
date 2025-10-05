const API_BASE = 'http://localhost:3000';

// Token guardado luego de login/registro
const token = localStorage.getItem('token');
const authHeaders = token ? { 'Authorization': `Bearer ${token}` } : {};

// Conecta Socket.IO
const socket = io(API_BASE, { transports: ['websocket'], extraHeaders: authHeaders });

const tableBody = document.querySelector('table tbody');
const addBtn = document.querySelector('.btn.success');

function rowTemplate(u) {
  return `
    <tr data-id="${u.id}">
      <td><input class="input input-name" value="${u.name ?? ''}"/></td>
      <td><input class="input input-price" type="number" step="0.01" value="${u.price ?? 0}"/></td>
      <td><input class="input input-items" type="number" value="${u.items ?? 0}"/></td>
      <td><input class="input input-status" value="${u.delivery_status ?? ''}"/></td>
      <td>
        <div class="actions">
          <button class="icon blue btn-save" title="Guardar">&#128190;</button>
          <button class="icon red btn-delete" title="Eliminar">&#9633;</button>
        </div>
      </td>
    </tr>`;
}

function upsertRow(u) {
  const existing = tableBody.querySelector(`tr[data-id="${u.id}"]`);
  if (existing) existing.outerHTML = rowTemplate(u);
  else tableBody.insertAdjacentHTML('beforeend', rowTemplate(u));
}

function removeRow(id) {
  const tr = tableBody.querySelector(`tr[data-id="${id}"]`);
  if (tr) tr.remove();
}

async function fetchList() {
  const res = await fetch(`${API_BASE}/api/users`, { headers: { ...authHeaders } });
  if (res.status === 401) {
    alert('Tu sesión expiró. Inicia sesión de nuevo.');
    window.location.href = 'login.html';
    return;
  }
  const list = await res.json();
  tableBody.innerHTML = '';
  list.forEach(upsertRow);
}

// Eventos Socket
socket.on('users:list', (list) => {
  tableBody.innerHTML = '';
  list.forEach(upsertRow);
});
socket.on('users:created', upsertRow);
socket.on('users:updated', upsertRow);
socket.on('users:deleted', ({ id }) => removeRow(id));

// Guardar / Eliminar
document.addEventListener('click', async (e) => {
  const tr = e.target.closest('tr[data-id]');
  if (!tr) return;
  const id = tr.getAttribute('data-id');

  if (e.target.classList.contains('btn-save')) {
    const body = {
      name: tr.querySelector('.input-name').value.trim(),
      price: Number(tr.querySelector('.input-price').value),
      items: Number(tr.querySelector('.input-items').value),
      delivery_status: tr.querySelector('.input-status').value.trim()
    };
    const res = await fetch(`${API_BASE}/api/users/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify(body)
    });
    if (!res.ok) {
      if (res.status === 401) {
        alert('Sesión inválida. Inicia sesión nuevamente.');
        window.location.href = 'login.html';
      } else {
        alert('Error al guardar');
      }
    }
  }

  if (e.target.classList.contains('btn-delete')) {
    if (!confirm('¿Eliminar registro?')) return;
    const res = await fetch(`${API_BASE}/api/users/${id}`, {
      method: 'DELETE',
      headers: { ...authHeaders }
    });
    if (!res.ok) {
      if (res.status === 401) {
        alert('Sesión inválida. Inicia sesión nuevamente.');
        window.location.href = 'login.html';
      } else {
        alert('Error al eliminar');
      }
    }
  }
});

// Crear
if (addBtn) {
  addBtn.addEventListener('click', async () => {
    const name = prompt('Nombre del usuario/cliente:');
    if (!name) return;
    const res = await fetch(`${API_BASE}/api/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify({ name })
    });
    if (!res.ok) {
      if (res.status === 401) {
        alert('Sesión inválida. Inicia sesión nuevamente.');
        window.location.href = 'login.html';
      } else {
        alert('Error al crear');
      }
    }
  });
}

// Carga inicial
fetchList().catch(console.error);
