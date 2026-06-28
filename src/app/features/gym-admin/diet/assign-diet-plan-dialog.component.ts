import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DietService } from '../../../core/services/diet.service';
import { MemberService } from '../../../core/services/member.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Member } from '../../../shared/models/member.models';
import { DietPlanListItem } from '../../../shared/models/diet.models';

export interface AssignDietPlanDialogData {
  dietPlanId?: number;
  planName?: string;
  memberId?: number;
}

@Component({
  selector: 'app-assign-diet-plan-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <h2 mat-dialog-title>
      {{ data.planName ? 'Assign "' + data.planName + '"' : 'Assign diet plan' }}
    </h2>
    <mat-dialog-content>
      @if (loadingMembers) {
        <div class="loading-row">
          <mat-spinner diameter="28" />
          <span>Loading members…</span>
        </div>
      }
      <form [formGroup]="form" class="form">
        @if (!data.dietPlanId) {
          <mat-form-field appearance="outline" class="full">
            <mat-label>Diet plan</mat-label>
            <mat-select formControlName="dietPlanId" required>
              @for (p of plans; track p.dietPlanId) {
                <mat-option [value]="p.dietPlanId">{{ p.planName }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
        }
        @if (!data.memberId) {
          <mat-form-field appearance="outline" class="full">
            <mat-label>Members</mat-label>
            <mat-select formControlName="memberIds" multiple required>
              @for (m of filteredMembers(); track m.id) {
                <mat-option [value]="m.id">{{ m.fullName }}</mat-option>
              }
            </mat-select>
            <mat-hint>{{ selectedCount }} selected · choose one or more members</mat-hint>
          </mat-form-field>
          <label class="member-search">
            <span>Search members</span>
            <input type="search" [formControl]="memberSearchControl" placeholder="Filter by name…" />
          </label>
          <div class="member-actions">
            <button type="button" mat-stroked-button (click)="selectAllVisible()">Select all shown</button>
            <button type="button" mat-stroked-button (click)="clearMembers()">Clear</button>
          </div>
        }
        <mat-form-field appearance="outline" class="full">
          <mat-label>Start date</mat-label>
          <input matInput type="date" formControlName="startDate" required />
        </mat-form-field>
        <mat-form-field appearance="outline" class="full">
          <mat-label>End date (optional)</mat-label>
          <input matInput type="date" formControlName="endDate" />
        </mat-form-field>
        <mat-form-field appearance="outline" class="full">
          <mat-label>Notes</mat-label>
          <textarea matInput rows="2" formControlName="notes"></textarea>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button type="button" mat-dialog-close [disabled]="saving">Cancel</button>
      <button
        mat-flat-button
        color="primary"
        type="button"
        [disabled]="form.invalid || saving || loadingMembers || !canSubmit"
        (click)="submit()">
        @if (saving) {
          Assigning…
        } @else {
          Assign{{ assignButtonLabel }}
        }
      </button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      .form {
        display: flex;
        flex-direction: column;
        min-width: min(480px, 92vw);
      }
      .full {
        width: 100%;
      }
      .loading-row {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        margin-bottom: 1rem;
        color: #667085;
        font-size: 0.875rem;
      }
      .member-search {
        display: flex;
        flex-direction: column;
        gap: 0.35rem;
        margin-bottom: 0.5rem;
      }
      .member-search span {
        font-size: 0.75rem;
        font-weight: 600;
        color: #667085;
      }
      .member-search input {
        border: 1px solid #e4e7ec;
        border-radius: 10px;
        padding: 0.55rem 0.75rem;
        font-size: 0.875rem;
        outline: none;
      }
      .member-search input:focus {
        border-color: var(--brand-primary, #ff6600);
        box-shadow: 0 0 0 3px rgba(255, 102, 0, 0.12);
      }
      .member-actions {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
        margin-bottom: 0.75rem;
      }
    `,
  ],
})
export class AssignDietPlanDialogComponent {
  readonly data = inject<AssignDietPlanDialogData>(MAT_DIALOG_DATA);
  private readonly ref = inject(MatDialogRef<AssignDietPlanDialogComponent>);
  private readonly fb = inject(FormBuilder);
  private readonly diet = inject(DietService);
  private readonly membersSvc = inject(MemberService);
  private readonly notify = inject(NotificationService);

  members: Member[] = [];
  plans: DietPlanListItem[] = [];
  saving = false;
  loadingMembers = false;

  memberSearchControl = this.fb.control('');

  form = this.fb.group({
    dietPlanId: [this.data.dietPlanId ?? (null as number | null), Validators.required],
    memberIds: [this.data.memberId ? [this.data.memberId] : ([] as number[]), Validators.required],
    startDate: [new Date().toISOString().slice(0, 10), Validators.required],
    endDate: [''],
    notes: [''],
  });

  get selectedCount(): number {
    return (this.form.get('memberIds')?.value as number[] | null)?.length ?? 0;
  }

  get canSubmit(): boolean {
    return this.selectedCount > 0;
  }

  get assignButtonLabel(): string {
    const n = this.selectedCount;
    if (this.data.memberId || n <= 1) return '';
    return ` to ${n} members`;
  }

  constructor() {
    if (!this.data.dietPlanId) {
      this.diet.getPlans(false).subscribe({
        next: (res) => {
          if (res.success && res.data) this.plans = res.data;
        },
      });
    }
    if (!this.data.memberId) {
      this.loadingMembers = true;
      this.membersSvc.getAll(null, false).subscribe({
        next: (members) => {
          this.members = members;
          this.loadingMembers = false;
        },
        error: () => {
          this.loadingMembers = false;
          this.notify.error('Failed to load members');
        },
      });
    }
  }

  filteredMembers(): Member[] {
    const q = (this.memberSearchControl.value ?? '').trim().toLowerCase();
    if (!q) return this.members;
    return this.members.filter((m) => m.fullName.toLowerCase().includes(q));
  }

  selectAllVisible(): void {
    const visibleIds = this.filteredMembers().map((m) => m.id);
    const current = new Set(this.form.get('memberIds')?.value as number[]);
    visibleIds.forEach((id) => current.add(id));
    this.form.patchValue({ memberIds: [...current] });
  }

  clearMembers(): void {
    this.form.patchValue({ memberIds: [] });
  }

  submit(): void {
    if (this.form.invalid || !this.canSubmit) return;
    this.saving = true;
    const v = this.form.getRawValue();
    const memberIds = v.memberIds as number[];
    const payload = {
      dietPlanId: v.dietPlanId!,
      startDate: v.startDate!,
      endDate: v.endDate || undefined,
      notes: v.notes || undefined,
      deactivatePrevious: true,
    };

    this.diet.assignMany(payload, memberIds).subscribe({
      next: ({ succeeded, failed }) => {
        this.saving = false;
        if (failed === 0) {
          this.notify.success(
            memberIds.length === 1 ? 'Diet plan assigned' : `Diet plan assigned to ${succeeded} members`
          );
          this.ref.close(true);
          return;
        }
        if (succeeded > 0) {
          this.notify.error(`Assigned ${succeeded}; failed for ${failed} member(s)`);
          this.ref.close(true);
          return;
        }
        this.notify.error('Assignment failed for all selected members');
      },
      error: () => {
        this.saving = false;
        this.notify.error('Assignment failed');
      },
    });
  }
}
