import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BookService } from '../../services/book.service';
import { Book } from '../../models/book.model';
import { BookCardComponent } from '../../components/book-card/book-card.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, BookCardComponent],
  template: `
    <div class="dashboard">
      <h1 class="page-title">Panel de Control</h1>
      <p class="page-subtitle">Resumen del estado de la biblioteca</p>

      <div class="stats-grid" *ngIf="stats">
        <div class="stat-card total">
          <div class="stat-icon">📚</div>
          <div class="stat-info">
            <span class="stat-number">{{ stats.total }}</span>
            <span class="stat-label">Total Libros</span>
          </div>
        </div>
        <div class="stat-card available">
          <div class="stat-icon">✅</div>
          <div class="stat-info">
            <span class="stat-number">{{ stats.available }}</span>
            <span class="stat-label">Disponibles</span>
          </div>
        </div>
        <div class="stat-card borrowed">
          <div class="stat-icon">📕</div>
          <div class="stat-info">
            <span class="stat-number">{{ stats.borrowed }}</span>
            <span class="stat-label">Prestados</span>
          </div>
        </div>
      </div>

      <div class="loading" *ngIf="!stats">Cargando estadísticas...</div>

      <section class="recent-section" *ngIf="recentBooks.length">
        <h2>Últimos libros agregados</h2>
        <div class="cards-grid">
          <app-book-card *ngFor="let book of recentBooks" [book]="book"></app-book-card>
        </div>
      </section>
    </div>
  `,
  styles: [`
    .dashboard { max-width: 1200px; margin: 0 auto; }
    .page-title { margin: 0; font-size: 1.8rem; color: var(--text); }
    .page-subtitle { color: var(--text-light); margin: .3rem 0 2rem; }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1.25rem;
      margin-bottom: 2.5rem;
    }
    .stat-card {
      background: var(--card-bg);
      border-radius: 12px;
      padding: 1.5rem;
      display: flex;
      align-items: center;
      gap: 1rem;
      box-shadow: var(--shadow);
      border: 1px solid var(--border);
      transition: transform .2s;
    }
    .stat-card:hover { transform: translateY(-2px); }
    .stat-icon { font-size: 2.2rem; }
    .stat-info { display: flex; flex-direction: column; }
    .stat-number { font-size: 2rem; font-weight: 700; color: var(--text); line-height: 1.2; }
    .stat-label { font-size: .85rem; color: var(--text-light); }
    .stat-card.total .stat-number { color: var(--primary); }
    .stat-card.available .stat-number { color: #28a745; }
    .stat-card.borrowed .stat-number { color: #dc3545; }
    .loading { text-align: center; padding: 3rem; color: var(--text-light); }
    .recent-section h2 { font-size: 1.3rem; margin-bottom: 1rem; color: var(--text); }
    .cards-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 1.25rem;
    }
  `]
})
export class DashboardComponent implements OnInit {
  stats: { total: number; available: number; borrowed: number } | null = null;
  recentBooks: Book[] = [];

  constructor(private bookService: BookService) {}

  ngOnInit() {
    this.bookService.getBooks().subscribe(books => {
      this.stats = {
        total: books.length,
        available: books.filter(b => b.disponible).length,
        borrowed: books.filter(b => !b.disponible).length,
      };
      this.recentBooks = books.slice(-3).reverse();
    });
  }
}
