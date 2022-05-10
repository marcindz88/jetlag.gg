import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ROUTES } from './shared/constants/routes';

const routes: Routes = [
  {
    path: '',
    redirectTo: '/intro',
    pathMatch: 'full',
  },
  {
    path: ROUTES.intro,
    loadChildren: () => import('./intro/intro.module').then(m => m.IntroModule),
  },
  {
    path: ROUTES.game,
    // canLoad: [MyPlayerGuard],
    loadChildren: () => import('./game-base/game-base.module').then(m => m.GameBaseModule),
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
export class AppRoutingModule {}
