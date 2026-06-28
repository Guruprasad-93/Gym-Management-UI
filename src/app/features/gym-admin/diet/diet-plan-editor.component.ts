import { Component, OnInit, inject, signal } from '@angular/core';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DietService } from '../../../core/services/diet.service';
import { NotificationService } from '../../../core/services/notification.service';
import { DietCategory, MEAL_TIMES } from '../../../shared/models/diet.models';

@Component({
  selector: 'app-diet-plan-editor',
  standalone: true,
  imports: [ReactiveFormsModule, RouterModule, MatIconModule, MatTooltipModule, MatProgressSpinnerModule],
  templateUrl: './diet-plan-editor.component.html',
  styleUrl: './diet-plan-editor.component.css',
})
export class DietPlanEditorComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly svc = inject(DietService);
  private readonly notify = inject(NotificationService);

  readonly mealTimes = MEAL_TIMES;
  loading = signal(false);
  saving = signal(false);
  isEdit = signal(false);
  categories = signal<DietCategory[]>([]);
  planId: number | null = null;

  form = this.fb.group({
    planName: ['', Validators.required],
    description: [''],
    dietCategoryId: ['' as number | string | null],
    targetCalories: [null as number | null],
    isActive: [true],
    items: this.fb.array([]),
  });

  get items(): FormArray {
    return this.form.get('items') as FormArray;
  }

  totalItemCalories(): number {
    return this.items.controls.reduce((sum, control) => {
      const calories = control.get('calories')?.value;
      return sum + (typeof calories === 'number' ? calories : 0);
    }, 0);
  }

  ngOnInit(): void {
    this.svc.getCategories().subscribe({
      next: (res) => {
        if (res.success && res.data) this.categories.set(res.data);
      },
      error: () => this.notify.error('Failed to load diet categories'),
    });
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.isEdit.set(true);
      this.planId = Number(id);
      this.loading.set(true);
      this.svc.getById(this.planId).subscribe({
        next: (res) => {
          this.loading.set(false);
          if (res.success && res.data) this.patchForm(res.data);
        },
        error: () => {
          this.loading.set(false);
          this.notify.error('Failed to load plan');
        },
      });
    } else {
      this.addItem();
    }
  }

  addItem(): void {
    this.items.push(
      this.fb.group({
        mealTime: ['Breakfast', Validators.required],
        foodName: ['', Validators.required],
        quantity: [''],
        calories: [null as number | null],
        notes: [''],
        sortOrder: [this.items.length],
      })
    );
  }

  removeItem(i: number): void {
    if (this.items.length <= 1) return;
    this.items.removeAt(i);
  }

  save(): void {
    if (this.form.invalid) return;
    this.saving.set(true);
    const raw = this.form.getRawValue();
    const payload = {
      planName: raw.planName!,
      description: raw.description || undefined,
      dietCategoryId: raw.dietCategoryId ? Number(raw.dietCategoryId) : undefined,
      targetCalories: raw.targetCalories ?? undefined,
      isActive: raw.isActive ?? true,
      items: (raw.items as Array<{
        mealTime: string | null;
        foodName: string | null;
        quantity: string | null;
        calories: number | null;
        notes: string | null;
      }>).map((it, idx) => ({
        mealTime: it.mealTime!,
        foodName: it.foodName!,
        quantity: it.quantity || undefined,
        calories: it.calories ?? undefined,
        notes: it.notes || undefined,
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
          this.router.navigate(['/gym-admin/diet-plans']);
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
    dietCategoryId?: number;
    targetCalories?: number;
    isActive: boolean;
    items: {
      mealTime: string;
      foodName: string;
      quantity?: string;
      calories?: number;
      notes?: string;
      sortOrder: number;
    }[];
  }): void {
    this.form.patchValue({
      planName: plan.planName,
      description: plan.description ?? '',
      dietCategoryId: plan.dietCategoryId != null ? plan.dietCategoryId : '',
      targetCalories: plan.targetCalories ?? null,
      isActive: plan.isActive,
    });
    plan.items.forEach((it) => {
      this.items.push(
        this.fb.group({
          mealTime: [it.mealTime, Validators.required],
          foodName: [it.foodName, Validators.required],
          quantity: [it.quantity ?? ''],
          calories: [it.calories ?? null],
          notes: [it.notes ?? ''],
          sortOrder: [it.sortOrder],
        })
      );
    });
  }
}
