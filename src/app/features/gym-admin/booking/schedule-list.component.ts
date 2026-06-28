import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { BookingService } from '../../../core/services/booking.service';
import { DialogService } from '../../../core/services/dialog.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ClassSchedule, DAY_NAMES } from '../../../shared/models/booking.models';

@Component({
  selector: 'app-schedule-list',
  standalone: true,
  imports: [RouterLink, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './schedule-list.component.html',
  styleUrl: './schedule-list.component.css',
})
export class ScheduleListComponent implements OnInit {
  private readonly svc = inject(BookingService);
  private readonly dialog = inject(DialogService);
  private readonly notify = inject(NotificationService);

  readonly dayNames = DAY_NAMES;
  loading = signal(true);
  schedules = signal<ClassSchedule[]>([]);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.svc.getSchedules().subscribe({
      next: (r) => {
        this.loading.set(false);
        if (r.success && r.data) this.schedules.set(r.data.items);
      },
      error: () => {
        this.loading.set(false);
        this.notify.error('Failed to load schedules');
      },
    });
  }

  remove(id: number): void {
    this.dialog
      .confirm({
        title: 'Delete schedule',
        message:
          'Permanently delete this class schedule? All member bookings and waitlist entries for this schedule will also be deleted.',
        tone: 'danger',
        confirmLabel: 'Delete schedule',
      })
      .subscribe((ok) => {
        if (!ok) return;
        this.svc.deleteSchedule(id).subscribe({
          next: (r) => {
            if (r.success) {
              this.schedules.update((items) => items.filter((s) => s.id !== id));
              this.notify.success('Schedule deleted');
            } else {
              this.notify.error(r.message ?? 'Failed to delete schedule');
            }
          },
          error: (e) => this.notify.error(e.error?.message ?? 'Failed to delete schedule'),
        });
      });
  }
}
