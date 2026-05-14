import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="auth-page">
      <div class="auth-card">
        <div class="auth-header">
          <h1>{{ isRegisterMode ? 'Crear Cuenta' : 'Iniciar Sesión' }}</h1>
          <p>{{ isRegisterMode ? 'Registrate para acceder al sistema' : 'Ingresá tus credenciales para continuar' }}</p>
        </div>

        <div class="error-msg-general" *ngIf="errorMsg">{{ errorMsg }}</div>

        <form (ngSubmit)="onSubmit()" class="auth-form" novalidate>
          <div class="form-group" *ngIf="isRegisterMode">
            <label for="nombre">Nombre <span class="required">*</span></label>
            <input
              id="nombre"
              name="nombre"
              type="text"
              [(ngModel)]="nombre"
              #nombreCtrl="ngModel"
              required
              placeholder="Tu nombre completo"
              class="form-control"
              [class.invalid]="nombreCtrl.invalid && nombreCtrl.touched"
            />
            <span class="error-msg" *ngIf="nombreCtrl.invalid && nombreCtrl.touched">
              El nombre es obligatorio
            </span>
          </div>

          <div class="form-group">
            <label for="email">Email <span class="required">*</span></label>
            <input
              id="email"
              name="email"
              type="email"
              [(ngModel)]="email"
              #emailCtrl="ngModel"
              required
              email
              placeholder="tucorreo@ejemplo.com"
              class="form-control"
              [class.invalid]="emailCtrl.invalid && emailCtrl.touched"
            />
            <span class="error-msg" *ngIf="emailCtrl.invalid && emailCtrl.touched">
              <span *ngIf="emailCtrl.errors?.['required']">El email es obligatorio</span>
              <span *ngIf="emailCtrl.errors?.['email']">Email inválido</span>
            </span>
          </div>

          <div class="form-group">
            <label for="password">Contraseña <span class="required">*</span></label>
            <input
              id="password"
              name="password"
              type="password"
              [(ngModel)]="password"
              #passwordCtrl="ngModel"
              required
              minlength="6"
              placeholder="Mínimo 6 caracteres"
              class="form-control"
              [class.invalid]="passwordCtrl.invalid && passwordCtrl.touched"
            />
            <span class="error-msg" *ngIf="passwordCtrl.invalid && passwordCtrl.touched">
              <span *ngIf="passwordCtrl.errors?.['required']">La contraseña es obligatoria</span>
              <span *ngIf="passwordCtrl.errors?.['minlength']">Mínimo 6 caracteres</span>
            </span>
          </div>

          <button type="submit" class="btn btn-primary btn-block" [disabled]="submitting">
            {{ submitting ? 'Procesando...' : (isRegisterMode ? 'Registrarse' : 'Ingresar') }}
          </button>
        </form>

        <div class="auth-footer">
          <button class="btn btn-link" (click)="toggleMode()">
            {{ isRegisterMode ? '¿Ya tenés cuenta? Iniciá sesión' : '¿No tenés cuenta? Registrate' }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-page {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: calc(100vh - 200px);
      padding: 2rem 1rem;
    }
    .auth-card {
      background: var(--card-bg);
      padding: 2.5rem;
      border-radius: 16px;
      box-shadow: var(--shadow-lg);
      border: 1px solid var(--border);
      width: 100%;
      max-width: 440px;
    }
    .auth-header { text-align: center; margin-bottom: 2rem; }
    .auth-header h1 { margin: 0; font-size: 1.6rem; color: var(--text); }
    .auth-header p { color: var(--text-light); margin: .4rem 0 0; font-size: .9rem; }
    .auth-form { display: flex; flex-direction: column; gap: 1.25rem; }
    .form-group { margin: 0; }
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
    .form-control.invalid { border-color: var(--danger); }
    .form-control.invalid:focus { box-shadow: 0 0 0 3px rgba(220,53,69,.15); }
    .error-msg {
      display: block;
      color: var(--danger);
      font-size: .8rem;
      margin-top: .35rem;
    }
    .btn-block { width: 100%; padding: .75rem; font-size: 1rem; }
    .btn[disabled] { opacity: .6; cursor: not-allowed; }
    .error-msg-general {
      background: #f8d7da; color: #721c24; padding: .75rem 1rem;
      border-radius: 8px; margin-bottom: 1rem; font-weight: 500; text-align: center;
    }
    .auth-footer {
      text-align: center;
      margin-top: 1.5rem;
      padding-top: 1.5rem;
      border-top: 1px solid var(--border);
    }
    .btn-link {
      background: none;
      border: none;
      color: var(--primary);
      cursor: pointer;
      font-size: .9rem;
      font-weight: 500;
      padding: 0;
      font-family: inherit;
    }
    .btn-link:hover { text-decoration: underline; }
  `]
})
export class LoginComponent {
  isRegisterMode = false;
  nombre = '';
  email = '';
  password = '';
  submitting = false;
  errorMsg = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  toggleMode() {
    this.isRegisterMode = !this.isRegisterMode;
    this.errorMsg = '';
  }

  onSubmit() {
    this.errorMsg = '';
    this.submitting = true;

    if (this.isRegisterMode) {
      this.authService.register(this.nombre, this.email, this.password).subscribe({
        next: () => {
          this.router.navigate(['/']);
        },
        error: (err) => {
          this.submitting = false;
          this.errorMsg = err.error?.error || 'Error al registrarse';
        }
      });
    } else {
      this.authService.login(this.email, this.password).subscribe({
        next: () => {
          this.router.navigate(['/']);
        },
        error: (err) => {
          this.submitting = false;
          this.errorMsg = err.error?.error || 'Error al iniciar sesión';
        }
      });
    }
  }
}
