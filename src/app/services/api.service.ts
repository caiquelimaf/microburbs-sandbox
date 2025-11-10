import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError, timer } from 'rxjs';
import { retryWhen, mergeMap, finalize } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { CmaResponseRaw } from '../models/cma-response-raw.interface';
import { StorageService } from './storage.service';

interface CachedResponse {
  data: CmaResponseRaw;
  timestamp: number;
}

/**
 * Service for API calls with retry logic and caching
 */
@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly cachePrefix = 'cma_';
  private readonly cacheExpiryMs = 24 * 60 * 60 * 1000; // 24 hours

  constructor(
    private http: HttpClient,
    private storage: StorageService
  ) {}

  /**
   * Get CMA data by ID with retry logic and caching
   */
  getCma(id: string): Observable<CmaResponseRaw> {
    const url = `${environment.apiBase}/cma?id=${id}`;
    
    // Explicitly set headers to ensure Authorization is sent
    const headers = {
      'Authorization': 'Bearer test',
      'Content-Type': 'application/json'
    };
    
    return this.http.get<CmaResponseRaw>(url, { headers }).pipe(
      retryWhen(errors =>
        errors.pipe(
          mergeMap((error, index) => {
            const retryAttempt = index + 1;
            // Max 3 retries with exponential backoff
            if (retryAttempt > 3) {
              return throwError(() => error);
            }
            // Exponential backoff: 1s, 2s, 4s
            const delay = Math.pow(2, retryAttempt - 1) * 1000;
            return timer(delay);
          })
        )
      )
    );
  }

  /**
   * Get cached CMA data if available
   */
  getCachedCma(id: string): CmaResponseRaw | null {
    const cacheKey = `${this.cachePrefix}${id}`;
    const cached = this.storage.get<CachedResponse>(cacheKey);
    
    if (!cached) {
      return null;
    }

    // Check if cache is expired
    const age = Date.now() - cached.timestamp;
    if (age > this.cacheExpiryMs) {
      this.storage.remove(cacheKey);
      return null;
    }

    return cached.data;
  }

  /**
   * Cache CMA data
   */
  cacheCma(id: string, data: CmaResponseRaw): void {
    const cacheKey = `${this.cachePrefix}${id}`;
    const cached: CachedResponse = {
      data,
      timestamp: Date.now()
    };
    this.storage.set(cacheKey, cached);
  }
}

