import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  TemplateRef,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { ReplaySubject } from 'rxjs';

@UntilDestroy()
@Component({
  selector: 'pg-table',
  templateUrl: './table.component.html',
  styleUrls: ['./table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TableComponent<T> implements OnInit {
  @Input() array?: T[];
  @Input() updateTrigger$?: ReplaySubject<void>;
  @Input() noRecordsText = '';
  @Input() rowTemplate: TemplateRef<{ data: T }> | null = null;
  @Input() headerTemplate: TemplateRef<Record<string, never>> | null = null;
  @Input() scrollable = false;
  @Input() large = false;
  @Input() background = false;

  @Output() tableScroll: EventEmitter<HTMLTableElement> = new EventEmitter<HTMLTableElement>();

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.updateTrigger$?.pipe(untilDestroyed(this)).subscribe(() => {
      this.cdr.markForCheck();
    });
  }

  emitScrollEvent(event: Event) {
    if (this.scrollable) {
      this.tableScroll.emit(event.target as HTMLTableElement);
      event.stopPropagation();
    }
  }
}
