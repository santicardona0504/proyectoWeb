# Sistema de Biblioteca

Backend en Node.js (sin Express) con PostgreSQL en Docker + Frontend Angular.

## Requisitos

- Docker y Docker Compose
- Node.js 18+
- npm
- Angular CLI (`npm install -g @angular/cli`)

---

## Backend

### 1. Levantar PostgreSQL con Docker

```bash
docker compose up -d
```

Esto inicia PostgreSQL 16 en el puerto `5432`.

Verificar que el contenedor esté corriendo:

```bash
docker ps
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

Editar `.env` si es necesario (valores por defecto):

```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=library
DB_USER=admin
DB_PASSWORD=admin123
PORT=3000
```

### 4. Iniciar el servidor

```bash
npm start
```

O con recarga automática en cambios:

```bash
npm run dev
```

El servidor arranca en `http://localhost:3000`.

### 5. Ejecutar migraciones

Las migraciones se manejan con [node-pg-migrate](https://github.com/salsita/node-pg-migrate).  
Cada archivo en `migrations/` contiene las secciones `-- Up` (aplicar) y `-- Down` (revertir).

```bash
# Aplicar todas las migraciones pendientes
npm run migrate:up

# Deshacer la última migración
npm run migrate:down

# Crear una nueva migración (genera el archivo .sql en migrations/)
npm run migrate:create -- --name add-prestamos-table
```

### 6. Poblar la base de datos con datos de prueba (seed)

```bash
npm run seed
```

### 7. Setup completo (migraciones + seed)

```bash
npm run db:setup
```

---

## Frontend (Angular)

### 1. Ir a la carpeta del frontend

```bash
cd ../frontend
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Iniciar el servidor de desarrollo

```bash
ng serve
```

El frontend arranca en `http://localhost:4200`.

### 4. Rutas del frontend

| Ruta           | Descripción                    |
|----------------|--------------------------------|
| `/`            | Dashboard con estadísticas     |
| `/books`       | Catálogo de libros             |
| `/books/add`   | Formulario para agregar libro  |

### 5. Adaptación del frontend

El frontend ya existente usa campos en inglés (`title`, `author`, `genre`, `available`, `year`). Para que funcione con esta API (campos en español: `titulo`, `autor`, `categoria`, `disponible`, `año`), se deben modificar los siguientes archivos:

| Archivo                        | Cambio necesario                                     |
|--------------------------------|------------------------------------------------------|
| `src/app/models/book.model.ts` | Renombrar `title` → `titulo`, `author` → `autor`, `genre` → `categoria`, `available` → `disponible`, `year` → `año`. Conservar `id` e `isbn`. |
| `src/app/services/book.service.ts` | En `toggleAvailability`, cambiar `{ available }` por `{ disponible }` |
| `src/app/pages/book-list/book-list.component.ts` | `book.title` → `book.titulo`, `book.author` → `book.autor`, `book.genre` → `book.categoria`, `book.available` → `book.disponible` |
| `src/app/pages/add-book/add-book.component.ts` | Cambiar referencias del modelo y form de `title`/`author`/`genre`/`year` a `titulo`/`autor`/`categoria`/`año` |
| `src/app/pages/dashboard/dashboard.component.ts` | `book.available` → `book.disponible` |
| `src/app/components/book-card/book-card.component.ts` | `book.title` → `book.titulo`, `book.author` → `book.autor`, etc. |

---

## Endpoints de la API

### `GET /books`

Obtener todos los libros.

```bash
curl http://localhost:3000/books
```

Respuesta exitosa:

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "titulo": "Cien años de soledad",
      "autor": "Gabriel García Márquez",
      "categoria": "Realismo mágico",
      "isbn": "978-84-376-0494-7",
       "anio": 1967,
      "disponible": true
    }
  ]
}
```

### `GET /books/:id`

Obtener un libro por ID.

```bash
curl http://localhost:3000/books/1
```

Respuesta exitosa:

```json
{
  "success": true,
  "data": {
    "id": 1,
    "titulo": "Cien años de soledad",
    "autor": "Gabriel García Márquez",
    "categoria": "Realismo mágico",
    "isbn": "978-84-376-0494-7",
    "año": 1967,
    "disponible": true
  }
}
```

### `POST /books`

Agregar un nuevo libro.

```bash
curl -X POST http://localhost:3000/books \
  -H "Content-Type: application/json" \
  -d '{
    "titulo": "El hobbit",
    "autor": "J.R.R. Tolkien",
    "categoria": "Fantasía",
    "isbn": "978-84-450-1234-5",
    "año": 1937,
    "disponible": true
  }'
```

Respuesta exitosa (201):

```json
{
  "success": true,
  "data": {
    "id": 7,
    "titulo": "El hobbit",
    "autor": "J.R.R. Tolkien",
    "categoria": "Fantasía",
    "isbn": "978-84-450-1234-5",
    "año": 1937,
    "disponible": true
  }
}
```

### `PUT /books/:id`

Actualizar un libro completo.

```bash
curl -X PUT http://localhost:3000/books/7 \
  -H "Content-Type: application/json" \
  -d '{
    "titulo": "El Hobbit (edición revisada)",
    "autor": "J.R.R. Tolkien",
    "categoria": "Fantasía",
    "isbn": "978-84-450-1234-5",
    "año": 1937,
    "disponible": false
  }'
```

### `PATCH /books/:id`

Actualizar parcialmente un libro (ej: cambiar disponibilidad).

```bash
curl -X PATCH http://localhost:3000/books/1 \
  -H "Content-Type: application/json" \
  -d '{ "disponible": false }'
```

### `DELETE /books/:id`

Eliminar un libro.

```bash
curl -X DELETE http://localhost:3000/books/7
```

Respuesta exitosa:

```json
{
  "success": true,
  "data": {
    "mensaje": "Libro \"El Hobbit (edición revisada)\" eliminado correctamente"
  }
}
```

### Errores

Los errores siempre responden en JSON con `success: false`:

```json
// 404 - No encontrado
{ "success": false, "error": "Libro con id 999 no encontrado" }

// 400 - Datos inválidos
{ "success": false, "error": "Los campos titulo, autor y categoria son obligatorios" }

// 405 - Método no permitido
{ "success": false, "error": "Método PUT no permitido en /books" }
```

---

## Detener servicios

```bash
# Detener PostgreSQL
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
│   │   ├── config/
│   │   │   └── db.js                  # Pool de conexión a PostgreSQL
│   │   ├── controllers/
│   │   │   └── booksController.js      # Lógica CRUD de libros
│   │   ├── routes/
│   │   │   └── router.js              # Enrutamiento manual (sin Express)
│   │   ├── middleware/
│   │   │   └── cors.js                # Cabeceras CORS
│   │   ├── utils/
│   │   │   └── jsonResponse.js        # Helper para respuestas JSON
│   │   └── server.js                  # Entry point HTTP
│   ├── migrations/
│   │   └── 1734567890_create-books-table.sql  # Migración: crear tabla books (up + down)
│   ├── seeds/
│   │   └── 001_books.sql                       # Seed: libros iniciales
│   ├── scripts/
│   │   └── run-seed.js                         # Ejecutor de seeds desde Node.js
│   ├── sql/                                    # Legacy: scripts SQL directos
│   │   ├── 001_create_books.sql
│   │   └── 002_seed_books.sql
│   ├── pgmconfig.js                   # Configuración de node-pg-migrate
│   ├── docker-compose.yml             # PostgreSQL en Docker
│   ├── .env                           # Variables de entorno
│   ├── package.json
│   └── README.md
├── frontend/
│   └── src/app/
│       ├── models/book.model.ts
│       ├── services/book.service.ts
│       ├── pages/
│       │   ├── dashboard/
│       │   ├── book-list/
│       │   └── add-book/
│       └── components/
│           ├── book-card/
│           └── navbar/
└── README.md
```
