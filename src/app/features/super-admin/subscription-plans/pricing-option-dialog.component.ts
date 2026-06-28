import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { PlanPricingOption, UpsertPricingOptionRequest } from '../../../shared/models/plan.models';

export interface PricingOptionDialogData {
  option?: PlanPricingOption;
  nextSortOrder: number;
}

@Component({
  selector: 'app-pricing-option-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ data.option ? 'Edit Pricing Option' : 'Add Pricing Option' }}</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="dialog-form">
        <div class="dialog-grid">
          <mat-form-field appearance="outline">
            <mat-label>Duration Value</mat-label>
            <input matInput type="number" min="1" formControlName="durationValue" />
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Duration Unit</mat-label>
            <mat-select formControlName="durationUnit">
              @for (unit of durationUnits; track unit) {
                <mat-option [value]="unit">{{ unit }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
        </div>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Price (INR)</mat-label>
          <input matInput type="number" min="0" step="0.01" formControlName="price" />
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Display Label (optional)</mat-label>
          <input matInput formControlName="displayLabel" />
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close type="button">Cancel</button>
      <button mat-flat-button color="primary" type="button" (click)="save()" [disabled]="form.invalid">
        Save
      </button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      .full-width { width: 100%; }
      .dialog-form { display: flex; flex-direction: column; gap: 0.25rem; min-width: 360px; }
      .dialog-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
    `,
  ],
})
export class PricingOptionDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly ref = inject(MatDialogRef<PricingOptionDialogComponent>);
  readonly data = inject<PricingOptionDialogData>(MAT_DIALOG_DATA);

  readonly durationUnits = ['Day', 'Month', 'Year'];

  readonly form = this.fb.nonNullable.group({
    durationValue: [this.data.option?.durationValue ?? 1, [Validators.required, Validators.min(1)]],
    durationUnit: [this.data.option?.durationUnit ?? 'Month', Validators.required],
    price: [this.data.option?.price ?? 0, [Validators.required, Validators.min(0)]],
    displayLabel: [this.data.option?.displayLabel ?? ''],
    sortOrder: [this.data.option?.sortOrder ?? this.data.nextSortOrder],
    isActive: [this.data.option?.isActive ?? true],
  });

  save(): void {
    if (this.form.invalid) return;
    this.ref.close(this.form.getRawValue() as UpsertPricingOptionRequest);
  }
}
