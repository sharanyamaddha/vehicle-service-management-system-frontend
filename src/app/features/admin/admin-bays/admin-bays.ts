import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ServiceBayService, ServiceBay } from '../../../core/services/service-bay';
import { DialogService } from '../../../shared/services/dialog.service';

@Component({
  selector: 'app-admin-bays',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './admin-bays.html',
  styleUrl: './admin-bays.css',
})
export class AdminBays implements OnInit {
  bays: ServiceBay[] = [];
  isLoading: boolean = false;
  isSubmitting: boolean = false;
  showAddBay: boolean = false;
  addBayForm!: FormGroup;
  errorMessage: string = '';

  constructor(
    private bayService: ServiceBayService,
    private cdr: ChangeDetectorRef,
    private fb: FormBuilder,
    private dialogService: DialogService
  ) { }

  ngOnInit(): void {
    this.initForm();
    this.loadBays();
  }

  initForm(): void {
    this.addBayForm = this.fb.group({
      bayNumber: ['', [Validators.required, Validators.min(1)]]
    });
  }

  loadBays(): void {
    this.isLoading = true;
    this.bayService.getAllBays().subscribe({
      next: (data) => {
        this.bays = Array.isArray(data) ? data : [];
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.errorMessage = 'Failed to load bays';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  submitAddBay(): void {
    if (this.addBayForm.invalid) return;

    this.isSubmitting = true;
    const { bayNumber } = this.addBayForm.value;
    const newBay: ServiceBay = {
      bayNumber: Number(bayNumber || 0),
      available: true,
      active: true
    };

    this.bayService.createBay(newBay).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.showAddBay = false;
        this.addBayForm.reset();
        this.loadBays();
        this.dialogService.confirm({
          title: 'Success',
          message: 'Bay added successfully',
          confirmLabel: 'OK',
          cancelLabel: '',
          isDangerous: false
        }).subscribe();
      },
      error: (err) => {
        this.isSubmitting = false;
        this.dialogService.confirm({
          title: 'Error',
          message: 'Failed to add bay. ' + (err?.error?.message || 'Check if bay number already exists.'),
          confirmLabel: 'OK',
          cancelLabel: '',
          isDangerous: true
        }).subscribe();
      }
    });
  }

  toggleBayStatus(bay: ServiceBay): void {
    const action = bay.active ? 'Disable' : 'Enable';
    this.dialogService.confirm({
      title: `${action} Bay ${bay.bayNumber}`,
      message: `Are you sure you want to ${action.toLowerCase()} this bay?`,
      confirmLabel: action,
      cancelLabel: 'Cancel',
      isDangerous: bay.active
    }).subscribe(confirmed => {
      if (confirmed) {
        this.bayService.updateStatus(bay.bayNumber, !bay.active).subscribe({
          next: () => {
            bay.active = !bay.active;
            this.cdr.detectChanges();
          },
          error: () => this.showError(`Failed to ${action.toLowerCase()} bay.`)
        });
      }
    });
  }

  forceRelease(bay: ServiceBay): void {
    this.dialogService.confirm({
      title: `Force Release Bay ${bay.bayNumber}`,
      message: 'This will mark the bay as available explicitly. Use only if it is stuck.',
      confirmLabel: 'Release',
      cancelLabel: 'Cancel',
      isDangerous: true
    }).subscribe(confirmed => {
      if (confirmed) {
        this.bayService.forceRelease(bay.bayNumber).subscribe({
          next: () => {
            bay.available = true;
            this.cdr.detectChanges();
            this.dialogService.confirm({
              title: 'Success', message: 'Bay released.', confirmLabel: 'OK', cancelLabel: '', isDangerous: false
            }).subscribe();
          },
          error: (err) => this.showError('Failed to release bay.')
        });
      }
    });
  }

  private showError(msg: string) {
    this.dialogService.confirm({
      title: 'Error', message: msg, confirmLabel: 'OK', cancelLabel: '', isDangerous: true
    }).subscribe();
  }
}
