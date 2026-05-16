📚 Sistema de Biblioteca

Aplicación web Full-Stack para la gestión de bibliotecas 📖, permitiendo:

✅ Gestión de libros
✅ Control de disponibilidad
✅ Sistema de préstamos
✅ Roles de usuarios
✅ Autenticación segura con JWT

🚀 Tecnologías utilizadas
🔧 Capa	💻 Tecnología
Backend	Node.js + Express 5
Frontend	Angular 18
Base de datos	PostgreSQL 16
Autenticación	JWT + HttpOnly Cookies
Contenedores	Docker Compose
CI/CD	GitHub Actions
Logging	Pino
Testing	Jest + Supertest
📋 Requisitos antes de empezar

Asegúrate de tener instalado:

✅ Docker
✅ Docker Compose
✅ Node.js 18+
✅ npm
✅ Angular CLI

Instalar Angular CLI:

npm install -g @angular/cli
⚡ Instalación paso a paso
🥇 PASO 1 — Clonar el proyecto
git clone https://github.com/tu-usuario/sistema-biblioteca.git

Entrar al proyecto:

cd sistema-biblioteca
🥈 PASO 2 — Instalar dependencias
📦 Backend
cd backend
npm install
🎨 Frontend
cd ../frontend
npm install
🥉 PASO 3 — Levantar PostgreSQL con Docker

Ir nuevamente al backend:

cd ../backend

Ejecutar:

docker compose up -d

✅ Esto iniciará PostgreSQL automáticamente.

🛠️ PASO 4 — Configurar variables de entorno

Editar el archivo:

backend/.env

📌 Los valores por defecto ya funcionan para desarrollo.

🗄️ PASO 5 — Ejecutar migraciones y datos iniciales
npm run db:setup

✅ Este comando:

Ejecuta migraciones
Crea tablas
Inserta datos iniciales
▶️ PASO 6 — Iniciar el Backend
npm start

🌐 Backend disponible en:

http://localhost:3000
🎨 PASO 7 — Iniciar el Frontend

Abrir otra terminal:

cd frontend
ng serve

🌐 Frontend disponible en:

http://localhost:4200
🔐 Sistema de autenticación

El proyecto utiliza:

✅ JWT
✅ Cookies HttpOnly
✅ Refresh Tokens
✅ Seguridad contra XSS

⏳ Tiempo de vida de tokens
Token	Duración
access_token	15 minutos
refresh_token	7 días
📚 Endpoints principales de la API
🔑 Autenticación
Método	Endpoint	Descripción
POST	/auth/register	Registrar usuario
POST	/auth/login	Iniciar sesión
POST	/auth/logout	Cerrar sesión
GET	/auth/me	Obtener usuario actual
📖 Libros
Método	Endpoint	Descripción
GET	/books	Obtener libros
GET	/books/:id	Obtener libro por ID
POST	/books	Crear libro
PUT	/books/:id	Actualizar libro
DELETE	/books/:id	Eliminar libro
📦 Préstamos
Método	Endpoint	Descripción
GET	/loans	Listar préstamos
POST	/loans	Crear préstamo
POST	/loans/return	Devolver libro
🎨 Funcionalidades del Frontend

✅ Dashboard con estadísticas
✅ Catálogo de libros
✅ Búsqueda y paginación
✅ Gestión de préstamos
✅ Roles de usuario
✅ Formularios validados
✅ Notificaciones toast
✅ Manejo global de errores
✅ Confirmaciones de eliminación

👥 Roles del sistema
Rol	Permisos
Admin	Control total
Bibliotecario	Gestión de préstamos
Usuario	Consultar libros
🧪 Ejecutar tests

Ir al backend:

cd backend

Ejecutar:

npm test

✅ Los tests usan PostgreSQL automáticamente.

📂 Estructura del proyecto
sistemaBiblioteca/
├── .github/workflows/ci.yml
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── utils/
│   │   └── server.js
│   ├── migrations/
│   ├── seeds/
│   ├── __tests__/
│   ├── scripts/
│   ├── docker-compose.yml
│   └── package.json
│
├── frontend/
│   ├── src/app/
│   │   ├── components/
│   │   ├── guards/
│   │   ├── models/
│   │   ├── pages/
│   │   └── services/
│   └── package.json
│
└── README.md














# Sistema de Biblioteca

[![CI](https://github.com/tu-usuario/sistema-biblioteca/actions/workflows/ci.yml/badge.svg)](https://github.com/tu-usuario/sistema-biblioteca/actions/workflows/ci.yml)

Aplicación web full-stack para gestión de biblioteca con catálogo de libros, control de disponibilidad y préstamos.

## Stack Tecnológico

| Capa         | Tecnología                                  |
| ------------ | ------------------------------------------- |
| Backend      | Node.js + Express 5                         |
| Frontend     | Angular 18 (standalone components, Signals) |
| Base de datos| PostgreSQL 16                                |
| Autenticación| JWT (HttpOnly cookies + refresh tokens)     |
| Contenedor   | Docker Compose                              |
| CI/CD        | GitHub Actions                              |
| Logging      | Pino                                        |
| Tests        | Jest + Supertest                            |

## Requisitos

- Docker y Docker Compose
- Node.js 18+
- npm
- Angular CLI (`npm install -g @angular/cli`)

---

## Inicio rápido

### 1. Clonar e instalar dependencias

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Levantar PostgreSQL

```bash
cd backend
docker compose up -d
```

### 3. Configurar variables de entorno

Editar `backend/.env` (valores por defecto listos para desarrollo).

### 4. Migraciones y datos iniciales

```bash
cd backend
npm run db:setup
```

### 5. Iniciar servidores

```bash
# Backend (http://localhost:3000)
cd backend
npm start

# Frontend (http://localhost:4200)
cd frontend
ng serve
```

---

## Backend

### Scripts disponibles

| Comando                  | Descripción                                  |
| ------------------------ | -------------------------------------------- |
| `npm start`              | Inicia el servidor en `localhost:3000`       |
| `npm run dev`            | Inicia con recarga automática                |
| `npm test`               | Ejecuta tests de integración                 |
| `npm run migrate:up`     | Aplica migraciones pendientes               |
| `npm run migrate:down`   | Revierte la última migración                 |
| `npm run migrate:create` | Crea un nuevo archivo de migración           |
| `npm run seed`           | Inserta datos de prueba en la base de datos  |
| `npm run db:setup`       | Ejecuta migraciones + seed (setup completo)  |

### API Endpoints

| Método   | Ruta                     | Auth     | Descripción                          |
| -------- | ------------------------ | -------- | ------------------------------------ |
| `POST`   | `/auth/register`         | Pública  | Registrar nuevo usuario              |
| `POST`   | `/auth/login`            | Pública  | Iniciar sesión                       |
| `POST`   | `/auth/refresh`          | Pública  | Refrescar tokens (cookie)            |
| `GET`    | `/auth/me`               | Requerida| Obtener usuario actual               |
| `POST`   | `/auth/logout`           | Pública  | Cerrar sesión                        |
| `GET`    | `/health`                | Pública  | Health check                         |
| `GET`    | `/books`                 | Pública  | Listar libros (paginado, búsqueda)   |
| `GET`    | `/books/stats`           | Pública  | Estadísticas (total, disponibles, prestados) |
| `GET`    | `/books/:id`             | Pública  | Obtener libro por ID                 |
| `POST`   | `/books`                 | Admin    | Crear libro                          |
| `PUT`    | `/books/:id`             | Admin    | Actualizar libro completo            |
| `PATCH`  | `/books/:id`             | Admin    | Actualizar libro parcialmente        |
| `DELETE` | `/books/:id`             | Admin    | Eliminar libro                       |
| `GET`    | `/loans`                 | Requerida| Listar préstamos (paginado)          |
| `GET`    | `/loans/active`          | Requerida| Préstamos activos (paginado)         |
| `GET`    | `/loans/user`            | Requerida| Préstamos por usuario                |
| `POST`   | `/loans`                 | Pública  | Crear préstamo                       |
| `POST`   | `/loans/return`          | Requerida| Devolver libro                       |
| `GET`    | `/users`                 | Admin    | Listar usuarios                      |
| `GET`    | `/users/:id`             | Admin    | Obtener usuario                      |
| `PATCH`  | `/users/:id/role`        | Admin    | Cambiar rol                          |
| `PATCH`  | `/users/:id/reset-password`| Admin  | Resetear contraseña                  |
| `DELETE` | `/users/:id`             | Admin    | Eliminar usuario                     |

### Formato de respuestas

```json
{ "success": true, "data": { ... } }
{ "success": false, "error": "mensaje" }
```

### Autenticación

El sistema usa **JWT con HttpOnly cookies** (no localStorage):

- `access_token`: 15 minutos de vida
- `refresh_token`: 7 días de vida, renovación automática vía middleware
- Las cookies tienen flags `HttpOnly`, `Secure` (en producción) y `SameSite=Lax`

---

## Frontend

### Rutas

| Ruta           | Página                              | Acceso              |
| -------------- | ----------------------------------- | ------------------- |
| `/`            | Dashboard con estadísticas          | Autenticado         |
| `/books`       | Catálogo de libros con búsqueda     | Autenticado         |
| `/books/add`   | Formulario para agregar libro       | Admin               |
| `/loans`       | Gestión de préstamos                | Admin/Bibliotecario |
| `/login`       | Inicio de sesión / registro         | Público             |

### Funcionalidades

- Dashboard con estadísticas (total, disponibles, prestados)
- Catálogo con tabla de libros, búsqueda y paginación
- Agregar libro con formulario validado (ISBN, año, etc.)
- Sistema de préstamos (prestar/devolver con registro)
- Gestión de préstamos activos e historial
- Roles: admin, bibliotecario, usuario
- Notificaciones toast para feedback de acciones
- Manejo global de errores HTTP (401 → refresh → login)
- Confirmación en acciones destructivas

---

## Tests

```bash
cd backend
npm test
```

Los tests de integración requieren una base de datos PostgreSQL configurada via variables de entorno. Por defecto usa `library_test`.

En CI (GitHub Actions), la base de datos se provisiona automáticamente como service container.

---

## Estructura del proyecto

```
sistemaBiblioteca/
├── .github/workflows/ci.yml
├── backend/
│   ├── src/
│   │   ├── config/db.js
│   │   ├── controllers/
│   │   ├── middleware/auth.js
│   │   ├── routes/router.js
│   │   ├── utils/
│   │   └── server.js
│   ├── migrations/
│   ├── seeds/
│   ├── __tests__/
│   ├── scripts/
│   ├── docker-compose.yml
│   └── package.json
├── frontend/
│   ├── src/app/
│   │   ├── components/
│   │   ├── guards/
│   │   ├── models/
│   │   ├── pages/
│   │   └── services/
│   └── package.json
└── README.md
```
