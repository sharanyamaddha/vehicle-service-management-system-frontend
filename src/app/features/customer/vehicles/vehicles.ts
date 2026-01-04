import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { VehicleService, Vehicle } from '../../../core/services/vehicle';
import { Auth } from '../../../core/services/auth';
import { DialogService } from '../../../shared/services/dialog.service';

@Component({
  selector: 'app-vehicles',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './vehicles.html',
  styleUrl: './vehicles.css'
})
export class Vehicles implements OnInit {
  vehicles: Vehicle[] = [];
  isLoading: boolean = false;
  showAddVehicle: boolean = false;
  vehicleForm!: FormGroup;
  isSubmitting: boolean = false;
  customerId: string = '';

  constructor(
    private readonly vehicleService: VehicleService,
    private readonly authService: Auth,
    private readonly fb: FormBuilder,
    private readonly dialogService: DialogService,
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
      year: [new Date().getFullYear(), [Validators.required, Validators.min(1900), Validators.max(new Date().getFullYear() + 1)]],
      registrationNumber: ['', [Validators.required, Validators.pattern('^[A-Z]{2}[0-9]{2}[A-Z]{2}[0-9]{4}$')]],
      color: ['', [Validators.required]],
      type: ['CAR', [Validators.required]]
    });
  }

  loadVehicles(): void {
    this.isLoading = true;
    this.vehicleService.getVehiclesByCustomerId(this.customerId).subscribe({
      next: (data) => {
        this.vehicles = Array.isArray(data) ? data : [];
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  submitVehicle(): void {
    if (this.vehicleForm.invalid) return;

    this.isSubmitting = true;
    const formValue = this.vehicleForm.value;
    const newVehicle: Vehicle = {
      ownerId: this.customerId,
      // Map form fields to backend expected fields
      registrationNumber: formValue.registrationNumber,
      make: formValue.make,
      model: formValue.model,
      year: formValue.year,
      color: formValue.color,
      type: formValue.type
    };

    this.vehicleService.addVehicle(newVehicle).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.showAddVehicle = false;
        this.vehicleForm.reset({ year: new Date().getFullYear(), type: 'CAR' });
        this.loadVehicles();
        this.dialogService.confirm({
          title: 'Success',
          message: 'Vehicle added successfully',
          confirmLabel: 'OK',
          cancelLabel: '',
          isDangerous: false
        }).subscribe();
      },
      error: () => {
        this.isSubmitting = false;
        this.dialogService.confirm({
          title: 'Error',
          message: 'Failed to add vehicle.',
          confirmLabel: 'OK',
          cancelLabel: '',
          isDangerous: true
        }).subscribe();
      }
    });
  }

  deleteVehicle(vehicle: Vehicle): void {
    if (!vehicle.id) return;

    this.dialogService.confirm({
      title: 'Delete Vehicle',
      message: `Are you sure you want to delete ${vehicle.make} ${vehicle.model}?`,
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
      isDangerous: true
    }).subscribe(confirmed => {
      if (confirmed && vehicle.id) {
        this.vehicleService.deleteVehicle(vehicle.id).subscribe({
          next: () => {
            this.loadVehicles();
          },
          error: () => {
            alert('Failed to delete vehicle');
          }
        });
      }
    });
  }

  bookService(vehicle: Vehicle): void {
    // Navigate to book service page
    this.router.navigate(['/customer/book-service', vehicle.id]);
  }
}
