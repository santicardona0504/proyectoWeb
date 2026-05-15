import { Routes } from '@angular/router';
import { authGuard, roleGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent),
    title: 'Inicio - Biblioteca',
    canActivate: [authGuard],
  },
  {
    path: 'books',
    loadComponent: () =>
      import('./pages/book-list/book-list.component').then(m => m.BookListComponent),
    title: 'Catálogo - Biblioteca',
    canActivate: [authGuard],
  },
  {
    path: 'books/add',
    loadComponent: () =>
      import('./pages/add-book/add-book.component').then(m => m.AddBookComponent),
    title: 'Agregar Libro - Biblioteca',
    canActivate: [roleGuard(['admin'])],
  },
  {
    path: 'loans',
    loadComponent: () =>
      import('./pages/loans/loans.component').then(m => m.LoansComponent),
    title: 'Préstamos - Biblioteca',
    canActivate: [roleGuard(['admin', 'bibliotecario'])],
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/login/login.component').then(m => m.LoginComponent),
    title: 'Iniciar Sesión - Biblioteca',
  },
  {
    path: '**',
    redirectTo: '',
  },
];
