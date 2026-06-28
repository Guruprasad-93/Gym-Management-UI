import { Component, OnInit, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogModule } from '@angular/material/dialog';
import { debounceTime } from 'rxjs';
import { WorkoutService } from '../../../core/services/workout.service';
import { DialogService } from '../../../core/services/dialog.service';
import { NotificationService } from '../../../core/services/notification.service';
import { AuthService } from '../../../core/services/auth.service';
import { Permissions } from '../../../core/constants/permissions';
import { WorkoutPlanListItem } from '../../../shared/models/workout.models';
import { AssignWorkoutPlanDialogComponent } from './assign-workout-plan-dialog.component';

@Component({
  selector: 'app-workout-plan-list',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterModule,
    MatTableModule,
    MatIconModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatDialogModule,
  ],
  templateUrl: './workout-plan-list.component.html',
  styleUrl: './workout-plan-list.component.css',
})
export class WorkoutPlanListComponent implements OnInit {
  readonly auth = inject(AuthService);
  readonly permissions = Permissions;
  private readonly svc = inject(WorkoutService);
  private readonly notify = inject(NotificationService);
  private readonly dialog = inject(DialogService);

  loading = signal(true);
  plans = signal<WorkoutPlanListItem[]>([]);
  cols = ['name', 'goal', 'weeks', 'exercises', 'status', 'actions'];
  search = new FormControl('');
  includeInactive = new FormControl(false);

  ngOnInit(): void {
    this.search.valueChanges.pipe(debounceTime(300)).subscribe(() => this.load());
    this.includeInactive.valueChanges.subscribe(() => this.load());
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.svc.getPlans(!!this.includeInactive.value, this.search.value || undefined).subscribe({
      next: (r) => {
        this.loading.set(false);
        if (r.success && r.data) this.plans.set(r.data);
      },
      error: () => {
        this.loading.set(false);
        this.notify.error('Failed to load plans');
      },
    });
  }

  assign(p: WorkoutPlanListItem): void {
    this.dialog
      .open(AssignWorkoutPlanDialogComponent, {
        width: '520px',
        maxWidth: '95vw',
        data: { workoutPlanId: p.workoutPlanId, planName: p.planName },
      })
      .afterClosed()
      .subscribe((ok) => ok && this.load());
  }

  clone(p: WorkoutPlanListItem): void {
    this.svc.clone(p.workoutPlanId).subscribe({
      next: () => {
        this.notify.success('Cloned');
        this.load();
      },
      error: () => this.notify.error('Clone failed'),
    });
  }

  remove(p: WorkoutPlanListItem): void {
    this.dialog
      .confirm({
        title: 'Delete workout plan',
        message: `Delete "${p.planName}"?`,
        tone: 'danger',
        confirmLabel: 'Delete',
      })
      .subscribe((ok) => {
        if (!ok) return;
        this.svc.delete(p.workoutPlanId).subscribe({
          next: () => {
            this.notify.success('Deleted');
            this.load();
          },
          error: (e) => this.notify.error(e?.error?.message || 'Delete failed'),
        });
      });
  }

  exportPdf(p: WorkoutPlanListItem): void {
    this.svc.downloadPdf(p.workoutPlanId).subscribe({
      next: (blob) => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `workout-${p.workoutPlanId}.pdf`;
        a.click();
      },
      error: () => this.notify.error('Export failed'),
    });
  }
}
