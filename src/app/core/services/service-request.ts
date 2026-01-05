import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { HttpBase } from '../http-base';

export interface ServiceRequest {
    id: string;
    requestNumber: string;
    customerId: string;
    vehicleId: string;
    technicianId?: string;
    bayNumber?: string;
    issue: string;
    priority: string;
    status: 'REQUESTED' | 'BOOKED' | 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CLOSED';
    createdAt: string;
    updatedAt?: string;
}

export interface CreateServiceRequestDTO {
    customerId: string;
    vehicleId: string;
    issue: string;
    priority: string;
}

@Injectable({ providedIn: 'root' })
export class ServiceRequestService extends HttpBase {

    constructor(http: HttpClient) {
        super(http);
    }

    getCustomerRequests(customerId: string): Observable<ServiceRequest[]> {
        return this.get<ServiceRequest[]>(`/api/service-requests/customer/${customerId}`);
    }

    getRequestById(id: string): Observable<ServiceRequest> {
        return this.get<ServiceRequest>(`/api/service-requests/${id}`);
    }

    createServiceRequest(dto: CreateServiceRequestDTO): Observable<any> {
        return this.postText(`/api/service-requests`, dto);
    }

    getAllRequests(): Observable<ServiceRequest[]> {
        return this.get<ServiceRequest[]>('/api/service-requests/manager');
    }

    assignTechnician(id: string, payload: { technicianId: string, bayId: string }): Observable<any> {
        return this.patch(`/api/service-requests/${id}/assign`, payload);
    }

    closeRequest(id: string): Observable<any> {
        return this.patch(`/api/service-requests/${id}/close`, {});
    }

    updateServiceRequest(id: string, payload: any): Observable<any> {
        return this.patch(`/api/service-requests/${id}/status`, payload);
    }
}
