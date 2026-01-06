import { Routes } from '@angular/router';
import { Home } from './features/public/home/home';
import { Login } from './features/auth/login/login';
import { Register } from './features/auth/register/register';
import { NoAuthGuard } from './core/guards/no-auth.guard';
import { AuthGuard } from './core/guards/auth.guard';

import { PublicLayout } from './shared/layouts/public-layout/public-layout';
import { DashboardLayout } from './shared/layouts/dashboard-layout/dashboard-layout';

export const routes: Routes = [
  {
    path: '',
    component: PublicLayout,
    children: [
      { path: '', redirectTo: 'home', pathMatch: 'full' },
      { path: 'home', component: Home },
      { path: 'login', component: Login, canActivate: [NoAuthGuard] },
      { path: 'register', component: Register, canActivate: [NoAuthGuard] },
      { path: 'activate', loadComponent: () => import('./features/auth/activate/activate').then(m => m.ActivateAccountComponent) }
    ]
  },

  // Authenticated User Dashboard (General)
  {
    path: '',
    component: DashboardLayout,
    canActivate: [AuthGuard],
    children: [
      { path: 'profile', loadComponent: () => import('./features/profile/profile.component').then(m => m.ProfileComponent) },
    ]
  },

  // Admin Dashboard
  {
    path: 'admin',
    component: DashboardLayout,
    children: [
      { path: '', redirectTo: 'reports', pathMatch: 'full' },
      { path: 'reports', loadComponent: () => import('./features/admin/admin-reports/admin-reports').then(m => m.AdminReports) },
      { path: 'users', loadComponent: () => import('./features/admin/admin-users/admin-users').then(m => m.AdminUsers) },
      { path: 'invites', loadComponent: () => import('./features/admin/admin-invites/admin-invites').then(m => m.AdminInvites) },
      { path: 'bays', loadComponent: () => import('./features/admin/admin-bays/admin-bays').then(m => m.AdminBays) },
      { path: 'inventory', loadComponent: () => import('./features/admin/admin-inventory/admin-inventory').then(m => m.AdminInventory) }
    ]
  },

  // Customer Dashboard
  {
    path: 'customer',
    component: DashboardLayout,
    children: [
      { path: '', redirectTo: 'vehicles', pathMatch: 'full' },
      { path: 'dashboard', redirectTo: 'vehicles', pathMatch: 'full' },
      { path: 'vehicles', loadComponent: () => import('./features/customer/vehicles/vehicles').then(m => m.Vehicles) },
      { path: 'requests', loadComponent: () => import('./features/customer/requests/requests').then(m => m.Requests) },
      { path: 'requests/:id', loadComponent: () => import('./features/customer/request-detail/customer-request-detail').then(m => m.CustomerRequestDetailComponent) },
      { path: 'invoices', loadComponent: () => import('./features/customer/invoices/invoices').then(m => m.Invoices) },
      { path: 'book-service/:vehicleId', loadComponent: () => import('./features/customer/book-service/book-service').then(m => m.BookService) }
    ]
  },

  // Manager Dashboard
  {
    path: 'manager',
    component: DashboardLayout,
    children: [
      { path: '', redirectTo: 'requests', pathMatch: 'full' },
      { path: 'requests', loadComponent: () => import('./features/manager/requests/requests').then(m => m.Requests) },
      { path: 'requests/:id', loadComponent: () => import('./features/manager/request-detail/request-detail').then(m => m.ManagerRequestDetail) },
      { path: 'inventory-usage', loadComponent: () => import('./features/manager/inventory-usage/inventory-usage').then(m => m.InventoryUsage) },

      { path: 'dashboard', redirectTo: 'requests', pathMatch: 'full' }
    ]
  },

  // Technician Dashboard
  {
    path: 'technician',
    component: DashboardLayout,
    children: [
      { path: '', redirectTo: 'jobs', pathMatch: 'full' },
      { path: 'dashboard', redirectTo: 'jobs', pathMatch: 'full' },
      { path: 'jobs', loadComponent: () => import('./features/technician/assigned-jobs/assigned-jobs').then(m => m.AssignedJobs) },
      { path: 'parts', loadComponent: () => import('./features/technician/my-part-requests/my-part-requests').then(m => m.MyPartRequests) }
    ]
  },
];
