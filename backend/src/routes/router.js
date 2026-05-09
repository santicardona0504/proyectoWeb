const booksController = require('../controllers/booksController');
const { error } = require('../utils/jsonResponse');

function parseURL(reqUrl) {
  const url = new URL(reqUrl, 'http://localhost');
  const pathname = url.pathname.replace(/\/+$/, '') || '/';
  return { pathname };
}

function matchRoute(pathname) {
  const match = pathname.match(/^\/books(?:\/(\d+))?$/);
  if (!match) return null;
  return { id: match[1] ? parseInt(match[1], 10) : null };
}

async function router(req, res) {
  const { pathname } = parseURL(req.url);
  const route = matchRoute(pathname);
  const method = req.method;

  if (!route) {
    return error(res, `Ruta ${method} ${pathname} no encontrada`, 404);
  }

  const { id } = route;

  if (pathname === '/books' && !id) {
    switch (method) {
      case 'GET':
        return await booksController.getAll(req, res);
      case 'POST':
        return await booksController.create(req, res);
      default:
        return error(res, `Método ${method} no permitido en /books`, 405);
    }
  }

  if (id) {
    switch (method) {
      case 'GET':
        return await booksController.getById(req, res, id);
      case 'PUT':
        return await booksController.update(req, res, id);
      case 'PATCH':
        return await booksController.patch(req, res, id);
      case 'DELETE':
        return await booksController.remove(req, res, id);
      default:
        return error(res, `Método ${method} no permitido en /books/${id}`, 405);
    }
  }

  return error(res, `Ruta ${method} ${pathname} no encontrada`, 404);
}

module.exports = router;
