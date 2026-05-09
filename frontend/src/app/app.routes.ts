import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent),
    title: 'Inicio - Biblioteca'
  },
  {
    path: 'books',
    loadComponent: () =>
      import('./pages/book-list/book-list.component').then(m => m.BookListComponent),
    title: 'Catálogo - Biblioteca'
  },
  {
    path: 'books/add',
    loadComponent: () =>
      import('./pages/add-book/add-book.component').then(m => m.AddBookComponent),
    title: 'Agregar Libro - Biblioteca'
  },
  {
    path: '**',
    redirectTo: ''
  }
];
