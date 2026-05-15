import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { ToastService } from './toast.service';
import { authInterceptor } from './auth.interceptor';
import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';

describe('authInterceptor', () => {
  let httpMock: HttpTestingController;
  let http: HttpClient;
  let toastService: jasmine.SpyObj<ToastService>;

  function configureTestbed(spies?: { auth?: Partial<jasmine.SpyObj<AuthService>> }) {
    const authSpy = jasmine.createSpyObj('AuthService', ['isLoggedIn', 'refreshSession', 'logout']);
    authSpy.isLoggedIn.and.returnValue(false);

    if (spies?.auth) {
      Object.assign(authSpy, spies.auth);
    }

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: authSpy },
        { provide: ToastService, useValue: toastService },
        { provide: Router, useValue: jasmine.createSpyObj('Router', ['navigate']) },
      ],
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  }

  beforeEach(() => {
    toastService = jasmine.createSpyObj('ToastService', ['error']);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should add withCredentials to every request', () => {
    configureTestbed();
    http.get('/test').subscribe();
    const req = httpMock.expectOne('/test');
    expect(req.request.withCredentials).toBeTrue();
    req.flush({});
  });

  it('should try refresh on 401 when logged in', () => {
    const authSpy = jasmine.createSpyObj('AuthService', ['isLoggedIn', 'refreshSession', 'logout']);
    authSpy.isLoggedIn.and.returnValue(true);
    authSpy.refreshSession.and.returnValue(of(undefined));

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: authSpy },
        { provide: ToastService, useValue: toastService },
        { provide: Router, useValue: jasmine.createSpyObj('Router', ['navigate']) },
      ],
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);

    http.get('/test').subscribe({ error: () => {} });
    const req = httpMock.expectOne('/test');
    req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });

    expect(authSpy.refreshSession).toHaveBeenCalled();

    const retryReq = httpMock.expectOne('/test');
    retryReq.flush({});
  });

  it('should show error toast on 403', () => {
    configureTestbed();
    http.get('/test').subscribe({ error: () => {} });
    const req = httpMock.expectOne('/test');
    req.flush('Forbidden', { status: 403, statusText: 'Forbidden' });
    expect(toastService.error).toHaveBeenCalledWith('No tenés permisos para esta acción.');
  });

  it('should show error toast on 429', () => {
    configureTestbed();
    http.get('/test').subscribe({ error: () => {} });
    const req = httpMock.expectOne('/test');
    req.flush('Too Many', { status: 429, statusText: 'Too Many Requests' });
    expect(toastService.error).toHaveBeenCalledWith('Demasiadas peticiones. Esperá un momento.');
  });

  it('should show server error message when available', () => {
    configureTestbed();
    http.get('/test').subscribe({ error: () => {} });
    const req = httpMock.expectOne('/test');
    req.flush({ error: 'Email ya registrado' }, { status: 409, statusText: 'Conflict' });
    expect(toastService.error).toHaveBeenCalledWith('Email ya registrado');
  });

  it('should show generic 500 message on server error', () => {
    configureTestbed();
    http.get('/test').subscribe({ error: () => {} });
    const req = httpMock.expectOne('/test');
    req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
    expect(toastService.error).toHaveBeenCalledWith('Error del servidor. Intentá de nuevo más tarde.');
  });
});
