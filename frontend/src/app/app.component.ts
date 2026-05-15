import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './components/navbar/navbar.component';
import { ToastComponent } from './components/toast/toast.component';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, ToastComponent],
  template: `
    <app-navbar></app-navbar>
    <app-toast></app-toast>
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
  `],
})
export class AppComponent implements OnInit {
  private authService = inject(AuthService);
  year = new Date().getFullYear();

  ngOnInit() {
    this.authService.init();
  }
}
