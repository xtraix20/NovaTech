// Estamos Desarrollando el codigo aun.
// Funciones para login.html

document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.querySelector('.form');
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = loginForm.querySelector('input[type="email"]').value.trim();
      const password = loginForm.querySelector('input[type="password"]').value.trim();

      if (!email || !password) {
        alert('Por favor completa todos los campos.');
        return;
      }

      // Simulación de autenticación
      if (email === 'admin@novatech.com' && password === 'admin123') {
        alert('Inicio de sesión exitoso.');
        window.location.href = 'admin.html';
      } else {
        alert('Credenciales incorrectas.');
      }
    });
  }
});


// Funciones para admin.html

document.addEventListener('DOMContentLoaded', () => {
  const addUserBtn = document.querySelector('.btn.success');
  const tableBody = document.querySelector('table tbody');

  if (addUserBtn && tableBody) {
    addUserBtn.addEventListener('click', () => {
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
        </td>
      `;
      tableBody.appendChild(newRow);
    });

    tableBody.addEventListener('click', (e) => {
      if (e.target.classList.contains('red')) {
        const row = e.target.closest('tr');
        if (confirm('¿Deseas eliminar este usuario?')) {
          row.remove();
        }
      }

      if (e.target.classList.contains('blue')) {
        alert('Función de edición no implementada aún.');
      }
    });
  }
});


// Funciones para services.html

document.addEventListener('DOMContentLoaded', () => {
  const serviceCards = document.querySelectorAll('.card .btn');
  if (serviceCards.length > 0) {
    serviceCards.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        window.location.href = 'service-detail.html';
      });
    });
  }
});


// Funciones para service-detail.html

document.addEventListener('DOMContentLoaded', () => {
  const buyBtn = document.querySelector('.btn.brand[href="#"]');
  if (buyBtn) {
    buyBtn.addEventListener('click', () => {
      alert('Gracias por tu compra. Pronto recibirás confirmación por correo.');
    });
  }
});