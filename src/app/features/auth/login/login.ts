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
    private fb: FormBuilder,
    private authService: Auth,
    private router: Router,
    private http: HttpBase
  ) { }

  ngOnInit(): void {
    // Auto-redirect removed as per user request
    this.initializeForm();
  }

  initializeForm(): void {
    this.loginForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.errorMessage = 'Please provide both username and password.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const loginData: LoginRequest = this.loginForm.value;

    this.authService.login(loginData).subscribe({
      next: (response: any) => {
        // Save token and userId temporarily to sessionStorage (required for HttpBase)
        sessionStorage.setItem('token', response.token);
        sessionStorage.setItem('userId', response.userId);

        // Fetch user profile to get the role
        this.http.get('/api/users/me').subscribe({
          next: (userProfile: any) => {
            this.isLoading = false;
            // Save session with role from user profile
            this.authService.saveSession(response, userProfile.role);
            this.navigateByRole();
          },
          error: (error) => {
            this.isLoading = false;
            // If we can't fetch profile, still proceed but default to CUSTOMER
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
