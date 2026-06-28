import { Component, OnInit, ViewChild, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTableModule } from '@angular/material/table';
import { concatMap, forkJoin, from, last, map, of, switchMap } from 'rxjs';
import { PlanManagementService } from '../../../core/services/plan-management.service';
import { DialogService } from '../../../core/services/dialog.service';
import { NotificationService } from '../../../core/services/notification.service';
import {
  DynamicPlan,
  PlanPricingOption,
  SystemFeature,
  UpsertPlanQuota,
  UpsertPricingOptionRequest,
} from '../../../shared/models/plan.models';
import { validateFeatureDependencies } from './feature-dependency.rules';
import { PlanFeaturePickerComponent } from './plan-feature-picker.component';
import { PlanQuotaEditorComponent } from './plan-quota-editor.component';
import { PricingOptionDialogComponent } from './pricing-option-dialog.component';
import { slugifyPlanCode } from './plan.utils';

type FormMode = 'create' | 'edit' | 'view';

interface PendingPricingOption extends UpsertPricingOptionRequest {
  tempId: number;
}

@Component({
  selector: 'app-subscription-plan-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterModule,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
    MatSlideToggleModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatTableModule,
    PlanFeaturePickerComponent,
    PlanQuotaEditorComponent,
  ],
  templateUrl: './plan-form.component.html',
  styleUrls: ['./subscription-plans.shared.css', './plan-form.component.css'],
})
export class SubscriptionPlanFormComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly planService = inject(PlanManagementService);
  private readonly notify = inject(NotificationService);
  private readonly dialog = inject(DialogService);
  private readonly fb = inject(FormBuilder);

  @ViewChild(PlanQuotaEditorComponent) quotaEditor?: PlanQuotaEditorComponent;

  mode = signal<FormMode>('create');
  planId: number | null = null;
  saving = false;
  loading = true;

  features: SystemFeature[] = [];
  dependencyMap: Record<string, string[]> = {};
  selectedFeatureIds: number[] = [];
  quotas: UpsertPlanQuota = this.defaultQuotas();

  pricingOptions: PlanPricingOption[] = [];
  pendingPricing: PendingPricingOption[] = [];
  pricingColumns = ['label', 'price', 'sort', 'actions'];

  readonly basicForm = this.fb.nonNullable.group({
    planCode: ['', Validators.required],
    planName: ['', Validators.required],
    description: [''],
    isTrialPlan: [false],
    isActive: [true],
    trialDays: [14],
    sortOrder: [0],
  });

  get readonly(): boolean {
    return this.mode() === 'view';
  }

  get pageTitle(): string {
    if (this.mode() === 'create') return 'Create Subscription Plan';
    if (this.mode() === 'view') return 'View Subscription Plan';
    return 'Edit Subscription Plan';
  }

  get isCreate(): boolean {
    return this.mode() === 'create';
  }

  get displayPricing(): (PlanPricingOption | PendingPricingOption)[] {
    return this.isCreate ? this.pendingPricing : this.pricingOptions;
  }

  ngOnInit(): void {
    const path = this.route.snapshot.routeConfig?.path ?? '';
    if (path === 'new') {
      this.mode.set('create');
    } else if (path.endsWith('edit')) {
      this.mode.set('edit');
      this.planId = Number(this.route.snapshot.paramMap.get('id'));
    } else {
      this.mode.set('view');
      this.planId = Number(this.route.snapshot.paramMap.get('id'));
    }

    if (this.mode() === 'create') {
      this.basicForm.controls.planName.valueChanges.subscribe((name) => {
        if (!this.basicForm.controls.planCode.dirty) {
          this.basicForm.controls.planCode.setValue(slugifyPlanCode(name), { emitEvent: false });
        }
      });
    } else {
      this.basicForm.controls.planCode.disable();
    }

    forkJoin({
      features: this.planService.getFeatures(),
      dependencies: this.planService.getFeatureDependencies(),
      plan: this.planId ? this.planService.getPlan(this.planId) : of(null),
    }).subscribe({
      next: ({ features, dependencies, plan }) => {
        if (features.success && features.data) {
          this.features = features.data;
        }
        if (dependencies.success && dependencies.data) {
          this.dependencyMap = dependencies.data;
        }

        if (plan?.success && plan.data) {
          this.patchPlan(plan.data);
        }

        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.notify.error('Failed to load plan data');
      },
    });
  }

  onFeatureSelectionChange(ids: number[]): void {
    this.selectedFeatureIds = ids;
  }

  onQuotasChange(quotas: UpsertPlanQuota): void {
    this.quotas = quotas;
  }

  openPricingDialog(option?: PlanPricingOption | PendingPricingOption): void {
    if (this.readonly) return;

    const ref = this.dialog.open(PricingOptionDialogComponent, {
      width: '440px',
      data: {
        option: option as PlanPricingOption | undefined,
        nextSortOrder: this.displayPricing.length + 1,
      },
    });

    ref.afterClosed().subscribe((dto) => {
      if (!dto) return;
      const payload = dto as UpsertPricingOptionRequest;

      if (this.isCreate) {
        if (option && 'tempId' in option) {
          this.pendingPricing = this.pendingPricing.map((p) =>
            p.tempId === option.tempId ? { ...p, ...payload } : p,
          );
        } else {
          this.pendingPricing = [
            ...this.pendingPricing,
            { ...payload, tempId: Date.now() + this.pendingPricing.length },
          ];
        }
        return;
      }

      if (option && 'pricingOptionId' in option) {
        this.planService.updatePricingOption(option.pricingOptionId, payload).subscribe({
          next: (res) => {
            if (res.success) {
              this.notify.success('Pricing option updated');
              this.reloadPlan();
            }
          },
          error: (err) => this.notify.error(err.error?.message ?? 'Update failed'),
        });
      } else if (this.planId) {
        this.planService.createPricingOption(this.planId, payload).subscribe({
          next: (res) => {
            if (res.success) {
              this.notify.success('Pricing option added');
              this.reloadPlan();
            }
          },
          error: (err) => this.notify.error(err.error?.message ?? 'Create failed'),
        });
      }
    });
  }

  deletePricing(option: PlanPricingOption | PendingPricingOption): void {
    if (this.readonly) return;

    this.dialog
      .confirm({
        title: 'Delete pricing option',
        message: 'Remove this pricing option?',
        tone: 'danger',
        confirmLabel: 'Delete',
      })
      .subscribe((ok) => {
        if (!ok) return;

        if (this.isCreate && 'tempId' in option) {
          this.pendingPricing = this.pendingPricing.filter((p) => p.tempId !== option.tempId);
          return;
        }

        if ('pricingOptionId' in option) {
          this.planService.deletePricingOption(option.pricingOptionId).subscribe({
            next: (res) => {
              if (res.success) {
                this.notify.success('Pricing option removed');
                this.reloadPlan();
              }
            },
            error: (err) => this.notify.error(err.error?.message ?? 'Delete failed'),
          });
        }
      });
  }

  movePricing(index: number, direction: -1 | 1): void {
    if (this.readonly) return;
    const target = index + direction;
    const items = [...this.displayPricing];
    if (target < 0 || target >= items.length) return;

    [items[index], items[target]] = [items[target], items[index]];

    if (this.isCreate) {
      this.pendingPricing = (items as PendingPricingOption[]).map((item, idx) => ({
        ...item,
        sortOrder: idx + 1,
      }));
      return;
    }

    if (!this.planId) return;
    const reorderItems = (items as PlanPricingOption[]).map((item, idx) => ({
      pricingOptionId: item.pricingOptionId,
      sortOrder: idx + 1,
    }));

    this.planService.reorderPricingOptions(this.planId, { items: reorderItems }).subscribe({
      next: (res) => {
        if (res.success) {
          this.reloadPlan();
        }
      },
      error: (err) => this.notify.error(err.error?.message ?? 'Reorder failed'),
    });
  }

  save(): void {
    if (this.readonly || this.basicForm.invalid) {
      this.basicForm.markAllAsTouched();
      return;
    }

    const codeById = new Map(this.features.map((f) => [f.featureId, f.featureCode]));
    const selectedCodes = this.selectedFeatureIds
      .map((id) => codeById.get(id))
      .filter((code): code is string => !!code);
    const clientValidation = validateFeatureDependencies(selectedCodes, this.dependencyMap);
    if (!clientValidation.isValid) {
      this.notify.error('Resolve feature dependency issues before saving.');
      return;
    }

    this.saving = true;
    const basic = this.basicForm.getRawValue();
    const quotas = this.quotaEditor?.getValue() ?? this.quotas;

    this.planService.validateFeatures(this.selectedFeatureIds).subscribe({
      next: (validationRes) => {
        if (!validationRes.success || !validationRes.data?.isValid) {
          this.saving = false;
          this.notify.error('Feature dependencies are not satisfied.');
          return;
        }

        if (this.isCreate) {
          this.planService
            .createPlan({
              planCode: basic.planCode,
              planName: basic.planName,
              description: basic.description || undefined,
              isTrialPlan: basic.isTrialPlan,
              isPublic: true,
              trialDays: basic.isTrialPlan ? basic.trialDays : 0,
              sortOrder: basic.sortOrder,
              quotas,
              featureIds: this.selectedFeatureIds,
            })
            .pipe(
              switchMap((createRes) => {
                if (!createRes.success || !createRes.data) {
                  throw new Error(createRes.message ?? 'Create failed');
                }
                const newId = createRes.data.id;
                if (!this.pendingPricing.length) return of(createRes);
                return from(this.pendingPricing).pipe(
                  concatMap((option) => this.planService.createPricingOption(newId, option)),
                  last(),
                  map(() => createRes),
                );
              }),
            )
            .subscribe({
              next: () => {
                this.saving = false;
                this.notify.success('Plan created');
                this.router.navigate(['/super-admin/subscription-plans']);
              },
              error: (err) => {
                this.saving = false;
                this.notify.error(err.error?.message ?? err.message ?? 'Create failed');
              },
            });
          return;
        }

        if (!this.planId) return;

        this.planService
          .updatePlan(this.planId, {
            planCode: basic.planCode,
            planName: basic.planName,
            description: basic.description || undefined,
            isTrialPlan: basic.isTrialPlan,
            isPublic: true,
            trialDays: basic.isTrialPlan ? basic.trialDays : 0,
            sortOrder: basic.sortOrder,
            isActive: basic.isActive,
            quotas,
            featureIds: this.selectedFeatureIds,
          })
          .subscribe({
            next: (res) => {
              this.saving = false;
              if (res.success) {
                this.notify.success('Plan updated');
                this.router.navigate(['/super-admin/subscription-plans']);
              }
            },
            error: (err) => {
              this.saving = false;
              this.notify.error(err.error?.message ?? 'Update failed');
            },
          });
      },
      error: () => {
        this.saving = false;
        this.notify.error('Feature validation failed');
      },
    });
  }

  pricingLabel(option: PlanPricingOption | PendingPricingOption): string {
    if ('displayLabel' in option && option.displayLabel) return option.displayLabel;
    return `${option.durationValue} ${option.durationUnit}`;
  }

  pricingPrice(option: PlanPricingOption | PendingPricingOption): string {
    return `₹${option.price}`;
  }

  private patchPlan(plan: DynamicPlan): void {
    this.basicForm.patchValue({
      planCode: plan.planCode,
      planName: plan.planName,
      description: plan.description ?? '',
      isTrialPlan: plan.isTrialPlan,
      isActive: plan.isActive,
      trialDays: plan.trialDays,
      sortOrder: plan.sortOrder,
    });

    if (this.readonly) {
      this.basicForm.disable();
    }

    this.selectedFeatureIds = plan.features.filter((f) => f.isIncluded).map((f) => f.featureId);
    this.pricingOptions = [...plan.pricingOptions].sort((a, b) => a.sortOrder - b.sortOrder);

    if (plan.quotas) {
      this.quotas = {
        maxMembers: plan.quotas.maxMembers,
        maxTrainers: plan.quotas.maxTrainers,
        maxBranches: plan.quotas.maxBranches,
        maxStorageGB: plan.quotas.maxStorageGB,
        maxSmsPerMonth: plan.quotas.maxSmsPerMonth,
        maxWhatsappMessages: plan.quotas.maxWhatsappMessages,
      };
    }
  }

  private reloadPlan(): void {
    if (!this.planId) return;
    this.planService.getPlan(this.planId).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.pricingOptions = [...res.data.pricingOptions].sort((a, b) => a.sortOrder - b.sortOrder);
        }
      },
    });
  }

  private defaultQuotas(): UpsertPlanQuota {
    return {
      maxMembers: 100,
      maxTrainers: 10,
      maxBranches: 1,
      maxStorageGB: 5,
      maxSmsPerMonth: 100,
      maxWhatsappMessages: 100,
    };
  }
}
