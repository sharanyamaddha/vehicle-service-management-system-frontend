import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { Auth } from '../../../core/services/auth';

@Component({
    selector: 'app-activate',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterModule],
    templateUrl: './activate.html',
    styleUrls: ['./activate.css']
})
export class ActivateAccountComponent implements OnInit {
    activateForm: FormGroup;
    token: string | null = null;
    error: string = '';
    success: string = '';
    isLoading = false;

    constructor(
        private fb: FormBuilder,
        private route: ActivatedRoute,
        private router: Router,
        private auth: Auth
    ) {
        this.activateForm = this.fb.group({
            password: ['', [Validators.required, Validators.minLength(6)]],
            confirmPassword: ['', [Validators.required]]
        });
    }

    ngOnInit() {
        this.token = this.route.snapshot.queryParamMap.get('token');
        if (!this.token) {
            this.error = 'Invalid invitation link.';
        }
    }

    onSubmit() {
        if (this.activateForm.invalid || !this.token) return;

        if (this.activateForm.value.password !== this.activateForm.value.confirmPassword) {
            this.error = 'Passwords do not match';
            return;
        }

        this.isLoading = true;
        this.error = '';

        this.auth.activateAccount(this.token, this.activateForm.value.password)
            .subscribe({
                next: () => {
                    this.isLoading = false;
                    this.success = 'Account activated successfully. Please login to continue.';
                    setTimeout(() => this.router.navigate(['/login']), 2000);
                },
                error: (err) => {
                    this.error = err.message || 'Activation failed. Token might be expired.';
                    this.isLoading = false;
                }
            });
    }
}
