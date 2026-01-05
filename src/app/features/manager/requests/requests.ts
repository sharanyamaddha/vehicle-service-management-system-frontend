import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router'; // Navigation
import { ServiceRequestService, ServiceRequest } from '../../../core/services/service-request';
import { UserService } from '../../../core/services/user-service';
import { VehicleService, Vehicle } from '../../../core/services/vehicle';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-requests',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './requests.html',
  styleUrl: './requests.css'
})
export class Requests implements OnInit {
  requests: ServiceRequest[] = [];
  usersMap = new Map<string, any>(); // userId -> User object or name? Let's store object or name. Storing name for simplicity.
  // Actually need to distinguish Tech users from Customer users.
  // Let's store userId -> {username, role} or just name.
  // I need Customer Name and Tech Name. 
  // usersMap: id -> username.

  vehiclesMap = new Map<string, Vehicle>();
  isLoading: boolean = false;

  constructor(
    private serviceRequestService: ServiceRequestService,
    private userService: UserService,
    private vehicleService: VehicleService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading = true;
    console.log('Loading data...');
    forkJoin({
      requests: this.serviceRequestService.getAllRequests(),
      users: this.userService.getAllUsers(),
      vehicles: this.vehicleService.getAllVehicles()
    }).subscribe({
      next: ({ requests, users, vehicles }) => {
        console.log('ForkJoin Data:', { requests, users, vehicles });
        this.requests = requests || [];

        (users || []).forEach((u: any) => {
          this.usersMap.set(u.id, u.username); // User Name
        });

        (vehicles || []).forEach((v: Vehicle) => {
          if (v.id) this.vehiclesMap.set(v.id, v);
        });

        this.isLoading = false;
        this.cdr.detectChanges(); // Force update
      },
      error: (err) => {
        console.error('Load Error:', err);
        this.isLoading = false;
        alert('Failed to load data details');
        this.cdr.detectChanges();
      }
    });
  }

  // Helpers
  getTechName(techId: string): string {
    return this.usersMap.get(techId) || 'Unassigned';
  }

  getCustomerName(customerId: string): string {
    return this.usersMap.get(customerId) || 'Unknown Customer';
  }

  getVehicleDisplay(vehicleId: string): string {
    const v = this.vehiclesMap.get(vehicleId);
    if (!v) return vehicleId;
    return `${v.year} ${v.make} ${v.model}`;
  }

  getRequestIdDisplay(req: ServiceRequest): string {
    return `SR-${req.requestNumber || req.id.slice(0, 4)}`;
  }

  viewAssign(req: ServiceRequest): void {
    this.router.navigate(['/manager/requests', req.id]);
  }

  getBadgeClass(status: string): string {
    const map: any = {
      'REQUESTED': 'badge-grey',
      'BOOKED': 'badge-grey',
      'ASSIGNED': 'badge-blue',
      'IN_PROGRESS': 'badge-orange',
      'COMPLETED': 'badge-yellow',
      'CLOSED': 'badge-green'
    };
    return map[status] || 'badge-grey';
  }
}
