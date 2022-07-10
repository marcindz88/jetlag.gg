import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { GameIntroComponent } from '@pg/game/game-intro/containers/game-intro/game-intro.component';

const routes: Routes = [
  {
    path: '',
    component: GameIntroComponent,
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
export class GameIntroRoutingModule {}
