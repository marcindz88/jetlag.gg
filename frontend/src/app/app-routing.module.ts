import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    redirectTo: '/intro',
    pathMatch: 'full',
  },
  {
    path: 'intro',
    loadChildren: () => import('./intro/intro.module').then((m) => m.IntroModule),
  },
  {
    path: 'game',
    loadChildren: () =>
      import('./game-base/game-base.module').then((m) => m.GameBaseModule),
  },
  {
    path: '**',
    redirectTo: '/intro',
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {
}
