import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { SystemFeature } from '../../../shared/models/plan.models';
import {
  missingDependencyCodes,
  validateFeatureDependencies,
} from './feature-dependency.rules';

@Component({
  selector: 'app-plan-feature-picker',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
  ],
  templateUrl: './plan-feature-picker.component.html',
  styleUrl: './plan-feature-picker.component.css',
})
export class PlanFeaturePickerComponent implements OnChanges {
  private readonly fb = inject(FormBuilder);

  @Input() features: SystemFeature[] = [];
  @Input() selectedIds: number[] = [];
  @Input() dependencyMap: Record<string, string[]> = {};
  @Input() readonly = false;

  @Output() selectedIdsChange = new EventEmitter<number[]>();

  searchControl = this.fb.nonNullable.control('');
  validationMessages: string[] = [];
  highlightedCodes = new Set<string>();

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['selectedIds'] || changes['dependencyMap']) {
      this.runValidation();
    }
  }

  get categories(): string[] {
    return [...new Set(this.filteredFeatures.map((f) => f.category))].sort();
  }

  get filteredFeatures(): SystemFeature[] {
    const q = this.searchControl.value.trim().toLowerCase();
    if (!q) return this.features;
    return this.features.filter(
      (f) =>
        f.featureName.toLowerCase().includes(q) ||
        f.featureCode.toLowerCase().includes(q) ||
        f.category.toLowerCase().includes(q),
    );
  }

  featuresInCategory(category: string): SystemFeature[] {
    return this.filteredFeatures.filter((f) => f.category === category);
  }

  isSelected(featureId: number): boolean {
    return this.selectedIds.includes(featureId);
  }

  toggle(feature: SystemFeature, checked: boolean): void {
    if (this.readonly) return;

    let next = new Set(this.selectedIds);
    if (checked) {
      next.add(feature.featureId);
    } else {
      next.delete(feature.featureId);
    }

    this.selectedIds = [...next];
    this.runValidation();
    this.selectedIdsChange.emit(this.selectedIds);
  }

  private runValidation(): void {
    const codeById = new Map(this.features.map((f) => [f.featureId, f.featureCode]));
    const selectedCodes = this.selectedIds
      .map((id) => codeById.get(id))
      .filter((code): code is string => !!code);

    const result = validateFeatureDependencies(selectedCodes, this.dependencyMap);
    this.validationMessages = result.violations.map((v) => v.message);
    this.highlightedCodes = missingDependencyCodes(result);
  }
}
