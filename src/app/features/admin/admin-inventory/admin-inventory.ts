import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { InventoryService, InventoryPart } from '../../../core/services/inventory';
import { DialogService } from '../../../shared/services/dialog.service';

@Component({
  selector: 'app-admin-inventory',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './admin-inventory.html',
  styleUrl: './admin-inventory.css',
})
export class AdminInventory implements OnInit {
  lowStockItems: InventoryPart[] = [];
  isLoading: boolean = false;
  showRestock: boolean = false;
  selectedPart: InventoryPart | null = null;
  restockForm!: FormGroup;
  isSubmitting: boolean = false;
  errorMessage: string = '';

  constructor(
    private inventoryService: InventoryService,
    private cdr: ChangeDetectorRef,
    private fb: FormBuilder,
    private dialogService: DialogService
  ) { }

  ngOnInit(): void {
    this.initForm();
    this.checkInventory();
  }

  initForm(): void {
    this.restockForm = this.fb.group({
      quantity: [10, [Validators.required, Validators.min(1)]]
    });
  }

  checkInventory(): void {
    this.isLoading = true;
    this.inventoryService.getLowStockAlerts().subscribe({
      next: (data) => {
        this.lowStockItems = Array.isArray(data) ? data : [];
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.errorMessage = 'Failed to load inventory';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  openRestock(item: InventoryPart): void {
    this.selectedPart = item;
    this.showRestock = true;
    this.restockForm.reset({ quantity: 10 });
  }

  submitRestock(): void {
    if (this.restockForm.invalid || !this.selectedPart || !this.selectedPart.id) return;

    this.isSubmitting = true;
    const { quantity } = this.restockForm.value;
    const newQuantity = this.selectedPart.stockQuantity + quantity;

    this.inventoryService.updatePart(this.selectedPart.id, {
      stockQuantity: newQuantity
    }).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.showRestock = false;
        this.selectedPart = null;
        this.dialogService.confirm({
          title: 'Success',
          message: 'Inventory updated.',
          confirmLabel: 'OK',
          cancelLabel: '',
          isDangerous: false
        }).subscribe();
        this.checkInventory();
      },
      error: () => {
        this.isSubmitting = false;
        this.dialogService.confirm({
          title: 'Error',
          message: 'Failed to update inventory.',
          confirmLabel: 'OK',
          cancelLabel: '',
          isDangerous: true
        }).subscribe();
      }
    });
  }
}
