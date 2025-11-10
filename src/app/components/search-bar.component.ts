import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, takeUntil } from 'rxjs';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-search-bar',
  standalone: true,
  imports: [FormsModule, CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="search-bar">
      <input
        type="text"
        [value]="searchValue"
        (input)="onInput($event)"
        (keyup.enter)="onSearch()"
        placeholder="Enter CMA ID"
        class="search-input"
        [attr.aria-label]="'CMA ID search input'"
        [attr.aria-describedby]="'search-help'"
      />
      <button
        type="button"
        (click)="onSearch()"
        class="search-button"
        [attr.aria-label]="'Search for CMA data'">
        Search
      </button>
      <span id="search-help" class="sr-only">Enter a CMA ID and press Enter or click Search</span>
    </div>
  `,
  styles: [`
    .search-bar {
      display: flex;
      gap: 0.5rem;
      align-items: center;
    }

    .search-input {
      flex: 1;
      padding: 0.75rem 1rem;
      border: 2px solid #e0e0e0;
      border-radius: 4px;
      font-size: 1rem;
      transition: border-color 0.2s;
    }

    .search-input:focus {
      outline: none;
      border-color: #667eea;
    }

    .search-button {
      padding: 0.75rem 1.5rem;
      background: #667eea;
      color: white;
      border: none;
      border-radius: 4px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s;
    }

    .search-button:hover {
      background: #5568d3;
    }

    .search-button:focus {
      outline: 2px solid #667eea;
      outline-offset: 2px;
    }

    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border-width: 0;
    }
  `]
})
export class SearchBarComponent implements OnInit, OnDestroy {
  @Input() defaultValue: string = '';
  @Output() search = new EventEmitter<string>();

  searchValue: string = '';
  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.searchValue = this.defaultValue;
    
    // Debounce search input (300ms)
    this.searchSubject.pipe(
      debounceTime(300),
      takeUntil(this.destroy$)
    ).subscribe(value => {
      // Debounced search is handled via button/Enter, not auto-search
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.searchSubject.complete();
  }

  onInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchValue = target.value;
    this.searchSubject.next(this.searchValue);
  }

  onSearch(): void {
    if (this.searchValue.trim()) {
      this.search.emit(this.searchValue.trim());
    }
  }
}

