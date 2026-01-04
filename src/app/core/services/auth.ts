import { Injectable } from '@angular/core';
import { HttpBase } from '../http-base';

export interface LoginRequest {
  username: string;
  password?: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password?: string;
  role: string;
}

@Injectable({ providedIn: 'root' })
export class Auth {

  constructor(private http: HttpBase) { }

  login(data: LoginRequest) {
    return this.http.post('/api/auth/login', data);
  }

  register(data: RegisterRequest) {
    return this.http.post('/api/auth/register', data);
  }

  activateAccount(token: string, password: string) {
    return this.http.post('/api/auth/activate', { token, password });
  }

  saveSession(res: any, role?: string) {
    sessionStorage.setItem('token', res.token || res.accessToken);
    sessionStorage.setItem('userId', res.userId);
    if (role) {
      sessionStorage.setItem('role', role);
    } else if (res.role) {
      sessionStorage.setItem('role', res.role);
    }
  }

  isAuthenticated(): boolean {
    return !!sessionStorage.getItem('token');
  }

  getRole(): string | null {
    return sessionStorage.getItem('role');
  }
}
