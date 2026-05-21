import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, map, firstValueFrom, finalize } from 'rxjs';
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
  private initPromise: Promise<void>;
  private refreshObservable: Observable<void> | null = null;

  isLoggedIn = computed(() => this.userSignal() !== null);
  currentUser = computed(() => this.userSignal());
  isAdmin = computed(() => this.userSignal()?.rol === 'admin');

  constructor(private http: HttpClient) {
    this.initPromise = this.init();
  }

  private init(): Promise<void> {
    return firstValueFrom(
      this.http.get<ApiResponse<{ user: User }>>(`${this.apiUrl}/me`, { withCredentials: true })
        .pipe(map(res => res.data.user))
    ).then(user => this.userSignal.set(user))
    .catch(() => this.userSignal.set(null));
  }

  waitForInit(): Promise<void> {
    return this.initPromise;
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
    if (this.refreshObservable) {
      return this.refreshObservable;
    }

    this.refreshObservable = this.http.post<ApiResponse<void>>(
      `${this.apiUrl}/refresh`, {}, { withCredentials: true }
    ).pipe(
      map(() => undefined),
      finalize(() => this.refreshObservable = null),
    );

    return this.refreshObservable;
  }
}
