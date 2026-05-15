import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('init()', () => {
    it('should load user from /auth/me on init', () => {
      const mockUser = { id: 1, nombre: 'Admin', email: 'admin@test.com', rol: 'admin' };
      service.init();
      const req = httpMock.expectOne(`${environment.apiUrl}/auth/me`);
      expect(req.request.method).toBe('GET');
      expect(req.request.withCredentials).toBeTrue();
      req.flush({ success: true, data: { user: mockUser } });
      expect(service.currentUser()).toEqual(mockUser);
      expect(service.isLoggedIn()).toBeTrue();
      expect(service.isAdmin()).toBeTrue();
    });

    it('should set user to null on error', () => {
      service.init();
      const req = httpMock.expectOne(`${environment.apiUrl}/auth/me`);
      req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });
      expect(service.currentUser()).toBeNull();
      expect(service.isLoggedIn()).toBeFalse();
    });

    it('should not call /auth/me twice', () => {
      service.init();
      httpMock.expectOne(`${environment.apiUrl}/auth/me`).flush({ success: true, data: { user: { id: 1, nombre: 'A', email: 'a@a.com', rol: 'usuario' } } });
      service.init();
      httpMock.expectNone(`${environment.apiUrl}/auth/me`);
    });
  });

  describe('login()', () => {
    it('should POST credentials and set user', () => {
      const mockUser = { id: 2, nombre: 'User', email: 'u@test.com', rol: 'usuario' };
      service.login('u@test.com', 'pass123').subscribe(user => {
        expect(user).toEqual(mockUser);
      });
      const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ email: 'u@test.com', password: 'pass123' });
      req.flush({ success: true, data: { user: mockUser } });
      expect(service.currentUser()).toEqual(mockUser);
      expect(service.isLoggedIn()).toBeTrue();
      expect(service.isAdmin()).toBeFalse();
    });
  });

  describe('register()', () => {
    it('should POST registration and set user', () => {
      const mockUser = { id: 3, nombre: 'New', email: 'n@test.com', rol: 'usuario' };
      service.register('New', 'n@test.com', 'pass123').subscribe(user => {
        expect(user).toEqual(mockUser);
      });
      const req = httpMock.expectOne(`${environment.apiUrl}/auth/register`);
      expect(req.request.body).toEqual({ nombre: 'New', email: 'n@test.com', password: 'pass123' });
      req.flush({ success: true, data: { user: mockUser } });
      expect(service.currentUser()).toEqual(mockUser);
    });
  });

  describe('logout()', () => {
    it('should POST logout and clear user', () => {
      service['userSignal'].set({ id: 1, nombre: 'A', email: 'a@a.com', rol: 'usuario' });
      service.logout();
      const req = httpMock.expectOne(`${environment.apiUrl}/auth/logout`);
      expect(req.request.method).toBe('POST');
      req.flush({});
      expect(service.currentUser()).toBeNull();
      expect(service.isLoggedIn()).toBeFalse();
    });
  });

  describe('refreshSession()', () => {
    it('should POST /auth/refresh', () => {
      service.refreshSession().subscribe();
      const req = httpMock.expectOne(`${environment.apiUrl}/auth/refresh`);
      expect(req.request.method).toBe('POST');
      req.flush({ success: true, data: {} });
    });
  });

  describe('computed signals', () => {
    it('isAdmin should be true for admin role', () => {
      service['userSignal'].set({ id: 1, nombre: 'A', email: 'a@a.com', rol: 'admin' });
      expect(service.isAdmin()).toBeTrue();
    });

    it('isAdmin should be false for usuario role', () => {
      service['userSignal'].set({ id: 2, nombre: 'U', email: 'u@u.com', rol: 'usuario' });
      expect(service.isAdmin()).toBeFalse();
    });
  });
});
