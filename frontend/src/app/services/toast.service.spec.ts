import { TestBed } from '@angular/core/testing';
import { ToastService } from './toast.service';

describe('ToastService', () => {
  let service: ToastService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ToastService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should start with empty toasts', () => {
    expect(service.toasts$()).toEqual([]);
  });

  it('should add a toast on show()', () => {
    service.show('Hello', 'info');
    const toasts = service.toasts$();
    expect(toasts.length).toBe(1);
    expect(toasts[0].message).toBe('Hello');
    expect(toasts[0].type).toBe('info');
  });

  it('should add a success toast', () => {
    service.success('OK');
    expect(service.toasts$()[0].type).toBe('success');
  });

  it('should add an error toast', () => {
    service.error('Fail');
    expect(service.toasts$()[0].type).toBe('error');
  });

  it('should remove toast by id', () => {
    service.show('Msg', 'info');
    const id = service.toasts$()[0].id;
    service.remove(id);
    expect(service.toasts$()).toEqual([]);
  });

  it('should auto-remove toast after duration', (done) => {
    service.show('Temp', 'info', 50);
    expect(service.toasts$().length).toBe(1);
    setTimeout(() => {
      expect(service.toasts$().length).toBe(0);
      done();
    }, 100);
  });

  it('should auto-remove error toast after 6s', (done) => {
    service.error('Persistent');
    expect(service.toasts$().length).toBe(1);
    setTimeout(() => {
      expect(service.toasts$().length).toBe(0);
      done();
    }, 6500);
  }, 7000);
});
