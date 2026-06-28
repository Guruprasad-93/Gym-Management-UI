import { Component, OnInit, inject, signal } from '@angular/core';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { WorkoutService } from '../../../core/services/workout.service';
import { NotificationService } from '../../../core/services/notification.service';
import { AuthService } from '../../../core/services/auth.service';
import { Permissions } from '../../../core/constants/permissions';
import { Exercise } from '../../../shared/models/workout.models';

@Component({
  selector: 'app-workout-plan-editor',
  standalone: true,
  imports: [ReactiveFormsModule, RouterModule, MatIconModule, MatTooltipModule, MatProgressSpinnerModule],
  templateUrl: './workout-plan-editor.component.html',
  styleUrl: './workout-plan-editor.component.css',
})
export class WorkoutPlanEditorComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly svc = inject(WorkoutService);
  private readonly notify = inject(NotificationService);
  readonly auth = inject(AuthService);
  readonly permissions = Permissions;

  loading = signal(false);
  saving = signal(false);
  isEdit = signal(false);
  library = signal<Exercise[]>([]);
  exercisesLoaded = signal(false);
  planId: number | null = null;

  /** Gym admin can edit; trainers with view-only access open the same screen read-only. */
  get canManage(): boolean {
    return this.auth.hasPermission(Permissions.ManageWorkoutPlans);
  }

  get workoutPlansPath(): string {
    return this.router.url.includes('/trainer/') ? '/trainer/workout-plans' : '/gym-admin/workout-plans';
  }

  form = this.fb.group({
    planName: ['', Validators.required],
    description: [''],
    goal: [''],
    durationWeeks: [null as number | null],
    isActive: [true],
    exercises: this.fb.array([]),
  });

  get exercises(): FormArray {
    return this.form.get('exercises') as FormArray;
  }

  dayCount(): number {
    const days = new Set<number>();
    for (const control of this.exercises.controls) {
      const day = Number(control.get('dayNumber')?.value);
      if (day > 0) days.add(day);
    }
    return days.size;
  }

  ngOnInit(): void {
    this.svc.getExercises(false).subscribe({
      next: (res) => {
        this.exercisesLoaded.set(true);
        if (res.success && res.data) this.library.set(res.data);
      },
      error: () => {
        this.exercisesLoaded.set(true);
        this.notify.error('Failed to load exercise library');
      },
    });

    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.isEdit.set(true);
      this.planId = Number(id);
      this.loading.set(true);
      this.svc.getById(this.planId).subscribe({
        next: (res) => {
          this.loading.set(false);
          if (res.success && res.data) {
            this.patchForm(res.data);
            if (!this.canManage) this.form.disable();
          }
        },
        error: () => {
          this.loading.set(false);
          this.notify.error('Failed to load plan');
        },
      });
    } else {
      if (!this.canManage) {
        void this.router.navigate([this.workoutPlansPath]);
        return;
      }
      this.addRow();
    }
  }

  addRow(): void {
    this.exercises.push(
      this.fb.group({
        dayNumber: [1, Validators.required],
        exerciseId: ['' as number | string, Validators.required],
        sets: [3],
        reps: ['10'],
        weight: [''],
        restSeconds: [60],
        notes: [''],
        sortOrder: [this.exercises.length],
      })
    );
  }

  removeRow(i: number): void {
    if (this.exercises.length <= 1) return;
    this.exercises.removeAt(i);
  }

  save(): void {
    if (this.form.invalid) return;
    this.saving.set(true);
    const raw = this.form.getRawValue();
    const payload = {
      planName: raw.planName!,
      description: raw.description || undefined,
      goal: raw.goal || undefined,
      durationWeeks: raw.durationWeeks ?? undefined,
      isActive: raw.isActive ?? true,
      exercises: (raw.exercises as Array<{
        dayNumber: number | null;
        exerciseId: number | string | null;
        sets: number | null;
        reps: string | null;
        weight: string | null;
        restSeconds: number | null;
        notes: string | null;
      }>).map((ex, idx) => ({
        dayNumber: Number(ex.dayNumber),
        exerciseId: Number(ex.exerciseId),
        sets: ex.sets ?? undefined,
        reps: ex.reps || undefined,
        weight: ex.weight || undefined,
        restSeconds: ex.restSeconds ?? undefined,
        notes: ex.notes || undefined,
        sortOrder: idx,
      })),
    };

    const req =
      this.isEdit() && this.planId ? this.svc.update(this.planId, payload) : this.svc.create(payload);
    req.subscribe({
      next: (res) => {
        this.saving.set(false);
        if (res.success) {
          this.notify.success('Plan saved');
          void this.router.navigate([this.workoutPlansPath]);
        }
      },
      error: () => {
        this.saving.set(false);
        this.notify.error('Save failed');
      },
    });
  }

  private patchForm(plan: {
    planName: string;
    description?: string;
    goal?: string;
    durationWeeks?: number;
    isActive: boolean;
    exercises: {
      dayNumber: number;
      exerciseId: number;
      sets?: number;
      reps?: string;
      weight?: string;
      restSeconds?: number;
      notes?: string;
      sortOrder: number;
    }[];
  }): void {
    this.form.patchValue({
      planName: plan.planName,
      description: plan.description ?? '',
      goal: plan.goal ?? '',
      durationWeeks: plan.durationWeeks ?? null,
      isActive: plan.isActive,
    });
    plan.exercises.forEach((ex) => {
      this.exercises.push(
        this.fb.group({
          dayNumber: [ex.dayNumber, Validators.required],
          exerciseId: [ex.exerciseId, Validators.required],
          sets: [ex.sets ?? 3],
          reps: [ex.reps ?? ''],
          weight: [ex.weight ?? ''],
          restSeconds: [ex.restSeconds ?? 60],
          notes: [ex.notes ?? ''],
          sortOrder: [ex.sortOrder],
        })
      );
    });
  }
}
