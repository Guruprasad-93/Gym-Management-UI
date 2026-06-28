import { DecimalPipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { map } from 'rxjs';
import { WebsiteService } from '../../core/services/website.service';
import { phoneValidator } from '../../shared/validators/phone.validators';
import { GymWebsitePage } from '../../shared/models/website.models';
import { PublicWebsiteContextService } from './public-website-context.service';

const SHARED_STYLES = '';

@Component({
  selector: 'app-public-website-shell',
  standalone: true,
  providers: [PublicWebsiteContextService],
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    @if (ctx.site(); as site) {
      <div
        class="site"
        [style.--primary]="site.settings.primaryColor || '#1565c0'"
        [style.--secondary]="site.settings.secondaryColor || '#ff6f00'">
        @if (ctx.previewMode() && !site.settings.isPublished) {
          <div class="pw-preview-banner" role="status">
            Draft preview — visitors will not see this site until you publish it from Website Builder.
          </div>
        }
        <header class="pw-header">
          <div class="pw-brand">
            @if (site.settings.logoUrl) {
              <img [src]="site.settings.logoUrl" [alt]="site.settings.websiteTitle || site.gymName" />
            }
            <strong>{{ site.settings.websiteTitle || site.gymName }}</strong>
          </div>
          <button type="button" class="pw-nav-toggle" (click)="menuOpen.set(!menuOpen())" [attr.aria-expanded]="menuOpen()">
            {{ menuOpen() ? 'Close' : 'Menu' }}
          </button>
          <nav class="pw-nav" [class.pw-nav--open]="menuOpen()">
            <a [routerLink]="['/website', ctx.slug]" queryParamsHandling="preserve" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }" (click)="menuOpen.set(false)">Home</a>
            <a [routerLink]="['/website', ctx.slug, 'about']" queryParamsHandling="preserve" routerLinkActive="active" (click)="menuOpen.set(false)">About</a>
            <a [routerLink]="['/website', ctx.slug, 'plans']" queryParamsHandling="preserve" routerLinkActive="active" (click)="menuOpen.set(false)">Plans</a>
            <a [routerLink]="['/website', ctx.slug, 'trainers']" queryParamsHandling="preserve" routerLinkActive="active" (click)="menuOpen.set(false)">Trainers</a>
            <a [routerLink]="['/website', ctx.slug, 'gallery']" queryParamsHandling="preserve" routerLinkActive="active" (click)="menuOpen.set(false)">Gallery</a>
            @for (page of site.pages; track page.id) {
              @if (page.isActive) {
                <a [routerLink]="['/website', ctx.slug, page.slug]" queryParamsHandling="preserve" routerLinkActive="active" (click)="menuOpen.set(false)">{{ page.pageName }}</a>
              }
            }
            <a class="pw-nav-cta" [routerLink]="['/website', ctx.slug, 'contact']" queryParamsHandling="preserve" routerLinkActive="active" (click)="menuOpen.set(false)">Book Trial</a>
          </nav>
        </header>

        <main>
          <router-outlet />
        </main>

        <footer class="pw-footer">
          <div class="pw-footer__inner">
            <div class="pw-footer__brand">
              <strong>{{ site.settings.websiteTitle || site.gymName }}</strong>
              <span>{{ site.settings.websiteDescription }}</span>
            </div>
            <div class="pw-footer__grid">
              <div>
                <p>{{ site.settings.address }}</p>
                <p>{{ site.settings.contactPhone }}</p>
                <p>{{ site.settings.contactEmail }}</p>
              </div>
              <div>
                @if (site.settings.facebookUrl) {
                  <p><a [href]="site.settings.facebookUrl" target="_blank" rel="noopener">Facebook</a></p>
                }
                @if (site.settings.instagramUrl) {
                  <p><a [href]="site.settings.instagramUrl" target="_blank" rel="noopener">Instagram</a></p>
                }
                @if (site.settings.youtubeUrl) {
                  <p><a [href]="site.settings.youtubeUrl" target="_blank" rel="noopener">YouTube</a></p>
                }
              </div>
            </div>
            <div class="pw-footer__bottom">
              © {{ year }} {{ site.gymName }}. All rights reserved.
            </div>
          </div>
        </footer>
      </div>
    } @else {
      <div class="pw-loading">Loading website…</div>
    }
  `,
  styles: [SHARED_STYLES],
})
export class PublicWebsiteShellComponent implements OnInit {
  readonly ctx = inject(PublicWebsiteContextService);
  private readonly route = inject(ActivatedRoute);
  readonly menuOpen = signal(false);
  readonly year = new Date().getFullYear();

  ngOnInit(): void {
    this.ctx.loadFromRoute(this.route);
  }
}

@Component({
  selector: 'app-public-website-home',
  standalone: true,
  imports: [RouterLink, DecimalPipe],
  template: `
    @if (ctx.site(); as site) {
      <section
        class="pw-hero"
        [style.background-image]="site.settings.bannerUrl ? 'url(' + site.settings.bannerUrl + ')' : null">
        <div class="pw-hero__inner">
          <span class="pw-eyebrow">Welcome to {{ site.gymName }}</span>
          <h1>{{ site.settings.websiteTitle || site.gymName }}</h1>
          <p>{{ site.settings.websiteDescription || 'Transform your fitness journey with expert coaching and a supportive community.' }}</p>
          <div class="pw-hero__actions">
            <a class="pw-btn pw-btn--primary" [routerLink]="['/website', ctx.slug, 'contact']" queryParamsHandling="preserve">Book Free Trial</a>
            <a class="pw-btn pw-btn--secondary" [routerLink]="['/website', ctx.slug, 'plans']" queryParamsHandling="preserve">View Plans</a>
          </div>
          <div class="pw-stats">
            <div class="pw-stat">
              <strong>{{ site.membershipPlans.length }}</strong>
              <span>Membership plans</span>
            </div>
            <div class="pw-stat">
              <strong>{{ site.trainers.length }}</strong>
              <span>Expert trainers</span>
            </div>
            <div class="pw-stat">
              <strong>{{ site.testimonials.length }}</strong>
              <span>Member reviews</span>
            </div>
          </div>
        </div>
      </section>

      @if (site.sections.length) {
        <section class="pw-section">
          <div class="pw-container">
            <div class="pw-section-head">
              <span class="pw-eyebrow">Why choose us</span>
              <h2>Built for your goals</h2>
            </div>
            <div class="pw-grid">
              @for (section of site.sections; track section.id) {
                <article class="pw-block">
                  @if (section.subtitle) {
                    <span class="pw-eyebrow">{{ section.subtitle }}</span>
                  }
                  <h3>{{ section.title }}</h3>
                  <p>{{ section.description }}</p>
                </article>
              }
            </div>
          </div>
        </section>
      }

      <section class="pw-section pw-section--alt">
        <div class="pw-container">
          <div class="pw-section-head">
            <span class="pw-eyebrow">Membership</span>
            <h2>Plans that fit your lifestyle</h2>
            <p>Flexible options with transparent pricing — no hidden fees.</p>
          </div>
          @if (site.membershipPlans.length) {
            <div class="pw-grid">
              @for (plan of site.membershipPlans.slice(0, 3); track plan.id; let i = $index) {
                <article class="pw-card" [class.pw-card--featured]="i === 1">
                  <h3>{{ plan.planName }}</h3>
                  <p>{{ plan.description || (plan.durationInMonths + ' month membership') }}</p>
                  <span class="pw-card__price">₹{{ plan.price | number:'1.0-0' }}</span>
                  <span class="pw-card__meta">{{ plan.durationInMonths }} months</span>
                </article>
              }
            </div>
            <div style="text-align:center;margin-top:1.5rem">
              <a class="pw-btn pw-btn--outline" [routerLink]="['/website', ctx.slug, 'plans']" queryParamsHandling="preserve">See all plans</a>
            </div>
          } @else {
            <p class="pw-empty">Membership plans coming soon.</p>
          }
        </div>
      </section>

      @if (site.trainers.length) {
        <section class="pw-section">
          <div class="pw-container">
            <div class="pw-section-head">
              <span class="pw-eyebrow">Coaching team</span>
              <h2>Meet our trainers</h2>
            </div>
            <div class="pw-grid">
              @for (t of site.trainers.slice(0, 3); track t.id) {
                <article class="pw-card">
                  @if (t.profileImageUrl) {
                    <img class="pw-trainer-img pw-trainer-img--round" [src]="t.profileImageUrl" [alt]="t.fullName" />
                  }
                  <h3>{{ t.fullName }}</h3>
                  <p>{{ t.specialization || 'Personal trainer' }}</p>
                </article>
              }
            </div>
          </div>
        </section>
      }

      @if (site.testimonials.length) {
        <section class="pw-section pw-section--alt">
          <div class="pw-container">
            <div class="pw-section-head">
              <span class="pw-eyebrow">Testimonials</span>
              <h2>What members say</h2>
            </div>
            <div class="pw-grid">
              @for (t of site.testimonials.slice(0, 3); track t.id) {
                <article class="pw-card pw-quote">
                  <div class="pw-stars">{{ '★'.repeat(t.rating) }}{{ '☆'.repeat(5 - t.rating) }}</div>
                  <p>{{ t.reviewText }}</p>
                  <strong style="display:block;margin-top:0.75rem;font-size:0.875rem">{{ t.memberName }}</strong>
                </article>
              }
            </div>
          </div>
        </section>
      }

      <section class="pw-section">
        <div class="pw-container">
          <div class="pw-cta-band">
            <h2>Ready to start your transformation?</h2>
            <p>Book a free trial session and experience {{ site.gymName }} firsthand.</p>
            <a class="pw-btn pw-btn--primary" [routerLink]="['/website', ctx.slug, 'contact']" queryParamsHandling="preserve">Get started today</a>
          </div>
        </div>
      </section>
    }
  `,
  styles: [SHARED_STYLES],
})
export class PublicWebsiteHomeComponent {
  readonly ctx = inject(PublicWebsiteContextService);
}

@Component({
  selector: 'app-public-website-about',
  standalone: true,
  template: `
    @if (ctx.site(); as site) {
      <div class="pw-container">
        <header class="pw-page-hero">
          <span class="pw-eyebrow">Our story</span>
          <h1>About {{ site.gymName }}</h1>
          <p>{{ site.settings.websiteDescription || 'We help members build strength, confidence, and lasting healthy habits.' }}</p>
        </header>
        <section class="pw-section" style="padding-top:0">
          @if (site.sections.length) {
            <div class="pw-grid">
              @for (section of site.sections; track section.id) {
                <article class="pw-block">
                  <h3>{{ section.title }}</h3>
                  <p>{{ section.description }}</p>
                </article>
              }
            </div>
          } @else {
            <article class="pw-block">
              <h3>Our mission</h3>
              <p>
                At {{ site.gymName }}, we combine expert coaching, modern equipment, and a welcoming community
                to help you reach your fitness goals — whether you're just starting out or training at an advanced level.
              </p>
            </article>
          }
        </section>
      </div>
    }
  `,
  styles: [SHARED_STYLES],
})
export class PublicWebsiteAboutComponent {
  readonly ctx = inject(PublicWebsiteContextService);
}

@Component({
  selector: 'app-public-website-plans',
  standalone: true,
  imports: [RouterLink, DecimalPipe],
  template: `
    @if (ctx.site(); as site) {
      <div class="pw-container">
        <header class="pw-page-hero">
          <span class="pw-eyebrow">Pricing</span>
          <h1>Membership Plans</h1>
          <p>Choose the plan that matches your schedule and goals.</p>
        </header>
        <section class="pw-section" style="padding-top:0">
          @if (site.membershipPlans.length) {
            <div class="pw-grid">
              @for (plan of site.membershipPlans; track plan.id; let i = $index) {
                <article class="pw-card" [class.pw-card--featured]="i === 1">
                  <h3>{{ plan.planName }}</h3>
                  <p>{{ plan.description }}</p>
                  <span class="pw-card__price">₹{{ plan.price | number:'1.0-0' }}</span>
                  <span class="pw-card__meta">{{ plan.durationInMonths }} months</span>
                  <div style="margin-top:1.25rem">
                    <a class="pw-btn pw-btn--submit" [routerLink]="['/website', ctx.slug, 'contact']">Enquire now</a>
                  </div>
                </article>
              }
            </div>
          } @else {
            <p class="pw-empty">No membership plans published yet. Contact us for details.</p>
          }
        </section>
      </div>
    }
  `,
  styles: [SHARED_STYLES],
})
export class PublicWebsitePlansComponent {
  readonly ctx = inject(PublicWebsiteContextService);
}

@Component({
  selector: 'app-public-website-trainers',
  standalone: true,
  template: `
    @if (ctx.site(); as site) {
      <div class="pw-container">
        <header class="pw-page-hero">
          <span class="pw-eyebrow">Team</span>
          <h1>Our Trainers</h1>
          <p>Certified professionals dedicated to your progress.</p>
        </header>
        <section class="pw-section" style="padding-top:0">
          @if (site.trainers.length) {
            <div class="pw-grid">
              @for (t of site.trainers; track t.id) {
                <article class="pw-card">
                  @if (t.profileImageUrl) {
                    <img class="pw-trainer-img" [src]="t.profileImageUrl" [alt]="t.fullName" />
                  } @else {
                    <div class="pw-trainer-img" style="display:grid;place-items:center;background:var(--pw-bg);color:var(--pw-muted);font-weight:700">
                      {{ t.fullName.charAt(0) }}
                    </div>
                  }
                  <h3>{{ t.fullName }}</h3>
                  <p class="pw-card__meta">{{ t.specialization || 'Personal trainer' }}</p>
                  @if (t.bio) {
                    <p style="margin-top:0.5rem">{{ t.bio }}</p>
                  }
                </article>
              }
            </div>
          } @else {
            <p class="pw-empty">Trainer profiles will appear here soon.</p>
          }
        </section>
      </div>
    }
  `,
  styles: [SHARED_STYLES],
})
export class PublicWebsiteTrainersComponent {
  readonly ctx = inject(PublicWebsiteContextService);
}

@Component({
  selector: 'app-public-website-gallery',
  standalone: true,
  template: `
    @if (ctx.site(); as site) {
      <div class="pw-container">
        <header class="pw-page-hero">
          <span class="pw-eyebrow">Facility</span>
          <h1>Gallery</h1>
          <p>Take a look inside {{ site.gymName }}.</p>
        </header>
        <section class="pw-section" style="padding-top:0">
          @if (site.gallery.length) {
            <div class="pw-gallery">
              @for (g of site.gallery; track g.id) {
                <figure>
                  <img [src]="g.publicUrl" [alt]="g.caption ?? 'Gym photo'" loading="lazy" />
                  @if (g.caption) {
                    <figcaption>{{ g.caption }}</figcaption>
                  }
                </figure>
              }
            </div>
          } @else {
            <p class="pw-empty">Gallery photos coming soon.</p>
          }
        </section>
      </div>
    }
  `,
  styles: [SHARED_STYLES],
})
export class PublicWebsiteGalleryPageComponent {
  readonly ctx = inject(PublicWebsiteContextService);
}

@Component({
  selector: 'app-public-website-contact',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    @if (ctx.site(); as site) {
      <div class="pw-container">
        <header class="pw-page-hero">
          <span class="pw-eyebrow">Get in touch</span>
          <h1>Contact & Free Trial</h1>
          <p>Send an enquiry or book your complimentary trial session.</p>
        </header>
        <section class="pw-section" style="padding-top:0">
          <div class="pw-contact-grid">
            <aside class="pw-info-panel">
              <h3>Visit us</h3>
              <ul class="pw-info-list">
                @if (site.settings.address) {
                  <li><strong>Address</strong>{{ site.settings.address }}</li>
                }
                @if (site.settings.contactPhone) {
                  <li><strong>Phone</strong>{{ site.settings.contactPhone }}</li>
                }
                @if (site.settings.contactEmail) {
                  <li><strong>Email</strong>{{ site.settings.contactEmail }}</li>
                }
                @if (site.settings.whatsAppNumber) {
                  <li><strong>WhatsApp</strong>{{ site.settings.whatsAppNumber }}</li>
                }
              </ul>
            </aside>

            <div>
              <div class="pw-form-panel">
                <h3>Send an enquiry</h3>
                @if (leadSent()) {
                  <p class="pw-empty" style="border-style:solid;color:var(--primary,#1565c0)">Thanks! We'll get back to you soon.</p>
                } @else {
                  <form class="pw-form" [formGroup]="form" (ngSubmit)="submit()">
                    <label class="pw-field">
                      <span>Name *</span>
                      <input type="text" formControlName="name" placeholder="Your full name" />
                    </label>
                    <div class="pw-form-row">
                      <label class="pw-field">
                        <span>Mobile *</span>
                        <input type="tel" formControlName="mobileNumber" placeholder="+91 …" />
                      </label>
                      <label class="pw-field">
                        <span>Email</span>
                        <input type="email" formControlName="email" placeholder="you@email.com" />
                      </label>
                    </div>
                    <label class="pw-field">
                      <span>Interested plan</span>
                      <input type="text" formControlName="interestedPlan" placeholder="e.g. Monthly Basic" />
                    </label>
                    <label class="pw-field">
                      <span>Message</span>
                      <textarea formControlName="notes" placeholder="Tell us about your goals…"></textarea>
                    </label>
                    <button class="pw-btn pw-btn--submit" type="submit" [disabled]="form.invalid || submitting()">
                      {{ submitting() ? 'Sending…' : 'Send enquiry' }}
                    </button>
                  </form>
                }
              </div>

              <hr class="pw-divider" />

              <div class="pw-form-panel">
                <h3>Book a free trial</h3>
                @if (trialSent()) {
                  <p class="pw-empty" style="border-style:solid;color:var(--primary,#1565c0)">Trial request received! We'll confirm your slot shortly.</p>
                } @else {
                  <form class="pw-form" [formGroup]="trialForm" (ngSubmit)="bookTrial()">
                    <div class="pw-form-row">
                      <label class="pw-field">
                        <span>Name *</span>
                        <input type="text" formControlName="name" placeholder="Your full name" />
                      </label>
                      <label class="pw-field">
                        <span>Mobile *</span>
                        <input type="tel" formControlName="mobileNumber" placeholder="+91 …" />
                      </label>
                    </div>
                    <div class="pw-form-row">
                      <label class="pw-field">
                        <span>Preferred date *</span>
                        <input type="date" formControlName="preferredDate" />
                      </label>
                      <label class="pw-field">
                        <span>Preferred time *</span>
                        <input type="time" formControlName="preferredTime" />
                      </label>
                    </div>
                    <button class="pw-btn pw-btn--outline" type="submit" [disabled]="trialForm.invalid || submitting()">
                      {{ submitting() ? 'Booking…' : 'Book free trial' }}
                    </button>
                  </form>
                }
              </div>
            </div>
          </div>
        </section>
      </div>
    }
  `,
  styles: [SHARED_STYLES],
})
export class PublicWebsiteContactComponent {
  readonly ctx = inject(PublicWebsiteContextService);
  private readonly service = inject(WebsiteService);
  private readonly fb = inject(FormBuilder);

  readonly submitting = signal(false);
  readonly leadSent = signal(false);
  readonly trialSent = signal(false);

  form = this.fb.group({
    name: ['', Validators.required],
    mobileNumber: ['', [Validators.required, phoneValidator(true)]],
    email: [''],
    interestedPlan: [''],
    notes: [''],
  });

  trialForm = this.fb.group({
    name: ['', Validators.required],
    mobileNumber: ['', [Validators.required, phoneValidator(true)]],
    email: [''],
    preferredDate: ['', Validators.required],
    preferredTime: ['09:00', Validators.required],
  });

  submit(): void {
    if (this.form.invalid) return;
    this.submitting.set(true);
    this.service.submitLead({ websiteSlug: this.ctx.slug, ...this.form.getRawValue() } as never).subscribe({
      next: () => {
        this.submitting.set(false);
        this.leadSent.set(true);
        this.form.reset();
      },
      error: () => this.submitting.set(false),
    });
  }

  bookTrial(): void {
    if (this.trialForm.invalid) return;
    const v = this.trialForm.getRawValue();
    this.submitting.set(true);
    this.service
      .bookTrial({
        websiteSlug: this.ctx.slug,
        name: v.name!,
        mobileNumber: v.mobileNumber!,
        email: v.email ?? undefined,
        preferredDate: v.preferredDate!,
        preferredTime: v.preferredTime!,
      })
      .subscribe({
        next: () => {
          this.submitting.set(false);
          this.trialSent.set(true);
          this.trialForm.reset({ preferredTime: '09:00' });
        },
        error: () => this.submitting.set(false),
      });
  }
}

@Component({
  selector: 'app-public-website-custom-page',
  standalone: true,
  imports: [RouterLink],
  template: `
    @if (ctx.site()) {
      @if (page(); as p) {
        <div class="pw-container">
          <header class="pw-page-hero">
            <h1>{{ p.pageName }}</h1>
          </header>
          <section class="pw-section" style="padding-top:0">
            @if (p.pageContent?.trim()) {
              <article class="pw-page-content">{{ p.pageContent }}</article>
            } @else {
              <p class="pw-empty">This page has no content yet.</p>
            }
          </section>
        </div>
      } @else {
        <div class="pw-container">
          <header class="pw-page-hero">
            <h1>Page not found</h1>
            <p>The page you're looking for doesn't exist or is no longer available.</p>
          </header>
          <section class="pw-section" style="padding-top:0">
            <a class="pw-btn pw-btn--outline" [routerLink]="['/website', ctx.slug]">Back to home</a>
          </section>
        </div>
      }
    }
  `,
  styles: [SHARED_STYLES],
})
export class PublicWebsiteCustomPageComponent {
  readonly ctx = inject(PublicWebsiteContextService);
  private readonly route = inject(ActivatedRoute);

  private readonly pageSlug = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('pageSlug')?.toLowerCase() ?? '')),
    { initialValue: '' }
  );

  readonly page = computed((): GymWebsitePage | null => {
    const site = this.ctx.site();
    const slug = this.pageSlug();
    if (!site || !slug) return null;
    return site.pages.find((p) => p.isActive && p.slug.toLowerCase() === slug) ?? null;
  });
}
