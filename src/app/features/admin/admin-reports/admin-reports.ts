import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserService } from '../../../core/services/user-service';
import { ServiceBayService } from '../../../core/services/service-bay';
import { InventoryService } from '../../../core/services/inventory';

@Component({
  selector: 'app-admin-reports',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-reports.html',
  styleUrl: './admin-reports.css',
})
export class AdminReports implements OnInit {
  totalUsers: number = 0;
  totalBays: number = 0;
  totalLowStock: number = 0;

  constructor(
    private userService: UserService,
    private bayService: ServiceBayService,
    private inventoryService: InventoryService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.loadStats();
  }

  loadStats(): void {
    this.userService.getAllUsers().subscribe(users => {
      this.totalUsers = Array.isArray(users) ? users.length : 0;
      this.cdr.detectChanges();
    });

    this.bayService.getAllBays().subscribe(bays => {
      this.totalBays = Array.isArray(bays) ? bays.filter(b => b.active).length : 0;
      this.cdr.detectChanges();
    });

    this.inventoryService.getLowStockAlerts().subscribe(parts => {
      this.totalLowStock = Array.isArray(parts) ? parts.length : 0;
      this.cdr.detectChanges();
    });
  }
}
