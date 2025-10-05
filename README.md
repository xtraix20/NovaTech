NOVATech — Sitio + API (Node + MySQL)

Sitio web estático y API en Node/Express para registro / inicio de sesión y consulta del historial de servicios contratados por usuario.
Frontend y backend pueden ejecutarse en el mismo servicio (recomendado) o separados.

Características

API en español con JWT:

POST /api/auth/registro — crea usuario y devuelve token.

POST /api/auth/ingreso — login y devuelve token.

GET /api/ordenes?usuario=<correo> — histórico solo lectura.

Frontend (HTML/CSS/JS puros):

login, register, dashboard (solo lectura), admin (historial por correo), catálogo de servicios.

Validaciones y flujo de login: API primero → fallback local (demo).

Seguridad:

Hash de contraseñas con bcrypt.

Sesión con JWT (expiración 2h).

Base de datos: MySQL con modelo simple: usuario, servicio, orden (monto en centavos).

Despliegue fácil: servir /public y /api desde la misma app evita CORS.

Nota: por pedido, se quitó la validación mínima de 8 caracteres en el front. 

Stack

Node.js 20+, Express 4

MySQL 8+ (o compatible)

mysql2/promise, bcryptjs, jsonwebtoken

Frontend: HTML5 + CSS + JS (sin framework)

Estructura del proyecto
/ (raíz)
├─ public/                 # Frontend estático (se sirve desde Express)
│  ├─ index.html
│  ├─ services.html
│  ├─ service-detail.html
│  ├─ login.html
│  ├─ register.html
│  ├─ dashboard.html
│  ├─ admin.html
│  ├─ styles.css
│  └─ script.js
├─ server.js               # API Express (solo backend)
├─ db.js                   # Pool mysql2/promise
├─ package.json
├─ .env                    # Variables de entorno (no commitear)
└─ README.md

Requisitos

Node.js 20+

MySQL 8+

npm

Variables de entorno (.env)

Crea un archivo .env en la raíz:

# MySQL
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=tu_usuario
MYSQL_PASSWORD=tu_password
MYSQL_DATABASE=novatech

JWT
JWT_SECRET=una_clave_larga_segura_y_aleatoria

# Servidor
PORT=3001

CORS_ORIGIN=
NODE_ENV=development

Esquema SQL (tablas)

Ejecuta en MySQL (por ejemplo con MySQL Workbench / CLI):

CREATE TABLE IF NOT EXISTS usuario (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(120) NOT NULL,
  correo VARCHAR(190) NOT NULL UNIQUE,
  clave_hash VARCHAR(255) NOT NULL,
  creado_en TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS servicio (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(120) NOT NULL,
  precio_cent INT UNSIGNED NOT NULL,       -- precio en centavos
  activo TINYINT(1) NOT NULL DEFAULT 1,
  creado_en TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS orden (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  usuario_id BIGINT UNSIGNED NOT NULL,
  servicio_id BIGINT UNSIGNED NOT NULL,
  cantidad INT UNSIGNED NOT NULL DEFAULT 1,
  total_cent INT UNSIGNED NOT NULL,
  estado ENUM('En curso','Completado','Cancelado') NOT NULL DEFAULT 'En curso',
  creado_en TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_orden_usuario  FOREIGN KEY (usuario_id)  REFERENCES usuario(id),
  CONSTRAINT fk_orden_servicio FOREIGN KEY (servicio_id) REFERENCES servicio(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


Recomendado: índices en usuario.correo y orden.usuario_id.

Instalación & ejecución
npm install
# Desarrollo (con nodemon si lo agregas)
npm run dev
# o Producción local
npm start


Frontend: http://localhost:3001/

API health: http://localhost:3001/api/health

El servidor ya sirve /public de forma estática. Si hospedas front y API separados, revisa la sección CORS.

Endpoints (API)
POST /api/auth/registro

Crea usuario. Body:

{ "nombre": "Ana", "correo": "ana@correo.com", "clave": "secreta" }


200/201:

{
  "token": "JWT...",
  "usuario": { "id": 1, "nombre": "Ana", "correo": "ana@correo.com", "rol": "usuario" }
}


Errores:

400 campos obligatorios

409 correo ya existente

500 error interno

POST /api/auth/ingreso

Inicia sesión. Body:

{ "correo": "ana@correo.com", "clave": "secreta" }


200:

{
  "token": "JWT...",
  "usuario": { "id": 1, "nombre": "Ana", "correo": "ana@correo.com", "rol": "usuario" }
}


Errores:

400 campos obligatorios

401 credenciales inválidas

500 error interno

GET /api/ordenes?usuario=<correo>

Devuelve el historial de órdenes del usuario (solo lectura).

Ejemplo:
GET /api/ordenes?usuario=ana@correo.com

200:

[
  {
    "id": 12,
    "servicio": "Soporte Premium",
    "cantidad": 1,
    "total": 199.99,
    "estado": "Completado",
    "creado_en": "2025-10-01T12:34:56.000Z"
  }
]


Frontend (páginas)

index.html: Home.

services.html & service-detail.html: catálogo y detalle (con compra simulada; el historial real se consulta desde la DB).

login.html: inputs con id/name; flujo: API → fallback local (admin demo: admin@novatech.com / admin123).

register.html: registro con modal de confirmación (se quitó la validación mínima de 8 caracteres por solicitud).

dashboard.html: solo lectura (Activos / En curso / Histórico).

admin.html: solo lectura; permite consultar el historial por correo.

Todos los HTML incluyen <body data-page="..."> para activar lógicas específicas en script.js.

Despliegue
Opción A — Un solo servicio (recomendada)

Sube el repo a GitHub.

Crea un Web Service en Render/Railway:

Start Command: npm start

Variables de entorno: .env (MySQL, JWT, PORT).

Listo: /public será el sitio y /api/* la API en el mismo dominio (sin CORS).

Opción B — Front y API separados

Front: Netlify/Vercel (sirve la carpeta public/).

API: Render/Railway.

En los HTML, define <meta name="api-base" content="https://tu-api">.

En el backend, configura CORS_ORIGIN=https://tu-front.

Seguridad y buenas prácticas

JWT_SECRET: usa una cadena larga, aleatoria y cámbiala periódicamente.

Montos en centavos (INT) para evitar problemas de coma flotante; convierte a decimal en la respuesta.

Troubleshooting

document is not defined
Hay código de navegador en server.js. Mantén el front en /public y el backend en server.js.

Illegal return statement en script.js
Llaves desbalanceadas o return fuera de función. Usa la versión actual del script.js.

Login “no hace nada”
Revisa:

meta[name="api-base"] si front y API están separados.

/api/health responde {"ok":true}.

Consola del navegador para ver el error.

Botón “Agregar usuario” aparece en el Dashboard
Usa la versión actual de script.js y dashboard.html (limpieza agresiva por texto + CSS defensa). Limpia caché (Ctrl/Cmd + Shift + R).

Roadmap

Proteger /api/ordenes con JWT (leer usuario desde el token).

CRUD de servicios y órdenes para admin (vistas y endpoints).

Filtros por fecha/estado y exportación CSV.

Tests (API + front) y GitHub Actions (CI).

Contribuir

Estilo de commits: Conventional Commits (feat:, fix:, docs:, etc.).

Abrir PR con la plantilla de .github/PULL_REQUEST_TEMPLATE.md.

Actualizar CHANGELOG.md en releases.

Licencia

MIT © NOVATech

Ejemplos rápidos (cURL)
# Registro
curl -X POST http://localhost:3001/api/auth/registro \
  -H 'Content-Type: application/json' \
  -d '{"nombre":"Ana","correo":"ana@correo.com","clave":"secreta"}'

# Login
curl -X POST http://localhost:3001/api/auth/ingreso \
  -H 'Content-Type: application/json' \
  -d '{"correo":"ana@correo.com","clave":"secreta"}'

# Historial (solo lectura)
curl "http://localhost:3001/api/ordenes?usuario=ana@correo.com"
