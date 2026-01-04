import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { ServiceRequestService, ServiceRequest } from '../../../core/services/service-request';
import { VehicleService, Vehicle } from '../../../core/services/vehicle';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-requests',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './requests.html',
  styleUrl: './requests.css'
})
export class Requests implements OnInit {
  requests: ServiceRequest[] = [];
  vehiclesMap: Map<string, string> = new Map();
  isLoading: boolean = false;
  customerId: string = '';

  constructor(
    private readonly serviceRequestService: ServiceRequestService,
    private readonly vehicleService: VehicleService,
    private readonly cdr: ChangeDetectorRef,
    private readonly router: Router
  ) { }

  ngOnInit(): void {
    this.customerId = sessionStorage.getItem('userId') || '';
    if (this.customerId) {
      this.loadData();
    }
  }

  loadData(): void {
    this.isLoading = true;
    forkJoin({
      requests: this.serviceRequestService.getCustomerRequests(this.customerId),
      vehicles: this.vehicleService.getVehiclesByCustomerId(this.customerId)
    }).subscribe({
      next: ({ requests, vehicles }) => {
        // Map vehicles
        vehicles.forEach(v => {
          if (v.id) {
            this.vehiclesMap.set(v.id, `${v.make} ${v.model}`);
          }
        });

        // Filter and sort requests
        this.requests = Array.isArray(requests)
          ? requests.filter((request) => request.customerId === this.customerId)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          : [];

        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  getVehicleName(vehicleId: string): string {
    return this.vehiclesMap.get(vehicleId) || vehicleId || 'Unknown Vehicle';
  }

  getStatusBadgeClass(status: string): string {
    const statusMap: { [key: string]: string } = {
      'BOOKED': 'status-requested',    // Grey (User asked for REQUESTED, assuming BOOKED corresponds)
      'REQUESTED': 'status-requested', // Grey
      'ASSIGNED': 'status-assigned',   // Blue
      'IN_PROGRESS': 'status-in-progress', // Orange
      'COMPLETED': 'status-completed', // Yellow
      'CLOSED': 'status-closed'        // Green
    };
    return statusMap[status] || 'status-default';
  }

  getStatusLabel(status: string): string {
    if (status === 'BOOKED' || status === 'REQUESTED') return 'Requested';
    return status.replace('_', ' ');
  }

  viewDetails(request: ServiceRequest): void {
    // Navigate to detail page
    this.router.navigate(['/customer/requests', request.id]);
  }
}
