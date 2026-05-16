import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { BookService } from '../../services/book.service';
import { LoanService } from '../../services/loan.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
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
          <p class="page-subtitle" *ngIf="!loading">{{ total }} libros en la biblioteca</p>
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
              <td class="cell-isbn">{{ book.isbn || '—' }}</td>
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
                  [disabled]="actionLoading.has(book.id)"
                  (click)="handleLoanAction(book)"
                >
                  <span *ngIf="actionLoading.has(book.id)">...</span>
                  <span *ngIf="!actionLoading.has(book.id)">{{ book.disponible ? 'Prestar' : 'Devolver' }}</span>
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

      <div class="modal-overlay" *ngIf="showLoanModal" (click)="cancelLoan()">
        <div class="modal" (click)="$event.stopPropagation()">
          <h3>Registrar Préstamo</h3>
          <p>Libro: <strong>{{ selectedBook?.titulo }}</strong></p>
          <div class="form-group">
            <label for="loanUserName">Nombre del usuario que retira</label>
            <input
              id="loanUserName"
              type="text"
              [(ngModel)]="loanUserName"
              placeholder="Nombre completo"
              class="form-control"
            />
          </div>
          <div class="modal-actions">
            <button class="btn btn-primary" [disabled]="!loanUserName.trim()" (click)="confirmLoan()">Confirmar Préstamo</button>
            <button class="btn btn-secondary" (click)="cancelLoan()">Cancelar</button>
          </div>
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
    .books-table { width: 100%; border-collapse: collapse; min-width: 650px; }
    .cell-isbn { font-family: monospace; font-size: .82rem; color: var(--text-light); }
    .genre-tag {
      background: var(--primary-light);
      color: var(--primary);
      padding: 2px 10px;
      border-radius: 20px;
      font-size: .8rem;
      font-weight: 500;
    }
    .status-badge.available { background: #d4edda; color: #155724; }
    .status-badge.borrowed { background: #f8d7da; color: #721c24; }
    .btn-search { margin-top: .5rem; }
    .search-bar { display: flex; gap: .5rem; align-items: flex-start; flex-wrap: wrap; }
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,.4);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 300;
    }
    .modal {
      background: var(--card-bg);
      padding: 2rem;
      border-radius: 16px;
      max-width: 420px;
      width: 90%;
      box-shadow: var(--shadow-lg);
    }
    .modal h3 { margin: 0 0 .5rem; color: var(--text); }
    .modal p { color: var(--text-light); margin-bottom: 1.25rem; }
    .form-group { margin-bottom: 1rem; }
    .form-group label { display: block; margin-bottom: .4rem; font-weight: 600; font-size: .9rem; color: var(--text); }
    .form-control {
      width: 100%;
      padding: .7rem .9rem;
      border: 2px solid var(--border);
      border-radius: 8px;
      font-size: .95rem;
      background: var(--bg);
      color: var(--text);
      box-sizing: border-box;
    }
    .form-control:focus { outline: none; border-color: var(--primary); }
    .modal-actions { display: flex; gap: .75rem; margin-top: 1.5rem; }
  `],
})
export class BookListComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private bookService = inject(BookService);
  private loanService = inject(LoanService);
  private authService = inject(AuthService);
  private toast = inject(ToastService);

  books: Book[] = [];
  searchTerm = '';
  loading = true;
  page = 1;
  limit = 20;
  totalPages = 1;
  total = 0;
  actionLoading = new Set<number>();

  showLoanModal = false;
  selectedBook: Book | null = null;
  loanUserName = '';

  ngOnInit() {
    this.loadBooks();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadBooks() {
    this.loading = true;
    this.bookService.getBooks(this.searchTerm, this.page, this.limit)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.books = res.books;
          this.total = res.pagination.total;
          this.totalPages = res.pagination.totalPages;
          this.page = res.pagination.page;
          this.loading = false;
        },
        error: () => {
          this.toast.error('Error al cargar libros');
          this.loading = false;
        },
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

  handleLoanAction(book: Book) {
    if (book.disponible) {
      this.selectedBook = book;
      this.loanUserName = this.authService.currentUser()?.nombre || '';
      this.showLoanModal = true;
    } else {
      if (!confirm('¿Confirmás la devolución de este libro?')) return;
      this.returnBook(book);
    }
  }

  cancelLoan() {
    this.showLoanModal = false;
    this.selectedBook = null;
    this.loanUserName = '';
  }

  confirmLoan() {
    if (!this.selectedBook || !this.loanUserName.trim()) return;
    const book = this.selectedBook;
    this.showLoanModal = false;
    this.actionLoading.add(book.id);

    this.loanService.createLoan(book.id, this.loanUserName.trim())
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.actionLoading.delete(book.id);
          book.disponible = false;
          this.toast.success(`"${book.titulo}" prestado a ${this.loanUserName}`);
        },
        error: (err) => {
          this.actionLoading.delete(book.id);
          this.toast.error(err.error?.error || 'Error al registrar préstamo');
        },
      });
  }

  private returnBook(book: Book) {
    this.actionLoading.add(book.id);

    this.loanService.getActive(1, 100)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          const activeLoan = res.loans.find(l => l.book_id === book.id);
          if (!activeLoan) {
            this.actionLoading.delete(book.id);
            this.toast.error('No se encontró un préstamo activo para este libro');
            return;
          }
          this.loanService.returnLoan(activeLoan.id)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
              next: () => {
                this.actionLoading.delete(book.id);
                book.disponible = true;
                this.toast.success(`"${book.titulo}" devuelto correctamente`);
              },
              error: (err) => {
                this.actionLoading.delete(book.id);
                this.toast.error(err.error?.error || 'Error al devolver libro');
              },
            });
        },
        error: () => {
          this.actionLoading.delete(book.id);
          this.toast.error('Error al buscar préstamo activo');
        },
      });
  }
}
