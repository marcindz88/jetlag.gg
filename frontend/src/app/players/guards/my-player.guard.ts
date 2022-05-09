import { Injectable } from '@angular/core';
import { CanLoad, Route, Router, UrlSegment, UrlTree } from '@angular/router';
import { MyPlayerService } from '../services/my-player.service';
import { ROUTES } from '../../shared/constants/routes';

@Injectable({
  providedIn: 'root',
})
export class MyPlayerGuard implements CanLoad {
  constructor(private myPlayerService: MyPlayerService, private router: Router) {}
  canLoad(_: Route, _1: UrlSegment[]): boolean | UrlTree {
    return !!this.myPlayerService.player$.value || this.router.createUrlTree([ROUTES.root, ROUTES.intro]);
  }
}
