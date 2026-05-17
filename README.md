# Sistema de Biblioteca

[![CI](https://github.com/tu-usuario/sistema-biblioteca/actions/workflows/ci.yml/badge.svg)](https://github.com/tu-usuario/sistema-biblioteca/actions/workflows/ci.yml)

Aplicación web full-stack para la gestión de bibliotecas, permitiendo:

Gestión de libros
Control de disponibilidad
Sistema de préstamos
Roles de usuarios
Autenticación segura con JWT
Tecnologías utilizadas
Capa	Tecnología
Backend	Node.js + Express 5
Frontend	Angular 18
Base de datos	PostgreSQL 16
Autenticación	JWT + HttpOnly Cookies
Contenedores	Docker Compose
CI/CD	GitHub Actions
Logging	Pino
Testing	Jest + Supertest
Requisitos
Docker
Docker Compose
Node.js 18+
npm
Angular CLI

Instalar Angular CLI:

npm install -g @angular/cli
Instalación
1. Clonar el proyecto
git clone https://github.com/tu-usuario/sistema-biblioteca.git
cd sistema-biblioteca
2. Instalar dependencias
Backend
cd backend
npm install
Frontend
cd ../frontend
npm install
Configuración
3. Levantar PostgreSQL
cd ../backend
docker compose up -d
4. Variables de entorno

Editar:

backend/.env

Los valores por defecto funcionan para desarrollo.

5. Migraciones y datos iniciales
npm run db:setup

Este comando:

Ejecuta migraciones
Crea tablas
Inserta datos iniciales
Ejecución
Backend
cd backend
npm start

Disponible en:

http://localhost:3000
Frontend
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
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── utils/
│   │   └── server.js
│   ├── migrations/
│   ├── seeds/
│   ├── tests/
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