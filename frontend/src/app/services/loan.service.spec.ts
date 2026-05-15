import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { LoanService } from './loan.service';
import { Loan } from '../models/loan.model';
import { environment } from '../../environments/environment';

describe('LoanService', () => {
  let service: LoanService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(LoanService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getLoans()', () => {
    it('should GET loans with pagination', () => {
      const mockResp = { loans: [], pagination: { total: 0, page: 1, limit: 10, totalPages: 0 } };
      service.getLoans(1, 10).subscribe(r => expect(r).toEqual(mockResp));
      const req = httpMock.expectOne(`${environment.apiUrl}/loans?page=1&limit=10`);
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, data: mockResp });
    });
  });

  describe('getActive()', () => {
    it('should GET /loans/active', () => {
      service.getActive().subscribe();
      const req = httpMock.expectOne(`${environment.apiUrl}/loans/active`);
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, data: { loans: [], pagination: { total: 0, page: 1, limit: 10, totalPages: 0 } } });
    });
  });

  describe('createLoan()', () => {
    it('should POST new loan', () => {
      const created: Loan = { id: 1, book_id: 1, usuario_id: null, nombre_usuario: 'User', fecha_prestamo: new Date().toISOString(), fecha_devolucion: null, estado: 'activo' };
      service.createLoan(1, 'User').subscribe(r => expect(r).toEqual(created));
      const req = httpMock.expectOne(`${environment.apiUrl}/loans`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ book_id: 1, nombre_usuario: 'User' });
      req.flush({ success: true, data: created });
    });
  });

  describe('returnLoan()', () => {
    it('should POST /loans/return', () => {
      const returned: Loan = { id: 1, book_id: 1, usuario_id: null, nombre_usuario: 'U', fecha_prestamo: '', fecha_devolucion: new Date().toISOString(), estado: 'devuelto' };
      service.returnLoan(1).subscribe(r => expect(r).toEqual(returned));
      const req = httpMock.expectOne(`${environment.apiUrl}/loans/return`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ id: 1 });
      req.flush({ success: true, data: returned });
    });
  });
});
