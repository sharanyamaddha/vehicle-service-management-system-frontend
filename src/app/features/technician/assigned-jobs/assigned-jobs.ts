import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ServiceRequestService, ServiceRequest } from '../../../core/services/service-request';
import { VehicleService, Vehicle } from '../../../core/services/vehicle';
import { InventoryService, InventoryPart } from '../../../core/services/inventory';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-assigned-jobs',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './assigned-jobs.html',
  styleUrl: './assigned-jobs.css',
})
export class AssignedJobs implements OnInit {
  jobs: ServiceRequest[] = [];
  isLoading = true;
  userId: string = '';

  // Filter State: 'ALL' or specific status
  selectedStatusFilter: string = 'ALL';

  vehicleMap = new Map<string, Vehicle>();
  partsList: InventoryPart[] = [];

  showPartsModal = false;
  selectedJob: ServiceRequest | null = null;
  requestPartsSelection: { partId: string, quantity: number }[] = [];

  // Available filter options for dropdown
  filterOptions = [
    { label: 'All Statuses', value: 'ALL' },
    { label: 'Assigned', value: 'ASSIGNED' },
    { label: 'In Progress', value: 'IN_PROGRESS' },
    { label: 'Completed', value: 'COMPLETED' },
    { label: 'Closed', value: 'CLOSED' }
  ];

  constructor(
    private requestService: ServiceRequestService,
    private vehicleService: VehicleService,
    private inventoryService: InventoryService,
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

    forkJoin({
      jobs: this.requestService.getTechnicianRequests(this.userId),
      vehicles: this.vehicleService.getAllVehicles(),
      parts: this.inventoryService.getAllParts()
    }).subscribe({
      next: ({ jobs, vehicles, parts }) => {
        this.jobs = jobs || [];
        (vehicles || []).forEach(v => {
          if (v.id) this.vehicleMap.set(v.id, v);
        });
        this.partsList = parts || [];
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

  get filteredJobs(): ServiceRequest[] {
    if (this.selectedStatusFilter === 'ALL') {
      return this.jobs;
    }
    return this.jobs.filter(j => j.status === this.selectedStatusFilter);
  }

  getVehicleDisplay(id: string): string {
    const v = this.vehicleMap.get(id);
    return v ? `${v.year} ${v.make} ${v.model}` : 'Unknown Vehicle';
  }

  // --- Parts Logic ---

  openRequestParts(job: ServiceRequest): void {
    this.selectedJob = job;
    this.requestPartsSelection = [{ partId: '', quantity: 1 }];
    this.showPartsModal = true;
  }

  addPartRow(): void {
    this.requestPartsSelection.push({ partId: '', quantity: 1 });
  }

  removePartRow(index: number): void {
    this.requestPartsSelection.splice(index, 1);
  }

  closePartsModal(): void {
    this.showPartsModal = false;
    this.selectedJob = null;
    this.requestPartsSelection = [];
  }

  // Dialog State
  dialogVisible = false;
  dialogTitle = '';
  dialogMessage = '';
  dialogType: 'info' | 'confirm' | 'error' = 'info';
  private onDialogConfirm: (() => void) | null = null;

  showInfo(title: string, message: string): void {
    this.dialogTitle = title;
    this.dialogMessage = message;
    this.dialogType = 'info';
    this.dialogVisible = true;
    this.onDialogConfirm = null;
  }

  showError(title: string, message: string): void {
    this.dialogTitle = title;
    this.dialogMessage = message;
    this.dialogType = 'error';
    this.dialogVisible = true;
    this.onDialogConfirm = null;
  }

  showConfirm(title: string, message: string, onConfirm: () => void): void {
    this.dialogTitle = title;
    this.dialogMessage = message;
    this.dialogType = 'confirm';
    this.dialogVisible = true;
    this.onDialogConfirm = onConfirm;
  }

  closeDialog(): void {
    this.dialogVisible = false;
    this.onDialogConfirm = null;
  }

  handleDialogConfirm(): void {
    if (this.onDialogConfirm) {
      this.onDialogConfirm();
    }
    this.closeDialog();
  }

  submitPartsRequest(): void {
    if (!this.selectedJob) return;

    // Validate
    const validParts = this.requestPartsSelection.filter(p => p.partId && p.quantity > 0);
    if (validParts.length === 0) {
      this.showInfo("Validation Error", "Please select at least one part.");
      return;
    }

    const payload = validParts.map(p => {
      const partDetails = this.partsList.find(item => item.id === p.partId);
      return {
        partId: p.partId,
        qty: p.quantity,
        partName: partDetails ? partDetails.name : 'Unknown Part',
        price: partDetails ? partDetails.price : 0
      };
    });

    this.requestService.requestParts(this.selectedJob.id, payload).subscribe({
      next: () => {
        this.showInfo("Success", "Parts Requested Successfully. Waiting for Manager Approval.");
        this.closePartsModal();
        this.loadData(); // Refresh to update status
      },
      error: (err) => {
        this.showError("Request Failed", "Failed to request parts: " + err.message);
      }
    });
  }


  startWork(id: string): void {
    this.showConfirm('Start Job', 'Are you sure you want to start work on this vehicle?', () => {
      this.requestService.startJob(id).subscribe(() => {
        this.loadData();
      });
    });
  }

  completeWork(id: string): void {
    this.showConfirm('Complete Job', 'Are you sure you want to mark this job as completed?', () => {
      this.requestService.updateServiceRequest(id, { status: 'COMPLETED' }).subscribe(() => {
        this.loadData();
      });
    });
  }

  getBadgeClass(status: string): string {
    switch (status) {
      case 'ASSIGNED': return 'badge-primary';
      case 'IN_PROGRESS': return 'badge-warning';
      case 'COMPLETED': return 'badge-success';
      case 'CLOSED': return 'badge-secondary';
      default: return 'badge-secondary';
    }
  }
}
