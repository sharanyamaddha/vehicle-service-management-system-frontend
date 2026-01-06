import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ServiceRequestService } from '../../../core/services/service-request';

interface PartRequestDisplay {
  jobId: string;
  requestNumber: string;
  partName: string;
  quantity: number;
  status: string;
  requestedAt: string;
}

@Component({
  selector: 'app-my-part-requests',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './my-part-requests.html',
  styleUrl: './my-part-requests.css',
})
export class MyPartRequests implements OnInit {
  partRequests: PartRequestDisplay[] = [];
  isLoading = true;
  userId: string = '';

  constructor(
    private requestService: ServiceRequestService,
    private cdr: ChangeDetectorRef
  ) {
    this.userId = sessionStorage.getItem('userId') || '';
  }

  ngOnInit(): void {
    if (this.userId) {
      this.loadData();
    }
  }

  loadData(): void {
    this.isLoading = true;
    this.requestService.getTechnicianRequests(this.userId).subscribe({
      next: (jobs) => {
        this.partRequests = [];
        (jobs || []).forEach(job => {
          if (job.usedParts && Array.isArray(job.usedParts) && job.usedParts.length > 0) {
            job.usedParts.forEach((part: any) => {
              this.partRequests.push({
                jobId: job.id,
                requestNumber: job.requestNumber,
                partName: part.partName || 'Unknown Part',
                quantity: part.qty || part.quantity || 0,
                status: job.partsStatus || 'UNKNOWN',
                requestedAt: job.partsRequestedAt || job.updatedAt || ''
              });
            });
          }
        });
        this.partRequests.sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(err);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }
}
