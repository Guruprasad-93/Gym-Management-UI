import { DatePipe, NgClass } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { AuthService } from '../../../core/services/auth.service';
import { BookingService } from '../../../core/services/booking.service';
import { DialogService } from '../../../core/services/dialog.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Permissions } from '../../../core/constants/permissions';
import { bookingStatusBadgeClass, canCancelBooking, SlotBooking } from '../../../shared/models/booking.models';

@Component({
  selector: 'app-gym-admin-bookings',
  standalone: true,
  imports: [DatePipe, NgClass, RouterLink, MatIconModule, MatProgressSpinnerModule, MatTableModule],
  templateUrl: './gym-admin-bookings.component.html',
  styleUrl: './gym-admin-bookings.component.css',
})
export class GymAdminBookingsComponent implements OnInit {
  private readonly svc = inject(BookingService);
  private readonly notify = inject(NotificationService);
  private readonly dialog = inject(DialogService);
  private readonly auth = inject(AuthService);

  readonly canManage = this.auth.hasPermission(Permissions.ManageBookings);
  loading = signal(true);
  bookings = signal<SlotBooking[]>([]);
  cols = ['member', 'class', 'schedule', 'trainer', 'status', 'actions'];

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.svc.getBookings(1, 100).subscribe({
      next: (r) => {
        this.loading.set(false);
        if (r.success && r.data) this.bookings.set(r.data.items);
      },
      error: () => {
        this.loading.set(false);
        this.notify.error('Failed to load bookings');
      },
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

  statusBadgeClass = bookingStatusBadgeClass;
  canCancel = canCancelBooking;

  cancelBooking(row: SlotBooking): void {
    this.dialog
      .confirm({
        title: 'Cancel booking',
        message: `Cancel ${row.memberName}'s booking for ${row.className}?`,
        tone: 'danger',
        confirmLabel: 'Cancel booking',
      })
      .subscribe((ok) => {
        if (!ok) return;
        this.svc.cancel(row.id).subscribe({
          next: () => {
            this.notify.success('Booking cancelled');
            this.load();
          },
          error: (e) => this.notify.error(e.error?.message ?? 'Cancel failed'),
        });
      });
  }
}
