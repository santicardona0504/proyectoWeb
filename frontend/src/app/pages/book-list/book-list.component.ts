import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { BookService } from '../../services/book.service';
import { Book } from '../../models/book.model';

@Component({
  selector: 'app-book-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="book-list-page">
      <div class="page-header">
        <div>
          <h1 class="page-title">Catálogo de Libros</h1>
          <p class="page-subtitle">{{ total }} libros en la biblioteca</p>
        </div>
        <a routerLink="/books/add" class="btn btn-primary">+ Agregar Libro</a>
      </div>

      <div class="search-bar">
        <input
          type="text"
          [(ngModel)]="searchTerm"
          (keyup.enter)="filterBooks()"
          placeholder="Buscar por título, autor o género..."
          class="search-input"
        />
        <button class="btn btn-primary btn-search" (click)="filterBooks()">Buscar</button>
      </div>

      <div class="error-banner" *ngIf="errorMsg">{{ errorMsg }}</div>
      <div class="loading" *ngIf="loading">Cargando libros...</div>

      <div class="table-container" *ngIf="!loading">
        <table class="books-table">
          <thead>
            <tr>
              <th>Título</th>
              <th>Autor</th>
              <th>Género</th>
              <th>Año</th>
              <th>ISBN</th>
              <th>Estado</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let book of books">
              <td class="cell-title">{{ book.titulo }}</td>
              <td>{{ book.autor }}</td>
              <td><span class="genre-tag">{{ book.categoria }}</span></td>
              <td>{{ book.anio }}</td>
              <td class="cell-isbn">{{ book.isbn }}</td>
              <td>
                <span class="status-badge" [class.available]="book.disponible" [class.borrowed]="!book.disponible">
                  {{ book.disponible ? 'Disponible' : 'Prestado' }}
                </span>
              </td>
              <td>
                <button
                  class="btn btn-sm"
                  [class.btn-success]="book.disponible"
                  [class.btn-warning]="!book.disponible"
                  (click)="toggleBook(book)"
                >
                  {{ book.disponible ? 'Prestar' : 'Devolver' }}
                </button>
              </td>
            </tr>
            <tr *ngIf="books.length === 0">
              <td colspan="7" class="empty-msg">No se encontraron libros.</td>
            </tr>
          </tbody>
        </table>

        <div class="pagination" *ngIf="totalPages > 1">
          <button class="btn btn-sm" [disabled]="page <= 1" (click)="goToPage(page - 1)">Anterior</button>
          <span class="page-info">Página {{ page }} de {{ totalPages }}</span>
          <button class="btn btn-sm" [disabled]="page >= totalPages" (click)="goToPage(page + 1)">Siguiente</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .book-list-page { max-width: 1200px; margin: 0 auto; }
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1.5rem;
      flex-wrap: wrap;
      gap: 1rem;
    }
    .page-title { margin: 0; font-size: 1.8rem; color: var(--text); }
    .page-subtitle { color: var(--text-light); margin: .3rem 0 0; }
    .search-bar { margin-bottom: 1.5rem; }
    .search-input {
      width: 100%;
      max-width: 480px;
      padding: .75rem 1rem;
      border: 2px solid var(--border);
      border-radius: 10px;
      font-size: .95rem;
      transition: border .2s;
      background: var(--card-bg);
      color: var(--text);
    }
    .search-input:focus {
      outline: none;
      border-color: var(--primary);
      box-shadow: 0 0 0 3px rgba(67,97,238,.15);
    }
    .loading { text-align: center; padding: 3rem; color: var(--text-light); }
    .table-container {
      background: var(--card-bg);
      border-radius: 12px;
      box-shadow: var(--shadow);
      border: 1px solid var(--border);
      overflow-x: auto;
    }
    .books-table {
      width: 100%;
      border-collapse: collapse;
      min-width: 650px;
    }
    .books-table th {
      text-align: left;
      padding: 1rem 1.25rem;
      font-size: .8rem;
      text-transform: uppercase;
      letter-spacing: .05em;
      color: var(--text-light);
      border-bottom: 2px solid var(--border);
      background: var(--bg);
    }
    .books-table td {
      padding: 1rem 1.25rem;
      border-bottom: 1px solid var(--border);
      color: var(--text);
      font-size: .9rem;
    }
    .books-table tr:last-child td { border-bottom: none; }
    .books-table tr:hover td { background: rgba(67,97,238,.03); }
    .cell-title { font-weight: 600; }
    .cell-isbn { font-family: monospace; font-size: .82rem; color: var(--text-light); }
    .genre-tag {
      background: var(--primary-light);
      color: var(--primary);
      padding: 2px 10px;
      border-radius: 20px;
      font-size: .8rem;
      font-weight: 500;
    }
    .status-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: .8rem;
      font-weight: 600;
    }
    .status-badge.available { background: #d4edda; color: #155724; }
    .status-badge.borrowed { background: #f8d7da; color: #721c24; }
    .empty-msg { text-align: center; color: var(--text-light); padding: 3rem !important; }
    .btn-sm { padding: .4rem .9rem; font-size: .82rem; }
    .error-banner { background: #f8d7da; color: #721c24; padding: .75rem 1rem; border-radius: 8px; margin-bottom: 1rem; }
    .pagination {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 1rem;
      padding: 1rem;
      border-top: 1px solid var(--border);
    }
    .page-info { font-size: .9rem; color: var(--text-light); }
    .btn-search { margin-top: .5rem; }
    .search-bar { display: flex; gap: .5rem; align-items: flex-start; flex-wrap: wrap; }
  `]
})
export class BookListComponent implements OnInit {
  books: Book[] = [];
  searchTerm = '';
  loading = true;
  errorMsg = '';
  page = 1;
  limit = 20;
  totalPages = 1;
  total = 0;

  constructor(private bookService: BookService) {}

  ngOnInit() {
    this.loadBooks();
  }

  loadBooks() {
    this.loading = true;
    this.errorMsg = '';
    this.bookService.getBooks(this.searchTerm, this.page, this.limit).subscribe({
      next: (res) => {
        this.books = res.books;
        this.total = res.pagination.total;
        this.totalPages = res.pagination.totalPages;
        this.page = res.pagination.page;
        this.loading = false;
      },
      error: () => {
        this.errorMsg = 'Error al cargar libros';
        this.loading = false;
      }
    });
  }

  filterBooks() {
    this.page = 1;
    this.loadBooks();
  }

  goToPage(p: number) {
    if (p < 1 || p > this.totalPages) return;
    this.page = p;
    this.loadBooks();
  }

  toggleBook(book: Book) {
    this.bookService.toggleAvailability(book.id, !book.disponible).subscribe({
      next: (updated) => {
        const idx = this.books.findIndex(b => b.id === updated.id);
        if (idx !== -1) this.books[idx] = updated;
      },
      error: () => { this.errorMsg = 'Error al cambiar disponibilidad'; }
    });
  }
}
