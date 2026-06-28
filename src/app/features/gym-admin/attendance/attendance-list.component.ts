import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { debounceTime } from 'rxjs';
import { AttendanceService } from '../../../core/services/attendance.service';
import { NotificationService } from '../../../core/services/notification.service';
import { AuthService } from '../../../core/services/auth.service';
import { Permissions } from '../../../core/constants/permissions';
import { MemberAttendance, AttendanceStatus } from '../../../shared/models/attendance.models';
import { untilDestroyed } from '../../../core/utils/destroy-ref.util';

@Component({
  selector: 'app-attendance-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe,
    ReactiveFormsModule,
    RouterModule,
    MatTableModule,
    MatPaginatorModule,
    MatIconModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './attendance-list.component.html',
  styleUrl: './attendance-list.component.css',
})
export class AttendanceListComponent implements OnInit {
  private readonly svc = inject(AttendanceService);
  private readonly notify = inject(NotificationService);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  readonly auth = inject(AuthService);
  readonly permissions = Permissions;

  readonly cols = ['memberName', 'attendanceDate', 'statusName', 'checkInAt', 'checkOutAt', 'checkoutType', 'actions'];
  rows = signal<MemberAttendance[]>([]);
  statuses = signal<AttendanceStatus[]>([]);
  loading = signal(true);
  total = signal(0);
  pageIndex = 0;
  pageSize = 10;

  searchControl = this.fb.nonNullable.control('');
  statusControl = this.fb.control<number | null>(null);
  checkoutTypeControl = this.fb.control<string | null>(null);
  fromControl = this.fb.nonNullable.control(this.isoDate(-30));
  toControl = this.fb.nonNullable.control(this.isoDate(0));

  get pageSummary(): string {
    const count = this.total();
    if (!count) return 'No records';
    const start = this.pageIndex * this.pageSize + 1;
    const end = Math.min((this.pageIndex + 1) * this.pageSize, count);
    return `Showing ${start}–${end} of ${count} records`;
  }

  ngOnInit(): void {
    this.svc
      .getStatuses()
      .pipe(untilDestroyed(this.destroyRef))
      .subscribe((r) => {
        if (r.success && r.data) this.statuses.set(r.data);
      });
    this.searchControl.valueChanges
      .pipe(debounceTime(350), untilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.pageIndex = 0;
        this.load();
      });
    const reload = () => {
      this.pageIndex = 0;
      this.load();
    };
    this.statusControl.valueChanges.pipe(untilDestroyed(this.destroyRef)).subscribe(reload);
    this.checkoutTypeControl.valueChanges.pipe(untilDestroyed(this.destroyRef)).subscribe(reload);
    this.fromControl.valueChanges.pipe(untilDestroyed(this.destroyRef)).subscribe(reload);
    this.toControl.valueChanges.pipe(untilDestroyed(this.destroyRef)).subscribe(reload);
    this.load();
  }

  memberInitials(name: string): string {
    return (name ?? '')
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('');
  }

  onPage(e: PageEvent): void {
    this.pageIndex = e.pageIndex;
    this.pageSize = e.pageSize;
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.svc
      .getPaged({
        search: this.searchControl.value || undefined,
        statusId: this.statusControl.value ?? undefined,
        openOnly: this.checkoutTypeControl.value === 'Open',
        checkoutTypeFilter:
          this.checkoutTypeControl.value && this.checkoutTypeControl.value !== 'Open'
            ? this.checkoutTypeControl.value
            : undefined,
        fromDate: this.fromControl.value,
        toDate: this.toControl.value,
        pageNumber: this.pageIndex + 1,
        pageSize: this.pageSize,
      })
      .pipe(untilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.loading.set(false);
          if (res.success && res.data) {
            this.rows.set(res.data.items);
            this.total.set(res.data.totalCount);
          }
        },
        error: () => {
          this.loading.set(false);
          this.notify.error('Failed to load attendance');
        },
      });
  }

  manualCheckOut(row: MemberAttendance): void {
    if (!row.isCurrentlyCheckedIn && row.statusCode !== 'CHECKED_IN') return;
    this.svc
      .checkOut(row.memberId, { memberAttendanceId: row.memberAttendanceId, isManualCheckout: true })
      .pipe(untilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.notify.success(`${row.memberName} manually checked out`);
            this.load();
          }
        },
        error: () => this.notify.error('Manual check-out failed'),
      });
  }

  checkoutTypeLabel(row: MemberAttendance): string {
    if (row.isCurrentlyCheckedIn || row.statusCode === 'CHECKED_IN') return 'Currently Checked In';
    if (row.checkoutType === 'Auto' || row.isAutoCheckout) return 'Auto';
    if (row.checkoutType === 'Manual') return 'Manual';
    if (row.checkoutType === 'Normal') return 'Normal';
    return row.checkOutAt ? 'Normal' : '—';
  }

  private isoDate(offsetDays: number): string {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    return d.toISOString().slice(0, 10);
  }
}
