import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ServiceRequestService } from '../../../core/services/service-request';
import { VehicleService, Vehicle } from '../../../core/services/vehicle';
import { DialogService } from '../../../shared/services/dialog.service';

@Component({
  selector: 'app-book-service',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './book-service.html',
  styleUrl: './book-service.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BookService implements OnInit {
  bookForm!: FormGroup;
  vehicleId: string = '';
  vehicle?: Vehicle;
  isLoading: boolean = false;
  isSubmitting: boolean = false;
  customerId: string = '';

  constructor(
    private readonly fb: FormBuilder,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly serviceRequestService: ServiceRequestService,
    private readonly vehicleService: VehicleService,
    private readonly dialogService: DialogService,
    private readonly cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    if (!this.ensureCustomerId()) {
      return;
    }

    this.initForm();

    // Get vehicleId from route params
    this.route.paramMap.subscribe(params => {
      this.vehicleId = params.get('vehicleId') || '';
      if (this.vehicleId && this.customerId) {
        this.loadVehicle();
      }
    });
  }

  initForm(): void {
    this.bookForm = this.fb.group({
      issue: ['', [Validators.required, Validators.minLength(10)]],
      priority: ['NORMAL', [Validators.required]]
    });
  }

  loadVehicle(): void {
    this.isLoading = true;
    this.cdr.markForCheck();
    this.vehicleService.getVehiclesByCustomerId(this.customerId).subscribe({
      next: (vehicles) => {
        this.vehicle = vehicles.find(v => v.id === this.vehicleId);
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.isLoading = false;
        this.cdr.markForCheck();
        this.dialogService.confirm({
          title: 'Error',
          message: 'Failed to load vehicle details',
          confirmLabel: 'Go Back',
          cancelLabel: '',
          isDangerous: true
        }).subscribe(() => {
          this.router.navigate(['/customer/vehicles']);
        });
      }
    });
  }

  submitBooking(): void {
    if (this.bookForm.invalid || !this.vehicleId) return;
    if (!this.ensureCustomerId()) return;

    this.isSubmitting = true;
    this.cdr.markForCheck();

    const formValue = this.bookForm.value;
    const serviceRequestDTO = {
      customerId: this.customerId,
      vehicleId: this.vehicleId,
      issue: formValue.issue,
      priority: formValue.priority
    };

    this.serviceRequestService.createServiceRequest(serviceRequestDTO).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.cdr.markForCheck();
        this.dialogService.confirm({
          title: 'Success',
          message: 'Service request booked successfully! You can track it in My Service Requests.',
          confirmLabel: 'View Requests',
          cancelLabel: 'Go to Vehicles',
          isDangerous: false
        }).subscribe(confirmed => {
          if (confirmed) {
            this.router.navigate(['/customer/requests']);
          } else {
            this.router.navigate(['/customer/vehicles']);
          }
        });
      },
      error: (error) => {
        this.isSubmitting = false;
        this.cdr.markForCheck();
        this.dialogService.confirm({
          title: 'Error',
          message: 'Failed to book service. Please try again.',
          confirmLabel: 'OK',
          cancelLabel: '',
          isDangerous: true
        }).subscribe();
      }
    });
  }

  private ensureCustomerId(): boolean {
    this.customerId = sessionStorage.getItem('userId') || '';

    if (!this.customerId) {
      this.dialogService.confirm({
        title: 'Session Required',
        message: 'Your session is missing. Please login again to continue.',
        confirmLabel: 'Login',
        cancelLabel: 'Cancel',
        isDangerous: true
      }).subscribe(() => {
        this.router.navigate(['/login']);
      });
      return false;
    }

    return true;
  }

  goBack(): void {
    this.router.navigate(['/customer/vehicles']);
  }
}
