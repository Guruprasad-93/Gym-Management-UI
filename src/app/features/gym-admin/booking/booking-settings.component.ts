import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { BookingService } from '../../../core/services/booking.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-booking-settings',
  standalone: true,
  imports: [ReactiveFormsModule, RouterModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './booking-settings.component.html',
  styleUrl: './booking-settings.component.css',
})
export class BookingSettingsComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly svc = inject(BookingService);
  private readonly notify = inject(NotificationService);

  loading = signal(true);
  saving = signal(false);

  form = this.fb.nonNullable.group({
    maxBookingsPerDay: [3, [Validators.required, Validators.min(1), Validators.max(20)]],
    allowWaitlist: [true],
    cancellationWindowHours: [2, [Validators.required, Validators.min(0), Validators.max(72)]],
    reminderMinutesBefore: [60, [Validators.required, Validators.min(0), Validators.max(1440)]],
  });

  ngOnInit(): void {
    this.svc.getSettings().subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res.success && res.data) {
          this.form.patchValue({
            maxBookingsPerDay: res.data.maxBookingsPerDay,
            allowWaitlist: res.data.allowWaitlist,
            cancellationWindowHours: res.data.cancellationWindowHours,
            reminderMinutesBefore: res.data.reminderMinutesBefore,
          });
        }
      },
      error: () => {
        this.loading.set(false);
        this.notify.error('Failed to load booking settings');
      },
    });
  }

  save(): void {
    if (this.form.invalid) return;
    this.saving.set(true);
    this.svc.updateSettings(this.form.getRawValue()).subscribe({
      next: (res) => {
        this.saving.set(false);
        if (res.success) this.notify.success('Booking settings saved');
        else this.notify.error(res.message ?? 'Save failed');
      },
      error: (e) => {
        this.saving.set(false);
        this.notify.error(e.error?.message ?? 'Save failed');
      },
    });
  }
}
