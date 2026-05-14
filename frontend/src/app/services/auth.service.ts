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

export interface AuthResponse {
  user: User;
  token: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;
  private tokenKey = 'biblioteca_token';
  private userKey = 'biblioteca_user';

  private userSignal = signal<User | null>(null);
  isLoggedIn = computed(() => this.userSignal() !== null);
  currentUser = computed(() => this.userSignal());
  isAdmin = computed(() => this.userSignal()?.rol === 'admin');

  constructor(private http: HttpClient) {
    this.loadStoredUser();
  }

  private loadStoredUser() {
    const token = localStorage.getItem(this.tokenKey);
    const userStr = localStorage.getItem(this.userKey);
    if (token && userStr) {
      try {
        this.userSignal.set(JSON.parse(userStr));
      } catch {
        this.clearStorage();
      }
    }
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<ApiResponse<AuthResponse>>(
      `${this.apiUrl}/login`, { email, password }
    ).pipe(
      map(res => res.data),
      tap(data => this.handleAuth(data))
    );
  }

  register(nombre: string, email: string, password: string): Observable<AuthResponse> {
    return this.http.post<ApiResponse<AuthResponse>>(
      `${this.apiUrl}/register`, { nombre, email, password }
    ).pipe(
      map(res => res.data),
      tap(data => this.handleAuth(data))
    );
  }

  private handleAuth(data: AuthResponse) {
    localStorage.setItem(this.tokenKey, data.token);
    localStorage.setItem(this.userKey, JSON.stringify(data.user));
    this.userSignal.set(data.user);
  }

  logout() {
    this.clearStorage();
    this.userSignal.set(null);
  }

  private clearStorage() {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
  }
}
