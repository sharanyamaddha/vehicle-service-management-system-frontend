import { Routes } from '@angular/router';
import { Home } from './features/public/home/home';
import { Login } from './features/auth/login/login';
import { Register } from './features/auth/register/register';
import { NoAuthGuard } from './core/guards/no-auth.guard';
import { ManagerDashboard } from './features/manager/manager-dashboard/manager-dashboard';
import { TechnicianDashboard } from './features/technician/technician-dashboard/technician-dashboard';
import { PublicLayout } from './shared/layouts/public-layout/public-layout';
import { DashboardLayout } from './shared/layouts/dashboard-layout/dashboard-layout';

export const routes: Routes = [
  // Public Routes (Wrapped in PublicLayout with Navbar)
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

  // Admin Dashboard (Route-based)
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

  // Other Dashboards (Placeholder, can be updated to use DashboardLayout later)
  // Customer Dashboard
  {
    path: 'customer',
    component: DashboardLayout,
    children: [
      { path: '', redirectTo: 'vehicles', pathMatch: 'full' },
      { path: 'dashboard', redirectTo: 'vehicles', pathMatch: 'full' }, // Redirect legacy
      { path: 'vehicles', loadComponent: () => import('./features/customer/vehicles/vehicles').then(m => m.Vehicles) },
      { path: 'requests', loadComponent: () => import('./features/customer/requests/requests').then(m => m.Requests) },
      { path: 'invoices', loadComponent: () => import('./features/customer/invoices/invoices').then(m => m.Invoices) },
      { path: 'book-service/:vehicleId', loadComponent: () => import('./features/customer/book-service/book-service').then(m => m.BookService) }
    ]
  },
  { path: 'manager', children: [{ path: 'dashboard', component: ManagerDashboard }] },
  { path: 'technician', children: [{ path: 'dashboard', component: TechnicianDashboard }] },
];
