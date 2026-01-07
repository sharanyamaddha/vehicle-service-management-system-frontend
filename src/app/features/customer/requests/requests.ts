import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { ServiceRequestService, ServiceRequest } from '../../../core/services/service-request';
import { VehicleService, Vehicle } from '../../../core/services/vehicle';
import { InvoiceService, Invoice } from '../../../core/services/invoice';
import { forkJoin } from 'rxjs';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-requests',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './requests.html',
  styleUrl: './requests.css'
})
export class Requests implements OnInit {
  allRequests: ServiceRequest[] = [];
  filteredRequests: ServiceRequest[] = [];
  vehiclesMap: Map<string, string> = new Map();
  invoicesMap: Map<string, Invoice> = new Map();
  isLoading: boolean = false;
  customerId: string = '';

  selectedFilter: string = 'ALL_ACTIVE'; // Default: All except History (Closed+Paid)

  filterOptions = [
    { label: 'Active (All)', value: 'ALL_ACTIVE' },
    { label: 'Requested', value: 'REQUESTED' },
    { label: 'Assigned', value: 'ASSIGNED' },
    { label: 'In Progress', value: 'IN_PROGRESS' },
    { label: 'Completed', value: 'COMPLETED' },
    { label: 'Closed (Unpaid)', value: 'CLOSED_UNPAID' }
  ];

  constructor(
    private serviceRequestService: ServiceRequestService,
    private vehicleService: VehicleService,
    private invoiceService: InvoiceService,
    private cdr: ChangeDetectorRef,
    private router: Router
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
      vehicles: this.vehicleService.getVehiclesByCustomerId(this.customerId),
      invoices: this.invoiceService.getCustomerInvoices(this.customerId)
    }).subscribe({
      next: ({ requests, vehicles, invoices }) => {
        // Map vehicles
        vehicles.forEach(v => {
          if (v.id) this.vehiclesMap.set(v.id, `${v.make} ${v.model}`);
        });

        // Map Invoices
        (invoices || []).forEach(inv => {
          this.invoicesMap.set(inv.serviceRequestId, inv);
        });

        // Store all
        this.allRequests = Array.isArray(requests)
          ? requests.filter((request) => request.customerId === this.customerId)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          : [];

        this.applyFilter();
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  applyFilter(): void {
    this.filteredRequests = this.allRequests.filter(req => {
      const inv = this.invoicesMap.get(req.id);

      if (this.selectedFilter === 'ALL_ACTIVE') {
        // Show everything that is NOT Closed (or closed but unpaid might be considered 'actionable'?)
        // Usually Active means work in progress.
        return req.status !== 'CLOSED';
      }

      if (this.selectedFilter === 'CLOSED_UNPAID') {
        // Must be CLOSED and invoice is NOT PAID (or invoice exists and is PENDING)
        // If invoice is missing, we assume unpaid/pending generation? 
        // Using strict check:
        return req.status === 'CLOSED' && inv?.status !== 'PAID';
      }

      // Exact match for REQUESTED, ASSIGNED, IN_PROGRESS, COMPLETED
      return req.status === this.selectedFilter;
    });
  }

  onFilterChange(): void {
    this.applyFilter();
  }

  getVehicleName(vehicleId: string): string {
    return this.vehiclesMap.get(vehicleId) || vehicleId || 'Unknown Vehicle';
  }

  getStatusBadgeClass(status: string): string {
    const statusMap: { [key: string]: string } = {
      'BOOKED': 'status-requested',
      'REQUESTED': 'status-requested',
      'ASSIGNED': 'status-assigned',
      'IN_PROGRESS': 'status-in-progress',
      'COMPLETED': 'status-completed',
      'CLOSED': 'status-closed'
    };
    return statusMap[status] || 'status-default';
  }

  getStatusLabel(status: string, reqId?: string): string {
    if (status === 'CLOSED' && reqId) {
      const inv = this.invoicesMap.get(reqId);
      if (inv && inv.status === 'PENDING') return 'Unpaid';
      if (inv && inv.status === 'PAID') return 'Closed (Paid)';
    }
    if (status === 'BOOKED' || status === 'REQUESTED') return 'Requested';
    return status.replace('_', ' ');
  }

  viewDetails(request: ServiceRequest): void {
    this.router.navigate(['/customer/requests', request.id]);
  }
}
