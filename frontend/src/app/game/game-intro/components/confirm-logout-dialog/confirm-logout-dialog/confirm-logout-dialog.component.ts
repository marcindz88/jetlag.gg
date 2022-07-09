import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'pg-confirm-logout-dialog',
  templateUrl: './confirm-logout-dialog.component.html',
  styleUrls: ['./confirm-logout-dialog.component.scss'],
})
export class ConfirmLogoutDialogComponent {
  constructor(public dialogRef: MatDialogRef<ConfirmLogoutDialogComponent>) {}
}
