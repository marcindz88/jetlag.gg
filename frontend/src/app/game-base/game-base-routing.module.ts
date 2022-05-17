import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ROUTES } from '@shared/constants/routes';

import { GameMainComponent } from './containers/game-main/game-main.component';

const routes: Routes = [
  {
    path: '',
    component: GameMainComponent,
  },
  {
    path: '**',
    redirectTo: `/${ROUTES.game}`,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class GameBaseRoutingModule {}
