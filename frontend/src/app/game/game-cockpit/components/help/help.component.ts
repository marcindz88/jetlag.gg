import { ChangeDetectionStrategy, Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'pg-help',
  templateUrl: './help.component.html',
  styleUrls: ['help.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HelpComponent {
  @Output() closed = new EventEmitter<void>();
}
