import { Injectable } from '@angular/core';
import { CanLoad, Route, Router, UrlSegment, UrlTree } from '@angular/router';
import { PlayersService } from '@pg/game/services/players.service';
import { ROUTES_URLS } from '@shared/constants/routes';

@Injectable()
export class PlayerInGameGuard implements CanLoad {
  constructor(private playersService: PlayersService, private router: Router) {}
  canLoad(_: Route, _1: UrlSegment[]): boolean | UrlTree {
    return !!this.playersService.myPlayer || this.router.parseUrl(ROUTES_URLS.game);
  }
}
