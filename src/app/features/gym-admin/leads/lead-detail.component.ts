import { DatePipe, NgClass } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { LeadService } from '../../../core/services/lead.service';
import { MembershipService } from '../../../core/services/membership.service';
import { NotificationService } from '../../../core/services/notification.service';
import { AuthService } from '../../../core/services/auth.service';
import { Permissions } from '../../../core/constants/permissions';
import { LEAD_STATUS_LABELS, LeadDetail } from '../../../shared/models/lead.models';

@Component({
  selector: 'app-lead-detail',
  standalone: true,
  imports: [
    DatePipe,
    NgClass,
    ReactiveFormsModule,
    RouterModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './lead-detail.component.html',
  styleUrl: './lead-detail.component.css',
})
export class LeadDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly leadService = inject(LeadService);
  private readonly planService = inject(MembershipService);
  private readonly notify = inject(NotificationService);
  private readonly fb = inject(FormBuilder);
  readonly auth = inject(AuthService);
  readonly permissions = Permissions;

  detail = signal<LeadDetail | null>(null);
  loading = signal(true);
  plans = signal<{ id: number; name: string }[]>([]);
  showConvert = false;

  convertForm = this.fb.group({
    membershipPlanId: [null as number | null, Validators.required],
    startDate: [new Date().toISOString().slice(0, 10), Validators.required],
    email: [''],
  });

  ngOnInit(): void {
    this.planService.getPlans().subscribe((res) => {
      this.plans.set((res.data ?? []).map((p) => ({ id: p.id, name: p.planName })));
    });
    this.loadDetail();
  }

  loadDetail(): void {
    const id = +this.route.snapshot.paramMap.get('id')!;
    this.loading.set(true);
    this.leadService.getById(id).subscribe({
      next: (res) => {
        this.detail.set(res.data ?? null);
        this.convertForm.patchValue({ email: res.data?.lead.email ?? '' });
        this.loading.set(false);
      },
      error: () => {
        this.notify.error('Failed to load lead');
        this.loading.set(false);
      },
    });
  }

  statusLabel(s: string): string {
    return LEAD_STATUS_LABELS[s] ?? s;
  }

  sourceLabel(source: string): string {
    return source.replace(/([a-z])([A-Z])/g, '$1 $2');
  }

  leadInitials(name: string): string {
    return (name ?? '')
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('');
  }

  statusBadgeClass(status: string): string {
    switch (status) {
      case 'New':
        return 'status-badge--new';
      case 'Contacted':
        return 'status-badge--contact';
      case 'TrialScheduled':
      case 'TrialCompleted':
        return 'status-badge--trial';
      case 'FollowUpPending':
        return 'status-badge--followup';
      case 'Converted':
        return 'status-badge--converted';
      case 'Lost':
        return 'status-badge--lost';
      default:
        return 'status-badge--muted';
    }
  }

  avatarToneClass(status: string): string {
    switch (status) {
      case 'New':
        return 'avatar-tone--new';
      case 'Contacted':
        return 'avatar-tone--contact';
      case 'TrialScheduled':
      case 'TrialCompleted':
        return 'avatar-tone--trial';
      case 'FollowUpPending':
        return 'avatar-tone--followup';
      case 'Converted':
        return 'avatar-tone--converted';
      case 'Lost':
        return 'avatar-tone--lost';
      default:
        return '';
    }
  }

  trialBadgeClass(status: string): string {
    const normalized = status?.toLowerCase() ?? '';
    if (normalized.includes('present') || normalized.includes('attended')) return 'status-badge--present';
    if (normalized.includes('absent') || normalized.includes('no')) return 'status-badge--absent';
    return 'status-badge--muted';
  }

  convert(): void {
    if (this.convertForm.invalid || !this.detail()) return;
    const v = this.convertForm.getRawValue();
    this.leadService
      .convertToMember({
        leadId: this.detail()!.lead.id,
        membershipPlanId: v.membershipPlanId!,
        startDate: v.startDate!,
        email: v.email || undefined,
      })
      .subscribe({
        next: (res) => {
          const pwd = res.data?.temporaryPassword;
          this.notify.success(pwd ? `Converted. Temp password: ${pwd}` : 'Lead converted to member');
          this.showConvert = false;
          this.loadDetail();
        },
        error: (err) => this.notify.error(err?.error?.message ?? 'Conversion failed'),
      });
  }
}
