import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { GameLoaderComponent } from '@pg/game-base/containers/game-loader/game-loader.component';
import { ROUTES } from '@shared/constants/routes';

import { GameMainComponent } from './containers/game-main/game-main.component';

const routes: Routes = [
  {
    path: '',
    redirectTo: ROUTES.gameLoad,
  },
  {
    path: ROUTES.gameLoad,
    component: GameLoaderComponent,
  },
  {
    path: ROUTES.gameMain,
    component: GameMainComponent,
  },
  {
    path: '**',
    redirectTo: `/${ROUTES.game}/${ROUTES.gameLoad}`,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class GameBaseRoutingModule {}
