import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { UserService } from '../../../core/services/user-service';
import { InventoryService } from '../../../core/services/inventory';

@Component({
  selector: 'app-dashboard-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard-layout.html',
  styleUrl: './dashboard-layout.css',
})
export class DashboardLayout {
  showProfileMenu: boolean = false;
  role: string = '';
  username: string = '';

  lowStockCount: number = 0;
  isSidebarOpen: boolean = false;


  constructor(
    public router: Router,
    private userService: UserService,
    private inventoryService: InventoryService
  ) {
    this.role = sessionStorage.getItem('role') || '';
    this.username = sessionStorage.getItem('username') || 'User';
  }

  ngOnInit(): void {
    if (!this.username || this.username === 'User') {
      this.userService.getMyProfile().subscribe({
        next: (profile: any) => {
          if (profile && profile.username) {
            this.username = profile.username;
            sessionStorage.setItem('username', profile.username);
          }
        },
        error: (err: any) => {
          console.error('Failed to fetch profile for dashboard title', err);
        }
      });
    }

    if (this.role === 'MANAGER') {
      this.inventoryService.getLowStockAlerts().subscribe({
        next: (parts) => {
          this.lowStockCount = parts.length;
        }
      });
    }
  }

  logout(): void {
    sessionStorage.clear();
    this.router.navigate(['/home']);
  }

  toggleSidebar(): void {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  closeSidebar(): void {
    this.isSidebarOpen = false;
  }

  getRoleDisplay(): string {
    switch (this.role) {
      case 'ADMIN': return 'Admin Dashboard';
      case 'MANAGER': return 'Manager Dashboard';
      case 'TECHNICIAN': return 'Technician Dashboard';
      case 'CUSTOMER': return 'Customer Dashboard';
      default: return 'User Dashboard';
    }
  }

  shouldShowBackButton(): boolean {
    const url = this.router.url;
    // Don't show on root dashboard pages or profile
    if (url.endsWith('/profile')) return true;

    // Define root paths for each role
    const roots = [
      '/admin/users', // Default admin landing? (Actually admin might land elsewhere, but let's say if deep inside)
      '/manager/requests',
      '/technician/jobs',
      '/customer/vehicles'
    ];

    // If current URL is NOT one of the main roots, show back button
    // But this is tricky. Simple check: if segment count > 3? 
    // e.g. /manager/requests (2 segments) -> Root. /manager/requests/123 (3 segments) -> Back.
    const segments = url.split('/').filter(x => x);
    return segments.length > 2 || url.includes('profile');
  }

  goBack(): void {
    switch (this.role) {
      case 'ADMIN': this.router.navigate(['/admin/users']); break;
      case 'MANAGER': this.router.navigate(['/manager/requests']); break;
      case 'TECHNICIAN': this.router.navigate(['/technician/jobs']); break;
      case 'CUSTOMER': this.router.navigate(['/customer/vehicles']); break;
      default: this.router.navigate(['/home']);
    }
  }
}
