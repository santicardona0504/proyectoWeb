export interface Loan {
  id: number;
  book_id: number;
  usuario_id: number | null;
  nombre_usuario: string;
  fecha_prestamo: string;
  fecha_devolucion: string | null;
  estado: 'activo' | 'devuelto';
  libro_titulo?: string;
}
