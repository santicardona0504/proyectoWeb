import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Book } from '../models/book.model';
import { environment } from '../../environments/environment';

export interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface BooksResponse {
  books: Book[];
  pagination: PaginationMeta;
}

export interface StatsResponse {
  total: string;
  available: string;
  borrowed: string;
}

@Injectable({ providedIn: 'root' })
export class BookService {
  private apiUrl = `${environment.apiUrl}/books`;

  constructor(private http: HttpClient) {}

  getBooks(search?: string, page?: number, limit?: number): Observable<BooksResponse> {
    let params = new HttpParams();
    if (search) params = params.set('search', search);
    if (page) params = params.set('page', page);
    if (limit) params = params.set('limit', limit);
    return this.http.get<ApiResponse<BooksResponse>>(this.apiUrl, { params }).pipe(
      map(res => res.data)
    );
  }

  getBook(id: number): Observable<Book> {
    return this.http.get<ApiResponse<Book>>(`${this.apiUrl}/${id}`).pipe(
      map(res => res.data)
    );
  }

  addBook(book: Omit<Book, 'id'>): Observable<Book> {
    return this.http.post<ApiResponse<Book>>(this.apiUrl, book).pipe(
      map(res => res.data)
    );
  }

  toggleAvailability(id: number, disponible: boolean): Observable<Book> {
    return this.http.patch<ApiResponse<Book>>(`${this.apiUrl}/${id}`, { disponible }).pipe(
      map(res => res.data)
    );
  }

  getStats(): Observable<StatsResponse> {
    return this.http.get<ApiResponse<StatsResponse>>(`${this.apiUrl}/stats`).pipe(
      map(res => res.data)
    );
  }
}
