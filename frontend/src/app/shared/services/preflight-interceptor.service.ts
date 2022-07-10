import { HTTP_INTERCEPTORS, HttpHandler, HttpHeaders, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable, Provider } from '@angular/core';

@Injectable()
export class PreflightInterceptorService implements HttpInterceptor {
  intercept(req: HttpRequest<unknown>, next: HttpHandler) {
    if (req.method !== 'GET') {
      return next.handle(req);
    }
    const modifiedReq = req.clone({
      headers: new HttpHeaders().set('content-type', 'text/plain'),
    });
    return next.handle(modifiedReq);
  }
}

export const preflightInterceptorProvider: Provider = {
  provide: HTTP_INTERCEPTORS,
  useClass: PreflightInterceptorService,
  multi: true,
};
