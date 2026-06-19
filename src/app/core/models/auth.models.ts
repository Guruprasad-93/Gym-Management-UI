export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}

export interface LoginRequest {
  loginIdentifier: string;
  password: string;
  gymId?: string | null;
}

export interface ForgotPasswordRequest {
  loginIdentifier: string;
  gymId?: string | null;
}

export interface ResetPasswordRequest {
  loginIdentifier: string;
  gymId?: string | null;
  token: string;
  newPassword: string;
}

export interface LoginResponse {
  token: string;
  refreshToken: string;
  expiresAt: string;
  refreshTokenExpiresAt: string;
  userId: string;
  fullName: string;
  email: string;
  gymId?: string | null;
  gymName?: string | null;
  sessionId: string;
  tokenVersion: number;
  roles: string[];
  permissions: string[];
  enabledMenuCodes?: string[];
  mustChangePassword?: boolean;
}

export interface AuthUser {
  userId: string;
  name: string;
  email: string;
  gymId?: string | null;
  roles: string[];
  permissions: string[];
  enabledMenuCodes?: string[];
  expiresAt: string;
  mustChangePassword?: boolean;
}

export interface SessionPermissions {
  userId: string;
  fullName: string;
  email: string;
  gymId?: string | null;
  gymName?: string | null;
  roles: string[];
  permissions: string[];
  enabledMenuCodes?: string[];
  refreshedAt: string;
}
