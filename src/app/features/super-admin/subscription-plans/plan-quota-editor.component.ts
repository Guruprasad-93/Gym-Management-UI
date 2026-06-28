import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { UpsertPlanQuota, UNLIMITED_QUOTA } from '../../../shared/models/plan.models';

type QuotaKey =
  | 'maxMembers'
  | 'maxTrainers'
  | 'maxBranches'
  | 'maxStorageGB'
  | 'maxSmsPerMonth'
  | 'maxWhatsappMessages';

interface QuotaField {
  key: QuotaKey;
  label: string;
}

@Component({
  selector: 'app-plan-quota-editor',
  standalone: true,
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatCheckboxModule],
  templateUrl: './plan-quota-editor.component.html',
  styleUrl: './plan-quota-editor.component.css',
})
export class PlanQuotaEditorComponent {
  private readonly fb = inject(FormBuilder);

  @Input() readonly = false;
  @Input() set quotas(value: UpsertPlanQuota | undefined) {
    if (!value) return;
    for (const field of this.fields) {
      const raw = value[field.key];
      this.unlimited[field.key] = raw < 0;
      this.form.controls[field.key].setValue(raw < 0 ? 0 : raw, { emitEvent: false });
    }
  }

  @Output() quotasChange = new EventEmitter<UpsertPlanQuota>();

  readonly fields: QuotaField[] = [
    { key: 'maxMembers', label: 'Max Members' },
    { key: 'maxTrainers', label: 'Max Trainers' },
    { key: 'maxBranches', label: 'Max Branches' },
    { key: 'maxStorageGB', label: 'Max Storage (GB)' },
    { key: 'maxSmsPerMonth', label: 'Max SMS / Month' },
    { key: 'maxWhatsappMessages', label: 'Max WhatsApp Messages' },
  ];

  unlimited: Record<QuotaKey, boolean> = {
    maxMembers: false,
    maxTrainers: false,
    maxBranches: false,
    maxStorageGB: false,
    maxSmsPerMonth: false,
    maxWhatsappMessages: false,
  };

  readonly form = this.fb.nonNullable.group({
    maxMembers: [0],
    maxTrainers: [0],
    maxBranches: [1],
    maxStorageGB: [0],
    maxSmsPerMonth: [0],
    maxWhatsappMessages: [0],
  });

  toggleUnlimited(key: QuotaKey, checked: boolean): void {
    if (this.readonly) return;
    this.unlimited[key] = checked;
    if (checked) {
      this.form.controls[key].disable({ emitEvent: false });
    } else {
      this.form.controls[key].enable({ emitEvent: false });
    }
    this.emit();
  }

  onValueChange(): void {
    this.emit();
  }

  getValue(): UpsertPlanQuota {
    const raw = this.form.getRawValue();
    const result = { ...raw } as UpsertPlanQuota;
    for (const field of this.fields) {
      if (this.unlimited[field.key]) {
        result[field.key] = UNLIMITED_QUOTA;
      }
    }
    return result;
  }

  private emit(): void {
    this.quotasChange.emit(this.getValue());
  }
}
