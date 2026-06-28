import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { MainLayoutComponent } from '../../layout/main-layout/main-layout.component';
import { MenuService } from '../../core/services/menu.service';
import { AuthService } from '../../core/services/auth.service';
import { BrandingService } from '../../core/services/branding.service';
import { untilDestroyed } from '../../core/utils/destroy-ref.util';

@Component({
  selector: 'app-gym-admin-layout',
  standalone: true,
  imports: [MainLayoutComponent],
  template: `
    <app-main-layout
      [menuItems]="menuService.gymAdminMenu()"
      portalLabel="Gym Admin"
      [userName]="auth.user()?.name ?? ''"
      [userEmail]="auth.user()?.email ?? ''" />
  `,
})
export class GymAdminLayoutComponent implements OnInit {
  readonly menuService = inject(MenuService);
  readonly auth = inject(AuthService);
  private readonly branding = inject(BrandingService);
  private readonly destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    this.branding.ensureLoaded(this.auth.user()?.gymId, 'Gym Admin');
    this.auth.refreshPermissions().pipe(untilDestroyed(this.destroyRef)).subscribe();
  }
}
