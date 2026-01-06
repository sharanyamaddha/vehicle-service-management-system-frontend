import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InventoryService, InventoryPart } from '../../../core/services/inventory';

@Component({
  selector: 'app-admin-inventory',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-inventory.html',
  styleUrl: './admin-inventory.css',
})
export class AdminInventory implements OnInit {
  allItems: InventoryPart[] = [];
  isLoading: boolean = false;

  constructor(
    private inventoryService: InventoryService
  ) { }

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading = true;

    this.inventoryService.getAllParts().subscribe({
      next: (data: InventoryPart[]) => {
        this.allItems = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error(err);
        this.isLoading = false;
      }
    });
  }
}
