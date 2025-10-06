const API_BASE = 'http://localhost:3000';

let mode = 'login'; // 'login' | 'register'
const form = document.getElementById('auth-form');
const title = document.getElementById('auth-title');
const submitBtn = document.getElementById('auth-submit');
const toRegister = document.getElementById('to-register');

toRegister.addEventListener('click', (e) => {
  e.preventDefault();
  if (mode === 'login') {
    mode = 'register';
    title.textContent = 'Crear cuenta';
    submitBtn.textContent = 'Registrarme';
    toRegister.textContent = '¿Ya tienes cuenta? Inicia sesión';
  } else {
    mode = 'login';
    title.textContent = 'Iniciar sesión';
    submitBtn.textContent = 'Entrar';
    toRegister.textContent = '¿No tienes cuenta? Crear cuenta';
  }
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;

  if (!email || !password) {
    alert('Completa correo y contraseña');
    return;
  }

  const endpoint = mode === 'register' ? '/api/auth/register' : '/api/auth/login';
  try {
    const res = await fetch(API_BASE + endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error || 'Error');
      return;
    }

    // Guarda token y redirige
    localStorage.setItem('token', data.token);
    localStorage.setItem('userEmail', data.user?.email || email);
    window.location.href = 'admin.html';
  } catch (err) {
    console.error(err);
    alert('No se pudo conectar con el servidor.');
  }
});
