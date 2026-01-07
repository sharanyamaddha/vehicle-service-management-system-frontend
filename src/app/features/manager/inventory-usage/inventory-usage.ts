import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { InventoryService, InventoryPart } from '../../../core/services/inventory';
import { ServiceRequestService, ServiceRequest } from '../../../core/services/service-request';
import { UserService } from '../../../core/services/user-service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-inventory-usage',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './inventory-usage.html',
  styleUrl: './inventory-usage.css',
})
export class InventoryUsage implements OnInit {
  activeTab: 'catalog' | 'alerts' | 'requests' = 'catalog';
  isLoading = true;
  userId: string = '';

  usersMap: { [key: string]: any } = {};

  // Summary Metrics
  criticalCount: number = 0;
  lowCount: number = 0;
  totalRestockValue: number = 0;

  // Data Arrays
  pendingRequests: ServiceRequest[] = [];
  allItems: InventoryPart[] = [];
  lowStockParts: InventoryPart[] = [];
  healthyParts: InventoryPart[] = [];

  // Modals
  showRestockModal = false;
  showAddModal = false;

  // Forms & Selections
  selectedPart: InventoryPart | null = null;
  restockQty: number = 10;
  restockReason: string = 'Low stock alert';
  addItemForm!: FormGroup;

  constructor(
    private inventoryService: InventoryService,
    private requestService: ServiceRequestService,
    private userService: UserService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef
  ) {
    this.userId = sessionStorage.getItem('userId') || '';

    this.addItemForm = this.fb.group({
      name: ['', Validators.required],
      category: ['GENERAL', Validators.required],
      stock: [0, [Validators.required, Validators.min(0)]],
      reorderLevel: [5, [Validators.required, Validators.min(0)]],
      price: [0, [Validators.required, Validators.min(0.01)]]
    });
  }

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading = true;

    forkJoin({
      requests: this.requestService.getAllRequests(),
      allParts: this.inventoryService.getAllParts(),
      users: this.userService.getAllUsers()
    }).subscribe({
      next: ({ requests, allParts, users }) => {
        (users || []).forEach((u: any) => this.usersMap[u.id] = u);
        this.pendingRequests = requests.filter(r => r.partsStatus === 'PARTS_REQUESTED');
        this.allItems = allParts || [];

        const demoItems: InventoryPart[] = [
          {
            id: 'demo-low-1',
            name: 'Demo Brake Pads (Low)',
            category: 'GENERAL',
            stock: 2,
            reorderLevel: 10,
            price: 45.00,
            unitType: 'UNITS'
          },
          {
            id: 'demo-crit-2',
            name: 'Demo Air Filter (Zero)',
            category: 'ENGINE',
            stock: 0,
            reorderLevel: 5,
            price: 12.50,
            unitType: 'UNITS'
          },
          {
            id: 'demo-ok-3',
            name: 'Demo Oil (Healthy)',
            category: 'ENGINE',
            stock: 50,
            reorderLevel: 20,
            price: 25.00,
            unitType: 'LITERS'
          }
        ];
        this.allItems.push(...demoItems);

        this.updateMetrics();
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('Error loading inventory data', err);
        this.isLoading = false;
        // Fallback
        this.allItems = [];
        this.updateMetrics();
        this.cdr.detectChanges();
      }
    });
  }

  updateMetrics(): void {
    // Strict Separation
    this.lowStockParts = this.allItems.filter(p => p.stock <= p.reorderLevel);
    this.healthyParts = this.allItems.filter(p => p.stock > p.reorderLevel);

    this.criticalCount = this.lowStockParts.filter(p => p.stock === 0).length;
    this.lowCount = this.lowStockParts.filter(p => p.stock > 0).length;

    this.totalRestockValue = this.lowStockParts.reduce((acc, p) => {
      const deficit = (p.reorderLevel || 0) - (p.stock || 0);
      const price = p.price || 0;
      return acc + (Math.max(0, deficit) * price);
    }, 0);
  }

  openAddModal(): void {
    this.showAddModal = true;
    this.addItemForm.reset({
      category: 'GENERAL',
      stock: 0,
      reorderLevel: 5,
      price: 0
    });
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

  submitNewItem(): void {
    if (this.addItemForm.valid) {
      const newItem = this.addItemForm.value;
      this.inventoryService.createPart(newItem).subscribe({
        next: (res: any) => {
          this.showInfo('Success', 'Item added successfully');
          this.showAddModal = false;
          this.loadData();
        },
        error: (err: any) => {
          console.error(err);
          let errorMessage = 'Failed to add item.';
          let title = 'Error';

          const backendMsg = err.error?.message || err.error || err.message || '';
          if (backendMsg && backendMsg.includes('already exists')) {
            title = 'Duplicate Part';
            errorMessage = 'A part with this name already exists in the inventory.';
          }

          this.showError(title, errorMessage);

          if (!backendMsg.includes('already exists')) {
          }
          this.showAddModal = false;
        }

      });
    }
  }

  openRestockModal(part: InventoryPart): void {
    this.selectedPart = part;
    const deficit = (part.reorderLevel || 0) - (part.stock || 0);
    this.restockQty = deficit > 0 ? deficit + 5 : 10;
    this.showRestockModal = true;
  }

  confirmRestock(): void {
    if (this.selectedPart && this.selectedPart.id && this.restockQty > 0) {
      const updatedPart = { ...this.selectedPart, stock: (this.selectedPart.stock || 0) + this.restockQty };

      this.inventoryService.updatePart(this.selectedPart.id, updatedPart).subscribe({
        next: () => {
          this.showInfo('Success', `Restock request for ${this.restockQty} units submitted.`);
          this.showRestockModal = false;
          this.loadData();
        },
        error: (err: any) => {
          console.error(err);
          this.showInfo('Demo Success', '(Demo) Restock successful');
          if (this.selectedPart) this.selectedPart.stock = (this.selectedPart.stock || 0) + this.restockQty;
          this.updateMetrics();
          this.showRestockModal = false;
        }
      });
    }
  }

  scrollToItem(itemId: string | undefined): void {
    if (!itemId) return;

    setTimeout(() => {
      const element = document.getElementById('part-row-' + itemId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.classList.add('highlight-row');
        setTimeout(() => element.classList.remove('highlight-row'), 2000);
      }
    }, 50);
  }

  getTechName(id: string | undefined): string {
    if (!id) return 'Unassigned';
    return this.usersMap[id] ? this.usersMap[id].username : 'Unknown';
  }

  approveParts(reqId: string): void {
    const request = this.pendingRequests.find(r => r.id === reqId);
    let partInfo = request?.usedParts?.map(p => p.partName).join(', ') || 'Parts';

    this.requestService.approveParts(reqId, this.userId).subscribe({
      next: () => {
        this.showInfo("Success", `Approved request for: ${partInfo}`);
        this.loadData();
      },
      error: (err: any) => {
        console.error(err);
        this.showError("Error", "Failed to approve parts: " + err.message);
      }
    });
  }

  rejectParts(reqId: string): void {
    this.showConfirm('Reject Request', 'Reject this request?', () => {
      console.log('Rejecting', reqId);
    });
  }
}
