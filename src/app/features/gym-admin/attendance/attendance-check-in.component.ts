import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MemberService } from '../../../core/services/member.service';
import { AttendanceService } from '../../../core/services/attendance.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Member } from '../../../shared/models/member.models';

@Component({
  selector: 'app-attendance-check-in',
  standalone: true,
  imports: [ReactiveFormsModule, RouterModule, MatIconModule],
  templateUrl: './attendance-check-in.component.html',
  styleUrl: './attendance-check-in.component.css',
})
export class AttendanceCheckInComponent implements OnInit {
  private readonly memberSvc = inject(MemberService);
  private readonly attendanceSvc = inject(AttendanceService);
  private readonly notify = inject(NotificationService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  members = signal<Member[]>([]);
  saving = signal(false);
  form = this.fb.nonNullable.group({ memberId: [0, [Validators.required, Validators.min(1)]], notes: [''] });

  attendanceHomeLink(): string {
    return this.router.url.includes('/trainer/') ? '/trainer/attendance' : '/gym-admin/attendance';
  }

  ngOnInit(): void {
    this.memberSvc.getAll().subscribe({
      next: (items) => this.members.set(items),
      error: () => this.notify.error('Failed to load members'),
    });
  }

  submit(): void {
    if (this.form.invalid) return;
    this.saving.set(true);
    const { memberId, notes } = this.form.getRawValue();
    this.attendanceSvc.checkIn(memberId, notes || undefined).subscribe({
      next: (res) => {
        this.saving.set(false);
        if (res.success) {
          this.notify.success('Checked in');
          void this.router.navigateByUrl(this.attendanceHomeLink());
        } else this.notify.error(res.message ?? 'Check-in failed');
      },
      error: (e) => {
        this.saving.set(false);
        this.notify.error(e.error?.message ?? 'Check-in failed');
      },
    });
  }
}
