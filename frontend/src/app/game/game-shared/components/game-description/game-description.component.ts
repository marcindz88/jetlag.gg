import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'pg-game-description',
  templateUrl: './game-description.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GameDescriptionComponent {}
