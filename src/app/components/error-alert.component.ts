import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-error-alert',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="error-alert" role="alert" *ngIf="error">
      <div class="error-content">
        <h3 class="error-title">Error</h3>
        <p class="error-message">{{ error }}</p>
        <button 
          type="button" 
          class="error-button"
          (click)="onRetry.emit()"
          aria-label="Try again">
          Try again
        </button>
      </div>
    </div>
  `,
  styles: [`
    .error-alert {
      background: #ff6b6b;
      color: white;
      padding: 1.5rem;
      border-radius: 8px;
      margin: 1rem 0;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }

    .error-content {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .error-title {
      margin: 0;
      font-size: 1.2rem;
      font-weight: 600;
    }

    .error-message {
      margin: 0;
      font-size: 0.95rem;
      line-height: 1.5;
    }

    .error-button {
      background: white;
      color: #ff6b6b;
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: 4px;
      font-size: 0.9rem;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s;
      align-self: flex-start;
    }

    .error-button:hover {
      background: #f0f0f0;
    }

    .error-button:focus {
      outline: 2px solid white;
      outline-offset: 2px;
    }
  `]
})
export class ErrorAlertComponent {
  @Input() error: string | null = null;
  @Output() onRetry = new EventEmitter<void>();
}

