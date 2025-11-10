import { HttpInterceptorFn } from '@angular/common/http';

/**
 * HTTP interceptor to add API headers to all requests
 */
export const apiInterceptor: HttpInterceptorFn = (req, next) => {
  // Clone the request and add headers
  const clonedRequest = req.clone({
    setHeaders: {
      'Authorization': 'Bearer test',
      'Content-Type': 'application/json'
    }
  });

  return next(clonedRequest);
};

