import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PlayerInGameGuard } from '@pg/game/guards/player-in-game.guard';
import { GAME_ROUTES, ROUTES_URLS } from '@shared/constants/routes';

import { GameComponent } from './game.component';

const routes: Routes = [
  {
    path: '',
    component: GameComponent,
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: GAME_ROUTES.intro,
      },
      {
        path: GAME_ROUTES.intro,
        loadChildren: () => import('./game-intro/game-intro.module').then(m => m.GameIntroModule),
      },
      {
        path: GAME_ROUTES.cockpit,
        loadChildren: () => import('./game-cockpit/game-cockpit.module').then(m => m.GameCockpitModule),
        canLoad: [PlayerInGameGuard],
      },
      {
        path: GAME_ROUTES.over,
        loadChildren: () => import('./game-over/game-over.module').then(m => m.GameOverModule),
        canLoad: [PlayerInGameGuard],
      },
    ],
  },
  {
    path: '**',
    redirectTo: ROUTES_URLS.game,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
  providers: [PlayerInGameGuard],
})
export class GameRoutingModule {}
