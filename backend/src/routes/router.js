const booksController = require('../controllers/booksController');
const authController = require('../controllers/authController');
const loansController = require('../controllers/loansController');
const { verifyToken, optionalAuth, requireRole } = require('../middleware/auth');
const { error } = require('../utils/jsonResponse');

function parseURL(reqUrl) {
  try {
    const url = new URL(reqUrl, 'http://localhost');
    const pathname = url.pathname.replace(/\/+$/, '') || '/';
    const params = Object.fromEntries(url.searchParams.entries());
    return { pathname, params };
  } catch {
    return { pathname: '/', params: {} };
  }
}

function matchRoute(pathname) {
  const match = pathname.match(/^\/books(?:\/(\d+))?$/);
  if (!match) return null;
  return { id: match[1] ? parseInt(match[1], 10) : null };
}

async function router(req, res) {
  const { pathname, params } = parseURL(req.url);
  const route = matchRoute(pathname);
  const method = req.method;

  // Auth routes (públicas)
  if (pathname === '/auth/register' && method === 'POST') return await authController.register(req, res);
  if (pathname === '/auth/login' && method === 'POST') return await authController.login(req, res);

  // Loans routes (protegidas)
  if (pathname === '/loans' && method === 'GET') return verifyToken(req, res, () => loansController.getAll(req, res));
  if (pathname === '/loans/active' && method === 'GET') return verifyToken(req, res, () => loansController.getActive(req, res));
  if (pathname === '/loans/user' && method === 'GET') return verifyToken(req, res, () => loansController.getByUser(req, res));
  if (pathname === '/loans' && method === 'POST') return optionalAuth(req, res, () => loansController.create(req, res));
  if (pathname === '/loans/return' && method === 'POST') return verifyToken(req, res, () => loansController.returnBook(req, res));

  // Book stats
  if (pathname === '/books/stats' && method === 'GET') {
    return await booksController.getStats(req, res);
  }

  if (!route) {
    return error(res, `Ruta ${method} ${pathname} no encontrada`, 404);
  }

  const { id } = route;

  if (pathname === '/books' && !id) {
    switch (method) {
      case 'GET':
        req.query = params;
        return await booksController.getAll(req, res);
      case 'POST':
        return verifyToken(req, res, () => requireRole('admin')(req, res, () => booksController.create(req, res)));
      default:
        return error(res, `Método ${method} no permitido en /books`, 405);
    }
  }

  if (id) {
    switch (method) {
      case 'GET':
        return await booksController.getById(req, res, id);
      case 'PUT':
        return verifyToken(req, res, () => requireRole('admin')(req, res, () => booksController.update(req, res, id)));
      case 'PATCH':
        return verifyToken(req, res, () => requireRole('admin')(req, res, () => booksController.patch(req, res, id)));
      case 'DELETE':
        return verifyToken(req, res, () => requireRole('admin')(req, res, () => booksController.remove(req, res, id)));
      default:
        return error(res, `Método ${method} no permitido en /books/${id}`, 405);
    }
  }

  return error(res, `Ruta ${method} ${pathname} no encontrada`, 404);
}

module.exports = router;
