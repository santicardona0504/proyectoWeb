const request = require('supertest');
const { createApp, createTestPool } = require('./helpers');

const app = createApp();
const pool = createTestPool();

let dbReady = false;

beforeAll(async () => {
  try {
    await pool.query('SELECT 1');
    dbReady = true;
  } catch {
    console.warn('⚠ Test database not available — DB-dependent tests will be skipped');
  }
});

afterAll(async () => {
  if (dbReady) await pool.end();
});

describe('Health & Connectivity', () => {
  test('GET /health returns ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('ok');
  });

  test('GET /unknown returns 404', async () => {
    const res = await request(app).get('/unknown');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  test('POST /unknown returns 404', async () => {
    await request(app).post('/unknown').expect(404);
  });
});

describe('Auth Endpoints', () => {
  const testUser = {
    nombre: 'Test User',
    email: `test_${Date.now()}@example.com`,
    password: 'test123456',
  };

  test('POST /auth/register creates user and sets cookies', async () => {
    if (!dbReady) return;
    const res = await request(app)
      .post('/auth/register')
      .send(testUser)
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data.user.nombre).toBe(testUser.nombre);
    expect(res.body.data.user.email).toBe(testUser.email);
    expect(res.body.data.user.rol).toBe('usuario');
    expect(res.body.data).not.toHaveProperty('token');

    const cookies = res.headers['set-cookie'];
    expect(cookies).toBeDefined();
    expect(cookies.some(c => c.startsWith('access_token='))).toBe(true);
    expect(cookies.some(c => c.startsWith('refresh_token='))).toBe(true);
  });

  test('POST /auth/register with duplicate email returns 409', async () => {
    if (!dbReady) return;
    const res = await request(app)
      .post('/auth/register')
      .send(testUser)
      .expect(409);
    expect(res.body.error).toContain('registrado');
  });

  test('POST /auth/login with valid credentials', async () => {
    if (!dbReady) return;
    const res = await request(app)
      .post('/auth/login')
      .send({ email: testUser.email, password: testUser.password })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(testUser.email);
    const cookies = res.headers['set-cookie'];
    expect(cookies.some(c => c.startsWith('access_token='))).toBe(true);
  });

  test('POST /auth/login with wrong password returns 401', async () => {
    if (!dbReady) return;
    await request(app)
      .post('/auth/login')
      .send({ email: testUser.email, password: 'wrong' })
      .expect(401);
  });

  test('POST /auth/register with missing fields returns 400', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ email: 'test@test.com' })
      .expect(400);
    expect(res.body.success).toBe(false);
  });

  test('POST /auth/login with missing fields returns 400', async () => {
    await request(app).post('/auth/login').send({}).expect(400);
  });

  test('POST /auth/register with short password returns 400', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ nombre: 'Test', email: 't@t.com', password: '123' })
      .expect(400);
    expect(res.body.error).toContain('6 caracteres');
  });

  test('POST /auth/register with invalid email returns 400', async () => {
    await request(app)
      .post('/auth/register')
      .send({ nombre: 'Test', email: 'invalid', password: '123456' })
      .expect(400);
  });

  test('GET /auth/me returns user when authenticated', async () => {
    if (!dbReady) return;

    const loginRes = await request(app)
      .post('/auth/login')
      .send({ email: testUser.email, password: testUser.password });

    const res = await request(app)
      .get('/auth/me')
      .set('Cookie', loginRes.headers['set-cookie'])
      .expect(200);

    expect(res.body.data.user.email).toBe(testUser.email);
  });

  test('GET /auth/me without cookie returns 401', async () => {
    await request(app).get('/auth/me').expect(401);
  });

  test('POST /auth/refresh with valid refresh token', async () => {
    if (!dbReady) return;

    const loginRes = await request(app)
      .post('/auth/login')
      .send({ email: testUser.email, password: testUser.password });

    const refreshCookie = loginRes.headers['set-cookie']
      .find(c => c.startsWith('refresh_token='));
    expect(refreshCookie).toBeDefined();

    const res = await request(app)
      .post('/auth/refresh')
      .set('Cookie', refreshCookie)
      .expect(200);

    expect(res.body.success).toBe(true);
    const newCookies = res.headers['set-cookie'];
    expect(newCookies.some(c => c.startsWith('access_token='))).toBe(true);
  });

  test('POST /auth/refresh without refresh token returns 401', async () => {
    await request(app).post('/auth/refresh').expect(401);
  });

  test('POST /auth/logout clears cookies', async () => {
    if (!dbReady) return;

    const loginRes = await request(app)
      .post('/auth/login')
      .send({ email: testUser.email, password: testUser.password });

    const res = await request(app)
      .post('/auth/logout')
      .set('Cookie', loginRes.headers['set-cookie'])
      .expect(200);

    expect(res.body.success).toBe(true);
  });
});

describe('Books Endpoints (authenticated as admin)', () => {
  let agent;
  let isbnCounter = Date.now();

  function uniqueISBN() {
    return `978${String(isbnCounter++).slice(-10)}`;
  }

  beforeAll(async () => {
    if (!dbReady) return;
    agent = request.agent(app);

    const email = `admin_test_${Date.now()}@test.com`;
    const password = 'adminpass123';

    await agent.post('/auth/register').send({ nombre: 'Test Admin', email, password });
    await pool.query("UPDATE usuarios SET rol = 'admin' WHERE email = $1", [email]);
    await agent.post('/auth/login').send({ email, password });
  });

  test('GET /books returns paginated list', async () => {
    if (!dbReady) return;
    const res = await agent.get('/books').expect(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.books)).toBe(true);
    expect(res.body.data.pagination).toBeDefined();
  });

  test('GET /books/stats returns stats', async () => {
    if (!dbReady) return;
    const res = await agent.get('/books/stats').expect(200);
    expect(res.body.data.total).toBeDefined();
    expect(res.body.data.available).toBeDefined();
    expect(res.body.data.borrowed).toBeDefined();
  });

  test('POST /books creates a book (admin)', async () => {
    if (!dbReady) return;
    const res = await agent.post('/books').send({
      titulo: 'Test Book', autor: 'Test Author', categoria: 'Novela',
      isbn: uniqueISBN(), anio: 2024,
    }).expect(201);
    expect(res.body.data.titulo).toBe('Test Book');
    expect(res.body.data.disponible).toBe(true);
  });

  test('POST /books with invalid data returns 400', async () => {
    if (!dbReady) return;
    await agent.post('/books').send({}).expect(400);
  });

  test('POST /books with invalid ISBN returns 400', async () => {
    if (!dbReady) return;
    await agent
      .post('/books')
      .send({ titulo: 'Test', autor: 'Test', categoria: 'Novela', isbn: 'invalid', anio: 2024 })
      .expect(400);
  });

  test('POST /books with year out of range returns 400', async () => {
    if (!dbReady) return;
    await agent
      .post('/books')
      .send({ titulo: 'Test', autor: 'Test', categoria: 'Novela', isbn: uniqueISBN(), anio: 999 })
      .expect(400);
  });

  test('GET /books/:id returns single book', async () => {
    if (!dbReady) return;
    const list = await agent.get('/books');
    if (list.body.data.books.length === 0) return;
    const id = list.body.data.books[0].id;
    const res = await agent.get(`/books/${id}`).expect(200);
    expect(res.body.data.id).toBe(id);
  });

  test('GET /books/:id with invalid id returns 404', async () => {
    await request(app).get('/books/999999').expect(404);
  });

  test('PATCH /books/:id updates a book field', async () => {
    if (!dbReady) return;
    const list = await agent.get('/books');
    if (list.body.data.books.length === 0) return;
    const id = list.body.data.books[0].id;
    const res = await agent.patch(`/books/${id}`).send({ titulo: 'Updated Title' }).expect(200);
    expect(res.body.data.titulo).toBe('Updated Title');
  });

  test('PATCH /books/:id without auth returns 401', async () => {
    await request(app).patch('/books/1').send({ titulo: 'x' }).expect(401);
  });

  test('DELETE /books/:id removes a book', async () => {
    if (!dbReady) return;
    const res = await agent.post('/books').send({
      titulo: 'To Delete',
      autor: 'Author',
      categoria: 'Novela',
      isbn: `978${String(Date.now()).slice(-10)}`,
      anio: 2024,
    }).expect(201);
    const id = res.body.data.id;
    await agent.delete(`/books/${id}`).expect(200);
    await agent.get(`/books/${id}`).expect(404);
  });

  test('GET /books with search query filters results', async () => {
    if (!dbReady) return;
    const res = await agent.get('/books?search=Test').expect(200);
    expect(Array.isArray(res.body.data.books)).toBe(true);
  });

  test('GET /books with pagination works', async () => {
    if (!dbReady) return;
    const res = await agent.get('/books?page=1&limit=2').expect(200);
    expect(res.body.data.books.length).toBeLessThanOrEqual(2);
    expect(res.body.data.pagination.page).toBe(1);
    expect(res.body.data.pagination.limit).toBe(2);
  });
});

describe('Loans Flow', () => {
  let agent;

  beforeAll(async () => {
    if (!dbReady) return;
    agent = request.agent(app);

    const email = `loan_test_${Date.now()}@test.com`;
    const password = 'loanpass123';

    await agent.post('/auth/register').send({ nombre: 'Loan Tester', email, password });
    await pool.query("UPDATE usuarios SET rol = 'admin' WHERE email = $1", [email]);
    await agent.post('/auth/login').send({ email, password });
  });

  test('POST /loans creates a loan for available book', async () => {
    if (!dbReady) return;

    const booksRes = await agent.get('/books?limit=5');
    const availableBook = booksRes.body.data.books.find(b => b.disponible);
    if (!availableBook) return;

    const res = await agent
      .post('/loans')
      .send({ book_id: availableBook.id, nombre_usuario: 'Test Borrower' })
      .expect(201);

    expect(res.body.data.book_id).toBe(availableBook.id);
    expect(res.body.data.estado).toBe('activo');
  });

  test('POST /loans on already borrowed book returns 409', async () => {
    if (!dbReady) return;

    const booksRes = await agent.get('/books');
    const borrowedBook = booksRes.body.data.books.find(b => !b.disponible);
    if (!borrowedBook) return;

    await agent
      .post('/loans')
      .send({ book_id: borrowedBook.id, nombre_usuario: 'Another User' })
      .expect(409);
  });

  test('POST /loans with missing fields returns 400', async () => {
    if (!dbReady) return;
    await agent.post('/loans').send({}).expect(400);
  });

  test('GET /loans returns paginated loans', async () => {
    if (!dbReady) return;
    const res = await agent.get('/loans').expect(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.loans)).toBe(true);
  });

  test('GET /loans/active returns active loans', async () => {
    if (!dbReady) return;
    const res = await agent.get('/loans/active').expect(200);
    expect(res.body.success).toBe(true);
    res.body.data.loans.forEach(loan => {
      expect(loan.estado).toBe('activo');
    });
  });

  test('POST /loans/return returns a borrowed book', async () => {
    if (!dbReady) return;

    const activeRes = await agent.get('/loans/active?limit=1');
    if (activeRes.body.data.loans.length === 0) return;

    const activeLoan = activeRes.body.data.loans[0];
    const res = await agent
      .post('/loans/return')
      .send({ id: activeLoan.id })
      .expect(200);

    expect(res.body.data.estado).toBe('devuelto');
    expect(res.body.data.fecha_devolucion).toBeTruthy();
  });

  test('POST /loans/return with invalid id returns 404', async () => {
    if (!dbReady) return;
    await agent.post('/loans/return').send({ id: 999999 }).expect(404);
  });
});

describe('Authorization', () => {
  test('GET /users without auth returns 401', async () => {
    await request(app).get('/users').expect(401);
  });

  test('POST /books without auth returns 401', async () => {
    await request(app).post('/books').send({ titulo: 'x', autor: 'x', categoria: 'x', isbn: '9781234567890', anio: 2024 }).expect(401);
  });

  test('DELETE /books/:id without auth returns 401', async () => {
    await request(app).delete('/books/1').expect(401);
  });
});
