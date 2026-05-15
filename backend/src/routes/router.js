const { Router } = require('express');
const booksController = require('../controllers/booksController');
const authController = require('../controllers/authController');
const loansController = require('../controllers/loansController');
const usersController = require('../controllers/usersController');
const { verifyToken, optionalAuth, requireRole } = require('../middleware/auth');

const router = Router();

// Auth routes
router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);
router.post('/auth/refresh', authController.refresh);
router.get('/auth/me', verifyToken, authController.me);
router.post('/auth/logout', authController.logout);

// Users routes (admin only)
router.get('/users', verifyToken, requireRole('admin'), usersController.getAll);
router.get('/users/:id', verifyToken, requireRole('admin'), usersController.getById);
router.patch('/users/:id/role', verifyToken, requireRole('admin'), usersController.updateRole);
router.patch('/users/:id/reset-password', verifyToken, requireRole('admin'), usersController.resetPassword);
router.delete('/users/:id', verifyToken, requireRole('admin'), usersController.remove);

// Loans routes
router.get('/loans', verifyToken, loansController.getAll);
router.get('/loans/active', verifyToken, loansController.getActive);
router.get('/loans/user', verifyToken, loansController.getByUser);
router.post('/loans', optionalAuth, loansController.create);
router.post('/loans/return', verifyToken, loansController.returnBook);

// Books routes
router.get('/books/stats', booksController.getStats);
router.get('/books', booksController.getAll);
router.get('/books/:id', booksController.getById);
router.post('/books', verifyToken, requireRole('admin'), booksController.create);
router.put('/books/:id', verifyToken, requireRole('admin'), booksController.update);
router.patch('/books/:id', verifyToken, requireRole('admin'), booksController.patch);
router.delete('/books/:id', verifyToken, requireRole('admin'), booksController.remove);

module.exports = router;
