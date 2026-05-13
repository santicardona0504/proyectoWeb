import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { BookService } from '../../services/book.service';

@Component({
  selector: 'app-add-book',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="add-book-page">
      <h1 class="page-title">Agregar Nuevo Libro</h1>
      <p class="page-subtitle">Completa todos los campos obligatorios</p>

      <div class="error-msg-general" *ngIf="errorMsg">{{ errorMsg }}</div>

      <form #bookForm="ngForm" (ngSubmit)="onSubmit(bookForm)" class="book-form" novalidate>
        <div class="form-group">
          <label for="titulo">Título <span class="required">*</span></label>
          <input
            id="titulo"
            name="titulo"
            type="text"
            [(ngModel)]="model.titulo"
            #titulo="ngModel"
            required
            placeholder="Ej: Cien años de soledad"
            class="form-control"
            [class.invalid]="titulo.invalid && titulo.touched"
          />
          <span class="error-msg" *ngIf="titulo.invalid && titulo.touched">
            El título es obligatorio
          </span>
        </div>

        <div class="form-group">
          <label for="autor">Autor <span class="required">*</span></label>
          <input
            id="autor"
            name="autor"
            type="text"
            [(ngModel)]="model.autor"
            #autor="ngModel"
            required
            placeholder="Ej: Gabriel García Márquez"
            class="form-control"
            [class.invalid]="autor.invalid && autor.touched"
          />
          <span class="error-msg" *ngIf="autor.invalid && autor.touched">
            El autor es obligatorio
          </span>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="isbn">ISBN <span class="required">*</span></label>
            <input
              id="isbn"
              name="isbn"
              type="text"
              [(ngModel)]="model.isbn"
              #isbn="ngModel"
              required
              pattern="^(?:\\d{9}[\\dXx]|\\d{13}|\\d-\\d{5}-\\d{3}-[\\dX])$"
              placeholder="Ej: 978-84-376-0494-7"
              class="form-control"
              [class.invalid]="isbn.invalid && isbn.touched"
            />
            <span class="error-msg" *ngIf="isbn.invalid && isbn.touched">
              <span *ngIf="isbn.errors?.['required']">El ISBN es obligatorio</span>
              <span *ngIf="isbn.errors?.['pattern']">Formato ISBN inválido</span>
            </span>
          </div>

          <div class="form-group">
            <label for="anio">Año de publicación <span class="required">*</span></label>
            <input
              id="anio"
              name="anio"
              type="number"
              [(ngModel)]="model.anio"
              #anioCtrl="ngModel"
              required
              min="1000"
              [max]="currentYear"
              placeholder="Ej: 1967"
              class="form-control"
              [class.invalid]="anioCtrl.invalid && anioCtrl.touched"
            />
            <span class="error-msg" *ngIf="anioCtrl.invalid && anioCtrl.touched">
              <span *ngIf="anioCtrl.errors?.['required']">El año es obligatorio</span>
              <span *ngIf="anioCtrl.errors?.['min'] || anioCtrl.errors?.['max']">Año entre 1000 y {{ currentYear }}</span>
            </span>
          </div>
        </div>

        <div class="form-group">
          <label for="categoria">Género <span class="required">*</span></label>
          <select
            id="categoria"
            name="categoria"
            [(ngModel)]="model.categoria"
            #categoria="ngModel"
            required
            class="form-control"
            [class.invalid]="categoria.invalid && categoria.touched"
          >
            <option value="" disabled>Seleccionar género</option>
            <option *ngFor="let g of categorias" [value]="g">{{ g }}</option>
          </select>
          <span class="error-msg" *ngIf="categoria.invalid && categoria.touched">
            Selecciona un género
          </span>
        </div>

        <div class="form-actions">
          <button type="submit" class="btn btn-primary" [disabled]="bookForm.invalid || submitting">
            {{ submitting ? 'Guardando...' : 'Guardar Libro' }}
          </button>
          <button type="button" class="btn btn-secondary" routerLink="/books">Cancelar</button>
        </div>

        <div class="success-msg" *ngIf="success">
          ¡Libro agregado exitosamente!
        </div>
      </form>
    </div>
  `,
  styles: [`
    .add-book-page { max-width: 640px; margin: 0 auto; }
    .page-title { margin: 0; font-size: 1.8rem; color: var(--text); }
    .page-subtitle { color: var(--text-light); margin: .3rem 0 2rem; }
    .book-form {
      background: var(--card-bg);
      padding: 2rem;
      border-radius: 12px;
      box-shadow: var(--shadow);
      border: 1px solid var(--border);
    }
    .form-group { margin-bottom: 1.5rem; }
    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.25rem;
    }
    label {
      display: block;
      margin-bottom: .4rem;
      font-weight: 600;
      font-size: .9rem;
      color: var(--text);
    }
    .required { color: var(--danger); }
    .form-control {
      width: 100%;
      padding: .7rem .9rem;
      border: 2px solid var(--border);
      border-radius: 8px;
      font-size: .95rem;
      transition: border .2s, box-shadow .2s;
      background: var(--bg);
      color: var(--text);
      box-sizing: border-box;
    }
    .form-control:focus {
      outline: none;
      border-color: var(--primary);
      box-shadow: 0 0 0 3px rgba(67,97,238,.15);
    }
    .form-control.invalid {
      border-color: var(--danger);
    }
    .form-control.invalid:focus {
      box-shadow: 0 0 0 3px rgba(220,53,69,.15);
    }
    select.form-control { cursor: pointer; }
    .error-msg {
      display: block;
      color: var(--danger);
      font-size: .8rem;
      margin-top: .35rem;
    }
    .form-actions {
      display: flex;
      gap: .75rem;
      margin-top: 2rem;
    }
    .btn[disabled] { opacity: .6; cursor: not-allowed; }
    .error-msg-general { background: #f8d7da; color: #721c24; padding: .75rem 1rem; border-radius: 8px; margin-bottom: 1rem; font-weight: 500; text-align: center; }
    .success-msg {
      margin-top: 1rem;
      background: #d4edda;
      color: #155724;
      padding: .75rem 1rem;
      border-radius: 8px;
      font-weight: 500;
      text-align: center;
    }
    @media (max-width: 600px) {
      .form-row { grid-template-columns: 1fr; }
      .book-form { padding: 1.25rem; }
    }
  `]
})
export class AddBookComponent {
  categorias = [
    'Novela', 'Realismo mágico', 'Distopía', 'Literatura infantil',
    'Romance', 'Ciencia ficción', 'Fantasía', 'Terror', 'Poesía',
    'Biografía', 'Historia', 'Filosofía'
  ];

  model = {
    titulo: '',
    autor: '',
    isbn: '',
    anio: null as number | null,
    categoria: ''
  };

  currentYear = new Date().getFullYear();
  submitting = false;
  success = false;
  errorMsg = '';

  constructor(
    private bookService: BookService,
    private router: Router
  ) {}

  onSubmit(form: NgForm) {
    if (form.invalid) return;
    this.submitting = true;
    this.success = false;
    this.errorMsg = '';

    this.bookService.addBook({
      titulo: this.model.titulo,
      autor: this.model.autor,
      isbn: this.model.isbn,
      anio: this.model.anio!,
      categoria: this.model.categoria,
      disponible: true
    }).subscribe({
      next: () => {
        this.success = true;
        this.submitting = false;
        form.resetForm();
        this.model = { titulo: '', autor: '', isbn: '', anio: null, categoria: '' };
        setTimeout(() => this.router.navigate(['/books']), 1500);
      },
      error: (err) => {
        this.submitting = false;
        this.errorMsg = err.error?.error || 'Error al guardar el libro';
      }
    });
  }
}
