import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ServiceRequestService, ServiceRequest } from '../../../core/services/service-request';

@Component({
  selector: 'app-requests',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './requests.html',
  styleUrl: './requests.css'
})
export class Requests implements OnInit {
  requests: ServiceRequest[] = [];
  isLoading: boolean = false;
  customerId: string = '';

  constructor(
    private readonly serviceRequestService: ServiceRequestService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.customerId = sessionStorage.getItem('userId') || '';
    if (this.customerId) {
      this.loadRequests();
    }
  }

  loadRequests(): void {
    this.isLoading = true;
    this.serviceRequestService.getCustomerRequests(this.customerId).subscribe({
      next: (data) => {
        this.requests = Array.isArray(data)
          ? data.filter((request) => request.customerId === this.customerId)
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

  getStatusBadgeClass(status: string): string {
    const statusMap: { [key: string]: string } = {
      'BOOKED': 'status-booked',
      'ASSIGNED': 'status-assigned',
      'IN_PROGRESS': 'status-in-progress',
      'COMPLETED': 'status-completed',
      'CLOSED': 'status-closed'
    };
    return statusMap[status] || 'status-default';
  }

  getStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      'BOOKED': 'Booked',
      'ASSIGNED': 'Assigned',
      'IN_PROGRESS': 'In Progress',
      'COMPLETED': 'Completed',
      'CLOSED': 'Closed'
    };
    return labels[status] || status;
  }

  isViewDetailsEnabled(status: string): boolean {
    return ['BOOKED', 'ASSIGNED', 'IN_PROGRESS'].includes(status);
  }

  isWaitingForInvoice(status: string): boolean {
    return status === 'COMPLETED';
  }

  isViewInvoiceEnabled(status: string): boolean {
    return status === 'CLOSED';
  }
}
