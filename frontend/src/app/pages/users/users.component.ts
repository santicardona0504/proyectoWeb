import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { UserService, User } from '../../services/user.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="users-page">
      <h1 class="page-title">Gestión de Usuarios</h1>
      <p class="page-subtitle">Administrá los usuarios, roles y permisos</p>

      <div class="loading" *ngIf="loading">Cargando usuarios...</div>

      <div class="table-container" *ngIf="!loading">
        <table class="users-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Email</th>
              <th>Rol</th>
              <th>Fecha Registro</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let user of users">
              <td class="cell-id">{{ user.id }}</td>
              <td class="cell-name">{{ user.nombre }}</td>
              <td class="cell-email">{{ user.email }}</td>
              <td>
                <select
                  class="role-select"
                  [ngModel]="user.rol"
                  (ngModelChange)="changeRole(user, $event)"
                  [disabled]="updating.has(user.id)"
                >
                  <option value="usuario">Usuario</option>
                  <option value="bibliotecario">Bibliotecario</option>
                  <option value="admin">Admin</option>
                </select>
              </td>
              <td>{{ user.created_at | date:'dd/MM/yyyy HH:mm' }}</td>
              <td>
                <button
                  class="btn btn-sm btn-danger"
                  [disabled]="updating.has(user.id)"
                  (click)="deleteUser(user)"
                >
                  {{ updating.has(user.id) ? '...' : 'Eliminar' }}
                </button>
              </td>
            </tr>
            <tr *ngIf="users.length === 0">
              <td colspan="6" class="empty-msg">No hay usuarios registrados.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .users-page { max-width: 1200px; margin: 0 auto; }
    .page-title { margin: 0; font-size: 1.8rem; color: var(--text); }
    .page-subtitle { color: var(--text-light); margin: .3rem 0 2rem; }
    .users-table { width: 100%; border-collapse: collapse; min-width: 700px; }
    .btn-danger {
      background: var(--danger);
      color: #fff;
    }
    .btn-danger:hover { background: #c82333; }
  `],
})
export class UsersComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private userService = inject(UserService);
  private toast = inject(ToastService);

  users: User[] = [];
  loading = true;
  updating = new Set<number>();

  ngOnInit() {
    this.loadUsers();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadUsers() {
    this.loading = true;
    this.userService.getAll().pipe(takeUntil(this.destroy$)).subscribe({
      next: (users) => {
        this.users = users;
        this.loading = false;
      },
      error: () => {
        this.toast.error('Error al cargar usuarios');
        this.loading = false;
      },
    });
  }

  changeRole(user: User, newRole: string) {
    if (newRole === user.rol) return;
    if (!confirm(`¿Cambiar el rol de "${user.nombre}" a "${newRole}"?`)) return;

    this.updating.add(user.id);
    this.userService.updateRole(user.id, newRole).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.updating.delete(user.id);
        user.rol = newRole;
        this.toast.success(`Rol de "${user.nombre}" actualizado a "${newRole}"`);
      },
      error: (err) => {
        this.updating.delete(user.id);
        this.toast.error(err.error?.error || 'Error al actualizar rol');
      },
    });
  }

  deleteUser(user: User) {
    if (!confirm(`¿Eliminar al usuario "${user.nombre}" (${user.email})? Esta acción no se puede deshacer.`)) return;

    this.updating.add(user.id);
    this.userService.remove(user.id).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.updating.delete(user.id);
        this.users = this.users.filter(u => u.id !== user.id);
        this.toast.success(`Usuario "${user.nombre}" eliminado`);
      },
      error: (err) => {
        this.updating.delete(user.id);
        this.toast.error(err.error?.error || 'Error al eliminar usuario');
      },
    });
  }
}
