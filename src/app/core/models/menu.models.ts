export interface MenuDto {
  menuId: number;
  menuCode: string;
  menuName: string;
  parentMenuId?: number | null;
  route?: string | null;
  icon?: string | null;
  sortOrder: number;
  isEnabled: boolean;
  enabledOn?: string | null;
  enabledBy?: string | null;
}

export interface TenantMenuDto extends MenuDto {
  gymId: string;
  gymMenuId?: number | null;
}

export interface GymMenuSummaryDto {
  gymId: string;
  gymName: string;
  totalMenus: number;
  enabledMenus: number;
}

export interface MyMenusResponse {
  menus: MenuDto[];
  enabledMenuCodes: string[];
}

export interface BulkSetGymMenusRequest {
  menuIds: number[];
  isEnabled: boolean;
}
