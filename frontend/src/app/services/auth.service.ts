import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, map } from 'rxjs';
import { environment } from '../../environments/environment';

export interface User {
  id: number;
  nombre: string;
  email: string;
  rol: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;
  private userSignal = signal<User | null>(null);
  private loaded = false;

  isLoggedIn = computed(() => this.userSignal() !== null);
  currentUser = computed(() => this.userSignal());
  isAdmin = computed(() => this.userSignal()?.rol === 'admin');

  constructor(private http: HttpClient) {}

  init() {
    if (this.loaded) return;
    this.loaded = true;
    this.http.get<ApiResponse<{ user: User }>>(`${this.apiUrl}/me`, { withCredentials: true })
      .pipe(map(res => res.data.user))
      .subscribe({
        next: (user) => this.userSignal.set(user),
        error: () => this.userSignal.set(null),
      });
  }

  login(email: string, password: string): Observable<User> {
    return this.http.post<ApiResponse<{ user: User }>>(
      `${this.apiUrl}/login`, { email, password }, { withCredentials: true }
    ).pipe(
      map(res => res.data.user),
      tap(user => this.userSignal.set(user)),
    );
  }

  register(nombre: string, email: string, password: string): Observable<User> {
    return this.http.post<ApiResponse<{ user: User }>>(
      `${this.apiUrl}/register`, { nombre, email, password }, { withCredentials: true }
    ).pipe(
      map(res => res.data.user),
      tap(user => this.userSignal.set(user)),
    );
  }

  logout() {
    this.http.post(`${this.apiUrl}/logout`, {}, { withCredentials: true })
      .subscribe({ error: () => {} });
    this.userSignal.set(null);
  }

  refreshSession(): Observable<void> {
    return this.http.post<ApiResponse<void>>(`${this.apiUrl}/refresh`, {}, { withCredentials: true })
      .pipe(map(() => undefined));
  }
}
