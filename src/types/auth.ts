// src/types/auth.ts
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // timestamp в миллисекундах
}

export interface User {
  id: string;
  username: string;
  email?: string;
  role: UserRole;
  team: string;
  permissions: Permission[];
  lastLogin?: Date;
}

export enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  OPERATOR = 'operator',
  VIEWER = 'viewer'
}

export interface Permission {
  resource: string;
  actions: string[];
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface LogoutRequest {
  refreshToken: string;
}

