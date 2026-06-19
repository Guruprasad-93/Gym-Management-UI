import { Injectable, inject, signal, computed } from '@angular/core';
import { Observable, tap, catchError, of, map, switchMap } from 'rxjs';
import { WhiteLabelService } from './white-label.service';
import { WhiteLabelLoginBranding, WhiteLabelSettings } from '../../shared/models/white-label.models';

export interface ApplicationBranding {
  gymId: string;
  brandName: string;
  appDisplayName?: string | null;
  primaryColor: string;
  secondaryColor: string;
  logoUrl?: string | null;
  loginBackgroundUrl?: string | null;
  supportEmail?: string | null;
  supportPhone?: string | null;
}

const STORAGE_KEY = 'gym_branding';
export const DEFAULT_PRIMARY_COLOR = '#ff6600';
export const DEFAULT_SECONDARY_COLOR = '#101828';
export const DEFAULT_APP_NAME = 'Gym Management';

@Injectable({ providedIn: 'root' })
export class BrandingService {
  private readonly whiteLabel = inject(WhiteLabelService);

  private readonly brandingSignal = signal<ApplicationBranding | null>(this.restoreFromStorage());
  private portalTitle = '';

  readonly branding = this.brandingSignal.asReadonly();

  readonly appName = computed(() => BrandingService.resolveAppName(this.brandingSignal()));
  readonly logoUrl = computed(() => this.brandingSignal()?.logoUrl ?? null);
  readonly primaryColor = computed(() => this.brandingSignal()?.primaryColor ?? DEFAULT_PRIMARY_COLOR);
  readonly secondaryColor = computed(() => this.brandingSignal()?.secondaryColor ?? DEFAULT_SECONDARY_COLOR);

  /** Map WhiteLabel login/preview branding to application state (shared with preview). */
  static fromSettings(settings: WhiteLabelSettings, gymId: string): ApplicationBranding {
    return {
      gymId: settings.gymId || gymId,
      brandName: settings.brandName,
      appDisplayName: settings.appDisplayName ?? settings.brandName,
      primaryColor: settings.primaryColor ?? DEFAULT_PRIMARY_COLOR,
      secondaryColor: settings.secondaryColor ?? DEFAULT_SECONDARY_COLOR,
      logoUrl: settings.logoUrl,
      loginBackgroundUrl: settings.loginBackgroundUrl,
      supportEmail: settings.supportEmail,
      supportPhone: settings.supportPhone,
    };
  }

  static fromLoginBranding(source: WhiteLabelLoginBranding): ApplicationBranding {
    return {
      gymId: source.gymId,
      brandName: source.brandName,
      appDisplayName: source.appDisplayName ?? source.brandName,
      primaryColor: source.primaryColor ?? DEFAULT_PRIMARY_COLOR,
      secondaryColor: source.secondaryColor ?? DEFAULT_SECONDARY_COLOR,
      logoUrl: source.logoUrl,
      loginBackgroundUrl: source.loginBackgroundUrl,
      supportEmail: source.supportEmail,
      supportPhone: source.supportPhone,
    };
  }

  static resolveAppName(branding: ApplicationBranding | WhiteLabelLoginBranding | null): string {
    if (!branding) return DEFAULT_APP_NAME;
    return branding.appDisplayName?.trim() || branding.brandName?.trim() || DEFAULT_APP_NAME;
  }

  static loginBackgroundStyle(source: Pick<WhiteLabelLoginBranding, 'loginBackgroundUrl' | 'primaryColor' | 'secondaryColor'> | null): string {
    if (source?.loginBackgroundUrl) {
      return `url(${source.loginBackgroundUrl}) center/cover no-repeat`;
    }
    const primary = source?.primaryColor ?? '#1a237e';
    const secondary = source?.secondaryColor ?? '#3949ab';
    return `linear-gradient(135deg, ${primary} 0%, ${secondary} 100%)`;
  }

  setPortalTitle(title: string): void {
    this.portalTitle = title;
    this.updateDocumentTitle();
  }

  setBranding(branding: ApplicationBranding, persist = true): void {
    this.brandingSignal.set(branding);
    if (persist) {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(branding));
    }
    this.applyToDocument();
    this.updateDocumentTitle();
  }

  applyLoginBranding(source: WhiteLabelLoginBranding, persist = false): void {
    this.setBranding(BrandingService.fromLoginBranding(source), persist);
  }

  ensureLoaded(gymId?: string | null, portalTitle?: string, force = false): void {
    if (portalTitle) {
      this.setPortalTitle(portalTitle);
    }
    if (!gymId) {
      return;
    }

    const current = this.brandingSignal();
    const sameGym = current?.gymId?.toLowerCase() === gymId.toLowerCase();
    const hasConfiguredBranding = !!(
      current?.brandName?.trim() ||
      current?.appDisplayName?.trim() ||
      current?.logoUrl ||
      (current?.primaryColor && current.primaryColor !== DEFAULT_PRIMARY_COLOR)
    );

    if (!force && sameGym && hasConfiguredBranding) {
      this.applyToDocument();
      this.updateDocumentTitle();
      return;
    }

    this.loadForGym(gymId).subscribe();
  }

  loadForGym(gymId: string): Observable<ApplicationBranding | null> {
    return this.whiteLabel.getAppBranding().pipe(
      map((res) => this.mapApiBranding(res.data, gymId)),
      switchMap((branding) => {
        if (branding?.brandName?.trim() || branding?.logoUrl || branding?.primaryColor !== DEFAULT_PRIMARY_COLOR) {
          return of(branding);
        }
        return this.whiteLabel.getSettings().pipe(
          map((res) => (res.success && res.data ? BrandingService.fromSettings(res.data, gymId) : branding)),
          catchError(() => of(branding))
        );
      }),
      tap((branding) => {
        if (branding) {
          this.setBranding(branding);
        }
      }),
      catchError(() =>
        this.whiteLabel.getSettings().pipe(
          map((res) => (res.success && res.data ? BrandingService.fromSettings(res.data, gymId) : null)),
          tap((branding) => {
            if (branding) {
              this.setBranding(branding);
            }
          }),
          catchError(() => of(null))
        )
      )
    );
  }

  private mapApiBranding(data: WhiteLabelLoginBranding | undefined, gymId: string): ApplicationBranding | null {
    if (!data) return null;
    const branding = BrandingService.fromLoginBranding(data);
    return { ...branding, gymId: branding.gymId || gymId };
  }

  loadPublicBranding(query: { gymId?: string; subDomain?: string; customDomain?: string }): Observable<ApplicationBranding | null> {
    return this.whiteLabel.getLoginBranding(query).pipe(
      map((res) => (res.success && res.data ? BrandingService.fromLoginBranding(res.data) : null)),
      tap((branding) => {
        if (branding) {
          this.setBranding(branding, false);
        }
      }),
      catchError(() => of(null))
    );
  }

  refresh(): Observable<ApplicationBranding | null> {
    const gymId = this.brandingSignal()?.gymId;
    return gymId ? this.loadForGym(gymId) : of(null);
  }

  clear(): void {
    sessionStorage.removeItem(STORAGE_KEY);
    this.brandingSignal.set(null);
    this.portalTitle = '';
    this.applyToDocument();
    document.title = DEFAULT_APP_NAME;
  }

  applyToDocument(): void {
    const root = document.documentElement;
    const primary = this.primaryColor();
    const secondary = this.secondaryColor();
    const rgb = this.hexToRgb(primary);

    root.style.setProperty('--brand-primary', primary);
    root.style.setProperty('--brand-secondary', secondary);
    if (rgb) {
      root.style.setProperty('--brand-primary-rgb', `${rgb.r}, ${rgb.g}, ${rgb.b}`);
    }
    root.style.setProperty('--brand-primary-light', `rgba(${rgb?.r ?? 255}, ${rgb?.g ?? 102}, ${rgb?.b ?? 0}, 0.12)`);
    root.style.setProperty('--brand-primary-muted', `rgba(${rgb?.r ?? 255}, ${rgb?.g ?? 102}, ${rgb?.b ?? 0}, 0.18)`);
    root.style.setProperty('--brand-primary-border', `rgba(${rgb?.r ?? 255}, ${rgb?.g ?? 102}, ${rgb?.b ?? 0}, 0.18)`);
    root.style.setProperty('--brand-primary-gradient-end', this.lighten(primary, 0.12));
    root.style.setProperty('--saas-primary', primary);
  }

  private updateDocumentTitle(): void {
    const name = this.appName();
    document.title = this.portalTitle ? `${name} | ${this.portalTitle}` : name;
  }

  private restoreFromStorage(): ApplicationBranding | null {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as ApplicationBranding;
    } catch {
      return null;
    }
  }

  private hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const normalized = hex.replace('#', '').trim();
    if (normalized.length !== 6) return null;
    const r = parseInt(normalized.slice(0, 2), 16);
    const g = parseInt(normalized.slice(2, 4), 16);
    const b = parseInt(normalized.slice(4, 6), 16);
    if ([r, g, b].some((v) => Number.isNaN(v))) return null;
    return { r, g, b };
  }

  private lighten(hex: string, amount: number): string {
    const rgb = this.hexToRgb(hex);
    if (!rgb) return hex;
    const mix = (channel: number) => Math.min(255, Math.round(channel + (255 - channel) * amount));
    const r = mix(rgb.r).toString(16).padStart(2, '0');
    const g = mix(rgb.g).toString(16).padStart(2, '0');
    const b = mix(rgb.b).toString(16).padStart(2, '0');
    return `#${r}${g}${b}`;
  }
}
