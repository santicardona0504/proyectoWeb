import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { LoanService } from '../../services/loan.service';
import { ToastService } from '../../services/toast.service';
import { Loan } from '../../models/loan.model';

@Component({
  selector: 'app-loans',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="loans-page">
      <h1 class="page-title">Gestión de Préstamos</h1>
      <p class="page-subtitle">Administrá los préstamos activos y el historial</p>

      <div class="tabs">
        <button class="tab" [class.active]="activeTab === 'active'" (click)="activeTab = 'active'; loadLoans()">Préstamos Activos</button>
        <button class="tab" [class.active]="activeTab === 'all'" (click)="activeTab = 'all'; loadLoans()">Historial Completo</button>
      </div>

      <div class="loading" *ngIf="loading">Cargando préstamos...</div>

      <div class="table-container" *ngIf="!loading">
        <table class="loans-table">
          <thead>
            <tr>
              <th>Libro</th>
              <th>Usuario</th>
              <th>Fecha Préstamo</th>
              <th>Fecha Devolución</th>
              <th>Estado</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let loan of loans">
              <td class="cell-title">{{ loan.libro_titulo || '—' }}</td>
              <td>{{ loan.nombre_usuario }}</td>
              <td>{{ loan.fecha_prestamo | date:'dd/MM/yyyy HH:mm' }}</td>
              <td>{{ loan.fecha_devolucion ? (loan.fecha_devolucion | date:'dd/MM/yyyy HH:mm') : '—' }}</td>
              <td>
                <span class="status-badge" [class.active]="loan.estado === 'activo'" [class.returned]="loan.estado === 'devuelto'">
                  {{ loan.estado === 'activo' ? 'Activo' : 'Devuelto' }}
                </span>
              </td>
              <td>
                <button
                  class="btn btn-sm btn-success"
                  *ngIf="loan.estado === 'activo'"
                  [disabled]="returning.has(loan.id)"
                  (click)="returnLoan(loan)"
                >
                  {{ returning.has(loan.id) ? '...' : 'Devolver' }}
                </button>
              </td>
            </tr>
            <tr *ngIf="loans.length === 0">
              <td colspan="6" class="empty-msg">
                {{ activeTab === 'active' ? 'No hay préstamos activos.' : 'No hay préstamos registrados.' }}
              </td>
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
    .loans-page { max-width: 1200px; margin: 0 auto; }
    .page-title { margin: 0; font-size: 1.8rem; color: var(--text); }
    .page-subtitle { color: var(--text-light); margin: .3rem 0 2rem; }
    .tabs {
      display: flex;
      gap: 0;
      margin-bottom: 1.5rem;
      border-bottom: 2px solid var(--border);
    }
    .tab {
      padding: .6rem 1.5rem;
      border: none;
      background: none;
      font-size: .95rem;
      font-weight: 600;
      color: var(--text-light);
      cursor: pointer;
      border-bottom: 2px solid transparent;
      margin-bottom: -2px;
      transition: all .2s;
      font-family: inherit;
    }
    .tab.active { color: var(--primary); border-bottom-color: var(--primary); }
    .tab:hover { color: var(--primary); }
    .loans-table { width: 100%; border-collapse: collapse; min-width: 700px; }
    .status-badge.active { background: #fff3cd; color: #856404; }
    .status-badge.returned { background: #d4edda; color: #155724; }
  `],
})
export class LoansComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private loanService = inject(LoanService);
  private toast = inject(ToastService);

  loans: Loan[] = [];
  loading = true;
  activeTab: 'active' | 'all' = 'active';
  page = 1;
  limit = 20;
  totalPages = 1;
  returning = new Set<number>();

  ngOnInit() {
    this.loadLoans();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadLoans() {
    this.loading = true;
    this.page = 1;

    const obs = this.activeTab === 'active'
      ? this.loanService.getActive(this.page, this.limit)
      : this.loanService.getLoans(this.page, this.limit);

    obs.pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        this.loans = res.loans;
        this.totalPages = res.pagination.totalPages;
        this.loading = false;
      },
      error: () => {
        this.toast.error('Error al cargar préstamos');
        this.loading = false;
      },
    });
  }

  goToPage(p: number) {
    if (p < 1 || p > this.totalPages) return;
    this.page = p;
    this.loading = true;

    const obs = this.activeTab === 'active'
      ? this.loanService.getActive(this.page, this.limit)
      : this.loanService.getLoans(this.page, this.limit);

    obs.pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        this.loans = res.loans;
        this.totalPages = res.pagination.totalPages;
        this.loading = false;
      },
      error: () => {
        this.toast.error('Error al cargar préstamos');
        this.loading = false;
      },
    });
  }

  returnLoan(loan: Loan) {
    if (!confirm(`¿Confirmás la devolución de "${loan.libro_titulo}"?`)) return;

    this.returning.add(loan.id);
    this.loanService.returnLoan(loan.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.returning.delete(loan.id);
          this.toast.success(`"${loan.libro_titulo}" devuelto correctamente`);
          this.loadLoans();
        },
        error: (err) => {
          this.returning.delete(loan.id);
          this.toast.error(err.error?.error || 'Error al devolver libro');
        },
      });
  }
}
