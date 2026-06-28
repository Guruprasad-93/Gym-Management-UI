import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, map, of, switchMap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../../shared/models/api-response';
import {
  AssignTrainerRequest,
  CreateMemberRequest,
  Member,
  MemberDetails,
  UpdateMemberRequest,
} from '../../shared/models/member.models';
import { PagedRequest, PagedResult } from '../../shared/models/paged.models';

@Injectable({ providedIn: 'root' })
export class MemberService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/members`;

  getPaged(
    gymId: string | null,
    paging: PagedRequest,
    includeInactive = false
  ): Observable<ApiResponse<PagedResult<Member>>> {
    let params = new HttpParams()
      .set('pageNumber', String(paging.pageNumber ?? 1))
      .set('pageSize', String(paging.pageSize ?? 10))
      .set('sortColumn', paging.sortColumn ?? 'FullName')
      .set('sortDirection', paging.sortDirection ?? 'asc')
      .set('includeInactive', String(includeInactive));
    if (paging.search) params = params.set('search', paging.search);
    if (gymId) params = params.set('gymId', gymId);
    return this.http.get<ApiResponse<PagedResult<Member>>>(this.base, { params });
  }

  /** Loads all members by paging at the API max (100) until complete. */
  getAll(gymId: string | null = null, includeInactive = false): Observable<Member[]> {
    const pageSize = 100;
    const basePaging: PagedRequest = {
      pageSize,
      sortColumn: 'FullName',
      sortDirection: 'asc',
    };

    return this.getPaged(gymId, { ...basePaging, pageNumber: 1 }, includeInactive).pipe(
      switchMap((first) => {
        const items = first.data?.items ?? [];
        const total = first.data?.totalCount ?? items.length;
        const totalPages = Math.ceil(total / pageSize);
        if (totalPages <= 1) return of(items);

        const pageRequests = Array.from({ length: totalPages - 1 }, (_, i) =>
          this.getPaged(gymId, { ...basePaging, pageNumber: i + 2 }, includeInactive)
        );
        return forkJoin(pageRequests).pipe(
          map((pages) => items.concat(...pages.map((p) => p.data?.items ?? [])))
        );
      })
    );
  }

  getMe(): Observable<ApiResponse<Member>> {
    return this.http.get<ApiResponse<Member>>(`${this.base}/me`);
  }

  getById(id: number): Observable<ApiResponse<Member>> {
    return this.http.get<ApiResponse<Member>>(`${this.base}/${id}`);
  }

  getDetails(id: number): Observable<ApiResponse<MemberDetails>> {
    return this.http.get<ApiResponse<MemberDetails>>(`${this.base}/${id}/details`);
  }

  create(dto: CreateMemberRequest): Observable<ApiResponse<Member>> {
    return this.http.post<ApiResponse<Member>>(this.base, dto);
  }

  update(id: number, dto: UpdateMemberRequest): Observable<ApiResponse<Member>> {
    return this.http.put<ApiResponse<Member>>(`${this.base}/${id}`, dto);
  }

  delete(id: number): Observable<ApiResponse<unknown>> {
    return this.http.delete<ApiResponse<unknown>>(`${this.base}/${id}`);
  }

  activate(id: number): Observable<ApiResponse<unknown>> {
    return this.http.patch<ApiResponse<unknown>>(`${this.base}/${id}/activate`, {});
  }

  deactivate(id: number): Observable<ApiResponse<unknown>> {
    return this.http.patch<ApiResponse<unknown>>(`${this.base}/${id}/deactivate`, {});
  }

  assignTrainer(id: number, dto: AssignTrainerRequest): Observable<ApiResponse<unknown>> {
    return this.http.post<ApiResponse<unknown>>(`${this.base}/${id}/assign-trainer`, dto);
  }

  removeTrainerAssignment(id: number): Observable<ApiResponse<unknown>> {
    return this.http.delete<ApiResponse<unknown>>(`${this.base}/${id}/trainer-assignment`);
  }
}
