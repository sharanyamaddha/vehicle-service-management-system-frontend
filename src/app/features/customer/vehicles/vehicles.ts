import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { VehicleService, Vehicle } from '../../../core/services/vehicle';
import { Auth } from '../../../core/services/auth';
import { ServiceRequestService } from '../../../core/services/service-request';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-vehicles',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './vehicles.html',
  styleUrl: './vehicles.css'
})
export class Vehicles implements OnInit {
  vehicles: Vehicle[] = [];
  activeVehicleIds: Set<string> = new Set();
  isLoading: boolean = false;
  showAddVehicle: boolean = false;
  vehicleForm!: FormGroup;
  isSubmitting: boolean = false;
  customerId: string = '';

  constructor(
    private readonly vehicleService: VehicleService,
    private readonly requestService: ServiceRequestService,
    private readonly authService: Auth,
    private readonly fb: FormBuilder,
    private readonly cdr: ChangeDetectorRef,
    private readonly router: Router
  ) { }

  ngOnInit(): void {
    this.customerId = sessionStorage.getItem('userId') || '';
    this.initForm();
    if (this.customerId) {
      this.loadVehicles();
    }
  }

  initForm(): void {
    this.vehicleForm = this.fb.group({
      make: ['', [Validators.required]],
      model: ['', [Validators.required]],
      registrationNumber: ['', [Validators.required, Validators.pattern('^[A-Z0-9-]{4,15}$')]],
      year: [new Date().getFullYear(), [Validators.required]],
      color: ['', [Validators.required]],
      type: ['CAR', [Validators.required]],
      description: ['']
    });
  }

  loadVehicles(): void {
    this.isLoading = true;

    forkJoin({
      vehicles: this.vehicleService.getVehiclesByCustomerId(this.customerId),
      requests: this.requestService.getCustomerRequests(this.customerId)
    }).subscribe({
      next: ({ vehicles, requests }) => {
        this.vehicles = Array.isArray(vehicles) ? vehicles : [];

        // Identify vehicles with active service
        this.activeVehicleIds.clear();
        const activeStatuses = ['REQUESTED', 'ASSIGNED', 'IN_PROGRESS'];
        (requests || []).forEach(req => {
          if (activeStatuses.includes(req.status) && req.vehicleId) {
            this.activeVehicleIds.add(req.vehicleId);
          }
        });

        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  hasActiveService(vehicleId?: string): boolean {
    return !!vehicleId && this.activeVehicleIds.has(vehicleId);
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



  openAddVehicleModal(): void {
    this.vehicleForm.reset({ year: new Date().getFullYear(), type: 'CAR' });
    this.showAddVehicle = true;
  }

  closeAddVehicleModal(): void {
    this.showAddVehicle = false;
  }

  submitVehicle(): void {
    if (this.vehicleForm.invalid) return;

    this.isSubmitting = true;

    const formValue = this.vehicleForm.value;
    const newVehicle: Vehicle = {
      ownerId: this.customerId,
      // Uppercase registration for consistency
      registrationNumber: formValue.registrationNumber.toUpperCase(),
      make: formValue.make,
      model: formValue.model,
      year: formValue.year || new Date().getFullYear(),
      color: formValue.color,
      type: formValue.type,
      description: formValue.description
    };

    this.vehicleService.addVehicle(newVehicle).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.showAddVehicle = false;
        this.vehicleForm.reset({ year: new Date().getFullYear(), type: 'CAR' });
        this.loadVehicles();
        this.showInfo('Success', 'Vehicle added successfully');
      },
      error: (err: any) => {
        this.isSubmitting = false;
        console.error('Add Vehicle Error:', err);

        const backendMsg = (err.error?.message || err.error || err.message || '').toLowerCase();

        if (backendMsg.includes('duplicate') || backendMsg.includes('already exists')) {
          this.vehicleForm.get('registrationNumber')?.setErrors({ duplicate: true });
          this.cdr.detectChanges();
          return;
        }

        let errorMessage = err.error?.message || err.error || 'An unexpected error occurred.';
        if (errorMessage.length > 100) errorMessage = 'Failed to add vehicle. Please check your network connection.';

        this.showError('Error', errorMessage);
        this.cdr.detectChanges();
      }
    });
  }

  deleteVehicle(vehicle: Vehicle): void {
    if (!vehicle.id) return;

    this.showConfirm(
      'Delete Vehicle',
      `Are you sure you want to delete ${vehicle.make} ${vehicle.model}?`,
      () => {
        if (vehicle.id) {
          this.vehicleService.deleteVehicle(vehicle.id).subscribe({
            next: () => {
              this.loadVehicles();
            },
            error: () => {
              this.showError('Error', 'Failed to delete vehicle');
            }
          });
        }
      }
    );
  }

  bookService(vehicle: Vehicle): void {
    if (!vehicle.id) return;
    this.router.navigate(['/customer/book-service', vehicle.id]);
  }
}
