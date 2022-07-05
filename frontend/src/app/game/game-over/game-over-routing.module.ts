import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { GameOverComponent } from '@pg/game/game-over/containers/game-over/game-over.component';

const routes: Routes = [
  {
    path: '',
    component: GameOverComponent,
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
export class GameOverRoutingModule {}
