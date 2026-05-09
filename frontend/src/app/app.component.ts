import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './components/navbar/navbar.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent],
  template: `
    <app-navbar></app-navbar>
    <main class="main-content">
      <router-outlet />
    </main>
    <footer class="footer">
      <p>&copy; {{ year }} Sistema de Biblioteca &mdash; Todos los derechos reservados</p>
    </footer>
  `,
  styles: [`
    .main-content {
      min-height: calc(100vh - 64px - 56px);
      padding: 2rem 1.5rem;
      max-width: 1200px;
      margin: 0 auto;
    }
    .footer {
      background: var(--primary);
      color: rgba(255,255,255,.75);
      text-align: center;
      padding: 1rem;
      font-size: .85rem;
    }
    .footer p { margin: 0; }
  `]
})
export class AppComponent {
  year = new Date().getFullYear();
}
