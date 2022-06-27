import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { Router } from '@angular/router';
import { UserService } from '@auth/services/user.service';
import { UntilDestroy } from '@ngneat/until-destroy';
import { Player } from '@pg/game-base/players/models/player';
import { DeathCauseEnum } from '@pg/game-base/players/models/player.types';
import { ROUTES } from '@shared/constants/routes';

@UntilDestroy()
@Component({
  selector: 'pg-game-over',
  templateUrl: './game-over.component.html',
  styleUrls: ['game-over.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GameOverComponent {
  @Input() player?: Player;

  readonly DeathCauseEnum = DeathCauseEnum;

  constructor(private router: Router, private userService: UserService) {}

  restart() {
    this.userService.resetUser();
    void this.router.navigate(['/', ROUTES.login]);
  }
}
