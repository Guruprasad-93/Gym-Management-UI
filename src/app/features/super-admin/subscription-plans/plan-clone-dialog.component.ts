import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { PlanSummary } from '../../../shared/models/plan.models';
import { clonePlanName, slugifyPlanCode } from './plan.utils';

export interface PlanCloneDialogData {
  plan: PlanSummary;
}

@Component({
  selector: 'app-plan-clone-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
  ],
  template: `
    <h2 mat-dialog-title>Clone Plan</h2>
    <mat-dialog-content>
      <p class="dialog-hint">Features, pricing options, quotas, and dependency mappings will be copied.</p>
      <form [formGroup]="form" class="dialog-form">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Plan Name</mat-label>
          <input matInput formControlName="planName" />
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Plan Code</mat-label>
          <input matInput formControlName="planCode" />
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Description</mat-label>
          <textarea matInput rows="2" formControlName="description"></textarea>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close type="button">Cancel</button>
      <button mat-flat-button color="primary" type="button" (click)="confirm()" [disabled]="form.invalid">
        Clone
      </button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      .full-width { width: 100%; min-width: 320px; }
      .dialog-form { display: flex; flex-direction: column; gap: 0.25rem; }
      .dialog-hint { margin: 0 0 1rem; color: #667085; font-size: 0.875rem; }
    `,
  ],
})
export class PlanCloneDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly ref = inject(MatDialogRef<PlanCloneDialogComponent>);
  readonly data = inject<PlanCloneDialogData>(MAT_DIALOG_DATA);

  readonly form = this.fb.nonNullable.group({
    planName: [clonePlanName(this.data.plan.planName), Validators.required],
    planCode: [`${slugifyPlanCode(this.data.plan.planCode)}_COPY`, Validators.required],
    description: [this.data.plan.description ?? ''],
  });

  confirm(): void {
    if (this.form.invalid) return;
    this.ref.close(this.form.getRawValue());
  }
}
