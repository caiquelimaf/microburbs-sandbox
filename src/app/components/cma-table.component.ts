import { Component, ChangeDetectionStrategy, computed, signal, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ComparableItem } from '../models/comparable-item.interface';

type SortColumn = keyof ComparableItem | '';
type SortDirection = 'asc' | 'desc' | '';

@Component({
  selector: 'app-cma-table',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="table-container">
      <div class="table-title-section">
        <h2 class="table-title">Similar Properties Comparison</h2>
        <p class="table-subtitle">Detailed information about comparable properties in the area</p>
      </div>
      
      <div class="table-header" *ngIf="items().length > 0">
        <input
          type="text"
          [(ngModel)]="filterText"
          (input)="onFilterChange()"
          placeholder="Filter table..."
          class="filter-input"
          aria-label="Filter table data"
        />
      </div>
      
      <div class="empty-state" *ngIf="filteredItems().length === 0">
        <p>{{ items().length === 0 ? 'No comparable data available' : 'No items match your filter' }}</p>
      </div>

      <table *ngIf="filteredItems().length > 0" class="data-table">
        <thead>
          <tr>
            <th (click)="sort('address')" class="sortable">
              Address
              <span class="sort-indicator">{{ getSortIndicator('address') }}</span>
            </th>
            <th (click)="sort('price')" class="sortable">
              Price
              <span class="sort-indicator">{{ getSortIndicator('price') }}</span>
            </th>
            <th (click)="sort('date')" class="sortable">
              Date
              <span class="sort-indicator">{{ getSortIndicator('date') }}</span>
            </th>
            <th (click)="sort('bedrooms')" class="sortable">
              Bedrooms
              <span class="sort-indicator">{{ getSortIndicator('bedrooms') }}</span>
            </th>
            <th (click)="sort('bathrooms')" class="sortable">
              Bathrooms
              <span class="sort-indicator">{{ getSortIndicator('bathrooms') }}</span>
            </th>
            <th (click)="sort('landSize')" class="sortable">
              Land Size
              <span class="sort-indicator">{{ getSortIndicator('landSize') }}</span>
            </th>
            <th *ngIf="hasPropertyType()">Type</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let item of filteredItems()">
            <td>{{ item.address || 'N/A' }}</td>
            <td>{{ formatCurrency(item.price) }}</td>
            <td>{{ formatDate(item.date) }}</td>
            <td>{{ item.bedrooms ?? 'N/A' }}</td>
            <td>{{ item.bathrooms ?? 'N/A' }}</td>
            <td>{{ formatLandSize(item.landSize) }}</td>
            <td *ngIf="hasPropertyType()">{{ item.propertyType || 'N/A' }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  `,
  styles: [`
    .table-container {
      background: white;
      border-radius: 8px;
      padding: 1.5rem;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .table-title-section {
      margin-bottom: 1.5rem;
      padding-bottom: 1rem;
      border-bottom: 2px solid #e0e0e0;
    }

    .table-title {
      margin: 0 0 0.5rem 0;
      font-size: 1.5rem;
      font-weight: 600;
      color: #333;
    }

    .table-subtitle {
      margin: 0;
      font-size: 0.9rem;
      color: #666;
    }

    .table-header {
      margin-bottom: 1rem;
    }

    .filter-input {
      width: 100%;
      padding: 0.75rem;
      border: 2px solid #e0e0e0;
      border-radius: 4px;
      font-size: 0.95rem;
    }

    .filter-input:focus {
      outline: none;
      border-color: #667eea;
    }

    .empty-state {
      padding: 3rem;
      text-align: center;
      color: #999;
    }

    .data-table {
      width: 100%;
      border-collapse: collapse;
    }

    .data-table th {
      background: #f5f5f5;
      padding: 1rem;
      text-align: left;
      font-weight: 600;
      font-size: 0.9rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #333;
    }

    .sortable {
      cursor: pointer;
      user-select: none;
      position: relative;
    }

    .sortable:hover {
      background: #e8e8e8;
    }

    .sort-indicator {
      margin-left: 0.5rem;
      font-size: 0.8rem;
      color: #667eea;
    }

    .data-table td {
      padding: 0.75rem 1rem;
      border-bottom: 1px solid #e0e0e0;
    }

    .data-table tbody tr:hover {
      background: #f9f9f9;
    }

    .data-table tbody tr:last-child td {
      border-bottom: none;
    }

    @media (max-width: 768px) {
      .data-table {
        font-size: 0.85rem;
      }

      .data-table th,
      .data-table td {
        padding: 0.5rem;
      }
    }
  `]
})
export class CmaTableComponent {
  items = input.required<ComparableItem[]>();

  filterText = '';
  sortColumn = signal<SortColumn>('');
  sortDirection = signal<SortDirection>('');

  filteredItems = computed(() => {
    let result = [...this.items()];

    // Apply filter
    if (this.filterText.trim()) {
      const filter = this.filterText.toLowerCase();
      result = result.filter(item => {
        return Object.values(item).some(value => {
          if (value === null || value === undefined) return false;
          return String(value).toLowerCase().includes(filter);
        });
      });
    }

    // Apply sort
    const column = this.sortColumn();
    const direction = this.sortDirection();
    if (column && direction) {
      result.sort((a, b) => {
        const aVal = a[column];
        const bVal = b[column];
        
        if (aVal === null || aVal === undefined) return 1;
        if (bVal === null || bVal === undefined) return -1;

        let comparison = 0;
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          comparison = aVal - bVal;
        } else {
          comparison = String(aVal).localeCompare(String(bVal));
        }

        return direction === 'asc' ? comparison : -comparison;
      });
    }

    return result;
  });

  sort(column: SortColumn): void {
    if (this.sortColumn() === column) {
      // Toggle direction
      const current = this.sortDirection();
      if (current === 'asc') {
        this.sortDirection.set('desc');
      } else if (current === 'desc') {
        this.sortColumn.set('');
        this.sortDirection.set('');
      } else {
        this.sortDirection.set('asc');
      }
    } else {
      this.sortColumn.set(column);
      this.sortDirection.set('asc');
    }
  }

  getSortIndicator(column: SortColumn): string {
    if (this.sortColumn() !== column) return '';
    const direction = this.sortDirection();
    return direction === 'asc' ? '▲' : '▼';
  }

  onFilterChange(): void {
    // Trigger change detection for computed signal
  }

  hasPropertyType(): boolean {
    return this.items().some((item: ComparableItem) => item.propertyType);
  }

  formatCurrency(value: number | undefined): string {
    if (value === undefined || value === null) return 'N/A';
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  }

  formatDate(value: string | undefined): string {
    if (!value) return 'N/A';
    try {
      const date = new Date(value);
      return date.toLocaleDateString('en-AU');
    } catch {
      return value;
    }
  }

  formatLandSize(value: number | undefined): string {
    if (value === undefined || value === null) return 'N/A';
    return `${value.toLocaleString('en-AU')} m²`;
  }
}

