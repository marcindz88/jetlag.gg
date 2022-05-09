import { Component } from '@angular/core';
import { OtherPlayer } from '../../models/player.types';
import { PlayersService } from '../../services/players.service';
import { BehaviorSubject } from 'rxjs';

@Component({
  selector: 'pg-players-summary',
  templateUrl: './players-summary.component.html',
  styleUrls: ['./players-summary.component.scss'],
})
export class PlayersSummaryComponent {
  players$: BehaviorSubject<OtherPlayer[]> = this.playersService.players$;

  constructor(private playersService: PlayersService) {}
}
