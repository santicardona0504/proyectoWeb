import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CommonModule],
  template: `
    <nav class="navbar">
      <div class="nav-container">
        <a routerLink="/" class="nav-brand">
          <span class="brand-icon">📚</span>
          <span>Biblioteca</span>
        </a>
        <button class="nav-toggle" (click)="toggleMenu()" aria-label="Menú">
          <span></span><span></span><span></span>
        </button>
        <div class="nav-links" [class.open]="menuOpen">
          <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}" (click)="closeMenu()">Inicio</a>
          <a routerLink="/books" routerLinkActive="active" (click)="closeMenu()">Libros</a>
          <a routerLink="/books/add" routerLinkActive="active" (click)="closeMenu()" *ngIf="auth.isAdmin()">Agregar Libro</a>
        </div>
        <div class="nav-actions" [class.open]="menuOpen">
          <ng-container *ngIf="auth.isLoggedIn(); else loginBlock">
            <span class="user-name">{{ auth.currentUser()?.nombre }}</span>
            <button class="btn-logout" (click)="logout()">Cerrar sesión</button>
          </ng-container>
          <ng-template #loginBlock>
            <a routerLink="/login" routerLinkActive="active" (click)="closeMenu()" class="nav-login">Ingresar</a>
          </ng-template>
        </div>
      </div>
    </nav>
  `,
  styles: [`
    .navbar {
      background: var(--primary);
      padding: 0 1rem;
      position: sticky;
      top: 0;
      z-index: 100;
      box-shadow: 0 2px 8px rgba(0,0,0,.15);
    }
    .nav-container {
      max-width: 1200px;
      margin: 0 auto;
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 64px;
    }
    .nav-brand {
      display: flex;
      align-items: center;
      gap: .5rem;
      color: #fff;
      text-decoration: none;
      font-size: 1.3rem;
      font-weight: 700;
    }
    .brand-icon { font-size: 1.5rem; }
    .nav-toggle {
      display: none;
      flex-direction: column;
      gap: 5px;
      background: none;
      border: none;
      cursor: pointer;
      padding: 4px;
    }
    .nav-toggle span {
      width: 26px;
      height: 3px;
      background: #fff;
      border-radius: 2px;
      transition: .3s;
    }
    .nav-links {
      display: flex;
      gap: .25rem;
      align-items: center;
    }
    .nav-links a {
      color: rgba(255,255,255,.85);
      text-decoration: none;
      padding: .5rem 1rem;
      border-radius: 8px;
      transition: all .2s;
      font-weight: 500;
    }
    .nav-links a:hover { background: rgba(255,255,255,.15); color: #fff; }
    .nav-links a.active { background: rgba(255,255,255,.2); color: #fff; }
    .nav-actions {
      display: flex;
      align-items: center;
      gap: .75rem;
    }
    .user-name {
      color: rgba(255,255,255,.9);
      font-size: .85rem;
      font-weight: 500;
    }
    .btn-logout {
      background: rgba(255,255,255,.15);
      color: #fff;
      border: none;
      padding: .4rem .85rem;
      border-radius: 8px;
      cursor: pointer;
      font-size: .8rem;
      font-weight: 500;
      transition: background .2s;
      font-family: inherit;
    }
    .btn-logout:hover { background: rgba(255,255,255,.25); }
    .nav-login {
      color: #fff;
      text-decoration: none;
      padding: .4rem .85rem;
      border-radius: 8px;
      font-weight: 600;
      font-size: .9rem;
      background: rgba(255,255,255,.2);
      transition: background .2s;
    }
    .nav-login:hover { background: rgba(255,255,255,.3); text-decoration: none; }
    @media (max-width: 768px) {
      .nav-toggle { display: flex; }
      .nav-links {
        display: none;
        position: absolute;
        top: 64px;
        left: 0;
        right: 0;
        background: var(--primary);
        flex-direction: column;
        padding: .5rem 1rem 1rem;
        box-shadow: 0 4px 8px rgba(0,0,0,.15);
      }
      .nav-links.open { display: flex; }
      .nav-links a { width: 100%; padding: .75rem 1rem; }
      .nav-actions {
        display: none;
        position: absolute;
        top: 64px;
        left: 0;
        right: 0;
        background: var(--primary);
        flex-direction: column;
        padding: 0 1rem 1rem;
        box-shadow: 0 4px 8px rgba(0,0,0,.15);
      }
      .nav-actions.open { display: flex; top: auto; position: static; flex-direction: row; }
      .nav-links.open + .nav-actions { display: none; }
    }
  `]
})
export class NavbarComponent {
  menuOpen = false;

  constructor(
    public auth: AuthService,
    private router: Router
  ) {}

  toggleMenu() { this.menuOpen = !this.menuOpen; }
  closeMenu() { this.menuOpen = false; }

  logout() {
    this.auth.logout();
    this.router.navigate(['/']);
  }
}
