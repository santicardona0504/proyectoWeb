import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private readonly TOKEN_KEY = 'auth_token';
  private readonly apiUrl = environment.apiUrl; // e.g. http://18.191.255.5:3000

  constructor(private http: HttpClient, private router: Router) {}

  login(credentials: { email: string; password: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/login`, credentials).pipe(
      tap((response: any) => {
        if (response?.token) {
          localStorage.setItem(this.TOKEN_KEY, response.token);
        }
      }),
      catchError(err => {
        console.error('Error en login:', err);
        return throwError(() => err);
      })
    );
  }

  getToken(): string | null {
    const token = localStorage.getItem(this.TOKEN_KEY);
    // Verificar que el token no esté expirado antes de devolverlo
    if (token && this.isTokenExpired(token)) {
      this.logout();
      return null;
    }
    return token;
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    return !!token;
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    // Limpiar cualquier otro dato de sesión
    sessionStorage.clear();
  }

  refreshToken(): Observable<string> {
    return this.http.post<any>(`${this.apiUrl}/auth/refresh`, {}).pipe(
      tap((response: any) => {
        if (response?.token) {
          localStorage.setItem(this.TOKEN_KEY, response.token);
        }
      }),
      catchError(err => {
        this.logout();
        return throwError(() => err);
      })
    );
  }

  // Decodifica el JWT y verifica expiración sin librerías externas
  private isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const now = Math.floor(Date.now() / 1000);
      return payload.exp < now;
    } catch (e) {
      return true; // Si no se puede decodificar, se considera expirado
    }
  }
}