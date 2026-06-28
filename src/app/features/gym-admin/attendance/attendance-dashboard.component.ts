import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AttendanceService } from '../../../core/services/attendance.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Permissions } from '../../../core/constants/permissions';
import { SaasKpiCardComponent } from '../../../shared/components/saas-kpi-card/saas-kpi-card.component';
import { AttendanceDashboard, AttendanceSettings, MemberAttendance, UpdateAttendanceSettings } from '../../../shared/models/attendance.models';

@Component({
  selector: 'app-attendance-dashboard',
  standalone: true,
  imports: [DatePipe, ReactiveFormsModule, RouterModule, MatIconModule, MatProgressSpinnerModule, SaasKpiCardComponent],
  templateUrl: './attendance-dashboard.component.html',
  styleUrl: './attendance-dashboard.component.css',
})
export class AttendanceDashboardComponent implements OnInit {
  readonly auth = inject(AuthService);
  readonly permissions = Permissions;
  private readonly svc = inject(AttendanceService);
  private readonly notify = inject(NotificationService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  loading = signal(true);
  today = signal<MemberAttendance[]>([]);
  stats: AttendanceDashboard | null = null;
  showSettings = signal(false);
  savingSettings = signal(false);
  settingsForm = this.fb.nonNullable.group({
    openingTime: ['06:00'],
    closingTime: ['22:00'],
    autoCheckoutEnabled: [true],
    useClosingTimeForAutoCheckout: [true],
    checkoutReminderMinutesBefore: [30],
    timeZoneId: ['India Standard Time'],
    is24Hours: [false],
    maximumSessionHours: [12],
  });

  get showFullListLink(): boolean {
    return !this.router.url.includes('/trainer/');
  }

  ngOnInit(): void {
    this.svc.getDashboard().subscribe({
      next: (res) => {
        if (res.success && res.data) this.stats = res.data;
        this.svc.getToday().subscribe({
          next: (t) => {
            this.loading.set(false);
            if (t.success && t.data) this.today.set(t.data);
          },
          error: () => this.loading.set(false),
        });
      },
      error: () => {
        this.loading.set(false);
        this.notify.error('Failed to load attendance dashboard');
      },
    });

    if (this.auth.hasPermission(this.permissions.ManageAttendance)) {
      this.svc.getSettings().subscribe({
        next: (res) => {
          if (res.success && res.data) this.patchSettings(res.data);
        },
      });
    }
  }

  toggleSettings(): void {
    this.showSettings.update((v) => !v);
  }

  saveSettings(): void {
    const v = this.settingsForm.getRawValue();
    const dto: UpdateAttendanceSettings = {
      openingTime: v.openingTime,
      closingTime: v.closingTime,
      autoCheckoutEnabled: v.autoCheckoutEnabled,
      useClosingTimeForAutoCheckout: v.useClosingTimeForAutoCheckout,
      checkoutReminderMinutesBefore: v.checkoutReminderMinutesBefore,
      timeZoneId: v.timeZoneId,
      is24Hours: v.is24Hours,
      maximumSessionHours: v.maximumSessionHours,
    };
    this.savingSettings.set(true);
    this.svc.updateSettings(dto).subscribe({
      next: (res) => {
        this.savingSettings.set(false);
        if (res.success) this.notify.success('Attendance settings saved');
        else this.notify.error(res.message ?? 'Failed to save settings');
      },
      error: () => {
        this.savingSettings.set(false);
        this.notify.error('Failed to save settings');
      },
    });
  }

  private patchSettings(s: AttendanceSettings): void {
    this.settingsForm.patchValue({
      openingTime: (s.openingTime ?? '06:00:00').slice(0, 5),
      closingTime: (s.closingTime ?? '22:00:00').slice(0, 5),
      autoCheckoutEnabled: s.autoCheckoutEnabled,
      useClosingTimeForAutoCheckout: s.useClosingTimeForAutoCheckout,
      checkoutReminderMinutesBefore: s.checkoutReminderMinutesBefore,
      timeZoneId: s.timeZoneId,
      is24Hours: s.is24Hours,
      maximumSessionHours: s.maximumSessionHours,
    });
  }

  memberInitials(name: string): string {
    return (name ?? '')
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('');
  }
}
