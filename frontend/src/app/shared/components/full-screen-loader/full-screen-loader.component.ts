import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'pg-full-screen-loader',
  templateUrl: './full-screen-loader.component.html',
  styleUrls: ['./full-screen-loader.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FullScreenLoaderComponent {}
