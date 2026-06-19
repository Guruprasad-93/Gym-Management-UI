import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { TenantMenuService } from '../../../core/services/tenant-menu.service';
import { NotificationService } from '../../../core/services/notification.service';
import { AuthService } from '../../../core/services/auth.service';
import { Permissions } from '../../../core/constants/permissions';
import { GymMenuSummaryDto, TenantMenuDto } from '../../../core/models/menu.models';

@Component({
  selector: 'app-tenant-menu-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatSelectModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
  ],
  templateUrl: './tenant-menu-management.component.html',
  styleUrl: './tenant-menu-management.component.css',
})
export class TenantMenuManagementComponent implements OnInit {
  private readonly tenantMenuService = inject(TenantMenuService);
  private readonly notify = inject(NotificationService);
  readonly auth = inject(AuthService);
  readonly permissions = Permissions;

  readonly gyms = signal<GymMenuSummaryDto[]>([]);
  readonly menus = signal<TenantMenuDto[]>([]);
  readonly loading = signal(false);
  selectedGymId = '';
  readonly displayedColumns = ['menuName', 'menuCode', 'route', 'isEnabled', 'actions'];

  ngOnInit(): void {
    this.loadGyms();
  }

  loadGyms(): void {
    this.loading.set(true);
    this.tenantMenuService.getGymSummaries().subscribe({
      next: (res) => {
        this.gyms.set(res.data ?? []);
        if (!this.selectedGymId && res.data?.length) {
          this.selectedGymId = res.data[0].gymId;
          this.loadMenus();
        }
        this.loading.set(false);
      },
      error: () => {
        this.notify.error('Failed to load gyms.');
        this.loading.set(false);
      },
    });
  }

  onGymChange(): void {
    this.loadMenus();
  }

  loadMenus(): void {
    if (!this.selectedGymId) return;
    this.loading.set(true);
    this.tenantMenuService.getGymMenus(this.selectedGymId).subscribe({
      next: (res) => {
        this.menus.set(res.data ?? []);
        this.loading.set(false);
      },
      error: () => {
        this.notify.error('Failed to load gym menus.');
        this.loading.set(false);
      },
    });
  }

  toggleMenu(menu: TenantMenuDto): void {
    if (!this.auth.hasPermission(Permissions.ManageTenantMenus)) {
      this.notify.error('You do not have permission to manage tenant menus.');
      return;
    }

    const request = menu.isEnabled
      ? this.tenantMenuService.disableMenu(this.selectedGymId, menu.menuId)
      : this.tenantMenuService.enableMenu(this.selectedGymId, menu.menuId);

    request.subscribe({
      next: () => {
        this.notify.success(`Menu ${menu.isEnabled ? 'disabled' : 'enabled'} successfully.`);
        this.loadMenus();
        this.loadGyms();
      },
      error: () => this.notify.error('Failed to update menu.'),
    });
  }

  bulkSet(isEnabled: boolean): void {
    if (!this.auth.hasPermission(Permissions.ManageTenantMenus)) {
      this.notify.error('You do not have permission to manage tenant menus.');
      return;
    }

    const menuIds = this.menus().map((m) => m.menuId);
    this.tenantMenuService.bulkSetMenus(this.selectedGymId, { menuIds, isEnabled }).subscribe({
      next: () => {
        this.notify.success(`All menus ${isEnabled ? 'enabled' : 'disabled'}.`);
        this.loadMenus();
        this.loadGyms();
      },
      error: () => this.notify.error('Bulk update failed.'),
    });
  }

  selectedGymSummary(): GymMenuSummaryDto | undefined {
    return this.gyms().find((g) => g.gymId === this.selectedGymId);
  }
}
