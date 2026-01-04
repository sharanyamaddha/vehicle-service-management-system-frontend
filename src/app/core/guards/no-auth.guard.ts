import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { Auth } from '../services/auth';

export const NoAuthGuard: CanActivateFn = (route, state) => {
    const auth = inject(Auth);
    const router = inject(Router);

    if (auth.isAuthenticated()) {
        // If user is logged in, redirect them away from login/register pages.
        // We can redirect to home or dashboard.
        // Based on user request "once admin login or any user logs in again they shouldn't go back",
        // getting them to dashboard is safer.

        const role = auth.getRole();
        if (role === 'ADMIN') router.navigate(['/admin']);
        else if (role === 'TECHNICIAN') router.navigate(['/technician/dashboard']);
        else if (role === 'MANAGER') router.navigate(['/manager/dashboard']);
        else if (role === 'CUSTOMER') router.navigate(['/customer/dashboard']);
        else router.navigate(['/home']);

        return false;
    }

    return true;
};
