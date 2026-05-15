import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { BookService } from './book.service';
import { environment } from '../../environments/environment';

describe('BookService', () => {
  let service: BookService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(BookService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getBooks()', () => {
    it('should GET books with default params', () => {
      const mockResponse = { books: [], pagination: { total: 0, page: 1, limit: 10, totalPages: 0 } };
      service.getBooks().subscribe(res => expect(res).toEqual(mockResponse));
      const req = httpMock.expectOne(`${environment.apiUrl}/books`);
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, data: mockResponse });
    });

    it('should add search, page, limit as query params', () => {
      service.getBooks('test', 2, 5).subscribe();
      const req = httpMock.expectOne(r => r.url === `${environment.apiUrl}/books`);
      expect(req.request.params.get('search')).toBe('test');
      expect(req.request.params.get('page')).toBe('2');
      expect(req.request.params.get('limit')).toBe('5');
      req.flush({ success: true, data: { books: [], pagination: { total: 0, page: 1, limit: 10, totalPages: 0 } } });
    });
  });

  describe('getBook()', () => {
    it('should GET single book by id', () => {
      const mockBook = { id: 1, titulo: 'Test', autor: 'A', categoria: 'N', isbn: '123', anio: 2024, disponible: true };
      service.getBook(1).subscribe(book => expect(book).toEqual(mockBook));
      const req = httpMock.expectOne(`${environment.apiUrl}/books/1`);
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, data: mockBook });
    });
  });

  describe('addBook()', () => {
    it('should POST new book', () => {
      const newBook = { titulo: 'New', autor: 'A', categoria: 'N', isbn: '9780000000001', anio: 2024, disponible: true };
      const created = { id: 1, ...newBook };
      service.addBook(newBook).subscribe(book => expect(book).toEqual(created));
      const req = httpMock.expectOne(`${environment.apiUrl}/books`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(newBook);
      req.flush({ success: true, data: created });
    });
  });

  describe('toggleAvailability()', () => {
    it('should PATCH disponible', () => {
      const updated = { id: 1, titulo: 'T', autor: 'A', categoria: 'N', isbn: '123', anio: 2024, disponible: false };
      service.toggleAvailability(1, false).subscribe(book => expect(book).toEqual(updated));
      const req = httpMock.expectOne(`${environment.apiUrl}/books/1`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual({ disponible: false });
      req.flush({ success: true, data: updated });
    });
  });

  describe('getStats()', () => {
    it('should GET /books/stats', () => {
      const stats = { total: '10', available: '7', borrowed: '3' };
      service.getStats().subscribe(s => expect(s).toEqual(stats));
      const req = httpMock.expectOne(`${environment.apiUrl}/books/stats`);
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, data: stats });
    });
  });
});
