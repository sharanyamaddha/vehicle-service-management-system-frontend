import { Routes } from '@angular/router';
import { Home } from './features/public/home/home';
import { Login } from './features/auth/login/login';
import { Register } from './features/auth/register/register';
import { AdminDashboard } from './features/admin/admin-dashboard/admin-dashboard';
import { NoAuthGuard } from './core/guards/no-auth.guard';
import { CustomerDashboard } from './features/customer/customer-dashboard/customer-dashboard';
import { ManagerDashboard } from './features/manager/manager-dashboard/manager-dashboard';
import { TechnicianDashboard } from './features/technician/technician-dashboard/technician-dashboard';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'home', component: Home },
  { path: 'login', component: Login, canActivate: [NoAuthGuard] },
  { path: 'register', component: Register, canActivate: [NoAuthGuard] },
  {path: 'admin',children: [{ path: 'dashboard', component: AdminDashboard }]},
  {path: 'customer',children: [{ path: 'dashboard', component: CustomerDashboard }]},
  {path: 'manager',children:[{path:'dashboard',component:ManagerDashboard}]},
  {path: 'technician',children:[{path:'dashboard',component:TechnicianDashboard}]},


];
