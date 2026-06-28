import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../core/services/auth.service';
import { BookingService } from '../../../core/services/booking.service';
import { BranchService } from '../../../core/services/branch.service';
import { NotificationService } from '../../../core/services/notification.service';
import { TrainerService } from '../../../core/services/trainer.service';
import { Branch } from '../../../shared/models/branch.models';
import { DAY_NAMES } from '../../../shared/models/booking.models';
import { Trainer } from '../../../shared/models/trainer.models';

@Component({
  selector: 'app-schedule-editor',
  standalone: true,
  imports: [ReactiveFormsModule, RouterModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './schedule-editor.component.html',
  styleUrl: './schedule-editor.component.css',
})
export class ScheduleEditorComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly bookingSvc = inject(BookingService);
  private readonly branchSvc = inject(BranchService);
  private readonly trainerSvc = inject(TrainerService);
  private readonly auth = inject(AuthService);
  private readonly notify = inject(NotificationService);

  readonly dayNames = DAY_NAMES;
  loading = signal(false);
  saving = signal(false);
  isEdit = signal(false);
  branches = signal<Branch[]>([]);
  trainers = signal<Trainer[]>([]);
  scheduleId: number | null = null;

  form = this.fb.nonNullable.group({
    branchId: [0, [Validators.required, Validators.min(1)]],
    className: ['', Validators.required],
    description: [''],
    trainerId: [0, [Validators.required, Validators.min(1)]],
    dayOfWeek: [1, [Validators.required, Validators.min(0), Validators.max(6)]],
    startTime: ['07:00', Validators.required],
    endTime: ['08:00', Validators.required],
    capacity: [20, [Validators.required, Validators.min(1), Validators.max(500)]],
  });

  ngOnInit(): void {
    this.branchSvc.getList().subscribe({
      next: (r) => {
        if (r.success && r.data) this.branches.set(r.data);
      },
      error: () => this.notify.error('Failed to load branches'),
    });
    this.trainerSvc.getAll(this.auth.user()?.gymId ?? null).subscribe({
      next: (items) => this.trainers.set(items),
      error: () => this.notify.error('Failed to load trainers'),
    });

    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.isEdit.set(true);
      this.scheduleId = Number(id);
      this.loading.set(true);
      this.bookingSvc.getSchedule(this.scheduleId).subscribe({
        next: (res) => {
          this.loading.set(false);
          if (res.success && res.data) this.patchForm(res.data);
        },
        error: () => {
          this.loading.set(false);
          this.notify.error('Failed to load schedule');
        },
      });
    }
  }

  save(): void {
    if (this.form.invalid) return;
    const raw = this.form.getRawValue();
    if (raw.endTime <= raw.startTime) {
      this.notify.error('End time must be after start time');
      return;
    }

    this.saving.set(true);
    const payload = {
      branchId: raw.branchId,
      className: raw.className.trim(),
      description: raw.description?.trim() || undefined,
      trainerId: raw.trainerId,
      dayOfWeek: raw.dayOfWeek,
      startTime: toApiTime(raw.startTime),
      endTime: toApiTime(raw.endTime),
      capacity: raw.capacity,
    };

    const request$ = this.isEdit() && this.scheduleId
      ? this.bookingSvc.updateSchedule(this.scheduleId, { ...payload, id: this.scheduleId, status: 'Active' })
      : this.bookingSvc.createSchedule(payload);

    request$.subscribe({
      next: (res) => {
        this.saving.set(false);
        if (res.success) {
          this.notify.success(this.isEdit() ? 'Schedule updated' : 'Schedule created');
          void this.router.navigateByUrl('/gym-admin/schedules');
        } else {
          this.notify.error(res.message ?? 'Save failed');
        }
      },
      error: (e) => {
        this.saving.set(false);
        this.notify.error(e.error?.message ?? 'Save failed');
      },
    });
  }

  private patchForm(schedule: {
    branchId: number;
    className: string;
    description?: string;
    trainerId: number;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    capacity: number;
  }): void {
    this.form.patchValue({
      branchId: schedule.branchId,
      className: schedule.className,
      description: schedule.description ?? '',
      trainerId: schedule.trainerId,
      dayOfWeek: schedule.dayOfWeek,
      startTime: toTimeInput(schedule.startTime),
      endTime: toTimeInput(schedule.endTime),
      capacity: schedule.capacity,
    });
  }
}

function toTimeInput(value: string): string {
  if (!value) return '';
  return value.length >= 5 ? value.slice(0, 5) : value;
}

function toApiTime(value: string): string {
  return value.length === 5 ? `${value}:00` : value;
}
