import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { Auth } from '../../core/services/auth';

@Component({
    selector: 'app-navbar',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './navbar.html',
    styleUrl: './navbar.css',
})
export class Navbar {

    constructor(public auth: Auth, private router: Router) { }

    isAuthenticated(): boolean {
        return this.auth.isAuthenticated();
    }

    getUsername(): string {
        // Assuming backend might send username in future, or we parse from token.
        // For now, returning a static placeholder or checking local storage if available
        return 'User';
    }

    logout(): void {
        localStorage.clear();
        this.router.navigate(['/home']);
    }

    toDashboard(): void {
        const role = this.auth.getRole();
        if (!role) {
            this.router.navigate(['/']);
            return;
        }

        switch (role.toUpperCase()) {
            case 'ADMIN':
                this.router.navigate(['/admin/dashboard']);
                break;
            case 'TECHNICIAN':
                this.router.navigate(['/technician/dashboard']);
                break;
            case 'MANAGER':
                this.router.navigate(['/manager/dashboard']);
                break;
            case 'CUSTOMER':
                this.router.navigate(['/customer/dashboard']);
                break;
            default:
                this.router.navigate(['/']);
        }
    }
}
