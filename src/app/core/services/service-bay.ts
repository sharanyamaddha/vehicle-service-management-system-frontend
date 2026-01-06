import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { HttpBase } from '../http-base';

export interface ServiceBay {
  id?: string;
  bayNumber: number;
  available: boolean;
  active: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ServiceBayService extends HttpBase {

  constructor(http: HttpClient) {
    super(http);
  }

  getAllBays(): Observable<ServiceBay[]> {
    return this.get<ServiceBay[]>('/api/bays');
  }

  getAvailableBays(): Observable<ServiceBay[]> {
    return this.get<ServiceBay[]>('/api/bays/available');
  }

  createBay(bay: ServiceBay): Observable<ServiceBay> {
    return this.post<ServiceBay>('/api/bays', bay);
  }

  updateStatus(bayNumber: number, active: boolean): Observable<any> {
    return this.patch(`/api/bays/${bayNumber}/status`, { isAvailable: active });
  }

  forceRelease(bayNumber: number): Observable<any> {
    return this.post(`/api/bays/${bayNumber}/release`, {});
  }
}
