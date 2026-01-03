import { Injectable } from '@angular/core';
import { HttpBase } from '../http-base';
import { Observable } from 'rxjs';

export interface UserResponse {
  id: string;
  username: string;
  email: string;
  role: string;
  active: boolean;
}

@Injectable({ providedIn: 'root' })
export class UserService {
  constructor(private http: HttpBase) {}

  getAllUsers(): Observable<UserResponse[]> {
    return this.http.get('/api/users');
  }

  getUserById(id: string): Observable<UserResponse> {
    return this.http.get(`/api/users/${id}`);
  }

  getUsersByRole(role: string): Observable<UserResponse[]> {
    return this.http.get(`/api/users/role/${role}`);
  }

  disableUser(id: string): Observable<any> {
    return this.http.patch(`/api/users/${id}/disable`, {});
  }

  enableUser(id: string): Observable<any> {
    return this.http.patch(`/api/users/${id}/enable`, {});
  }

  getDisabledUsers(): Observable<UserResponse[]> {
    return this.http.get('/api/users/disabled');
  }

  resetPassword(id: string): Observable<any> {
    return this.http.patch(`/api/users/${id}/reset-password`, {});
  }
}
