import { Injectable } from '@angular/core';
import { CanLoad, Route, Router, UrlSegment, UrlTree } from '@angular/router';
import { ROUTES_URLS } from '@shared/constants/routes';

import { UserService } from '../services/user.service';

@Injectable({
  providedIn: 'root',
})
export class UserLoggedGuard implements CanLoad {
  constructor(private userService: UserService, private router: Router) {}
  canLoad(_: Route, _1: UrlSegment[]): boolean | UrlTree {
    return !!this.userService.user$.value || this.router.parseUrl(ROUTES_URLS.login);
  }
}
