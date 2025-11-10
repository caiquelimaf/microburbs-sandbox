import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ApiService } from './api.service';
import { StorageService } from './storage.service';
import { environment } from '../../environments/environment';

describe('ApiService', () => {
  let service: ApiService;
  let httpMock: HttpTestingController;
  let storageService: StorageService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ApiService, StorageService]
    });
    service = TestBed.inject(ApiService);
    httpMock = TestBed.inject(HttpTestingController);
    storageService = TestBed.inject(StorageService);
    
    // Clear storage before each test
    storageService.clear();
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch CMA data successfully', (done) => {
    const mockResponse = { suburb: 'Test Suburb', medianPrice: 500000 };
    const id = 'TEST123';

    service.getCma(id).subscribe(response => {
      expect(response).toEqual(mockResponse);
      done();
    });

    const req = httpMock.expectOne(`${environment.apiBase}/cma?id=${id}`);
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('should retry on failure with exponential backoff', (done) => {
    const id = 'TEST123';
    let attemptCount = 0;

    service.getCma(id).subscribe({
      next: () => {
        expect(attemptCount).toBeGreaterThan(1);
        done();
      },
      error: () => {
        // Should fail after max retries
        expect(attemptCount).toBe(4); // Initial + 3 retries
        done();
      }
    });

    const requests = httpMock.match(`${environment.apiBase}/cma?id=${id}`);
    requests.forEach(req => {
      attemptCount++;
      if (attemptCount < 4) {
        req.error(new ErrorEvent('Network error'));
      } else {
        req.flush({ suburb: 'Test' });
      }
    });
  });

  it('should cache CMA data', () => {
    const id = 'TEST123';
    const mockData = { suburb: 'Test', medianPrice: 500000 };

    // Cache the data
    service.cacheCma(id, mockData);

    // Retrieve from cache
    const cached = service.getCachedCma(id);
    expect(cached).toEqual(mockData);
  });

  it('should return null for expired cache', () => {
    const id = 'TEST123';
    const mockData = { suburb: 'Test', medianPrice: 500000 };

    service.cacheCma(id, mockData);

    // Manually expire cache by manipulating storage
    const storage = TestBed.inject(StorageService);
    const cached = storage.get<any>(`cma_${id}`);
    cached.timestamp = Date.now() - (25 * 60 * 60 * 1000); // 25 hours ago
    storage.set(`cma_${id}`, cached);

    const result = service.getCachedCma(id);
    expect(result).toBeNull();
  });
});

