import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Auth, LoginRequest } from '../../../core/services/auth';
import { HttpBase } from '../../../core/http-base';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login implements OnInit {
  loginForm!: FormGroup;
  isLoading = false;
  errorMessage = '';

  constructor(
    private readonly fb: FormBuilder,
    private readonly authService: Auth,
    private readonly router: Router,
    private readonly http: HttpBase
  ) { }

  ngOnInit(): void {
    this.initializeForm();
  }

  initializeForm(): void {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.errorMessage = 'Please provide a valid email and password.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const loginData: LoginRequest = {
      email: this.loginForm.get('email')?.value,
      password: this.loginForm.get('password')?.value
    };

    this.authService.login(loginData).subscribe({
      next: (response: any) => {
        sessionStorage.setItem('token', response.token);
        sessionStorage.setItem('userId', response.userId);

        this.http.get('/api/users/me').subscribe({
          next: (userProfile: any) => {
            this.isLoading = false;
            this.isLoading = false;
            this.authService.saveSession(response, userProfile.role);
            sessionStorage.setItem('username', userProfile.username);
            this.navigateByRole();
          },
          error: (error) => {
            this.isLoading = false;
            this.isLoading = false;
            this.authService.saveSession(response, 'CUSTOMER');
            this.navigateByRole();
          },
        });
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage =
          error?.error?.message || 'Invalid username or password';
      },
    });
  }

  private navigateByRole(): void {
    const role = this.authService.getRole();

    switch (role?.toUpperCase()) {
      case 'ADMIN':
        this.router.navigate(['/admin']);
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
        this.router.navigate(['/customer/dashboard']);
    }
  }
}
