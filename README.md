# Sistema de Biblioteca

Aplicación web full-stack para gestión de biblioteca con catálogo de libros, control de disponibilidad y préstamos.

## Stack Tecnológico

| Capa      | Tecnología                                           |
|-----------|------------------------------------------------------|
| Backend   | Node.js nativo (sin Express) + PostgreSQL             |
| Frontend  | Angular 18 (standalone components, sin NgModules)     |
| Base de datos | PostgreSQL 16                                    |
| Migraciones | node-pg-migrate                                      |
| Contenedor | Docker Compose                                       |

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

Editar `backend/.env` si es necesario (valores por defecto):

```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=library
DB_USER=admin
DB_PASSWORD=admin123
PORT=3000
```

### 4. Migraciones y datos iniciales

```bash
cd backend
npm run db:setup
```

Esto ejecuta las migraciones y luego inserta los libros de prueba.

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
|--------------------------|-----------------------------------------------|
| `npm start`              | Inicia el servidor en `localhost:3000`        |
| `npm run dev`            | Inicia con recarga automática (`--watch`)     |
| `npm run migrate:up`     | Aplica migraciones pendientes                |
| `npm run migrate:down`   | Revierte la última migración                  |
| `npm run migrate:create` | Crea un nuevo archivo de migración            |
| `npm run seed`           | Inserta datos de prueba en la base de datos   |
| `npm run db:setup`       | Ejecuta migraciones + seed (setup completo)   |

### API Endpoints

| Método   | Ruta            | Descripción                        |
|----------|-----------------|------------------------------------|
| `GET`    | `/books`        | Obtener todos los libros           |
| `GET`    | `/books/:id`    | Obtener un libro por ID            |
| `POST`   | `/books`        | Agregar un nuevo libro             |
| `PUT`    | `/books/:id`    | Actualizar un libro completo       |
| `PATCH`  | `/books/:id`    | Actualizar parcialmente un libro   |
| `DELETE` | `/books/:id`    | Eliminar un libro                  |

#### Ejemplos de uso

```bash
# Obtener todos los libros
curl http://localhost:3000/books

# Agregar un libro
curl -X POST http://localhost:3000/books \
  -H "Content-Type: application/json" \
  -d '{"titulo":"El hobbit","autor":"J.R.R. Tolkien","categoria":"Fantasía","isbn":"978-84-450-1234-5","anio":1937}'

# Cambiar disponibilidad
curl -X PATCH http://localhost:3000/books/1 \
  -H "Content-Type: application/json" \
  -d '{"disponible":false}'
```

#### Formato de respuestas

Todas las respuestas son JSON con la siguiente estructura:

- Éxito: `{ "success": true, "data": { ... } }`
- Error: `{ "success": false, "error": "mensaje" }`

### Modelo de datos (tabla `books`)

| Campo        | Tipo           | Descripción                     |
|--------------|----------------|---------------------------------|
| `id`         | SERIAL (PK)    | Identificador único             |
| `titulo`     | VARCHAR(255)   | Título del libro (obligatorio)  |
| `autor`      | VARCHAR(255)   | Autor (obligatorio)             |
| `categoria`  | VARCHAR(100)   | Género/Categoría (obligatorio)  |
| `isbn`       | VARCHAR(20)    | Código ISBN                     |
| `anio`       | INTEGER        | Año de publicación              |
| `disponible` | BOOLEAN        | Disponibilidad (default: true)  |

---

## Frontend

### Rutas

| Ruta           | Página                              |
|----------------|-------------------------------------|
| `/`            | Dashboard con estadísticas          |
| `/books`       | Catálogo de libros con búsqueda     |
| `/books/add`   | Formulario para agregar libro       |

### Funcionalidades

- Dashboard con estadísticas (total libros, disponibles, prestados)
- Catálogo con tabla de libros y búsqueda por título, autor o género
- Agregar libro con formulario validado (incluye validación de ISBN)
- Botón Prestar/Devolver para cambiar disponibilidad

---

## Detener servicios

```bash
# Detener PostgreSQL (mantiene datos)
docker compose down

# Detener PostgreSQL y borrar datos
docker compose down -v
```

---

## Estructura del proyecto

```
sistemaBiblioteca/
├── backend/
│   ├── src/
│   │   ├── config/db.js               # Pool de conexión a PostgreSQL
│   │   ├── controllers/booksController.js  # Lógica CRUD
│   │   ├── routes/router.js           # Enrutamiento manual
│   │   ├── middleware/cors.js         # Cabeceras CORS
│   │   ├── utils/jsonResponse.js     # Helpers de respuesta JSON
│   │   └── server.js                  # Entry point HTTP
│   ├── migrations/                    # Migraciones SQL (node-pg-migrate)
│   ├── seeds/                         # Datos de prueba
│   ├── scripts/run-seed.js            # Ejecutor de seeds
│   ├── docker-compose.yml             # PostgreSQL en Docker
│   ├── pgmconfig.js                   # Config de migraciones
│   ├── .env                           # Variables de entorno
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── models/book.model.ts   # Interfaz Book
│   │   │   ├── services/book.service.ts  # Servicio HTTP
│   │   │   ├── pages/
│   │   │   │   ├── dashboard/         # Panel de estadísticas
│   │   │   │   ├── book-list/         # Catálogo con tabla
│   │   │   │   └── add-book/          # Formulario de alta
│   │   │   ├── components/
│   │   │   │   ├── book-card/         # Tarjeta de libro
│   │   │   │   └── navbar/            # Barra de navegación
│   │   │   ├── app.component.ts
│   │   │   ├── app.config.ts
│   │   │   └── app.routes.ts
│   │   ├── index.html
│   │   ├── main.ts
│   │   └── styles.css
│   ├── angular.json
│   ├── tsconfig.json
│   └── package.json
└── README.md
```
