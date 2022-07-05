import { HTTP_INTERCEPTORS, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable, Provider } from '@angular/core';
import { UserService } from '@auth/services/user.service';

@Injectable()
export class AuthInterceptorService implements HttpInterceptor {
  constructor(private userService: UserService) {}

  intercept(req: HttpRequest<unknown>, next: HttpHandler) {
    const user = this.userService.user$.value;

    if (!user) {
      return next.handle(req);
    }
    const modifiedReq = req.clone({
      headers: req.headers.set('Token', user.token),
    });
    return next.handle(modifiedReq);
  }
}

export const authInterceptorProvider: Provider = {
  provide: HTTP_INTERCEPTORS,
  useClass: AuthInterceptorService,
  multi: true,
};
