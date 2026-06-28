import { Injectable, inject } from '@angular/core';
import { ComponentType } from '@angular/cdk/overlay';
import { MatDialog, MatDialogConfig, MatDialogRef } from '@angular/material/dialog';
import { Observable, map } from 'rxjs';
import {
  ConfirmDialogComponent,
  ConfirmDialogData,
} from '../../shared/components/confirm-dialog/confirm-dialog.component';

export const APP_DIALOG_PANEL_CLASS = 'app-dialog';

const DEFAULT_DIALOG_CONFIG: MatDialogConfig = {
  panelClass: APP_DIALOG_PANEL_CLASS,
  maxWidth: '95vw',
  autoFocus: 'first-timer',
};

@Injectable({ providedIn: 'root' })
export class DialogService {
  private readonly matDialog = inject(MatDialog);

  open<T, D = unknown, R = unknown>(
    component: ComponentType<T>,
    config?: MatDialogConfig<D>,
  ): MatDialogRef<T, R> {
    const extraPanelClass = config?.panelClass;
    const panelClass = [
      APP_DIALOG_PANEL_CLASS,
      ...(Array.isArray(extraPanelClass)
        ? extraPanelClass
        : extraPanelClass
          ? [extraPanelClass]
          : []),
    ];

    return this.matDialog.open(component, {
      ...DEFAULT_DIALOG_CONFIG,
      ...config,
      panelClass,
    }) as MatDialogRef<T, R>;
  }

  confirm(data: ConfirmDialogData): Observable<boolean> {
    return this.open(ConfirmDialogComponent, {
      width: '420px',
      data,
      panelClass: [APP_DIALOG_PANEL_CLASS, 'app-dialog--confirm'],
    })
      .afterClosed()
      .pipe(map((result) => !!result));
  }
}
