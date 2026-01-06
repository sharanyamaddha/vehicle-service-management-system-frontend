import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpBase } from '../http-base';

export interface UserResponse {
  id: string;
  username: string;
  email: string;
  role: string;
  active: boolean;
  passwordSet?: boolean;
}

@Injectable({ providedIn: 'root' })
export class UserService {
  constructor(private readonly http: HttpBase) { }

  getAllUsers(): Observable<UserResponse[]> {
    return this.http.get<UserResponse[]>('/api/users');
  }

  createUser(payload: { username: string; email: string; password: string; role: string }): Observable<any> {
    return this.http.post('/api/users/create', payload);
  }

  createTechnician(payload: { userId: string; specialization: string; available: boolean }): Observable<any> {
    return this.http.post('/api/technicians', payload);
  }

  getUserById(id: string): Observable<UserResponse> {
    return this.http.get<UserResponse>(`/api/users/${id}`);
  }

  getUsersByRole(role: string): Observable<UserResponse[]> {
    return this.http.get<UserResponse[]>(`/api/users/role/${role}`);
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

  getInvitedUsers(): Observable<UserResponse[]> {
    return this.http.get<UserResponse[]>('/api/users/invited');
  }

  resetPassword(id: string): Observable<any> {
    return this.http.patch(`/api/users/${id}/reset-password`, {});
  }
  resendInvite(userId: string): Observable<any> {
    return this.http.post(`/api/users/${userId}/resend-invite`, {});
  }

  getAvailableTechnicians(): Observable<any[]> {
    return this.http.get<any[]>('/api/technicians/status/true');
  }

  getTechniciansBySpecialization(spec: string): Observable<any[]> {
    return this.http.get<any[]>(`/api/technicians/specialization/${spec}`);
  }

  getMyProfile(): Observable<UserResponse> {
    return this.http.get<UserResponse>('/api/users/me');
  }

  updateProfile(data: any): Observable<any> {
    return this.http.put('/api/users/me', data);
  }

  changePassword(data: any): Observable<any> {
    return this.http.patch('/api/users/me/password', data);
  }
}
