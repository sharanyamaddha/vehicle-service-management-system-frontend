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

  constructor(private router: Router) { }

  logout(): void {
    sessionStorage.clear();
    this.router.navigate(['/home']);
  }
}
