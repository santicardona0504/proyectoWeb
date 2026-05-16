import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiResponse } from './book.service';

export interface User {
  id: number;
  nombre: string;
  email: string;
  rol: string;
  created_at: string;
}

export interface UsersResponse {
  users: User[];
}

@Injectable({ providedIn: 'root' })
export class UserService {
  private apiUrl = `${environment.apiUrl}/users`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<User[]> {
    return this.http.get<ApiResponse<UsersResponse>>(this.apiUrl, { withCredentials: true }).pipe(
      map(res => res.data.users)
    );
  }

  updateRole(id: number, rol: string): Observable<User> {
    return this.http.patch<ApiResponse<{ user: User }>>(
      `${this.apiUrl}/${id}/role`, { rol }, { withCredentials: true }
    ).pipe(map(res => res.data.user));
  }

  remove(id: number): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`, { withCredentials: true }).pipe(
      map(() => undefined)
    );
  }
}
