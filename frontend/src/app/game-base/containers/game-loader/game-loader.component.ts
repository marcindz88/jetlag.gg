import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TextureModelsService } from '@pg/game-base/services/texture-models.service';
import { PlayersService } from '@pg/players/services/players.service';
import { ROUTES } from '@shared/constants/routes';
import { combineLatest, filter } from 'rxjs';

@UntilDestroy()
@Component({
  selector: 'pg-game-loader',
  templateUrl: './game-loader.component.html',
  styleUrls: ['./game-loader.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GameLoaderComponent {
  constructor(
    private playersService: PlayersService,
    private textureModelsService: TextureModelsService,
    private router: Router
  ) {
    this.playersService.fetchPlayers();

    combineLatest([playersService.loading$, textureModelsService.loading$])
      .pipe(
        untilDestroyed(this),
        filter(loadings => loadings.every(loading => !loading))
      )
      .subscribe(() => void this.router.navigate([ROUTES.root, ROUTES.game, ROUTES.gameMain]));
  }
}
