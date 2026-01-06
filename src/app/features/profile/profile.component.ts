import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { UserService } from '../../core/services/user-service';

@Component({
    selector: 'app-profile',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './profile.component.html',
    styles: [`
    .profile-container { max-width: 800px; margin: 0 auto; padding: 1rem; }
    .profile-card { background: white; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); overflow: hidden; }
    .profile-header { background: #f8f9fa; padding: 1rem; text-align: center; border-bottom: 1px solid #eee; }
    .profile-avatar { width: 100px; height: 100px; margin: 0 auto 1rem; color: #4a5568; }
    .profile-role { display: inline-block; padding: 0.25rem 0.75rem; background: #e2e8f0; border-radius: 20px; font-size: 0.875rem; color: #4a5568; font-weight: 500; }
    .profile-body { padding: 1rem; }
    .nav-tabs { border-bottom: 2px solid #edf2f7; margin-bottom: 2rem; display: flex; gap: 2rem; }
    .nav-item { cursor: pointer; padding-bottom: 0.75rem; color: #718096; font-weight: 500; border-bottom: 2px solid transparent; transition: all 0.2s; }
    .nav-item.active { color: #3182ce; border-bottom-color: #3182ce; }
    .form-group { margin-bottom: 1.5rem; }
    .form-label { display: block; margin-bottom: 0.5rem; color: #4a5568; font-weight: 500; }
    .form-control { width: 100%; padding: 0.6rem; border: 1px solid #e2e8f0; border-radius: 6px; transition: border-color 0.2s; }
    .form-control:focus { outline: none; border-color: #3182ce; ring: 2px solid #ebf8ff; }
    .btn-action { width: 100%; padding: 0.6rem; background: #3182ce; color: white; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; transition: background 0.2s; }
    .btn-action:hover { background: #2c5282; }
    .message { padding: 1rem; border-radius: 6px; margin-bottom: 1rem; }
    .success { background: #f0fff4; color: #276749; }
    .error { background: #fff5f5; color: #c53030; }
  `]
})
export class ProfileComponent implements OnInit {
    activeTab: 'EDIT' | 'PASSWORD' = 'EDIT';
    user: any = null;
    editForm: FormGroup;
    passwordForm: FormGroup;
    message: string = '';
    messageType: 'success' | 'error' = 'success';
    isLoading: boolean = false;

    constructor(
        private userService: UserService,
        private fb: FormBuilder
    ) {
        this.editForm = this.fb.group({
            username: ['', Validators.required],
            email: ['', [Validators.required, Validators.email]]
        });

        this.passwordForm = this.fb.group({
            oldPassword: ['', Validators.required],
            newPassword: ['', [Validators.required, Validators.minLength(6)]],
            confirmPassword: ['', Validators.required]
        });
    }

    ngOnInit(): void {
        this.loadProfile();
    }

    loadProfile(): void {
        this.userService.getMyProfile().subscribe({
            next: (data: any) => {
                this.user = data;
                this.editForm.patchValue({
                    username: data.username,
                    email: data.email
                });
            },
            error: (err: any) => console.error('Failed to load profile', err)
        });
    }

    switchTab(tab: 'EDIT' | 'PASSWORD'): void {
        this.activeTab = tab;
        this.message = '';
        if (tab === 'EDIT' && this.user) {
            this.editForm.patchValue({ username: this.user.username, email: this.user.email });
        }
        if (tab === 'PASSWORD') {
            this.passwordForm.reset();
        }
    }

    onUpdateProfile(): void {
        if (this.editForm.invalid) return;
        this.isLoading = true;
        this.message = '';

        this.userService.updateProfile(this.editForm.value).subscribe({
            next: () => {
                this.message = 'Profile updated successfully';
                this.messageType = 'success';
                this.isLoading = false;
                this.loadProfile();
            },
            error: (err: any) => {
                this.message = err.error?.message || 'Failed to update profile';
                this.messageType = 'error';
                this.isLoading = false;
            }
        });
    }

    onChangePassword(): void {
        if (this.passwordForm.invalid) return;

        const { oldPassword, newPassword, confirmPassword } = this.passwordForm.value;
        if (newPassword !== confirmPassword) {
            this.message = 'New passwords do not match';
            this.messageType = 'error';
            return;
        }

        this.isLoading = true;
        this.message = '';

        this.userService.changePassword({ oldPassword, newPassword }).subscribe({
            next: () => {
                this.message = 'Password changed successfully';
                this.messageType = 'success';
                this.isLoading = false;
                this.passwordForm.reset();
            },
            error: (err: any) => {
                this.message = err.error?.message || 'Failed to change password';
                this.messageType = 'error';
                this.isLoading = false;
            }
        });
    }
}
