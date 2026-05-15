const swaggerUi = require('swagger-ui-express');
const logger = require('../utils/logger');

const openapiSpec = {
  openapi: '3.0.0',
  info: {
    title: 'Sistema de Biblioteca API',
    version: '1.0.0',
    description: 'API REST para gestión de biblioteca con autenticación JWT, préstamos y catálogo de libros.',
  },
  servers: [
    { url: 'http://localhost:3000', description: 'Desarrollo' },
  ],
  paths: {
    '/health': {
      get: {
        summary: 'Health check',
        tags: ['Health'],
        responses: { 200: { description: 'Servidor funcionando', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } } } },
      },
    },
    '/auth/register': {
      post: {
        summary: 'Registrar nuevo usuario',
        tags: ['Auth'],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { nombre: { type: 'string' }, email: { type: 'string', format: 'email' }, password: { type: 'string', minLength: 6 } }, required: ['nombre', 'email', 'password'] } } } },
        responses: {
          201: { description: 'Usuario creado', content: { 'application/json': { schema: { $ref: '#/components/schemas/UserResponse' } } } },
          400: { description: 'Datos inválidos' },
          409: { description: 'Email ya registrado' },
        },
      },
    },
    '/auth/login': {
      post: {
        summary: 'Iniciar sesión',
        tags: ['Auth'],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { email: { type: 'string' }, password: { type: 'string' } }, required: ['email', 'password'] } } } },
        responses: {
          200: { description: 'Login exitoso, setea cookies HttpOnly', content: { 'application/json': { schema: { $ref: '#/components/schemas/UserResponse' } } } },
          401: { description: 'Credenciales inválidas' },
        },
      },
    },
    '/auth/refresh': {
      post: {
        summary: 'Refrescar token JWT',
        tags: ['Auth'],
        responses: {
          200: { description: 'Token renovado' },
          401: { description: 'Refresh token inválido o expirado' },
        },
      },
    },
    '/auth/me': {
      get: {
        summary: 'Obtener usuario actual',
        tags: ['Auth'],
        security: [{ cookieAuth: [] }],
        responses: {
          200: { description: 'Datos del usuario', content: { 'application/json': { schema: { $ref: '#/components/schemas/UserResponse' } } } },
          401: { description: 'No autenticado' },
        },
      },
    },
    '/auth/logout': {
      post: {
        summary: 'Cerrar sesión',
        tags: ['Auth'],
        responses: { 200: { description: 'Cookies eliminadas' } },
      },
    },
    '/books': {
      get: {
        summary: 'Listar libros (con búsqueda y paginación)',
        tags: ['Books'],
        parameters: [
          { name: 'search', in: 'query', schema: { type: 'string' }, description: 'Buscar por título o autor' },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
        ],
        responses: { 200: { description: 'Lista de libros paginada', content: { 'application/json': { schema: { $ref: '#/components/schemas/BooksResponse' } } } } },
      },
      post: {
        summary: 'Crear libro (admin)',
        tags: ['Books'],
        security: [{ cookieAuth: [] }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/BookInput' } } } },
        responses: {
          201: { description: 'Libro creado' },
          400: { description: 'Datos inválidos' },
          401: { description: 'No autenticado' },
          403: { description: 'No autorizado (rol)' },
          409: { description: 'ISBN duplicado' },
        },
      },
    },
    '/books/stats': {
      get: {
        summary: 'Estadísticas de libros',
        tags: ['Books'],
        responses: { 200: { description: 'Total, disponibles, prestados' } },
      },
    },
    '/books/{id}': {
      get: {
        summary: 'Obtener libro por ID',
        tags: ['Books'],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { 200: { description: 'Libro encontrado' }, 404: { description: 'No encontrado' } },
      },
      put: {
        summary: 'Reemplazar libro completo (admin)',
        tags: ['Books'],
        security: [{ cookieAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/BookInput' } } } },
        responses: { 200: { description: 'Libro actualizado' }, 404: { description: 'No encontrado' } },
      },
      patch: {
        summary: 'Actualizar parcialmente libro (admin)',
        tags: ['Books'],
        security: [{ cookieAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { titulo: { type: 'string' }, autor: { type: 'string' }, categoria: { type: 'string' }, isbn: { type: 'string' }, anio: { type: 'integer' }, disponible: { type: 'boolean' } } } } } },
        responses: { 200: { description: 'Libro actualizado' }, 404: { description: 'No encontrado' } },
      },
      delete: {
        summary: 'Eliminar libro (admin)',
        tags: ['Books'],
        security: [{ cookieAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { 200: { description: 'Libro eliminado' }, 404: { description: 'No encontrado' } },
      },
    },
    '/loans': {
      get: {
        summary: 'Listar todos los préstamos',
        tags: ['Loans'],
        security: [{ cookieAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
        ],
        responses: { 200: { description: 'Lista de préstamos paginada' } },
      },
      post: {
        summary: 'Crear préstamo',
        tags: ['Loans'],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { book_id: { type: 'integer' }, nombre_usuario: { type: 'string' } }, required: ['book_id', 'nombre_usuario'] } } } },
        responses: {
          201: { description: 'Préstamo creado' },
          400: { description: 'Datos inválidos' },
          404: { description: 'Libro no encontrado' },
          409: { description: 'Libro ya prestado' },
        },
      },
    },
    '/loans/active': {
      get: {
        summary: 'Listar préstamos activos',
        tags: ['Loans'],
        security: [{ cookieAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
        ],
        responses: { 200: { description: 'Préstamos activos paginados' } },
      },
    },
    '/loans/user': {
      get: {
        summary: 'Buscar préstamos por nombre de usuario',
        tags: ['Loans'],
        security: [{ cookieAuth: [] }],
        parameters: [{ name: 'nombre', in: 'query', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Préstamos del usuario' }, 400: { description: 'Falta nombre' } },
      },
    },
    '/loans/return': {
      post: {
        summary: 'Devolver libro',
        tags: ['Loans'],
        security: [{ cookieAuth: [] }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { id: { type: 'integer' } }, required: ['id'] } } } },
        responses: { 200: { description: 'Libro devuelto' }, 404: { description: 'Préstamo no encontrado o ya devuelto' } },
      },
    },
    '/users': {
      get: {
        summary: 'Listar usuarios (admin)',
        tags: ['Users'],
        security: [{ cookieAuth: [] }],
        responses: { 200: { description: 'Lista de usuarios' }, 403: { description: 'No autorizado' } },
      },
    },
    '/users/{id}': {
      get: {
        summary: 'Obtener usuario por ID (admin)',
        tags: ['Users'],
        security: [{ cookieAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { 200: { description: 'Usuario encontrado' }, 404: { description: 'No encontrado' } },
      },
      delete: {
        summary: 'Eliminar usuario (admin)',
        tags: ['Users'],
        security: [{ cookieAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { 200: { description: 'Usuario eliminado' }, 404: { description: 'No encontrado' } },
      },
    },
    '/users/{id}/role': {
      patch: {
        summary: 'Cambiar rol de usuario (admin)',
        tags: ['Users'],
        security: [{ cookieAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { rol: { type: 'string', enum: ['admin', 'bibliotecario', 'usuario'] } }, required: ['rol'] } } } },
        responses: { 200: { description: 'Rol actualizado' }, 400: { description: 'Rol inválido' } },
      },
    },
    '/users/{id}/reset-password': {
      patch: {
        summary: 'Resetear contraseña de usuario (admin)',
        tags: ['Users'],
        security: [{ cookieAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { password: { type: 'string', minLength: 6 } }, required: ['password'] } } } },
        responses: { 200: { description: 'Contraseña actualizada' }, 400: { description: 'Contraseña muy corta' } },
      },
    },
  },
  components: {
    securitySchemes: {
      cookieAuth: { type: 'apiKey', in: 'cookie', name: 'token' },
    },
    schemas: {
      SuccessResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: { type: 'object' },
        },
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: { type: 'string' },
        },
      },
      UserResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          data: {
            type: 'object',
            properties: {
              user: {
                type: 'object',
                properties: {
                  id: { type: 'integer' },
                  nombre: { type: 'string' },
                  email: { type: 'string' },
                  rol: { type: 'string', enum: ['admin', 'bibliotecario', 'usuario'] },
                },
              },
            },
          },
        },
      },
      BookInput: {
        type: 'object',
        properties: {
          titulo: { type: 'string' },
          autor: { type: 'string' },
          categoria: { type: 'string' },
          isbn: { type: 'string' },
          anio: { type: 'integer', minimum: 1000, maximum: 2100 },
          disponible: { type: 'boolean' },
        },
        required: ['titulo', 'autor', 'categoria'],
      },
      BooksResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          data: {
            type: 'object',
            properties: {
              books: { type: 'array', items: { $ref: '#/components/schemas/Book' } },
              pagination: {
                type: 'object',
                properties: {
                  total: { type: 'integer' },
                  page: { type: 'integer' },
                  limit: { type: 'integer' },
                  totalPages: { type: 'integer' },
                },
              },
            },
          },
        },
      },
      Book: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          titulo: { type: 'string' },
          autor: { type: 'string' },
          categoria: { type: 'string' },
          isbn: { type: 'string' },
          anio: { type: 'integer' },
          disponible: { type: 'boolean' },
          created_at: { type: 'string', format: 'date-time' },
        },
      },
    },
  },
};

function setupSwagger(app) {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openapiSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Biblioteca API Docs',
  }));
  logger.info('Swagger UI montado en /api-docs');
}

module.exports = setupSwagger;
