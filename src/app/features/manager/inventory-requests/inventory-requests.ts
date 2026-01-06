import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ServiceRequestService, ServiceRequest } from '../../../core/services/service-request';
import { UserService } from '../../../core/services/user-service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-inventory-requests',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './inventory-requests.html',
  styleUrl: './inventory-requests.css',
})
export class InventoryRequests implements OnInit {
  pendingRequests: ServiceRequest[] = [];
  isLoading = true;
  userId: string = '';
  techNameMap = new Map<string, string>();

  constructor(
    private requestService: ServiceRequestService,
    private userService: UserService
  ) {
    this.userId = sessionStorage.getItem('userId') || '';
  }

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading = true;

    forkJoin({
      requests: this.requestService.getAllRequests(),
      users: this.userService.getAllUsers()
    }).subscribe({
      next: ({ requests, users }) => {
        this.pendingRequests = requests.filter(r => r.partsStatus === 'PARTS_REQUESTED');
        (users || []).forEach(u => this.techNameMap.set(u.id, u.username));
        this.isLoading = false;
      },
      error: (err) => {
        console.error(err);
        this.isLoading = false;
      }
    });
  }

  approveParts(requestId: string): void {
    if (!confirm('Approve parts for this request?')) return;

    this.requestService.approveParts(requestId, this.userId).subscribe({
      next: () => {
        alert('Parts Approved.');
        this.loadData();
      },
      error: (err) => alert('Error: ' + (err.error?.message || err.message))
    });
  }

  rejectParts(requestId: string): void {
    alert('Reject functionality pending backend support.');
  }

  getTechName(id: string): string {
    return this.techNameMap.get(id) || 'Unknown';
  }
}
