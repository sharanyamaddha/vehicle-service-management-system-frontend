import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InventoryService, InventoryPart } from '../../../core/services/inventory';

@Component({
  selector: 'app-low-stock-alerts',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './low-stock-alerts.html',
  styleUrl: './low-stock-alerts.css',
})
export class LowStockAlerts implements OnInit {
  lowStockParts: InventoryPart[] = [];
  isLoading = true;
  showModal = false;

  selectedPart: InventoryPart | null = null;
  requestQty: number = 10;
  reason: string = 'Low stock auto-alert';
  managerId: string = '';

  constructor(private inventoryService: InventoryService) {
    this.managerId = sessionStorage.getItem('userId') || '';
  }

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading = true;
    this.inventoryService.getLowStockAlerts().subscribe({
      next: (data: InventoryPart[]) => {
        this.lowStockParts = data;
        this.isLoading = false;
      },
      error: (err: any) => {
        console.error(err);
        this.isLoading = false;
      }
    });
  }

  openRestockModal(part: InventoryPart): void {
    this.selectedPart = part;
    this.requestQty = part.reorderLevel * 2;
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.selectedPart = null;
  }

  submitRestock(): void {
    if (!this.selectedPart) return;

    const payload = {
      partId: this.selectedPart.id,
      quantity: this.requestQty,
      managerId: this.managerId,
      reason: this.reason
    };

    this.inventoryService.requestRestock(payload).subscribe({
      next: () => {
        alert('Restock requested successfully.');
        this.closeModal();
      },
      error: (err: any) => alert('Error: ' + (err.error?.message || err.message))
    });
  }
}
