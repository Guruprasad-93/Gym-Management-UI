import { Component, Input, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { WebsiteService } from '../../../core/services/website.service';

@Component({
  selector: 'app-website-view-link',
  standalone: true,
  imports: [RouterLink, MatIconModule],
  template: `
    @if (websiteSlug()) {
      <a
        class="btn-secondary"
        [class.btn-primary]="primary"
        [routerLink]="['/website', websiteSlug()]"
        [queryParams]="{ preview: '1' }">
        <mat-icon>public</mat-icon>
        View Website
      </a>
    }
  `,
})
export class WebsiteViewLinkComponent implements OnInit {
  private readonly websiteService = inject(WebsiteService);

  /** When set, skips loading settings from the API. */
  @Input() slug?: string | null;
  @Input() primary = false;

  private readonly fetchedSlug = signal<string | null>(null);

  readonly websiteSlug = computed(() => {
    const direct = this.slug?.trim();
    if (direct) return direct;
    return this.fetchedSlug();
  });

  ngOnInit(): void {
    if (this.slug?.trim()) return;
    this.websiteService.getSettings().subscribe({
      next: (res) => {
        const value = res.data?.websiteSlug?.trim();
        if (value) this.fetchedSlug.set(value);
      },
    });
  }
}
