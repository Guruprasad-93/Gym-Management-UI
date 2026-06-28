import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../core/services/auth.service';
import { BookingService } from '../../../core/services/booking.service';
import { MemberSelfServiceService } from '../../../core/services/member-self-service.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Permissions } from '../../../core/constants/permissions';
import { QrScannerComponent } from '../../../shared/components/qr-scanner/qr-scanner.component';
import { QrScanMode, QrScanResult } from '../../../shared/models/qr-checkin.models';

@Component({
  selector: 'app-qr-scan-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterModule,
    MatIconModule,
    MatProgressSpinnerModule,
    QrScannerComponent,
  ],
  templateUrl: './qr-scan-page.component.html',
  styleUrl: './qr-scan-page.component.css',
})
export class QrScanPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly memberSvc = inject(MemberSelfServiceService);
  private readonly bookingSvc = inject(BookingService);
  private readonly notify = inject(NotificationService);
  private readonly fb = inject(FormBuilder);
  readonly auth = inject(AuthService);
  readonly permissions = Permissions;

  readonly mode = signal<QrScanMode>('attendance');
  readonly activeTab = signal<'attendance' | 'booking'>('attendance');
  readonly scanning = signal(true);
  readonly processing = signal(false);
  readonly lastResult = signal<QrScanResult | null>(null);
  readonly lastError = signal<string | null>(null);

  manualForm = this.fb.nonNullable.group({
    qrPayload: ['', Validators.required],
  });

  private lastPayload = '';
  private cooldownUntil = 0;

  ngOnInit(): void {
    const dataMode = this.route.snapshot.data['scanMode'] as QrScanMode | undefined;
    const mode = dataMode ?? 'attendance';
    this.mode.set(mode);
    if (mode === 'booking') this.activeTab.set('booking');
  }

  get pageTitle(): string {
    switch (this.mode()) {
      case 'reception':
        return 'Reception Scanner';
      case 'booking':
        return 'Class QR Check-In';
      default:
        return 'Scan Member QR';
    }
  }

  get pageSubtitle(): string {
    switch (this.mode()) {
      case 'reception':
        return 'Scan member QR for gym attendance or class check-in';
      case 'booking':
        return 'Scan member QR to check in to today\'s class booking';
      default:
        return 'Scan member QR to record gym attendance';
    }
  }

  showAttendanceTab(): boolean {
    return this.mode() !== 'booking' && this.auth.hasPermission(Permissions.ManageAttendance);
  }

  showBookingTab(): boolean {
    return this.mode() !== 'attendance'
      && this.auth.hasPermission(Permissions.ManageBookings)
      && this.auth.hasFeature('BOOKINGS');
  }

  showTabs(): boolean {
    return this.mode() === 'reception' && this.showAttendanceTab() && this.showBookingTab();
  }

  backLink(): string {
    const url = this.router.url;
    if (url.includes('/trainer/')) return '/trainer/attendance';
    if (url.includes('/reception/')) return '/gym-admin/attendance';
    return '/gym-admin/attendance';
  }

  setTab(tab: 'attendance' | 'booking'): void {
    this.activeTab.set(tab);
    this.clearResult();
  }

  onScanned(payload: string): void {
    if (!payload?.trim()) return;
    const now = Date.now();
    if (payload === this.lastPayload && now < this.cooldownUntil) return;
    this.lastPayload = payload;
    this.cooldownUntil = now + 3000;
    void this.submitPayload(payload.trim());
  }

  submitManual(): void {
    if (this.manualForm.invalid) return;
    void this.submitPayload(this.manualForm.getRawValue().qrPayload.trim());
  }

  clearResult(): void {
    this.lastResult.set(null);
    this.lastError.set(null);
    this.lastPayload = '';
    this.cooldownUntil = 0;
    this.scanning.set(true);
  }

  private async submitPayload(payload: string): Promise<void> {
    if (this.processing()) return;
    this.processing.set(true);
    this.lastError.set(null);
    this.lastResult.set(null);

    const useBooking = this.showTabs()
      ? this.activeTab() === 'booking'
      : this.mode() === 'booking';

    const request$ = useBooking
      ? this.bookingSvc.checkIn(payload)
      : this.memberSvc.scanAttendanceQr(payload);

    request$.subscribe({
      next: (res) => {
        this.processing.set(false);
        if (res.success && res.data) {
          this.lastResult.set(res.data);
          this.notify.success(res.message ?? 'Check-in successful');
          this.scanning.set(false);
        } else {
          this.lastError.set(res.message ?? 'Check-in failed');
          this.notify.error(this.lastError()!);
        }
      },
      error: (err) => {
        this.processing.set(false);
        const message = err.error?.message ?? err.message ?? 'Check-in failed';
        this.lastError.set(message);
        this.notify.error(message);
      },
    });
  }
}
