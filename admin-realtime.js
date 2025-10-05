// URL del backend
const API_BASE = 'http://localhost:3000';

// Carga el cliente socket.io servido por el backend
// (en admin.html incluiremos el <script> del cliente socket.io)
const socket = io(API_BASE, { transports: ['websocket'] });

// Ajusta estos selectores a tu tabla/botón reales
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
  if (existing) {
    existing.outerHTML = rowTemplate(u);
  } else {
    tableBody.insertAdjacentHTML('beforeend', rowTemplate(u));
  }
}

function removeRow(id) {
  const tr = tableBody.querySelector(`tr[data-id="${id}"]`);
  if (tr) tr.remove();
}

async function fetchList() {
  const res = await fetch(`${API_BASE}/api/users`);
  const list = await res.json();
  tableBody.innerHTML = '';
  list.forEach(upsertRow);
}

// Eventos socket
socket.on('users:list', (list) => {
  tableBody.innerHTML = '';
  list.forEach(upsertRow);
});
socket.on('users:created', upsertRow);
socket.on('users:updated', upsertRow);
socket.on('users:deleted', ({ id }) => removeRow(id));

// Guardar / Eliminar (delegación de eventos)
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
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!res.ok) alert('Error al guardar');
  }

  if (e.target.classList.contains('btn-delete')) {
    if (!confirm('¿Eliminar registro?')) return;
    const res = await fetch(`${API_BASE}/api/users/${id}`, { method: 'DELETE' });
    if (!res.ok) alert('Error al eliminar');
  }
});

// Crear
if (addBtn) {
  addBtn.addEventListener('click', async () => {
    const name = prompt('Nombre del usuario/cliente:');
    if (!name) return;
    const res = await fetch(`${API_BASE}/api/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    });
    if (!res.ok) alert('Error al crear');
  });
}

// Carga inicial (por si Socket tarda)
fetchList().catch(console.error);
