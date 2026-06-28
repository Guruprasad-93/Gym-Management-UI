import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { LeadService } from '../../../core/services/lead.service';
import { MembershipService } from '../../../core/services/membership.service';
import { TrainerService } from '../../../core/services/trainer.service';
import { NotificationService } from '../../../core/services/notification.service';
import { PhoneFieldComponent } from '../../../shared/components/phone-field/phone-field.component';
import { LEAD_SOURCES, LEAD_STATUSES, LEAD_STATUS_LABELS } from '../../../shared/models/lead.models';

@Component({
  selector: 'app-lead-form',
  standalone: true,
  imports: [ReactiveFormsModule, RouterModule, MatIconModule, MatProgressSpinnerModule, PhoneFieldComponent],
  templateUrl: './lead-form.component.html',
  styleUrl: './lead-form.component.css',
})
export class LeadFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly leadService = inject(LeadService);
  private readonly planService = inject(MembershipService);
  private readonly trainerService = inject(TrainerService);
  private readonly notify = inject(NotificationService);

  readonly sources = LEAD_SOURCES;
  readonly statuses = LEAD_STATUSES;
  isEdit = signal(false);
  loading = signal(false);
  saving = signal(false);
  leadId = signal<number | null>(null);
  plans = signal<{ id: number; name: string }[]>([]);
  trainers = signal<{ id: number; fullName: string }[]>([]);

  form = this.fb.group({
    fullName: ['', Validators.required],
    mobileNumber: [''],
    email: [''],
    gender: [''],
    age: [null as number | null],
    address: [''],
    leadSource: ['WalkIn', Validators.required],
    interestedPlanId: [null as number | null],
    status: ['New', Validators.required],
    assignedTrainerId: [null as number | null],
    notes: [''],
  });

  ngOnInit(): void {
    this.planService.getPlans().subscribe((res) => {
      this.plans.set((res.data ?? []).map((p) => ({ id: p.id, name: p.planName })));
    });
    this.trainerService.getPaged(null, { pageNumber: 1, pageSize: 100 }).subscribe((res) => {
      this.trainers.set((res.data?.items ?? []).map((t) => ({ id: t.id, fullName: t.fullName ?? 'Trainer' })));
    });

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEdit.set(true);
      this.leadId.set(+id);
      this.loading.set(true);
      this.leadService.getById(+id).subscribe({
        next: (res) => {
          const l = res.data!.lead;
          this.form.patchValue({
            fullName: l.fullName,
            mobileNumber: l.mobileNumber,
            email: l.email ?? '',
            gender: l.gender ?? '',
            age: l.age ?? null,
            address: l.address ?? '',
            leadSource: l.leadSource,
            interestedPlanId: l.interestedPlanId ?? null,
            status: l.status,
            assignedTrainerId: l.assignedTrainerId ?? null,
            notes: l.notes ?? '',
          });
          this.loading.set(false);
        },
        error: () => {
          this.notify.error('Lead not found');
          this.router.navigate(['/gym-admin/leads']);
        },
      });
    }
  }

  backLink(): string[] {
    return this.isEdit() && this.leadId() ? ['/gym-admin/leads', String(this.leadId()!)] : ['/gym-admin/leads'];
  }

  statusLabel(status: string): string {
    return LEAD_STATUS_LABELS[status] ?? status;
  }

  sourceLabel(source: string): string {
    return source.replace(/([a-z])([A-Z])/g, '$1 $2');
  }

  submit(): void {
    if (this.form.invalid) return;
    this.saving.set(true);
    const value = this.form.getRawValue();
    const payload = {
      ...value,
      email: value.email || undefined,
      gender: value.gender || undefined,
      age: value.age ?? undefined,
      address: value.address || undefined,
      notes: value.notes || undefined,
      interestedPlanId: value.interestedPlanId ?? undefined,
      assignedTrainerId: value.assignedTrainerId ?? undefined,
    };

    const req = this.isEdit()
      ? this.leadService.update(this.leadId()!, payload as never)
      : this.leadService.create(payload as never);

    req.subscribe({
      next: () => {
        this.notify.success(this.isEdit() ? 'Lead updated' : 'Lead created');
        if (this.isEdit() && this.leadId()) {
          this.router.navigate(['/gym-admin/leads', this.leadId()]);
        } else {
          this.router.navigate(['/gym-admin/leads']);
        }
      },
      error: (err) => {
        this.notify.error(err?.error?.message ?? 'Save failed');
        this.saving.set(false);
      },
    });
  }
}
