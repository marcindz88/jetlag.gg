import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Input,
  NgIterable,
  OnInit,
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
  @Input() map?: Map<string, T>;
  @Input() array?: T[];
  @Input() updateTrigger$!: ReplaySubject<void>;
  @Input() noRecordsText = '';
  @Input() rowTemplate: TemplateRef<{ data: T }> | null = null;
  @Input() headerTemplate: TemplateRef<Record<string, never>> | null = null;

  length = 0;
  data: NgIterable<T> = [];
  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.updateTrigger$.pipe(untilDestroyed(this)).subscribe(() => {
      this.length = this.array?.length || this.map?.size || 0;
      this.data = this.array || this.map?.values() || [];
      this.cdr.markForCheck();
    });
  }
}
