import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { UserLoggedGuard } from '@auth/guards/user-logged.guard';
import { UserNotLoggedGuard } from '@auth/guards/user-not-logged.guard';
import { ROUTES } from '@shared/constants/routes';

const routes: Routes = [
  {
    path: '',
    redirectTo: `/${ROUTES.login}`,
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
    loadChildren: () => import('./game-base/game-base.module').then(m => m.GameBaseModule),
  },
  {
    path: '**',
    redirectTo: `/${ROUTES.login}`,
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
