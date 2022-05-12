import { Component, Input } from '@angular/core';
import { PlanePosition } from '../../../players/models/player.types';

@Component({
  selector: 'pg-plane-stats',
  templateUrl: './plane-stats.component.html',
  styleUrls: ['./plane-stats.component.scss'],
})
export class PlaneStatsComponent {
  @Input() planePosition: PlanePosition | null = null;
}
