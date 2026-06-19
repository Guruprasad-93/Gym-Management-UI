import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../../shared/models/api-response';
import {
  BulkSetGymMenusRequest,
  GymMenuSummaryDto,
  MyMenusResponse,
  TenantMenuDto,
} from '../models/menu.models';
import { MenuDto } from '../models/menu.models';

@Injectable({ providedIn: 'root' })
export class TenantMenuService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}`;

  getMyMenus(): Observable<ApiResponse<MyMenusResponse>> {
    return this.http.get<ApiResponse<MyMenusResponse>>(`${this.base}/menus/my-menus`);
  }

  getGymSummaries(): Observable<ApiResponse<GymMenuSummaryDto[]>> {
    return this.http.get<ApiResponse<GymMenuSummaryDto[]>>(`${this.base}/platform/tenant-menus/gyms`);
  }

  getGymMenus(gymId: string): Observable<ApiResponse<TenantMenuDto[]>> {
    return this.http.get<ApiResponse<TenantMenuDto[]>>(`${this.base}/platform/tenant-menus/${gymId}`);
  }

  enableMenu(gymId: string, menuId: number): Observable<ApiResponse<unknown>> {
    return this.http.put<ApiResponse<unknown>>(
      `${this.base}/platform/tenant-menus/${gymId}/${menuId}/enable`,
      {}
    );
  }

  disableMenu(gymId: string, menuId: number): Observable<ApiResponse<unknown>> {
    return this.http.put<ApiResponse<unknown>>(
      `${this.base}/platform/tenant-menus/${gymId}/${menuId}/disable`,
      {}
    );
  }

  bulkSetMenus(gymId: string, request: BulkSetGymMenusRequest): Observable<ApiResponse<unknown>> {
    return this.http.put<ApiResponse<unknown>>(
      `${this.base}/platform/tenant-menus/${gymId}/bulk`,
      request
    );
  }

  getAllMenus(): Observable<ApiResponse<MenuDto[]>> {
    return this.http.get<ApiResponse<MenuDto[]>>(`${this.base}/menus`);
  }
}
