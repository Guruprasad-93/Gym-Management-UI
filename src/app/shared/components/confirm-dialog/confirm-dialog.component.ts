import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface ConfirmDialogData {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: 'default' | 'danger';
}

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <div class="confirm-dialog" [class.confirm-dialog--danger]="data.tone === 'danger'">
      <header class="confirm-dialog__header">
        <div class="confirm-dialog__icon" aria-hidden="true">
          <mat-icon>{{ data.tone === 'danger' ? 'warning_amber' : 'help_outline' }}</mat-icon>
        </div>
        <h2>{{ data.title ?? 'Confirm' }}</h2>
      </header>
      <mat-dialog-content>
        <p class="confirm-dialog__message">{{ data.message }}</p>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button type="button" (click)="ref.close(false)">
          {{ data.cancelLabel ?? 'Cancel' }}
        </button>
        <button
          mat-flat-button
          type="button"
          [color]="data.tone === 'danger' ? 'warn' : 'primary'"
          (click)="ref.close(true)">
          {{ data.confirmLabel ?? 'Confirm' }}
        </button>
      </mat-dialog-actions>
    </div>
  `,
})
export class ConfirmDialogComponent {
  readonly data = inject<ConfirmDialogData>(MAT_DIALOG_DATA);
  readonly ref = inject(MatDialogRef<ConfirmDialogComponent, boolean>);
}
