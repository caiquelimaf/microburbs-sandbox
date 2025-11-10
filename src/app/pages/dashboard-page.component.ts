import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject, Observable, of, combineLatest } from 'rxjs';
import { switchMap, catchError, map, startWith } from 'rxjs/operators';
import { ApiService } from '../services/api.service';
import { adaptCmaResponse } from '../adapters/cma.adapter';
import { CmaViewModel } from '../models/cma-view-model.interface';
import { environment } from '../../environments/environment';

import { SearchBarComponent } from '../components/search-bar.component';
import { SummaryCardsComponent } from '../components/summary-cards.component';
import { CmaTableComponent } from '../components/cma-table.component';
import { CmaChartComponent } from '../components/cma-chart.component';
import { LoadingSpinnerComponent } from '../components/loading-spinner.component';
import { ErrorAlertComponent } from '../components/error-alert.component';

interface DashboardState {
  loading: boolean;
  error: string | null;
  data: CmaViewModel | null;
  lastUpdated: Date | null;
}

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [
    CommonModule,
    SearchBarComponent,
    SummaryCardsComponent,
    CmaTableComponent,
    CmaChartComponent,
    LoadingSpinnerComponent,
    ErrorAlertComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="dashboard-page">
      <header class="dashboard-header">
        <h1>Property Insights Dashboard</h1>
        <app-search-bar
          [defaultValue]="currentId"
          (search)="onSearch($event)">
        </app-search-bar>
      </header>

      <div class="dashboard-content">
        <ng-container *ngIf="state$ | async as state">
          <app-loading-spinner *ngIf="state.loading"></app-loading-spinner>

          <app-error-alert
            *ngIf="state.error && !state.loading"
            [error]="state.error"
            (onRetry)="loadCmaData(currentId)">
          </app-error-alert>

          <div *ngIf="state.data && !state.error && !state.loading" class="dashboard-main">
            <div class="last-updated" *ngIf="state.lastUpdated">
              Last updated: {{ formatDate(state.lastUpdated) }}
            </div>

            <app-summary-cards [data]="state.data"></app-summary-cards>

            <div class="dashboard-grid">
              <div class="chart-section">
                <app-cma-chart [data]="state.data.chartData"></app-cma-chart>
              </div>
              <div class="table-section">
                <app-cma-table [items]="state.data.comparables"></app-cma-table>
              </div>
            </div>
          </div>
        </ng-container>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-page {
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 2rem;
    }

    .dashboard-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .dashboard-header h1 {
      color: white;
      margin: 0;
      font-size: 2rem;
      text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
    }

    .dashboard-content {
      max-width: 1400px;
      margin: 0 auto;
    }

    .last-updated {
      text-align: right;
      color: white;
      font-size: 0.9rem;
      margin-bottom: 1rem;
      opacity: 0.9;
    }

    .dashboard-main {
      background: transparent;
    }

    .dashboard-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 2rem;
      margin-top: 2rem;
    }

    @media (max-width: 1024px) {
      .dashboard-grid {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 768px) {
      .dashboard-page {
        padding: 1rem;
      }

      .dashboard-header {
        flex-direction: column;
        align-items: stretch;
      }

      .dashboard-header h1 {
        font-size: 1.5rem;
        text-align: center;
      }
    }
  `]
})
export class DashboardPageComponent implements OnInit {
  currentId = environment.defaultCmaId;
  state$: Observable<DashboardState>;
  private searchSubject = new BehaviorSubject<string>(this.currentId);

  constructor(
    private apiService: ApiService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    // Create observable state from search subject
    this.state$ = this.searchSubject.pipe(
      switchMap(id => this.loadCmaData(id)),
      startWith({ loading: false, error: null, data: null, lastUpdated: null } as DashboardState)
    );
  }

  ngOnInit(): void {
    // Check route params for CMA ID
    this.route.params.subscribe(params => {
      const id = params['id'];
      if (id) {
        this.currentId = id;
        this.searchSubject.next(id);
      } else {
        // Load default if no route param
        this.searchSubject.next(this.currentId);
      }
    });
  }

  onSearch(id: string): void {
    this.currentId = id;
    this.router.navigate(['/cma', id]);
    this.searchSubject.next(id);
  }

  getCurrentId(): string {
    return this.currentId;
  }

  loadCmaData(id: string): Observable<DashboardState> {
    // Check cache first (stale-while-revalidate pattern)
    const cached = this.apiService.getCachedCma(id);
    
    if (cached) {
      // Display cached data immediately
      const cachedViewModel = adaptCmaResponse(cached);
      const cachedState: DashboardState = {
        loading: false,
        error: null,
        data: cachedViewModel,
        lastUpdated: cachedViewModel.lastUpdated || null
      };

      // Fetch fresh data in background (don't trigger update to avoid loops)
      this.apiService.getCma(id).subscribe({
        next: (freshData) => {
          this.apiService.cacheCma(id, freshData);
          // Don't call searchSubject.next() here - it causes infinite loops
          // Cache is updated, next time user searches or page reloads, fresh data will be shown
        },
        error: (error) => {
          console.error('Background refresh failed:', error);
          // Don't update state on background error, keep showing cached data
        }
      });

      return of(cachedState);
    }

    // No cache, fetch fresh data
    return this.apiService.getCma(id).pipe(
      map(response => {
        // Cache the response
        this.apiService.cacheCma(id, response);
        
        // Transform to view model
        const viewModel = adaptCmaResponse(response);
        
        return {
          loading: false,
          error: null,
          data: viewModel,
          lastUpdated: viewModel.lastUpdated || null
        } as DashboardState;
      }),
      catchError(error => {
        const errorMessage = error.status 
          ? `HTTP ${error.status}: ${error.message || 'Failed to load data'}`
          : `Network error: ${error.message || 'Failed to connect to server'}`;
        
        return of({
          loading: false,
          error: errorMessage,
          data: null,
          lastUpdated: null
        } as DashboardState);
      }),
      startWith({
        loading: true,
        error: null,
        data: null,
        lastUpdated: null
      } as DashboardState)
    );
  }

  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('en-AU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  }
}

