import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Auth, RegisterRequest } from '../../../core/services/auth';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterModule],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register implements OnInit {
  registerForm!: FormGroup;
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private readonly fb: FormBuilder,
    private readonly authService: Auth,
    private readonly router: Router
  ) { }

  ngOnInit(): void {
    // Redirect if already logged in
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/customer/dashboard']);
    }
    this.initializeForm();
  }

  initializeForm(): void {
    this.registerForm = this.fb.nonNullable.group(
      {
        username: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(100)]],
        confirmPassword: ['', [Validators.required]],
      },
      { validators: this.passwordMatchValidator }
    );
  }

  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const group = control as FormGroup;
    const password = group.get('password');
    const confirmPassword = group.get('confirmPassword');

    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }

    if (confirmPassword?.errors?.['passwordMismatch']) {
      confirmPassword.updateValueAndValidity({ emitEvent: false });
    }

    return null;
  }

  onSubmit(): void {
    if (this.registerForm.invalid) {
      this.errorMessage = 'Please fix the errors above.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const registerData: RegisterRequest = {
      username: this.registerForm.get('username')?.value,
      email: this.registerForm.get('email')?.value,
      password: this.registerForm.get('password')?.value,
      role: 'CUSTOMER', // Only customers can self-register
    };

    this.authService.register(registerData).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.successMessage = 'Account created successfully! Redirecting to login...';
        this.registerForm.reset();

        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 2000);
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage =
          error?.error?.message || error?.error || 'Registration failed. Please try again.';
      },
    });
  }

  getPasswordStrength(): string {
    const password = this.registerForm.get('password')?.value;
    if (!password || password.length < 6) return 'weak';

    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password);

    const strength = [hasUpperCase, hasLowerCase, hasNumber, hasSpecialChar].filter(Boolean).length;

    if (strength <= 1) return 'weak';
    if (strength <= 2) return 'fair';
    return 'strong';
  }
}
