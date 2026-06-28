import { Injectable, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { WebsiteService } from '../../core/services/website.service';
import { NotificationService } from '../../core/services/notification.service';
import { PublicWebsite } from '../../shared/models/website.models';

@Injectable()
export class PublicWebsiteContextService {
  private readonly service = inject(WebsiteService);
  private readonly notify = inject(NotificationService);

  readonly site = signal<PublicWebsite | null>(null);
  readonly previewMode = signal(false);
  slug = '';

  loadFromRoute(route: ActivatedRoute): void {
    let r: ActivatedRoute | null = route;
    while (r) {
      const slug = r.snapshot.paramMap.get('gymSlug');
      if (slug) {
        this.slug = slug;
        break;
      }
      r = r.parent;
    }
    if (!this.slug) return;

    const preview = this.isPreviewRoute(route);
    this.previewMode.set(preview);

    const request = preview
      ? this.service.getPreviewSite(this.slug)
      : this.service.getPublicSite(this.slug);

    request.subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.site.set(res.data);
          return;
        }
        this.notify.error(res.message ?? 'Website could not be loaded.');
      },
      error: (err) => {
        this.notify.error(err.error?.message ?? 'Website could not be loaded.');
      },
    });
  }

  private isPreviewRoute(route: ActivatedRoute): boolean {
    let r: ActivatedRoute | null = route;
    while (r) {
      if (r.snapshot.queryParamMap.get('preview') === '1') {
        return true;
      }
      r = r.parent;
    }
    return false;
  }
}
