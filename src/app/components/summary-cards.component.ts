import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CmaViewModel } from '../models/cma-view-model.interface';

@Component({
  selector: 'app-summary-cards',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="summary-cards" *ngIf="data">
      <div class="card" *ngIf="data.suburb">
        <div class="card-label">Suburb</div>
        <div class="card-value">{{ data.suburb }}</div>
      </div>
      <div class="card" *ngIf="data.postcode">
        <div class="card-label">Postcode</div>
        <div class="card-value">{{ data.postcode }}</div>
      </div>
      <div class="card" *ngIf="data.medianPrice !== undefined">
        <div class="card-label">Median Price</div>
        <div class="card-value">{{ formatCurrency(data.medianPrice) }}</div>
      </div>
      <div class="card" *ngIf="data.growthRate !== undefined">
        <div class="card-label">Growth Rate</div>
        <div class="card-value">{{ formatPercentage(data.growthRate) }}</div>
      </div>
      <div class="card" *ngIf="data.propertyCount !== undefined">
        <div class="card-label">Properties</div>
        <div class="card-value">{{ formatNumber(data.propertyCount) }}</div>
      </div>
      <div class="card" *ngIf="data.state">
        <div class="card-label">State</div>
        <div class="card-value">{{ data.state }}</div>
      </div>
      <div class="card" *ngIf="data.region">
        <div class="card-label">Region</div>
        <div class="card-value">{{ data.region }}</div>
      </div>
      <div class="card" *ngIf="data.comparables.length > 0">
        <div class="card-label">Comparables</div>
        <div class="card-value">{{ data.comparables.length }}</div>
      </div>
    </div>
  `,
  styles: [`
    .summary-cards {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 1rem;
      margin-bottom: 2rem;
    }

    .card {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 1.5rem;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .card:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
    }

    .card-label {
      font-size: 0.85rem;
      opacity: 0.9;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 0.5rem;
    }

    .card-value {
      font-size: 1.5rem;
      font-weight: 600;
    }

    @media (max-width: 768px) {
      .summary-cards {
        grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
      }
    }
  `]
})
export class SummaryCardsComponent {
  @Input() data: CmaViewModel | null = null;

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  }

  formatPercentage(value: number): string {
    return `${(value * 100).toFixed(2)}%`;
  }

  formatNumber(value: number): string {
    return new Intl.NumberFormat('en-AU').format(value);
  }
}

