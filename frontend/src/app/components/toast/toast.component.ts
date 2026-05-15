import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container">
      <div
        *ngFor="let toast of toastService.toasts$()"
        class="toast"
        [class.toast-success]="toast.type === 'success'"
        [class.toast-error]="toast.type === 'error'"
        [class.toast-info]="toast.type === 'info'"
        (click)="toastService.remove(toast.id)"
      >
        <span class="toast-icon">
          <ng-container [ngSwitch]="toast.type">
            <span *ngSwitchCase="'success'">✓</span>
            <span *ngSwitchCase="'error'">✕</span>
            <span *ngSwitchCase="'info'">ℹ</span>
          </ng-container>
        </span>
        <span class="toast-msg">{{ toast.message }}</span>
      </div>
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      top: 80px;
      right: 20px;
      z-index: 200;
      display: flex;
      flex-direction: column;
      gap: 8px;
      max-width: 380px;
    }
    .toast {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 16px;
      border-radius: 10px;
      box-shadow: 0 4px 16px rgba(0,0,0,.15);
      cursor: pointer;
      animation: slideIn .25s ease-out;
      font-size: .9rem;
      font-weight: 500;
    }
    .toast-success { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
    .toast-error { background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
    .toast-info { background: #d1ecf1; color: #0c5460; border: 1px solid #bee5eb; }
    .toast-icon { font-size: 1.1rem; font-weight: 700; flex-shrink: 0; }
    .toast-msg { flex: 1; }
    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
  `],
})
export class ToastComponent {
  constructor(public toastService: ToastService) {}
}
