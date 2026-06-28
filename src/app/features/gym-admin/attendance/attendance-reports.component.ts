import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AttendanceService } from '../../../core/services/attendance.service';
import { BranchService } from '../../../core/services/branch.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Permissions } from '../../../core/constants/permissions';
import {
  DailyAttendanceReport,
  ForgotCheckOutReportItem,
  MonthlyAttendanceReport,
} from '../../../shared/models/attendance.models';
import { Branch } from '../../../shared/models/branch.models';

@Component({
  selector: 'app-attendance-reports',
  standalone: true,
  imports: [DatePipe, ReactiveFormsModule, RouterLink, MatIconModule],
  templateUrl: './attendance-reports.component.html',
  styleUrl: './attendance-reports.component.css',
})
export class AttendanceReportsComponent implements OnInit {
  readonly auth = inject(AuthService);
  readonly permissions = Permissions;
  canExport = this.auth.hasPermission(Permissions.ExportAttendanceReports);
  private readonly svc = inject(AttendanceService);
  private readonly branchSvc = inject(BranchService);
  private readonly notify = inject(NotificationService);
  private readonly fb = inject(FormBuilder);

  reportTab = signal<'daily' | 'monthly' | 'forgot'>('daily');
  dailyDate = this.fb.nonNullable.control(new Date().toISOString().slice(0, 10));
  checkoutTypeFilter = this.fb.control<string | null>(null);
  year = this.fb.nonNullable.control(new Date().getFullYear());
  month = this.fb.nonNullable.control(new Date().getMonth() + 1);
  forgotFrom = this.fb.nonNullable.control(this.isoDate(-30));
  forgotTo = this.fb.nonNullable.control(this.isoDate(0));
  forgotBranchId = this.fb.control<number | null>(null);
  forgotMemberId = this.fb.control<number | null>(null);

  branches = signal<Branch[]>([]);
  dailyReport = signal<DailyAttendanceReport | null>(null);
  monthlyReport = signal<MonthlyAttendanceReport | null>(null);
  forgotReport = signal<ForgotCheckOutReportItem[]>([]);
  forgotTotal = signal(0);
  loadingDaily = signal(false);
  loadingMonthly = signal(false);
  loadingForgot = signal(false);
  dailyLoaded = signal(false);
  monthlyLoaded = signal(false);
  forgotLoaded = signal(false);

  ngOnInit(): void {
    this.branchSvc.getList().subscribe({
      next: (res) => {
        if (res.success && res.data) this.branches.set(res.data);
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

  loadDaily(): void {
    this.loadingDaily.set(true);
    const filter = this.checkoutTypeFilter.value;
    this.svc
      .getDailyReport(
        this.dailyDate.value,
        filter === 'Open',
        filter && filter !== 'Open' ? filter : undefined,
      )
      .subscribe({
        next: (r) => {
          this.loadingDaily.set(false);
          this.dailyLoaded.set(true);
          this.dailyReport.set(r.success && r.data ? r.data : null);
        },
        error: () => {
          this.loadingDaily.set(false);
          this.notify.error('Failed to load daily report');
        },
      });
  }

  loadMonthly(): void {
    this.loadingMonthly.set(true);
    this.svc.getMonthlyReport(this.year.value, this.month.value).subscribe({
      next: (r) => {
        this.loadingMonthly.set(false);
        this.monthlyLoaded.set(true);
        this.monthlyReport.set(r.success && r.data ? r.data : null);
      },
      error: () => {
        this.loadingMonthly.set(false);
        this.notify.error('Failed to load monthly report');
      },
    });
  }

  loadForgot(): void {
    this.loadingForgot.set(true);
    this.svc
      .getForgotCheckOutReport({
        fromDate: this.forgotFrom.value,
        toDate: this.forgotTo.value,
        branchId: this.forgotBranchId.value ?? undefined,
        memberId: this.forgotMemberId.value ?? undefined,
        pageNumber: 1,
        pageSize: 100,
      })
      .subscribe({
        next: (r) => {
          this.loadingForgot.set(false);
          this.forgotLoaded.set(true);
          if (r.success && r.data) {
            this.forgotReport.set(r.data.items);
            this.forgotTotal.set(r.data.totalCount);
          } else {
            this.forgotReport.set([]);
            this.forgotTotal.set(0);
          }
        },
        error: () => {
          this.loadingForgot.set(false);
          this.notify.error('Failed to load forgot check-out report');
        },
      });
  }

  exportDaily(type: 'pdf' | 'excel'): void {
    const obs =
      type === 'pdf'
        ? this.svc.downloadDailyPdf(this.dailyDate.value)
        : this.svc.downloadDailyExcel(this.dailyDate.value);
    obs.subscribe({
      next: (b) => this.save(b, `daily.${type === 'pdf' ? 'pdf' : 'xlsx'}`),
      error: () => this.notify.error('Export failed'),
    });
  }

  exportMonthly(type: 'pdf' | 'excel'): void {
    const obs =
      type === 'pdf'
        ? this.svc.downloadMonthlyPdf(this.year.value, this.month.value)
        : this.svc.downloadMonthlyExcel(this.year.value, this.month.value);
    obs.subscribe({
      next: (b) => this.save(b, `monthly.${type === 'pdf' ? 'pdf' : 'xlsx'}`),
      error: () => this.notify.error('Export failed'),
    });
  }

  private isoDate(offsetDays: number): string {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    return d.toISOString().slice(0, 10);
  }

  private save(blob: Blob, name: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  }
}
