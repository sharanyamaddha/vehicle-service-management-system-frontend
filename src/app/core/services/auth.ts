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

  saveSession(res: any, role?: string) {
    localStorage.setItem('token', res.token || res.accessToken);
    localStorage.setItem('userId', res.userId);
    if (role) {
      localStorage.setItem('role', role);
    } else if (res.role) {
      localStorage.setItem('role', res.role);
    }
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('token');
  }

  getRole(): string | null {
    return localStorage.getItem('role');
  }
}
