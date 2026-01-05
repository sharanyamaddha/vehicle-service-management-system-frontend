import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { HttpBase } from '../http-base';

export interface Vehicle {
    id?: string;
    ownerId: string;
    registrationNumber: string;
    make: string;
    model: string;
    year: number;
    color: string;
    type: 'CAR' | 'BIKE' | 'TRUCK';
}

@Injectable({
    providedIn: 'root'
})
export class VehicleService extends HttpBase {

    constructor(http: HttpClient) {
        super(http);
    }

    getVehiclesByCustomerId(customerId: string): Observable<Vehicle[]> {
        return this.get<Vehicle[]>(`/api/vehicles/customer/${customerId}`);
    }

    getAllVehicles(): Observable<Vehicle[]> {
        return this.get<Vehicle[]>('/api/vehicles');
    }

    addVehicle(vehicle: Vehicle): Observable<any> {
        return this.post('/api/vehicles', vehicle);
    }

    deleteVehicle(id: string): Observable<any> {
        return this.delete(`/api/vehicles/${id}`);
    }

    updateVehicle(id: string, vehicle: Vehicle): Observable<any> {
        return this.put(`/api/vehicles/${id}`, vehicle);
    }
}
