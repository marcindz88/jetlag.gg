import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { GameCockpitComponent } from '@pg/game/game-cockpit/containers/game-cockpit/game-cockpit.component';

const routes: Routes = [
  {
    path: '',
    component: GameCockpitComponent,
  },
  {
    path: '**',
    redirectTo: '',
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class GameCockpitRoutingModule {}
