import type { ApiError } from './client';
import request from './client';

export interface AuthUser {
  id: number;
  email: string;
  role: string;
  firstName?: string;
  lastName?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export async function login(payload: LoginPayload): Promise<AuthUser> {
  return request<AuthUser>('/api/login', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function getCurrentUser(): Promise<AuthUser> {
  return request<AuthUser>('/api/login');
}

export async function logout(): Promise<void> {
  await request<void>('/api/login', {
    method: 'DELETE',
    parseJson: false
  });
}

export type { ApiError };
