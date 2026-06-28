import { DatePipe, NgClass } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { BookingService } from '../../../core/services/booking.service';
import { DialogService } from '../../../core/services/dialog.service';
import { NotificationService } from '../../../core/services/notification.service';
import { bookingStatusBadgeClass, canCancelBooking, SlotBooking } from '../../../shared/models/booking.models';

@Component({
  selector: 'app-member-booking-history',
  standalone: true,
  imports: [DatePipe, NgClass, RouterLink, MatIconModule],
  templateUrl: './member-booking-history.component.html',
  styleUrl: './member-booking-history.component.css',
})
export class MemberBookingHistoryComponent implements OnInit {
  private readonly svc = inject(BookingService);
  private readonly dialog = inject(DialogService);
  private readonly notify = inject(NotificationService);

  bookings: SlotBooking[] = [];
  loading = true;

  statusBadgeClass = bookingStatusBadgeClass;
  canCancel = canCancelBooking;

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.svc.getBookings(1, 50).subscribe({
      next: (r) => {
        this.loading = false;
        if (r.success && r.data) this.bookings = r.data.items;
      },
      error: () => {
        this.loading = false;
        this.notify.error('Failed to load bookings');
      },
    });
  }

  cancelBooking(booking: SlotBooking): void {
    this.dialog
      .confirm({
        title: 'Cancel booking',
        message: `Cancel your booking for ${booking.className} on ${booking.bookingDate}?`,
        tone: 'danger',
        confirmLabel: 'Cancel booking',
      })
      .subscribe((ok) => {
        if (!ok) return;
        this.svc.cancel(booking.id).subscribe({
          next: () => {
            this.notify.success('Booking cancelled');
            this.load();
          },
          error: (e) => this.notify.error(e.error?.message ?? 'Cancel failed'),
        });
      });
  }
}
