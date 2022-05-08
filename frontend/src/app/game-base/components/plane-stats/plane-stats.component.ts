import { Component, Input } from '@angular/core';
import { PlaneState } from '../../utils/models/game.types';

@Component({
  selector: 'pg-plane-stats',
  templateUrl: './plane-stats.component.html',
  styleUrls: ['./plane-stats.component.scss'],
})
export class PlaneStatsComponent {
  @Input() planeState: PlaneState | null = null;
}
