import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Book } from '../../models/book.model';

@Component({
  selector: 'app-book-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="book-card" [class.unavailable]="!book.disponible">
      <div class="card-badge" *ngIf="!book.disponible">Prestado</div>
      <div class="card-body">
        <h3 class="card-title">{{ book.titulo }}</h3>
        <p class="card-author">{{ book.autor }}</p>
        <div class="card-meta">
          <span class="meta-tag">{{ book.categoria }}</span>
          <span class="meta-year">{{ book.anio }}</span>
        </div>
        <p class="card-isbn">ISBN: {{ book.isbn }}</p>
        <span class="card-status" [class.available]="book.disponible" [class.borrowed]="!book.disponible">
          {{ book.disponible ? 'Disponible' : 'Prestado' }}
        </span>
      </div>
    </div>
  `,
  styles: [`
    .book-card {
      background: var(--card-bg);
      border-radius: 12px;
      padding: 0;
      box-shadow: var(--shadow);
      transition: transform .2s, box-shadow .2s;
      position: relative;
      overflow: hidden;
      border: 1px solid var(--border);
    }
    .book-card:hover {
      transform: translateY(-4px);
      box-shadow: var(--shadow-lg);
    }
    .book-card.unavailable { opacity: .75; }
    .card-badge {
      position: absolute;
      top: 12px;
      right: 12px;
      background: var(--danger);
      color: #fff;
      padding: 3px 10px;
      border-radius: 20px;
      font-size: .75rem;
      font-weight: 600;
    }
    .card-body { padding: 1.5rem; }
    .card-title {
      margin: 0 0 .4rem;
      font-size: 1.1rem;
      color: var(--text);
      line-height: 1.3;
    }
    .card-author {
      color: var(--text-light);
      margin: 0 0 .75rem;
      font-size: .9rem;
    }
    .card-meta {
      display: flex;
      gap: .5rem;
      margin-bottom: .6rem;
      flex-wrap: wrap;
    }
    .meta-tag {
      background: var(--primary-light);
      color: var(--primary);
      padding: 2px 10px;
      border-radius: 20px;
      font-size: .78rem;
      font-weight: 500;
    }
    .meta-year {
      color: var(--text-light);
      font-size: .85rem;
      padding: 2px 0;
    }
    .card-isbn {
      font-size: .8rem;
      color: var(--text-light);
      margin: 0 0 .75rem;
      font-family: monospace;
    }
    .card-status {
      display: inline-block;
      padding: 4px 14px;
      border-radius: 20px;
      font-size: .8rem;
      font-weight: 600;
    }
    .card-status.available { background: #d4edda; color: #155724; }
    .card-status.borrowed { background: #f8d7da; color: #721c24; }
  `]
})
export class BookCardComponent {
  @Input() book!: Book;
}
