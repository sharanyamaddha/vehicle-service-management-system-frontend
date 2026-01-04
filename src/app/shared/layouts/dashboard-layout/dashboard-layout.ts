import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';

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

  constructor(private router: Router) {
    this.role = sessionStorage.getItem('role') || '';
    this.username = sessionStorage.getItem('username') || 'User';
  }

  logout(): void {
    sessionStorage.clear();
    this.router.navigate(['/home']);
  }
}
