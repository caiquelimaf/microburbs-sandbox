import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { DashboardPageComponent } from './dashboard-page.component';
import { ApiService } from '../services/api.service';
import { StorageService } from '../services/storage.service';

describe('DashboardPageComponent', () => {
  let component: DashboardPageComponent;
  let fixture: ComponentFixture<DashboardPageComponent>;
  let apiService: ApiService;
  let router: Router;
  let route: ActivatedRoute;

  const mockApiService = {
    getCma: jasmine.createSpy('getCma').and.returnValue(of({ suburb: 'Test', medianPrice: 500000 })),
    getCachedCma: jasmine.createSpy('getCachedCma').and.returnValue(null),
    cacheCma: jasmine.createSpy('cacheCma')
  };

  const mockRouter = {
    navigate: jasmine.createSpy('navigate')
  };

  const mockRoute = {
    params: of({})
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardPageComponent, HttpClientTestingModule],
      providers: [
        { provide: ApiService, useValue: mockApiService },
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: mockRoute },
        StorageService
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardPageComponent);
    component = fixture.componentInstance;
    apiService = TestBed.inject(ApiService);
    router = TestBed.inject(Router);
    route = TestBed.inject(ActivatedRoute);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load data on init', (done) => {
    fixture.detectChanges();
    
    component.state$.subscribe(state => {
      if (state.data) {
        expect(state.data.suburb).toBe('Test');
        expect(state.loading).toBe(false);
        done();
      }
    });
  });

  it('should handle search', () => {
    const id = 'NEW123';
    component.onSearch(id);

    expect(component.currentId).toBe(id);
    expect(router.navigate).toHaveBeenCalledWith(['/cma', id]);
  });

  it('should display cached data immediately', (done) => {
    const cachedData = { suburb: 'Cached', medianPrice: 400000 };
    mockApiService.getCachedCma.and.returnValue(cachedData);

    fixture.detectChanges();

    component.state$.subscribe(state => {
      if (state.data) {
        expect(state.data.suburb).toBe('Cached');
        expect(mockApiService.getCachedCma).toHaveBeenCalled();
        done();
      }
    });
  });

  it('should handle errors gracefully', (done) => {
    mockApiService.getCma.and.returnValue(
      throwError(() => ({ status: 404, message: 'Not found' }))
    );

    fixture.detectChanges();

    component.state$.subscribe(state => {
      if (state.error) {
        expect(state.error).toContain('404');
        expect(state.data).toBeNull();
        done();
      }
    });
  });
});

