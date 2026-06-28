import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../../shared/models/api-response';
import {
  ClonePlanRequest,
  CreatePlanRequest,
  DynamicPlan,
  FeatureDependencyValidation,
  PlanSummary,
  ReorderPricingRequest,
  SystemFeature,
  UpdatePlanRequest,
  UpsertPricingOptionRequest,
} from '../../shared/models/plan.models';

@Injectable({ providedIn: 'root' })
export class PlanManagementService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/platform/subscription-plans`;

  getFeatures(): Observable<ApiResponse<SystemFeature[]>> {
    return this.http.get<ApiResponse<SystemFeature[]>>(`${this.base}/features`);
  }

  getFeatureDependencies(): Observable<ApiResponse<Record<string, string[]>>> {
    return this.http.get<ApiResponse<Record<string, string[]>>>(`${this.base}/feature-dependencies`);
  }

  validateFeatures(featureIds: number[]): Observable<ApiResponse<FeatureDependencyValidation>> {
    return this.http.post<ApiResponse<FeatureDependencyValidation>>(`${this.base}/validate-features`, { featureIds });
  }

  getPlans(): Observable<ApiResponse<PlanSummary[]>> {
    return this.http.get<ApiResponse<PlanSummary[]>>(this.base);
  }

  getPlan(id: number): Observable<ApiResponse<DynamicPlan>> {
    return this.http.get<ApiResponse<DynamicPlan>>(`${this.base}/${id}`);
  }

  createPlan(dto: CreatePlanRequest): Observable<ApiResponse<DynamicPlan>> {
    return this.http.post<ApiResponse<DynamicPlan>>(this.base, dto);
  }

  updatePlan(id: number, dto: UpdatePlanRequest): Observable<ApiResponse<DynamicPlan>> {
    return this.http.put<ApiResponse<DynamicPlan>>(`${this.base}/${id}`, dto);
  }

  clonePlan(id: number, dto: ClonePlanRequest): Observable<ApiResponse<DynamicPlan>> {
    return this.http.post<ApiResponse<DynamicPlan>>(`${this.base}/${id}/clone`, dto);
  }

  deletePlan(id: number): Observable<ApiResponse<unknown>> {
    return this.http.delete<ApiResponse<unknown>>(`${this.base}/${id}`);
  }

  createPricingOption(planId: number, dto: UpsertPricingOptionRequest): Observable<ApiResponse<unknown>> {
    return this.http.post<ApiResponse<unknown>>(`${this.base}/${planId}/pricing-options`, dto);
  }

  updatePricingOption(pricingOptionId: number, dto: UpsertPricingOptionRequest): Observable<ApiResponse<unknown>> {
    return this.http.put<ApiResponse<unknown>>(`${this.base}/pricing-options/${pricingOptionId}`, dto);
  }

  reorderPricingOptions(planId: number, dto: ReorderPricingRequest): Observable<ApiResponse<unknown>> {
    return this.http.put<ApiResponse<unknown>>(`${this.base}/${planId}/pricing-options/reorder`, dto);
  }

  deletePricingOption(pricingOptionId: number): Observable<ApiResponse<unknown>> {
    return this.http.delete<ApiResponse<unknown>>(`${this.base}/pricing-options/${pricingOptionId}`);
  }
}
