export interface GymAdmin {
  userId: string;
  gymId: string;
  gymName: string;
  name: string;
  loginIdentifier: string;
  email?: string;
  isActive: boolean;
  mustChangePassword: boolean;
  createdDate: string;
}

export interface CreateGymAdminRequest {
  gymId: string;
  name: string;
  loginIdentifier: string;
  email?: string;
  password?: string;
  generateTemporaryPassword: boolean;
}

export interface UpdateGymAdminRequest {
  name: string;
  loginIdentifier: string;
  email?: string;
  gymId: string;
}

export interface CreateGymAdminResult {
  admin: GymAdmin;
  temporaryPassword?: string;
  message: string;
}

export interface ResendTemporaryPasswordResult {
  userId: string;
  loginIdentifier: string;
  email?: string;
  temporaryPassword: string;
  message: string;
}
