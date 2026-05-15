import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Loan } from '../models/loan.model';
import { environment } from '../../environments/environment';
import { PaginationMeta, ApiResponse } from './book.service';

export interface LoansResponse {
  loans: Loan[];
  pagination: PaginationMeta;
}

@Injectable({ providedIn: 'root' })
export class LoanService {
  private apiUrl = `${environment.apiUrl}/loans`;

  constructor(private http: HttpClient) {}

  getLoans(page?: number, limit?: number): Observable<LoansResponse> {
    let params = new HttpParams();
    if (page) params = params.set('page', page);
    if (limit) params = params.set('limit', limit);
    return this.http.get<ApiResponse<LoansResponse>>(this.apiUrl, { params }).pipe(
      map(res => res.data)
    );
  }

  getActive(page?: number, limit?: number): Observable<LoansResponse> {
    let params = new HttpParams();
    if (page) params = params.set('page', page);
    if (limit) params = params.set('limit', limit);
    return this.http.get<ApiResponse<LoansResponse>>(`${this.apiUrl}/active`, { params }).pipe(
      map(res => res.data)
    );
  }

  createLoan(book_id: number, nombre_usuario: string): Observable<Loan> {
    return this.http.post<ApiResponse<Loan>>(this.apiUrl, { book_id, nombre_usuario }).pipe(
      map(res => res.data)
    );
  }

  returnLoan(id: number): Observable<Loan> {
    return this.http.post<ApiResponse<Loan>>(`${this.apiUrl}/return`, { id }).pipe(
      map(res => res.data)
    );
  }
}
