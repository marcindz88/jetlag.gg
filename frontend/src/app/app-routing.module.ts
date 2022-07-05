import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { UserLoggedGuard } from '@auth/guards/user-logged.guard';
import { UserNotLoggedGuard } from '@auth/guards/user-not-logged.guard';
import { ROUTES, ROUTES_URLS } from '@shared/constants/routes';

const routes: Routes = [
  {
    path: '',
    redirectTo: ROUTES_URLS.login,
    pathMatch: 'full',
  },
  {
    path: ROUTES.login,
    canLoad: [UserNotLoggedGuard],
    loadChildren: () => import('./auth/auth.module').then(m => m.AuthModule),
  },
  {
    path: ROUTES.game,
    canLoad: [UserLoggedGuard],
    loadChildren: () => import('./game/game.module').then(m => m.GameModule),
  },
  {
    path: '**',
    redirectTo: ROUTES_URLS.login,
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
