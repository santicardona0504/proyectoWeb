INSERT INTO books (titulo, autor, categoria, isbn, anio, disponible)
VALUES
  ('Cien años de soledad',        'Gabriel García Márquez',  'Realismo mágico',   '978-84-376-0494-7', 1967, true),
  ('Don Quijote de la Mancha',    'Miguel de Cervantes',    'Novela',            '978-84-376-0495-4', 1605, true),
  ('El Principito',               'Antoine de Saint-Exupéry','Infantil',          '978-84-376-0496-1', 1943, true),
  ('1984',                        'George Orwell',           'Ciencia ficción',   '978-84-376-0497-8', 1949, true),
  ('Orgullo y prejuicio',         'Jane Austen',             'Novela romántica',  '978-84-376-0498-5', 1813, true),
  ('El Hobbit',                   'J.R.R. Tolkien',          'Fantasía',          '978-84-376-0499-2', 1937, true)
ON CONFLICT DO NOTHING;
